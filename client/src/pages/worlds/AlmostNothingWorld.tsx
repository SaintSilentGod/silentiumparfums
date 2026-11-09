// almost nothing — distance.
// It has almost no sillage, so the whole page is a walk from 2 metres to 0 cm, with a hairline counter
// at the side. From far away there is only a figure by a window, blurred; scrolling brings you closer
// until the collar of the white shirt fills the screen. At 50 cm the description appears; at 10 cm a
// day on the skin (morning iron, daylight, night sheets); then the notes you press and hold like a
// fingerprint, the scenes at 0 cm and, to send a request, a trace left on the skin.
// The pointer leaves a warm blush that fades like body heat.

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useLocation } from "wouter";
import { useLang } from "@/contexts/LangContext";
import Bottle3D from "@/components/Bottle3D";
import RequestDialog, { type DialogSkin } from "@/components/RequestDialog";
import { useReveal } from "@/lib/useReveal";
import { fragmentText, pick, prefersReducedMotion, type WorldProps } from "./shared";

const C = { skin: "#efe2d6", paper: "#f6eee6", milk: "#f7f2ec", blush: "#e5bba6", ink: "#5a4a42", dim: "rgba(90,74,66,.6)", faint: "rgba(90,74,66,.22)", whisper: "rgba(90,74,66,.12)" };
const thin: CSSProperties = { fontFamily: "'Jost', 'Manrope', sans-serif", fontWeight: 200 };
const light: CSSProperties = { fontFamily: "'Jost', 'Manrope', sans-serif", fontWeight: 300 };
const IMG = "/images/almost-nothing";

const bottleLook = { liquid: "#f1e2d6", liquidOpacity: 0.45, glass: "#fffaf6", cap: "#e8d5c6", capRoughness: 0.92, collar: "#d8c3b0" };
const bottleLabel = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
  ctx.fillStyle = "#f3e7dc"; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "#5a4a42"; ctx.textAlign = "center";
  ctx.font = "200 104px 'Jost', sans-serif"; ctx.fillText("almost", w / 2, h * 0.47);
  ctx.fillText("nothing", w / 2, h * 0.7);
  ctx.font = "300 24px 'Jost', sans-serif"; ctx.fillStyle = "#9b867a"; ctx.fillText("s i l e n t i u m", w / 2, h * 0.88);
};

// 0 → 1 while a tall section scrolls past its sticky viewport
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

// The distance to the person: sections carry data-cm marks (200 → 50 → 10 → 5 → 0) and the counter
// interpolates between them as they cross the middle of the screen
function useDistance() {
  const [cm, setCm] = useState(200);
  useEffect(() => {
    let raf = 0;
    const on = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const marks = [...document.querySelectorAll<HTMLElement>("[data-cm]")].map((el) => ({ y: el.getBoundingClientRect().top + window.scrollY, cm: Number(el.dataset.cm) })).sort((x, y) => x.y - y.y);
        if (!marks.length) return;
        const at = window.scrollY + window.innerHeight * 0.5 * Math.min(1, window.scrollY / window.innerHeight); // 200 cm exactly at the top
        let v = marks[0].cm;
        for (let i = 0; i < marks.length; i++) {
          const m = marks[i], n = marks[i + 1];
          if (at >= m.y) v = n ? (at < n.y ? m.cm + ((n.cm - m.cm) * (at - m.y)) / (n.y - m.y) : n.cm) : m.cm;
        }
        setCm(Math.round(v));
      });
    };
    on();
    window.addEventListener("scroll", on, { passive: true });
    window.addEventListener("resize", on);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("scroll", on); window.removeEventListener("resize", on); };
  }, []);
  return cm;
}

