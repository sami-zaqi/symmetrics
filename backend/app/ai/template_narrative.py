"""Free, deterministic narrative generator -- no AI/API call, no cost.
Fills a fixed Indonesian academic sentence template with numbers copied
directly from the already-computed TestResult. Used as the default
fallback when the paid Claude narrative layer is unavailable."""

from app.ai.safety_filters import enforce
from app.core.schemas import TestResult


def _p(p: float | None) -> str:
    if p is None:
        return "tidak tersedia"
    return "< 0.001" if p < 0.001 else f"= {p:.3f}"


def _n(x: float | None, d: int = 2) -> str:
    return "-" if x is None else f"{x:.{d}f}"


def _sig(p: float | None) -> str:
    if p is None:
        return "tidak dapat disimpulkan"
    return "signifikan" if p < 0.05 else "tidak signifikan"


def _assumption_sentence(result: TestResult) -> str:
    a = result.assumptions
    if not a or not a.checked or not a.outcomes:
        return ""
    lines = " ".join(o.detail for o in a.outcomes)
    return f"Hasil uji asumsi: {lines} "


def _method_note(result: TestResult) -> str:
    if result.method_used == "nonparametric_fallback" and result.fallback_reason:
        return f"{result.fallback_reason.rstrip('.')}, sehingga digunakan uji non-parametrik. "
    return ""


def _group_desc(result: TestResult) -> str:
    parts = []
    for d in result.descriptives:
        label = d.get("group") or d.get("variable") or ""
        if "mean" in d and d.get("mean") is not None:
            parts.append(f"{label} (n={d.get('n')}, M={_n(d.get('mean'))}, SD={_n(d.get('sd'))})")
        elif "n" in d:
            parts.append(f"{label} (n={d.get('n')})")
    return "; ".join(parts)


def _two_group_compare(result: TestResult, stat_label: str) -> str:
    stats = result.test_statistics
    df = stats.get("df")
    df_str = f"({_n(df, 0)})" if isinstance(df, (int, float)) else ""
    effect = stats.get("effect_size") or {}
    effect_str = (
        f" {effect.get('name')} = {_n(effect.get('value'))}."
        if effect.get("value") is not None
        else ""
    )
    return (
        f"{_assumption_sentence(result)}{_method_note(result)}"
        f"Perbandingan dilakukan pada kelompok {_group_desc(result)}. "
        f"Hasil {result.test_name_id.lower()} menunjukkan {stat_label}{df_str} = "
        f"{_n(stats.get('statistic_value'))}, p {_p(stats.get('p_value'))}. "
        f"Perbedaan tersebut secara statistik {_sig(stats.get('p_value'))} pada taraf signifikansi 0.05."
        f"{effect_str}"
    )


def _anova_family(result: TestResult, stat_label: str) -> str:
    stats = result.test_statistics
    df = stats.get("df")
    df_str = f"({_n(df[0], 0)}, {_n(df[1], 0)})" if isinstance(df, list) else f"({_n(df, 0)})"
    return (
        f"{_assumption_sentence(result)}{_method_note(result)}"
        f"Perbandingan dilakukan pada kelompok {_group_desc(result)}. "
        f"Hasil {result.test_name_id.lower()} menunjukkan {stat_label}{df_str} = "
        f"{_n(stats.get('statistic_value'))}, p {_p(stats.get('p_value'))}. "
        f"Perbedaan antar kelompok tersebut secara statistik {_sig(stats.get('p_value'))} pada taraf signifikansi 0.05."
    )


def _correlation(result: TestResult) -> str:
    stats = result.test_statistics
    r = stats.get("statistic_value")
    strength = (
        "sangat lemah" if r is None else
        "sangat kuat" if abs(r) >= 0.9 else
        "kuat" if abs(r) >= 0.7 else
        "sedang" if abs(r) >= 0.5 else
        "lemah" if abs(r) >= 0.3 else
        "sangat lemah"
    )
    direction = "positif" if (r or 0) >= 0 else "negatif"
    return (
        f"Analisis {result.test_name_id.lower()} dilakukan pada variabel {_group_desc(result)}. "
        f"Diperoleh koefisien korelasi r = {_n(r)}, p {_p(stats.get('p_value'))}, "
        f"yang menunjukkan hubungan {direction} dengan kekuatan {strength} dan secara statistik "
        f"{_sig(stats.get('p_value'))}. Hasil ini bersifat asosiatif dan tidak menunjukkan hubungan sebab-akibat."
    )


def _regression(result: TestResult) -> str:
    stats = result.test_statistics
    return (
        f"Analisis regresi linear sederhana dilakukan pada variabel {_group_desc(result)}. "
        f"Diperoleh persamaan {stats.get('equation', '-')} dengan R-squared = {_n(stats.get('r_squared'))}, "
        f"p {_p(stats.get('p_value'))}. Model ini secara statistik {_sig(stats.get('p_value'))} dalam "
        f"memprediksi variabel dependen, dan hasil ini bersifat asosiatif, bukan sebab-akibat."
    )


def _chi_square(result: TestResult) -> str:
    stats = result.test_statistics
    effect = stats.get("effect_size") or {}
    effect_name = effect.get("name") or "Cramer's V"
    return (
        f"Uji Chi-Square dilakukan untuk menguji hubungan antar dua variabel kategorik. "
        f"Diperoleh chi2 = {_n(stats.get('statistic_value'))}, df = {_n(stats.get('df'), 0)}, "
        f"p {_p(stats.get('p_value'))} ({effect_name} = {_n(effect.get('value'))}). "
        f"Hubungan antar kedua variabel tersebut secara statistik {_sig(stats.get('p_value'))} dan "
        f"bersifat asosiatif, bukan sebab-akibat."
    )


def _cronbach(result: TestResult) -> str:
    stats = result.test_statistics
    return (
        f"Uji reliabilitas dilakukan pada {stats.get('n_items')} item kuesioner. "
        f"Diperoleh nilai Cronbach's Alpha = {_n(stats.get('statistic_value'), 3)}. "
        f"{stats.get('interpretation', '')}"
    )


def _descriptive(result: TestResult) -> str:
    return f"Analisis statistik deskriptif dilakukan pada variabel: {_group_desc(result)}."


BUILDERS = {
    "descriptive_statistics": _descriptive,
    "independent_ttest": lambda r: _two_group_compare(r, "t"),
    "mann_whitney": lambda r: _two_group_compare(r, "U"),
    "paired_ttest": lambda r: _two_group_compare(r, "t"),
    "wilcoxon": lambda r: _two_group_compare(r, "W"),
    "oneway_anova": lambda r: _anova_family(r, "F"),
    "kruskal_wallis": lambda r: _anova_family(r, "H"),
    "pearson_correlation": _correlation,
    "spearman_correlation": _correlation,
    "simple_linear_regression": _regression,
    "chi_square": _chi_square,
    "cronbach_alpha": _cronbach,
}


def generate(result: TestResult) -> tuple[str, bool]:
    builder = BUILDERS.get(result.test_id)
    raw = (
        builder(result)
        if builder
        else f"Hasil uji {result.test_name_id} tersedia pada data terstruktur; "
        f"narasi template belum didukung untuk jenis uji ini."
    )
    return enforce(raw, result.test_id)
