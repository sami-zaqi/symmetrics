from fastapi import APIRouter, HTTPException

from app.core.session_store import session_store

router = APIRouter(prefix="/api/session", tags=["session"])


@router.delete("/{session_id}")
def delete_session(session_id: str):
    deleted = session_store.delete(session_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Sesi tidak ditemukan.")
    return {"status": "deleted"}
