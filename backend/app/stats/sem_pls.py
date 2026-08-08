import pandas as pd

from app.core.schemas import SemConstruct, SemPath
from app.stats._utils import safe_float
from app.vendor.plspm.config import MV, Config, Structure
from app.vendor.plspm.mode import Mode
from app.vendor.plspm.plspm import Plspm
from app.vendor.plspm.scheme import Scheme

MIN_ROWS = 30
SIGNIFICANCE_ALPHA = 0.05


def _build_config(constructs: list[SemConstruct], paths: list[SemPath]) -> Config:
    construct_names = {c.name for c in constructs}
    for p in paths:
        if p.source not in construct_names:
            raise ValueError(f"Konstruk '{p.source}' pada jalur tidak ditemukan di daftar konstruk.")
        if p.target not in construct_names:
            raise ValueError(f"Konstruk '{p.target}' pada jalur tidak ditemukan di daftar konstruk.")
        if p.source == p.target:
            raise ValueError(f"Jalur tidak boleh menghubungkan konstruk '{p.source}' ke dirinya sendiri.")

    structure = Structure()
    for p in paths:
        structure.add_path([p.source], [p.target])
    try:
        path_matrix = structure.path()
    except Exception as exc:
        raise ValueError(f"Struktur jalur tidak valid (kemungkinan ada siklus): {exc}") from exc

    unreferenced = construct_names - set(path_matrix.columns)
    if unreferenced:
        raise ValueError(
            f"Konstruk berikut tidak terhubung ke jalur manapun: {', '.join(sorted(unreferenced))}. "
            "Setiap konstruk harus menjadi sumber atau tujuan minimal satu jalur."
        )

    config = Config(path_matrix, scaled=True)
    for c in constructs:
        if len(c.indicators) < 2:
            raise ValueError(f"Konstruk '{c.name}' butuh minimal 2 indikator untuk model reflektif.")
        try:
            config.add_lv(c.name, Mode.A, *[MV(ind) for ind in c.indicators])
        except ValueError as exc:
            raise ValueError(f"Konstruk '{c.name}': {exc}") from exc
    return config


def _prepare_data(df: pd.DataFrame, constructs: list[SemConstruct]) -> pd.DataFrame:
    all_indicators = [ind for c in constructs for ind in c.indicators]
    missing_cols = [ind for ind in all_indicators if ind not in df.columns]
    if missing_cols:
        raise ValueError(f"Kolom berikut tidak ditemukan di data: {', '.join(missing_cols)}.")

    data = df[all_indicators].apply(pd.to_numeric, errors="coerce").dropna()
    if len(data) < MIN_ROWS:
        raise ValueError(
            f"Hanya {len(data)} baris data lengkap (tanpa nilai kosong pada indikator terpilih) -- "
            f"minimal {MIN_ROWS} baris dibutuhkan untuk estimasi SEM-PLS yang stabil."
        )
    return data


def _fornell_larcker(scores: pd.DataFrame, ave_by_construct: dict[str, float | None]) -> list[dict]:
    """Fornell-Larcker discriminant validity criterion: a construct's sqrt(AVE)
    should exceed its correlation with every other construct in the model --
    otherwise it shares more variance with another construct than with its own
    indicators, meaning the two aren't empirically distinct constructs."""
    corr = scores.corr()
    rows = []
    for construct in scores.columns:
        ave = ave_by_construct.get(construct)
        sqrt_ave = safe_float(ave**0.5) if ave is not None and ave >= 0 else None
        correlations = {
            other: safe_float(corr.loc[construct, other]) for other in scores.columns if other != construct
        }
        present = [v for v in correlations.values() if v is not None]
        max_corr = max((abs(v) for v in present), default=None)
        rows.append(
            {
                "construct": construct,
                "sqrt_ave": sqrt_ave,
                "max_correlation_with_other": max_corr,
                "passes": bool(sqrt_ave is not None and max_corr is not None and sqrt_ave > max_corr),
                "correlations": correlations,
            }
        )
    return rows


