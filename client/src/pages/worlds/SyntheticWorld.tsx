// synthetic ecstasy — Y2K Tokyo at 4 a.m.
// Holographic chrome, acid colours, RGB-split cursor, notes as a sheet of puffy stickers,
// profile as a neon equaliser, memories as SMS on a flip phone, request via an INSERT COIN button.

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useLocation } from "wouter";
import { useLang } from "@/contexts/LangContext";
import Bottle3D from "@/components/Bottle3D";
import RequestDialog, { type DialogSkin } from "@/components/RequestDialog";
import { useReveal } from "@/lib/useReveal";
import { fragmentText, notesFlat, pick, prefersReducedMotion, type WorldProps } from "./shared";

const C = { bg: "#07040d", pink: "#ff2bd6", cyan: "#22f0ff", lime: "#c8ff2e", white: "#f6f0ff", dim: "rgba(246,240,255,.55)" };
const wide: CSSProperties = { fontFamily: "'Unbounded', sans-serif" };
const mono: CSSProperties = { fontFamily: "'JetBrains Mono', monospace" };
const CHROME = "linear-gradient(180deg, #ffffff 0%, #b9c3d6 28%, #3a4258 50%, #e9eef8 54%, #8892aa 75%, #ffffff 100%)";

function RgbCursor() {
  const a = useRef<HTMLDivElement>(null), b = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (window.matchMedia("(pointer: coarse)").matches || prefersReducedMotion()) return;
    let x = -100, y = -100, ax = x, ay = y, bx = x, by = y, raf = 0;
    const move = (e: PointerEvent) => { x = e.clientX; y = e.clientY; };
    window.addEventListener("pointermove", move);
    const loop = () => {
      ax += (x - ax) * 0.35; ay += (y - ay) * 0.35; bx += (x - bx) * 0.15; by += (y - by) * 0.15;
      if (a.current) a.current.style.transform = `translate(${ax - 14}px, ${ay - 14}px)`;
      if (b.current) b.current.style.transform = `translate(${bx - 14}px, ${by - 14}px)`;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("pointermove", move); };
  }, []);
  const ring: CSSProperties = { position: "fixed", left: 0, top: 0, width: 28, height: 28, borderRadius: "50%", pointerEvents: "none", zIndex: 999, mixBlendMode: "screen" };
  return <>
    <div ref={a} style={{ ...ring, border: `2px solid ${C.pink}` }} />
    <div ref={b} style={{ ...ring, border: `2px solid ${C.cyan}` }} />
  </>;
}

function Equalizer({ label, value, i }: { label: string; value: number; i: number }) {
  const { ref, visible } = useReveal();
  return (
    <div ref={ref} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
      <div style={{ height: 260, width: "100%", maxWidth: 70, display: "flex", flexDirection: "column-reverse", gap: 4 }}>
        {Array.from({ length: 16 }).map((_, k) => {
          const on = visible && k < Math.round(value / 6.25);
          const col = k > 13 ? C.pink : k > 9 ? C.lime : C.cyan;
          return <span key={k} className={on ? "se-bar" : ""} style={{ height: 12, borderRadius: 2, background: on ? col : "rgba(255,255,255,.06)", boxShadow: on ? `0 0 12px ${col}` : "none", transition: `background .1s ${k * 50 + i * 90}ms`, animationDelay: `${(i * 0.13 + k * 0.02) % 1}s` }} />;
        })}
      </div>
      <span style={{ ...mono, fontSize: 12, color: C.lime }}>{value}</span>
      <span style={{ ...wide, fontSize: 11, color: C.white, textAlign: "center", textTransform: "uppercase" }}>{label}</span>
    </div>
  );
}

