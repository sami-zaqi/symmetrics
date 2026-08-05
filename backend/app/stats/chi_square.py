import pingouin as pg

from app.stats._utils import safe_float


def run(df, x_col: str, y_col: str) -> dict:
    data = df[[x_col, y_col]].dropna()
    expected, observed, stats = pg.chi2_independence(data=data, x=x_col, y=y_col)
    row = stats[stats["test"] == "pearson"].iloc[0]
    contingency = observed.reset_index().rename(columns={x_col: x_col}).to_dict(orient="records")
    return {
        "descriptives": [{"group": "Tabel Kontingensi", "table": contingency}],
        "test_statistics": {
            "statistic_name": "chi2",
            "statistic_value": safe_float(row["chi2"]),
            "df": safe_float(row["dof"]),
            "p_value": safe_float(row["pval"]),
            "effect_size": {"name": "Cramer's V", "value": safe_float(row["cramer"])},
            "confidence_interval": None,
            "power": safe_float(row["power"]) if "power" in row else None,
        },
    }
