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

/** Runs `frame` on every animation frame, but only while `el` is on (or near) the screen.
 *  Endless loops that keep going far off screen are what made the worlds stutter on phones. Returns a cleanup. */
export function loopWhileVisible(el: Element, frame: (now: number) => void, margin = "200px") {
  let raf = 0, on = false;
  const tick = (now: number) => { raf = requestAnimationFrame(tick); frame(now); };
  const io = new IntersectionObserver(([e]) => {
    if (e.isIntersecting === on) return;
    on = e.isIntersecting;
    if (on) raf = requestAnimationFrame(tick); else cancelAnimationFrame(raf);
  }, { rootMargin: margin });
  io.observe(el);
  return () => { io.disconnect(); cancelAnimationFrame(raf); };
}
