# /attachments/app/routes/users.py
from fastapi import APIRouter, HTTPException, Query, Request
from typing import List, Optional
from uuid import uuid4
from app.core.supabase_storage import load_users, save_user, delete_user as supabase_delete_user
from app.core.schemas import UserCreate, UserUpdate, UserOut
from app.core.rbac import can_view_user, can_edit_user

router = APIRouter(prefix="/api/users", tags=["users"])

def _all_users() -> list[dict]:
    # Carrega usuários do Supabase
    return load_users()

def _exists_username(username: str, *, skip_id: str | None = None) -> bool:
    """Verifica se username já existe no Supabase"""
    users = _all_users()
    u_lower = username.lower()
    for u in users:
        if skip_id and u.get("id") == skip_id:
            continue
        if u.get("username","").lower() == u_lower:
            return True
    return False

def _actor_from_headers(req: Request, users: list[dict]) -> dict:
    rid = req.headers.get("x-user-id")
    rrole = req.headers.get("x-role")
    if rid:
        for u in users:
            if u["id"] == rid:
                return u
    return {"id":"anon","role": (rrole or "Auxiliar"), "plantIds": []}

@router.get("", response_model=List[UserOut])
def list_users(request: Request):
    users = _all_users()
    actor = _actor_from_headers(request, users)
    # Filtra usuários baseado em permissões RBAC
    filtered = [u for u in users if can_view_user(actor, u)]
    return filtered
    
    
@router.post("", response_model=UserOut, status_code=201)
def create_user(request: Request, payload: UserCreate):
    try:
        users = _all_users()
        actor = _actor_from_headers(request, users)
        
        # ✅ LOG para debug
        print(f"📥 CREATE USER - Payload recebido: {payload.dict()}")
        
        # ✅ Usa plantIds do payload diretamente (sempre será uma lista devido ao default_factory)
        plant_ids = payload.plantIds or []
        
        dummy = {**payload.dict(), "id":"new", "plantIds": plant_ids}
        if not can_edit_user(actor, dummy):
            raise HTTPException(403, "forbidden")
        
        if _exists_username(payload.username):
            raise HTTPException(status_code=409, detail="username already exists")
        
        # ✅ Normalize supervisorId: "" → None
        supervisor_id = payload.supervisorId
        if not supervisor_id or (isinstance(supervisor_id, str) and supervisor_id.strip() == ""):
            supervisor_id = None
        
        # ✅ Normalize phone: string vazia → None
        phone = payload.phone
        if phone and isinstance(phone, str) and phone.strip() == "":
            phone = None
        
        # ✅ Normalize email: string vazia → None
        email = payload.email
        if email and isinstance(email, str) and email.strip() == "":
            email = None
        
        new_user = {
            "name": payload.name,
            "username": payload.username,
            "email": email,
            "password": payload.password,
            "phone": phone,
            "role": payload.role,
            "can_login": True,
            "supervisorId": supervisor_id,  # save_user converte para supervisor_id
            "plantIds": plant_ids,  # save_user salva nas atribuições
        }
        
        print(f"✅ CREATE USER - Novo usuário criado: {new_user}")
        
        # Salva no Supabase (save_user faz a conversão camelCase -> snake_case)
        saved_user = save_user(new_user)
        print(f"✅ CREATE USER - Usuário salvo no Supabase: {saved_user.get('id')}")
        
        # Recarrega o usuário para ter plantIds atualizado
        users = _all_users()
        result = next((u for u in users if u["id"] == saved_user["id"]), None)
        
        if not result:
            # Fallback se não encontrar
            result = {
                "id": saved_user["id"],
                "name": saved_user["name"],
                "username": saved_user["username"],
                "email": saved_user.get("email"),
                "phone": saved_user.get("phone"),
                "role": saved_user["role"],
                "can_login": saved_user.get("can_login", True),
                "supervisorId": saved_user.get("supervisor_id"),
                "plantIds": plant_ids,
            }
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ ERRO ao criar usuário: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Erro interno ao criar usuário: {str(e)}")




@router.put("/{user_id}", response_model=UserOut)
def update_user(user_id: str, payload: UserUpdate, request: Request):
    users = _all_users()
    actor = _actor_from_headers(request, users)
    
    current_user = next((u for u in users if u["id"] == user_id), None)
    if not current_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    actor_id = actor.get("id")
    if actor_id and actor_id == user_id:
        pass
    elif not can_edit_user(actor, current_user):
        raise HTTPException(status_code=403, detail="forbidden")
    
    update_data = payload.dict(exclude_unset=True)
    
    # ✅ Normalize supervisorId aqui também
    if "supervisorId" in update_data:
        supervisor_id = update_data.get("supervisorId")
        if not supervisor_id or (isinstance(supervisor_id, str) and supervisor_id.strip() == ""):
            update_data["supervisorId"] = None
    
    if "username" in update_data and update_data["username"] != current_user.get("username"):
        if _exists_username(update_data["username"], skip_id=user_id):
            raise HTTPException(status_code=409, detail="username already exists")
    
    # Atualiza no Supabase (save_user faz a conversão camelCase -> snake_case)
    updated_user = {**current_user, **update_data}
    saved = save_user(updated_user)
    
    # Recarrega o usuário para ter plantIds atualizado
    users = _all_users()
    result = next((u for u in users if u["id"] == saved["id"]), None)
    
    if not result:
        # Fallback se não encontrar
        result = {
            "id": saved["id"],
            "name": saved["name"],
            "username": saved["username"],
            "email": saved.get("email"),
            "phone": saved.get("phone"),
            "role": saved["role"],
            "can_login": saved.get("can_login", True),
            "supervisorId": saved.get("supervisor_id"),
            "plantIds": update_data.get("plantIds", current_user.get("plantIds", [])),
        }
    
    return result



@router.delete("/{user_id}")
def delete_user(user_id: str):
    users = _all_users()
    user_exists = any(u["id"] == user_id for u in users)
    if not user_exists:
        raise HTTPException(status_code=404, detail="User not found")
    
    if supabase_delete_user(user_id):
        return {"detail": "deleted"}
    else:
        raise HTTPException(status_code=500, detail="Failed to delete user")