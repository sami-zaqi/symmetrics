import io

import pandas as pd

from app.core.schemas import ColumnInfo, ColumnType


def parse_upload(filename: str, content: bytes) -> pd.DataFrame:
    if filename.lower().endswith(".csv"):
        return pd.read_csv(io.BytesIO(content))
    if filename.lower().endswith((".xlsx", ".xls")):
        return pd.read_excel(io.BytesIO(content))
    raise ValueError("Format file tidak didukung. Gunakan CSV atau Excel (.xlsx).")


def infer_column_type(series: pd.Series) -> ColumnType:
    if pd.api.types.is_bool_dtype(series):
        return "categorical"
    if pd.api.types.is_numeric_dtype(series):
        return "numeric"
    if pd.api.types.is_datetime64_any_dtype(series):
        return "datetime"
    # covers legacy object dtype and pandas' newer string/StringDtype columns
    return "categorical"


def summarize_columns(df: pd.DataFrame) -> list[ColumnInfo]:
    columns = []
    for col in df.columns:
        series = df[col]
        columns.append(
            ColumnInfo(
                name=str(col),
                dtype=infer_column_type(series),
                missing_count=int(series.isna().sum()),
                unique_count=int(series.nunique(dropna=True)),
            )
        )
    return columns


def preview_rows(df: pd.DataFrame, n: int = 10) -> list[dict]:
    preview = df.head(n).copy()
    # Replace NaN/NaT with None so it's JSON-serializable
    preview = preview.where(pd.notnull(preview), None)
    return preview.to_dict(orient="records")
