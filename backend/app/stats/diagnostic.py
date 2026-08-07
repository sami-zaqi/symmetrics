import pandas as pd

from app.stats._utils import safe_float
from app.stats.logistic import _encode_binary


def run(df: pd.DataFrame, test_col: str, disease_col: str) -> dict:
    if not test_col or not disease_col:
        raise ValueError("Pilih variabel hasil uji diagnostik dan variabel status penyakit (baku emas).")

    data = df[[test_col, disease_col]].dropna()
    if len(data) < 4:
        raise ValueError("Jumlah data valid terlalu sedikit untuk uji diagnostik.")

    test_encoded, test_encoding = _encode_binary(data[test_col], test_col)
    disease_encoded, disease_encoding = _encode_binary(data[disease_col], disease_col)

    tp = int(((test_encoded == 1) & (disease_encoded == 1)).sum())
    fp = int(((test_encoded == 1) & (disease_encoded == 0)).sum())
    fn = int(((test_encoded == 0) & (disease_encoded == 1)).sum())
    tn = int(((test_encoded == 0) & (disease_encoded == 0)).sum())

    sensitivity = safe_float(tp / (tp + fn)) if (tp + fn) > 0 else None
    specificity = safe_float(tn / (tn + fp)) if (tn + fp) > 0 else None
    ppv = safe_float(tp / (tp + fp)) if (tp + fp) > 0 else None
    npv = safe_float(tn / (tn + fn)) if (tn + fn) > 0 else None
    total = tp + fp + fn + tn
    accuracy = safe_float((tp + tn) / total) if total > 0 else None
    lr_positive = (
        safe_float(sensitivity / (1 - specificity))
        if sensitivity is not None and specificity is not None and specificity < 1.0
        else None
    )
    lr_negative = (
        safe_float((1 - sensitivity) / specificity)
        if sensitivity is not None and specificity is not None and specificity > 0.0
        else None
    )

    disease_positive_label = f"{disease_col} Positif ({disease_encoding['kejadian (1)']})"
    disease_negative_label = f"{disease_col} Negatif ({disease_encoding['referensi (0)']})"

    descriptives = [
        {
            "hasil_uji": f"Positif ({test_encoding['kejadian (1)']})",
            disease_positive_label: tp,
            disease_negative_label: fp,
            "total": tp + fp,
        },
        {
            "hasil_uji": f"Negatif ({test_encoding['referensi (0)']})",
            disease_positive_label: fn,
            disease_negative_label: tn,
            "total": fn + tn,
        },
    ]

    return {
        "descriptives": descriptives,
        "test_statistics": {
            "tp": tp,
            "fp": fp,
            "fn": fn,
            "tn": tn,
            "sensitivity": sensitivity,
            "specificity": specificity,
            "ppv": ppv,
            "npv": npv,
            "accuracy": accuracy,
            "positive_likelihood_ratio": lr_positive,
            "negative_likelihood_ratio": lr_negative,
            "test_encoding": test_encoding,
            "disease_encoding": disease_encoding,
        },
    }
