// Self addicted — everyone turns around.
// The bestseller: sugar, orange blossom and powder, and the loudest scent in the collection.
// A vanity at night with caramel dripping from the top of the screen; a plain-words intro with the
// 10–15 m diffusion front and centre; "Radius" — a party seen from above where a scent wave spreads
// from the bottle, lights up everyone it reaches and snuffs out the other perfumes in the room;
// the drydown as three glossy close-ups; the notes as real ingredients floating around; strength as
// caramel bars; scenes; and a lipstick kiss on the mirror to send a request.

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useLocation } from "wouter";
import { useLang } from "@/contexts/LangContext";
import Bottle3D from "@/components/Bottle3D";
import RequestDialog, { type DialogSkin } from "@/components/RequestDialog";
import { useReveal } from "@/lib/useReveal";
import { pick, prefersReducedMotion, type WorldProps } from "./shared";

const C = { bg: "#160a0f", bg2: "#22101a", pink: "#ff8fb1", rose: "#e8577a", blush: "#f8cdd8", caramel: "#d98a2b", gold: "#e9bf6b", cream: "#fbeef0", dim: "rgba(251,238,240,.62)" };
const serif: CSSProperties = { fontFamily: "'Playfair Display', serif" };
const sans: CSSProperties = { fontFamily: "'Manrope', sans-serif" };
const IMG = "/images/self-addicted";

// ── Radius: the scent wave spreading through a party seen from above ──
// Positions in % of the square; the wave reaches 15 m at 46% of the side from the centre.
const RIVALS = [[36, 34], [64, 62], [26, 56], [70, 30], [18, 22], [78, 20], [86, 64], [30, 88], [70, 86], [8, 46]] as const;
const FULL = 46;

function Radius({ p, t }: { p: number; t: (ru: string, en: string) => string }) {
  const e = Math.min(1, p / 0.85); // hold at 15 m for the last stretch
  const metres = e * 15;
  const R = e * FULL;
  const left = RIVALS.filter(([x, y]) => R < Math.hypot(x - 50, y - 50)).length;
  return (
    <div style={{ position: "relative", width: "min(760px, 100%, 74svh)", margin: "0 auto", aspectRatio: "1", borderRadius: 18, overflow: "hidden", boxShadow: "0 40px 100px rgba(0,0,0,.6)" }}>
      <img src={`${IMG}/party.webp`} alt={t("Вечеринка, вид сверху", "A party seen from above")} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: "grayscale(.75) brightness(.42)" }} />
      {/* everyone the wave reaches lights up */}
      <img src={`${IMG}/party.webp`} alt="" aria-hidden style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: "saturate(1.25) brightness(1.08) sepia(.15) hue-rotate(-12deg)", clipPath: `circle(${R}% at 50% 50%)` }} />
      <div aria-hidden style={{ position: "absolute", inset: 0, background: `radial-gradient(circle closest-side at 50% 50%, rgba(255,143,177,.4) 0%, rgba(217,138,43,.18) ${(R / 50) * 70}%, transparent ${(R / 50) * 100}%)`, mixBlendMode: "screen" }} />
      {/* other perfumes in the room: grey clouds that go out when the wave reaches them */}
      {RIVALS.map(([x, y], i) => {
        const gone = R >= Math.hypot(x - 50, y - 50);
        return <div key={i} aria-hidden style={{ position: "absolute", left: `${x}%`, top: `${y}%`, width: "12%", aspectRatio: "1", transform: `translate(-50%,-50%) scale(${gone ? 0.3 : 1})`, borderRadius: "50%", background: "radial-gradient(circle, rgba(200,208,216,.6), rgba(200,208,216,.2) 45%, transparent 70%)", filter: "blur(3px)", opacity: gone ? 0 : 0.9, transition: "opacity .9s ease, transform .9s ease" }} />;
      })}
      <svg viewBox="0 0 100 100" aria-hidden style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
        {[5, 10, 15].map((m) => {
          const r = (m / 15) * FULL;
          return (
            <g key={m} opacity={metres >= m - 0.2 ? 1 : 0.3} style={{ transition: "opacity .6s" }}>
              <circle cx="50" cy="50" r={r} fill="none" stroke={C.blush} strokeWidth=".25" strokeDasharray="1 1.2" />
              <text x="50" y={50 - r - 1.2} textAnchor="middle" fill={C.cream} style={{ ...sans, fontSize: 2.8, fontWeight: 600 }}>{m} {t("м", "m")}</text>
            </g>
          );
        })}
        <circle cx="50" cy="50" r={R} fill="none" stroke={C.pink} strokeWidth=".6" style={{ filter: "drop-shadow(0 0 1.5px #ff8fb1)" }} />
        <circle cx="50" cy="50" r="1.6" fill={C.pink} />
      </svg>
      <div style={{ position: "absolute", left: 16, bottom: 14, ...sans, color: C.cream, textShadow: "0 2px 10px #000" }}>
        <p style={{ fontSize: 11, letterSpacing: ".25em", textTransform: "uppercase", opacity: 0.8 }}>{t("Шлейф дошёл до", "The trail has reached")}</p>
        <p style={{ ...serif, fontStyle: "italic", fontSize: "clamp(2rem, 6vw, 3.4rem)", lineHeight: 1 }}>{metres.toFixed(1)} {t("м", "m")}</p>
      </div>
      <div style={{ position: "absolute", right: 16, bottom: 14, ...sans, fontSize: 12, color: C.cream, textAlign: "right", textShadow: "0 2px 10px #000" }}>
        {left ? <>{t("Чужих ароматов", "Other perfumes")}: <b style={{ fontSize: 18 }}>{left}</b></> : <b style={{ color: C.pink }}>{t("Остался только ваш", "Only yours is left")}</b>}
      </div>
    </div>
  );
}

