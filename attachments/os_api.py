# File: attachments/os_api.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from pathlib import Path
import json, threading

class OSModel(BaseModel):
    id: str
    title: str
    description: str
    status: str
    priority: str
    plantId: str
    technicianId: Optional[str] = None
    supervisorId: Optional[str] = None
    startDate: str
    activity: str
    assets: List[str] = []
    attachmentsEnabled: bool = True
    createdAt: str
    updatedAt: str
    logs: List[dict] = []
    imageAttachments: List[dict] = []

router = APIRouter(prefix="/api/os", tags=["os"])

BASE = Path(__file__).parent
DATA_FILE = BASE / "data" / "os.json"
DATA_FILE.parent.mkdir(parents=True, exist_ok=True)

_lock = threading.Lock()

def _load() -> List[OSModel]:
    if DATA_FILE.exists():
        with DATA_FILE.open("r", encoding="utf-8") as f:
            raw = json.load(f)
        return [OSModel(**o) for o in raw]
    return []

def _save(items: List[OSModel]):
    with DATA_FILE.open("w", encoding="utf-8") as f:
        json.dump([o.dict() for o in items], f, ensure_ascii=False, indent=2)

@router.get("", response_model=List[OSModel])
def list_os():
    return _load()

@router.post("", response_model=OSModel)
def create_os(payload: OSModel):
    with _lock:
        data = _load()
        if any(o.id == payload.id for o in data):
            raise HTTPException(400, "OS id already exists")
        data.insert(0, payload)
        _save(data)
        return payload

@router.put("/{os_id}", response_model=OSModel)
def update_os(os_id: str, payload: OSModel):
    with _lock:
        data = _load()
        for i, o in enumerate(data):
            if o.id == os_id:
                data[i] = payload
                _save(data)
                return payload
    raise HTTPException(404, "OS not found")