import base64
import io

import matplotlib
import pandas as pd

matplotlib.use("Agg")
import matplotlib.pyplot as plt
from sklearn.metrics import auc as sk_auc
from sklearn.metrics import roc_curve as sk_roc_curve

from app.stats._utils import numeric_series
from app.stats.logistic import _encode_binary
from app.stats.survival import _kaplan_meier


def _fig_to_base64(fig) -> str:
    buf = io.BytesIO()
    fig.savefig(buf, format="png", dpi=110, bbox_inches="tight")
    plt.close(fig)
    buf.seek(0)
    return base64.b64encode(buf.read()).decode("ascii")


def histogram(df, col: str, caption_id: str = "histogram") -> dict:
    series = numeric_series(df, col)
    fig, ax = plt.subplots(figsize=(5, 3.5))
    ax.hist(series, bins=min(15, max(5, len(series) // 3)), color="#0E7C7B", edgecolor="white")
    ax.set_xlabel(col)
    ax.set_ylabel("Frekuensi")
    ax.set_title(f"Histogram {col}")
    return {"type": "histogram", "caption_id": caption_id, "image_base64": _fig_to_base64(fig)}


def boxplot(df, dv: str, group_col: str | None = None, caption_id: str = "boxplot") -> dict:
    fig, ax = plt.subplots(figsize=(5, 3.5))
    if group_col:
        groups = [numeric_series(sub, dv) for _, sub in df.groupby(group_col, observed=True)]
        labels = [str(name) for name, _ in df.groupby(group_col, observed=True)]
        ax.boxplot(groups, tick_labels=labels)
        ax.set_xlabel(group_col)
    else:
        ax.boxplot([numeric_series(df, dv)], tick_labels=[dv])
    ax.set_ylabel(dv)
    ax.set_title(f"Boxplot {dv}")
    return {"type": "boxplot", "caption_id": caption_id, "image_base64": _fig_to_base64(fig)}


def scatter(df, x_col: str, y_col: str, caption_id: str = "scatter") -> dict:
    x = numeric_series(df, x_col)
    y = numeric_series(df, y_col)
    n = min(len(x), len(y))
    fig, ax = plt.subplots(figsize=(5, 3.5))
    ax.scatter(x.iloc[:n], y.iloc[:n], color="#0E7C7B", alpha=0.7)
    ax.set_xlabel(x_col)
    ax.set_ylabel(y_col)
    ax.set_title(f"Scatter Plot {x_col} vs {y_col}")
    return {"type": "scatter", "caption_id": caption_id, "image_base64": _fig_to_base64(fig)}


def roc_curve_chart(df, score_col: str, outcome_col: str, caption_id: str = "roc_curve") -> dict:
    data = df[[score_col, outcome_col]].dropna()
    y_true, _ = _encode_binary(data[outcome_col], outcome_col)
    fpr, tpr, _ = sk_roc_curve(y_true, data[score_col].astype(float))
    area = sk_auc(fpr, tpr)

    fig, ax = plt.subplots(figsize=(4.5, 4.5))
    ax.plot(fpr, tpr, color="#0E7C7B", linewidth=2, label=f"AUC = {area:.3f}")
    ax.plot([0, 1], [0, 1], color="#999999", linestyle="--", linewidth=1, label="Referensi (acak)")
    ax.set_xlabel("1 - Spesifisitas (False Positive Rate)")
    ax.set_ylabel("Sensitivitas (True Positive Rate)")
    ax.set_title(f"Kurva ROC: {score_col} vs {outcome_col}")
    ax.legend(loc="lower right", fontsize=8)
    return {"type": "roc_curve", "caption_id": caption_id, "image_base64": _fig_to_base64(fig)}


def km_curve_chart(df, duration_col: str, event_col: str, group_col: str | None = None, caption_id: str = "km_curve") -> dict:
    cols = [duration_col, event_col] + ([group_col] if group_col else [])
    data = df[cols].dropna()
    events, _ = _encode_binary(data[event_col], event_col)
    durations = pd.to_numeric(data[duration_col], errors="coerce").to_numpy(dtype=float)
    events = events.to_numpy(dtype=float)

    fig, ax = plt.subplots(figsize=(5, 3.5))

    def _plot_one(sub_durations, sub_events, label, color):
        km = _kaplan_meier(sub_durations, sub_events)
        times = [0.0] + [p["time"] for p in km["curve"]]
        surv = [1.0] + [p["survival"] for p in km["curve"]]
        ax.step(times, surv, where="post", label=label, color=color, linewidth=2)

    if group_col:
        group_values = data[group_col].astype(str).to_numpy()
        palette = ["#0E7C7B", "#D96C06", "#6C3EB5", "#B5303E"]
        for i, g in enumerate(sorted(pd.unique(group_values).tolist())):
            mask = group_values == g
            _plot_one(durations[mask], events[mask], str(g), palette[i % len(palette)])
        ax.legend(fontsize=8)
    else:
        _plot_one(durations, events, duration_col, "#0E7C7B")

    ax.set_xlabel(duration_col)
    ax.set_ylabel("Probabilitas Bertahan (Survival)")
    ax.set_ylim(-0.02, 1.02)
    ax.set_title("Kurva Kaplan-Meier")
    return {"type": "km_curve", "caption_id": caption_id, "image_base64": _fig_to_base64(fig)}
