import io
import tempfile
from pathlib import Path

import pandas as pd
import pyreadstat
from sklearn.experimental import enable_iterative_imputer  # noqa: F401 -- required before importing IterativeImputer
from sklearn.impute import IterativeImputer, KNNImputer

from app.core.schemas import ColumnInfo, ColumnType, DataSchema

_SCALE_TO_COLUMN_TYPE: dict[str, ColumnType] = {
    "nominal": "categorical",
    "ordinal": "categorical",
    "interval": "numeric",
    "rasio": "numeric",
}


def _parse_sav(content: bytes) -> pd.DataFrame:
    """SPSS .sav files carry their own variable/value-label metadata (e.g. a
    column stored as 1/2 with labels "Laki-laki"/"Perempuan") -- ReadStat (the
    C library pyreadstat wraps) needs a real file path, not an in-memory
    buffer, hence the temp file. `apply_value_formats` decodes labeled columns
    to their string labels directly, matching what a student sees in SPSS's
    "Value Labels" view rather than the meaningless raw numeric codes; columns
    without value labels (continuous variables) are left as plain numbers."""
    with tempfile.NamedTemporaryFile(suffix=".sav", delete=False) as tmp:
        tmp.write(content)
        tmp_path = Path(tmp.name)
    try:
        df, _meta = pyreadstat.read_sav(str(tmp_path), apply_value_formats=True, formats_as_category=False)
        return df
    finally:
        tmp_path.unlink(missing_ok=True)


def parse_upload(filename: str, content: bytes, na_values: str | None = None) -> pd.DataFrame:
    extra = [na_values] if na_values else None
    lower = filename.lower()
    if lower.endswith(".csv"):
        return pd.read_csv(io.BytesIO(content), na_values=extra)
    if lower.endswith((".xlsx", ".xls")):
        return pd.read_excel(io.BytesIO(content), na_values=extra)
    if lower.endswith(".sav"):
        return _parse_sav(content)
    raise ValueError("Format file tidak didukung. Gunakan CSV, Excel (.xlsx), atau SPSS (.sav).")


def infer_column_type(series: pd.Series) -> ColumnType:
    if pd.api.types.is_bool_dtype(series):
        return "categorical"
    if pd.api.types.is_numeric_dtype(series):
        return "numeric"
    if pd.api.types.is_datetime64_any_dtype(series):
        return "datetime"
    # covers legacy object dtype and pandas' newer string/StringDtype columns
    return "categorical"


def summarize_columns(
    df: pd.DataFrame,
    schema: DataSchema | None = None,
    type_overrides: dict[str, ColumnType] | None = None,
) -> list[ColumnInfo]:
    """Column type precedence: an explicit Data Entry Builder schema wins first
    (the student declared the scale deliberately), then a manual override the
    student made while reviewing an upload, then the plain auto-detected guess."""
    scale_by_name = {v.name: v.scale for v in schema.variables} if schema else {}
    overrides = type_overrides or {}
    columns = []
    for col in df.columns:
        series = df[col]
        name = str(col)
        scale = scale_by_name.get(name)
        if scale:
            dtype = _SCALE_TO_COLUMN_TYPE[scale]
        elif name in overrides:
            dtype = overrides[name]
        else:
            dtype = infer_column_type(series)
        columns.append(
            ColumnInfo(
                name=name,
                dtype=dtype,
                missing_count=int(series.isna().sum()),
                unique_count=int(series.nunique(dropna=True)),
            )
        )
    return columns


def unique_value_counts(df: pd.DataFrame, column: str, limit: int = 200) -> list[dict]:
    """Frequency of each distinct value in a column, most common first --
    lets the student spot inconsistent category labels ("L"/"laki2"/"Laki-laki")
    before they contaminate the analysis."""
    if column not in df.columns:
        raise ValueError(f"Kolom '{column}' tidak ditemukan.")
    counts = df[column].astype(str).where(df[column].notna(), None).value_counts(dropna=True)
    return [{"value": str(v), "count": int(c)} for v, c in counts.head(limit).items()]