function DistanceMeter({ cm, t }: { cm: number; t: (ru: string, en: string) => string }) {
  return (
    <div aria-hidden className="an-meter" style={{ position: "fixed", left: "clamp(10px, 2.4vw, 30px)", top: "50%", transform: "translateY(-50%)", zIndex: 20, display: "flex", alignItems: "center", gap: 12, pointerEvents: "none", color: C.ink }}>
      <div style={{ position: "relative", width: 1, height: "38vh", background: C.faint }}>
        <span style={{ position: "absolute", left: -3, top: `${(1 - cm / 200) * 100}%`, width: 7, height: 7, marginTop: -3, borderRadius: "50%", background: C.ink, transition: "top .2s linear" }} />
      </div>
      <div>
        <p style={{ ...thin, fontSize: 26, lineHeight: 1 }}>{cm}</p>
        <p style={{ ...light, fontSize: 10, letterSpacing: ".25em", textTransform: "uppercase", color: C.dim }}>{t("см", "cm")}</p>
      </div>
    </div>
  );
}

// What each note feels like on skin
const NOTE_TEXT: Record<string, [string, string]> = {
  Hedione: ["Прозрачный жасмин. Не цветок — воздух между двумя людьми.", "Transparent jasmine. Not a flower — the air between two people."],
  "Iso E Super": ["Дерево, которого не видно. Только тепло, которое от него остаётся.", "A wood you can't see. Only the warmth it leaves behind."],
  Musk: ["Чистая кожа. То, как пахнет человек, а не духи.", "Clean skin. The way a person smells, not a perfume."],
  "Hot Iron": ["Горячий утюг по свежему хлопку. Тепло, ставшее запахом.", "A hot iron over fresh cotton. Warmth turned into scent."],
};

// Warm blush wherever the pointer or a finger rests, fading like body heat
function Warmth() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const cv = ref.current!;
    const ctx = cv.getContext("2d")!;
    const K = 0.5;
    const fit = () => { cv.width = Math.round(innerWidth * K); cv.height = Math.round(innerHeight * K); };
    fit();
    addEventListener("resize", fit);
    let last: [number, number] | null = null;
    let touched = 0;
    const warm = (e: PointerEvent) => {
      touched = performance.now();
      const x = e.clientX * K, y = e.clientY * K;
      const steps = last ? Math.max(1, Math.round(Math.hypot(x - last[0], y - last[1]) / 10)) : 1;
      for (let i = 1; i <= steps; i++) {
        const px = last ? last[0] + ((x - last[0]) * i) / steps : x;
        const py = last ? last[1] + ((y - last[1]) * i) / steps : y;
        const g = ctx.createRadialGradient(px, py, 0, px, py, 46);
        g.addColorStop(0, "rgba(226,150,128,0.06)");
        g.addColorStop(1, "rgba(226,150,128,0)");
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(px, py, 46, 0, Math.PI * 2); ctx.fill();
      }
      last = [x, y];
    };
    const leave = () => { last = null; };
    addEventListener("pointermove", warm);
    addEventListener("pointerout", leave);
    let raf = 0;
    let prev = performance.now();
    const cool = (now: number) => {
      // time-based, so warmth fades in ~2 s however often frames come
      const dt = Math.min(1, (now - prev) / 1000); prev = now;
      ctx.globalCompositeOperation = "destination-out";
      ctx.fillStyle = `rgba(0,0,0,${(1 - Math.exp(-dt / 0.9)).toFixed(4)})`;
      ctx.fillRect(0, 0, cv.width, cv.height);
      ctx.globalCompositeOperation = "source-over";
      if (touched && now - touched > 5000) { ctx.clearRect(0, 0, cv.width, cv.height); touched = 0; } // 8-bit alpha never quite reaches zero
      raf = requestAnimationFrame(cool);
    };
    raf = requestAnimationFrame(cool);
    return () => { cancelAnimationFrame(raf); removeEventListener("resize", fit); removeEventListener("pointermove", warm); removeEventListener("pointerout", leave); };
  }, []);
  return <canvas ref={ref} aria-hidden style={{ position: "fixed", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 1, filter: "blur(10px)" }} />;
}

