import math

import numpy as np
from sklearn.metrics import auc, roc_curve

from app.stats._utils import group_descriptives, safe_float
from app.stats.logistic import _encode_binary


def _auc_ci95_hanley_mcneil(area: float, n_positive: int, n_negative: int) -> list[float] | None:
    """Hanley-McNeil (1982) asymptotic standard error for AUC -- avoids pulling
    in a bootstrap/DeLong dependency just for a confidence interval."""
    if n_positive == 0 or n_negative == 0:
        return None
    q1 = area / (2 - area) if area < 2 else 0.0
    q2 = (2 * area**2) / (1 + area)
    variance = (
        area * (1 - area)
        + (n_positive - 1) * (q1 - area**2)
        + (n_negative - 1) * (q2 - area**2)
    ) / (n_positive * n_negative)
    if variance < 0:
        return None
    se = math.sqrt(variance)
    return [safe_float(max(0.0, area - 1.96 * se)), safe_float(min(1.0, area + 1.96 * se))]


def _interpret_auc(area: float) -> str:
    if area >= 0.9:
        return "sangat baik (outstanding)"
    if area >= 0.8:
        return "baik (excellent)"
    if area >= 0.7:
        return "dapat diterima (acceptable)"
    if area > 0.5:
        return "lemah, hampir tidak lebih baik dari tebakan acak"
    return "tidak memiliki kemampuan diskriminasi (setara tebakan acak)"


def run(df, score_col: str, outcome_col: str) -> dict:
    if not score_col or not outcome_col:
        raise ValueError("Pilih variabel skor/prediktor dan variabel outcome (baku emas, biner).")

    data = df[[score_col, outcome_col]].dropna()
    if len(data) < 4:
        raise ValueError("Jumlah data valid terlalu sedikit untuk analisis ROC.")

    y_true, outcome_encoding = _encode_binary(data[outcome_col], outcome_col)
    y_score = data[score_col].astype(float)

    n_positive = int((y_true == 1).sum())
    n_negative = int((y_true == 0).sum())
    if n_positive == 0 or n_negative == 0:
        raise ValueError(
            f"Variabel '{outcome_col}' harus memiliki kedua kategori (positif dan negatif) untuk analisis ROC."
        )

    fpr, tpr, thresholds = roc_curve(y_true, y_score)
    area = safe_float(auc(fpr, tpr))

    youden = tpr - fpr
    best_idx = int(np.argmax(youden))
    optimal_cutoff = safe_float(thresholds[best_idx])
    sensitivity_at_cutoff = safe_float(tpr[best_idx])
    specificity_at_cutoff = safe_float(1 - fpr[best_idx])

    # Downsample the curve for the chart/response payload -- a continuous score
    # can produce as many threshold points as there are unique values, which is
    # far more than needed to draw a legible curve.
    if len(fpr) > 50:
        idx = np.linspace(0, len(fpr) - 1, 50).round().astype(int)
        idx = np.unique(idx)
    else:
        idx = np.arange(len(fpr))
    curve_points = [{"fpr": safe_float(fpr[i]), "tpr": safe_float(tpr[i])} for i in idx]

    return {
        "descriptives": group_descriptives(data, score_col, outcome_col),
        "test_statistics": {
            "auc": area,
            "auc_ci95": _auc_ci95_hanley_mcneil(area, n_positive, n_negative) if area is not None else None,
            "auc_interpretation": _interpret_auc(area) if area is not None else None,
            "n_positive": n_positive,
            "n_negative": n_negative,
            "optimal_cutoff": optimal_cutoff,
            "sensitivity_at_cutoff": sensitivity_at_cutoff,
            "specificity_at_cutoff": specificity_at_cutoff,
            "youden_index": safe_float(youden[best_idx]),
            "outcome_encoding": {outcome_col: outcome_encoding},
            "roc_curve_points": curve_points,
        },
    }
