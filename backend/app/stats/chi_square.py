import math

import pandas as pd
import pingouin as pg

from app.stats._utils import safe_float
from app.stats.logistic import _infer_positive_label


def _pick_reference_and_event(labels: list[str]) -> tuple[str, str]:
    """Same event/reference heuristic as logistic.py's _encode_binary, applied
    here too so chi_square's OR/RR direction always agrees with what
    logistic_regression would report for the same two variables."""
    positive = _infer_positive_label(labels)
    if positive is not None:
        reference = labels[0] if labels[1] == positive else labels[1]
    else:
        reference, positive = labels[0], labels[1]
    return reference, positive


def _odds_relative_risk(observed, x_col: str, y_col: str) -> dict | None:
    """For a strict 2x2 contingency table, compute Odds Ratio and Relative Risk
    with 95% CI (normal approximation on the log scale). Returns None otherwise.
    Row/column reference-vs-event direction is picked with the same heuristic
    as logistic.py (falling back to alphabetical order), and always returned
    explicitly so the narrative layer never has to guess."""
    if observed.shape != (2, 2):
        return None

    row_ref, row_compared = _pick_reference_and_event([str(x) for x in observed.index.tolist()])
    col_ref, col_event = _pick_reference_and_event([str(x) for x in observed.columns.tolist()])

    a = float(observed.loc[row_compared, col_event])
    b = float(observed.loc[row_compared, col_ref])
    c = float(observed.loc[row_ref, col_event])
    d = float(observed.loc[row_ref, col_ref])

    labels = {
        "row_variable": x_col,
        "row_reference": row_ref,
        "row_compared": row_compared,
        "col_variable": y_col,
        "col_reference": col_ref,
        "col_event": col_event,
    }

    if min(a, b, c, d) == 0:
        return {
            "odds_ratio": None,
            "or_ci95": None,
            "relative_risk": None,
            "rr_ci95": None,
            **labels,
            "note": "Salah satu sel tabel 2x2 bernilai 0, OR/RR tidak dapat dihitung secara stabil.",
        }

    odds_ratio = (a * d) / (b * c)
    se_log_or = math.sqrt(1 / a + 1 / b + 1 / c + 1 / d)
    log_or = math.log(odds_ratio)
    or_ci = [math.exp(log_or - 1.96 * se_log_or), math.exp(log_or + 1.96 * se_log_or)]

    risk_compared = a / (a + b)
    risk_reference = c / (c + d)
    relative_risk = risk_compared / risk_reference if risk_reference != 0 else None
    rr_ci = None
    if relative_risk is not None and relative_risk > 0:
        se_log_rr = math.sqrt((1 - risk_compared) / a + (1 - risk_reference) / c)
        log_rr = math.log(relative_risk)
        rr_ci = [math.exp(log_rr - 1.96 * se_log_rr), math.exp(log_rr + 1.96 * se_log_rr)]

    return {
        "odds_ratio": safe_float(odds_ratio),
        "or_ci95": [safe_float(or_ci[0]), safe_float(or_ci[1])],
        "relative_risk": safe_float(relative_risk),
        "rr_ci95": [safe_float(rr_ci[0]), safe_float(rr_ci[1])] if rr_ci else None,
        **labels,
        "note": (
            f"OR/RR membandingkan peluang '{y_col}' = '{col_event}' pada kelompok "
            f"'{x_col}' = '{row_compared}' terhadap kelompok '{x_col}' = '{row_ref}'."
        ),
    }


def run(df, x_col: str, y_col: str) -> dict:
    data = df[[x_col, y_col]].dropna()
    # pingouin's `observed` return is Yates-corrected (shifted by +-0.5) for any
    # 2x2 table -- fine for its own chi2/p-value math, but wrong to display as
    # the contingency table or to feed into OR/RR, both of which must use the
    # true raw counts. Build those separately from a plain crosstab.
    raw_observed = pd.crosstab(data[x_col], data[y_col])
    expected, observed, stats = pg.chi2_independence(data=data, x=x_col, y=y_col)
    row = stats[stats["test"] == "pearson"].iloc[0]
    contingency = raw_observed.reset_index().rename(columns={x_col: x_col}).to_dict(orient="records")
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
            "or_rr": _odds_relative_risk(raw_observed, x_col, y_col),
        },
    }
