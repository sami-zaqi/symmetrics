import pandas as pd
import pingouin as pg

from app.stats._utils import numeric_series, safe_float


def run_simple_linear(df, x_col: str, y_col: str) -> dict:
    x = numeric_series(df, x_col)
    y = numeric_series(df, y_col)
    n = min(len(x), len(y))
    X = pd.DataFrame({x_col: x.iloc[:n].reset_index(drop=True)})
    y2 = y.iloc[:n].reset_index(drop=True)
    res = pg.linear_regression(X, y2)
    intercept_row = res[res["names"] == "Intercept"].iloc[0]
    slope_row = res[res["names"] == x_col].iloc[0]
    r2 = safe_float(res.iloc[0]["r2"])
    return {
        "descriptives": [
            {"group": x_col, "n": int(n), "mean": safe_float(x.mean()), "sd": safe_float(x.std()), "median": safe_float(x.median())},
            {"group": y_col, "n": int(n), "mean": safe_float(y.mean()), "sd": safe_float(y.std()), "median": safe_float(y.median())},
        ],
        "test_statistics": {
            "statistic_name": "t (koefisien)",
            "statistic_value": safe_float(slope_row["T"]),
            "df": int(n) - 2,
            "p_value": safe_float(slope_row["pval"]),
            "effect_size": {"name": "R-squared", "value": r2},
            "confidence_interval": [safe_float(slope_row["CI2.5%"]), safe_float(slope_row["CI97.5%"])]
            if "CI2.5%" in res.columns
            else None,
            "power": None,
            "intercept": safe_float(intercept_row["coef"]),
            "slope": safe_float(slope_row["coef"]),
            "r_squared": r2,
            "equation": f"{y_col} = {safe_float(intercept_row['coef']):.4f} + {safe_float(slope_row['coef']):.4f} * {x_col}",
        },
    }
