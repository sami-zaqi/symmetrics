import pingouin as pg

from app.stats._utils import group_descriptives, safe_float


def run_oneway(df, dv: str, group_col: str) -> dict:
    res = pg.anova(data=df, dv=dv, between=group_col)
    row = res.iloc[0]
    return {
        "descriptives": group_descriptives(df, dv, group_col),
        "test_statistics": {
            "statistic_name": "F",
            "statistic_value": safe_float(row["F"]),
            "df": [safe_float(row["ddof1"]), safe_float(row["ddof2"])],
            "p_value": safe_float(row["p_unc"]),
            "effect_size": {"name": "Eta-squared partial", "value": safe_float(row["np2"])},
            "confidence_interval": None,
            "power": None,
        },
    }


def run_kruskal(df, dv: str, group_col: str) -> dict:
    res = pg.kruskal(data=df, dv=dv, between=group_col)
    row = res.iloc[0]
    return {
        "descriptives": group_descriptives(df, dv, group_col),
        "test_statistics": {
            "statistic_name": "H",
            "statistic_value": safe_float(row["H"]),
            "df": safe_float(row["ddof1"]),
            "p_value": safe_float(row["p_unc"]),
            "effect_size": None,
            "confidence_interval": None,
            "power": None,
        },
    }
