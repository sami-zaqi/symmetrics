import pandas as pd
import statsmodels.api as sm
from statsmodels.stats.outliers_influence import variance_inflation_factor

from app.core.schemas import AssumptionResult, AssumptionTestOutcome, TestId, VariableMapping
from app.stats import homogeneity, normality
from app.stats._utils import safe_float
from app.stats.logistic import _encode_binary
from app.stats.registry import NONPARAMETRIC_FALLBACK

ALPHA = 0.05
VIF_THRESHOLD = 10.0
SEPARATION_SE_THRESHOLD = 5.0

BLOCKING_TESTS = {"independent_ttest", "paired_ttest", "oneway_anova"}
INFORMATIONAL_TESTS = {"logistic_regression"}


def _build_design_matrix(data: pd.DataFrame, independents: list[str]):
    x_cols = {}
    for col in independents:
        series = data[col]
        if pd.api.types.is_numeric_dtype(series) and series.nunique() > 2:
            x_cols[col] = series.astype(float)
        else:
            encoded, _ = _encode_binary(series, col)
            x_cols[col] = encoded
    return sm.add_constant(pd.DataFrame(x_cols, index=data.index), has_constant="add")


def _check_logistic(df, mapping: VariableMapping) -> AssumptionResult:
    """Informational-only check: multicollinearity (VIF) and a heuristic for
    perfect/quasi separation. Never triggers an automatic fallback -- there is
    no substitute test for a data-design problem like separation."""
    independents = mapping.independents or []
    outcomes: list[AssumptionTestOutcome] = []

    if len(independents) >= 2:
        data = df[independents].dropna()
        X = _build_design_matrix(data, independents)

        for col in independents:
            col_idx = list(X.columns).index(col)
            vif = safe_float(variance_inflation_factor(X.values, col_idx))
            passed = vif is None or vif <= VIF_THRESHOLD
            outcomes.append(
                AssumptionTestOutcome(
                    name=f"VIF ({col})",
                    statistic=vif if vif is not None else 0.0,
                    p_value=None,
                    passed=passed,
                    detail=(
                        f"VIF tidak dapat dihitung untuk '{col}'."
                        if vif is None
                        else f"VIF = {vif:.2f} -- "
                        + (
                            "tidak ada indikasi multikolinearitas serius."
                            if passed
                            else f"terindikasi multikolinearitas serius (ambang > {VIF_THRESHOLD:.0f})."
                        )
                    ),
                )
            )

    if mapping.dependent and independents:
        try:
            dep_data = df[[mapping.dependent, *independents]].dropna()
            y, _ = _encode_binary(dep_data[mapping.dependent], mapping.dependent)
            X_sep = _build_design_matrix(dep_data, independents)
            fitted = sm.Logit(y, X_sep).fit(disp=0)
            se_by_col = {col: safe_float(fitted.bse.get(col)) for col in independents}
            large_se = [col for col, se in se_by_col.items() if se is not None and se > SEPARATION_SE_THRESHOLD]
            passed = len(large_se) == 0
            max_se = max((se for se in se_by_col.values() if se is not None), default=0.0)
            outcomes.append(
                AssumptionTestOutcome(
                    name="Indikasi Separasi Sempurna/Kuasi",
                    statistic=max_se,
                    p_value=None,
                    passed=passed,
                    detail=(
                        "Tidak ada indikasi separasi sempurna/kuasi pada model."
                        if passed
                        else f"Standard error koefisien sangat besar pada: {', '.join(large_se)} -- "
                        "kemungkinan separasi sempurna/kuasi; OR pada variabel ini tidak dapat "
                        "diinterpretasikan dengan andal."
                    ),
                )
            )
        except Exception as exc:
            outcomes.append(
                AssumptionTestOutcome(
                    name="Indikasi Separasi Sempurna/Kuasi",
                    statistic=0.0,
                    p_value=None,
                    passed=False,
                    detail=f"Model regresi logistik gagal konvergen: {exc}. Kemungkinan besar terjadi separasi sempurna pada data.",
                )
            )

    violated = [o for o in outcomes if not o.passed]
    if violated:
        reason = (
            f"Peringatan pada: {', '.join(o.name for o in violated)}. "
            "Pertimbangkan mengeluarkan/menggabungkan kategori prediktor yang bermasalah sebelum menginterpretasikan OR."
        )
    elif outcomes:
        reason = "Tidak ada indikasi multikolinearitas atau separasi serius pada model."
    else:
        reason = "Hanya 1 prediktor -- pemeriksaan multikolinearitas (VIF) dilewati."

    return AssumptionResult(
        checked=True,
        outcomes=outcomes,
        recommended_test="logistic_regression",
        fallback_triggered=False,
        reason=reason,
    )


def check(df, test_id: TestId, mapping: VariableMapping) -> AssumptionResult:
    if test_id in INFORMATIONAL_TESTS:
        return _check_logistic(df, mapping)

    if test_id not in BLOCKING_TESTS:
        return AssumptionResult(checked=False, outcomes=[], recommended_test=test_id, fallback_triggered=False)

    outcomes_raw: list[dict] = []

    if test_id == "independent_ttest":
        outcomes_raw += normality.shapiro_per_group(df, mapping.dependent, mapping.grouping)
        outcomes_raw.append(homogeneity.levene(df, mapping.dependent, mapping.grouping))
    elif test_id == "paired_ttest":
        # difference-score normality check on the two paired columns
        col_a, col_b = mapping.items[0], mapping.items[1]  # reuse `items` to carry the pair
        diff_df = df.copy()
        diff_df["_diff"] = df[col_a].astype(float) - df[col_b].astype(float)
        outcomes_raw += normality.shapiro_per_group(diff_df, "_diff", None)
    elif test_id == "oneway_anova":
        outcomes_raw += normality.shapiro_per_group(df, mapping.dependent, mapping.grouping)
        outcomes_raw.append(homogeneity.levene(df, mapping.dependent, mapping.grouping))

    outcomes = [AssumptionTestOutcome(**o) for o in outcomes_raw]
    violated = [o for o in outcomes if not o.passed]

    if violated:
        fallback = NONPARAMETRIC_FALLBACK[test_id]
        reasons = "; ".join(o.detail for o in violated)
        return AssumptionResult(
            checked=True,
            outcomes=outcomes,
            recommended_test=fallback,
            fallback_triggered=True,
            reason=f"Asumsi tidak terpenuhi: {reasons} Disarankan menggunakan uji non-parametrik.",
        )

    return AssumptionResult(
        checked=True,
        outcomes=outcomes,
        recommended_test=test_id,
        fallback_triggered=False,
        reason="Semua asumsi terpenuhi. Uji parametrik dapat digunakan.",
    )
