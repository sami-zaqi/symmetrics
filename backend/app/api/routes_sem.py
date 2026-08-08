import uuid
from datetime import datetime

from fastapi import APIRouter, HTTPException

from app.core.schemas import SemBootstrapRequest, SemPlsRequest, SemPlsResult
from app.core.session_store import session_store
from app.stats import sem_pls

router = APIRouter(prefix="/api/sem", tags=["sem-pls"])


@router.post("/run", response_model=SemPlsResult)
def run_sem_pls(req: SemPlsRequest):
    session = session_store.get(req.session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Sesi tidak ditemukan atau sudah kedaluwarsa.")

    try:
        payload = sem_pls.run(session.df, req.constructs, req.paths)
    except (ValueError, KeyError) as exc:
        raise HTTPException(status_code=400, detail=f"Gagal menjalankan model SEM-PLS: {exc}") from exc

    result_id = str(uuid.uuid4())
    result = SemPlsResult(
        result_id=result_id,
        constructs=req.constructs,
        paths=req.paths,
        generated_at=datetime.utcnow(),
        **payload,
    )
    session_store.store_result(req.session_id, result_id, result)
    return result


@router.post("/bootstrap", response_model=SemPlsResult)
def run_sem_bootstrap(req: SemBootstrapRequest):
    session = session_store.get(req.session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Sesi tidak ditemukan atau sudah kedaluwarsa.")

    result = session.results.get(req.result_id)
    if result is None or not isinstance(result, SemPlsResult):
        raise HTTPException(status_code=404, detail="Hasil model SEM-PLS tidak ditemukan.")

    try:
        bootstrap_rows = sem_pls.run_bootstrap(session.df, result.constructs, result.paths, iterations=req.iterations)
    except (ValueError, KeyError) as exc:
        raise HTTPException(status_code=400, detail=f"Gagal menjalankan bootstrap: {exc}") from exc

    result.bootstrap = bootstrap_rows
    session_store.store_result(req.session_id, req.result_id, result)
    return result
