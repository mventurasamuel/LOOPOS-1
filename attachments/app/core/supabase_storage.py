# /attachments/app/core/supabase_storage.py
# Funções de persistência usando Supabase (substitui storage.py baseado em JSON)

from typing import Any, List, Optional
from supabase import Client
from app.core.supabase_client import get_supabase
import uuid

def _get_client() -> Client:
    """Retorna o cliente Supabase"""
    return get_supabase()

# ==================== USERS ====================

def load_users() -> List[dict]:
    """Carrega todos os usuários do Supabase e adiciona plantIds baseado nas atribuições"""
    try:
        response = _get_client().table("users").select("*").execute()
        users = response.data if response.data else []
        
        # Carrega atribuições para preencher plantIds
        assignments_response = _get_client().table("plant_assignments").select("plant_id, user_id").execute()
        assignments = assignments_response.data if assignments_response.data else []
        
        # Agrupa plantIds por user_id
        user_plants = {}
        for a in assignments:
            user_id = a["user_id"]
            plant_id = a["plant_id"]
            if user_id not in user_plants:
                user_plants[user_id] = []
            user_plants[user_id].append(plant_id)
        
        # Converte para formato camelCase e adiciona plantIds
        result = []
        for user in users:
            user_id = user["id"]
            result.append({
                "id": user_id,
                "name": user["name"],
                "username": user["username"],
                "email": user.get("email"),
                "phone": user.get("phone"),
                "password": user.get("password"),  # Geralmente não retornado, mas mantido
                "role": user["role"],
                "can_login": user.get("can_login", True),
                "supervisorId": user.get("supervisor_id"),
                "plantIds": user_plants.get(user_id, []),
            })
        
        return result
    except Exception as e:
        print(f"⚠️ Erro ao carregar usuários: {e}")
        import traceback
        traceback.print_exc()
        return []

def save_user(user: dict) -> dict:
    """Salva ou atualiza um usuário no Supabase"""
    client = _get_client()
    user_id = user.get("id")
    plant_ids = user.get("plantIds", [])  # Guarda plantIds antes de converter
    
    # Converte camelCase para snake_case
    user_data = {}
    for key, value in user.items():
        if value is None or key == "plantIds":
            continue
        if key == "supervisorId":
            user_data["supervisor_id"] = value
        else:
            user_data[key] = value
    
    if user_id:
        # Atualiza usuário existente
        response = client.table("users").update(user_data).eq("id", user_id).execute()
        saved = response.data[0] if response.data else user
    else:
        # Cria novo usuário
        if "id" not in user_data:
            user_data["id"] = str(uuid.uuid4())
        response = client.table("users").insert(user_data).execute()
        saved = response.data[0] if response.data else user
        user_id = saved["id"]
    
    # Salva atribuições de plantas (plantIds)
    if plant_ids:
        # Remove atribuições antigas deste usuário
        client.table("plant_assignments").delete().eq("user_id", user_id).execute()
        
        # Insere novas atribuições
        assignments_data = []
        role = saved.get("role", "").upper()
        
        # Determina o role_type baseado no role do usuário
        if role == "COORDINATOR" or role == "ADMIN":
            role_type = "coordinator"
        elif role == "SUPERVISOR":
            role_type = "supervisor"
        elif role == "TECHNICIAN" or role == "TÉCNICO":
            role_type = "technician"
        elif role == "ASSISTANT" or role == "AUXILIAR":
            role_type = "assistant"
        else:
            role_type = None
        
        if role_type:
            for plant_id in plant_ids:
                assignments_data.append({
                    "plant_id": plant_id,
                    "user_id": user_id,
                    "role_type": role_type
                })
            
            if assignments_data:
                client.table("plant_assignments").insert(assignments_data).execute()
    
    return saved

def delete_user(user_id: str) -> bool:
    """Deleta um usuário do Supabase"""
    try:
        _get_client().table("users").delete().eq("id", user_id).execute()
        return True
    except Exception as e:
        print(f"⚠️ Erro ao deletar usuário: {e}")
        return False

# ==================== PLANTS ====================