function FlipPhone({ messages, t }: { messages: string[]; t: (ru: string, en: string) => string }) {
  const { ref, visible } = useReveal();
  const [shown, setShown] = useState(0);
  useEffect(() => {
    if (!visible) return;
    if (prefersReducedMotion()) { setShown(messages.length); return; }
    let raf = 0; const t0 = performance.now();
    const step = (now: number) => { const k = Math.min(messages.length, Math.floor((now - t0) / 900) + 1); setShown(k); if (k < messages.length) raf = requestAnimationFrame(step); };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [visible, messages.length]);
  return (
    <div ref={ref} style={{ width: 300, margin: "0 auto", padding: 16, borderRadius: "40px 40px 26px 26px", background: "linear-gradient(135deg, #ffb6f0, #c39bff 40%, #8be9ff)", boxShadow: "0 30px 70px rgba(255,43,214,.35), inset 0 2px 6px rgba(255,255,255,.7)" }}>
      <div style={{ ...mono, display: "flex", justifyContent: "space-between", fontSize: 10, color: "#3a1a4a", padding: "2px 10px 8px" }}><span>▂▄▆█ DoCoMo</span><span>04:12</span></div>
      <div style={{ background: "#b6f7c9", borderRadius: 10, padding: 12, minHeight: 300, boxShadow: "inset 0 3px 10px rgba(0,60,20,.4)", fontFamily: "'JetBrains Mono', monospace", color: "#0b3a1a" }}>
        <p style={{ fontSize: 11, borderBottom: "1px dashed #0b3a1a", paddingBottom: 6, marginBottom: 8 }}>✉ {t("ВХОДЯЩИЕ", "INBOX")} ({messages.length})</p>
        {messages.slice(0, shown).map((m, i) => (
          <div key={i} style={{ marginBottom: 10, animation: "se-pop .3s ease" }}>
            <p style={{ fontSize: 10, opacity: 0.7 }}>{t("от", "from")}: {["???", "ты", "unknown", "♡", "me"][i % 5]} · 0{4 + Math.floor(i / 2)}:{String(12 + i * 7).padStart(2, "0")}</p>
            <p style={{ fontSize: 13 }}>{m}{i === messages.length - 1 ? " (*^▽^*)" : ""}</p>
          </div>
        ))}
        {shown < messages.length && <p className="se-blink" style={{ fontSize: 12 }}>▮</p>}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6, marginTop: 14 }}>
        {"123456789*0#".split("").map((k) => <span key={k} style={{ ...mono, textAlign: "center", fontSize: 12, padding: "6px 0", borderRadius: 10, background: "rgba(255,255,255,.55)", color: "#3a1a4a" }}>{k}</span>)}
      </div>
    </div>
  );
}

