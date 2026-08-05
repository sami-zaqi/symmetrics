TEST_NAMES_ID: dict[str, str] = {
    "descriptive_statistics": "Statistik Deskriptif",
    "independent_ttest": "Uji T Tidak Berpasangan (Independent Samples T-Test)",
    "paired_ttest": "Uji T Berpasangan (Paired Samples T-Test)",
    "mann_whitney": "Uji Mann-Whitney U",
    "wilcoxon": "Uji Wilcoxon Signed-Rank",
    "oneway_anova": "ANOVA Satu Arah (One-Way ANOVA)",
    "kruskal_wallis": "Uji Kruskal-Wallis",
    "pearson_correlation": "Korelasi Pearson",
    "spearman_correlation": "Korelasi Spearman",
    "simple_linear_regression": "Regresi Linear Sederhana",
    "chi_square": "Uji Chi-Square",
    "cronbach_alpha": "Uji Reliabilitas (Cronbach's Alpha)",
}

NONPARAMETRIC_FALLBACK: dict[str, str] = {
    "independent_ttest": "mann_whitney",
    "paired_ttest": "wilcoxon",
    "oneway_anova": "kruskal_wallis",
}
