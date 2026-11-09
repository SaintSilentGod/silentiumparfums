// Laundry Routine — a Sunday wash on a cold sunny day, one cycle from start to finish.
// The screen is a white machine with a huge porthole: scrolling spins the drum, the door swings open and
// a white sheet floods the screen; the description is printed on a satin care label; the drydown is the
// programme dial (wash → rinse → sun-dry) with an LED countdown; the notes hang on a clothesline in the
// yard and blow away from the pointer like wind; strength as stacks of folded towels; the scenes are
// printed on sheets moving in the wind; and the request is the Start button.

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useLocation } from "wouter";
import { useLang } from "@/contexts/LangContext";
import Bottle3D from "@/components/Bottle3D";
import RequestDialog, { type DialogSkin } from "@/components/RequestDialog";
import { useReveal } from "@/lib/useReveal";
import { fragmentText, pick, prefersReducedMotion, type WorldProps } from "./shared";

const C = { white: "#f6f8f9", panel: "#eceff1", ink: "#1f2a33", dim: "rgba(31,42,51,.58)", faint: "rgba(31,42,51,.14)", blue: "#9cc7e6", ice: "#d9ecf8", mint: "#bfe5d6", sun: "#ffd76a", led: "#47e0a0" };
const head: CSSProperties = { fontFamily: "'Jost', sans-serif", fontWeight: 300 };
const label: CSSProperties = { fontFamily: "'Jost', sans-serif", fontWeight: 400, textTransform: "uppercase", letterSpacing: ".3em" };
const body: CSSProperties = { fontFamily: "'Manrope', sans-serif" };
const led: CSSProperties = { fontFamily: "'JetBrains Mono', monospace", fontWeight: 500 };
const IMG = "/images/laundry-routine";

const bottleLabel = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
  ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = "#9cc7e6"; ctx.lineWidth = 3; ctx.setLineDash([10, 8]); ctx.strokeRect(22, 22, w - 44, h - 44); ctx.setLineDash([]);
  ctx.fillStyle = "#1f2a33"; ctx.textAlign = "center";
  ctx.font = "300 84px 'Jost', sans-serif"; ctx.fillText("laundry", w / 2, h * 0.46);
  ctx.fillText("routine", w / 2, h * 0.66);
  ctx.font = "500 24px 'JetBrains Mono', monospace"; ctx.fillText("30° · COTTON · ICE", w / 2, h * 0.84);
};
const bottleLook = { liquid: "#cfe6f5", liquidOpacity: 0.5, glass: "#ffffff", cap: "#f2f4f5", capRoughness: 0.5, collar: "#bcc6cc" };

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

function Reveal({ children, delay = 0, style }: { children: React.ReactNode; delay?: number; style?: CSSProperties }) {
  const { ref, visible } = useReveal();
  return <div ref={ref} style={{ ...style, opacity: visible ? 1 : 0, transform: visible ? "none" : "translateY(24px)", transition: `opacity 1s ease ${delay}ms, transform 1.1s cubic-bezier(.16,1,.3,1) ${delay}ms` }}>{children}</div>;
}

function Head({ kicker, title, color = C.ink }: { kicker: string; title: string; color?: string }) {
  return (
    <Reveal style={{ textAlign: "center", marginBottom: 46 }}>
      <p style={{ ...label, fontSize: 11, color: C.dim }}>{kicker}</p>
      <h2 style={{ ...head, fontSize: "clamp(2.4rem, 6vw, 4.6rem)", lineHeight: 1, marginTop: 12, color }}>{title}</h2>
    </Reveal>
  );
}

// The drum seen through a porthole: the laundry turns, the water stays level, the glass reflects
function Porthole({ angle, size, water = true, children }: { angle: number; size: string; water?: boolean; children?: React.ReactNode }) {
  return (
    <div style={{ position: "relative", width: size, aspectRatio: "1", borderRadius: "50%", padding: "4.5%", background: "conic-gradient(from 210deg, #fdfefe, #b9c3c9, #ffffff, #9aa6ad, #f4f7f8, #b9c3c9, #fdfefe)", boxShadow: "0 30px 60px rgba(31,42,51,.18), inset 0 0 0 2px rgba(255,255,255,.8)" }}>
      <div style={{ position: "relative", width: "100%", height: "100%", borderRadius: "50%", padding: "5%", background: "radial-gradient(circle, #54606a 60%, #2a3238)" }}>
        <div style={{ position: "relative", width: "100%", height: "100%", borderRadius: "50%", overflow: "hidden", background: "#cfd8de" }}>
          <img src={`${IMG}/drum.webp`} alt="" aria-hidden style={{ position: "absolute", inset: "-6%", width: "112%", height: "112%", maxWidth: "none", transform: `rotate(${angle}deg)`, willChange: "transform" }} />
          {water && <div aria-hidden className="ld-water" />}
          <div aria-hidden style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "radial-gradient(ellipse at 32% 24%, rgba(255,255,255,.55), rgba(255,255,255,0) 32%), radial-gradient(circle, transparent 62%, rgba(20,30,40,.35))" }} />
          {children}
        </div>
      </div>
    </div>
  );
}