// Pinned scene: the section is tall, the square stays on screen while the wave grows
function RadiusScene({ t }: { t: (ru: string, en: string) => string }) {
  const wrap = useRef<HTMLDivElement>(null);
  const [p, setP] = useState(prefersReducedMotion() ? 1 : 0);
  useEffect(() => {
    if (prefersReducedMotion()) return;
    let raf = 0;
    const update = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const el = wrap.current; if (!el) return;
        const span = el.offsetHeight - window.innerHeight;
        setP(Math.min(1, Math.max(0, -el.getBoundingClientRect().top / span)));
      });
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("scroll", update); window.removeEventListener("resize", update); };
  }, []);
  return (
    <section ref={wrap} style={{ position: "relative", height: prefersReducedMotion() ? "auto" : "260svh", background: C.bg2 }}>
      <div style={{ position: prefersReducedMotion() ? "relative" : "sticky", top: 0, minHeight: "100svh", display: "flex", flexDirection: "column", justifyContent: "center", gap: 22, padding: "70px clamp(16px,4vw,48px) 24px" }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ ...sans, fontSize: 12, letterSpacing: ".35em", textTransform: "uppercase", color: C.pink }}>{t("Радиус", "Radius")}</p>
          <h2 style={{ ...serif, fontStyle: "italic", fontWeight: 400, fontSize: "clamp(1.9rem, 4.2vw, 3.4rem)", lineHeight: 1.05, color: C.cream, marginTop: 6 }}>{t("Вы зашли. Все обернулись.", "You walked in. Everyone turned.")}</h2>
        </div>
        <Radius p={p} t={t} />
        <p style={{ ...serif, fontStyle: "italic", fontSize: "clamp(1rem, 1.8vw, 1.3rem)", color: C.blush, textAlign: "center", opacity: p < 0.05 ? 1 : 0.6, transition: "opacity .4s" }}>{t("Листайте — шлейф расходится по комнате и гасит чужие ароматы", "Keep scrolling — the trail spreads and snuffs out the other perfumes")}</p>
      </div>
    </section>
  );
}

