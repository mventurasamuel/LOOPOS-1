# /attachments/main.py
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from typing import List
from pathlib import Path
from datetime import datetime
import os, uuid

# importe o router após criar app
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://192.168.18.69:3000"
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inclui as rotas de OS (CRUD)
from os_api import router as os_router  # os_api.py na mesma pasta
app.include_router(os_router)

# Arquivos estáticos (anexos)
UPLOAD_ROOT = Path(os.getenv(
    "NEXTCLOUD_ATTACHMENTS_DIR",
    r"C:\Users\leona\Nextcloud\06. OPERAÇÃO\03. Tempo Real\LoopOS\LOOPOS\attachments"
))
UPLOAD_ROOT.mkdir(parents=True, exist_ok=True)
app.mount("/files", StaticFiles(directory=UPLOAD_ROOT), name="files")

@app.post("/api/os/{os_id}/attachments")
async def upload_attachments(
    os_id: str,
    files: List[UploadFile] = File(...),
    captions: List[str] = Form([])
):
    dest = UPLOAD_ROOT / os_id
    dest.mkdir(parents=True, exist_ok=True)
    saved = []
    for i, uf in enumerate(files):
        ext = Path(uf.filename).suffix or ".bin"
        att_id = f"img-{uuid.uuid4().hex}"
        fname = f"{att_id}{ext}"
        fpath = dest / fname
        with open(fpath, "wb") as out:
            while True:
                chunk = await uf.read(1024 * 1024)
                if not chunk:
                    break
                out.write(chunk)
        caption = captions[i] if i < len(captions) else ""
        saved.append({
            "id": att_id,
            "url": f"/files/{os_id}/{fname}",
            "caption": caption,
            "uploadedAt": datetime.utcnow().isoformat() + "Z",
        })
    return saved

@app.delete("/api/os/{os_id}/attachments/{att_id}")
def delete_attachment(os_id: str, att_id: str):
    dirp = UPLOAD_ROOT / os_id
    for p in dirp.glob(f"{att_id}.*"):
        try:
            p.unlink()
        except:
            pass
    return {"ok": True}