import pingouin as pg

from app.stats._utils import ci_to_list, group_descriptives, numeric_series, safe_float


def _two_groups(df, dv: str, group_col: str):
    names = list(df[group_col].dropna().unique())
    if len(names) != 2:
        raise ValueError(f"Uji ini butuh tepat 2 kelompok, ditemukan {len(names)}.")
    g1 = numeric_series(df[df[group_col] == names[0]], dv)
    g2 = numeric_series(df[df[group_col] == names[1]], dv)
    return names, g1, g2


def run_independent(df, dv: str, group_col: str) -> dict:
    names, g1, g2 = _two_groups(df, dv, group_col)
    res = pg.ttest(g1, g2, paired=False)
    row = res.iloc[0]
    return {
        "descriptives": group_descriptives(df, dv, group_col),
        "test_statistics": {
            "statistic_name": "t",
            "statistic_value": safe_float(row["T"]),
            "df": safe_float(row["dof"]),
            "p_value": safe_float(row["p_val"]),
            "effect_size": {"name": "Cohen's d", "value": safe_float(row["cohen_d"])},
            "confidence_interval": ci_to_list(row["CI95"]),
            "power": safe_float(row["power"]),
        },
    }


def run_mann_whitney(df, dv: str, group_col: str) -> dict:
    names, g1, g2 = _two_groups(df, dv, group_col)
    res = pg.mwu(g1, g2)
    row = res.iloc[0]
    return {
        "descriptives": group_descriptives(df, dv, group_col),
        "test_statistics": {
            "statistic_name": "U",
            "statistic_value": safe_float(row["U_val"]),
            "df": None,
            "p_value": safe_float(row["p_val"]),
            "effect_size": {"name": "Rank-Biserial Correlation", "value": safe_float(row["RBC"])},
            "confidence_interval": None,
            "power": None,
        },
    }


def run_paired(df, dv: str, time_col_pair: tuple[str, str]) -> dict:
    col_a, col_b = time_col_pair
    a = numeric_series(df, col_a)
    b = numeric_series(df, col_b)
    n = min(len(a), len(b))
    a, b = a.iloc[:n], b.iloc[:n]
    res = pg.ttest(a, b, paired=True)
    row = res.iloc[0]
    descriptives = [
        {"group": col_a, "n": int(n), "mean": safe_float(a.mean()), "sd": safe_float(a.std()), "median": safe_float(a.median())},
        {"group": col_b, "n": int(n), "mean": safe_float(b.mean()), "sd": safe_float(b.std()), "median": safe_float(b.median())},
    ]
    return {
        "descriptives": descriptives,
        "test_statistics": {
            "statistic_name": "t",
            "statistic_value": safe_float(row["T"]),
            "df": safe_float(row["dof"]),
            "p_value": safe_float(row["p_val"]),
            "effect_size": {"name": "Cohen's d", "value": safe_float(row["cohen_d"])},
            "confidence_interval": ci_to_list(row["CI95"]),
            "power": safe_float(row["power"]),
        },
    }


def run_wilcoxon(df, dv: str, time_col_pair: tuple[str, str]) -> dict:
    col_a, col_b = time_col_pair
    a = numeric_series(df, col_a)
    b = numeric_series(df, col_b)
    n = min(len(a), len(b))
    a, b = a.iloc[:n], b.iloc[:n]
    res = pg.wilcoxon(a, b)
    row = res.iloc[0]
    descriptives = [
        {"group": col_a, "n": int(n), "mean": safe_float(a.mean()), "sd": safe_float(a.std()), "median": safe_float(a.median())},
        {"group": col_b, "n": int(n), "mean": safe_float(b.mean()), "sd": safe_float(b.std()), "median": safe_float(b.median())},
    ]
    return {
        "descriptives": descriptives,
        "test_statistics": {
            "statistic_name": "W",
            "statistic_value": safe_float(row["W_val"]),
            "df": None,
            "p_value": safe_float(row["p_val"]),
            "effect_size": {"name": "Rank-Biserial Correlation", "value": safe_float(row["RBC"])},
            "confidence_interval": None,
            "power": None,
        },
    }
