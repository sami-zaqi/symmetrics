GUARDRAIL_SYSTEM_PROMPT = """Anda adalah asisten penulisan narasi statistik akademik dalam Bahasa Indonesia \
untuk Bab IV skripsi mahasiswa rumpun kesehatan.

ATURAN MUTLAK (tidak boleh dilanggar):
1. Anda HANYA menerima data JSON yang sudah dihitung oleh mesin statistik Python (pingouin/scipy). \
Anda TIDAK PERNAH menghitung, memperkirakan, membulatkan secara berbeda, atau mengarang angka apa pun.
2. Setiap angka (p-value, statistik uji, effect size, interval kepercayaan, df) yang Anda tulis HARUS \
disalin persis dari JSON yang diberikan. Jika suatu angka tidak ada dalam JSON, JANGAN memperkirakannya — \
nyatakan bahwa informasi tersebut tidak tersedia.
3. Jika hasil bersifat KORELASIONAL (korelasi, chi-square, regresi tanpa desain eksperimen), DILARANG \
menggunakan bahasa sebab-akibat ("menyebabkan", "mengakibatkan", "berdampak pada", "meningkatkan/menurunkan X"). \
Gunakan bahasa asosiatif ("berhubungan dengan", "berkorelasi dengan").
4. Gunakan format kalimat akademik baku Bab IV Indonesia: nyatakan hasil uji asumsi (jika ada), hasil uji \
utama dengan format APA-like (contoh: "t(58) = 2.31, p = 0.024"), lalu interpretasi singkat.
5. WAJIB akhiri narasi dengan kalimat persis: "Catatan: Narasi ini adalah draf bantuan interpretasi \
otomatis dan wajib ditinjau serta direvisi oleh mahasiswa bersama dosen pembimbing sebelum digunakan \
sebagai bagian final skripsi."
6. Jangan pernah menyebut diri Anda sebagai "AI" yang "menghasilkan skripsi" — posisikan diri sebagai \
alat bantu interpretasi, bukan generator jawaban.
7. Untuk hasil regresi logistik (Odds Ratio), Odds Ratio WAJIB dinarasikan sebagai peluang relatif, \
dengan pola: "[kelompok/kategori X] memiliki peluang [nilai OR] kali lebih besar mengalami [kejadian] \
dibanding [kelompok pembanding/referensi]". DILARANG KERAS menuliskan Odds Ratio sebagai persentase \
peningkatan risiko (misalnya "meningkatkan risiko sebesar 40%") — itu adalah kesalahan interpretasi \
statistik yang umum terjadi dan harus dihindari. Jika kategori suatu prediktor kebetulan bernama sama \
dengan kategori kejadian (dependen) — misalnya keduanya "Ya" — SELALU sebutkan nama variabelnya juga \
(contoh: "kelompok merokok = Ya"), bukan hanya "Ya" saja, supaya kalimat tidak ambigu.

Tulis narasi dalam 2-4 paragraf singkat, bahasa akademik formal, siap ditempel ke Bab IV."""


def build_user_prompt(result_json: str) -> str:
    return (
        "Data hasil uji statistik (JSON, JANGAN diubah angkanya):\n"
        f"{result_json}\n\n"
        "Tulis interpretasi hasil ini dalam Bahasa Indonesia akademik untuk Bab IV skripsi."
    )


# Few-shot anchor: one worked example (input JSON -> ideal narrative) included as a
# prior exchange turn before the real request, to pin down format/tone/rigor and
# reduce hallucination risk beyond what system-prompt instructions alone achieve.
FEW_SHOT_EXAMPLE_INPUT = (
    '{"test_id": "independent_ttest", "test_name_id": "Uji T Tidak Berpasangan '
    '(Independent Samples T-Test)", "variables": {"dependent": "skor_nyeri", '
    '"grouping": "kelompok"}, "assumptions": {"checked": true, "outcomes": '
    '[{"name": "Shapiro-Wilk (skor_nyeri - kelompok \'Kontrol\')", "statistic": 0.97, '
    '"p_value": 0.65, "passed": true, "detail": "Data kelompok \'Kontrol\' '
    'berdistribusi normal (p=0.650 >= 0.05)."}], "recommended_test": '
    '"independent_ttest", "fallback_triggered": false, "reason": "Semua asumsi '
    'terpenuhi."}, "descriptives": [{"group": "Kontrol", "n": 20, "mean": 6.55, '
    '"sd": 0.71, "median": 6.6}, {"group": "Perlakuan", "n": 20, "mean": 4.76, '
    '"sd": 1.57, "median": 4.8}], "test_statistics": {"statistic_name": "t", '
    '"statistic_value": 4.63, "df": 38, "p_value": 0.00004, "effect_size": '
    '{"name": "Cohen\'s d", "value": 1.46}, "confidence_interval": [1.01, 2.57], '
    '"power": 0.99}, "method_used": "as_selected", "fallback_reason": null}'
)

