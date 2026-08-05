from fastapi import APIRouter, HTTPException, UploadFile

from app.core.schemas import DatasetSummary
from app.core.session_store import session_store
from app.stats import data_loader

router = APIRouter(prefix="/api", tags=["upload"])


@router.post("/upload", response_model=DatasetSummary)
async def upload_dataset(file: UploadFile):
    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="File kosong.")

    try:
        df = data_loader.parse_upload(file.filename or "", content)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:  # pandas parse errors (bad CSV, corrupt xlsx, etc.)
        raise HTTPException(status_code=400, detail=f"Gagal membaca file: {exc}") from exc

    if df.empty:
        raise HTTPException(status_code=400, detail="Dataset tidak berisi baris data.")

    session_id = session_store.create(df)

    return DatasetSummary(
        session_id=session_id,
        row_count=len(df),
        columns=data_loader.summarize_columns(df),
        preview_rows=data_loader.preview_rows(df),
    )
