import type { Perfume } from "@/lib/perfumes";

export interface WorldProps {
  perfume: Perfume;
}

// "# The candle flame" → "The candle flame"
export const fragmentText = (s: string) => s.replace(/^#\s*/, "");

export const pick = <T,>(lang: "ru" | "en", v: { ru: T; en: T }) => (lang === "ru" ? v.ru : v.en);

export function notesFlat(p: Perfume, lang: "ru" | "en"): string[] {
  const n = p.scentNotes;
  if (n.all) return pick(lang, n.all);
  return [n.top, n.heart, n.base].flatMap((g) => (g ? pick(lang, g) : []));
}

export const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