export default function SyntheticWorld({ perfume }: WorldProps) {
  const [, navigate] = useLocation();
  const { lang, setLang, t } = useLang();
  const [open, setOpen] = useState(false);
  const notes = notesFlat(perfume, lang);
  const fragments = pick(lang, perfume.memoryFragments).map(fragmentText);
  const STICKERS = [C.pink, C.cyan, C.lime, "#ffd23a", "#b48cff", "#ff7a59"];

  const skin: DialogSkin = {
    overlay: "rgba(7,4,13,.85)",
    panel: { ...mono, background: "#120a1f", border: `2px solid ${C.pink}`, padding: "28px 24px", color: C.white, borderRadius: 18, boxShadow: `0 0 60px ${C.pink}66, inset 0 0 40px ${C.cyan}22` },
    title: { ...wide, fontSize: 26, fontWeight: 900, background: CHROME, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" },
    label: { ...mono, fontSize: 10, letterSpacing: ".18em", textTransform: "uppercase", color: C.cyan },
    input: { ...mono, fontSize: 14, background: "rgba(255,255,255,.04)", border: `1px solid ${C.cyan}66`, padding: "10px 12px", color: C.white, borderRadius: 10 },
    button: { ...wide, fontWeight: 900, fontSize: 16, background: C.lime, color: C.bg, padding: "14px", borderRadius: 999, boxShadow: `0 0 30px ${C.lime}88` },
    accent: C.pink,
    heading: { ru: "PLAYER 1 · ЗАЯВКА", en: "PLAYER 1 · REQUEST" },
    submit: { ru: "ОТПРАВИТЬ ✦", en: "SEND ✦" },
    sent: { ru: "SIGNAL RECEIVED ♡ (≧◡≦)", en: "SIGNAL RECEIVED ♡ (≧◡≦)" },
  };

  return (
    <div style={{ ...mono, background: C.bg, color: C.white, minHeight: "100vh", overflowX: "hidden", cursor: "crosshair" }}>
      <style>{`
        .se-holo { background: conic-gradient(from var(--se-a, 0deg) at 50% 50%, #ff2bd6, #22f0ff, #c8ff2e, #ffd23a, #b48cff, #ff2bd6); animation: se-rot 8s linear infinite; }
        @property --se-a { syntax: '<angle>'; inherits: false; initial-value: 0deg; }
        @keyframes se-rot { to { --se-a: 360deg; } }
        .se-chrome { background: ${CHROME}; -webkit-background-clip: text; background-clip: text; color: transparent; filter: drop-shadow(0 0 18px rgba(255,43,214,.45)); }
        .se-glitch { position: relative; }
        .se-glitch::before, .se-glitch::after { content: attr(data-t); position: absolute; inset: 0; mix-blend-mode: screen; pointer-events: none; }
        .se-glitch::before { color: ${C.pink}; animation: se-g1 2.4s infinite steps(1); }
        .se-glitch::after { color: ${C.cyan}; animation: se-g2 3.1s infinite steps(1); }
        @keyframes se-g1 { 0%,86%,100% { transform: none; clip-path: inset(0 0 0 0); opacity: 0; } 88% { opacity: .9; transform: translate(-6px, 2px); clip-path: inset(20% 0 50% 0); } 92% { opacity: .9; transform: translate(5px,-2px); clip-path: inset(60% 0 10% 0); } }
        @keyframes se-g2 { 0%,80%,100% { opacity: 0; transform: none; } 82% { opacity: .9; transform: translate(6px, -3px); clip-path: inset(40% 0 30% 0); } 85% { opacity: .9; transform: translate(-4px, 3px); clip-path: inset(5% 0 75% 0); } }
        .se-marquee { display: flex; width: max-content; animation: se-mq 18s linear infinite; }
        .se-marquee.rev { animation-direction: reverse; animation-duration: 24s; }
        @keyframes se-mq { to { transform: translateX(-50%); } }
        .se-sticker { transition: transform .35s cubic-bezier(.2,1.8,.4,1); }
        .se-sticker:hover { transform: scale(1.15) rotate(0deg) !important; z-index: 2; }
        .se-bar { animation: se-bounce .9s ease-in-out infinite alternate; }
        @keyframes se-bounce { to { opacity: .55; } }
        .se-blink { animation: se-bl 1s steps(2) infinite; } @keyframes se-bl { 50% { opacity: 0; } }
        @keyframes se-pop { from { transform: scale(.9); opacity: 0; } }
        .se-coin:hover { transform: translateY(-3px); } .se-coin:active { transform: translateY(3px); }
        @media (prefers-reduced-motion: reduce) { .se-holo, .se-marquee, .se-glitch::before, .se-glitch::after, .se-bar { animation: none; } }
      `}</style>
      <RgbCursor />

      <nav style={{ position: "sticky", top: 0, zIndex: 50, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px clamp(16px,4vw,40px)", fontSize: 12, background: "rgba(7,4,13,.7)", backdropFilter: "blur(10px)", borderBottom: `1px solid ${C.pink}33` }}>
        <button onClick={() => navigate("/map")} style={{ color: C.cyan }}>&lt;&lt; {t("КАРТА", "MAP")}</button>
        <span style={{ color: C.lime }}>★ 東京 04:12 ★ SILENTIUM.EXE ★</span>
        <span>{(["ru", "en"] as const).map((l) => <button key={l} onClick={() => setLang(l)} style={{ marginLeft: 8, padding: "2px 8px", borderRadius: 99, background: lang === l ? C.pink : "transparent", color: lang === l ? C.bg : C.dim }}>{l.toUpperCase()}</button>)}</span>
      </nav>

      {/* hero */}
      <header style={{ position: "relative", minHeight: "92vh", overflow: "hidden", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", alignItems: "center", padding: "30px clamp(16px,5vw,70px)" }}>
        <div className="se-holo" style={{ position: "absolute", inset: "-30%", opacity: 0.2, filter: "blur(80px)" }} />
        <img src={perfume.heroImage} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.25, mixBlendMode: "screen" }} />
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.04) 1px, transparent 1px)", backgroundSize: "40px 40px", maskImage: "linear-gradient(transparent, #000 60%)", WebkitMaskImage: "linear-gradient(transparent, #000 60%)" }} />
        <div style={{ position: "relative" }}>
          <p style={{ color: C.lime, fontSize: 13, letterSpacing: ".3em" }}>✦ NEW RELEASE ✦ 限定</p>
          <h1 className="se-chrome se-glitch" data-t="synthetic ecstasy" style={{ ...wide, fontWeight: 900, fontSize: "clamp(3rem, 9vw, 8rem)", lineHeight: 0.88, letterSpacing: "-0.04em", margin: "16px 0 24px" }}>synthetic ecstasy</h1>
          <p style={{ fontSize: "clamp(1rem, 1.5vw, 1.2rem)", lineHeight: 1.6, maxWidth: 460, color: C.white }}>{pick(lang, perfume.description)}</p>
          <p style={{ ...wide, marginTop: 20, fontSize: 18, color: C.pink, textShadow: `0 0 20px ${C.pink}` }}>{pick(lang, perfume.tagline)} ♡</p>
        </div>
        <div style={{ position: "relative", height: "min(78vh, 680px)" }}>
          <div className="se-holo" style={{ position: "absolute", left: "50%", top: "50%", width: "60%", aspectRatio: "1", transform: "translate(-50%,-50%)", borderRadius: "50%", filter: "blur(50px)", opacity: 0.5 }} />
          <Bottle3D style={{ position: "absolute", inset: 0 }} lighting="neon" liquid="#ff3fa4" liquidOpacity={0.85} glass="#ffe6fb" cap="#c8ff2e" capRoughness={0.25} collar="#e8eef8" spin={0.6}
            drawLabel={(ctx, w, h) => {
              const g = ctx.createLinearGradient(0, 0, w, h);
              g.addColorStop(0, "#22f0ff"); g.addColorStop(0.5, "#ff2bd6"); g.addColorStop(1, "#c8ff2e");
              ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
              ctx.fillStyle = "#07040d"; ctx.textAlign = "center";
              ctx.font = "900 86px 'Unbounded', sans-serif"; ctx.fillText("SYNTHETIC", w / 2, h * 0.42);
              ctx.fillText("ECSTASY", w / 2, h * 0.62);
              ctx.font = "34px 'JetBrains Mono', monospace"; ctx.fillText("★ 東京 · 0.0 % REAL ★", w / 2, h * 0.85);
            }} />
        </div>
      </header>

      {/* marquees */}
      <div style={{ transform: "rotate(-2deg)", margin: "0 -20px", background: C.lime, color: C.bg, padding: "10px 0", overflow: "hidden" }}>
        <div className="se-marquee" style={{ ...wide, fontWeight: 900, fontSize: 26 }}>{Array.from({ length: 2 }).map((_, k) => <span key={k} style={{ whiteSpace: "nowrap", paddingRight: 40 }}>{pick(lang, perfume.keywords)} ✦ 合成エクスタシー ✦ {pick(lang, perfume.keywords)} ✦ 合成エクスタシー ✦ </span>)}</div>
      </div>
      <div style={{ transform: "rotate(1.5deg)", margin: "8px -20px 0", background: C.pink, color: C.bg, padding: "8px 0", overflow: "hidden" }}>
        <div className="se-marquee rev" style={{ ...mono, fontWeight: 500, fontSize: 16 }}>{Array.from({ length: 2 }).map((_, k) => <span key={k} style={{ whiteSpace: "nowrap", paddingRight: 40 }}>{fragments.join("  ✧  ")}  ✧  </span>)}</div>
      </div>

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "100px clamp(16px,4vw,40px)" }}>
        <section style={{ marginBottom: 120 }}>
          <H n="01" title={t("стикеры", "stickers")} sub={t("ноты · собери все", "notes · collect them all")} />
          <div style={{ background: "#fff", borderRadius: 24, padding: "30px clamp(16px,3vw,40px)", display: "flex", flexWrap: "wrap", gap: 18, justifyContent: "center", boxShadow: `0 0 0 6px ${C.cyan}, 0 30px 80px rgba(34,240,255,.2)` }}>
            {notes.map((note, i) => (
              <span key={note} className="se-sticker" style={{ ...wide, fontWeight: 700, fontSize: "clamp(.9rem, 1.6vw, 1.15rem)", padding: "14px 22px", borderRadius: [999, 18, 999, 30, 12][i % 5], background: STICKERS[i % STICKERS.length], color: C.bg, border: "4px solid #fff", outline: "1px solid rgba(0,0,0,.12)", boxShadow: "0 6px 0 rgba(0,0,0,.15), inset 0 3px 0 rgba(255,255,255,.5)", transform: `rotate(${[-6, 4, -2, 7, -4, 3][i % 6]}deg)` }}>{note}</span>
            ))}
          </div>
        </section>

        <section style={{ marginBottom: 120 }}>
          <H n="02" title={t("уровни", "levels")} sub={t("эмоциональный эквалайзер", "emotional equaliser")} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: 18, padding: 26, borderRadius: 20, background: "#0e0818", border: `1px solid ${C.cyan}33` }}>
            {perfume.radarAxes.map((a, i) => <Equalizer key={a.key} label={pick(lang, a.label)} value={a.value} i={i} />)}
          </div>
        </section>

        <section style={{ marginBottom: 120, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 50, alignItems: "center" }}>
          <div>
            <H n="03" title={t("сообщения", "messages")} sub={t("которые пришли после полуночи", "that arrived after midnight")} />
            <p style={{ fontSize: 15, lineHeight: 1.7, color: C.dim, maxWidth: 420 }}>{t("Пять SMS, которые ты так и не удалил. Ты не знаешь, что из этого было на самом деле.", "Five texts you never deleted. You don't know which of them really happened.")}</p>
          </div>
          <FlipPhone messages={fragments} t={t} />
        </section>

        <section style={{ textAlign: "center" }}>
          <button className="se-coin" onClick={() => setOpen(true)} style={{ transition: "transform .1s", width: 220, height: 220, borderRadius: "50%", background: `radial-gradient(circle at 35% 30%, #ffb2ef, ${C.pink} 55%, #a1007f)`, boxShadow: `0 10px 0 #7a0060, 0 0 80px ${C.pink}88, inset 0 4px 8px rgba(255,255,255,.6)`, ...wide, fontWeight: 900, fontSize: 24, color: C.white, textShadow: "0 2px 0 rgba(0,0,0,.3)" }}>INSERT<br />COIN</button>
          <p className="se-blink" style={{ marginTop: 26, color: C.lime, fontSize: 14, letterSpacing: ".3em" }}>{t("НАЖМИ, ЧТОБЫ ПОЛУЧИТЬ", "PRESS TO GET IT")}</p>
          <p style={{ marginTop: 14, color: C.dim, fontSize: 12 }}>Extrait de parfum · {perfume.releaseDate} · {perfume.origin.coords} · {pick(lang, perfume.origin.location)}</p>
        </section>
      </main>
      <RequestDialog open={open} onClose={() => setOpen(false)} perfumeName={perfume.name} skin={skin} />
    </div>
  );
}

function H({ n, title, sub }: { n: string; title: string; sub: string }) {
  return (
    <div style={{ marginBottom: 30 }}>
      <p style={{ ...mono, fontSize: 12, color: C.cyan }}>[{n}] {sub}</p>
      <h2 className="se-chrome" style={{ ...wide, fontWeight: 900, fontSize: "clamp(2rem, 4.6vw, 4.4rem)", lineHeight: 1, letterSpacing: "-0.03em", textTransform: "uppercase", overflowWrap: "anywhere" }}>{title}</h2>
    </div>
  );
}
