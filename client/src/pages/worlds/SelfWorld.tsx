// Self addicted — the main character. Ego luxury in the "true adam" / looksmaxxing register:
// black marble, chrome, polished gold, a classical marble bust with a razor jawline under hard rim light.
// It opens as a phonk-style edit — flash cuts on scroll (bust → jaw → eyes → crowned → the bottle on a plinth);
// then a face scan with golden-ratio lines and a verdict card (what it smells like); the ascension (drydown) where
// the marble cracks with gold and turns solid gold; notes as sugar crystals in a vitrine; the character as a
// top-1% rating; the scenes as full-screen stories; memories as lock-screen notifications; and a Hollywood
// mirror whose bulbs light up when you look into it to send a request.

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useLocation } from "wouter";
import { useLang } from "@/contexts/LangContext";
import Bottle3D from "@/components/Bottle3D";
import RequestDialog, { type DialogSkin } from "@/components/RequestDialog";
import { useReveal } from "@/lib/useReveal";
import { fragmentText, pick, prefersReducedMotion, type WorldProps } from "./shared";

const C = { black: "#050505", ink: "#0c0c0d", white: "#f4f1ea", gold: "#d9b35a", leaf: "#f3d98f", dim: "rgba(244,241,234,.58)", faint: "rgba(244,241,234,.14)" };
const lux: CSSProperties = { fontFamily: "'Prata', 'Cormorant Garamond', serif", fontWeight: 400 };
const edit: CSSProperties = { fontFamily: "'Montserrat', sans-serif", fontWeight: 900, fontStyle: "italic", textTransform: "uppercase" };
const thin: CSSProperties = { fontFamily: "'Montserrat', sans-serif", fontWeight: 300, textTransform: "uppercase" };
const body: CSSProperties = { fontFamily: "'Montserrat', sans-serif", fontWeight: 500 };
const IMG = "/images/self-addicted";
const CHROME: CSSProperties = { background: "linear-gradient(180deg, #ffffff 0%, #d9dde3 30%, #6f7682 50%, #f2f4f7 56%, #9aa1ad 78%, #ffffff 100%)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" };
const GOLD: CSSProperties = { background: "linear-gradient(180deg, #fff3c4 0%, #e7c46e 40%, #8f6418 62%, #f6dc93 100%)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" };
const GRAIN = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.6'/%3E%3C/svg%3E")`;

const bottleLook = { liquid: "#c8902e", liquidOpacity: 0.88, glass: "#fff6ea", cap: "#0d0d0d", capRoughness: 0.12, collar: "#d9b35a" };
const bottleLabel = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
  ctx.fillStyle = "#070707"; ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = "#d9b35a"; ctx.lineWidth = 3; ctx.strokeRect(22, 22, w - 44, h - 44);
  ctx.fillStyle = "#f3d98f"; ctx.textAlign = "center";
  ctx.font = "400 92px 'Prata', serif"; ctx.fillText("Self", w / 2, h * 0.46);
  ctx.font = "300 46px 'Montserrat', sans-serif"; ctx.fillText("A D D I C T E D", w / 2, h * 0.66);
};

// ── helpers ──
function usePinProgress<T extends HTMLElement>(enabled = true) {
  const ref = useRef<T>(null);
  const [p, setP] = useState(0);
  useEffect(() => {
    if (!enabled) return;
    let raf = 0;
    const update = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const el = ref.current; if (!el) return;
        const r = el.getBoundingClientRect();
        setP(Math.min(1, Math.max(0, -r.top / Math.max(1, r.height - window.innerHeight))));
      });
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("scroll", update); window.removeEventListener("resize", update); };
  }, [enabled]);
  return { ref, p };
}
function Reveal({ children, delay = 0, style }: { children: React.ReactNode; delay?: number; style?: CSSProperties }) {
  const { ref, visible } = useReveal();
  return <div ref={ref} style={{ ...style, opacity: visible ? 1 : 0, transform: visible ? "none" : "translateY(24px)", transition: `opacity 1.1s ease ${delay}ms, transform 1.1s cubic-bezier(.16,1,.3,1) ${delay}ms` }}>{children}</div>;
}
function Head({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div style={{ textAlign: "center", marginBottom: 48 }}>
      <p style={{ ...thin, fontSize: 12, letterSpacing: ".55em", color: C.gold }}>{kicker}</p>
      <h2 style={{ ...lux, fontSize: "clamp(2.2rem, 5.4vw, 4.4rem)", lineHeight: 1.05, marginTop: 12, ...CHROME }}>{title}</h2>
    </div>
  );
}

