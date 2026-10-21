// almost nothing — a second skin.
// The page is almost nothing too: skin tone, vast quiet, hairline type. It is the one world you touch
// rather than look at: the pointer leaves a warm blush on the "skin" that slowly fades, the notes
// appear only when you press and hold a fingerprint, the profile is a sillage map that barely leaves
// the body, and the request is leaving a trace.

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useLocation } from "wouter";
import { useLang } from "@/contexts/LangContext";
import Bottle3D from "@/components/Bottle3D";
import RequestDialog, { type DialogSkin } from "@/components/RequestDialog";
import { useReveal } from "@/lib/useReveal";
import { fragmentText, pick, prefersReducedMotion, type WorldProps } from "./shared";

const C = { skin: "#efe2d6", paper: "#f6eee6", blush: "#e5bba6", ink: "#5a4a42", dim: "rgba(90,74,66,.6)", faint: "rgba(90,74,66,.22)", whisper: "rgba(90,74,66,.12)" };
const thin: CSSProperties = { fontFamily: "'Jost', 'Manrope', sans-serif", fontWeight: 200 };
const light: CSSProperties = { fontFamily: "'Jost', 'Manrope', sans-serif", fontWeight: 300 };
const IMG = "/images/almost-nothing";

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

// How close you have to be: each ring is a quality, its radius how far it carries
function SillageMap({ axes, lang }: { axes: { key: string; label: { ru: string; en: string }; value: number }[]; lang: "ru" | "en" }) {
  const { ref, visible } = useReveal();
  const sorted = [...axes].sort((a, b) => b.value - a.value);
  const cm = (v: number) => Math.max(2, Math.round((100 - v) * 1.6));
  const rad = (centimetres: number) => Math.min(206, 22 + Math.sqrt(centimetres) * 17); // sqrt scale: the near rings get room
  return (
    <div ref={ref} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 40, alignItems: "center" }}>
      <svg viewBox="-250 -235 500 470" style={{ width: "100%", maxWidth: 460, margin: "0 auto", display: "block" }} role="img" aria-label={lang === "ru" ? "Карта шлейфа" : "Sillage map"}>
        {([["1 м", "1 m", 100], ["50 см", "50 cm", 50], ["10 см", "10 cm", 10]] as const).map(([ru, en, d]) => (
          <g key={d}>
            <circle r={rad(d)} fill="none" stroke="rgba(90,74,66,.18)" strokeDasharray="2 6" />
            <text x={0} y={-rad(d) - 6} textAnchor="middle" style={{ ...light, fontSize: 14 }} fill={C.dim}>{lang === "ru" ? ru : en}</text>
          </g>
        ))}
        {sorted.map((a, i) => {
          const r = rad(cm(a.value)); // the more intimate, the closer to the skin
          const ang = -Math.PI * 0.85 + (i / sorted.length) * Math.PI * 2;
          return (
            <g key={a.key} style={{ opacity: visible ? 1 : 0, transition: `opacity 1.6s ease ${i * 200}ms` }}>
              <circle r={visible ? r : 0} fill={`rgba(229,187,166,${0.05 + (a.value / 100) * 0.08})`} stroke={C.blush} strokeOpacity=".7" style={{ transition: `r 2s cubic-bezier(.16,1,.3,1) ${i * 200}ms` }} />
              <circle cx={Math.cos(ang) * r} cy={Math.sin(ang) * r} r="3" fill={C.ink} />
              <text x={Math.cos(ang) * r + (Math.cos(ang) >= 0 ? 8 : -8)} y={Math.sin(ang) * r + 4} textAnchor={Math.cos(ang) >= 0 ? "start" : "end"} style={{ ...light, fontSize: 17 }} fill={C.ink}>{pick(lang, a.label)}</text>
            </g>
          );
        })}
        <circle r="5" fill={C.ink} />
        <text y="24" textAnchor="middle" style={{ ...light, fontSize: 14, letterSpacing: 3 }} fill={C.dim}>{lang === "ru" ? "КОЖА" : "SKIN"}</text>
      </svg>
      <div>
        {sorted.map((a) => (
          <div key={a.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "12px 0", borderBottom: `1px solid ${C.whisper}` }}>
            <span style={{ ...thin, fontSize: 22 }}>{pick(lang, a.label)}</span>
            <span style={{ ...light, fontSize: 13, color: C.dim }}>{a.key === "sillage" ? (lang === "ru" ? "почти нет" : "almost none") : (lang === "ru" ? `ближе ${cm(a.value)} см` : `within ${cm(a.value)} cm`)}</span>
          </div>
        ))}
      </div>
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

