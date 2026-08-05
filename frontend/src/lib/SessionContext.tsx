"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import type {
  AssumptionResult,
  DatasetSummary,
  TestId,
  TestResult,
  VariableMapping,
  WizardAnswers,
  WizardRecommendation,
} from "./types";

interface SessionState {
  dataset: DatasetSummary | null;
  setDataset: (d: DatasetSummary | null) => void;
  wizardAnswers: WizardAnswers | null;
  setWizardAnswers: (a: WizardAnswers | null) => void;
  recommendation: WizardRecommendation | null;
  setRecommendation: (r: WizardRecommendation | null) => void;
  mapping: VariableMapping;
  setMapping: (m: VariableMapping) => void;
  activeTestId: TestId | null;
  setActiveTestId: (t: TestId | null) => void;
  assumptionResult: AssumptionResult | null;
  setAssumptionResult: (a: AssumptionResult | null) => void;
  methodUsed: "parametric" | "nonparametric_fallback" | "as_selected";
  setMethodUsed: (m: "parametric" | "nonparametric_fallback" | "as_selected") => void;
  fallbackReason: string | null;
  setFallbackReason: (r: string | null) => void;
  currentResult: TestResult | null;
  setCurrentResult: (r: TestResult | null) => void;
  narrativeText: string;
  setNarrativeText: (t: string) => void;
  narrativeMode: "auto" | "ai" | "template";
  setNarrativeMode: (m: "auto" | "ai" | "template") => void;
  reset: () => void;
}

const SessionContext = createContext<SessionState | undefined>(undefined);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [dataset, setDataset] = useState<DatasetSummary | null>(null);
  const [wizardAnswers, setWizardAnswers] = useState<WizardAnswers | null>(null);
  const [recommendation, setRecommendation] = useState<WizardRecommendation | null>(null);
  const [mapping, setMapping] = useState<VariableMapping>({});
  const [activeTestId, setActiveTestId] = useState<TestId | null>(null);
  const [assumptionResult, setAssumptionResult] = useState<AssumptionResult | null>(null);
  const [methodUsed, setMethodUsed] = useState<"parametric" | "nonparametric_fallback" | "as_selected">(
    "as_selected"
  );
  const [fallbackReason, setFallbackReason] = useState<string | null>(null);
  const [currentResult, setCurrentResult] = useState<TestResult | null>(null);
  const [narrativeText, setNarrativeText] = useState<string>("");
  const [narrativeMode, setNarrativeMode] = useState<"auto" | "ai" | "template">("auto");

  function reset() {
    setDataset(null);
    setWizardAnswers(null);
    setRecommendation(null);
    setMapping({});
    setActiveTestId(null);
    setAssumptionResult(null);
    setMethodUsed("as_selected");
    setFallbackReason(null);
    setCurrentResult(null);
    setNarrativeText("");
  }

  return (
    <SessionContext.Provider
      value={{
        dataset,
        setDataset,
        wizardAnswers,
        setWizardAnswers,
        recommendation,
        setRecommendation,
        mapping,
        setMapping,
        activeTestId,
        setActiveTestId,
        assumptionResult,
        setAssumptionResult,
        methodUsed,
        setMethodUsed,
        fallbackReason,
        setFallbackReason,
        currentResult,
        setCurrentResult,
        narrativeText,
        setNarrativeText,
        narrativeMode,
        setNarrativeMode,
        reset,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession(): SessionState {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within SessionProvider");
  return ctx;
}
