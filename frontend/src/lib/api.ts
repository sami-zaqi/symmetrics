import type {
  AssumptionResult,
  CleaningStrategy,
  ColumnType,
  DataSchema,
  DatasetSummary,
  MethodUsed,
  NarrativeResponse,
  SemConstruct,
  SemPath,
  SemPlsResult,
  TestId,
  TestResult,
  ValueCount,
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
  upload(file: File, sessionId?: string): Promise<DatasetSummary> {
    const formData = new FormData();
    formData.append("file", file);
    if (sessionId) formData.append("session_id", sessionId);
    return request<DatasetSummary>("/api/upload", { method: "POST", body: formData });
  },

  createSchema(schema: DataSchema): Promise<{ session_id: string; schema: DataSchema }> {
    return request("/api/schema/create", { method: "POST", body: JSON.stringify(schema) });
  },

  async downloadTemplate(sessionId: string): Promise<Blob> {
    const res = await fetch(`${BASE_URL}/api/schema/${sessionId}/template`);
    if (!res.ok) {
      const body = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(body.detail || "Gagal mengunduh template");
    }
    return res.blob();
  },

  cleanData(sessionId: string, strategy: CleaningStrategy): Promise<DatasetSummary> {
    return request<DatasetSummary>("/api/upload/clean", {
      method: "POST",
      body: JSON.stringify({ session_id: sessionId, strategy }),
    });
  },

  getColumnValues(sessionId: string, column: string): Promise<ValueCount[]> {
    return request<ValueCount[]>("/api/upload/column-values", {
      method: "POST",
      body: JSON.stringify({ session_id: sessionId, column }),
    });
  },

  remapValues(sessionId: string, column: string, mapping: Record<string, string>): Promise<DatasetSummary> {
    return request<DatasetSummary>("/api/upload/remap-values", {
      method: "POST",
      body: JSON.stringify({ session_id: sessionId, column, mapping }),
    });
  },

  setColumnType(sessionId: string, column: string, dtype: ColumnType): Promise<DatasetSummary> {
    return request<DatasetSummary>("/api/upload/set-type", {
      method: "POST",
      body: JSON.stringify({ session_id: sessionId, column, dtype }),
    });
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
    mode: "auto" | "ai" | "template" = "auto",
    forceRegenerate = false
  ): Promise<NarrativeResponse> {
    return request<NarrativeResponse>("/api/narrative/generate", {
      method: "POST",
      body: JSON.stringify({
        session_id: sessionId,
        result_id: resultId,
        mode,
        force_regenerate: forceRegenerate,
      }),
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

  runSemPls(sessionId: string, constructs: SemConstruct[], paths: SemPath[]): Promise<SemPlsResult> {
    return request<SemPlsResult>("/api/sem/run", {
      method: "POST",
      body: JSON.stringify({ session_id: sessionId, constructs, paths }),
    });
  },

  runSemBootstrap(sessionId: string, resultId: string, iterations = 300): Promise<SemPlsResult> {
    return request<SemPlsResult>("/api/sem/bootstrap", {
      method: "POST",
      body: JSON.stringify({ session_id: sessionId, result_id: resultId, iterations }),
    });
  },
};
