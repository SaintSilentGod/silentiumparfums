// Highest in the room — an ascent above the clouds.
// The page opens at the bottom, on a night street in LA, and you scroll UP: through the city lights
// (base notes), the smog (heart notes and memories), the clouds (the profile as flight instruments)
// to a sunrise above everything (top notes and the request). The bottle rises with you.

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useLocation } from "wouter";
import { useLang } from "@/contexts/LangContext";
import Bottle3D from "@/components/Bottle3D";
import RequestDialog, { type DialogSkin } from "@/components/RequestDialog";
import { useReveal } from "@/lib/useReveal";
import { fragmentText, pick, prefersReducedMotion, type WorldProps } from "./shared";

const C = { ink: "#fff6ec", dim: "rgba(255,246,236,.6)", faint: "rgba(255,246,236,.25)", gold: "#ffd59a", rose: "#f39a86", night: "#04050d" };
const airy: CSSProperties = { fontFamily: "'Tenor Sans', 'Manrope', sans-serif", fontWeight: 400 };
const mono: CSSProperties = { fontFamily: "'JetBrains Mono', monospace" };
const MAX_ALT = 12000;

// Scroll position as altitude: bottom of the page = street level, top = 12 000 m
function useAltitude() {
  const p = useRef(0);
  const [alt, setAlt] = useState(0);
  useEffect(() => {
    const on = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const prog = max > 0 ? 1 - window.scrollY / max : 0;
      p.current = prog;
      document.documentElement.style.setProperty("--hi-p", prog.toFixed(4));
      setAlt(Math.round((prog * MAX_ALT) / 10) * 10);
    };
    on();
    window.addEventListener("scroll", on, { passive: true });
    window.addEventListener("resize", on);
    return () => { window.removeEventListener("scroll", on); window.removeEventListener("resize", on); document.documentElement.style.removeProperty("--hi-p"); };
  }, []);
  return { alt, progress: p };
}

// Open the page at the bottom (street level) and keep it there until the layout settles or the user moves
function useStartAtBottom() {
  useLayoutEffect(() => {
    let touched = false;
    const mark = () => { touched = true; };
    const go = () => { if (!touched) window.scrollTo(0, document.documentElement.scrollHeight); };
    go();
    const evs = ["wheel", "touchstart", "keydown", "pointerdown"] as const;
    evs.forEach((e) => window.addEventListener(e, mark, { passive: true }));
    let n = 0;
    const id = window.setInterval(() => { go(); if (++n > 25 || touched) clearInterval(id); }, 80);
    return () => { clearInterval(id); evs.forEach((e) => window.removeEventListener(e, mark)); };
  }, []);
}

function Cloud({ x, y, w, o = 1, speed = 1, delay = 0 }: { x: string; y: string; w: number; o?: number; speed?: number; delay?: number }) {
  const puffs = useMemo(() => Array.from({ length: 7 }, (_, i) => ({ l: (i * 14) % 90, t: 20 + ((i * 37) % 40), s: 0.35 + ((i * 29) % 50) / 100 })), []);
  return (
    <div className="hi-cloud" aria-hidden style={{ position: "absolute", left: x, top: y, width: w, height: w * 0.42, opacity: o, transform: `translateX(calc(var(--hi-p, 0) * ${-260 * speed}px))`, animationDelay: `${delay}s` }}>
      {puffs.map((p, i) => <span key={i} style={{ position: "absolute", left: `${p.l}%`, top: `${p.t}%`, width: w * p.s, height: w * p.s, borderRadius: "50%", background: "radial-gradient(circle at 40% 35%, rgba(255,255,255,.95), rgba(255,236,230,.55) 45%, rgba(255,220,220,0) 70%)", transform: "translate(-20%, -50%)" }} />)}
    </div>
  );
}

