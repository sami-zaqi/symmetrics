from fastapi import APIRouter, Form, HTTPException, UploadFile

from app.core.schemas import (
    CleanDataRequest,
    ColumnValuesRequest,
    DataSchema,
    DatasetSummary,
    RemapValuesRequest,
    SetColumnTypeRequest,
    ValueCount,
)
from app.core.session_store import SessionData, session_store
from app.stats import data_loader

router = APIRouter(prefix="/api", tags=["upload"])


def _build_summary(session_id: str, df, session: SessionData | None = None) -> DatasetSummary:
    schema = session.schema if session else None
    overrides = session.type_overrides if session else None
    return DatasetSummary(
        session_id=session_id,
        row_count=len(df),
        columns=data_loader.summarize_columns(df, schema, overrides),
        preview_rows=data_loader.preview_rows(df),
        outliers=data_loader.detect_outliers(df),
        constructs=schema.constructs if schema else [],
    )


def _require_session(session_id: str) -> SessionData:
    session = session_store.get(session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Sesi tidak ditemukan atau sudah kedaluwarsa.")
    return session


@router.post("/upload", response_model=DatasetSummary)
async def upload_dataset(file: UploadFile, session_id: str | None = Form(None)):
    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="File kosong.")

    # If session_id points to a session created via the Data Entry Builder
    # (POST /api/schema/create), reuse its schema: apply the declared
    # missing-value symbol during parsing and the declared variable scales
    # when summarizing columns, instead of guessing purely from file content.
    existing_session = session_store.get(session_id) if session_id else None
    schema = existing_session.schema if existing_session else None

    try:
        df = data_loader.parse_upload(
            file.filename or "",
            content,
            na_values=schema.missing_value_symbol if schema and schema.missing_value_symbol else None,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:  # pandas parse errors (bad CSV, corrupt xlsx, etc.)
        raise HTTPException(status_code=400, detail=f"Gagal membaca file: {exc}") from exc

    if df.empty:
        raise HTTPException(status_code=400, detail="Dataset tidak berisi baris data.")

    if existing_session is not None:
        existing_session.df = df
        existing_session.type_overrides = {}
        return _build_summary(session_id, df, existing_session)

    new_session_id = session_store.create(df)
    return _build_summary(new_session_id, df)


@router.post("/upload/clean", response_model=DatasetSummary)
def clean_dataset(req: CleanDataRequest):
    session = _require_session(req.session_id)
    try:
        cleaned = data_loader.clean_data(session.df, req.strategy)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    if cleaned.empty:
        raise HTTPException(status_code=400, detail="Pembersihan data menghasilkan dataset kosong (semua baris terhapus).")

    session.df = cleaned
    return _build_summary(req.session_id, cleaned, session)


@router.post("/upload/column-values", response_model=list[ValueCount])
def column_values(req: ColumnValuesRequest):
    session = _require_session(req.session_id)
    try:
        return data_loader.unique_value_counts(session.df, req.column)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/upload/remap-values", response_model=DatasetSummary)
def remap_values(req: RemapValuesRequest):
    session = _require_session(req.session_id)
    try:
        remapped = data_loader.remap_values(session.df, req.column, req.mapping)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    session.df = remapped
    return _build_summary(req.session_id, remapped, session)


@router.post("/upload/set-type", response_model=DatasetSummary)
def set_column_type(req: SetColumnTypeRequest):
    session = _require_session(req.session_id)
    if req.column not in session.df.columns:
        raise HTTPException(status_code=400, detail=f"Kolom '{req.column}' tidak ditemukan.")

    session.type_overrides[req.column] = req.dtype
    return _build_summary(req.session_id, session.df, session)