// ── Ingredients floating around, drifting a little toward the pointer ──
const INGREDIENTS: { file: string; label: [string, string]; x: number; y: number; w: number; depth: number }[] = [
  { file: "ing-rose", label: ["Дамасская роза", "Damask rose"], x: 14, y: 18, w: 22, depth: 1.4 },
  { file: "ing-pepper", label: ["Розовый перец", "Pink pepper"], x: 80, y: 14, w: 17, depth: 0.8 },
  { file: "ing-cinnamon", label: ["Корица", "Cinnamon"], x: 86, y: 52, w: 20, depth: 1.2 },
  { file: "ing-vanilla", label: ["Ваниль", "Vanilla"], x: 10, y: 62, w: 15, depth: 1 },
  { file: "ing-tonka", label: ["Бобы тонка", "Tonka bean"], x: 30, y: 88, w: 18, depth: 0.7 },
  { file: "ing-caramel", label: ["Карамель", "Caramel"], x: 70, y: 86, w: 18, depth: 1.5 },
];

function Ingredients({ lang }: { lang: "ru" | "en" }) {
  const box = useRef<HTMLDivElement>(null);
  const [m, setM] = useState({ x: 0, y: 0 });
  const { ref, visible } = useReveal();
  useEffect(() => {
    if (prefersReducedMotion() || window.matchMedia("(pointer: coarse)").matches) return;
    let raf = 0;
    const move = (e: PointerEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = box.current?.getBoundingClientRect(); if (!r) return;
        setM({ x: (e.clientX - r.left) / r.width - 0.5, y: (e.clientY - r.top) / r.height - 0.5 });
      });
    };
    window.addEventListener("pointermove", move);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("pointermove", move); };
  }, []);
  return (
    <div ref={box} style={{ position: "relative", width: "min(900px, 100%)", margin: "0 auto", aspectRatio: "1 / 0.85" }}>
      <div ref={ref} style={{ position: "absolute", inset: 0 }}>
        {INGREDIENTS.map((g, i) => (
          <figure key={g.file} className="sa-float" style={{ position: "absolute", left: `${g.x}%`, top: `${g.y}%`, width: `${g.w}%`, margin: 0, transform: `translate(-50%,-50%) translate(${m.x * 40 * g.depth}px, ${m.y * 40 * g.depth}px)`, transition: "transform .8s cubic-bezier(.2,.8,.3,1)", animationDelay: `${i * -1.3}s` }}>
            <img src={`${IMG}/${g.file}.webp`} alt="" loading="lazy" style={{ width: "100%", display: "block", filter: "drop-shadow(0 18px 24px rgba(0,0,0,.5))", opacity: visible ? 1 : 0, transform: visible ? "none" : "scale(.6)", transition: `opacity 1s ease ${i * 120}ms, transform 1.2s cubic-bezier(.2,1.4,.4,1) ${i * 120}ms` }} />
            <figcaption style={{ ...serif, fontStyle: "italic", fontSize: "clamp(14px, 1.8vw, 19px)", color: C.blush, textAlign: "center", marginTop: 6, whiteSpace: "nowrap" }}>{lang === "ru" ? g.label[0] : g.label[1]}</figcaption>
          </figure>
        ))}
        <div style={{ position: "absolute", left: "50%", top: "50%", width: "40%", height: "62%", transform: "translate(-50%,-50%)" }}>
          <div style={{ position: "absolute", inset: "10%", borderRadius: "50%", background: "radial-gradient(circle, rgba(255,143,177,.35), transparent 65%)", filter: "blur(20px)" }} />
          <Bottle3D style={{ position: "absolute", inset: 0 }} lighting="studio" liquid="#f2a7b8" liquidOpacity={0.88} glass="#fff0f4" cap="#1a1214" capRoughness={0.35} collar="#f0c9a0" spin={0.25}
            drawLabel={(ctx, w, h) => {
              ctx.fillStyle = "#fbeef0"; ctx.fillRect(0, 0, w, h);
              ctx.fillStyle = "#e8577a"; ctx.textAlign = "center";
              ctx.font = "italic 400 120px 'Playfair Display', serif"; ctx.fillText("Self", w / 2, h * 0.44);
              ctx.font = "italic 400 86px 'Playfair Display', serif"; ctx.fillText("addicted", w / 2, h * 0.68);
              ctx.font = "60px serif"; ctx.fillText("♡", w / 2, h * 0.9);
            }} />
        </div>
      </div>
    </div>
  );
}

