"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { dictionaries, type Language, type TranslationKey } from "./i18n";

interface LanguageState {
  language: Language;
  setLanguage: (l: Language) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageState | undefined>(undefined);

const STORAGE_KEY = "symmetrics_language";

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("id");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "id" || stored === "en") setLanguageState(stored);
  }, []);

  function setLanguage(l: Language) {
    setLanguageState(l);
    window.localStorage.setItem(STORAGE_KEY, l);
  }

  function t(key: TranslationKey): string {
    return dictionaries[language][key] ?? dictionaries.id[key] ?? key;
  }

  return <LanguageContext.Provider value={{ language, setLanguage, t }}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageState {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
