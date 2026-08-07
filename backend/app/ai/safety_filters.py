import re

CORRELATIONAL_TESTS = {
    "pearson_correlation", "spearman_correlation", "chi_square", "simple_linear_regression",
    "logistic_regression", "roc_analysis",
}

# Common misinterpretation: describing an Odds Ratio as a percentage risk increase
# ("meningkatkan risiko sebesar 40%") instead of "X kali lebih besar". We only detect
# and flag this (not auto-rewrite, since a safe percentage->multiplicative-phrase
# rewrite can't be done with a regex) so the UI can prompt the user to review it.
OR_PERCENTAGE_PATTERN = re.compile(
    r"(risiko|peluang|kemungkinan)[^.\n]{0,40}\d+(\.\d+)?\s?%", re.IGNORECASE
)

# Common misinterpretation: calling AUC "accuracy" as a percentage of correct
# predictions. AUC measures discriminative ability, not prediction accuracy.
AUC_ACCURACY_PATTERN = re.compile(r"akurasi[^.\n]{0,30}\d+(\.\d+)?\s?%", re.IGNORECASE)

CAUSAL_PATTERNS = [
    (re.compile(r"\bmenyebabkan\b", re.IGNORECASE), "berhubungan dengan"),
    (re.compile(r"\bmengakibatkan\b", re.IGNORECASE), "berkaitan dengan"),
    (re.compile(r"\bberdampak pada\b", re.IGNORECASE), "berasosiasi dengan"),
    (re.compile(r"\bmeningkatkan\b", re.IGNORECASE), "berhubungan positif dengan"),
    (re.compile(r"\bmenurunkan\b", re.IGNORECASE), "berhubungan negatif dengan"),
]

DISCLAIMER = (
    "Catatan: Narasi ini adalah draf bantuan interpretasi otomatis dan wajib ditinjau serta "
    "direvisi oleh mahasiswa bersama dosen pembimbing sebelum digunakan sebagai bagian final skripsi."
)


def enforce(narrative_text: str, test_id: str) -> tuple[str, bool]:
    """Deterministic second-layer guard: rewrites causal-language markers to associative
    equivalents when the underlying test is correlational, and guarantees the disclaimer
    is present. Returns (cleaned_text, flagged) where flagged indicates causal language
    was detected and rewritten."""
    text = narrative_text
    flagged = False

    if test_id in CORRELATIONAL_TESTS:
        for pattern, replacement in CAUSAL_PATTERNS:
            if pattern.search(text):
                flagged = True
                text = pattern.sub(replacement, text)

    if test_id in {"logistic_regression", "chi_square"} and OR_PERCENTAGE_PATTERN.search(text):
        flagged = True

    if test_id == "roc_analysis" and AUC_ACCURACY_PATTERN.search(text):
        flagged = True

    if DISCLAIMER not in text:
        text = text.rstrip() + "\n\n" + DISCLAIMER

    return text, flagged
