import pandas as pd


def run(df: pd.DataFrame, columns: list[str]) -> list[dict]:
    """Descriptive statistics for the given numeric columns."""
    results = []
    for col in columns:
        series = pd.to_numeric(df[col], errors="coerce").dropna()
        results.append(
            {
                "variable": col,
                "n": int(series.count()),
                "mean": float(series.mean()),
                "sd": float(series.std()),
                "median": float(series.median()),
                "min": float(series.min()),
                "max": float(series.max()),
                "missing": int(df[col].isna().sum()),
            }
        )
    return results
