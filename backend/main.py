"""audit-admin-dashboard — FastAPI 入口"""
import os, sys
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, BASE_DIR)
_SHARED = os.path.abspath(os.path.join(BASE_DIR, "..", ".."))
if os.path.exists(os.path.join(_SHARED, "shared_db")):
    sys.path.insert(0, _SHARED)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import PORT
from shared_db import init_db

app = FastAPI(title="Audit Admin Dashboard", version="2.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True,
                   allow_methods=["*"], allow_headers=["*"])

from routers import auth, tasks, internal, statistics, pricing, settings, files, users
app.include_router(auth.router)
app.include_router(tasks.router)
app.include_router(internal.router)
app.include_router(statistics.router)
app.include_router(pricing.router)
app.include_router(settings.router)
app.include_router(files.router)
app.include_router(users.router)

@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "audit-admin-dashboard"}

@app.on_event("startup")
def on_startup():
    init_db()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=PORT, reload=True)