def run(df: pd.DataFrame, constructs: list[SemConstruct], paths: list[SemPath]) -> dict:
    if len(constructs) < 2:
        raise ValueError("Minimal 2 konstruk dibutuhkan untuk model SEM-PLS.")
    if len(paths) < 1:
        raise ValueError("Minimal 1 jalur struktural dibutuhkan untuk menghubungkan konstruk.")

    config = _build_config(constructs, paths)
    data = _prepare_data(df, constructs)

    try:
        model = Plspm(data, config, Scheme.PATH, bootstrap=False)
    except Exception as exc:
        raise ValueError(f"Model SEM-PLS gagal dihitung: {exc}") from exc

    mv_to_construct = {ind: c.name for c in constructs for ind in c.indicators}

    outer_df = model.outer_model()
    loadings = [
        {
            "construct": mv_to_construct[mv],
            "indicator": mv,
            "loading": safe_float(row["loading"]),
            "communality": safe_float(row["communality"]),
        }
        for mv, row in outer_df.iterrows()
    ]

    summary_df = model.inner_summary()
    ave_by_construct = {lv: safe_float(row["ave"]) for lv, row in summary_df.iterrows()}

    unidim_df = model.unidimensionality()
    reliability = [
        {
            "construct": lv,
            "cronbach_alpha": safe_float(row["cronbach_alpha"]),
            "composite_reliability": safe_float(row["dillon_goldstein_rho"]),
            "ave": ave_by_construct.get(lv),
        }
        for lv, row in unidim_df.iterrows()
    ]

    r_squared = [
        {
            "construct": lv,
            "type": row["type"],
            "r_squared": safe_float(row["r_squared"]) if row["type"] == "Endogenous" else None,
            "r_squared_adj": safe_float(row["r_squared_adj"]) if row["type"] == "Endogenous" else None,
        }
        for lv, row in summary_df.iterrows()
    ]

    inner_df = model.inner_model()
    path_coefficients = [
        {
            "source": row["from"],
            "target": row["to"],
            "coefficient": safe_float(row["estimate"]),
            "std_error": safe_float(row["std error"]),
            "t_value": safe_float(row["t"]),
            "p_value": safe_float(row["p>|t|"]),
            "significant": (bool(row["p>|t|"] < SIGNIFICANCE_ALPHA) if pd.notna(row["p>|t|"]) else None),
        }
        for _, row in inner_df.iterrows()
    ]

    effects_df = model.effects()
    effects = [
        {
            "source": row["from"],
            "target": row["to"],
            "direct": safe_float(row["direct"]),
            "indirect": safe_float(row["indirect"]),
            "total": safe_float(row["total"]),
        }
        for _, row in effects_df.iterrows()
    ]

    discriminant_validity = _fornell_larcker(model.scores(), ave_by_construct)

    return {
        "n": int(len(data)),
        "loadings": loadings,
        "reliability": reliability,
        "path_coefficients": path_coefficients,
        "r_squared": r_squared,
        "effects": effects,
        "discriminant_validity": discriminant_validity,
    }


def run_bootstrap(
    df: pd.DataFrame,
    constructs: list[SemConstruct],
    paths: list[SemPath],
    iterations: int = 300,
    processes: int = 4,
) -> list[dict]:
    """Proper PLS-SEM significance testing uses bootstrap resampling, not the
    OLS-regression t/p-values in run()'s path_coefficients -- PLS composite
    scores don't satisfy OLS's distributional assumptions, so bootstrap is
    the methodologically standard approach (and what SmartPLS reports).
    Deliberately a separate, explicitly-triggered call: ~300 iterations takes
    on the order of a minute even with multiple processes, too slow to run
    synchronously as part of every model run."""
    config = _build_config(constructs, paths)
    data = _prepare_data(df, constructs)

    processes = max(1, min(processes, iterations))
    iterations = processes * max(1, iterations // processes)

    try:
        model = Plspm(data, config, Scheme.PATH, bootstrap=True, bootstrap_iterations=iterations, processes=processes)
    except Exception as exc:
        raise ValueError(f"Bootstrap gagal dihitung: {exc}") from exc

    bs_paths = model.bootstrap().paths()
    rows = []
    for idx, row in bs_paths.iterrows():
        source, target = idx.split(" -> ")
        ci_lower = safe_float(row["perc.025"])
        ci_upper = safe_float(row["perc.975"])
        significant = None
        if ci_lower is not None and ci_upper is not None:
            significant = bool(ci_lower > 0 or ci_upper < 0)
        rows.append(
            {
                "source": source,
                "target": target,
                "original": safe_float(row["original"]),
                "mean": safe_float(row["mean"]),
                "std_error": safe_float(row["std.error"]),
                "ci_lower": ci_lower,
                "ci_upper": ci_upper,
                "t_value": safe_float(row["t stat."]),
                "significant": significant,
            }
        )
    return rows