function Fingerprint({ progress, size = 88 }: { progress: number; size?: number }) {
  // Whorl: open ellipses whose gaps drift around, like the ridges of a fingertip
  const ridges = Array.from({ length: 7 }, (_, i) => {
    const rx = 5 + i * 5.6, ry = rx * 1.28;
    const a0 = ((110 + i * 23) * Math.PI) / 180, sweep = ((i === 0 ? 250 : 290 + (i % 3) * 18) * Math.PI) / 180;
    const p0 = [Math.cos(a0) * rx, Math.sin(a0) * ry + 4], a1 = a0 + sweep, p1 = [Math.cos(a1) * rx, Math.sin(a1) * ry + 4];
    return `M ${p0[0].toFixed(2)} ${p0[1].toFixed(2)} A ${rx} ${ry} 0 ${sweep > Math.PI ? 1 : 0} 1 ${p1[0].toFixed(2)} ${p1[1].toFixed(2)}`;
  });
  return (
    <svg viewBox="-46 -52 92 104" width={size} height={size * 1.13} aria-hidden>
      {ridges.map((d, i) => (
        <g key={i}>
          <path d={d} fill="none" stroke="rgba(90,74,66,.3)" strokeWidth="1.3" strokeLinecap="round" />
          <path d={d} pathLength={1} fill="none" stroke="#c98f76" strokeWidth="1.8" strokeLinecap="round" strokeDasharray={`${Math.min(1, Math.max(0, progress * 1.5 - i * 0.07))} 1`} />
        </g>
      ))}
    </svg>
  );
}

// Press and hold to reveal — like a scent appearing on a warm wrist
function HoldNote({ note, text, t }: { note: string; text: string; t: (ru: string, en: string) => string }) {
  const [p, setP] = useState(0);
  const [open, setOpen] = useState(false);
  const holding = useRef(false);
  const raf = useRef(0);
  useEffect(() => () => cancelAnimationFrame(raf.current), []);
  const run = () => {
    let last = performance.now();
    const step = (now: number) => {
      const dt = (now - last) / 1000; last = now;
      setP((v) => {
        const next = holding.current ? Math.min(1, v + dt / 0.9) : Math.max(0, v - dt / 0.6);
        if (next >= 1 && holding.current) setOpen(true);
        if ((next > 0 && next < 1) || holding.current) raf.current = requestAnimationFrame(step);
        return next;
      });
    };
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(step);
  };
  const start = (e: React.PointerEvent) => { e.preventDefault(); if (open) return; holding.current = true; run(); };
  const stop = () => { holding.current = false; if (!open) run(); };
  const shown = open ? 1 : p;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 14 }}>
      <button
        onPointerDown={start} onPointerUp={stop} onPointerLeave={stop} onPointerCancel={stop}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setOpen(true); } }}
        onContextMenu={(e) => e.preventDefault()}
        aria-label={t(`Удерживайте, чтобы раскрыть: ${note}`, `Hold to reveal: ${note}`)}
        aria-expanded={open}
        style={{ touchAction: "none", userSelect: "none", WebkitUserSelect: "none", borderRadius: "50%", padding: 16, background: `radial-gradient(circle, rgba(229,187,166,${0.35 * shown}) 0%, transparent 70%)`, transition: "background .3s" }}
      >
        <Fingerprint progress={shown} />
      </button>
      <p style={{ ...light, fontSize: 22, letterSpacing: ".02em", color: C.ink, opacity: 0.3 + shown * 0.7, filter: `blur(${(1 - shown) * 3}px)`, transition: open ? "all 1.2s ease" : "none" }}>{note}</p>
      <p style={{ ...light, fontSize: 17, lineHeight: 1.5, color: "rgba(90,74,66,.8)", maxWidth: 240, minHeight: 82, opacity: open ? 1 : 0, transform: open ? "none" : "translateY(8px)", transition: "all 1.4s ease .2s" }}>{text}</p>
      {!open && <span style={{ ...light, fontSize: 11, letterSpacing: ".25em", color: C.dim, textTransform: "uppercase" }}>{t("удерживайте", "hold")}</span>}
    </div>
  );
}

