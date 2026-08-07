import math

import numpy as np
import pandas as pd
from scipy import stats as scipy_stats

from app.stats._utils import safe_float
from app.stats.logistic import _encode_binary


def _kaplan_meier(durations: np.ndarray, events: np.ndarray) -> dict:
    """Product-limit (Kaplan-Meier) estimator with Greenwood's formula for the
    variance of S(t) -- implemented from first principles (no `lifelines`
    dependency, to avoid a pandas<3.0 downgrade). CI is the simple linear
    Greenwood interval, clipped to [0, 1]."""
    n_total = len(durations)
    event_times = np.unique(durations[events == 1])

    survival = 1.0
    var_sum = 0.0
    curve = []

    for t in event_times:
        n_i = int((durations >= t).sum())
        d_i = int(((durations == t) & (events == 1)).sum())
        if n_i == 0:
            continue
        survival *= 1 - d_i / n_i
        if n_i > d_i:
            var_sum += d_i / (n_i * (n_i - d_i))
        variance = (survival**2) * var_sum
        se = math.sqrt(max(variance, 0.0))
        curve.append(
            {
                "time": safe_float(t),
                "n_at_risk": n_i,
                "n_events": d_i,
                "survival": safe_float(survival),
                "ci_lower": safe_float(max(0.0, survival - 1.96 * se)),
                "ci_upper": safe_float(min(1.0, survival + 1.96 * se)),
            }
        )

    median_survival = None
    for point in curve:
        if point["survival"] is not None and point["survival"] <= 0.5:
            median_survival = point["time"]
            break

    return {
        "curve": curve,
        "median_survival": median_survival,
        "n": n_total,
        "n_events": int(events.sum()),
    }


def _log_rank_test(durations: np.ndarray, events: np.ndarray, groups: np.ndarray, group_labels: tuple[str, str]) -> dict:
    """Two-group log-rank test (Mantel-Cox), the standard formula from any
    survival-analysis textbook (e.g. Kleinbaum & Klein). Only 2-group
    comparison is supported -- the common thesis case is treatment vs control."""
    g1, g2 = group_labels
    event_times = np.unique(durations[events == 1])

    observed_1 = 0.0
    expected_1 = 0.0
    variance = 0.0

    for t in event_times:
        at_risk = durations >= t
        n = int(at_risk.sum())
        n1 = int((at_risk & (groups == g1)).sum())
        n2 = n - n1
        at_event = (durations == t) & (events == 1)
        d = int(at_event.sum())
        d1 = int((at_event & (groups == g1)).sum())
        if n < 2 or d == 0:
            continue
        observed_1 += d1
        expected_1 += d * (n1 / n)
        variance += d * (n - d) * n1 * n2 / (n**2 * (n - 1))

    chi2_stat = ((observed_1 - expected_1) ** 2 / variance) if variance > 0 else 0.0
    p_value = safe_float(1 - scipy_stats.chi2.cdf(chi2_stat, df=1))
    return {
        "statistic": safe_float(chi2_stat),
        "df": 1,
        "p_value": p_value,
        "group_compared": g1,
        "observed_events": safe_float(observed_1),
        "expected_events": safe_float(expected_1),
    }


def run(df: pd.DataFrame, duration_col: str, event_col: str, group_col: str | None = None) -> dict:
    if not duration_col or not event_col:
        raise ValueError("Pilih variabel durasi (waktu) dan variabel status kejadian.")

    cols = [duration_col, event_col] + ([group_col] if group_col else [])
    data = df[cols].dropna()
    if len(data) < 4:
        raise ValueError("Jumlah data valid terlalu sedikit untuk analisis kelangsungan hidup.")

    durations = pd.to_numeric(data[duration_col], errors="coerce")
    if durations.isna().any():
        raise ValueError(f"Variabel '{duration_col}' harus numerik (waktu/durasi).")
    durations = durations.to_numpy(dtype=float)
    if (durations < 0).any():
        raise ValueError(f"Variabel '{duration_col}' tidak boleh bernilai negatif.")

    events_series, event_encoding = _encode_binary(data[event_col], event_col)
    events = events_series.to_numpy(dtype=float)

    if group_col:
        group_values = data[group_col].astype(str).to_numpy()
        unique_groups = sorted(pd.unique(group_values).tolist())
        if len(unique_groups) != 2:
            raise ValueError(
                f"Variabel kelompok '{group_col}' harus memiliki tepat 2 kategori untuk uji log-rank, "
                f"ditemukan {len(unique_groups)}."
            )

        descriptives = []
        curves: dict[str, dict] = {}
        for g in unique_groups:
            mask = group_values == g
            km = _kaplan_meier(durations[mask], events[mask])
            curves[g] = km
            descriptives.append(
                {
                    "kelompok": g,
                    "n": km["n"],
                    "jumlah_kejadian": km["n_events"],
                    "median_survival": km["median_survival"],
                }
            )
        log_rank = _log_rank_test(durations, events, group_values, (unique_groups[0], unique_groups[1]))
        return {
            "descriptives": descriptives,
            "test_statistics": {
                "log_rank": log_rank,
                "group_variable": group_col,
                "groups": unique_groups,
                "curves": {g: c["curve"] for g, c in curves.items()},
                "event_encoding": {event_col: event_encoding},
            },
        }

    km = _kaplan_meier(durations, events)
    return {
        "descriptives": [
            {"n": km["n"], "jumlah_kejadian": km["n_events"], "median_survival": km["median_survival"]}
        ],
        "test_statistics": {
            "median_survival": km["median_survival"],
            "n": km["n"],
            "n_events": km["n_events"],
            "survival_curve": km["curve"],
            "event_encoding": {event_col: event_encoding},
        },
    }
