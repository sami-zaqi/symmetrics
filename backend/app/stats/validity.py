import pandas as pd

from app.stats._utils import safe_float

VALIDITY_THRESHOLD = 0.30


def run_item_total_correlation(df: pd.DataFrame, items: list[str]) -> list[dict]:
    """Corrected item-total Pearson correlation: each item's score correlated
    against the sum of all OTHER items (standard instrument-validity check for
    questionnaire data, reported alongside Cronbach's Alpha in thesis Bab IV)."""
    data = df[items].apply(lambda s: s.astype(float))
    results = []
    for item in items:
        others_sum = data.drop(columns=[item]).sum(axis=1)
        r = safe_float(data[item].corr(others_sum))
        valid = r is not None and r >= VALIDITY_THRESHOLD
        if r is None:
            detail = "Tidak dapat dihitung."
        elif valid:
            detail = f"Item valid (r = {r:.3f} >= {VALIDITY_THRESHOLD:.2f})."
        else:
            detail = f"Item tidak valid / perlu ditinjau (r = {r:.3f} < {VALIDITY_THRESHOLD:.2f})."
        results.append({"item": item, "r_item_total": r, "valid": valid, "detail": detail})
    return results
