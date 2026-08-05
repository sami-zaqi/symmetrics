import base64
import io

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt

from app.stats._utils import numeric_series


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