// ── 1. The machine: the drum spins as you scroll, then the door opens and a sheet floods the screen ──
function Machine({ t, description }: { t: (ru: string, en: string) => string; description: string }) {
  const still = prefersReducedMotion();
  const { ref, p } = usePinProgress<HTMLElement>(!still);
  const [idle, setIdle] = useState(0);
  useEffect(() => {
    if (still) return;
    let raf = 0; const t0 = performance.now();
    const loop = (now: number) => { setIdle(((now - t0) / 1000) * 24); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [still]);
  const spin = idle + p * 1440;
  const door = still ? 0 : Math.max(0, Math.min(1, (p - 0.55) / 0.2));
  const sheet = still ? 0 : Math.max(0, Math.min(1, (p - 0.72) / 0.26));
  const titleOut = Math.min(1, p / 0.25);
  const mins = Math.max(0, Math.round(45 - p * 45));
  return (
    <section ref={ref} style={{ position: "relative", height: still ? "100svh" : "300svh", background: C.panel }}>
      <div style={{ position: still ? "relative" : "sticky", top: 0, height: "100svh", overflow: "hidden", background: `linear-gradient(180deg, #f7f9fa, ${C.panel})` }}>
        {/* the control strip of the machine */}
        <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: "clamp(84px, 13vh, 120px)", display: "flex", alignItems: "flex-end", justifyContent: "space-between", padding: "0 clamp(16px, 4vw, 48px) 14px", borderBottom: `1px solid ${C.faint}`, background: "linear-gradient(#ffffff, #f1f4f5)" }}>
          <span style={{ ...label, fontSize: 10, color: C.dim }}>Silentium · {t("Программа", "Programme")}: {t("Хлопок 30°", "Cotton 30°")}</span>
          <span className="ld-led" style={{ ...led, fontSize: 22 }}>0:{String(mins).padStart(2, "0")}</span>
        </div>
        <div style={{ position: "absolute", left: "50%", top: "45%", transform: "translate(-50%, -50%)", width: "min(76vw, 52svh)", aspectRatio: "1" }}>
          {/* inside: the drum, then the room beyond once the door is open */}
          <div style={{ position: "absolute", inset: 0, transform: `scale(${1 + door * 0.12})` }}>
            <Porthole angle={spin} size="100%" />
          </div>
          {/* the door: chrome ring + glass, swinging open on its left hinge */}
          <div aria-hidden style={{ position: "absolute", inset: "-3%", borderRadius: "50%", transformOrigin: "0% 50%", transform: `perspective(1400px) rotateY(${-door * 105}deg)`, opacity: door > 0.95 ? 0 : 1, background: "radial-gradient(circle, rgba(220,235,245,.18) 62%, transparent 63%), conic-gradient(from 30deg, #ffffff, #c6ced3, #ffffff, #a9b4ba, #ffffff)", WebkitMaskImage: "radial-gradient(circle, #000 63%, transparent 63.5%, transparent 66%, #000 66.5%)", maskImage: "radial-gradient(circle, rgba(0,0,0,.35) 63%, #000 63.5%)", boxShadow: "0 20px 40px rgba(31,42,51,.2)" }} />
          <span aria-hidden style={{ position: "absolute", left: "-4%", top: "44%", width: "5%", height: "12%", borderRadius: 6, background: "linear-gradient(90deg, #cfd6da, #ffffff, #b5bfc5)", boxShadow: "0 4px 10px rgba(0,0,0,.15)" }} />
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, bottom: "clamp(30px, 7vh, 70px)", textAlign: "center", padding: "0 16px", opacity: 1 - titleOut, transform: `translateY(${titleOut * 20}px)` }}>
          <h1 style={{ ...head, fontSize: "clamp(3rem, 9vw, 7.5rem)", lineHeight: 0.95, color: C.ink, letterSpacing: "-.01em" }}>Laundry Routine</h1>
          <p style={{ ...body, fontSize: "clamp(1rem, 1.5vw, 1.2rem)", lineHeight: 1.55, color: C.dim, maxWidth: 520, margin: "12px auto 0" }}>{description}</p>
        </div>
        {/* the clean sheet that flies out and covers everything */}
        <div aria-hidden style={{ position: "absolute", left: "50%", top: "45%", width: "40vmax", height: "40vmax", borderRadius: "50%", transform: `translate(-50%, -50%) scale(${sheet * 4.2})`, background: "radial-gradient(ellipse at 30% 30%, #ffffff, #f2f6f8 50%, #e4ecf1), repeating-linear-gradient(115deg, rgba(160,180,195,.12) 0 2px, transparent 2px 60px)", boxShadow: "0 0 80px rgba(31,42,51,.12)", opacity: sheet > 0 ? 1 : 0, pointerEvents: "none" }} />
        {!still && <p className="ld-hint" style={{ position: "absolute", left: 0, right: 0, bottom: 14, textAlign: "center", ...label, fontSize: 10, color: C.dim, opacity: 1 - titleOut }}>{t("Листайте — запускаем стирку", "Scroll — start the wash")}</p>}
      </div>
    </section>
  );
}