export default function AlmostNothingWorld({ perfume }: WorldProps) {
  const [, navigate] = useLocation();
  const { lang, setLang, t } = useLang();
  const [open, setOpen] = useState(false);
  const [traces, setTraces] = useState<{ x: number; y: number; r: number }[]>([]);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const fragments = pick(lang, perfume.memoryFragments).map(fragmentText);
  const notesEn = perfume.scentNotes.all?.en ?? [];
  const notesLocal = perfume.scentNotes.all ? pick(lang, perfume.scentNotes.all) : [];

  const leaveTrace = (e: React.MouseEvent<HTMLButtonElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    setTraces((tr) => [...tr, { x: e.clientX - r.left, y: e.clientY - r.top, r: Math.random() * 50 - 25 }]);
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

  return (
    <div style={{ ...thin, background: `radial-gradient(ellipse at 50% 20%, #f6ebe1, ${C.skin} 60%, #e8d8ca)`, color: C.ink, minHeight: "100vh", overflowX: "hidden", position: "relative" }}>
      <style>{`
        .an-grain::after { content: ""; position: fixed; inset: 0; pointer-events: none; z-index: 2; opacity: .22; mix-blend-mode: multiply;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 160 160' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.2' numOctaves='2'/%3E%3CfeColorMatrix values='0 0 0 0 .55 0 0 0 0 .42 0 0 0 0 .36 0 0 0 .5 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"); }
        .an-breathe { animation: an-breathe 7s ease-in-out infinite; } @keyframes an-breathe { 50% { opacity: .55; } }
        @media (prefers-reduced-motion: reduce) { .an-breathe { animation: none; } }
      `}</style>
      <div className="an-grain" />
      <Warmth />

      <nav style={{ position: "relative", zIndex: 10, display: "flex", justifyContent: "space-between", padding: "22px clamp(16px,4vw,48px)", ...light, fontSize: 12, letterSpacing: ".25em", color: C.dim }}>
        <button onClick={() => navigate("/map")} style={{ color: C.dim }}>← {t("карта", "map")}</button>
        <span>silentium</span>
        <span>{(["ru", "en"] as const).map((l) => <button key={l} onClick={() => setLang(l)} style={{ marginLeft: 12, color: lang === l ? C.ink : C.faint }}>{l}</button>)}</span>
      </nav>

      {/* hero: almost nothing */}
      <header style={{ position: "relative", zIndex: 3, minHeight: "92vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "0 16px" }}>
        <div aria-hidden style={{ position: "absolute", inset: 0, opacity: 0.35, mixBlendMode: "multiply", maskImage: "radial-gradient(ellipse at center, #000 20%, transparent 70%)", WebkitMaskImage: "radial-gradient(ellipse at center, #000 20%, transparent 70%)" }}>
          <Photo src={perfume.heroImage} alt="" style={{ height: "100%" }} />
        </div>
        <div style={{ position: "relative", width: "min(320px, 70vw)", height: "min(46vh, 420px)" }}>
          <Bottle3D style={{ position: "absolute", inset: 0 }} lighting="fog" liquid="#f1e2d6" liquidOpacity={0.45} glass="#fffaf6" cap="#e8d5c6" capRoughness={0.92} collar="#d8c3b0" spin={0.07}
            drawLabel={(ctx, w, h) => {
              ctx.fillStyle = "#f3e7dc"; ctx.fillRect(0, 0, w, h);
              ctx.fillStyle = "#5a4a42"; ctx.textAlign = "center";
              ctx.font = "200 104px 'Jost', sans-serif"; ctx.fillText("almost", w / 2, h * 0.47);
              ctx.fillText("nothing", w / 2, h * 0.7);
              ctx.font = "300 24px 'Jost', sans-serif"; ctx.fillStyle = "#9b867a"; ctx.fillText("s i l e n t i u m", w / 2, h * 0.88);
            }} />
        </div>
        <h1 style={{ ...thin, fontSize: "clamp(3rem, 9vw, 7.5rem)", letterSpacing: "-.03em", lineHeight: 0.95, marginTop: 10 }}>almost nothing</h1>
        <p style={{ ...light, fontSize: "clamp(1rem, 1.6vw, 1.25rem)", color: C.dim, marginTop: 18 }}>{pick(lang, perfume.tagline).toLowerCase()}</p>
        <p className="an-breathe" style={{ ...light, fontSize: 12, letterSpacing: ".3em", color: C.faint, textTransform: "uppercase", marginTop: 54 }}>{t("подойдите ближе", "come closer")}</p>
      </header>

      <main style={{ position: "relative", zIndex: 3, maxWidth: 1100, margin: "0 auto", padding: "0 clamp(16px,5vw,64px)" }}>
        {/* the line */}
        <section style={{ minHeight: "70vh", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
          <Whisper><p style={{ ...thin, fontSize: "clamp(1.7rem, 4vw, 3.2rem)", lineHeight: 1.3, maxWidth: 820 }}>{pick(lang, perfume.description)}</p></Whisper>
        </section>

        {/* notes on skin */}
        <section style={{ marginBottom: 160 }}>
          <Whisper style={{ textAlign: "center", marginBottom: 50 }}>
            <p style={{ ...light, fontSize: 12, letterSpacing: ".3em", color: C.dim, textTransform: "uppercase" }}>{t("четыре ноты", "four notes")}</p>
            <h2 style={{ ...thin, fontSize: "clamp(2rem, 4.6vw, 3.6rem)", marginTop: 10 }}>{t("Прикоснитесь и подержите", "Touch and hold")}</h2>
          </Whisper>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 30 }}>
            {notesEn.map((en, i) => <HoldNote key={en} note={notesLocal[i] ?? en} text={lang === "ru" ? NOTE_TEXT[en]?.[0] ?? "" : NOTE_TEXT[en]?.[1] ?? ""} t={t} />)}
          </div>
        </section>

        {/* photo pair (generated images; hidden until they exist) */}
        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 18, marginBottom: 160 }}>
          {([["sheets", t("Смятые белые простыни в утреннем свете", "Crumpled white sheets in morning light"), 0], ["iron", t("Пар от утюга над белым хлопком", "Steam from an iron over white cotton"), 1]] as const).map(([name, alt, k]) => (
            <Whisper key={name} style={{ marginTop: k ? "14vh" : 0 }}>
              <Photo src={`${IMG}/${name}.webp`} alt={alt} style={{ aspectRatio: "4 / 5", borderRadius: 4, boxShadow: "0 40px 80px rgba(90,74,66,.12)" }} />
              <p style={{ ...light, fontSize: 13, color: C.dim, marginTop: 14 }}>{fragments[k === 0 ? 0 : 2]?.toLowerCase()}</p>
            </Whisper>
          ))}
        </section>

        {/* sillage */}
        <section style={{ marginBottom: 160 }}>
          <Whisper style={{ textAlign: "center", marginBottom: 40 }}>
            <p style={{ ...light, fontSize: 12, letterSpacing: ".3em", color: C.dim, textTransform: "uppercase" }}>{t("шлейф", "sillage")}</p>
            <h2 style={{ ...thin, fontSize: "clamp(2rem, 4.6vw, 3.6rem)", marginTop: 10 }}>{t("Насколько близко подойти", "How close to come")}</h2>
          </Whisper>
          <SillageMap axes={perfume.radarAxes} lang={lang} />
        </section>

        {/* whispers */}
        <section style={{ marginBottom: 140, textAlign: "center" }}>
          {fragments.map((f, i) => (
            <Whisper key={i} style={{ padding: "8vh 0" }}>
              <p style={{ ...thin, fontSize: "clamp(1.4rem, 3vw, 2.4rem)", lineHeight: 1.2, color: C.ink }}>{f.toLowerCase()}</p>
            </Whisper>
          ))}
        </section>
      </main>

      {/* leave a trace */}
      <section style={{ position: "relative", zIndex: 3, padding: "6vh clamp(16px,5vw,64px) 14vh", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 18 }}>
        <div style={{ width: "min(420px, 80vw)", marginBottom: 20 }}>
          <Photo src={`${IMG}/wrist.webp`} alt={t("Запястье крупным планом", "A wrist, close up")} style={{ aspectRatio: "1", objectPosition: "50% 70%", maskImage: "radial-gradient(circle, #000 48%, transparent 70%)", WebkitMaskImage: "radial-gradient(circle, #000 48%, transparent 70%)" }} />
        </div>
        <p style={{ ...thin, fontSize: "clamp(1.8rem, 4vw, 3rem)" }}>{t("Оставьте след", "Leave a trace")}</p>
        <button onClick={leaveTrace} aria-label={t("Оставить след и написать нам", "Leave a trace and write to us")} style={{ position: "relative", width: "min(360px, 80vw)", height: 180, borderRadius: 999, background: `radial-gradient(ellipse at 50% 40%, #f8efe7, ${C.skin})`, boxShadow: "inset 0 2px 20px rgba(90,74,66,.08), 0 20px 60px rgba(90,74,66,.10)", overflow: "hidden" }}>
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
