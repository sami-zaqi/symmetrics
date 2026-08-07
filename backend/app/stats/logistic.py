import numpy as np
import pandas as pd
import statsmodels.api as sm

from app.stats._utils import safe_float

# Alphabetical sort alone is an unsafe default for which category becomes the
# "kejadian (1)" (event/positive) label: e.g. sorted(["Sakit", "Sehat"]) puts
# "Sehat" (healthy) second, silently flipping sensitivity/specificity or OR
# direction for a health outcome. These common Indonesian binary-outcome terms
# are checked first; alphabetical order remains the fallback for anything else
# (numeric codes, unrecognized wording), and the resulting mapping is always
# returned explicitly so the narrative layer never has to guess.
_POSITIVE_HINTS = {
    "ya", "positif", "sakit", "ada", "terpapar", "berisiko", "kasus",
    "obesitas", "hipertensi", "meninggal", "abnormal", "gagal",
}
_NEGATIVE_HINTS = {
    "tidak", "negatif", "sehat", "tidak ada", "tidak terpapar",
    "tidak berisiko", "kontrol", "normal", "hidup", "berhasil",
}


def _infer_positive_label(uniques: list) -> object | None:
    normalized = {str(u).strip().lower(): u for u in uniques}
    positives = [orig for norm, orig in normalized.items() if norm in _POSITIVE_HINTS]
    negatives = [orig for norm, orig in normalized.items() if norm in _NEGATIVE_HINTS]
    if len(positives) == 1 and len(negatives) == 1 and positives[0] != negatives[0]:
        return positives[0]
    return None


def _encode_binary(series: pd.Series, col_name: str) -> tuple[pd.Series, dict]:
    is_numeric = pd.api.types.is_numeric_dtype(series)
    if is_numeric:
        uniques = sorted(series.dropna().unique())
    else:
        uniques = sorted(series.dropna().unique(), key=str)
    if len(uniques) != 2:
        raise ValueError(
            f"Variabel '{col_name}' harus biner (persis 2 kategori/nilai), ditemukan {len(uniques)}."
        )

    positive = None if is_numeric else _infer_positive_label(uniques)
    if positive is not None:
        reference = uniques[0] if uniques[1] == positive else uniques[1]
    else:
        reference, positive = uniques[0], uniques[1]

    mapping = {reference: 0, positive: 1}
    encoded = series.map(mapping).astype(float)
    return encoded, {"referensi (0)": str(reference), "kejadian (1)": str(positive)}


def run_binary(df: pd.DataFrame, dependent: str, independents: list[str]) -> dict:
    if not dependent:
        raise ValueError("Pilih variabel dependen (kejadian/outcome).")
    if not independents:
        raise ValueError("Pilih minimal satu variabel independen (prediktor).")

    data = df[[dependent, *independents]].dropna()
    if len(data) < len(independents) + 2:
        raise ValueError("Jumlah data valid (tanpa nilai kosong) terlalu sedikit untuk regresi logistik.")

    y, dependent_encoding = _encode_binary(data[dependent], dependent)

    predictor_encodings: dict[str, dict] = {}
    x_columns: dict[str, pd.Series] = {}
    for col in independents:
        series = data[col]
        if pd.api.types.is_numeric_dtype(series) and series.nunique() > 2:
            x_columns[col] = series.astype(float)
        else:
            encoded, mapping = _encode_binary(series, col)
            x_columns[col] = encoded
            predictor_encodings[col] = mapping

    X = pd.DataFrame(x_columns, index=data.index)
    X = sm.add_constant(X, has_constant="add")

    try:
        fitted = sm.Logit(y, X).fit(disp=0)
    except Exception as exc:
        raise ValueError(
            f"Model regresi logistik gagal konvergen (kemungkinan separasi sempurna/kuasi pada data): {exc}"
        ) from exc

    conf_int = fitted.conf_int()
    descriptives = []
    for col in independents:
        coef = safe_float(fitted.params.get(col))
        p_value = safe_float(fitted.pvalues.get(col))
        ci = conf_int.loc[col] if col in conf_int.index else (None, None)
        ci_lower = safe_float(np.exp(ci[0])) if coef is not None else None
        ci_upper = safe_float(np.exp(ci[1])) if coef is not None else None
        descriptives.append(
            {
                "variable": col,
                "coef": coef,
                "odds_ratio": safe_float(np.exp(coef)) if coef is not None else None,
                "ci_lower": ci_lower,
                "ci_upper": ci_upper,
                "p_value": p_value,
                "encoding": predictor_encodings.get(col),
            }
        )

    return {
        "descriptives": descriptives,
        "test_statistics": {
            "n": int(fitted.nobs),
            "pseudo_r2": safe_float(fitted.prsquared),
            "log_likelihood": safe_float(fitted.llf),
            "llr_p_value": safe_float(fitted.llr_pvalue),
            "dependent_encoding": {dependent: dependent_encoding},
        },
    }
