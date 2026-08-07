import pingouin as pg

from app.stats import validity
from app.stats._utils import safe_float


def run_cronbach(df, items: list[str]) -> dict:
    data = df[items].apply(lambda s: s.astype(float))
    alpha, ci = pg.cronbach_alpha(data=data)
    alpha = safe_float(alpha)
    interpretation = (
        "sangat baik" if alpha >= 0.9 else
        "baik" if alpha >= 0.8 else
        "dapat diterima" if alpha >= 0.7 else
        "diragukan" if alpha >= 0.6 else
        "buruk"
    )

    item_validity = validity.run_item_total_correlation(df, items)
    validity_by_item = {v["item"]: v for v in item_validity}

    descriptives = []
    for item in items:
        v = validity_by_item[item]
        descriptives.append(
            {
                "group": item,
                "n": int(data[item].count()),
                "r_item_total": v["r_item_total"],
                "valid": v["valid"],
                "keterangan_validitas": v["detail"],
            }
        )

    invalid_items = [v["item"] for v in item_validity if not v["valid"]]
    validity_note = (
        f"Item berikut memiliki korelasi item-total di bawah {validity.VALIDITY_THRESHOLD:.2f} "
        f"dan perlu ditinjau: {', '.join(invalid_items)}."
        if invalid_items
        else f"Seluruh item memiliki korelasi item-total >= {validity.VALIDITY_THRESHOLD:.2f} (valid)."
    )

    return {
        "descriptives": descriptives,
        "test_statistics": {
            "statistic_name": "Cronbach's Alpha",
            "statistic_value": alpha,
            "df": None,
            "p_value": None,
            "effect_size": None,
            "confidence_interval": [safe_float(ci[0]), safe_float(ci[1])],
            "power": None,
            "n_items": len(items),
            "interpretation": f"Reliabilitas {interpretation} (alpha={alpha:.3f}).",
            "validity_note": validity_note,
        },
    }
