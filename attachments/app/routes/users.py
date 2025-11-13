# /attachments/app/routes/users.py
from fastapi import APIRouter, HTTPException
from typing import List
from uuid import uuid4
from app.core.storage import load_json, save_json
from app.core.schemas import UserCreate, UserUpdate, UserOut

router = APIRouter(prefix="/api/users", tags=["users"])
_USERS_FILE = "users.json"

def _all_users() -> List[dict]:
    return load_json(_USERS_FILE, [])

def _save_users(users: List[dict]):
    save_json(_USERS_FILE, users)

@router.get("", response_model=List[UserOut])
def list_users():
    return _all_users()

@router.post("", response_model=UserOut, status_code=201)
def create_user(payload: UserCreate):
    users = _all_users()
    new_user = payload.dict()
    new_user["id"] = str(uuid4())
    new_user.setdefault("plantIds", [])
    users.append(new_user)
    _save_users(users)
    return new_user

@router.put("/{user_id}", response_model=UserOut)
def update_user(user_id: str, payload: UserUpdate):
    users = _all_users()
    for i, u in enumerate(users):
        if u["id"] == user_id:
            users[i] = {**u, **payload.dict()}
            _save_users(users)
            return users[i]
    raise HTTPException(status_code=404, detail="User not found")

@router.delete("/{user_id}")
def delete_user(user_id: str):
    users = _all_users()
    new_users = [u for u in users if u["id"] != user_id]
    if len(new_users) == len(users):
        raise HTTPException(status_code=404, detail="User not found")
    _save_users(new_users)
    return {"detail": "deleted"}