// Care symbols, drawn simply
const Wash = () => <svg viewBox="0 0 40 30" width="40" height="30" aria-hidden><path d="M3 6 L7 26 H33 L37 6" fill="none" stroke="currentColor" strokeWidth="1.6" /><path d="M3 10 q5 -4 8.5 0 t8.5 0 t8.5 0 t8.5 0" fill="none" stroke="currentColor" strokeWidth="1.4" /><text x="20" y="22" textAnchor="middle" fontSize="9" fontFamily="Jost" fill="currentColor">30</text></svg>;
const NoBleach = () => <svg viewBox="0 0 36 30" width="36" height="30" aria-hidden><path d="M18 3 L33 27 H3 Z" fill="none" stroke="currentColor" strokeWidth="1.6" /><path d="M6 4 L30 28 M30 4 L6 28" stroke="currentColor" strokeWidth="1.4" /></svg>;
const LineDry = () => <svg viewBox="0 0 32 30" width="32" height="30" aria-hidden><rect x="3" y="3" width="26" height="24" fill="none" stroke="currentColor" strokeWidth="1.6" /><path d="M3 6 q13 9 26 0" fill="none" stroke="currentColor" strokeWidth="1.4" /></svg>;
const Iron = () => <svg viewBox="0 0 40 30" width="40" height="30" aria-hidden><path d="M4 24 H36 L33 12 Q30 7 22 7 H12 Q9 7 9 10 L9 12" fill="none" stroke="currentColor" strokeWidth="1.6" /><circle cx="20" cy="18" r="1.6" fill="currentColor" /></svg>;

// ── 3. The drydown: the programme dial ──
const PROGRAM_NOTES: Record<"ru" | "en", string[][]> = {
  ru: [["Лёд", "Альдегиды", "Озоновые ноты", "Цитрусовые ноты"], ["Ирис", "Авокадо"], ["Белый мускус", "Кашмеран"]],
  en: [["Ice", "Aldehydes", "Ozone Notes", "Citrus Notes"], ["Iris", "Avocado"], ["White Musk", "Cashmeran"]],
};
const STAGES = [`${IMG}/stage-wash.webp`, `${IMG}/stage-rinse.webp`, `${IMG}/stage-dry.webp`];
const STAGE_BG = ["#dcecf7", "#e3f3ec", "#fff4d6"];

