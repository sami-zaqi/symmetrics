from app.core.schemas import AssumptionResult, AssumptionTestOutcome, TestId, VariableMapping
from app.stats import homogeneity, normality
from app.stats.registry import NONPARAMETRIC_FALLBACK

ALPHA = 0.05

BLOCKING_TESTS = {"independent_ttest", "paired_ttest", "oneway_anova"}


def check(df, test_id: TestId, mapping: VariableMapping) -> AssumptionResult:
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