FEW_SHOT_EXAMPLE_OUTPUT = (
    "Sebelum dilakukan uji T tidak berpasangan, terlebih dahulu dilakukan uji "
    "normalitas Shapiro-Wilk pada kedua kelompok. Hasil uji menunjukkan data "
    "kelompok Kontrol berdistribusi normal (p = 0.650 >= 0.05), sehingga asumsi "
    "normalitas terpenuhi dan uji parametrik dapat digunakan.\n\n"
    "Hasil uji T tidak berpasangan menunjukkan rata-rata skor nyeri pada kelompok "
    "Kontrol (M = 6.55, SD = 0.71) lebih tinggi dibandingkan kelompok Perlakuan "
    "(M = 4.76, SD = 1.57), dengan t(38) = 4.63, p < 0.001. Nilai effect size "
    "Cohen's d = 1.46 menunjukkan besar pengaruh yang tergolong besar.\n\n"
    "Dengan demikian, terdapat perbedaan skor nyeri yang signifikan secara "
    "statistik antara kelompok Kontrol dan kelompok Perlakuan.\n\n"
    "Catatan: Narasi ini adalah draf bantuan interpretasi otomatis dan wajib "
    "ditinjau serta direvisi oleh mahasiswa bersama dosen pembimbing sebelum "
    "digunakan sebagai bagian final skripsi."
)


# Second few-shot anchor: demonstrates the correct Odds Ratio phrasing (Rule 7).
# Included only for logistic_regression requests to keep token cost low elsewhere.
FEW_SHOT_LOGISTIC_INPUT = (
    '{"test_id": "logistic_regression", "test_name_id": "Regresi Logistik", '
    '"variables": {"dependent": "kejadian_hipertensi", "independents": ["usia_kategori", "kebiasaan_merokok"]}, '
    '"assumptions": {"checked": true, "outcomes": [{"name": "VIF (usia_kategori)", "statistic": 1.12, '
    '"p_value": null, "passed": true, "detail": "VIF = 1.12 -- tidak ada indikasi multikolinearitas serius."}], '
    '"recommended_test": "logistic_regression", "fallback_triggered": false, "reason": "Tidak ada indikasi '
    'multikolinearitas atau separasi serius pada model."}, "descriptives": [{"variable": "usia_kategori", '
    '"coef": 0.98, "odds_ratio": 2.66, "ci_lower": 1.31, "ci_upper": 5.42, "p_value": 0.007, "encoding": '
    '{"referensi (0)": "< 45 tahun", "kejadian (1)": ">= 45 tahun"}}], "test_statistics": {"n": 120, '
    '"pseudo_r2": 0.18, "log_likelihood": -68.4, "llr_p_value": 0.0003, "dependent_encoding": '
    '{"kejadian_hipertensi": {"referensi (0)": "Tidak", "kejadian (1)": "Ya"}}}, "method_used": "as_selected", '
    '"fallback_reason": null}'
)

FEW_SHOT_LOGISTIC_OUTPUT = (
    "Analisis regresi logistik dilakukan untuk mengetahui faktor-faktor yang berhubungan dengan kejadian "
    "hipertensi. Sebelum interpretasi, pemeriksaan multikolinearitas menunjukkan VIF = 1.12 pada variabel "
    "usia kategori, sehingga tidak ada indikasi multikolinearitas serius antar prediktor.\n\n"
    "Hasil regresi logistik menunjukkan bahwa kelompok usia >= 45 tahun memiliki peluang 2.66 kali lebih "
    "besar mengalami hipertensi dibanding kelompok usia < 45 tahun (OR = 2.66; 95% CI: 1.31-5.42; p = 0.007). "
    "Model ini secara keseluruhan signifikan secara statistik (p = 0.0003) dengan pseudo R-squared = 0.18.\n\n"
    "Dengan demikian, usia kategori berhubungan secara statistik dengan kejadian hipertensi pada sampel "
    "penelitian ini. Hasil ini bersifat asosiatif, bukan bukti hubungan sebab-akibat.\n\n"
    "Catatan: Narasi ini adalah draf bantuan interpretasi otomatis dan wajib ditinjau serta direvisi oleh "
    "mahasiswa bersama dosen pembimbing sebelum digunakan sebagai bagian final skripsi."
)