function Programme({ stages, lang, t }: { stages: { when: string; text: string }[]; lang: "ru" | "en"; t: (ru: string, en: string) => string }) {
  const still = prefersReducedMotion();
  const { ref, p } = usePinProgress<HTMLElement>(!still);
  const stage = still ? 0 : Math.min(2, Math.floor(p * 3.05));
  const knob = -60 + stage * 60 + (still ? 0 : (p * 3.05 - stage) * 14);
  const left = Math.max(0, Math.round(45 - p * 45));
  return (
    <section ref={ref} style={{ position: "relative", height: still ? "auto" : "330svh", background: STAGE_BG[stage], transition: "background 1s ease" }}>
      <div style={{ position: still ? "relative" : "sticky", top: 0, minHeight: "100svh", display: "flex", flexDirection: "column", justifyContent: "center", padding: "70px clamp(16px,4vw,48px) 30px", overflow: "hidden" }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ ...label, fontSize: 11, color: C.dim }}>{t("Как раскрывается на коже", "How it unfolds on skin")}</p>
          <h2 style={{ ...head, fontSize: "clamp(2.2rem, 5vw, 4rem)", marginTop: 8 }}>{t("Программа стирки", "The wash programme")}</h2>
        </div>
        <div className="ld-prog" style={{ maxWidth: 1160, width: "100%", margin: "30px auto 0", display: "grid", gridTemplateColumns: "minmax(0,.8fr) minmax(0,1.2fr)", gap: "26px 60px", alignItems: "center" }}>
          {/* the panel with the dial and the display */}
          <div style={{ padding: "clamp(18px, 3vw, 34px)", borderRadius: 26, background: "linear-gradient(180deg, #ffffff, #eef2f4)", boxShadow: "0 30px 60px rgba(31,42,51,.12), inset 0 1px 0 #fff" }}>
            <div className="ld-led" style={{ ...led, fontSize: "clamp(1.6rem, 3vw, 2.4rem)", textAlign: "center", padding: "10px 0", borderRadius: 10, background: "#16211c" }}>
              0:{String(left).padStart(2, "0")}
            </div>
            <div className="ld-dial" style={{ position: "relative", width: "min(100%, 300px)", aspectRatio: "1", margin: "22px auto 0" }}>
              {stages.map((s, i) => {
                const a = ((-60 + i * 60 - 90) * Math.PI) / 180;
                return <span key={i} className="ld-dl" style={{ position: "absolute", left: `${50 + Math.cos(a) * 46}%`, top: `${50 + Math.sin(a) * 46}%`, transform: "translate(-50%, -50%)", ...label, fontSize: 9, letterSpacing: ".18em", whiteSpace: "nowrap", color: stage === i ? C.ink : C.dim, fontWeight: stage === i ? 600 : 400, transition: "color .4s" }}>{s.when}</span>;
              })}
              <div style={{ position: "absolute", inset: "22%", borderRadius: "50%", background: "radial-gradient(circle at 40% 30%, #ffffff, #d4dbdf 70%, #b7c1c7)", boxShadow: "0 14px 24px rgba(31,42,51,.22), inset 0 -4px 10px rgba(0,0,0,.08)", transform: `rotate(${knob}deg)`, transition: "transform .6s cubic-bezier(.3,1.4,.5,1)" }}>
                <span style={{ position: "absolute", left: "50%", top: "8%", width: 6, height: "26%", marginLeft: -3, borderRadius: 3, background: C.ink }} />
              </div>
            </div>
          </div>
          {/* the stage */}
          <div style={{ position: "relative", minHeight: "min(56svh, 470px)" }}>
            {stages.map((s, i) => (
              <article key={i} className="ld-stage" style={{ position: still ? "relative" : "absolute", inset: still ? undefined : 0, display: "grid", gridTemplateColumns: "minmax(0,.85fr) minmax(0,1.15fr)", gap: 24, alignItems: "center", opacity: still || stage === i ? 1 : 0, transform: still || stage === i ? "none" : `translateY(${i < stage ? -24 : 24}px)`, transition: "opacity .7s ease, transform .9s cubic-bezier(.16,1,.3,1)", marginBottom: still ? 30 : 0 }}>
                <img className="ld-stage-photo" src={STAGES[i]} alt="" loading="lazy" style={{ width: "100%", aspectRatio: "2 / 3", objectFit: "cover", borderRadius: 18, boxShadow: "0 24px 50px rgba(31,42,51,.18)" }} />
                <div>
                  <p style={{ ...label, fontSize: 10, color: C.dim }}>{String(i + 1).padStart(2, "0")} / 03</p>
                  <p style={{ ...head, fontSize: "clamp(2rem, 4vw, 3.2rem)", lineHeight: 1, marginTop: 8 }}>{s.when}</p>
                  <p style={{ ...body, fontSize: "clamp(1.05rem, 1.6vw, 1.22rem)", lineHeight: 1.6, marginTop: 14 }}>{s.text}</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 16 }}>
                    {PROGRAM_NOTES[lang][i].map((n) => <span key={n} style={{ ...body, fontSize: 13, padding: "5px 12px", borderRadius: 99, background: "rgba(255,255,255,.75)", border: `1px solid ${C.faint}` }}>{n}</span>)}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ── 4. The clothesline: every note is a piece of laundry; the pointer is the wind ──
type Garment = { file: string; label: [string, string]; w: number };
const LINE: Garment[] = [
  { file: "sock-1", label: ["Лёд", "Ice"], w: 7 },
  { file: "tee", label: ["Альдегиды", "Aldehydes"], w: 15 },
  { file: "sock-2", label: ["Цитрус", "Citrus"], w: 7 },
  { file: "towel", label: ["Озон", "Ozone"], w: 12 },
  { file: "sock-3", label: ["Авокадо", "Avocado"], w: 7 },
  { file: "hanky", label: ["Ирис", "Iris"], w: 10 },
  { file: "pillow", label: ["Белый мускус", "White Musk"], w: 15 },
  { file: "sock-4", label: ["Кашмеран", "Cashmeran"], w: 7 },
];

function Clothesline({ lang, t }: { lang: "ru" | "en"; t: (ru: string, en: string) => string }) {
  const area = useRef<HTMLDivElement>(null);
  const items = useRef<(HTMLDivElement | null)[]>([]);
  const L = (p: [string, string]) => (lang === "ru" ? p[0] : p[1]);
  useEffect(() => {
    const el = area.current; if (!el || prefersReducedMotion()) return;
    // a little spring per garment: the wind pushes it away from the pointer, it swings back
    const st = LINE.map(() => ({ a: 0, v: 0 }));
    let lastX = 0, lastT = 0, raf = 0;
    const move = (e: PointerEvent) => {
      const now = performance.now(), dt = Math.max(8, now - lastT);
      const speed = Math.min(3, Math.abs(e.clientX - lastX) / dt);
      lastX = e.clientX; lastT = now;
      items.current.forEach((it, i) => {
        if (!it) return;
        const r = it.getBoundingClientRect();
        const dx = r.left + r.width / 2 - e.clientX, dy = r.top + r.height / 2 - e.clientY;
        const d = Math.hypot(dx, dy);
        if (d < 260) st[i].v += (Math.sign(dx) || 1) * (1 - d / 260) * (0.6 + speed * 1.4);
      });
    };
    const t0 = performance.now();
    const loop = (now: number) => {
      const breeze = Math.sin((now - t0) / 1300);
      st.forEach((s, i) => {
        const target = breeze * (2 + (i % 3));
        s.v += (target - s.a) * 0.02; s.v *= 0.93; s.a += s.v;
        s.a = Math.max(-38, Math.min(38, s.a));
        const it = items.current[i]; if (it) it.style.transform = `rotate(${s.a}deg)`;
      });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    window.addEventListener("pointermove", move);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("pointermove", move); };
  }, []);
  return (
    <section style={{ position: "relative", minHeight: "100svh", overflow: "hidden", background: "#cfe5f4" }}>
      <img src={`${IMG}/yard.webp`} alt={t("Солнечный двор с бельевой верёвкой", "A sunny yard with a clothesline")} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 70%" }} />
      <div style={{ position: "relative", padding: "90px 0 60px" }}>
        <Head kicker={t("Во дворе", "In the yard")} title={t("Из чего он сделан", "What it's made of")} />
        <div ref={area} className="ld-scroll" style={{ position: "relative", maxWidth: 1240, margin: "0 auto" }}>
          <div className="ld-scroll-in" style={{ position: "relative", padding: "0 2%" }}>
            <svg aria-hidden viewBox="0 0 1000 40" preserveAspectRatio="none" style={{ position: "absolute", left: 0, right: 0, top: 0, width: "100%", height: 40 }}>
              <path d="M0 6 Q500 46 1000 6" fill="none" stroke="#f4f1ea" strokeWidth="2.4" />
            </svg>
            <div style={{ display: "flex", justifyContent: "space-around", alignItems: "flex-start" }}>
              {LINE.map((g, i) => {
                const sag = Math.sin((i + 0.5) / LINE.length * Math.PI) * 26;
                return (
                  <div key={g.file} ref={(el) => { items.current[i] = el; }} style={{ width: `${g.w}%`, marginTop: 4 + sag, transformOrigin: "50% 0", display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <img src={`${IMG}/peg.webp`} alt="" aria-hidden style={{ width: 16, maxWidth: "none", position: "relative", zIndex: 2, marginBottom: -10, filter: "drop-shadow(0 3px 3px rgba(0,0,0,.25))" }} />
                    <img src={`${IMG}/${g.file}.webp`} alt={L(g.label)} loading="lazy" style={{ width: "100%", filter: "drop-shadow(0 16px 14px rgba(31,42,51,.25))" }} />
                    <span style={{ marginTop: 10, padding: "5px 10px", background: "#ffffff", ...label, fontSize: 9, letterSpacing: ".16em", color: C.ink, borderRadius: 2, boxShadow: "0 6px 12px rgba(31,42,51,.15)", whiteSpace: "nowrap" }}>{L(g.label)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <p className="ld-swipe" style={{ ...label, fontSize: 10, color: C.ink, textAlign: "center", marginTop: 12 }}>{t("← Листайте вбок →", "← Swipe sideways →")}</p>
        <p className="ld-wind" style={{ ...label, fontSize: 10, color: C.ink, textAlign: "center", marginTop: 36, opacity: 0.7 }}>{t("Проведите курсором — подует ветер", "Move the pointer — the wind will blow")}</p>
      </div>
    </section>
  );
}

// ── 5. Strength as stacks of folded towels ──
const TOWEL = ["#ffffff", "#d9ecf8", "#bfe5d6", "#f4f1ea", "#e8eef2", "#cfe0ee"];

function Towels({ facets, lang }: { facets: { label: { ru: string; en: string }; value: number }[]; lang: "ru" | "en" }) {
  const { ref, visible } = useReveal();
  return (
    <div ref={ref} className="ld-towels" style={{ maxWidth: 1040, margin: "0 auto", display: "grid", gridTemplateColumns: `repeat(${facets.length}, 1fr)`, gap: "clamp(8px, 2vw, 26px)", alignItems: "end" }}>
      {facets.map((f, i) => {
        const n = Math.max(1, Math.round(f.value / 11));
        return (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <p style={{ ...head, fontSize: 28, opacity: visible ? 1 : 0, transition: `opacity .8s ${n * 90 + 300}ms` }}>{f.value}</p>
            <div style={{ display: "flex", flexDirection: "column-reverse", width: "100%", maxWidth: 150, marginTop: 6 }}>
              {Array.from({ length: n }, (_, k) => {
                const c = TOWEL[(i + k) % TOWEL.length];
                return (
                  <span key={k} aria-hidden style={{ position: "relative", display: "block", height: 26, margin: `0 auto -3px`, width: `${84 + ((k * 7) % 9)}%`, transform: `translateX(${((k * 5) % 7) - 3}px)`, borderRadius: "14px 14px 12px 12px", background: `linear-gradient(180deg, rgba(255,255,255,.7), rgba(255,255,255,0) 40%, rgba(31,42,51,.08)), ${c}`, boxShadow: "inset 0 -2px 0 rgba(31,42,51,.07), inset 0 2px 0 rgba(255,255,255,.8), 0 3px 4px rgba(31,42,51,.08)", opacity: visible ? 1 : 0, translate: visible ? "0 0" : "0 -60px", transition: `opacity .4s ease ${k * 90 + i * 60}ms, translate .6s cubic-bezier(.3,1.4,.5,1) ${k * 90 + i * 60}ms` }}>
                    {/* the folded edge and, on some, a woven stripe */}
                    <span style={{ position: "absolute", left: 6, right: 6, top: "55%", height: 1, background: "rgba(31,42,51,.1)" }} />
                    {k % 3 === 1 && <span style={{ position: "absolute", top: 4, bottom: 4, right: "14%", width: 8, background: "rgba(156,199,230,.75)", borderRadius: 2 }} />}
                  </span>
                );
              })}
            </div>
            <p style={{ ...body, fontSize: 13, lineHeight: 1.3, textAlign: "center", marginTop: 12, minHeight: "2.6em", color: C.ink }}>{pick(lang, f.label)}</p>
          </div>
        );
      })}
    </div>
  );
}

// ── 6. Scenes printed on sheets moving in the wind ──
const SCENES = [1, 2, 3, 4].map((i) => `${IMG}/scene-${i}.webp`);

function Sheets({ scenes }: { scenes: string[] }) {
  const still = prefersReducedMotion();
  return (
    <div style={{ position: "relative", maxWidth: 1200, margin: "0 auto" }}>
      <svg aria-hidden width="0" height="0" style={{ position: "absolute" }}>
        <filter id="ld-wind">
          <feTurbulence type="fractalNoise" baseFrequency="0.006 0.02" numOctaves="2" seed="3">
            {!still && <animate attributeName="baseFrequency" dur="9s" values="0.006 0.02;0.009 0.016;0.006 0.02" repeatCount="indefinite" />}
          </feTurbulence>
          <feDisplacementMap in="SourceGraphic" scale="14" />
        </filter>
      </svg>
      <div aria-hidden style={{ height: 2, background: "#c9c3b6", margin: "0 -2%" }} />
      <div className="ld-sheets" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "clamp(10px, 2vw, 24px)" }}>
        {scenes.map((s, i) => (
          <Reveal key={i} delay={i * 120}>
            <figure className="ld-sheet" style={{ position: "relative", margin: 0, transformOrigin: "50% 0", animationDelay: `${-i * 1.7}s` }}>
              <div style={{ position: "relative", padding: "8px 8px 0", background: "#fbfaf6", boxShadow: "0 24px 40px rgba(31,42,51,.15)", filter: still ? undefined : "url(#ld-wind)" }}>
                <img src={SCENES[i]} alt={s} loading="lazy" style={{ display: "block", width: "100%", aspectRatio: "3 / 4", objectFit: "cover", mixBlendMode: "multiply" }} />
                <span aria-hidden style={{ position: "absolute", inset: 8, bottom: 0, background: "repeating-linear-gradient(0deg, rgba(255,255,255,.05) 0 2px, rgba(0,0,0,.03) 2px 3px)" }} />
                <figcaption style={{ ...body, fontSize: "clamp(.95rem, 1.4vw, 1.1rem)", lineHeight: 1.35, color: C.ink, padding: "12px 6px 16px", minHeight: "3.6em" }}>{s}</figcaption>
              </div>
              {[18, 82].map((x) => <img key={x} src={`${IMG}/peg.webp`} alt="" aria-hidden style={{ position: "absolute", left: `${x}%`, top: -14, width: 14, maxWidth: "none", transform: "translateX(-50%)" }} />)}
            </figure>
          </Reveal>
        ))}
      </div>
    </div>
  );
}

// ── 7. The request: press Start ──
function StartButton({ onDone, t }: { onDone: () => void; t: (ru: string, en: string) => string }) {
  const [phase, setPhase] = useState<"idle" | "count" | "done">("idle");
  const [n, setN] = useState(3);
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const start = () => {
    if (phase === "count") return;
    timers.current.forEach(clearTimeout); timers.current = [];
    if (prefersReducedMotion()) { onDone(); return; }
    setPhase("count"); setN(3);
    [1, 2].forEach((k) => timers.current.push(window.setTimeout(() => setN(3 - k), k * 650)));
    timers.current.push(window.setTimeout(() => setPhase("done"), 1950));
    timers.current.push(window.setTimeout(() => { onDone(); setPhase("idle"); }, 2700));
  };
  const [spin, setSpin] = useState(0);
  useEffect(() => {
    if (phase !== "count") return;
    let raf = 0, a = spin;
    const loop = () => { a += 14; setSpin(a); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps
  const display = phase === "idle" ? t("ГОТОВ", "READY") : phase === "count" ? `0:0${n}` : t("ДЗЫНЬ!", "DING!");
  return (
    <div className="ld-front" style={{ display: "flex", alignItems: "center", gap: "clamp(20px, 5vw, 56px)", padding: "clamp(20px, 3vw, 34px)", borderRadius: 30, background: "linear-gradient(180deg, #ffffff, #eef2f4)", boxShadow: "0 40px 80px rgba(31,42,51,.14)", marginTop: 20 }}>
      <Porthole angle={spin} size="min(190px, 38vw)" />
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
        <div className="ld-led" style={{ ...led, fontSize: 24, minWidth: 140, textAlign: "center", padding: "8px 14px", borderRadius: 8, background: "#16211c" }}>{display}</div>
        <button onClick={start} className="ld-start" aria-label={t("Пуск: оставить заявку", "Start: leave a request")}>
          <span style={{ ...label, fontSize: 12, letterSpacing: ".25em" }}>{t("Пуск", "Start")}</span>
        </button>
      </div>
    </div>
  );
}

export default function LaundryWorld({ perfume }: WorldProps) {
  const [, navigate] = useLocation();
  const { lang, setLang, t } = useLang();
  const [open, setOpen] = useState(false);
  const g = perfume.guide!;
  const Lp = (v: { ru: string; en: string }) => pick(lang, v);
  const fragments = pick(lang, perfume.memoryFragments).map(fragmentText);
  const stages = g.drydown.map((d) => ({ when: Lp(d.when), text: Lp(d.text) }));
  const tilts = useMemo(() => fragments.map((_, i) => ((i * 37) % 7) - 3), [fragments]);

  const skin: DialogSkin = {
    overlay: "rgba(220,236,247,.8)",
    panel: { ...body, background: "#ffffff", padding: "34px 30px", color: C.ink, borderRadius: 26, boxShadow: "0 40px 100px rgba(31,42,51,.2)", border: "none" },
    title: { ...head, fontSize: 38, color: C.ink },
    label: { ...label, fontSize: 10, letterSpacing: ".22em", color: C.dim },
    input: { ...body, fontSize: 15, background: C.white, border: `1px solid ${C.faint}`, padding: "11px 14px", color: C.ink, borderRadius: 12 },
    button: { ...label, fontSize: 12, letterSpacing: ".3em", background: C.ink, color: "#fff", padding: "15px", borderRadius: 99 },
    accent: "#4a90c2",
    heading: { ru: "Стирка запущена", en: "The wash is on" },
    submit: { ru: "Отправить", en: "Send" },
    sent: { ru: "Готово! Свежо и чисто — скоро напишем.", en: "Done! Fresh and clean — we'll write soon." },
  };

  const facts: [string, string][] = [
    [t("Стойкость", "Longevity"), Lp(g.longevity)],
    [t("Шлейф", "Sillage"), Lp(g.sillage)],
    [t("Сезон", "Season"), Lp(g.season)],
    [t("Когда носить", "When to wear"), Lp(g.time)],
  ];

  return (
    <div style={{ ...body, background: C.white, color: C.ink, minHeight: "100vh", overflowX: "clip" }}>
      <style>{`
        .ld-hint { animation: ld-bob 2.4s ease-in-out infinite; } @keyframes ld-bob { 50% { transform: translateY(6px); } }
        .ld-led { color: ${C.led}; text-shadow: 0 0 10px rgba(71,224,160,.65); background: #16211c; border-radius: 8px; padding: 4px 10px; letter-spacing: .08em; }
        .ld-water { position: absolute; left: -10%; right: -10%; bottom: -4%; height: 46%; background: linear-gradient(180deg, rgba(180,215,235,.35), rgba(120,170,205,.55)); border-radius: 45% 48% 0 0 / 14% 12% 0 0; animation: ld-slosh 2.6s ease-in-out infinite alternate; mix-blend-mode: multiply; }
        @keyframes ld-slosh { from { transform: rotate(-4deg) translateY(2%); } to { transform: rotate(4deg) translateY(-2%); } }
        .ld-sheet { animation: ld-sway 6s ease-in-out infinite alternate; } @keyframes ld-sway { from { transform: rotate(-1.4deg) skewX(-1deg); } to { transform: rotate(1.4deg) skewX(1deg); } }
        .ld-start { width: 92px; height: 92px; border-radius: 50%; color: #fff; background: radial-gradient(circle at 40% 30%, #6fb4e6, #2f7fb8); box-shadow: 0 10px 0 #1f5f8c, 0 20px 30px rgba(31,95,140,.35); transition: transform .12s, box-shadow .12s; cursor: pointer; }
        .ld-start:active { transform: translateY(8px); box-shadow: 0 2px 0 #1f5f8c, 0 8px 14px rgba(31,95,140,.35); }
        .ld-woven { display: inline-block; padding: 8px 16px; background: #ffffff; border: 1px solid rgba(31,42,51,.12); outline: 1px dashed rgba(156,199,230,.9); outline-offset: -5px; font-family: 'Jost', sans-serif; font-size: 13px; letter-spacing: .14em; text-transform: uppercase; color: ${C.ink}; box-shadow: 0 8px 18px rgba(31,42,51,.1); }
        .ld-swipe { display: none; }
        @media (prefers-reduced-motion: reduce) { .ld-hint, .ld-water, .ld-sheet { animation: none; } }
        @media (max-width: 820px) {
          .ld-two, .ld-prog { grid-template-columns: 1fr !important; }
          .ld-stage { grid-template-columns: 1fr !important; }
          .ld-stage-photo { display: none; }
          .ld-sheets { grid-template-columns: repeat(2, 1fr) !important; }
          .ld-towels { grid-template-columns: repeat(3, 1fr) !important; row-gap: 30px !important; }
          .ld-scroll { overflow-x: auto; overscroll-behavior-x: contain; scrollbar-width: none; padding-bottom: 16px; }
          .ld-scroll::-webkit-scrollbar { display: none; }
          .ld-scroll-in { width: 820px; }
          .ld-swipe { display: block; } .ld-wind { display: none; }
          .ld-facts { grid-template-columns: 1fr !important; }
          .ld-front { flex-direction: column; }
          .ld-dial { width: 150px !important; margin-top: 10px !important; }
          .ld-dl { display: none; } /* the stage name is right below on a phone */
        }
      `}</style>

      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 50, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px clamp(16px,3vw,28px)", ...label, fontSize: 10, letterSpacing: ".2em", color: C.ink, pointerEvents: "none" }}>
        <button onClick={() => navigate("/map")} style={{ pointerEvents: "auto" }}>← {t("Карта", "Map")}</button>
        <span style={{ ...head, textTransform: "none", letterSpacing: ".04em", fontSize: 16 }}>Silentium</span>
        <span style={{ pointerEvents: "auto" }}>{(["ru", "en"] as const).map((l) => <button key={l} onClick={() => setLang(l)} style={{ marginLeft: 10, opacity: lang === l ? 1 : 0.45 }}>{l.toUpperCase()}</button>)}</span>
      </nav>

      <Machine t={t} description={pick(lang, perfume.description)} />

      {/* what it smells like: a satin care label */}
      <section style={{ background: C.white, padding: "110px clamp(16px,4vw,48px) 120px" }}>
        <div className="ld-two" style={{ maxWidth: 1180, margin: "0 auto", display: "grid", gridTemplateColumns: "1.2fr .8fr", gap: "40px 70px", alignItems: "center" }}>
          <Reveal>
            <div style={{ position: "relative", padding: "clamp(26px, 4vw, 46px)", background: "linear-gradient(135deg, #ffffff, #f3f6f8 60%, #ffffff)", borderRadius: 4, boxShadow: "0 30px 70px rgba(31,42,51,.1), inset 0 0 0 1px rgba(31,42,51,.06)", outline: "1.5px dashed rgba(156,199,230,.9)", outlineOffset: -12 }}>
              <p style={{ ...label, fontSize: 11, color: C.dim }}>{t("Как он пахнет", "What it smells like")}</p>
              <p style={{ ...head, fontSize: "clamp(1.4rem, 2.4vw, 1.95rem)", lineHeight: 1.4, marginTop: 14 }}>{Lp(g.plain)}</p>
              <div aria-hidden style={{ display: "flex", gap: 18, marginTop: 26, color: C.ink, opacity: 0.75 }}><Wash /><NoBleach /><LineDry /><Iron /></div>
              <dl className="ld-facts" style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "16px 28px", marginTop: 26 }}>
                {facts.map(([k, v]) => (
                  <div key={k} style={{ borderTop: `1px solid ${C.faint}`, paddingTop: 10 }}>
                    <dt style={{ ...label, fontSize: 9, color: C.dim }}>{k}</dt>
                    <dd style={{ fontSize: 15, lineHeight: 1.45, marginTop: 5 }}>{v}</dd>
                  </div>
                ))}
              </dl>
              {g.tip && <p style={{ marginTop: 22, fontSize: 14, color: C.dim }}>✳ {Lp(g.tip)}</p>}
            </div>
          </Reveal>
          <Reveal delay={150} style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
            <div style={{ position: "relative", width: "min(260px, 60vw)", height: "min(340px, 74vw)" }}>
              <div aria-hidden style={{ position: "absolute", left: "50%", top: "50%", width: "100%", aspectRatio: "1", transform: "translate(-50%, -50%)", borderRadius: "50%", background: `radial-gradient(circle at 40% 35%, #eaf4fb, ${C.blue})` }} />
              <Bottle3D style={{ position: "absolute", inset: 0 }} lighting="daylight" {...bottleLook} spin={0.2} drawLabel={bottleLabel} />
            </div>
            <p style={{ ...label, fontSize: 10, color: C.dim, marginTop: 10 }}>{t("Стойкость", "Longevity")}</p>
            <p style={{ ...head, fontSize: "clamp(3.4rem, 7vw, 5.4rem)", lineHeight: 1 }}>{Lp(g.longevity).replace(/\s.*$/, "")}</p>
            <p style={{ ...label, fontSize: 11 }}>{Lp(g.longevity).replace(/^\S+\s?/, "")}</p>
          </Reveal>
        </div>
      </section>

      <Programme stages={stages} lang={lang} t={t} />
      <Clothesline lang={lang} t={t} />

      {/* strength */}
      <section style={{ background: C.white, padding: "110px clamp(16px,4vw,48px) 110px" }}>
        <Head kicker={t("Характер", "Character")} title={t("Чего в нём больше всего", "What it holds the most of")} />
        <Towels facets={g.facets} lang={lang} />
      </section>

      {/* scenes on sheets + memories on woven labels */}
      <section style={{ background: `linear-gradient(180deg, ${C.white}, #e4f0f8)`, padding: "100px clamp(12px,3vw,40px) 110px", overflow: "hidden" }}>
        <Head kicker={t("На что это похоже", "What it feels like")} title={t("Сохнет на ветру", "Drying in the wind")} />
        <Sheets scenes={pick(lang, g.scenes)} />
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "14px 18px", maxWidth: 900, margin: "70px auto 0" }}>
          {fragments.map((f, i) => <Reveal key={i} delay={i * 90}><span className="ld-woven" style={{ transform: `rotate(${tilts[i]}deg)` }}>{f}</span></Reveal>)}
        </div>
      </section>

      {/* request: the Start button */}
      <section style={{ background: "#e4f0f8", padding: "100px 16px 120px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
        <Head kicker={t("Заявка", "Request")} title={t("Нажмите «Пуск»", "Press Start")} />
        <p style={{ fontSize: 17, color: C.dim, marginTop: -26 }}>{t("Короткий цикл — и откроется заявка.", "A quick cycle — and the request opens.")}</p>
        <StartButton onDone={() => setOpen(true)} t={t} />
        <p style={{ fontSize: 15, color: C.dim, maxWidth: 440, lineHeight: 1.6, marginTop: 34 }}>{t("Оставьте контакт — мы напишем и расскажем, как получить флакон.", "Leave your contact — we'll write and tell you how to get a bottle.")}</p>
        <p style={{ ...label, fontSize: 9, letterSpacing: ".2em", color: C.dim, marginTop: 10 }}>Extrait de parfum · {perfume.releaseDate} · {pick(lang, perfume.origin.location)}</p>
      </section>

      <RequestDialog open={open} onClose={() => setOpen(false)} perfumeName={perfume.name} skin={skin} />
    </div>
  );
}
