import pingouin as pg
from scipy import stats as scipy_stats

from app.stats._utils import numeric_series, safe_float


def shapiro_per_group(df, dv: str, group_col: str | None) -> list[dict]:
    """Shapiro-Wilk normality test, per group if a grouping column is given,
    otherwise on the whole series (e.g. for paired-difference checks)."""
    outcomes = []
    if group_col is None:
        series = numeric_series(df, dv)
        res = pg.normality(series)
        row = res.iloc[0]
        p = safe_float(row["pval"])
        outcomes.append(
            {
                "name": f"Shapiro-Wilk ({dv})",
                "statistic": safe_float(row["W"]),
                "p_value": p,
                "passed": bool(p is not None and p >= 0.05),
                "detail": (
                    f"Data berdistribusi normal (p={p:.3f} >= 0.05)."
                    if p is not None and p >= 0.05
                    else f"Data TIDAK berdistribusi normal (p={p:.3f} < 0.05)."
                    if p is not None
                    else "Uji normalitas tidak dapat dihitung."
                ),
            }
        )
        return outcomes

    for name, sub in df.groupby(group_col, observed=True):
        series = numeric_series(sub, dv)
        if len(series) < 3:
            continue
        res = pg.normality(series)
        row = res.iloc[0]
        p = safe_float(row["pval"])
        outcomes.append(
            {
                "name": f"Shapiro-Wilk ({dv} - kelompok '{name}')",
                "statistic": safe_float(row["W"]),
                "p_value": p,
                "passed": bool(p is not None and p >= 0.05),
                "detail": (
                    f"Data kelompok '{name}' berdistribusi normal (p={p:.3f} >= 0.05)."
                    if p is not None and p >= 0.05
                    else f"Data kelompok '{name}' TIDAK berdistribusi normal (p={p:.3f} < 0.05)."
                    if p is not None
                    else "Uji normalitas tidak dapat dihitung."
                ),
            }
        )
    return outcomes


def kolmogorov_smirnov(df, dv: str) -> dict:
    series = numeric_series(df, dv)
    standardized = (series - series.mean()) / series.std()
    stat, p = scipy_stats.kstest(standardized, "norm")
    p = safe_float(p)
    return {
        "name": f"Kolmogorov-Smirnov ({dv})",
        "statistic": safe_float(stat),
        "p_value": p,
        "passed": bool(p is not None and p >= 0.05),
        "detail": (
            f"Data berdistribusi normal menurut KS-test (p={p:.3f})."
            if p is not None and p >= 0.05
            else f"Data TIDAK berdistribusi normal menurut KS-test (p={p:.3f})."
            if p is not None
            else "Uji KS tidak dapat dihitung."
        ),
    }
