import pingouin as pg

from app.stats._utils import numeric_series, safe_float


def levene(df, dv: str, group_col: str) -> dict:
    groups = [numeric_series(sub, dv).to_numpy() for _, sub in df.groupby(group_col, observed=True)]
    groups = [g for g in groups if len(g) >= 2]
    res = pg.homoscedasticity(groups)
    row = res.iloc[0]
    p = safe_float(row["pval"])
    return {
        "name": f"Levene's Test ({dv} berdasarkan {group_col})",
        "statistic": safe_float(row["W"]),
        "p_value": p,
        "passed": bool(p is not None and p >= 0.05),
        "detail": (
            f"Varians antar kelompok homogen (p={p:.3f} >= 0.05)."
            if p is not None and p >= 0.05
            else f"Varians antar kelompok TIDAK homogen (p={p:.3f} < 0.05)."
            if p is not None
            else "Uji homogenitas tidak dapat dihitung."
        ),
    }