// ── 1. The edit: flash cuts on scroll ──
// Each cut is the bust (or the crowned bust) framed differently: [image, zoom, focus x, focus y]
const FACE = { jaw: [0.46, 0.52], eyes: [0.36, 0.31] } as const;
type Cut = { img: string; zoom: number; fx: number; fy: number; caption: { ru: string; en: string } };
const CUTS: Cut[] = [
  { img: "statue", zoom: 1, fx: 0.5, fy: 0.4, caption: { ru: "Все обернулись", en: "Everyone turned around" } },
  { img: "statue", zoom: 2.3, fx: FACE.jaw[0], fy: FACE.jaw[1], caption: { ru: "Даже не старался", en: "Didn't even try" } },
  { img: "statue", zoom: 3.2, fx: FACE.eyes[0], fy: FACE.eyes[1], caption: { ru: "Mog", en: "Mog" } },
  { img: "statue-crown", zoom: 1.04, fx: 0.5, fy: 0.1, caption: { ru: "Корона не снимается", en: "The crown stays on" } },
];
function Edit({ t, tagline, description }: { t: (ru: string, en: string) => string; tagline: string; description: string }) {
  const still = prefersReducedMotion();
  const { ref, p } = usePinProgress<HTMLElement>(!still);
  const n = CUTS.length + 1; // the last "cut" is the bottle
  const x = still ? n - 0.5 : p * n * 0.999;
  const cut = Math.floor(x), local = x - cut;
  const { lang } = useLang();
  const final = cut >= CUTS.length;
  // on a wide screen "cover" already crops the portrait hard, so the close-ups need less zoom
  const [wide, setWide] = useState(() => window.innerWidth > window.innerHeight);
  useEffect(() => { const on = () => setWide(window.innerWidth > window.innerHeight); window.addEventListener("resize", on); return () => window.removeEventListener("resize", on); }, []);
  const zoomOf = (z: number) => (wide ? Math.max(1, z * 0.55) : z);
  return (
    <section ref={ref} style={{ position: "relative", height: still ? "100svh" : "480svh", background: C.black }}>
      <div style={{ position: still ? "relative" : "sticky", top: 0, height: "100svh", overflow: "hidden" }}>
        {/* the flash and the jolt play once per cut (keyed on it), so stopping right after a cut never leaves the screen washed out */}
        <div key={`j${cut}`} className={cut > 0 && !still ? "sa-jolt" : undefined} style={{ position: "absolute", inset: 0 }}>
          {CUTS.map((c, i) => (
            <div key={i} aria-hidden={i !== cut} style={{ position: "absolute", inset: 0, opacity: i === cut ? 1 : 0, overflow: "hidden" }}>
              <img src={`${IMG}/${c.img}.webp`} alt={i === 0 ? t("Мраморный бюст юноши с острой линией челюсти", "A marble bust of a young man with a razor jawline") : ""}
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: `${c.fx * 100}% ${c.fy * 100}%`, transformOrigin: `${c.fx * 100}% ${c.fy * 100}%`, transform: `scale(${zoomOf(c.zoom) * (1 + (i === cut ? local : 0) * 0.08)})`, filter: "contrast(1.08)" }} />
            </div>
          ))}
          {/* the bottle on a black marble plinth */}
          <div style={{ position: "absolute", inset: 0, opacity: final ? 1 : 0, background: `radial-gradient(ellipse at 50% 70%, #1d1a14, ${C.black} 62%)` }}>
            <div style={{ position: "absolute", left: "50%", bottom: "7svh", width: "min(80vw, 52svh, 520px)", transform: "translateX(-50%)" }}>
              <img src={`${IMG}/plinth.webp`} alt="" aria-hidden style={{ width: "100%", display: "block" }} />
              <div style={{ position: "absolute", left: "50%", bottom: "64%", width: "50%", aspectRatio: "0.62", transform: "translateX(-50%)" }}>
                <Bottle3D style={{ position: "absolute", inset: 0 }} lighting="studio" {...bottleLook} spin={0.3} drawLabel={bottleLabel} />
              </div>
            </div>
          </div>
        </div>
        {/* letterbox, grain and flash */}
        <div aria-hidden style={{ position: "absolute", left: 0, right: 0, top: 0, height: "7svh", background: "#000" }} />
        <div aria-hidden style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: "7svh", background: "#000" }} />
        <div aria-hidden className="sa-grain" />
        {cut > 0 && !still && <div key={`f${cut}`} aria-hidden className="sa-flash" />}

        {/* captions */}
        {!final && (
          <div key={cut} className="sa-cap" style={{ position: "absolute", left: 0, right: 0, bottom: "16svh", textAlign: "center", padding: "0 16px", pointerEvents: "none" }}>
            <p style={{ ...edit, fontSize: cut === 2 ? "clamp(4rem, 16vw, 11rem)" : "clamp(2rem, 6vw, 4.6rem)", lineHeight: 0.95, letterSpacing: "-.01em", ...CHROME, filter: "drop-shadow(0 4px 24px rgba(0,0,0,.9))" }}>{pick(lang, CUTS[cut].caption)}</p>
          </div>
        )}
        {cut === 0 && local < 0.5 && !still && (
          <p className="sa-hint" style={{ position: "absolute", left: 0, right: 0, top: "11svh", textAlign: "center", ...thin, fontSize: 11, letterSpacing: ".5em", color: C.white }}>{t("Листайте ↓", "Scroll ↓")}</p>
        )}
        {final && (
          <div className="sa-cap" style={{ position: "absolute", left: 0, right: 0, top: "11svh", textAlign: "center", padding: "0 16px", pointerEvents: "none" }}>
            <p style={{ ...thin, fontSize: 12, letterSpacing: ".6em", color: C.gold }}>{tagline}</p>
            <h1 style={{ ...lux, fontSize: "clamp(3.2rem, 10vw, 8.4rem)", lineHeight: 0.95, margin: "12px 0 14px", ...CHROME, filter: "drop-shadow(0 6px 30px rgba(0,0,0,.8))" }}>Self addicted</h1>
            <p style={{ ...body, fontWeight: 300, fontSize: "clamp(.95rem, 1.5vw, 1.15rem)", lineHeight: 1.6, color: C.white, maxWidth: 520, margin: "0 auto" }}>{description}</p>
          </div>
        )}
        {/* cut counter, like an edit timeline */}
        <div aria-hidden style={{ position: "absolute", left: "clamp(14px, 3vw, 32px)", bottom: "calc(7svh + 14px)", display: "flex", gap: 6 }}>
          {Array.from({ length: n }, (_, i) => <span key={i} style={{ width: 22, height: 2, background: i <= cut ? C.gold : C.faint }} />)}
        </div>
      </div>
    </section>
  );
}