def remap_values(df: pd.DataFrame, column: str, mapping: dict[str, str]) -> pd.DataFrame:
    """Merge inconsistent category labels in `column` into canonical values.
    Only entries present in `mapping` are changed; everything else is left as-is."""
    if column not in df.columns:
        raise ValueError(f"Kolom '{column}' tidak ditemukan.")
    result = df.copy()
    result[column] = result[column].astype(str).replace(mapping)
    return result


def preview_rows(df: pd.DataFrame, n: int = 10) -> list[dict]:
    preview = df.head(n).copy()
    # Replace NaN/NaT with None so it's JSON-serializable
    preview = preview.where(pd.notnull(preview), None)
    return preview.to_dict(orient="records")


def detect_outliers(df: pd.DataFrame) -> list[dict]:
    """IQR-based outlier count per numeric column -- informational only.
    Outliers are flagged for the user to review, never auto-removed, since
    silently deleting them could bias the analysis."""
    outliers = []
    for col in df.columns:
        series = df[col]
        if not pd.api.types.is_numeric_dtype(series):
            continue
        clean = series.dropna()
        if len(clean) < 4:
            continue
        q1, q3 = clean.quantile(0.25), clean.quantile(0.75)
        iqr = q3 - q1
        if iqr == 0:
            continue
        low, high = q1 - 1.5 * iqr, q3 + 1.5 * iqr
        count = int(((clean < low) | (clean > high)).sum())
        if count > 0:
            outliers.append({"column": str(col), "count": count, "lower_bound": float(low), "upper_bound": float(high)})
    return outliers


def clean_data(df: pd.DataFrame, strategy: str) -> pd.DataFrame:
    """strategy: 'listwise_deletion' drops any row with a missing value;
    'mean_mode_imputation' fills numeric columns with the column mean and
    categorical columns with the column mode -- simple, but blanket mean-fill
    attenuates variance (biases estimation models toward the population
    mean), a real problem for vital/continuous clinical variables.
    'knn_imputation' and 'mice_imputation' impute numeric columns from the
    other numeric columns' relationships instead of a single constant (via
    scikit-learn's KNNImputer / IterativeImputer, the latter implementing
    MICE); categorical columns still fall back to mode fill in both, since
    neither method here operates on categorical distance/regression."""
    if strategy == "listwise_deletion":
        return df.dropna().reset_index(drop=True)

    if strategy == "mean_mode_imputation":
        cleaned = df.copy()
        for col in cleaned.columns:
            series = cleaned[col]
            if pd.api.types.is_numeric_dtype(series):
                cleaned[col] = series.fillna(series.mean())
            else:
                mode = series.mode(dropna=True)
                if not mode.empty:
                    cleaned[col] = series.fillna(mode.iloc[0])
        return cleaned

    if strategy in ("knn_imputation", "mice_imputation"):
        cleaned = df.copy()
        numeric_cols = [c for c in cleaned.columns if pd.api.types.is_numeric_dtype(cleaned[c])]
        if numeric_cols:
            numeric_block = cleaned[numeric_cols].astype(float)
            if strategy == "knn_imputation":
                n_neighbors = min(5, max(1, len(cleaned) - 1))
                imputer = KNNImputer(n_neighbors=n_neighbors)
            else:
                imputer = IterativeImputer(random_state=0)
            cleaned[numeric_cols] = imputer.fit_transform(numeric_block)
        for col in cleaned.columns:
            if col in numeric_cols:
                continue
            mode = cleaned[col].mode(dropna=True)
            if not mode.empty:
                cleaned[col] = cleaned[col].fillna(mode.iloc[0])
        return cleaned

    raise ValueError(f"Strategi pembersihan '{strategy}' tidak dikenali.")
