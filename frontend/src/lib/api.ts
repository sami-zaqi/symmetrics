import type {
  AssumptionResult,
  DatasetSummary,
  MethodUsed,
  NarrativeResponse,
  TestId,
  TestResult,
  VariableMapping,
  WizardAnswers,
  WizardRecommendation,
} from "./types";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: init?.body instanceof FormData ? undefined : { "Content-Type": "application/json", ...init?.headers },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(body.detail || `Permintaan gagal (${res.status})`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  upload(file: File): Promise<DatasetSummary> {
    const formData = new FormData();
    formData.append("file", file);
    return request<DatasetSummary>("/api/upload", { method: "POST", body: formData });
  },

  wizardRecommend(answers: WizardAnswers): Promise<WizardRecommendation> {
    return request<WizardRecommendation>("/api/wizard/recommend", {
      method: "POST",
      body: JSON.stringify(answers),
    });
  },

  assumptionsCheck(sessionId: string, testId: TestId, mapping: VariableMapping): Promise<AssumptionResult> {
    return request<AssumptionResult>("/api/assumptions/check", {
      method: "POST",
      body: JSON.stringify({ session_id: sessionId, test_id: testId, mapping }),
    });
  },

  runTest(
    sessionId: string,
    testId: TestId,
    mapping: VariableMapping,
    methodUsed: MethodUsed = "as_selected",
    fallbackReason?: string | null,
    assumptions?: AssumptionResult | null
  ): Promise<TestResult> {
    return request<TestResult>("/api/tests/run", {
      method: "POST",
      body: JSON.stringify({
        session_id: sessionId,
        test_id: testId,
        mapping,
        method_used: methodUsed,
        fallback_reason: fallbackReason ?? null,
        assumptions: assumptions ?? null,
      }),
    });
  },

  generateNarrative(
    sessionId: string,
    resultId: string,
    mode: "auto" | "ai" | "template" = "auto"
  ): Promise<NarrativeResponse> {
    return request<NarrativeResponse>("/api/narrative/generate", {
      method: "POST",
      body: JSON.stringify({ session_id: sessionId, result_id: resultId, mode }),
    });
  },

  async exportDocx(sessionId: string, resultId: string, narrativeText?: string): Promise<Blob> {
    const res = await fetch(`${BASE_URL}/api/export/docx`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: sessionId, result_id: resultId, narrative_text: narrativeText ?? null }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(body.detail || "Gagal membuat file Word");
    }
    return res.blob();
  },

  deleteSession(sessionId: string): Promise<void> {
    return request<void>(`/api/session/${sessionId}`, { method: "DELETE" });
  },
};