def load_plants() -> List[dict]:
    """Carrega todas as usinas do Supabase"""
    try:
        response = _get_client().table("plants").select("*").execute()
        plants = response.data if response.data else []
        
        # Carrega sub-usinas e ativos para cada usina
        for plant in plants:
            plant_id = plant["id"]
            
            # Sub-usinas
            sub_response = _get_client().table("sub_plants").select("*").eq("plant_id", plant_id).order("sub_plant_number").execute()
            plant["subPlants"] = [
                {"id": sp["sub_plant_number"], "inverterCount": sp["inverter_count"]}
                for sp in (sub_response.data if sub_response.data else [])
            ]
            
            # Ativos
            assets_response = _get_client().table("plant_assets").select("asset_name").eq("plant_id", plant_id).execute()
            plant["assets"] = [a["asset_name"] for a in (assets_response.data if assets_response.data else [])]
            
            # Atribuições
            assignments_response = _get_client().table("plant_assignments").select("*").eq("plant_id", plant_id).execute()
            assignments = assignments_response.data if assignments_response.data else []
            
            plant["coordinatorId"] = next((a["user_id"] for a in assignments if a["role_type"] == "coordinator"), None)
            plant["supervisorIds"] = [a["user_id"] for a in assignments if a["role_type"] == "supervisor"]
            plant["technicianIds"] = [a["user_id"] for a in assignments if a["role_type"] == "technician"]
            plant["assistantIds"] = [a["user_id"] for a in assignments if a["role_type"] == "assistant"]
        
        return plants
    except Exception as e:
        print(f"⚠️ Erro ao carregar usinas: {e}")
        return []

def save_plant(plant: dict, assignments: Optional[dict] = None) -> dict:
    """Salva ou atualiza uma usina no Supabase"""
    client = _get_client()
    plant_id = plant.get("id")
    
    # Prepara dados da usina
    plant_data = {
        "client": plant["client"],
        "name": plant["name"],
        "string_count": plant.get("stringCount", 0),
        "tracker_count": plant.get("trackerCount", 0),
        "coordinator_id": plant.get("coordinatorId"),
    }
    
    if plant_id:
        # Atualiza usina existente
        client.table("plants").update(plant_data).eq("id", plant_id).execute()
        
        # Remove sub-usinas e ativos antigos
        client.table("sub_plants").delete().eq("plant_id", plant_id).execute()
        client.table("plant_assets").delete().eq("plant_id", plant_id).execute()
    else:
        # Cria nova usina
        plant_data["id"] = str(uuid.uuid4())
        response = client.table("plants").insert(plant_data).execute()
        plant_id = response.data[0]["id"] if response.data else str(uuid.uuid4())
    
    # Salva sub-usinas
    sub_plants = plant.get("subPlants", [])
    if sub_plants:
        sub_plants_data = [
            {
                "plant_id": plant_id,
                "sub_plant_number": sp["id"],
                "inverter_count": sp.get("inverterCount", 0)
            }
            for sp in sub_plants
        ]
        client.table("sub_plants").insert(sub_plants_data).execute()
    
    # Salva ativos
    assets = plant.get("assets", [])
    if assets:
        assets_data = [
            {"plant_id": plant_id, "asset_name": asset}
            for asset in assets
        ]
        client.table("plant_assets").insert(assets_data).execute()
    
    # Salva atribuições
    if assignments:
        # Remove atribuições antigas
        client.table("plant_assignments").delete().eq("plant_id", plant_id).execute()
        
        # Insere novas atribuições
        assignments_data = []
        
        if assignments.get("coordinatorId"):
            assignments_data.append({
                "plant_id": plant_id,
                "user_id": assignments["coordinatorId"],
                "role_type": "coordinator"
            })
        
        for user_id in assignments.get("supervisorIds", []):
            assignments_data.append({
                "plant_id": plant_id,
                "user_id": user_id,
                "role_type": "supervisor"
            })
        
        for user_id in assignments.get("technicianIds", []):
            assignments_data.append({
                "plant_id": plant_id,
                "user_id": user_id,
                "role_type": "technician"
            })
        
        for user_id in assignments.get("assistantIds", []):
            assignments_data.append({
                "plant_id": plant_id,
                "user_id": user_id,
                "role_type": "assistant"
            })
        
        if assignments_data:
            client.table("plant_assignments").insert(assignments_data).execute()
    
    # Retorna a usina completa
    return load_plants()[0] if load_plants() else plant

# ==================== OS ====================