// Optional generated photo: renders nothing until the file exists
function Photo({ src, alt, style }: { src: string; alt: string; style?: CSSProperties }) {
  const [ok, setOk] = useState(true);
  if (!ok) return null;
  return <img src={src} alt={alt} loading="lazy" onError={() => setOk(false)} style={{ display: "block", width: "100%", objectFit: "cover", ...style }} />;
}

function Whisper({ children, style }: { children: React.ReactNode; style?: CSSProperties }) {
  const { ref, visible } = useReveal("0px 0px -25% 0px");
  return <div ref={ref} style={{ ...style, opacity: visible ? 1 : 0.06, transition: "opacity 2.6s ease" }}>{children}</div>;
}

// ── 2 m → 50 cm: walking up to the figure by the window until the collar fills the screen ──
const COLLAR = { x: 0.498, y: 0.39 }; // the shirt collar in window.webp (3:2)

function Approach({ t, description }: { t: (ru: string, en: string) => string; description: string }) {
  const still = prefersReducedMotion();
  const { ref, p } = usePinProgress<HTMLElement>(!still);
  const [vp, setVp] = useState(() => ({ w: window.innerWidth, h: window.innerHeight }));
  useEffect(() => { const on = () => setVp({ w: window.innerWidth, h: window.innerHeight }); addEventListener("resize", on); return () => removeEventListener("resize", on); }, []);
  const s0 = Math.max(vp.w / 1536, vp.h / 1024);
  const origin = `${(vp.w - 1536 * s0) / 2 + COLLAR.x * 1536 * s0}px ${(vp.h - 1024 * s0) / 2 + COLLAR.y * 1024 * s0}px`;
  const walk = still ? 0 : Math.min(1, p / 0.8);
  const scale = 1 + Math.pow(walk, 2.4) * 5.5;
  const blur = still ? 0 : Math.max(0, 7 - walk * 9);
  const close = still ? 0 : Math.max(0, Math.min(1, (p - 0.62) / 0.3)); // the close-up takes over
  const titleOut = Math.min(1, p / 0.3);
  return (
    <section ref={ref} data-cm="200" style={{ position: "relative", height: still ? "100svh" : "320svh" }}>
      <div style={{ position: still ? "relative" : "sticky", top: 0, height: "100svh", overflow: "hidden", background: C.milk }}>
        <div style={{ position: "absolute", inset: 0, transformOrigin: origin, transform: `scale(${scale})`, filter: `blur(${blur}px)`, opacity: 0.55 + walk * 0.45, willChange: "transform, filter" }}>
          <img src={`${IMG}/window.webp`} alt={t("Человек в белой рубашке у окна", "A person in a white shirt by the window")} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
        <img src={`${IMG}/collar.webp`} alt={t("Воротник белой рубашки и шея крупным планом", "The collar of a white shirt and a neck, close up")} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: close, transform: `scale(${1.12 - close * 0.12})` }} />
        <div aria-hidden style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at 50% 45%, transparent 30%, rgba(247,242,236,${0.85 - walk * 0.6}) 85%)` }} />
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "0 16px", pointerEvents: "none", opacity: 1 - titleOut, filter: `blur(${titleOut * 6}px)` }}>
          <h1 style={{ ...thin, fontSize: "clamp(3rem, 9vw, 7.5rem)", letterSpacing: "-.03em", lineHeight: 0.95, color: C.ink, opacity: 0.55 }}>almost nothing</h1>
          <p style={{ ...light, fontSize: "clamp(1rem, 1.5vw, 1.2rem)", color: C.dim, marginTop: 18, maxWidth: 460, lineHeight: 1.6, opacity: 0.7 }}>{description}</p>
          <p className="an-breathe" style={{ ...light, fontSize: 11, letterSpacing: ".3em", color: C.dim, textTransform: "uppercase", marginTop: 46 }}>{t("подойдите ближе", "come closer")} ↓</p>
        </div>
      </div>
    </section>
  );
}

// ── 10 cm: one day on the skin ──
const DAY = [
  { img: `${IMG}/stage-morning.webp`, bg: "#f4f1ec", notes: { ru: ["Горячее железо", "Гедион"], en: ["Hot Iron", "Hedione"] } },
  { img: `${IMG}/stage-day.webp`, bg: "#f3e2cf", notes: { ru: ["Iso E Super"], en: ["Iso E Super"] } },
  { img: `${IMG}/stage-night.webp`, bg: "#d9c3b3", notes: { ru: ["Мускус"], en: ["Musk"] } },
];

function DayOnSkin({ stages, lang, t }: { stages: { when: string; text: string }[]; lang: "ru" | "en"; t: (ru: string, en: string) => string }) {
  const still = prefersReducedMotion();
  const { ref, p } = usePinProgress<HTMLElement>(!still);
  const stage = still ? 0 : Math.min(2, Math.floor(p * 3.05));
  return (
    <section ref={ref} data-cm="10" style={{ position: "relative", zIndex: 3, height: still ? "auto" : "330svh", background: DAY[stage].bg, transition: "background 1.4s ease" }}>
      <div style={{ position: still ? "relative" : "sticky", top: 0, minHeight: "100svh", display: "flex", flexDirection: "column", justifyContent: "center", padding: "70px clamp(16px,5vw,64px) 30px" }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ ...light, fontSize: 12, letterSpacing: ".3em", color: C.dim, textTransform: "uppercase" }}>10 {t("см", "cm")} · {t("как раскрывается на коже", "how it unfolds on skin")}</p>
          <h2 style={{ ...thin, fontSize: "clamp(2.2rem, 5vw, 4rem)", marginTop: 8 }}>{t("Один день на коже", "One day on the skin")}</h2>
        </div>
        <div className="an-day" style={{ maxWidth: 1080, width: "100%", margin: "30px auto 0", display: "grid", gridTemplateColumns: "minmax(0,.9fr) minmax(0,1.1fr)", gap: "26px 70px", alignItems: "center" }}>
          <div className="an-day-photo" style={{ position: "relative", aspectRatio: "4 / 5", maxHeight: "62svh", width: "100%", margin: "0 auto", borderRadius: 4, overflow: "hidden", boxShadow: "0 40px 80px rgba(90,74,66,.16)" }}>
            {DAY.map((d, i) => <img key={d.img} src={d.img} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: still ? (i === 0 ? 1 : 0) : stage === i ? 1 : 0, transform: stage === i ? "scale(1)" : "scale(1.05)", transition: "opacity 1.4s ease, transform 3s ease" }} />)}
          </div>
          <div style={{ position: "relative", minHeight: "min(40svh, 330px)" }}>
            {stages.map((s, i) => (
              <article key={i} style={{ position: still ? "relative" : "absolute", inset: still ? undefined : 0, display: "flex", flexDirection: "column", justifyContent: "center", opacity: still || stage === i ? 1 : 0, filter: still || stage === i ? "blur(0)" : "blur(8px)", transition: "opacity 1.2s ease, filter 1.4s ease", marginBottom: still ? 30 : 0 }}>
                <p style={{ ...light, fontSize: 11, letterSpacing: ".3em", color: C.dim, textTransform: "uppercase" }}>{String(i + 1).padStart(2, "0")} / 03</p>
                <p style={{ ...thin, fontSize: "clamp(2.6rem, 5.4vw, 4.4rem)", lineHeight: 1, marginTop: 10 }}>{s.when}</p>
                <p style={{ ...light, fontSize: "clamp(1.05rem, 1.6vw, 1.25rem)", lineHeight: 1.65, marginTop: 16, color: "rgba(90,74,66,.9)" }}>{s.text}</p>
                <p style={{ ...light, fontSize: 12, letterSpacing: ".2em", textTransform: "uppercase", color: C.dim, marginTop: 18 }}>{pick(lang, DAY[i].notes).join(" · ")}</p>
              </article>
            ))}
          </div>
        </div>
        {!still && <div aria-hidden style={{ display: "flex", justifyContent: "center", gap: 10, marginTop: 24 }}>{[0, 1, 2].map((i) => <span key={i} style={{ width: 40, height: 1, background: C.ink, opacity: i <= stage ? 0.8 : 0.2, transition: "opacity .4s" }} />)}</div>}
      </div>
    </section>
  );
}

export default function AlmostNothingWorld({ perfume }: WorldProps) {
  const [, navigate] = useLocation();
  const { lang, setLang, t } = useLang();
  const [open, setOpen] = useState(false);
  const [traces, setTraces] = useState<{ x: number; y: number; r: number }[]>([]);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const cm = useDistance();
  const g = perfume.guide!;
  const Lp = (v: { ru: string; en: string }) => pick(lang, v);
  const fragments = pick(lang, perfume.memoryFragments).map(fragmentText);
  const notesEn = perfume.scentNotes.all?.en ?? [];
  const notesLocal = perfume.scentNotes.all ? pick(lang, perfume.scentNotes.all) : [];
  const stages = g.drydown.map((d) => ({ when: Lp(d.when), text: Lp(d.text) }));
  const scenes = pick(lang, g.scenes);

  const leaveTrace = (e: React.MouseEvent<HTMLButtonElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    setTraces((tr) => [...tr, { x: e.clientX - r.left, y: e.clientY - r.top, r: Math.random() * 50 - 25 }]);
    clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setOpen(true), prefersReducedMotion() ? 0 : 900);
  };

  const skin: DialogSkin = {
    overlay: "rgba(239,226,214,.86)",
    panel: { ...thin, background: C.paper, color: C.ink, padding: "36px 30px", borderRadius: 28, boxShadow: "0 40px 100px rgba(90,74,66,.16)" },
    title: { ...thin, fontSize: 34, letterSpacing: "-.01em" },
    label: { ...light, fontSize: 11, letterSpacing: ".2em", textTransform: "uppercase", color: C.dim },
    input: { ...light, fontSize: 18, background: "transparent", border: "none", borderBottom: `1px solid ${C.faint}`, padding: "8px 0", color: C.ink },
    button: { ...light, fontSize: 14, letterSpacing: ".3em", textTransform: "uppercase", background: C.ink, color: C.paper, padding: "15px", borderRadius: 999 },
    accent: "#b07a63",
    heading: { ru: "почти ничего", en: "almost nothing" },
    submit: { ru: "Отправить", en: "Send" },
    sent: { ru: "Мы рядом.", en: "We're close." },
  };

  const facts: [string, string][] = [
    [t("Стойкость", "Longevity"), Lp(g.longevity)],
    [t("Шлейф", "Sillage"), Lp(g.sillage)],
    [t("Сезон", "Season"), Lp(g.season)],
    [t("Когда носить", "When to wear"), Lp(g.time)],
  ];
  const kicker = (txt: string): CSSProperties => ({ ...light, fontSize: 12, letterSpacing: ".3em", color: C.dim, textTransform: "uppercase" });

  return (
    <div style={{ ...thin, background: `radial-gradient(ellipse at 50% 20%, #f6ebe1, ${C.skin} 60%, #e8d8ca)`, color: C.ink, minHeight: "100vh", overflowX: "clip", position: "relative" }}>
      <style>{`
        .an-grain::after { content: ""; position: fixed; inset: 0; pointer-events: none; z-index: 2; opacity: .22; mix-blend-mode: multiply;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 160 160' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.2' numOctaves='2'/%3E%3CfeColorMatrix values='0 0 0 0 .55 0 0 0 0 .42 0 0 0 0 .36 0 0 0 .5 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"); }
        .an-breathe { animation: an-breathe 7s ease-in-out infinite; } @keyframes an-breathe { 50% { opacity: .55; } }
        @media (prefers-reduced-motion: reduce) { .an-breathe { animation: none; } }
        @media (max-width: 820px) {
          .an-day, .an-two { grid-template-columns: 1fr !important; }
          .an-day-photo { max-height: 32svh !important; width: auto !important; height: 32svh; }
          .an-meter { left: auto !important; right: 10px; top: auto !important; bottom: 14px; transform: none !important; }
          .an-meter > div:first-child { display: none; }
          .an-scenes { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>
      <div className="an-grain" />
      <Warmth />
      <DistanceMeter cm={cm} t={t} />

      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 30, display: "flex", justifyContent: "space-between", padding: "20px clamp(16px,4vw,48px)", ...light, fontSize: 12, letterSpacing: ".25em", color: C.dim, pointerEvents: "none" }}>
        <button onClick={() => navigate("/map")} style={{ color: C.dim, pointerEvents: "auto" }}>← {t("карта", "map")}</button>
        <span>silentium</span>
        <span style={{ pointerEvents: "auto" }}>{(["ru", "en"] as const).map((l) => <button key={l} onClick={() => setLang(l)} style={{ marginLeft: 12, color: lang === l ? C.ink : C.faint }}>{l}</button>)}</span>
      </nav>

      <Approach t={t} description={pick(lang, perfume.description)} />

      {/* 50 cm: what it smells like, on white cotton */}
      <section data-cm="50" style={{ position: "relative", zIndex: 3, padding: "120px clamp(16px,5vw,64px) 130px", backgroundImage: `linear-gradient(rgba(247,242,236,.86), rgba(247,242,236,.86)), url(${IMG}/cotton.webp)`, backgroundSize: "auto, 420px" }}>
        <div className="an-two" style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gridTemplateColumns: "1.2fr .8fr", gap: "40px 70px", alignItems: "center" }}>
          <Whisper>
            <p style={kicker("")}>50 {t("см", "cm")} · {t("как он пахнет", "what it smells like")}</p>
            <p style={{ ...thin, fontSize: "clamp(1.6rem, 2.8vw, 2.4rem)", lineHeight: 1.35, marginTop: 16 }}>{Lp(g.plain)}</p>
            <dl style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px 30px", marginTop: 38 }}>
              {facts.map(([k, v]) => (
                <div key={k} style={{ borderTop: `1px solid ${C.faint}`, paddingTop: 10 }}>
                  <dt style={{ ...light, fontSize: 10, letterSpacing: ".3em", textTransform: "uppercase", color: C.dim }}>{k}</dt>
                  <dd style={{ ...light, fontSize: 16, lineHeight: 1.45, marginTop: 5 }}>{v}</dd>
                </div>
              ))}
            </dl>
            {g.tip && <p style={{ ...light, marginTop: 24, fontSize: 15, color: C.dim }}>— {Lp(g.tip)}</p>}
          </Whisper>
          <Whisper style={{ display: "flex", justifyContent: "center" }}>
            <div style={{ position: "relative", width: "min(300px, 66vw)", height: "min(420px, 90vw)" }}>
              <Bottle3D style={{ position: "absolute", inset: 0 }} lighting="fog" {...bottleLook} spin={0.07} drawLabel={bottleLabel} />
            </div>
          </Whisper>
        </div>
      </section>

      <DayOnSkin stages={stages} lang={lang} t={t} />

      <main style={{ position: "relative", zIndex: 3, maxWidth: 1100, margin: "0 auto", padding: "120px clamp(16px,5vw,64px) 0" }}>
        {/* notes on skin */}
        <section data-cm="5" style={{ marginBottom: 160 }}>
          <Whisper style={{ textAlign: "center", marginBottom: 50 }}>
            <p style={kicker("")}>5 {t("см", "cm")} · {t("четыре ноты", "four notes")}</p>
            <h2 style={{ ...thin, fontSize: "clamp(2rem, 4.6vw, 3.6rem)", marginTop: 10 }}>{t("Прикоснитесь и подержите", "Touch and hold")}</h2>
          </Whisper>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 30 }}>
            {notesEn.map((en, i) => <HoldNote key={en} note={notesLocal[i] ?? en} text={lang === "ru" ? NOTE_TEXT[en]?.[0] ?? "" : NOTE_TEXT[en]?.[1] ?? ""} t={t} />)}
          </div>
        </section>

        {/* 0 cm: scenes */}
        <section data-cm="0" style={{ marginBottom: 120 }}>
          <Whisper style={{ textAlign: "center", marginBottom: 46 }}>
            <p style={kicker("")}>0 {t("см", "cm")}</p>
            <h2 style={{ ...thin, fontSize: "clamp(2rem, 4.6vw, 3.6rem)", marginTop: 10 }}>{t("На что это похоже", "What it feels like")}</h2>
          </Whisper>
          <div className="an-scenes" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "clamp(10px, 2vw, 22px)", alignItems: "start" }}>
            {scenes.map((sc, i) => (
              <Whisper key={i} style={{ marginTop: i % 2 ? "8vh" : 0 }}>
                <Photo src={`${IMG}/scene-${i + 1}.webp`} alt={sc} style={{ aspectRatio: "3 / 4", borderRadius: 3, boxShadow: "0 30px 60px rgba(90,74,66,.12)" }} />
                <p style={{ ...light, fontSize: 14, lineHeight: 1.5, color: C.dim, marginTop: 12 }}>{sc.toLowerCase()}</p>
              </Whisper>
            ))}
          </div>
        </section>

        {/* whispers */}
        <section style={{ marginBottom: 120, textAlign: "center" }}>
          {fragments.map((f, i) => (
            <Whisper key={i} style={{ padding: "7vh 0" }}>
              <p style={{ ...thin, fontSize: "clamp(1.4rem, 3vw, 2.4rem)", lineHeight: 1.2, color: C.ink }}>{f.toLowerCase()}</p>
            </Whisper>
          ))}
        </section>
      </main>

      {/* leave a trace */}
      <section style={{ position: "relative", zIndex: 3, padding: "4vh clamp(16px,5vw,64px) 16vh", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 18 }}>
        <p style={{ ...thin, fontSize: "clamp(1.8rem, 4vw, 3rem)" }}>{t("Оставьте след", "Leave a trace")}</p>
        <p style={{ ...light, fontSize: 15, color: C.dim, maxWidth: 420, lineHeight: 1.6 }}>{t("Коснитесь кожи — отпечаток останется, и откроется заявка.", "Touch the skin — the print will stay and the request will open.")}</p>
        <button onClick={leaveTrace} aria-label={t("Оставить след и написать нам", "Leave a trace and write to us")} style={{ position: "relative", width: "min(420px, 86vw)", height: 220, borderRadius: 999, background: `radial-gradient(ellipse at 50% 40%, #f8efe7, ${C.skin})`, boxShadow: "inset 0 2px 20px rgba(90,74,66,.08), 0 20px 60px rgba(90,74,66,.10)", overflow: "hidden", marginTop: 10 }}>
          <span style={{ ...light, fontSize: 12, letterSpacing: ".3em", textTransform: "uppercase", color: C.dim }}>{t("коснитесь", "touch")}</span>
          {traces.map((tr, i) => (
            <span key={i} style={{ position: "absolute", left: tr.x - 34, top: tr.y - 40, transform: `rotate(${tr.r}deg)`, opacity: 0.8, pointerEvents: "none" }}><Fingerprint progress={1} size={68} /></span>
          ))}
        </button>
        <p style={{ ...light, fontSize: 12, color: C.dim, marginTop: 10 }}>{pick(lang, perfume.origin.location).toLowerCase()} · {perfume.origin.coords} · extrait de parfum</p>
      </section>

      <RequestDialog open={open} onClose={() => setOpen(false)} perfumeName={perfume.name} skin={skin} />
    </div>
  );
}
