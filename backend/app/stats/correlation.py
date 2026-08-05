import pingouin as pg

from app.stats._utils import ci_to_list, numeric_series, safe_float


def _run(df, x_col: str, y_col: str, method: str) -> dict:
    x = numeric_series(df, x_col)
    y = numeric_series(df, y_col)
    n = min(len(x), len(y))
    res = pg.corr(x.iloc[:n], y.iloc[:n], method=method)
    row = res.iloc[0]
    return {
        "descriptives": [
            {"group": x_col, "n": int(n), "mean": safe_float(x.mean()), "sd": safe_float(x.std()), "median": safe_float(x.median())},
            {"group": y_col, "n": int(n), "mean": safe_float(y.mean()), "sd": safe_float(y.std()), "median": safe_float(y.median())},
        ],
        "test_statistics": {
            "statistic_name": "r",
            "statistic_value": safe_float(row["r"]),
            "df": int(n) - 2,
            "p_value": safe_float(row["p_val"]),
            "effect_size": {"name": "r", "value": safe_float(row["r"])},
            "confidence_interval": ci_to_list(row["CI95"]),
            "power": safe_float(row["power"]),
        },
    }


def run_pearson(df, x_col: str, y_col: str) -> dict:
    return _run(df, x_col, y_col, "pearson")


def run_spearman(df, x_col: str, y_col: str) -> dict:
    return _run(df, x_col, y_col, "spearman")
