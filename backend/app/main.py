from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import (
    routes_assumptions,
    routes_debug,
    routes_export,
    routes_narrative,
    routes_session,
    routes_tests,
    routes_upload,
    routes_wizard,
)
from app.config import settings

app = FastAPI(title="Symmetrics Stats API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(routes_debug.router)
app.include_router(routes_upload.router)
app.include_router(routes_session.router)
app.include_router(routes_wizard.router)
app.include_router(routes_assumptions.router)
app.include_router(routes_tests.router)
app.include_router(routes_narrative.router)
app.include_router(routes_export.router)


@app.get("/api/health")
def health():
    return {"status": "ok"}