def load_os() -> List[dict]:
    """Carrega todas as OSs do Supabase"""
    try:
        response = _get_client().table("os").select("*").order("created_at", desc=True).execute()
        os_list = response.data if response.data else []
        
        # Carrega dados relacionados para cada OS
        for os_item in os_list:
            os_id = os_item["id"]
            
            # Ativos
            assets_response = _get_client().table("os_assets").select("asset_name").eq("os_id", os_id).execute()
            os_item["assets"] = [a["asset_name"] for a in (assets_response.data if assets_response.data else [])]
            
            # Logs
            logs_response = _get_client().table("os_logs").select("*").eq("os_id", os_id).order("timestamp").execute()
            os_item["logs"] = [
                {
                    "id": log["id"],
                    "timestamp": log["timestamp"],
                    "authorId": log["author_id"],
                    "comment": log["comment"],
                    "statusChange": {
                        "from": log["status_from"],
                        "to": log["status_to"]
                    } if log["status_from"] and log["status_to"] else None
                }
                for log in (logs_response.data if logs_response.data else [])
            ]
            
            # Anexos de imagem
            attachments_response = _get_client().table("os_image_attachments").select("*").eq("os_id", os_id).order("uploaded_at").execute()
            os_item["imageAttachments"] = [
                {
                    "id": att["id"],
                    "url": att["url"],
                    "caption": att.get("caption"),
                    "uploadedBy": att["uploaded_by"],
                    "uploadedAt": att["uploaded_at"]
                }
                for att in (attachments_response.data if attachments_response.data else [])
            ]
        
        return os_list
    except Exception as e:
        print(f"⚠️ Erro ao carregar OSs: {e}")
        return []

def save_os(os_data: dict) -> dict:
    """Salva ou atualiza uma OS no Supabase"""
    client = _get_client()
    os_id = os_data.get("id")
    
    # Prepara dados da OS
    os_main = {
        "id": os_id,
        "title": os_data["title"],
        "description": os_data["description"],
        "status": os_data["status"],
        "priority": os_data["priority"],
        "plant_id": os_data["plantId"],
        "technician_id": os_data["technicianId"],
        "supervisor_id": os_data["supervisorId"],
        "start_date": os_data["startDate"],
        "end_date": os_data.get("endDate"),
        "activity": os_data["activity"],
        "attachments_enabled": os_data.get("attachmentsEnabled", True),
    }
    
    if os_id:
        # Atualiza OS existente
        client.table("os").update(os_main).eq("id", os_id).execute()
        
        # Remove ativos antigos
        client.table("os_assets").delete().eq("os_id", os_id).execute()
    else:
        # Cria nova OS
        client.table("os").insert(os_main).execute()
    
    # Salva ativos
    assets = os_data.get("assets", [])
    if assets:
        assets_data = [
            {"os_id": os_id, "asset_name": asset}
            for asset in assets
        ]
        client.table("os_assets").insert(assets_data).execute()
    
    return os_main

# ==================== ASSIGNMENTS ====================

def load_assignments(plant_id: str) -> dict:
    """Carrega atribuições de uma usina"""
    try:
        response = _get_client().table("plant_assignments").select("*").eq("plant_id", plant_id).execute()
        assignments = response.data if response.data else []
        
        result = {
            "coordinatorId": None,
            "supervisorIds": [],
            "technicianIds": [],
            "assistantIds": []
        }
        
        for a in assignments:
            role_type = a["role_type"]
            user_id = a["user_id"]
            
            if role_type == "coordinator":
                result["coordinatorId"] = user_id
            elif role_type == "supervisor":
                result["supervisorIds"].append(user_id)
            elif role_type == "technician":
                result["technicianIds"].append(user_id)
            elif role_type == "assistant":
                result["assistantIds"].append(user_id)
        
        return result
    except Exception as e:
        print(f"⚠️ Erro ao carregar atribuições: {e}")
        return {
            "coordinatorId": None,
            "supervisorIds": [],
            "technicianIds": [],
            "assistantIds": []
        }

def save_assignments(plant_id: str, assignments: dict) -> dict:
    """Salva atribuições de uma usina"""
    client = _get_client()
    
    # Remove atribuições antigas
    client.table("plant_assignments").delete().eq("plant_id", plant_id).execute()
    
    # Insere novas atribuições
    assignments_data = []
    
    if assignments.get("coordinatorId"):
        assignments_data.append({
            "plant_id": plant_id,
            "user_id": assignments["coordinatorId"],
            "role_type": "coordinator"
        })
    
    for user_id in assignments.get("supervisorIds", []):
        assignments_data.append({
            "plant_id": plant_id,
            "user_id": user_id,
            "role_type": "supervisor"
        })
    
    for user_id in assignments.get("technicianIds", []):
        assignments_data.append({
            "plant_id": plant_id,
            "user_id": user_id,
            "role_type": "technician"
        })
    
    for user_id in assignments.get("assistantIds", []):
        assignments_data.append({
            "plant_id": plant_id,
            "user_id": user_id,
            "role_type": "assistant"
        })
    
    if assignments_data:
        client.table("plant_assignments").insert(assignments_data).execute()
    
    return assignments

