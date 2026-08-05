import uuid
from datetime import datetime

import pingouin
from fastapi import APIRouter, HTTPException

from app.core.schemas import ChartRef, RunTestRequest, TestResult
from app.core.session_store import session_store
from app.stats import anova, chi_square, correlation, descriptive, regression, reliability, ttest
from app.stats.charts import boxplot, histogram, scatter
from app.stats.registry import TEST_NAMES_ID

router = APIRouter(prefix="/api/tests", tags=["tests"])

ENGINE_VERSION = f"pingouin=={pingouin.__version__}"


@router.post("/run", response_model=TestResult)
def run_test(req: RunTestRequest):
    session = session_store.get(req.session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Sesi tidak ditemukan atau sudah kedaluwarsa.")
    df = session.df
    m = req.mapping
    test_id = req.test_id
    charts: list[ChartRef] = []

    try:
        if test_id == "descriptive_statistics":
            cols = m.items or ([m.dependent] if m.dependent else [])
            desc = descriptive.run(df, cols)
            payload = {"descriptives": desc, "test_statistics": {"note": "Statistik deskriptif tidak memiliki uji hipotesis."}}
            for c in cols:
                charts.append(ChartRef(**histogram(df, c, f"hist_{c}")))

        elif test_id == "independent_ttest":
            payload = ttest.run_independent(df, m.dependent, m.grouping)
            charts.append(ChartRef(**boxplot(df, m.dependent, m.grouping, "boxplot_main")))

        elif test_id == "mann_whitney":
            payload = ttest.run_mann_whitney(df, m.dependent, m.grouping)
            charts.append(ChartRef(**boxplot(df, m.dependent, m.grouping, "boxplot_main")))

        elif test_id == "paired_ttest":
            payload = ttest.run_paired(df, m.dependent, (m.items[0], m.items[1]))

        elif test_id == "wilcoxon":
            payload = ttest.run_wilcoxon(df, m.dependent, (m.items[0], m.items[1]))

        elif test_id == "oneway_anova":
            payload = anova.run_oneway(df, m.dependent, m.grouping)
            charts.append(ChartRef(**boxplot(df, m.dependent, m.grouping, "boxplot_main")))

        elif test_id == "kruskal_wallis":
            payload = anova.run_kruskal(df, m.dependent, m.grouping)
            charts.append(ChartRef(**boxplot(df, m.dependent, m.grouping, "boxplot_main")))

        elif test_id == "pearson_correlation":
            payload = correlation.run_pearson(df, m.independent, m.dependent)
            charts.append(ChartRef(**scatter(df, m.independent, m.dependent, "scatter_main")))

        elif test_id == "spearman_correlation":
            payload = correlation.run_spearman(df, m.independent, m.dependent)
            charts.append(ChartRef(**scatter(df, m.independent, m.dependent, "scatter_main")))

        elif test_id == "simple_linear_regression":
            payload = regression.run_simple_linear(df, m.independent, m.dependent)
            charts.append(ChartRef(**scatter(df, m.independent, m.dependent, "scatter_main")))

        elif test_id == "chi_square":
            payload = chi_square.run(df, m.independent, m.dependent)

        elif test_id == "cronbach_alpha":
            payload = reliability.run_cronbach(df, m.items)

        else:
            raise HTTPException(status_code=400, detail=f"Uji '{test_id}' belum didukung.")

    except (ValueError, KeyError) as exc:
        raise HTTPException(status_code=400, detail=f"Gagal menjalankan uji: {exc}") from exc

    result_id = str(uuid.uuid4())
    result = TestResult(
        result_id=result_id,
        test_id=test_id,
        test_name_id=TEST_NAMES_ID[test_id],
        variables=m.model_dump(exclude_none=True),
        assumptions=req.assumptions,
        descriptives=payload["descriptives"],
        test_statistics=payload["test_statistics"],
        method_used=req.method_used,
        fallback_reason=req.fallback_reason,
        charts=charts,
        engine_version=ENGINE_VERSION,
        generated_at=datetime.utcnow(),
    )
    session_store.store_result(req.session_id, result_id, result)
    return result
