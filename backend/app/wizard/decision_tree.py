from app.core.schemas import WizardAnswers, WizardRecommendation
from app.stats.registry import NONPARAMETRIC_FALLBACK


def recommend(answers: WizardAnswers) -> WizardRecommendation:
    """Deterministic, rule-based test selection. No LLM involved — the AI layer
    never decides which test to run, only narrates already-computed results."""

    if answers.tujuan == "deskriptif":
        return WizardRecommendation(
            recommended_test="descriptive_statistics",
            fallback_test=None,
            required_variable_roles=["Satu atau lebih variabel numerik"],
            reasoning="Anda memilih untuk melihat gambaran umum data tanpa uji hipotesis.",
        )

    if answers.tujuan == "faktor_risiko":
        return WizardRecommendation(
            recommended_test="logistic_regression",
            fallback_test=None,
            required_variable_roles=[
                "1 variabel dependen biner (mis. kejadian: Ya/Tidak)",
                "1 atau lebih variabel independen (prediktor/faktor risiko)",
            ],
            reasoning=(
                "Anda ingin mengetahui faktor-faktor yang berhubungan dengan suatu kejadian biner: "
                "regresi logistik menghasilkan Odds Ratio per prediktor."
            ),
        )

    if answers.tujuan == "evaluasi_diagnostik":
        return WizardRecommendation(
            recommended_test="diagnostic_test",
            fallback_test=None,
            required_variable_roles=[
                "1 variabel hasil uji diagnostik (biner)",
                "1 variabel status penyakit baku emas/gold standard (biner)",
            ],
            reasoning="Anda ingin mengevaluasi akurasi alat/metode diagnostik terhadap baku emas.",
        )

    if answers.tujuan == "reliabilitas":
        return WizardRecommendation(
            recommended_test="cronbach_alpha",
            fallback_test=None,
            required_variable_roles=["Beberapa kolom item kuesioner (skala yang sama)"],
            reasoning="Anda ingin menguji konsistensi internal item kuesioner.",
        )

    if answers.tujuan == "prediksi":
        return WizardRecommendation(
            recommended_test="simple_linear_regression",
            fallback_test=None,
            required_variable_roles=["1 variabel numerik (dependen)", "1 variabel numerik (independen)"],
            reasoning="Anda ingin memprediksi nilai satu variabel dari variabel lain.",
        )

    if answers.tujuan == "hubungan":
        if answers.tipe_variabel_hubungan == "keduanya_kategorik":
            return WizardRecommendation(
                recommended_test="chi_square",
                fallback_test=None,
                required_variable_roles=["1 variabel kategorik", "1 variabel kategorik"],
                reasoning="Kedua variabel bertipe kategorik, uji hubungan yang tepat adalah Chi-Square.",
            )
        return WizardRecommendation(
            recommended_test="pearson_correlation",
            fallback_test="spearman_correlation",
            required_variable_roles=["1 variabel numerik", "1 variabel numerik"],
            reasoning=(
                "Kedua variabel numerik — Pearson direkomendasikan bila berdistribusi normal; "
                "jika tidak, gunakan Spearman."
            ),
        )

    if answers.tujuan == "bandingkan":
        if answers.jumlah_kelompok == "lebih_dari_dua":
            return WizardRecommendation(
                recommended_test="oneway_anova",
                fallback_test=NONPARAMETRIC_FALLBACK["oneway_anova"],
                required_variable_roles=["1 variabel numerik (dependen)", "1 variabel kategorik (>2 kelompok)"],
                reasoning="Membandingkan lebih dari 2 kelompok pada variabel numerik: ANOVA satu arah.",
            )
        if answers.desain == "berpasangan":
            return WizardRecommendation(
                recommended_test="paired_ttest",
                fallback_test=NONPARAMETRIC_FALLBACK["paired_ttest"],
                required_variable_roles=["2 variabel numerik (pengukuran sama subjek, 2 waktu)"],
                reasoning="Subjek sama diukur dua kali: uji T berpasangan.",
            )
        return WizardRecommendation(
            recommended_test="independent_ttest",
            fallback_test=NONPARAMETRIC_FALLBACK["independent_ttest"],
            required_variable_roles=["1 variabel numerik (dependen)", "1 variabel kategorik (2 kelompok)"],
            reasoning="Membandingkan 2 kelompok subjek berbeda pada variabel numerik: uji T tidak berpasangan.",
        )

    raise ValueError("Kombinasi jawaban wizard tidak dikenali.")
