from fastapi import APIRouter, HTTPException

from app.core.schemas import AssumptionCheckRequest, AssumptionResult
from app.core.session_store import session_store
from app.stats.assumption_engine import check

router = APIRouter(prefix="/api/assumptions", tags=["assumptions"])


@router.post("/check", response_model=AssumptionResult)
def assumptions_check(req: AssumptionCheckRequest):
    session = session_store.get(req.session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Sesi tidak ditemukan atau sudah kedaluwarsa.")
    try:
        return check(session.df, req.test_id, req.mapping)
    except (ValueError, KeyError) as exc:
        raise HTTPException(status_code=400, detail=f"Gagal memeriksa asumsi: {exc}") from exc
