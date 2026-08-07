from fastapi import APIRouter, HTTPException, Response

from app.core.schemas import DataSchema
from app.core.session_store import session_store
from app.stats.template_builder import build_template_xlsx

router = APIRouter(prefix="/api/schema", tags=["schema"])


@router.post("/create")
def create_schema(schema: DataSchema):
    if not schema.variables:
        raise HTTPException(status_code=400, detail="Definisikan minimal satu variabel.")
    session_id = session_store.create_from_schema(schema)
    return {"session_id": session_id, "schema": schema}


@router.get("/{session_id}/template")
def download_template(session_id: str):
    session = session_store.get(session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Sesi tidak ditemukan atau sudah kedaluwarsa.")
    if session.schema is None:
        raise HTTPException(status_code=400, detail="Sesi ini tidak memiliki skema data.")

    xlsx_bytes = build_template_xlsx(session.schema)
    return Response(
        content=xlsx_bytes,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": 'attachment; filename="template_symmetrics.xlsx"'},
    )
