import numpy as np
import pandas as pd


def safe_float(value) -> float | None:
    try:
        f = float(value)
    except (TypeError, ValueError):
        return None
    if np.isnan(f) or np.isinf(f):
        return None
    return f


def ci_to_list(ci) -> list[float] | None:
    if ci is None:
        return None
    try:
        return [safe_float(ci[0]), safe_float(ci[1])]
    except (TypeError, IndexError):
        return None


def group_descriptives(df: pd.DataFrame, dv: str, group_col: str) -> list[dict]:
    out = []
    for name, sub in df.groupby(group_col, observed=True):
        series = pd.to_numeric(sub[dv], errors="coerce").dropna()
        out.append(
            {
                "group": str(name),
                "n": int(series.count()),
                "mean": safe_float(series.mean()),
                "sd": safe_float(series.std()),
                "median": safe_float(series.median()),
            }
        )
    return out


def numeric_series(df: pd.DataFrame, col: str) -> pd.Series:
    return pd.to_numeric(df[col], errors="coerce").dropna()