// ── 2. The face scan: golden-ratio lines over the bust, and the verdict ──
// landmarks on statue.webp, in fractions of the image
const MARKS = { eyeL: [0.25, 0.33], eyeR: [0.46, 0.3], nose: [0.32, 0.38], mouth: [0.36, 0.44], jawL: [0.24, 0.49], jawR: [0.62, 0.48], chin: [0.37, 0.545], brow: [0.35, 0.26] } as const;
function Scan({ t, plain, facts, tip }: { t: (ru: string, en: string) => string; plain: string; facts: [string, string][]; tip?: string }) {
  const { ref, visible } = useReveal<HTMLDivElement>();
  const P = (k: keyof typeof MARKS) => `${MARKS[k][0] * 100} ${MARKS[k][1] * 150}`;
  const lines: [keyof typeof MARKS, keyof typeof MARKS][] = [["eyeL", "eyeR"], ["jawL", "chin"], ["chin", "jawR"], ["jawL", "eyeL"], ["jawR", "eyeR"], ["brow", "nose"], ["nose", "mouth"], ["mouth", "chin"], ["eyeL", "nose"], ["eyeR", "nose"]];
  return (
    <section style={{ position: "relative", background: C.black, padding: "120px clamp(16px,4vw,48px) 120px" }}>
      <div ref={ref} className="sa-two" style={{ maxWidth: 1200, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "40px 70px", alignItems: "center" }}>
        <div style={{ position: "relative", aspectRatio: "2 / 3", maxHeight: "86svh", margin: "0 auto", width: "100%", overflow: "hidden", border: `1px solid ${C.faint}` }}>
          <img src={`${IMG}/statue.webp`} alt="" aria-hidden style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: "grayscale(1) contrast(1.1) brightness(.85)" }} />
          <svg viewBox="0 0 100 150" preserveAspectRatio="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} aria-hidden>
            {lines.map(([a, b], i) => <path key={i} d={`M${P(a)} L${P(b)}`} stroke={C.gold} strokeWidth=".25" fill="none" pathLength={1} strokeDasharray="1" strokeDashoffset={visible ? 0 : 1} style={{ transition: `stroke-dashoffset 1.4s ease ${300 + i * 120}ms` }} />)}
            {(Object.keys(MARKS) as (keyof typeof MARKS)[]).map((k, i) => <circle key={k} cx={MARKS[k][0] * 100} cy={MARKS[k][1] * 150} r=".9" fill={C.leaf} opacity={visible ? 1 : 0} style={{ transition: `opacity .4s ease ${200 + i * 90}ms` }} />)}
          </svg>
          <div aria-hidden className="sa-scanline" />
          <div style={{ position: "absolute", left: 12, top: 12, ...thin, fontSize: 10, letterSpacing: ".25em", color: C.leaf, lineHeight: 1.8 }}>
            <div>{t("Скан · аура", "Scan · aura")}</div>
            <div>{t("Кантальный наклон: +", "Canthal tilt: +")}</div>
            <div>{t("Челюсть: 10/10", "Jaw: 10/10")}</div>
          </div>
        </div>
        <div>
          <p style={{ ...thin, fontSize: 12, letterSpacing: ".55em", color: C.gold }}>{t("Вердикт", "Verdict")}</p>
          <div style={{ display: "flex", alignItems: "baseline", gap: 16, marginTop: 6 }}>
            <span style={{ ...edit, fontSize: "clamp(4.4rem, 10vw, 8rem)", lineHeight: 0.9, ...GOLD }}>10/10</span>
            <span style={{ ...thin, fontSize: 12, letterSpacing: ".3em", color: C.dim }}>{t("Как он пахнет", "What it smells like")}</span>
          </div>
          <p style={{ ...lux, fontSize: "clamp(1.25rem, 2.1vw, 1.65rem)", lineHeight: 1.5, color: C.white, marginTop: 22 }}>{plain}</p>
          <dl className="sa-facts" style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: 1, marginTop: 32, background: C.faint, border: `1px solid ${C.faint}` }}>
            {facts.map(([k, v]) => (
              <div key={k} style={{ padding: "14px 16px", background: C.black }}>
                <dt style={{ ...thin, fontSize: 10, letterSpacing: ".3em", color: C.gold }}>{k}</dt>
                <dd style={{ ...body, fontSize: 15, lineHeight: 1.45, color: C.white, marginTop: 6 }}>{v}</dd>
              </div>
            ))}
          </dl>
          {tip && <p style={{ ...body, fontWeight: 300, fontSize: 15, color: C.dim, marginTop: 20 }}><span style={{ color: C.gold }}>♛ </span>{tip}</p>}
        </div>
      </div>
    </section>
  );
}

