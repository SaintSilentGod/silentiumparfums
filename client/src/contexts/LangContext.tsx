import React, { createContext, useContext, useState } from "react";

type Lang = "ru" | "en";

interface LangContextType {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (ru: string, en: string) => string;
}

const LangContext = createContext<LangContextType>({
  lang: "ru",
  setLang: () => {},
  t: (ru) => ru,
});

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>("ru");
  const t = (ru: string, en: string) => (lang === "ru" ? ru : en);
  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext);
}
