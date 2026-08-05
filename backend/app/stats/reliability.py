import pingouin as pg

from app.stats._utils import safe_float


def run_cronbach(df, items: list[str]) -> dict:
    data = df[items].apply(lambda s: s.astype(float))
    alpha, ci = pg.cronbach_alpha(data=data)
    interpretation = (
        "sangat baik" if alpha >= 0.9 else
        "baik" if alpha >= 0.8 else
        "dapat diterima" if alpha >= 0.7 else
        "diragukan" if alpha >= 0.6 else
        "buruk"
    )
    return {
        "descriptives": [{"group": item, "n": int(data[item].count())} for item in items],
        "test_statistics": {
            "statistic_name": "Cronbach's Alpha",
            "statistic_value": safe_float(alpha),
            "df": None,
            "p_value": None,
            "effect_size": None,
            "confidence_interval": [safe_float(ci[0]), safe_float(ci[1])],
            "power": None,
            "n_items": len(items),
            "interpretation": f"Reliabilitas {interpretation} (alpha={safe_float(alpha):.3f}).",
        },
    }