// ── 3. The ascension: marble → gold veins → solid gold ──
const STAGES_IMG = ["statue", "statue-kintsugi", "statue-gold"];
function Ascension({ stages, t }: { stages: { when: string; text: string; notes: string }[]; t: (ru: string, en: string) => string }) {
  const still = prefersReducedMotion();
  const { ref, p } = usePinProgress<HTMLElement>(!still);
  const stage = still ? 2 : Math.min(2, Math.floor(p * 3.05));
  const titles = [t("Мрамор", "Marble"), t("Трещины золота", "Gold veins"), t("Чистое золото", "Solid gold")];
  return (
    <section ref={ref} style={{ position: "relative", height: still ? "auto" : "330svh", background: C.black }}>
      <div style={{ position: still ? "relative" : "sticky", top: 0, height: still ? "auto" : "100svh", overflow: "hidden" }}>
        <div className="sa-asc" style={{ position: "relative", height: "100%", display: "grid", gridTemplateColumns: "1fr 1fr", alignItems: "center" }}>
          <div className="sa-asc-img" style={{ position: "relative", height: "100%", minHeight: 360 }}>
            {STAGES_IMG.map((s, i) => <img key={s} src={`${IMG}/${s}.webp`} alt={i === 0 ? t("Мраморный бюст становится золотым", "The marble bust turning to gold") : ""} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 30%", opacity: stage >= i ? 1 : 0, transition: "opacity 1.1s ease" }} />)}
            <div aria-hidden style={{ position: "absolute", inset: 0, background: `linear-gradient(90deg, transparent 55%, ${C.black})` }} />
          </div>
          <div style={{ padding: "0 clamp(16px, 5vw, 70px)" }}>
            <p style={{ ...thin, fontSize: 12, letterSpacing: ".55em", color: C.gold }}>{t("Как раскрывается на коже", "How it unfolds on skin")}</p>
            <h2 style={{ ...lux, fontSize: "clamp(2.2rem, 4.6vw, 3.8rem)", lineHeight: 1.05, marginTop: 10, ...CHROME }}>{t("Восхождение", "The ascension")}</h2>
            <div className="sa-asc-cards" style={{ position: "relative", minHeight: 280, marginTop: 30 }}>
              {stages.map((s, i) => (
                <article key={i} style={{ position: still ? "relative" : "absolute", inset: still ? undefined : 0, opacity: still || stage === i ? 1 : 0, transform: still || stage === i ? "none" : `translateY(${i < stage ? -20 : 20}px)`, transition: "opacity .7s ease, transform .9s cubic-bezier(.16,1,.3,1)", marginBottom: still ? 28 : 0 }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
                    <span style={{ ...lux, fontSize: 52, lineHeight: 1, ...GOLD }}>{["I", "II", "III"][i]}</span>
                    <span style={{ ...thin, fontSize: 12, letterSpacing: ".35em", color: C.dim }}>{s.when}</span>
                  </div>
                  <p style={{ ...lux, fontSize: "clamp(1.6rem, 2.6vw, 2.2rem)", color: C.white, marginTop: 10 }}>{titles[i]}</p>
                  <p style={{ ...body, fontWeight: 300, fontSize: "clamp(1rem, 1.5vw, 1.15rem)", lineHeight: 1.6, color: C.white, marginTop: 10 }}>{s.text}</p>
                  <p style={{ ...thin, fontSize: 11, letterSpacing: ".2em", color: C.gold, marginTop: 14, lineHeight: 1.8 }}>{s.notes}</p>
                </article>
              ))}
            </div>
            {!still && <div aria-hidden style={{ display: "flex", gap: 8, marginTop: 10 }}>{[0, 1, 2].map((i) => <span key={i} style={{ width: 40, height: 2, background: i <= stage ? C.gold : C.faint, transition: "background .4s" }} />)}</div>}
          </div>
        </div>
      </div>
    </section>
  );
}

// ── 4. The vitrine: every note is a sugar crystal on black velvet ──
function Vitrine({ tiers }: { tiers: { title: string; notes: string[] }[] }) {
  let k = 0;
  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gap: 56 }}>
      {tiers.map((tier) => (
        <div key={tier.title}>
          <p style={{ ...thin, fontSize: 11, letterSpacing: ".5em", color: C.gold, textAlign: "center", marginBottom: 22 }}>{tier.title}</p>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "28px clamp(14px, 3vw, 40px)" }}>
            {tier.notes.map((note) => {
              const i = k++;
              return (
                <Reveal key={note + i} delay={(i % 5) * 90} style={{ width: "clamp(92px, 13vw, 140px)", textAlign: "center" }}>
                  <div className="sa-gem">
                    <span aria-hidden className="sa-spot" />
                    <img src={`${IMG}/crystal-${(i % 3) + 1}.webp`} alt="" draggable={false} style={{ transform: `rotate(${((i * 47) % 30) - 15}deg)` }} />
                  </div>
                  <p style={{ ...lux, fontSize: "clamp(.95rem, 1.5vw, 1.15rem)", color: C.white, marginTop: 10, lineHeight: 1.25 }}>{note}</p>
                </Reveal>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── 5. The rating ──
function Rating({ facets, lang, t }: { facets: { label: { ru: string; en: string }; value: number }[]; lang: "ru" | "en"; t: (ru: string, en: string) => string }) {
  const { ref, visible } = useReveal<HTMLDivElement>();
  return (
    <div ref={ref} className="sa-two" style={{ maxWidth: 1060, margin: "0 auto", display: "grid", gridTemplateColumns: "300px 1fr", gap: "36px 60px", alignItems: "center" }}>
      <div style={{ position: "relative", width: "min(300px, 70vw)", margin: "0 auto" }}>
        <div style={{ aspectRatio: "1", borderRadius: "50%", overflow: "hidden", boxShadow: `0 0 0 1px ${C.gold}, 0 0 60px rgba(217,179,90,.25)` }}>
          <img src={`${IMG}/statue-gold.webp`} alt="" aria-hidden style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "45% 28%", transform: "scale(1.5)", transformOrigin: "45% 28%" }} />
        </div>
        <span style={{ position: "absolute", right: "-4%", bottom: "6%", ...edit, fontSize: 18, padding: "8px 14px", color: "#111", background: "linear-gradient(180deg, #fff3c4, #d9b35a 60%, #a07a28)", boxShadow: "0 10px 30px rgba(0,0,0,.6)" }}>{t("Топ 1%", "Top 1%")}</span>
      </div>
      <div style={{ display: "grid", gap: 22 }}>
        {facets.map((f, i) => (
          <div key={i}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <span style={{ ...thin, fontSize: 12, letterSpacing: ".3em", color: C.white }}>{pick(lang, f.label)}</span>
              <span style={{ ...edit, fontSize: 22, ...(f.value >= 80 ? GOLD : CHROME) }}>{(f.value / 10).toFixed(1)}</span>
            </div>
            <div style={{ height: 3, background: C.faint, marginTop: 8 }}>
              <div style={{ height: "100%", width: visible ? `${f.value}%` : "0%", background: f.value >= 80 ? "linear-gradient(90deg, #8f6418, #f6dc93)" : "linear-gradient(90deg, #6f7682, #ffffff)", boxShadow: f.value >= 80 ? "0 0 12px rgba(217,179,90,.6)" : "none", transition: `width 1.6s cubic-bezier(.16,1,.3,1) ${i * 110}ms` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── 6. Stories ──
const STORY_MS = 5200;
function Stories({ scenes, t }: { scenes: string[]; t: (ru: string, en: string) => string }) {
  const box = useRef<HTMLDivElement>(null);
  const [i, setI] = useState(0);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = box.current; if (!el) return;
    const io = new IntersectionObserver(([e]) => setOn(e.isIntersecting), { threshold: 0.5 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  useEffect(() => {
    if (!on || prefersReducedMotion()) return;
    const id = window.setTimeout(() => setI((v) => (v + 1) % scenes.length), STORY_MS);
    return () => clearTimeout(id);
  }, [on, i, scenes.length]);
  const go = (d: number) => setI((v) => (v + d + scenes.length) % scenes.length);
  return (
    <div ref={box} className="sa-story" style={{ position: "relative", height: "min(84svh, 760px)", aspectRatio: "9 / 16", maxWidth: "92vw", margin: "0 auto", borderRadius: 18, overflow: "hidden", background: "#111", boxShadow: `0 40px 100px rgba(0,0,0,.8), 0 0 0 1px ${C.faint}` }}>
      {scenes.map((s, k) => <img key={k} src={`${IMG}/story-${k + 1}.webp`} alt={s} loading="lazy" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: k === i ? 1 : 0, transform: k === i ? "scale(1.06)" : "scale(1)", transition: `opacity .5s ease, transform ${STORY_MS}ms linear` }} />)}
      <div aria-hidden style={{ position: "absolute", inset: 0, background: "linear-gradient(rgba(0,0,0,.55), transparent 22%, transparent 55%, rgba(0,0,0,.85))" }} />
      <div style={{ position: "absolute", left: 10, right: 10, top: 10, display: "flex", gap: 4 }}>
        {scenes.map((_, k) => (
          <span key={k} style={{ flex: 1, height: 2.5, borderRadius: 2, background: "rgba(255,255,255,.3)", overflow: "hidden" }}>
            <span key={k === i ? `on${i}` : "off"} className={k === i && on ? "sa-bar" : undefined} style={{ display: "block", height: "100%", background: "#fff", width: k < i ? "100%" : k === i && (!on || prefersReducedMotion()) ? "100%" : "0%", animationDuration: `${STORY_MS}ms` }} />
          </span>
        ))}
      </div>
      <div style={{ position: "absolute", left: 14, top: 24, display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ width: 32, height: 32, borderRadius: "50%", backgroundImage: `url(${IMG}/statue-crown.webp)`, backgroundSize: "260%", backgroundPosition: "45% 22%", boxShadow: `0 0 0 2px ${C.gold}` }} />
        <span style={{ ...body, fontWeight: 600, fontSize: 13, color: "#fff" }}>self.addicted <span style={{ color: C.gold }}>✓</span></span>
        <span style={{ ...body, fontWeight: 300, fontSize: 12, color: "rgba(255,255,255,.6)" }}>{t("сейчас", "now")}</span>
      </div>
      <p style={{ position: "absolute", left: 18, right: 18, bottom: 26, ...lux, fontSize: "clamp(1.15rem, 2.4svh, 1.45rem)", lineHeight: 1.35, color: "#fff", textShadow: "0 2px 12px rgba(0,0,0,.8)" }}>{scenes[i]}</p>
      <button aria-label={t("Назад", "Previous")} onClick={() => go(-1)} style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "35%" }} />
      <button aria-label={t("Дальше", "Next")} onClick={() => go(1)} style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: "65%" }} />
    </div>
  );
}

// ── 7. The lock screen ──
const SENDERS = [{ ru: "Неизвестный номер", en: "Unknown number" }, { ru: "Сообщения", en: "Messages" }, { ru: "♡", en: "♡" }, { ru: "Директ", en: "Direct" }, { ru: "Бывшая", en: "Ex" }];
function LockScreen({ fragments, lang }: { fragments: string[]; lang: "ru" | "en" }) {
  const { ref, visible } = useReveal<HTMLDivElement>();
  return (
    <div ref={ref} style={{ position: "relative", width: "min(360px, 88vw)", aspectRatio: "9 / 19", margin: "0 auto", borderRadius: 46, padding: 12, background: "#0b0b0b", boxShadow: `0 0 0 2px #2a2a2a, 0 0 0 3px ${C.gold}55, 0 50px 100px rgba(0,0,0,.8)` }}>
      <div style={{ position: "relative", height: "100%", borderRadius: 36, overflow: "hidden", backgroundImage: `linear-gradient(rgba(0,0,0,.35), rgba(0,0,0,.7)), url(${IMG}/statue-gold.webp)`, backgroundSize: "cover", backgroundPosition: "45% 30%" }}>
        <span aria-hidden style={{ position: "absolute", left: "50%", top: 10, width: 96, height: 26, marginLeft: -48, borderRadius: 20, background: "#000" }} />
        <div style={{ textAlign: "center", marginTop: 56 }}>
          <p style={{ ...body, fontSize: 14, color: "rgba(255,255,255,.8)" }}>{lang === "ru" ? "суббота, 14 февраля" : "Saturday, 14 February"}</p>
          <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 500, fontSize: 76, lineHeight: 1, color: "#fff", letterSpacing: "-.03em" }}>02:14</p>
        </div>
        <div style={{ position: "absolute", left: 10, right: 10, bottom: 22, display: "grid", gap: 8 }}>
          {fragments.map((f, i) => (
            <div key={i} style={{ padding: "11px 13px", borderRadius: 18, background: "rgba(30,30,30,.72)", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)", opacity: visible ? 1 : 0, transform: visible ? "none" : "translateY(30px) scale(.96)", transition: `opacity .6s ease ${400 + i * 380}ms, transform .7s cubic-bezier(.2,1.3,.4,1) ${400 + i * 380}ms` }}>
              <div style={{ display: "flex", justifyContent: "space-between", ...body, fontSize: 12 }}>
                <span style={{ fontWeight: 600, color: "#fff" }}>{pick(lang, SENDERS[i % SENDERS.length])}</span>
                <span style={{ color: "rgba(255,255,255,.5)" }}>{lang === "ru" ? `${i + 1} мин назад` : `${i + 1}m ago`}</span>
              </div>
              <p style={{ ...body, fontWeight: 400, fontSize: 14, lineHeight: 1.35, color: "rgba(255,255,255,.92)", marginTop: 3 }}>{f}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── 8. The Hollywood mirror ──
function Mirror({ onLit, t }: { onLit: () => void; t: (ru: string, en: string) => string }) {
  const [lit, setLit] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const look = () => {
    if (lit) { onLit(); return; }
    setLit(true);
    timer.current = window.setTimeout(onLit, prefersReducedMotion() ? 0 : 1500);
  };
  return (
    <button className="sa-mirror" onClick={look} aria-label={t("Посмотреть в зеркало", "Look in the mirror")} style={{ position: "relative", width: "min(420px, 84vw)", display: "block", margin: "34px auto 0" }}>
      <img src={`${IMG}/mirror-off.webp`} alt="" draggable={false} style={{ position: "relative", width: "100%", display: "block" }} />
      <img src={`${IMG}/mirror-on.webp`} alt="" draggable={false} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: lit ? 1 : 0, transition: "opacity .9s steps(6)", mixBlendMode: "normal" }} />
      {/* the reflection: the crowned bust shows up in the glass once the bulbs are on */}
      <img src={`${IMG}/statue-crown.webp`} alt="" aria-hidden draggable={false} style={{ position: "absolute", left: "16%", top: "11%", width: "68%", height: "78%", objectFit: "cover", objectPosition: "50% 20%", opacity: lit ? 0.42 : 0, mixBlendMode: "screen", filter: "sepia(.4)", transition: "opacity 1.6s ease .5s" }} />
      <div aria-hidden style={{ position: "absolute", inset: "-20%", borderRadius: "50%", background: "radial-gradient(circle, rgba(255,230,170,.35), transparent 60%)", opacity: lit ? 1 : 0, transition: "opacity 1s ease .3s", pointerEvents: "none", zIndex: -1 }} />
      <span style={{ position: "absolute", left: 0, right: 0, top: "70%", textAlign: "center", ...lux, fontSize: "clamp(1.6rem, 4vw, 2.4rem)", ...GOLD, filter: "drop-shadow(0 2px 8px rgba(0,0,0,.9))", opacity: lit ? 1 : 0, transition: "opacity .8s ease .7s", pointerEvents: "none" }}>{t("Да. Это ты.", "Yes. It's you.")}</span>
    </button>
  );
}

export default function SelfWorld({ perfume }: WorldProps) {
  const [, navigate] = useLocation();
  const { lang, setLang, t } = useLang();
  const [open, setOpen] = useState(false);
  const g = perfume.guide!;
  const n = perfume.scentNotes;
  const Lp = (v: { ru: string; en: string }) => pick(lang, v);
  const fragments = pick(lang, perfume.memoryFragments).map(fragmentText);
  const scenes = pick(lang, g.scenes);
  const stages = g.drydown.map((d) => ({ when: Lp(d.when), text: Lp(d.text), notes: n[d.notes] ? pick(lang, n[d.notes]!).join(" · ") : "" }));
  const tiers = [
    { title: t("Верх", "Top"), notes: n.top ? pick(lang, n.top) : [] },
    { title: t("Сердце", "Heart"), notes: n.heart ? pick(lang, n.heart) : [] },
    { title: t("База", "Base"), notes: n.base ? pick(lang, n.base) : [] },
  ];
  const facts: [string, string][] = [
    [t("Шлейф", "Sillage"), Lp(g.sillage)],
    [t("Сезон", "Season"), Lp(g.season)],
    [t("Когда носить", "When to wear"), Lp(g.time)],
  ];

  const skin: DialogSkin = {
    overlay: "rgba(0,0,0,.86)",
    panel: { ...body, background: "linear-gradient(180deg, #121212, #050505)", padding: "34px 28px", color: C.white, borderRadius: 2, border: "none", boxShadow: `0 40px 100px rgba(0,0,0,.8), inset 0 0 0 1px ${C.gold}` },
    title: { ...lux, fontSize: 34, ...CHROME },
    label: { ...thin, fontSize: 10, letterSpacing: ".3em", color: C.gold },
    input: { ...body, fontSize: 15, background: "transparent", border: "none", borderBottom: `1px solid ${C.faint}`, padding: "10px 0", color: C.white, borderRadius: 0 },
    button: { ...edit, fontSize: 16, letterSpacing: ".12em", background: "linear-gradient(180deg, #fff3c4, #d9b35a 60%, #a07a28)", color: "#111", padding: "15px", borderRadius: 0, boxShadow: "0 0 30px rgba(217,179,90,.3)" },
    accent: C.gold,
    heading: { ru: "Вступить в топ-1%", en: "Join the top 1%" },
    submit: { ru: "Забрать корону", en: "Claim the crown" },
    sent: { ru: "Принято. Ты и так знал, что тебя выберут.", en: "Done. You already knew you'd be chosen." },
  };

  return (
    <div style={{ ...body, background: C.black, color: C.white, minHeight: "100vh", overflowX: "clip" }}>
      <style>{`
        .sa-grain { position: absolute; inset: -50%; pointer-events: none; background-image: ${GRAIN}; opacity: .12; mix-blend-mode: overlay; animation: sa-grain .8s steps(3) infinite; }
        @keyframes sa-grain { 0% { transform: translate(0,0); } 33% { transform: translate(-3%,2%); } 66% { transform: translate(2%,-3%); } }
        .sa-flash { position: absolute; inset: 0; background: #fff; pointer-events: none; animation: sa-flash .38s ease-out forwards; } @keyframes sa-flash { from { opacity: .9; } to { opacity: 0; } }
        .sa-jolt { animation: sa-jolt .32s steps(4) both; } @keyframes sa-jolt { 0% { transform: translate(10px, -4px) scale(1.03); } 33% { transform: translate(-8px, 3px) scale(1.02); } 66% { transform: translate(4px, -2px); } 100% { transform: none; } }
        .sa-cap { animation: sa-cap .45s cubic-bezier(.2,1.4,.4,1) both; } @keyframes sa-cap { from { opacity: 0; transform: scale(1.25); filter: blur(6px); } }
        .sa-hint { animation: sa-bob 2.2s ease-in-out infinite; } @keyframes sa-bob { 50% { transform: translateY(6px); opacity: .5; } }
        .sa-scanline { position: absolute; left: 0; right: 0; top: 0; height: 18%; background: linear-gradient(transparent, rgba(243,217,143,.08)); border-bottom: 1px solid rgba(243,217,143,.55); animation: sa-scan 3.6s ease-in-out infinite alternate; }
        @keyframes sa-scan { from { transform: translateY(-20%); } to { transform: translateY(470%); } }
        .sa-gem { position: relative; aspect-ratio: 1; display: grid; place-items: center; }
        .sa-gem img { width: 78%; filter: drop-shadow(0 12px 16px rgba(0,0,0,.7)) drop-shadow(0 0 14px rgba(255,255,255,.12)); transition: transform .6s cubic-bezier(.3,1.5,.5,1), filter .4s; }
        .sa-gem:hover img { transform: translateY(-6px) scale(1.08) !important; filter: drop-shadow(0 18px 20px rgba(0,0,0,.7)) drop-shadow(0 0 26px rgba(255,240,200,.45)); }
        .sa-spot { position: absolute; left: 50%; top: -30%; width: 140%; height: 150%; transform: translateX(-50%); background: radial-gradient(ellipse at 50% 70%, rgba(255,245,220,.16), transparent 60%); pointer-events: none; }
        .sa-bar { animation: sa-bar linear forwards; } @keyframes sa-bar { from { width: 0%; } to { width: 100%; } }
        .sa-mirror img:first-child { transition: transform .5s cubic-bezier(.3,1.4,.5,1); } .sa-mirror:hover img:first-child { transform: scale(1.01); }
        .sa-mirror:focus-visible { outline: 2px solid ${C.gold}; outline-offset: 8px; }
        @media (prefers-reduced-motion: reduce) { .sa-grain, .sa-cap, .sa-hint, .sa-scanline, .sa-bar, .sa-flash, .sa-jolt { animation: none; } }
        @media (max-width: 820px) {
          .sa-two { grid-template-columns: 1fr !important; }
          .sa-facts { grid-template-columns: 1fr !important; }
          .sa-asc { grid-template-columns: 1fr !important; grid-template-rows: 46svh 1fr; }
          .sa-asc-img > div { background: linear-gradient(180deg, transparent 60%, ${C.black}) !important; }
          .sa-asc-cards { min-height: 300px !important; margin-top: 16px !important; }
        }
      `}</style>

      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 50, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px clamp(16px,3vw,28px)", ...thin, fontSize: 11, letterSpacing: ".3em", color: C.white, mixBlendMode: "difference" }}>
        <button onClick={() => navigate("/map")} style={{ color: C.white }}>← {t("К карте", "Map")}</button>
        <span style={{ ...lux, fontSize: 17, letterSpacing: ".06em", textTransform: "none" }}>Silentium</span>
        <span>{(["ru", "en"] as const).map((l) => <button key={l} onClick={() => setLang(l)} style={{ marginLeft: 10, color: C.white, opacity: lang === l ? 1 : 0.45 }}>{l.toUpperCase()}</button>)}</span>
      </nav>

      <Edit t={t} tagline={Lp(perfume.tagline)} description={Lp(perfume.description)} />

      <Scan t={t} plain={Lp(g.plain)} facts={facts} tip={g.tip && Lp(g.tip)} />

      <Ascension stages={stages} t={t} />

      <section style={{ position: "relative", background: `radial-gradient(ellipse at 50% 0%, #1a1712, ${C.black} 65%)`, padding: "120px clamp(12px,3vw,40px) 120px" }}>
        <Head kicker={t("Витрина", "The vitrine")} title={t("Из чего он сделан", "What it's made of")} />
        <Vitrine tiers={tiers} />
      </section>

      <section style={{ position: "relative", background: C.black, padding: "120px clamp(16px,4vw,48px) 120px" }}>
        <Head kicker={t("Рейтинг", "The rating")} title={t("Чего в нём больше всего", "What it holds the most of")} />
        <Rating facets={g.facets} lang={lang} t={t} />
      </section>

      <section style={{ position: "relative", background: `radial-gradient(ellipse at 50% 50%, #16130e, ${C.black} 70%)`, padding: "120px clamp(12px,3vw,40px) 120px" }}>
        <Head kicker={t("Сторис", "Stories")} title={t("Как это выглядит", "What it looks like")} />
        <Stories scenes={scenes} t={t} />
      </section>

      <section style={{ position: "relative", background: C.black, padding: "120px clamp(16px,4vw,48px) 120px" }}>
        <Head kicker={t("02:14", "2:14 am")} title={t("Тебе пишут", "They're texting you")} />
        <LockScreen fragments={fragments} lang={lang} />
      </section>

      <section style={{ position: "relative", background: `radial-gradient(ellipse at 50% 55%, #1c1810, ${C.black} 68%)`, padding: "120px 16px 120px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
        <Head kicker={t("Заявка", "Request")} title={t("Посмотри в зеркало", "Look in the mirror")} />
        <p style={{ ...body, fontWeight: 300, fontSize: 17, color: C.dim, marginTop: -26 }}>{t("Нажмите на зеркало.", "Tap the mirror.")}</p>
        <Mirror onLit={() => setOpen(true)} t={t} />
        <p style={{ ...body, fontWeight: 300, fontSize: 15, color: C.dim, maxWidth: 440, lineHeight: 1.6, marginTop: 34 }}>{t("Оставьте контакт — мы напишем и расскажем, как получить флакон.", "Leave your contact — we'll write and tell you how to get a bottle.")}</p>
        <p style={{ ...thin, fontSize: 10, letterSpacing: ".25em", color: C.dim, marginTop: 10 }}>Extrait de parfum · {perfume.releaseDate} · {pick(lang, perfume.origin.location)}</p>
      </section>

      <RequestDialog open={open} onClose={() => setOpen(false)} perfumeName={perfume.name} skin={skin} />
    </div>
  );
}