function Skyline() {
  const towers = useMemo(() => Array.from({ length: 34 }, (_, i) => ({ w: 26 + ((i * 17) % 40), h: 70 + ((i * 53) % 230), lit: (i * 7) % 3 })), []);
  return (
    <div aria-hidden style={{ position: "absolute", left: 0, right: 0, bottom: "16%", height: 320, display: "flex", alignItems: "flex-end", gap: 3, padding: "0 1vw", opacity: 0.95 }}>
      {towers.map((t, i) => (
        <div key={i} style={{ flex: `0 0 ${t.w}px`, height: t.h, background: "linear-gradient(#0d1020, #070912)", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: "8px 5px 0", backgroundImage: `radial-gradient(circle, ${["#ffcf6a", "#ffe6b0", "#ff9d5c"][t.lit]} 1.3px, transparent 1.8px)`, backgroundSize: `${7 + (i % 3)}px ${9 + (i % 4)}px`, opacity: 0.35 + (i % 4) * 0.12 }} />
        </div>
      ))}
    </div>
  );
}

function Instrument({ label, value, i }: { label: string; value: number; i: number }) {
  const { ref, visible } = useReveal();
  return (
    <div ref={ref} className="hi-float" style={{ animationDelay: `${-i * 0.9}s`, padding: "16px 18px", borderRadius: 18, background: "rgba(255,255,255,.14)", backdropFilter: "blur(14px)", border: "1px solid rgba(255,255,255,.35)", boxShadow: "0 20px 50px rgba(120,60,90,.18)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <span style={{ ...airy, fontSize: 15, letterSpacing: ".14em", textTransform: "uppercase", color: "#3a2340" }}>{label}</span>
        <span style={{ ...mono, fontSize: 13, color: "#3a2340" }}>FL{String(Math.round(value * 4.1)).padStart(3, "0")}</span>
      </div>
      <div style={{ position: "relative", height: 34, marginTop: 10, borderRadius: 10, overflow: "hidden", background: "rgba(58,35,64,.12)" }}>
        <div style={{ position: "absolute", inset: 0, width: visible ? `${value}%` : "0%", background: "linear-gradient(90deg, rgba(243,154,134,.25), rgba(243,154,134,.9))", transition: `width 2s cubic-bezier(.16,1,.3,1) ${i * 120}ms` }} />
        <div style={{ position: "absolute", inset: 0, backgroundImage: "repeating-linear-gradient(90deg, transparent 0 9%, rgba(58,35,64,.25) 9% calc(9% + 1px))" }} />
        <span style={{ ...mono, position: "absolute", right: 10, top: 8, fontSize: 14, color: "#3a2340" }}>{value}%</span>
      </div>
    </div>
  );
}

function Drift({ text, i }: { text: string; i: number }) {
  const { ref, visible } = useReveal();
  return (
    <p ref={ref} style={{ ...airy, fontSize: "clamp(1.6rem, 3.8vw, 3rem)", lineHeight: 1.15, color: C.ink, textAlign: i % 2 ? "right" : "left", margin: "0 0 7vh", opacity: visible ? 0.92 : 0, filter: visible ? "blur(0)" : "blur(12px)", transform: visible ? "none" : "translateY(30px)", transition: "all 2.2s cubic-bezier(.16,1,.3,1)", textShadow: "0 0 30px rgba(255,200,220,.35)" }}>{text}</p>
  );
}

export default function HighestWorld({ perfume }: WorldProps) {
  const [, navigate] = useLocation();
  const { lang, setLang, t } = useLang();
  const [open, setOpen] = useState(false);
  const [narrow, setNarrow] = useState(() => window.innerWidth < 820);
  const [climbed, setClimbed] = useState(false);
  const { alt, progress } = useAltitude();
  useStartAtBottom();
  const spin = useRef(0);
  useEffect(() => { if (alt > 300) setClimbed(true); }, [alt]);
  useEffect(() => {
    const on = () => setNarrow(window.innerWidth < 820);
    window.addEventListener("resize", on);
    let raf = 0;
    const loop = () => { spin.current = progress.current * Math.PI * 3; raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    return () => { window.removeEventListener("resize", on); cancelAnimationFrame(raf); };
  }, [progress]);

  const fragments = pick(lang, perfume.memoryFragments).map(fragmentText);
  const n = perfume.scentNotes;
  const base = n.base ? pick(lang, n.base) : [];
  const heart = n.heart ? pick(lang, n.heart) : [];
  const top = n.top ? pick(lang, n.top) : [];
  const reduced = prefersReducedMotion();

  const skin: DialogSkin = {
    overlay: "rgba(255,214,190,.45)",
    panel: { ...airy, background: "rgba(255,255,255,.55)", backdropFilter: "blur(24px)", border: "1px solid rgba(255,255,255,.7)", borderRadius: 28, padding: "34px 30px", color: "#3a2340", boxShadow: "0 40px 100px rgba(150,70,100,.3)" },
    title: { ...airy, fontSize: 34, letterSpacing: ".02em" },
    label: { ...mono, fontSize: 10, letterSpacing: ".2em", textTransform: "uppercase", color: "rgba(58,35,64,.6)" },
    input: { ...airy, fontSize: 17, background: "rgba(255,255,255,.6)", border: "1px solid rgba(58,35,64,.15)", borderRadius: 14, padding: "11px 14px", color: "#3a2340" },
    button: { ...airy, fontSize: 16, letterSpacing: ".2em", textTransform: "uppercase", background: "linear-gradient(90deg, #f39a86, #ffcf8a)", color: "#3a2340", padding: "14px", borderRadius: 999 },
    accent: "#e0607a",
    heading: { ru: "Пропуск на крышу мира", en: "A pass to the top of the world" },
    submit: { ru: "Остаться наверху", en: "Stay up here" },
    sent: { ru: "Вы наверху. Мы спустимся за вами.", en: "You're up here. We'll come down for you." },
  };

  const section = (h: string, extra?: CSSProperties): CSSProperties => ({ position: "relative", minHeight: h, padding: "12vh clamp(16px,6vw,90px)", ...extra });
  const textCol: CSSProperties = { maxWidth: narrow ? "100%" : "56%" };
  const hud = alt > 7200 ? "#3a2340" : "#fff6ec"; // dark ink once the sky turns light

  return (
    <div style={{ ...airy, color: C.ink, overflowX: "hidden", background: "linear-gradient(to top, #04050d 0%, #0a0d22 14%, #191846 30%, #3b2668 45%, #7c3f7e 58%, #c9607f 70%, #f39a86 80%, #ffc79a 90%, #fff0d8 100%)" }}>
      <style>{`
        .hi-cloud { animation: hi-bob 9s ease-in-out infinite alternate; }
        .hi-float { animation: hi-bob 7s ease-in-out infinite alternate; }
        @keyframes hi-bob { from { translate: 0 -8px; } to { translate: 0 10px; } }
        .hi-light { animation: hi-glow 3.4s ease-in-out infinite alternate; }
        @keyframes hi-glow { to { opacity: .55; } }
        .hi-hint { animation: hi-up 1.6s ease-in-out infinite; }
        @keyframes hi-up { 50% { transform: translateY(-8px); } }
        .hi-sun { animation: hi-pulse 6s ease-in-out infinite alternate; }
        @keyframes hi-pulse { to { transform: translateX(-50%) scale(1.05); } }
        @media (prefers-reduced-motion: reduce) { .hi-cloud, .hi-float, .hi-light, .hi-hint, .hi-sun { animation: none; } }
      `}</style>

      {/* fixed chrome */}
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 50, display: "flex", justifyContent: "space-between", padding: "18px clamp(16px,3vw,36px)", ...mono, fontSize: 12, letterSpacing: ".18em", color: hud, transition: "color .6s" }}>
        <button onClick={() => navigate("/map")}>← {t("КАРТА", "MAP")}</button>
        <span>HIGHEST IN THE ROOM</span>
        <span>{(["ru", "en"] as const).map((l) => <button key={l} onClick={() => setLang(l)} style={{ marginLeft: 10, opacity: lang === l ? 1 : 0.5 }}>{l.toUpperCase()}</button>)}</span>
      </nav>
      <div aria-live="polite" style={{ position: "fixed", left: "clamp(12px,2.4vw,32px)", bottom: "clamp(16px,4vh,36px)", zIndex: 40, display: "flex", alignItems: "flex-end", gap: 12, ...mono, color: hud, transition: "color .6s" }}>
        <div style={{ position: "relative", width: 2, height: 120 }}>
          <div style={{ position: "absolute", inset: 0, background: "currentColor", opacity: 0.25 }} />
          <div style={{ position: "absolute", left: 0, bottom: 0, width: 2, height: `${(alt / MAX_ALT) * 100}%`, background: "currentColor" }} />
        </div>
        <div>
          <p style={{ fontSize: 10, letterSpacing: ".25em", opacity: 0.7 }}>{t("ВЫСОТА", "ALTITUDE")}</p>
          <p style={{ fontSize: 22 }}>{alt.toLocaleString("ru-RU")} {t("м", "m")}</p>
        </div>
      </div>
      {!climbed && (
        <div className="hi-hint" style={{ position: "fixed", left: "50%", bottom: 24, marginLeft: -120, width: 240, zIndex: 40, textAlign: "center", ...mono, fontSize: 12, letterSpacing: ".2em", color: C.ink, padding: "10px 16px", borderRadius: 999, border: `1px solid ${C.faint}`, background: "rgba(4,5,13,.55)", backdropFilter: "blur(8px)" }}>↑ {t("ЛИСТАЙТЕ ВВЕРХ", "SCROLL UP")}</div>
      )}

      {/* the bottle rises with you */}
      {!narrow && (
        <div style={{ position: "fixed", right: "2vw", top: "50%", transform: "translateY(-50%)", width: "min(38vw, 520px)", height: "78vh", zIndex: 20 }}>
          <Bottle3D style={{ position: "absolute", inset: 0 }} rotationRef={spin} lighting="gold" liquid="#a8661c" liquidOpacity={0.82} glass="#fff4dc" cap="#151210" capRoughness={0.4} collar="#ffd59a" spin={0.1}
            drawLabel={(ctx, w, h) => {
              const g = ctx.createLinearGradient(0, h, 0, 0); g.addColorStop(0, "#191846"); g.addColorStop(0.6, "#c9607f"); g.addColorStop(1, "#ffd59a");
              ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
              ctx.fillStyle = "#fff6ec"; ctx.textAlign = "center";
              ctx.font = "92px 'Tenor Sans', sans-serif"; ctx.fillText("HIGHEST", w / 2, h * 0.45);
              ctx.font = "50px 'Tenor Sans', sans-serif"; ctx.fillText("IN THE ROOM", w / 2, h * 0.64);
              ctx.font = "26px 'JetBrains Mono', monospace"; ctx.fillText("12 000 M · LOS ANGELES", w / 2, h * 0.85);
            }} />
        </div>
      )}

      {/* column-reverse: the first section in the DOM is the street, drawn at the very bottom */}
      <main style={{ display: "flex", flexDirection: "column-reverse" }}>
        {/* 0 m — the street */}
        <section style={section("100vh", { display: "flex", alignItems: "center" })}>
          <Skyline />
          <div aria-hidden style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: "16%", background: "linear-gradient(#0b0d1c, #04050d)", boxShadow: "0 -1px 0 rgba(255,200,120,.25)" }}>
            {[12, 34, 58, 81].map((x) => <span key={x} className="hi-light" style={{ position: "absolute", left: `${x}%`, top: -110, width: 3, height: 110, background: "linear-gradient(transparent, #2a2a3a)" }}><span style={{ position: "absolute", top: -6, left: -9, width: 20, height: 20, borderRadius: "50%", background: "#ffcf6a", boxShadow: "0 0 50px 20px rgba(255,190,90,.45)" }} /></span>)}
            <div style={{ position: "absolute", inset: 0, background: "repeating-linear-gradient(90deg, transparent 0 18%, rgba(255,207,106,.08) 18% 20%)", filter: "blur(6px)" }} />
          </div>
          <div style={{ ...textCol, position: "relative", zIndex: 2, marginTop: "-12vh" }}>
            <p style={{ ...mono, fontSize: 12, letterSpacing: ".3em", color: C.dim }}>{t("0 м · СЕНСЕТ-БУЛЬВАР · 02:14", "0 m · SUNSET BOULEVARD · 02:14")}</p>
            <h1 style={{ ...airy, fontSize: "clamp(3.2rem, 8.5vw, 8rem)", lineHeight: 0.95, letterSpacing: "-0.01em", margin: "16px 0 22px", textShadow: "0 0 60px rgba(255,190,90,.25)" }}>Highest<br />in the room</h1>
            <p style={{ fontSize: "clamp(1.1rem, 1.6vw, 1.35rem)", lineHeight: 1.6, color: C.dim, maxWidth: 520 }}>{pick(lang, perfume.description)}</p>
            <p style={{ ...mono, fontSize: 12, letterSpacing: ".2em", color: C.gold, marginTop: 26 }}>↑ {t("Поднимайтесь. Наверху тише.", "Go up. It's quieter up there.")}</p>
          </div>
          {narrow && (
            <div style={{ position: "absolute", right: 0, top: "6vh", width: "56vw", height: "52vh", zIndex: 1 }}>
              <Bottle3D style={{ position: "absolute", inset: 0 }} lighting="gold" liquid="#a8661c" liquidOpacity={0.82} glass="#fff4dc" cap="#151210" collar="#ffd59a" spin={0.2}
                drawLabel={(ctx, w, h) => { ctx.fillStyle = "#191846"; ctx.fillRect(0, 0, w, h); ctx.fillStyle = "#ffd59a"; ctx.textAlign = "center"; ctx.font = "92px 'Tenor Sans', sans-serif"; ctx.fillText("HIGHEST", w / 2, h * 0.55); }} />
            </div>
          )}
        </section>

        {/* 300 m — city lights: base notes */}
        <section style={section("110vh")}>
          <div style={textCol}>
            <Alt m="300" label={t("Огни города · база", "City lights · base")} />
            <div style={{ position: "relative", height: "62vh", marginTop: 20 }}>
              {base.map((note, i) => {
                const x = (i * 37) % 86, y = 8 + ((i * 53) % 78);
                return (
                  <div key={note} className="hi-float" style={{ position: "absolute", left: `${x}%`, top: `${y}%`, display: "flex", alignItems: "center", gap: 10, animationDelay: `${-i * 1.3}s` }}>
                    <span className="hi-light" style={{ width: 14 + (i % 3) * 8, height: 14 + (i % 3) * 8, borderRadius: "50%", background: ["#ffcf6a", "#ff9d5c", "#ffe6b0"][i % 3], boxShadow: `0 0 ${30 + i * 4}px ${10 + i}px ${["rgba(255,207,106,.45)", "rgba(255,157,92,.45)", "rgba(255,230,176,.4)"][i % 3]}`, animationDelay: `${i * 0.4}s` }} />
                    <span style={{ fontSize: "clamp(1.1rem, 1.8vw, 1.5rem)", letterSpacing: ".06em" }}>{note}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 1 500 m — smog: heart notes + memories */}
        <section style={section("150vh")}>
          <div aria-hidden style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 30% 60%, rgba(160,120,190,.35), transparent 60%), radial-gradient(ellipse at 80% 30%, rgba(200,110,150,.25), transparent 55%)", filter: "blur(30px)" }} />
          <div style={{ ...textCol, position: "relative" }}>
            <Alt m="1 500" label={t("Смог · сердце", "Smog · heart")} />
            <p style={{ fontSize: "clamp(1.4rem, 2.6vw, 2.2rem)", lineHeight: 1.5, margin: "26px 0 12vh", color: C.ink, filter: "blur(.3px)", letterSpacing: ".04em" }}>
              {heart.map((h, i) => <span key={h} style={{ opacity: 0.55 + (i % 3) * 0.2 }}>{h}{i < heart.length - 1 ? " · " : ""}</span>)}
            </p>
            {fragments.map((f, i) => <Drift key={i} text={f} i={i} />)}
          </div>
        </section>

        {/* 4 000 m — the clouds: profile as instruments */}
        <section style={section("130vh")}>
          {!reduced && <>
            <Cloud x="-8%" y="4%" w={520} o={0.9} speed={1.2} />
            <Cloud x="46%" y="20%" w={420} o={0.75} speed={0.7} delay={-3} />
            <Cloud x="10%" y="62%" w={600} o={0.85} speed={1.5} delay={-6} />
            <Cloud x="60%" y="74%" w={380} o={0.7} speed={0.9} delay={-2} />
          </>}
          <div style={{ ...textCol, position: "relative", zIndex: 2 }}>
            <Alt m="4 000" label={t("Облака · приборы", "Clouds · instruments")} dark />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16, marginTop: 26 }}>
              {perfume.radarAxes.map((a, i) => <Instrument key={a.key} label={pick(lang, a.label)} value={a.value} i={i} />)}
            </div>
          </div>
        </section>

        {/* 12 000 m — above the clouds: top notes + request */}
        <section style={section("120vh", { display: "flex", flexDirection: "column", justifyContent: "center" })}>
          <div className="hi-sun" aria-hidden style={{ position: "absolute", left: "50%", bottom: "18%", width: "min(70vw, 720px)", aspectRatio: "1", transform: "translateX(-50%)", borderRadius: "50%", background: "radial-gradient(circle, #fff7e6 0%, #ffe0a8 30%, rgba(255,190,140,.4) 55%, transparent 70%)" }} />
          {/* sea of clouds */}
          <div aria-hidden style={{ position: "absolute", left: "-10%", right: "-10%", bottom: "-6%", height: "34%", background: "radial-gradient(ellipse at 20% 40%, #fff 0, rgba(255,255,255,0) 40%), radial-gradient(ellipse at 55% 30%, #fff5ef 0, rgba(255,255,255,0) 38%), radial-gradient(ellipse at 85% 45%, #fff 0, rgba(255,255,255,0) 40%), linear-gradient(transparent, #ffe9e0 60%)", filter: "blur(8px)" }} />
          <div style={{ ...textCol, position: "relative", zIndex: 2, color: "#3a2340" }}>
            <Alt m="12 000" label={t("Над облаками · верх", "Above the clouds · top")} dark />
            <h2 style={{ ...airy, fontSize: "clamp(2.6rem, 6.5vw, 6rem)", lineHeight: 1, margin: "18px 0 18px" }}>{pick(lang, perfume.tagline)}</h2>
            <p style={{ fontSize: "clamp(1.2rem, 2vw, 1.7rem)", letterSpacing: ".1em" }}>{top.join("  ·  ")}</p>
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 20, marginTop: 40 }}>
              <button onClick={() => setOpen(true)} style={{ ...airy, fontSize: 16, letterSpacing: ".24em", textTransform: "uppercase", padding: "18px 34px", borderRadius: 999, color: "#3a2340", background: "rgba(255,255,255,.5)", backdropFilter: "blur(14px)", border: "1px solid rgba(255,255,255,.9)", boxShadow: "0 20px 60px rgba(243,154,134,.45)" }}>{t("Остаться наверху", "Stay up here")} ↗</button>
              <span style={{ ...mono, fontSize: 12, color: "rgba(58,35,64,.7)" }}>Extrait de parfum · {perfume.releaseDate} · {pick(lang, perfume.origin.location)}</span>
            </div>
          </div>
        </section>
      </main>
      <RequestDialog open={open} onClose={() => setOpen(false)} perfumeName={perfume.name} skin={skin} />
    </div>
  );
}

function Alt({ m, label, dark }: { m: string; label: string; dark?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 16, color: dark ? "#3a2340" : C.ink }}>
      <span style={{ ...mono, fontSize: 13 }}>{m} m</span>
      <span style={{ flex: "0 0 50px", height: 1, background: "currentColor", opacity: 0.5, alignSelf: "center" }} />
      <span style={{ ...airy, fontSize: 14, letterSpacing: ".3em", textTransform: "uppercase", opacity: 0.85 }}>{label}</span>
    </div>
  );
}