// ── Strength as a bar of caramel with a drop at the end ──
function CaramelBar({ label, value, i }: { label: string; value: number; i: number }) {
  const { ref, visible } = useReveal();
  return (
    <div ref={ref} style={{ display: "grid", gridTemplateColumns: "minmax(130px, 210px) 1fr 40px", gap: 18, alignItems: "center", padding: "13px 0", borderBottom: "1px solid rgba(251,238,240,.08)" }}>
      <span style={{ ...serif, fontStyle: "italic", fontSize: 21, color: C.cream }}>{label}</span>
      <div style={{ position: "relative", height: 12, borderRadius: 99, background: "rgba(251,238,240,.06)" }}>
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: visible ? `${value}%` : 0, borderRadius: 99, background: `linear-gradient(90deg, ${C.rose}, ${C.caramel} 70%, ${C.gold})`, boxShadow: `0 0 18px ${C.caramel}66, inset 0 2px 2px rgba(255,255,255,.35)`, transition: `width 1.6s cubic-bezier(.16,1,.3,1) ${i * 120}ms` }}>
          <span style={{ position: "absolute", right: 4, top: "60%", width: 8, height: visible ? 14 : 0, borderRadius: "0 0 6px 6px", background: C.gold, transition: `height .8s ease ${i * 120 + 1400}ms` }} />
        </div>
      </div>
      <span style={{ ...sans, fontSize: 13, color: C.dim, textAlign: "right" }}>{value}</span>
    </div>
  );
}

function Head({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div style={{ textAlign: "center", marginBottom: 48 }}>
      <p style={{ ...sans, fontSize: 12, letterSpacing: ".35em", textTransform: "uppercase", color: C.pink }}>{kicker}</p>
      <h2 style={{ ...serif, fontStyle: "italic", fontWeight: 400, fontSize: "clamp(2.3rem, 5.4vw, 4.4rem)", lineHeight: 1.04, color: C.cream, marginTop: 10 }}>{title}</h2>
    </div>
  );
}

