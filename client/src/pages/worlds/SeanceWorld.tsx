// Seance — a page read by candlelight.
// The cursor is the only light source; notes live on a spirit board; the profile is a row of candles.

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useLocation } from "wouter";
import { useLang } from "@/contexts/LangContext";
import Bottle3D from "@/components/Bottle3D";
import RequestDialog, { type DialogSkin } from "@/components/RequestDialog";
import { useReveal } from "@/lib/useReveal";
import { fragmentText, pick, prefersReducedMotion, type WorldProps } from "./shared";

const C = {
  bg: "#050403",
  ink: "#d9ccb0",
  dim: "rgba(217,204,176,0.55)",
  faint: "rgba(217,204,176,0.25)",
  gold: "#b59a62",
  wax: "#6e1914",
  wood: "#1a120c",
};
const display: CSSProperties = { fontFamily: "'Ruslan Display', 'Cormorant Garamond', serif", fontWeight: 400 };
const serif: CSSProperties = { fontFamily: "'Old Standard TT', 'Cormorant Garamond', serif" };

// ── Candle light that follows the cursor ──
function CandleLight() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current!;
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    let x = window.innerWidth / 2, y = window.innerHeight * 0.45, tx = x, ty = y, raf = 0;
    const onMove = (e: PointerEvent) => { tx = e.clientX; ty = e.clientY; };
    if (!coarse) window.addEventListener("pointermove", onMove);
    const reduced = prefersReducedMotion();
    const loop = (t: number) => {
      x += (tx - x) * 0.14; y += (ty - y) * 0.14;
      const base = coarse ? Math.max(window.innerWidth, 420) * 0.75 : 380;
      const r = base + (reduced ? 0 : Math.sin(t / 90) * 6 + Math.sin(t / 37) * 4);
      el.style.setProperty("--x", `${x}px`);
      el.style.setProperty("--y", `${y}px`);
      el.style.setProperty("--r", `${r}px`);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("pointermove", onMove); };
  }, []);
  return (
    <div ref={ref} aria-hidden style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 40 }}>
      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle var(--r) at var(--x) var(--y), rgba(5,4,3,0) 0%, rgba(5,4,3,0.3) 45%, rgba(5,4,3,0.8) 100%)` }} />
      <div style={{ position: "absolute", inset: 0, mixBlendMode: "soft-light", background: `radial-gradient(circle calc(var(--r) * 0.8) at var(--x) var(--y), rgba(255,150,60,0.55), transparent 70%)` }} />
    </div>
  );
}

// ── Words surface one by one, like ink appearing on paper ──
function GhostText({ text, style }: { text: string; style?: CSSProperties }) {
  const { ref, visible } = useReveal<HTMLParagraphElement>();
  const words = text.split(" ");
  return (
    <p ref={ref} style={style}>
      {words.map((w, i) => (
        <span key={i} style={{
          display: "inline-block", marginRight: "0.28em",
          opacity: visible ? 1 : 0, filter: visible ? "blur(0)" : "blur(8px)",
          transform: visible ? "none" : "translateY(6px)",
          transition: `opacity 1.4s ease ${i * 90}ms, filter 1.6s ease ${i * 90}ms, transform 1.4s ease ${i * 90}ms`,
        }}>{w}</span>
      ))}
    </p>
  );
}

// ── Spirit board: top notes on the outer arc, heart on the inner arc, base along the bottom ──
function SpiritBoard({ top, heart, base, yes, no, bye }: { top: string[]; heart: string[]; base: string[]; yes: string; no: string; bye: string }) {
  const W = 1000, H = 620;
  const placed = useMemo(() => {
    // each group sits on its own arc: centre (cx, cy), radius r, angular span
    const arc = (items: string[], cx: number, cy: number, r: number, span: number, size: number) =>
      items.map((label, i) => {
        const a = -Math.PI / 2 + (items.length === 1 ? 0 : (i / (items.length - 1) - 0.5) * span);
        return { label, size, x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r, rot: (a + Math.PI / 2) * (180 / Math.PI) };
      });
    const row = base.map((label, i) => ({ label, size: 21, x: base.length === 1 ? 500 : 230 + (540 / (base.length - 1)) * i, y: 565, rot: 0 }));
    return [...arc(top, 500, 780, 580, 1.2, 26), ...arc(heart, 500, 780, 410, 1.5, 19), ...row];
  }, [top, heart, base]);

  const [target, setTarget] = useState(0);
  const [held, setHeld] = useState(false);
  useEffect(() => {
    if (held || prefersReducedMotion()) return;
    const id = setInterval(() => setTarget((t) => (t + 1 + Math.floor(Math.random() * 3)) % placed.length), 2400);
    return () => clearInterval(id);
  }, [held, placed.length]);
  const p = placed[target] ?? { x: 500, y: 470 };

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }} role="img" aria-label="Spirit board of scent notes">
      <defs>
        <radialGradient id="sb-wood" cx="50%" cy="45%" r="70%">
          <stop offset="0%" stopColor="#3a2716" />
          <stop offset="70%" stopColor="#1f150c" />
          <stop offset="100%" stopColor="#0d0805" />
        </radialGradient>
        <filter id="sb-grain"><feTurbulence type="fractalNoise" baseFrequency="0.012 0.4" numOctaves="3" seed="4" /><feColorMatrix values="0 0 0 0 0.1  0 0 0 0 0.06  0 0 0 0 0.03  0 0 0 0.5 0" /><feBlend in2="SourceGraphic" mode="multiply" /></filter>
      </defs>
      <rect x="6" y="6" width={W - 12} height={H - 12} rx="46" fill="url(#sb-wood)" stroke={C.gold} strokeOpacity="0.35" />
      <rect x="6" y="6" width={W - 12} height={H - 12} rx="46" fill="transparent" filter="url(#sb-grain)" opacity="0.6" />
      <rect x="26" y="26" width={W - 52} height={H - 52} rx="32" fill="none" stroke={C.gold} strokeOpacity="0.18" strokeDasharray="2 6" />
      {/* sun & moon */}
      <g stroke={C.gold} strokeOpacity="0.55" fill="none">
        <circle cx="96" cy="96" r="26" />
        {Array.from({ length: 12 }).map((_, i) => { const a = (i / 12) * Math.PI * 2; return <line key={i} x1={96 + Math.cos(a) * 32} y1={96 + Math.sin(a) * 32} x2={96 + Math.cos(a) * 42} y2={96 + Math.sin(a) * 42} />; })}
        <path d="M 912 72 a 28 28 0 1 0 0 52 a 22 22 0 1 1 0 -52 z" />
      </g>
      <text x="96" y="170" textAnchor="middle" fill={C.ink} style={{ ...display, fontSize: 30 }}>{yes}</text>
      <text x="904" y="170" textAnchor="middle" fill={C.ink} style={{ ...display, fontSize: 30 }}>{no}</text>
      <text x={500} y="600" textAnchor="middle" fill={C.faint} style={{ ...display, fontSize: 20, letterSpacing: 6 }}>{bye}</text>
      {placed.map((n, i) => (
        <g key={i} transform={`translate(${n.x} ${n.y}) rotate(${n.rot})`}
          onMouseEnter={() => { setHeld(true); setTarget(i); }} onMouseLeave={() => setHeld(false)} style={{ cursor: "default" }}>
          <rect x={-90} y={-24} width={180} height={40} fill="transparent" />
          <text textAnchor="middle" fill={i === target ? "#f3dfae" : C.ink} style={{ ...serif, fontSize: n.size, transition: "fill .4s", letterSpacing: 1 }}>{n.label}</text>
        </g>
      ))}
      {/* planchette */}
      <g style={{ transform: `translate(${p.x}px, ${Math.min(p.y + 46, 555)}px)`, transition: "transform 1.6s cubic-bezier(.45,.05,.2,1)" }}>
        <path d="M 0 -64 C 40 -64 62 -10 50 26 C 42 50 -42 50 -50 26 C -62 -10 -40 -64 0 -64 Z" fill="rgba(217,204,176,0.14)" stroke={C.ink} strokeOpacity="0.7" strokeWidth="1.5" />
        <circle cx="0" cy="-30" r="15" fill="rgba(0,0,0,0.35)" stroke={C.ink} strokeOpacity="0.8" />
        <circle cx="0" cy="-30" r="3" fill="#f3dfae" />
      </g>
    </svg>
  );
}

// ── Candle per emotional axis; height = value ──
function Candle({ value, label, delay }: { value: number; label: string; delay: number }) {
  const { ref, visible } = useReveal();
  return (
    <div ref={ref} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, flex: "1 1 0", minWidth: 70 }}>
      <div style={{ height: 240, display: "flex", flexDirection: "column", justifyContent: "flex-end", alignItems: "center" }}>
        <div className="seance-flame" style={{ opacity: visible ? 1 : 0, transition: `opacity .8s ease ${delay + 600}ms`, animationDelay: `${delay}ms` }} />
        <div style={{ width: 2, height: 10, background: "#1b1410" }} />
        <div style={{
          width: 30, height: visible ? `${value * 2}px` : "0px",
          background: "linear-gradient(90deg, #b8aa8a, #e8dcc0 35%, #cbbd9c 70%, #8f8268)",
          borderRadius: "6px 6px 2px 2px", boxShadow: "0 0 30px rgba(255,170,80,0.15)",
          transition: `height 1.6s cubic-bezier(.16,1,.3,1) ${delay}ms`, position: "relative",
        }}>
          <div style={{ position: "absolute", top: 0, left: 4, width: 8, height: 22, background: "#e8dcc0", borderRadius: "0 0 6px 6px" }} />
        </div>
        <div style={{ width: 54, height: 7, background: "linear-gradient(#5b4a32,#2a2016)", borderRadius: 4 }} />
      </div>
      <span style={{ ...display, fontSize: 22, color: C.gold }}>{value}</span>
      <span style={{ ...serif, fontSize: 12, letterSpacing: "0.16em", textTransform: "uppercase", color: C.dim, textAlign: "center" }}>{label}</span>
    </div>
  );
}

// ── Transcript lines type themselves in ──
function TranscriptLine({ who, text, stamp, delay }: { who: string; text: string; stamp: string; delay: number }) {
  const { ref, visible } = useReveal();
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!visible) return;
    if (prefersReducedMotion()) { setN(text.length); return; }
    let raf = 0;
    const t0 = performance.now() + delay;
    const step = (now: number) => {
      const k = Math.max(0, Math.floor((now - t0) / 38));
      setN(Math.min(text.length, k));
      if (k < text.length) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [visible, text, delay]);
  return (
    <div ref={ref} style={{ display: "grid", gridTemplateColumns: "64px 110px 1fr", gap: 12, padding: "10px 0", borderBottom: `1px dashed ${C.faint}`, fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }}>
      <span style={{ color: C.faint }}>{stamp}</span>
      <span style={{ color: C.gold, letterSpacing: "0.1em" }}>{who}</span>
      <span style={{ color: C.ink }}>{text.slice(0, n)}<span className="seance-caret" style={{ opacity: n < text.length && visible ? 1 : 0 }}>▍</span></span>
    </div>
  );
}

export default function SeanceWorld({ perfume }: WorldProps) {
  const [, navigate] = useLocation();
  const { lang, setLang, t } = useLang();
  const [open, setOpen] = useState(false);
  const gallery = perfume.gallery ?? [];
  const fragments = pick(lang, perfume.memoryFragments).map(fragmentText);
  const n = perfume.scentNotes;

  const skin: DialogSkin = {
    overlay: "rgba(3,2,1,0.92)",
    panel: { background: "radial-gradient(circle at 50% 0%, #2a1d12, #0d0906 70%)", border: `1px solid ${C.gold}55`, padding: "2.5rem 2rem", color: C.ink, borderRadius: "160px 160px 6px 6px", paddingTop: "4.5rem" },
    title: { ...display, fontSize: 34, color: C.gold, marginTop: 4 },
    label: { ...serif, fontSize: 12, letterSpacing: "0.18em", textTransform: "uppercase", color: C.dim },
    input: { background: "transparent", border: "none", borderBottom: `1px solid ${C.gold}55`, padding: "8px 2px", color: C.ink, ...serif, fontSize: 16 },
    button: { background: C.wax, color: "#f0dcc0", padding: "14px", ...display, fontSize: 18, letterSpacing: 2, borderRadius: 999, boxShadow: "inset 0 -4px 10px rgba(0,0,0,.5), 0 0 30px rgba(110,25,20,.5)" },
    accent: C.gold,
    heading: { ru: "Призыв аромата", en: "Summoning" },
    submit: { ru: "Призвать", en: "Summon" },
    sent: { ru: "Вас услышали. Ждите знака.", en: "You were heard. Wait for a sign." },
  };

  return (
    <div style={{ background: C.bg, color: C.ink, minHeight: "100vh", overflowX: "hidden", ...serif }}>
      <style>{`
        .seance-flame { width: 14px; height: 30px; border-radius: 50% 50% 45% 45% / 65% 65% 35% 35%;
          background: radial-gradient(circle at 50% 75%, #fff6d8 0 18%, #ffc35a 40%, #ff7a1a 70%, transparent 72%);
          box-shadow: 0 0 22px 8px rgba(255,150,50,.35), 0 0 80px 20px rgba(255,120,40,.12);
          animation: seance-flick 2.4s infinite ease-in-out; transform-origin: 50% 90%; }
        @keyframes seance-flick { 0%,100% { transform: scale(1) rotate(-1deg); } 25% { transform: scale(1.06,.94) rotate(2deg); } 50% { transform: scale(.95,1.08) rotate(-2deg); } 75% { transform: scale(1.03,.97) rotate(1deg); } }
        .seance-caret { animation: seance-blink 1s steps(2) infinite; color: ${C.gold}; }
        @keyframes seance-blink { 50% { opacity: 0; } }
        .seance-seal-ring { animation: seance-spin 28s linear infinite; transform-origin: 50% 50%; }
        @keyframes seance-spin { to { transform: rotate(360deg); } }
        .seance-arch img { transition: transform 1.2s cubic-bezier(.16,1,.3,1), filter 1.2s; filter: sepia(.35) brightness(.7); }
        .seance-arch:hover img { transform: scale(1.06); filter: sepia(.1) brightness(1); }
        @media (prefers-reduced-motion: reduce) { .seance-flame, .seance-seal-ring { animation: none; } }
        @media (max-width: 760px) { .seance-hero { grid-template-columns: 1fr !important; } .seance-transcript > div { grid-template-columns: 48px 1fr !important; } .seance-transcript > div > span:nth-child(2) { display: none; } }
      `}</style>
      <CandleLight />

      {/* nav */}
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 50, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 24px", fontSize: 12, letterSpacing: "0.2em", textTransform: "uppercase" }}>
        <button onClick={() => navigate("/map")} style={{ color: C.dim, ...serif, letterSpacing: "0.2em" }}>← {t("к карте", "to the map")}</button>
        <span style={{ ...display, color: C.gold, letterSpacing: "0.3em" }}>Silentium · № I</span>
        <span style={{ display: "flex", gap: 10 }}>
          {(["ru", "en"] as const).map((l) => (
            <button key={l} onClick={() => setLang(l)} style={{ color: lang === l ? C.gold : C.faint, ...serif }}>{l.toUpperCase()}</button>
          ))}
        </span>
      </nav>

      {/* hero */}
      <header style={{ position: "relative", minHeight: "100vh", display: "flex", alignItems: "center" }}>
        <img src={perfume.heroImage} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: "brightness(.45) sepia(.3) blur(1px)", transform: "scale(1.05)" }} />
        <div style={{ position: "absolute", inset: 0, background: `linear-gradient(90deg, ${C.bg} 5%, rgba(5,4,3,.55) 50%, rgba(5,4,3,.2)), linear-gradient(0deg, ${C.bg}, transparent 40%)` }} />
        <div className="seance-hero" style={{ position: "relative", width: "100%", display: "grid", gridTemplateColumns: "1.15fr 1fr", alignItems: "center", gap: 24, padding: "110px clamp(16px,5vw,80px) 60px" }}>
          <div>
            <p style={{ fontSize: 12, letterSpacing: "0.4em", textTransform: "uppercase", color: C.dim }}>{perfume.emotionalPath.map((e) => e.toLowerCase()).join(" · ")}</p>
            <h1 style={{ ...display, fontSize: "clamp(4rem, 13vw, 11rem)", lineHeight: 0.9, color: C.ink, margin: "18px 0", textShadow: "0 0 40px rgba(255,160,70,.25)" }}>{perfume.name}</h1>
            <p style={{ fontStyle: "italic", fontSize: "clamp(1.3rem, 2.4vw, 2rem)", color: C.gold }}>{pick(lang, perfume.tagline)}</p>
            <p style={{ marginTop: 28, fontSize: 13, letterSpacing: "0.2em", textTransform: "uppercase", color: C.faint }}>{t("Наведите свечу на текст", "Bring the candle to the words")}</p>
          </div>
          <div style={{ position: "relative", height: "min(78vh, 680px)" }}>
            <Bottle3D
              style={{ width: "100%", height: "100%" }}
              lighting="candle" liquid="#5a3712" liquidOpacity={0.94} glass="#f1e3c6" cap="#0a0908" collar="#a8875a" spin={0.18}
              drawLabel={(ctx, w, h) => {
                ctx.fillStyle = "#d9ccb0"; ctx.fillRect(0, 0, w, h);
                ctx.strokeStyle = "#3b2a18"; ctx.lineWidth = 6; ctx.strokeRect(22, 22, w - 44, h - 44);
                ctx.lineWidth = 2; ctx.strokeRect(38, 38, w - 76, h - 76);
                ctx.fillStyle = "#1c130b"; ctx.textAlign = "center";
                ctx.font = "150px 'Ruslan Display', serif"; ctx.fillText("SEANCE", w / 2, h * 0.58);
                ctx.font = "italic 38px 'Old Standard TT', serif"; ctx.fillText("extrait de parfum · № I", w / 2, h * 0.8);
                ctx.font = "30px 'Old Standard TT', serif"; ctx.fillText("S I L E N T I U M", w / 2, h * 0.24);
              }}
            />
            <p style={{ position: "absolute", bottom: 0, width: "100%", textAlign: "center", fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", color: C.faint }}>{t("поверните флакон", "turn the bottle")}</p>
          </div>
        </div>
      </header>

      {/* invocation */}
      <section style={{ maxWidth: 880, margin: "0 auto", padding: "120px 24px", textAlign: "center" }}>
        <p style={{ fontSize: 12, letterSpacing: "0.4em", textTransform: "uppercase", color: C.gold, marginBottom: 32 }}>{t("Воззвание", "Invocation")}</p>
        <GhostText text={pick(lang, perfume.description)} style={{ fontStyle: "italic", fontSize: "clamp(1.6rem, 3.6vw, 2.7rem)", lineHeight: 1.35, color: C.ink }} />
      </section>

      {/* notes on the board */}
      <section style={{ maxWidth: 1180, margin: "0 auto", padding: "40px clamp(16px,4vw,48px) 120px" }}>
        <SectionTitle kicker={t("Доска", "The board")} title={t("Ноты, что отвечают", "Notes that answer")} />
        <SpiritBoard
          top={n.top ? pick(lang, n.top) : []} heart={n.heart ? pick(lang, n.heart) : []} base={n.base ? pick(lang, n.base) : []}
          yes={t("ДА", "YES")} no={t("НЕТ", "NO")} bye={t("ПРОЩАЙ", "GOODBYE")}
        />
        <div style={{ display: "flex", flexWrap: "wrap", gap: "12px 40px", justifyContent: "center", marginTop: 28, fontSize: 14, color: C.dim }}>
          {[["Верх", "Top", n.top], ["Сердце", "Heart", n.heart], ["База", "Base", n.base]].map(([ru, en, g]) => g && (
            <span key={en as string}><span style={{ color: C.gold, letterSpacing: "0.2em", textTransform: "uppercase", fontSize: 11 }}>{t(ru as string, en as string)} · </span>{pick(lang, g as { ru: string[]; en: string[] }).join(", ")}</span>
          ))}
        </div>
      </section>

      {/* candles */}
      <section style={{ maxWidth: 1080, margin: "0 auto", padding: "40px 24px 120px" }}>
        <SectionTitle kicker={t("Шесть свечей", "Six candles")} title={t("Что горит внутри", "What burns within")} />
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 18, marginTop: 30 }}>
          {perfume.radarAxes.map((a, i) => <Candle key={a.key} value={a.value} label={pick(lang, a.label)} delay={i * 180} />)}
        </div>
      </section>

      {/* gallery in arches */}
      {gallery.length > 0 && (
        <section style={{ padding: "40px clamp(16px,4vw,48px) 120px" }}>
          <SectionTitle kicker={t("Свидетельства", "Testimonies")} title={t("Видения", "Visions")} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 18, maxWidth: 1240, margin: "30px auto 0", alignItems: "end" }}>
            {gallery.map((src, i) => (
              <figure key={src} className="seance-arch" style={{ margin: 0, overflow: "hidden", borderRadius: "999px 999px 4px 4px", border: `1px solid ${C.gold}40`, aspectRatio: i % 2 ? "3 / 5" : "3 / 4.4", boxShadow: "0 30px 60px rgba(0,0,0,.6)" }}>
                <img src={src} alt="" loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              </figure>
            ))}
          </div>
        </section>
      )}

      {/* transcript */}
      <section style={{ maxWidth: 860, margin: "0 auto", padding: "40px 24px 120px" }}>
        <SectionTitle kicker={t("Стенограмма", "Transcript")} title={t("Сеанс № 13/05", "Session № 13/05")} />
        <div className="seance-transcript" style={{ marginTop: 26 }}>
          <TranscriptLine who={t("ВЕДУЩИЙ", "MEDIUM")} stamp="23:58" text={t("Если здесь кто-то есть — дай знак.", "If anyone is here, give us a sign.")} delay={0} />
          {fragments.map((f, i) => (
            <TranscriptLine key={i} who={t("ГОЛОС", "VOICE")} stamp={`00:${String(4 + i * 7).padStart(2, "0")}`} text={f} delay={300 + i * 250} />
          ))}
          <TranscriptLine who={t("ЗАПИСЬ", "RECORD")} stamp="00:51" text={t(`Восстановлено фрагментов: ${fragments.length} из 12. Остальное — тишина.`, `Fragments recovered: ${fragments.length} of 12. The rest is silence.`)} delay={1800} />
        </div>
      </section>

      {/* seal */}
      <section style={{ padding: "60px 24px 140px", display: "flex", flexDirection: "column", alignItems: "center", gap: 36 }}>
        <button onClick={() => setOpen(true)} aria-label={t("Призвать аромат", "Summon the fragrance")} style={{ position: "relative", width: 220, height: 220, borderRadius: "50%" }}>
          <svg viewBox="0 0 220 220" style={{ position: "absolute", inset: 0 }} className="seance-seal-ring">
            <defs><path id="seal-circle" d="M110,110 m-92,0 a92,92 0 1,1 184,0 a92,92 0 1,1 -184,0" /></defs>
            <text fill={C.gold} style={{ ...serif, fontSize: 15, letterSpacing: 6 }}>
              <textPath href="#seal-circle">{t("ПРИЗВАТЬ · ПРИЗВАТЬ · ПРИЗВАТЬ · ПРИЗВАТЬ · ", "SUMMON · SUMMON · SUMMON · SUMMON · SUMMON · ")}</textPath>
            </text>
          </svg>
          <span style={{ position: "absolute", inset: 38, borderRadius: "48% 52% 50% 50%", background: `radial-gradient(circle at 35% 30%, #a0352b, ${C.wax} 55%, #3b0a07)`, boxShadow: "inset 0 -10px 20px rgba(0,0,0,.55), inset 0 6px 12px rgba(255,160,140,.25), 0 0 60px rgba(150,30,20,.45)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ ...display, fontSize: 64, color: "#3b0a07", textShadow: "1px 1px 0 rgba(255,150,130,.35), -1px -1px 0 rgba(0,0,0,.5)" }}>S</span>
          </span>
        </button>
        <dl style={{ display: "grid", gridTemplateColumns: "repeat(3, auto)", gap: "6px 48px", textAlign: "center", fontSize: 13 }}>
          <dt style={{ color: C.faint, letterSpacing: "0.2em", textTransform: "uppercase", fontSize: 11 }}>{t("Явлен", "Manifested")}</dt>
          <dt style={{ color: C.faint, letterSpacing: "0.2em", textTransform: "uppercase", fontSize: 11 }}>{t("Место", "Place")}</dt>
          <dt style={{ color: C.faint, letterSpacing: "0.2em", textTransform: "uppercase", fontSize: 11 }}>{t("Форма", "Form")}</dt>
          <dd style={{ color: C.ink }}>{perfume.releaseDate}</dd>
          <dd style={{ color: C.ink }}>{perfume.origin.coords}</dd>
          <dd style={{ color: C.ink }}>Extrait de parfum</dd>
        </dl>
      </section>

      <RequestDialog open={open} onClose={() => setOpen(false)} perfumeName={perfume.name} skin={skin} />
    </div>
  );
}

function SectionTitle({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div style={{ textAlign: "center", marginBottom: 20 }}>
      <p style={{ fontSize: 12, letterSpacing: "0.4em", textTransform: "uppercase", color: C.gold }}>{kicker}</p>
      <h2 style={{ ...display, fontSize: "clamp(2rem, 4.5vw, 3.6rem)", color: C.ink, marginTop: 8 }}>{title}</h2>
    </div>
  );
}