export default function SelfWorld({ perfume }: WorldProps) {
  const [, navigate] = useLocation();
  const { lang, setLang, t } = useLang();
  const [open, setOpen] = useState(false);
  const [kisses, setKisses] = useState<{ x: number; y: number; r: number }[]>([]);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const g = perfume.guide!;
  const n = perfume.scentNotes;
  const L = (v: { ru: string; en: string }) => pick(lang, v);
  const stages = [`${IMG}/roses.webp`, `${IMG}/cinnamon.webp`, `${IMG}/caramel.webp`];
  const shown = new Set(INGREDIENTS.map((i) => i.label[lang === "ru" ? 0 : 1].toLowerCase()));
  const otherNotes = (["top", "heart", "base"] as const).flatMap((k) => (n[k] ? pick(lang, n[k]!) : [])).filter((x) => !shown.has(x.toLowerCase()));

  const kiss = (e: React.MouseEvent<HTMLButtonElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    setKisses((k) => [...k, { x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100, r: Math.random() * 40 - 20 }]);
    clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setOpen(true), prefersReducedMotion() ? 0 : 800);
  };

  const skin: DialogSkin = {
    overlay: "rgba(22,10,15,.82)",
    panel: { ...sans, background: "linear-gradient(160deg, #2a1420, #160a0f)", color: C.cream, padding: "34px 28px", borderRadius: 26, border: `1px solid ${C.pink}44`, boxShadow: `0 40px 100px rgba(0,0,0,.6), 0 0 60px ${C.rose}33` },
    title: { ...serif, fontStyle: "italic", fontSize: 36, color: C.cream },
    label: { ...sans, fontSize: 11, letterSpacing: ".2em", textTransform: "uppercase", color: C.pink },
    input: { ...sans, fontSize: 16, background: "rgba(251,238,240,.05)", border: `1px solid ${C.pink}33`, borderRadius: 12, padding: "12px 14px", color: C.cream },
    button: { ...sans, fontWeight: 600, fontSize: 14, letterSpacing: ".2em", textTransform: "uppercase", background: `linear-gradient(90deg, ${C.rose}, ${C.caramel})`, color: "#fff", padding: "16px", borderRadius: 999, boxShadow: `0 10px 30px ${C.rose}55` },
    accent: C.pink,
    heading: { ru: "Бестселлер Silentium", en: "Silentium bestseller" },
    submit: { ru: "Хочу его", en: "I want it" },
    sent: { ru: "Получили ♡ Скоро напишем.", en: "Got it ♡ We'll write soon." },
  };

  const facts: [string, string][] = [
    [t("Стойкость", "Longevity"), L(g.longevity)],
    [t("Шлейф", "Sillage"), L(g.sillage)],
    [t("Сезон", "Season"), L(g.season)],
    [t("Когда носить", "When to wear"), L(g.time)],
  ];

  return (
    <div style={{ ...sans, background: C.bg, color: C.cream, minHeight: "100vh", overflowX: "clip" }}>
      <style>{`
        .sa-drip { animation: sa-drip 7s ease-in-out infinite alternate; transform-origin: 50% 0; }
        @keyframes sa-drip { from { transform: scaleY(.82); } to { transform: scaleY(1.06); } }
        .sa-badge { animation: sa-spin 22s linear infinite; } @keyframes sa-spin { to { transform: rotate(360deg); } }
        .sa-float { animation: sa-float 6s ease-in-out infinite; } @keyframes sa-float { 50% { translate: 0 -10px; } }
        .sa-stage img { transition: transform 1.4s cubic-bezier(.16,1,.3,1); } .sa-stage:hover img { transform: scale(1.06); }
        .sa-kiss { animation: sa-kiss .5s cubic-bezier(.3,1.6,.5,1) both; } @keyframes sa-kiss { from { transform: translate(-50%,-50%) scale(1.8); opacity: 0; } }
        .sa-mirror:hover .sa-hint { opacity: 1; }
        @media (prefers-reduced-motion: reduce) { .sa-drip, .sa-badge, .sa-float, .sa-kiss { animation: none; } }
        @media (max-width: 820px) { .sa-two { grid-template-columns: 1fr !important; } .sa-stages { grid-template-columns: 1fr !important; } .sa-stages > * { margin-top: 0 !important; } }
      `}</style>

      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 50, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px clamp(16px,3vw,28px)", fontSize: 12, letterSpacing: ".15em", color: C.cream, background: "linear-gradient(rgba(22,10,15,.65), transparent)" }}>
        <button onClick={() => navigate("/map")} style={{ color: C.cream }}>← {t("КАРТА", "MAP")}</button>
        <span style={{ ...serif, fontStyle: "italic", letterSpacing: ".05em", fontSize: 15 }}>Silentium</span>
        <span>{(["ru", "en"] as const).map((l) => <button key={l} onClick={() => setLang(l)} style={{ marginLeft: 10, color: lang === l ? C.pink : C.dim }}>{l.toUpperCase()}</button>)}</span>
      </nav>

      {/* hero: the vanity */}
      <header style={{ position: "relative", height: "100svh", minHeight: 600, overflow: "hidden" }}>
        <img src={`${IMG}/vanity.webp`} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
        <div style={{ position: "absolute", inset: 0, background: `linear-gradient(0deg, ${C.bg} 2%, rgba(22,10,15,.35) 40%, rgba(22,10,15,.15)), radial-gradient(ellipse at 50% 60%, transparent 30%, rgba(22,10,15,.55))` }} />
        <img className="sa-drip" src={`${IMG}/drip.webp`} alt="" aria-hidden style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "clamp(110px, 24vh, 240px)", objectFit: "fill", pointerEvents: "none", filter: "drop-shadow(0 8px 12px rgba(0,0,0,.35))" }} />
        <div style={{ position: "absolute", left: "50%", top: "56%", width: "min(280px, 52vw)", height: "min(40vh, 380px)", transform: "translate(-50%,-50%)" }}>
          <Bottle3D style={{ position: "absolute", inset: 0 }} lighting="studio" liquid="#f2a7b8" liquidOpacity={0.88} glass="#fff0f4" cap="#1a1214" capRoughness={0.35} collar="#f0c9a0" spin={0.2}
            drawLabel={(ctx, w, h) => {
              ctx.fillStyle = "#fbeef0"; ctx.fillRect(0, 0, w, h);
              ctx.fillStyle = "#e8577a"; ctx.textAlign = "center";
              ctx.font = "italic 400 120px 'Playfair Display', serif"; ctx.fillText("Self", w / 2, h * 0.44);
              ctx.font = "italic 400 86px 'Playfair Display', serif"; ctx.fillText("addicted", w / 2, h * 0.68);
              ctx.font = "60px serif"; ctx.fillText("♡", w / 2, h * 0.9);
            }} />
        </div>
        {/* bestseller badge */}
        <div style={{ position: "absolute", right: "clamp(16px, 7vw, 110px)", top: "38%", width: "clamp(96px, 12vw, 140px)", aspectRatio: "1" }}>
          <svg viewBox="0 0 100 100" className="sa-badge" style={{ position: "absolute", inset: 0 }} aria-hidden>
            <defs><path id="sa-c" d="M50,50 m-38,0 a38,38 0 1,1 76,0 a38,38 0 1,1 -76,0" /></defs>
            <text fill={C.cream} style={{ ...sans, fontSize: 8.5, fontWeight: 600, letterSpacing: 2.6 }}><textPath href="#sa-c">{t("БЕСТСЕЛЛЕР · БЕСТСЕЛЛЕР · БЕСТСЕЛЛЕР · ", "BESTSELLER · BESTSELLER · BESTSELLER · ")}</textPath></text>
          </svg>
          <span style={{ position: "absolute", inset: "24%", borderRadius: "50%", background: `radial-gradient(circle at 35% 30%, #ffc2d3, ${C.rose})`, display: "flex", alignItems: "center", justifyContent: "center", ...serif, fontStyle: "italic", fontSize: "clamp(18px, 2.4vw, 26px)", color: "#fff", boxShadow: `0 0 30px ${C.rose}88` }}>№1</span>
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, bottom: "clamp(40px, 8vh, 80px)", textAlign: "center", padding: "0 16px" }}>
          <h1 style={{ ...serif, fontStyle: "italic", fontWeight: 400, fontSize: "clamp(3.6rem, 11vw, 9rem)", lineHeight: 0.92, textShadow: `0 4px 40px ${C.bg}` }}>Self addicted</h1>
          <p style={{ ...serif, fontStyle: "italic", fontSize: "clamp(1.2rem, 2.4vw, 1.8rem)", color: C.blush, marginTop: 12 }}>{t("Сахар, цветущий апельсин и пудра", "Sugar, orange blossom and powder")}</p>
        </div>
      </header>

      {/* what it smells like */}
      <section className="sa-two" style={{ maxWidth: 1180, margin: "0 auto", padding: "100px clamp(16px,4vw,48px) 120px", display: "grid", gridTemplateColumns: "1.15fr .85fr", gap: "50px 70px", alignItems: "center" }}>
        <div>
          <p style={{ fontSize: 12, letterSpacing: ".35em", textTransform: "uppercase", color: C.pink }}>{t("Как он пахнет", "What it smells like")}</p>
          <p style={{ ...serif, fontStyle: "italic", fontSize: "clamp(1.6rem, 2.9vw, 2.4rem)", lineHeight: 1.3, marginTop: 16 }}>{L(g.plain)}</p>
          <dl style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px 30px", marginTop: 40 }}>
            {facts.map(([k, v]) => (
              <div key={k} style={{ borderTop: `1px solid ${C.pink}44`, paddingTop: 12 }}>
                <dt style={{ fontSize: 11, letterSpacing: ".22em", textTransform: "uppercase", color: C.pink }}>{k}</dt>
                <dd style={{ fontSize: 17, lineHeight: 1.4, marginTop: 6 }}>{v}</dd>
              </div>
            ))}
          </dl>
          {g.tip && <p style={{ marginTop: 26, fontSize: 15, color: C.dim }}><span style={{ color: C.gold }}>♡ </span>{L(g.tip)}</p>}
        </div>
        <div style={{ textAlign: "center", padding: "40px 20px", borderRadius: 28, background: `radial-gradient(circle at 50% 30%, ${C.rose}33, transparent 70%), ${C.bg2}`, border: `1px solid ${C.pink}22` }}>
          <p style={{ fontSize: 12, letterSpacing: ".3em", textTransform: "uppercase", color: C.pink }}>{t("Диффузия", "Diffusion")}</p>
          <p style={{ ...serif, fontStyle: "italic", fontSize: "clamp(4.5rem, 10vw, 7.5rem)", lineHeight: 1, margin: "10px 0", background: `linear-gradient(180deg, ${C.blush}, ${C.caramel})`, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>10–15</p>
          <p style={{ ...serif, fontStyle: "italic", fontSize: 24, color: C.cream }}>{t("метров", "metres")}</p>
          <p style={{ fontSize: 15, lineHeight: 1.55, color: C.dim, marginTop: 18 }}>{t("Самый мощный аромат коллекции. Когда он в комнате, остальные ароматы меркнут.", "The most powerful scent in the collection. When it's in the room, every other perfume fades.")}</p>
        </div>
      </section>

      {/* radius */}
      <RadiusScene t={t} />

      {/* drydown */}
      <section style={{ maxWidth: 1180, margin: "0 auto", padding: "120px clamp(16px,4vw,48px) 120px" }}>
        <Head kicker={t("Как раскрывается на коже", "How it unfolds on skin")} title={t("Сладко с первой секунды и до утра", "Sweet from the first second until morning")} />
        <div className="sa-stages" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 28, alignItems: "start" }}>
          {g.drydown.map((d, i) => (
            <article key={i} className="sa-stage" style={{ marginTop: i * 60 }}>
              <div style={{ overflow: "hidden", borderRadius: 22, boxShadow: "0 30px 60px rgba(0,0,0,.5)" }}>
                <img src={stages[i]} alt="" loading="lazy" style={{ display: "block", width: "100%", aspectRatio: "3 / 4", objectFit: "cover" }} />
              </div>
              <p style={{ fontSize: 12, letterSpacing: ".25em", textTransform: "uppercase", color: C.pink, marginTop: 20 }}>{L(d.when)}</p>
              <p style={{ ...serif, fontStyle: "italic", fontSize: "clamp(1.25rem, 1.9vw, 1.5rem)", lineHeight: 1.35, marginTop: 10 }}>{L(d.text)}</p>
              <p style={{ fontSize: 13, color: C.dim, marginTop: 10, lineHeight: 1.6 }}>{n[d.notes] ? pick(lang, n[d.notes]!).join(" · ") : ""}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ingredients */}
      <section style={{ background: `radial-gradient(ellipse at 50% 50%, ${C.bg2}, ${C.bg} 70%)`, padding: "110px clamp(16px,4vw,48px) 100px" }}>
        <Head kicker={t("Рецепт", "The recipe")} title={t("Из чего он сделан", "What it's made of")} />
        <Ingredients lang={lang} />
        {otherNotes.length > 0 && <p style={{ textAlign: "center", fontSize: 14, color: C.dim, maxWidth: 720, margin: "30px auto 0", lineHeight: 1.7 }}>{t("А ещё", "And also")}: {otherNotes.join(" · ")}</p>}
      </section>

      {/* strength */}
      <section style={{ maxWidth: 880, margin: "0 auto", padding: "110px clamp(16px,4vw,48px) 120px" }}>
        <Head kicker={t("Характер", "Character")} title={t("Чего в нём больше всего", "What it's made of most")} />
        {g.facets.map((f, i) => <CaramelBar key={i} i={i} label={L(f.label)} value={f.value} />)}
      </section>

      {/* scenes */}
      <section style={{ position: "relative", minHeight: "90vh", display: "flex", alignItems: "flex-end", overflow: "hidden" }}>
        <img src={`${IMG}/turn.webp`} alt={t("Люди оборачиваются", "People turning around")} loading="lazy" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
        <div style={{ position: "absolute", inset: 0, background: `linear-gradient(0deg, ${C.bg} 6%, rgba(22,10,15,.55) 50%, rgba(22,10,15,.2))` }} />
        <div className="sa-two" style={{ position: "relative", maxWidth: 1180, margin: "0 auto", width: "100%", padding: "0 clamp(16px,4vw,48px) 80px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "30px 60px", alignItems: "end" }}>
          <div>
            <p style={{ fontSize: 12, letterSpacing: ".35em", textTransform: "uppercase", color: C.pink }}>{t("На что это похоже", "What it feels like")}</p>
            <p style={{ ...serif, fontStyle: "italic", fontSize: "clamp(2.4rem, 5vw, 4rem)", lineHeight: 1.05, marginTop: 12 }}>{t("«Чем ты пахнешь?»", "“What are you wearing?”")}</p>
          </div>
          <div>
            {pick(lang, g.scenes).map((s, i) => (
              <p key={i} style={{ ...serif, fontStyle: "italic", fontSize: "clamp(1.15rem, 1.8vw, 1.4rem)", lineHeight: 1.4, padding: "12px 0", borderBottom: i < 3 ? "1px solid rgba(251,238,240,.12)" : "none" }}>{s}</p>
            ))}
          </div>
        </div>
      </section>

      {/* request: a kiss on the mirror */}
      <section style={{ padding: "110px 16px 140px", display: "flex", flexDirection: "column", alignItems: "center", gap: 26 }}>
        <Head kicker={t("Заявка", "Request")} title={t("Оставьте поцелуй", "Leave a kiss")} />
        <button onClick={kiss} className="sa-mirror" aria-label={t("Поцеловать зеркало и оставить заявку", "Kiss the mirror and leave a request")}
          style={{ position: "relative", width: "min(460px, 86vw)", aspectRatio: "3 / 4", borderRadius: "50% 50% 46% 46% / 40% 40% 30% 30%", background: `linear-gradient(135deg, rgba(255,255,255,.22), rgba(255,255,255,.04) 40%, rgba(255,200,215,.12) 60%, rgba(255,255,255,.18)), url(${IMG}/pillow.webp) center/cover`, boxShadow: `0 0 0 10px #c9a26b, 0 0 0 13px #7a5a2c, 0 40px 90px rgba(0,0,0,.6), 0 0 80px ${C.rose}33`, overflow: "hidden", cursor: "pointer" }}>
          <span aria-hidden style={{ position: "absolute", inset: 0, background: "linear-gradient(115deg, transparent 30%, rgba(255,255,255,.28) 42%, transparent 52%)" }} />
          {kisses.map((k, i) => (
            <img key={i} className="sa-kiss" src={`${IMG}/kiss.webp`} alt="" style={{ position: "absolute", left: `${k.x}%`, top: `${k.y}%`, width: "34%", transform: `translate(-50%,-50%) rotate(${k.r}deg)`, pointerEvents: "none", mixBlendMode: "multiply" }} />
          ))}
          {!kisses.length && <span className="sa-hint" style={{ position: "absolute", left: 0, right: 0, bottom: "14%", ...serif, fontStyle: "italic", fontSize: 22, color: "#fff", textShadow: "0 2px 12px rgba(0,0,0,.6)", opacity: 0.85, transition: "opacity .3s" }}>{t("поцелуйте зеркало", "kiss the mirror")}</span>}
        </button>
        <p style={{ fontSize: 14, color: C.dim, textAlign: "center", maxWidth: 420, lineHeight: 1.6 }}>{t("Оставьте контакт — мы напишем и расскажем, как получить флакон.", "Leave your contact — we'll write and tell you how to get a bottle.")}</p>
        <p style={{ fontSize: 12, color: C.dim }}>Extrait de parfum · {perfume.releaseDate} · {L(perfume.origin.location)}</p>
      </section>

      <RequestDialog open={open} onClose={() => setOpen(false)} perfumeName={perfume.name} skin={skin} />
    </div>
  );
}
