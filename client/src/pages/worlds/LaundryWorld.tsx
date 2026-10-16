// Laundry Routine — an appliance manual.
// White Swiss grid, the bottle spins inside a washing-machine porthole as you scroll,
// notes sit on a program dial, the profile is an LED readout, memories are care-label symbols.

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useLocation } from "wouter";
import { useLang } from "@/contexts/LangContext";
import Bottle3D from "@/components/Bottle3D";
import RequestDialog, { type DialogSkin } from "@/components/RequestDialog";
import { useReveal, useScrollProgress } from "@/lib/useReveal";
import { fragmentText, notesFlat, pick, prefersReducedMotion, type WorldProps } from "./shared";

const C = { bg: "#eeede9", paper: "#f8f7f4", ink: "#1b1b19", gray: "#8a8984", line: "#d3d2cc", orange: "#ff5a14", led: "#9fe0ff", panel: "#1e2124" };
const sans: CSSProperties = { fontFamily: "'Golos Text', 'Helvetica Neue', Arial, sans-serif" };
const mono: CSSProperties = { fontFamily: "'JetBrains Mono', 'DM Mono', monospace" };

function Num({ n, label }: { n: string; label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 14, borderTop: `2px solid ${C.ink}`, paddingTop: 10, marginBottom: 28 }}>
      <span style={{ ...mono, fontSize: 13, color: C.orange }}>{n}</span>
      <h2 style={{ ...sans, fontSize: "clamp(1.6rem, 3.4vw, 2.6rem)", fontWeight: 700, letterSpacing: "-0.03em" }}>{label}</h2>
    </div>
  );
}

// ── Porthole: perforated drum rotates with scroll, bottle tumbles inside ──
function Porthole() {
  const { ref, progress } = useScrollProgress();
  const drumRef = useRef<HTMLDivElement>(null);
  const spinRef = useRef(0);
  useEffect(() => {
    let raf = 0;
    const loop = () => {
      const p = progress.current;
      spinRef.current = p * Math.PI * 6;
      if (drumRef.current) drumRef.current.style.transform = `rotate(${p * 720}deg)`;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [progress]);
  return (
    <div ref={ref} style={{ position: "relative", width: "min(560px, 88vw)", aspectRatio: "1", margin: "0 auto" }}>
      {/* outer metal ring */}
      <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "conic-gradient(from 210deg, #fafafa, #b9b9b4, #f2f2ee, #9d9d97, #fafafa, #c4c4be, #fafafa)", boxShadow: "0 30px 60px rgba(0,0,0,.18), inset 0 2px 3px #fff" }} />
      <div style={{ position: "absolute", inset: "7%", borderRadius: "50%", background: "#cfcfca", boxShadow: "inset 0 6px 14px rgba(0,0,0,.35)" }} />
      {/* glass */}
      <div style={{ position: "absolute", inset: "11%", borderRadius: "50%", overflow: "hidden", background: "radial-gradient(circle at 50% 45%, #3b4a55, #161c21 75%)", boxShadow: "inset 0 0 40px rgba(0,0,0,.6)" }}>
        <div ref={drumRef} style={{ position: "absolute", inset: "-6%", borderRadius: "50%", backgroundImage: "radial-gradient(circle, rgba(255,255,255,.13) 2.2px, transparent 2.8px)", backgroundSize: "22px 22px", willChange: "transform" }}>
          {[0, 120, 240].map((a) => <div key={a} style={{ position: "absolute", left: "50%", top: 0, width: 26, height: "16%", marginLeft: -13, background: "linear-gradient(#8d969c,#5b6369)", borderRadius: "0 0 10px 10px", transformOrigin: "50% 340%", transform: `rotate(${a}deg)` }} />)}
        </div>
        {/* water line */}
        <svg viewBox="0 0 200 60" preserveAspectRatio="none" style={{ position: "absolute", left: 0, right: 0, bottom: 0, width: "100%", height: "30%" }}>
          <path className="lr-wave" d="M0 20 Q 25 10 50 20 T 100 20 T 150 20 T 200 20 T 250 20 T 300 20 V60 H0 Z" fill="rgba(159,224,255,.22)" />
          <path className="lr-wave lr-wave2" d="M0 26 Q 25 16 50 26 T 100 26 T 150 26 T 200 26 T 250 26 T 300 26 V60 H0 Z" fill="rgba(159,224,255,.14)" />
        </svg>
        <Bottle3D
          style={{ position: "absolute", inset: "8%" }} rotationRef={spinRef}
          lighting="studio" liquid="#bcd9ea" liquidOpacity={0.75} glass="#f2fbff" cap="#f3f2ee" capRoughness={0.5} collar="#c8ccd0" spin={0.12} zoom={0.92}
          drawLabel={(ctx, w, h) => {
            ctx.fillStyle = "#f8f7f4"; ctx.fillRect(0, 0, w, h);
            ctx.fillStyle = "#ff5a14"; ctx.fillRect(0, 0, w, 26);
            ctx.fillStyle = "#1b1b19"; ctx.textAlign = "left";
            ctx.font = "700 92px 'Golos Text', sans-serif"; ctx.fillText("Laundry", 60, h * 0.42);
            ctx.fillText("Routine", 60, h * 0.6);
            ctx.font = "34px 'JetBrains Mono', monospace"; ctx.fillStyle = "#8a8984";
            ctx.fillText("LR-04 · 30° · EXTRAIT", 60, h * 0.84);
            ctx.strokeStyle = "#1b1b19"; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(w - 140, h * 0.45, 70, 0, Math.PI * 2); ctx.stroke();
            ctx.font = "700 54px 'Golos Text', sans-serif"; ctx.textAlign = "center"; ctx.fillStyle = "#1b1b19"; ctx.fillText("30", w - 140, h * 0.45 + 19);
          }}
        />
        <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "linear-gradient(135deg, rgba(255,255,255,.22), transparent 40%)", pointerEvents: "none" }} />
      </div>
      {/* hinge + handle */}
      <div style={{ position: "absolute", left: "-3%", top: "38%", width: "7%", height: "24%", borderRadius: 8, background: "linear-gradient(90deg,#aaa,#eee,#bbb)" }} />
    </div>
  );
}

// ── Program dial for notes ──
function ProgramDial({ notes, t }: { notes: string[]; t: (ru: string, en: string) => string }) {
  const [sel, setSel] = useState(0);
  const [held, setHeld] = useState(false);
  useEffect(() => {
    if (held || prefersReducedMotion()) return;
    const id = setInterval(() => setSel((s) => (s + 1) % notes.length), 2200);
    return () => clearInterval(id);
  }, [held, notes.length]);
  const R = 150, span = 270, start = -135;
  const angleOf = (i: number) => start + (span / Math.max(1, notes.length - 1)) * i;
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 40, alignItems: "center" }}>
      <svg viewBox="-340 -230 680 440" style={{ width: "100%", maxWidth: 560 }} onMouseLeave={() => setHeld(false)}>
        {notes.map((n, i) => {
          const a = (angleOf(i) - 90) * (Math.PI / 180);
          const tx = Math.cos(a) * (R + 26), ty = Math.sin(a) * (R + 26);
          const lx = Math.cos(a) * (R + 40), ly = Math.sin(a) * (R + 40);
          const anchor = Math.abs(Math.cos(a)) < 0.25 ? "middle" : Math.cos(a) > 0 ? "start" : "end";
          return (
            <g key={n} onMouseEnter={() => { setHeld(true); setSel(i); }} onClick={() => { setHeld(true); setSel(i); }} style={{ cursor: "pointer" }}>
              <line x1={Math.cos(a) * (R + 6)} y1={Math.sin(a) * (R + 6)} x2={tx} y2={ty} stroke={i === sel ? C.orange : C.ink} strokeWidth={i === sel ? 3 : 1.5} />
              <text x={lx} y={ly + 5} textAnchor={anchor} style={{ ...sans, fontSize: 15, fontWeight: i === sel ? 700 : 400 }} fill={i === sel ? C.orange : C.ink}>{n}</text>
            </g>
          );
        })}
        <circle r={R} fill="url(#lr-knob)" stroke={C.line} />
        <defs>
          <radialGradient id="lr-knob" cx="40%" cy="35%"><stop offset="0" stopColor="#ffffff" /><stop offset="1" stopColor="#d6d5d0" /></radialGradient>
        </defs>
        <circle r={R - 18} fill="none" stroke={C.line} />
        <g style={{ transform: `rotate(${angleOf(sel)}deg)`, transition: "transform .7s cubic-bezier(.3,1.5,.5,1)" }}>
          <rect x={-14} y={-R + 8} width={28} height={R * 0.9} rx={14} fill="#fbfbf9" stroke={C.line} />
          <circle cy={-R + 26} r={6} fill={C.orange} />
        </g>
      </svg>
      <div>
        <div style={{ background: C.panel, borderRadius: 14, padding: "26px 28px", boxShadow: "inset 0 2px 10px rgba(0,0,0,.6)" }}>
          <p style={{ ...mono, fontSize: 12, color: "rgba(159,224,255,.5)" }}>{t("ПРОГРАММА", "PROGRAM")} {String(sel + 1).padStart(2, "0")}/{String(notes.length).padStart(2, "0")}</p>
          <p key={sel} style={{ ...mono, fontSize: "clamp(1.6rem, 3.6vw, 2.6rem)", color: C.led, textShadow: `0 0 12px ${C.led}88`, marginTop: 8, minHeight: "1.3em", animation: "lr-in .4s ease" }}>{notes[sel].toUpperCase()}</p>
          <div style={{ display: "flex", gap: 6, marginTop: 18 }}>
            {notes.map((_, i) => <span key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i === sel ? C.led : "rgba(159,224,255,.18)" }} />)}
          </div>
        </div>
        <p style={{ ...sans, fontSize: 14, color: C.gray, marginTop: 16, lineHeight: 1.6 }}>{t("Поверните переключатель, чтобы выбрать ноту. Все ноты звучат одновременно — как один цикл.", "Turn the selector to pick a note. All notes play at once — as one cycle.")}</p>
      </div>
    </div>
  );
}

// ── LED segment readout ──
function Readout({ label, value, delay }: { label: string; value: number; delay: number }) {
  const { ref, visible } = useReveal();
  const cells = 20, lit = Math.round((value / 100) * cells);
  return (
    <div ref={ref} style={{ display: "grid", gridTemplateColumns: "minmax(110px, 180px) 1fr 56px", gap: 16, alignItems: "center", padding: "12px 0", borderBottom: `1px solid ${C.line}` }}>
      <span style={{ ...sans, fontSize: 15, fontWeight: 500 }}>{label}</span>
      <div style={{ display: "flex", gap: 3 }}>
        {Array.from({ length: cells }).map((_, i) => (
          <span key={i} style={{ flex: 1, height: 18, borderRadius: 2, background: visible && i < lit ? (i >= cells - 3 ? C.orange : C.ink) : "#dcdbd5", transition: `background .2s ease ${delay + i * 40}ms` }} />
        ))}
      </div>
      <span style={{ ...mono, fontSize: 15, textAlign: "right" }}>{value}%</span>
    </div>
  );
}

// ── Care-label symbols ──
const CARE: ((s: string) => React.ReactElement)[] = [
  (s) => <svg viewBox="0 0 60 50" width="56" height="48"><path d="M6 12 L12 44 H48 L54 12" fill="none" stroke={s} strokeWidth="3" /><path d="M4 12 q 6 -6 13 0 t 13 0 t 13 0 t 13 0" fill="none" stroke={s} strokeWidth="3" /><text x="30" y="37" textAnchor="middle" fontSize="15" fontWeight="700" fill={s}>30</text></svg>,
  (s) => <svg viewBox="0 0 60 50" width="56" height="48"><path d="M30 6 L56 46 H4 Z" fill="none" stroke={s} strokeWidth="3" /><path d="M10 8 L50 46 M50 8 L10 46" stroke={s} strokeWidth="3" /></svg>,
  (s) => <svg viewBox="0 0 60 50" width="56" height="48"><rect x="8" y="4" width="44" height="42" fill="none" stroke={s} strokeWidth="3" /><circle cx="30" cy="25" r="14" fill="none" stroke={s} strokeWidth="3" /><circle cx="30" cy="25" r="2.5" fill={s} /></svg>,
  (s) => <svg viewBox="0 0 60 50" width="56" height="48"><path d="M8 40 H54 L50 22 Q 48 14 38 14 H20 Q 14 14 12 22 Z" fill="none" stroke={s} strokeWidth="3" /><circle cx="32" cy="30" r="2.5" fill={s} /></svg>,
  (s) => <svg viewBox="0 0 60 50" width="56" height="48"><circle cx="30" cy="25" r="20" fill="none" stroke={s} strokeWidth="3" /><text x="30" y="32" textAnchor="middle" fontSize="20" fontWeight="700" fill={s}>P</text></svg>,
];

export default function LaundryWorld({ perfume }: WorldProps) {
  const [, navigate] = useLocation();
  const { lang, setLang, t } = useLang();
  const [open, setOpen] = useState(false);
  const [cycle, setCycle] = useState<number | null>(null);
  const notes = notesFlat(perfume, lang);
  const fragments = pick(lang, perfume.memoryFragments).map(fragmentText);

  const start = () => {
    if (cycle !== null) return;
    if (prefersReducedMotion()) { setOpen(true); return; }
    const t0 = performance.now();
    const tick = () => {
      const p = Math.min(1, (performance.now() - t0) / 1800);
      setCycle(p);
      if (p < 1) requestAnimationFrame(tick);
      else { setOpen(true); setCycle(null); }
    };
    requestAnimationFrame(tick);
  };

  const skin: DialogSkin = {
    overlay: "rgba(238,237,233,.86)",
    panel: { ...sans, background: C.paper, border: `2px solid ${C.ink}`, borderRadius: 4, padding: "28px 26px", color: C.ink, boxShadow: "12px 12px 0 rgba(0,0,0,.08)" },
    title: { ...sans, fontSize: 30, fontWeight: 700, letterSpacing: "-0.03em" },
    label: { ...mono, fontSize: 11, color: C.gray, textTransform: "uppercase", letterSpacing: "0.08em" },
    input: { ...sans, fontSize: 15, border: `1px solid ${C.line}`, background: "#fff", padding: "10px 12px", borderRadius: 3 },
    button: { ...sans, fontWeight: 700, fontSize: 16, background: C.orange, color: "#fff", padding: "14px", borderRadius: 999 },
    accent: C.orange,
    heading: { ru: "Заявка · форма 04", en: "Request · form 04" },
    submit: { ru: "Отправить", en: "Submit" },
    sent: { ru: "Принято. Цикл завершён.", en: "Received. Cycle complete." },
  };

  return (
    <div style={{ ...sans, background: C.bg, color: C.ink, minHeight: "100vh", overflowX: "hidden" }}>
      <style>{`
        .lr-wave { animation: lr-wave 6s linear infinite; }
        .lr-wave2 { animation-duration: 9s; animation-direction: reverse; }
        @keyframes lr-wave { to { transform: translateX(-100px); } }
        @keyframes lr-in { from { opacity: 0; transform: translateY(6px); } }
        .lr-start { transition: transform .12s ease, box-shadow .12s ease; }
        .lr-start:active { transform: translateY(3px); box-shadow: 0 2px 0 #b33a06, 0 8px 20px rgba(255,90,20,.3) !important; }
        @media (prefers-reduced-motion: reduce) { .lr-wave { animation: none; } }
      `}</style>

      {/* control panel nav */}
      <nav style={{ position: "sticky", top: 0, zIndex: 20, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, padding: "12px clamp(16px,3vw,32px)", background: "rgba(238,237,233,.88)", backdropFilter: "blur(10px)", borderBottom: `1px solid ${C.line}` }}>
        <button onClick={() => navigate("/map")} style={{ ...mono, fontSize: 12 }}>← {t("К карте", "Map")}</button>
        <span style={{ ...mono, fontSize: 12, color: C.gray, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#3ccf5a", boxShadow: "0 0 8px #3ccf5a" }} />
          SILENTIUM LR-04 · {t("ГОТОВ", "READY")}
        </span>
        <span style={{ display: "flex", gap: 4 }}>
          {(["ru", "en"] as const).map((l) => (
            <button key={l} onClick={() => setLang(l)} style={{ ...mono, fontSize: 11, padding: "5px 9px", borderRadius: 4, border: `1px solid ${C.line}`, background: lang === l ? C.ink : "#fff", color: lang === l ? "#fff" : C.ink, boxShadow: lang === l ? "inset 0 2px 3px rgba(0,0,0,.4)" : "0 2px 0 #c9c8c2" }}>{l.toUpperCase()}</button>
          ))}
        </span>
      </nav>

      {/* hero */}
      <header style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 40, alignItems: "center", padding: "56px clamp(16px,5vw,72px) 80px", maxWidth: 1400, margin: "0 auto" }}>
        <div>
          <p style={{ ...mono, fontSize: 12, color: C.gray }}>{t("Руководство по эксплуатации · Модель", "Owner's manual · Model")} LR-04</p>
          <h1 style={{ fontSize: "clamp(3.4rem, 9vw, 8rem)", fontWeight: 800, letterSpacing: "-0.055em", lineHeight: 0.88, margin: "18px 0 22px" }}>Laundry<br />Routine<span style={{ color: C.orange }}>.</span></h1>
          <p style={{ fontSize: "clamp(1.1rem, 1.8vw, 1.4rem)", lineHeight: 1.45, maxWidth: 460 }}>{pick(lang, perfume.description)}</p>
          <dl style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "8px 24px", marginTop: 32, ...mono, fontSize: 13, borderTop: `1px solid ${C.ink}`, paddingTop: 16, maxWidth: 460 }}>
            <dt style={{ color: C.gray }}>{t("Программа", "Program")}</dt><dd>{t("Деликатная · 30°", "Delicate · 30°")}</dd>
            <dt style={{ color: C.gray }}>{t("Концентрация", "Concentration")}</dt><dd>Extrait de parfum</dd>
            <dt style={{ color: C.gray }}>{t("Выпуск", "Released")}</dt><dd>{perfume.releaseDate}</dd>
            <dt style={{ color: C.gray }}>{t("Сборка", "Assembled")}</dt><dd>{pick(lang, perfume.origin.location)}</dd>
          </dl>
        </div>
        <div>
          <Porthole />
          <p style={{ ...mono, fontSize: 11, color: C.gray, textAlign: "center", marginTop: 16 }}>{t("Рис. 1 — Барабан. Прокрутите страницу, чтобы запустить вращение.", "Fig. 1 — Drum. Scroll to spin.")}</p>
        </div>
      </header>

      <main style={{ maxWidth: 1240, margin: "0 auto", padding: "0 clamp(16px,5vw,72px) 80px" }}>
        <section style={{ marginBottom: 110 }}>
          <Num n="01" label={t("Состав", "Composition")} />
          <ProgramDial notes={notes} t={t} />
        </section>

        <section style={{ marginBottom: 110 }}>
          <Num n="02" label={t("Технические показатели", "Specifications")} />
          {perfume.radarAxes.map((a, i) => <Readout key={a.key} label={pick(lang, a.label)} value={a.value} delay={i * 120} />)}
        </section>

        <section style={{ marginBottom: 110 }}>
          <Num n="03" label={t("Символы ухода", "Care symbols")} />
          <div style={{ background: "#fff", borderRadius: 6, padding: "28px clamp(18px,3vw,40px)", position: "relative", boxShadow: "0 1px 0 #d8d7d1, 0 20px 40px rgba(0,0,0,.06)", outline: "2px dashed #e1e0da", outlineOffset: -10 }}>
            {fragments.map((f, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "64px 1fr auto", gap: 20, alignItems: "center", padding: "14px 0", borderBottom: i < fragments.length - 1 ? `1px solid ${C.line}` : "none" }}>
                {CARE[i % CARE.length](C.ink)}
                <span style={{ fontSize: "clamp(1rem, 1.7vw, 1.3rem)" }}>{f}</span>
                <span style={{ ...mono, fontSize: 11, color: C.gray }}>{String(i + 1).padStart(2, "0")}</span>
              </div>
            ))}
          </div>
        </section>

        <section style={{ marginBottom: 110 }}>
          <Num n="04" label={t("Условия эксплуатации", "Operating conditions")} />
          <figure style={{ margin: 0 }}>
            <img src={perfume.heroImage} alt="" loading="lazy" style={{ width: "100%", aspectRatio: "16 / 8", objectFit: "cover", display: "block", borderRadius: 4, filter: "saturate(.7) contrast(1.05)" }} />
            <figcaption style={{ ...mono, fontSize: 11, color: C.gray, marginTop: 10, display: "flex", justifyContent: "space-between" }}>
              <span>{t("Рис. 2 — Рекомендуемая среда: утро, открытое окно, чистый хлопок.", "Fig. 2 — Recommended environment: morning, open window, clean cotton.")}</span>
              <span>{perfume.origin.coords}</span>
            </figcaption>
          </figure>
        </section>

        <section>
          <Num n="05" label={t("Пуск", "Start")} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 40, alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
              <button className="lr-start" onClick={start} aria-label={t("Запустить и оформить заявку", "Start and request")} style={{ position: "relative", width: 168, height: 168, borderRadius: "50%", background: `radial-gradient(circle at 40% 30%, #ff8a4d, ${C.orange} 60%, #d8450a)`, boxShadow: "0 6px 0 #b33a06, 0 20px 40px rgba(255,90,20,.35), inset 0 2px 4px rgba(255,255,255,.4)", color: "#fff", fontWeight: 800, fontSize: 24, letterSpacing: "-0.02em", flex: "none" }}>
                {cycle !== null && (
                  <svg viewBox="0 0 100 100" style={{ position: "absolute", inset: -14, width: "calc(100% + 28px)", height: "calc(100% + 28px)", transform: "rotate(-90deg)" }}>
                    <circle cx="50" cy="50" r="48" fill="none" stroke={C.ink} strokeWidth="2" strokeDasharray={`${cycle * 301.6} 301.6`} />
                  </svg>
                )}
                {cycle !== null ? `${Math.round(cycle * 100)}%` : t("ПУСК", "START")}
              </button>
              <div style={{ ...mono, fontSize: 13, lineHeight: 1.9 }}>
                <p>{t("Нажмите", "Press")} <b>{t("ПУСК", "START")}</b>,</p>
                <p style={{ color: C.gray }}>{t("чтобы оформить заявку.", "to place a request.")}</p>
                <p style={{ color: C.gray }}>{t("Длительность цикла: 1,8 с", "Cycle length: 1.8 s")}</p>
              </div>
            </div>
            <p style={{ fontSize: "clamp(1.4rem, 2.6vw, 2.2rem)", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.15 }}>{pick(lang, perfume.tagline)}.<br /><span style={{ color: C.gray, fontWeight: 400 }}>{pick(lang, perfume.keywords)}</span></p>
          </div>
        </section>
      </main>

      <footer style={{ borderTop: `1px solid ${C.line}`, padding: "18px clamp(16px,5vw,72px)", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8, ...mono, fontSize: 11, color: C.gray }}>
        <span>{t("Сохраните это руководство для дальнейшего использования.", "Keep this manual for future reference.")}</span>
        <span>Silentium · LR-04 · {t("стр.", "p.")} 1/1</span>
      </footer>

      <RequestDialog open={open} onClose={() => setOpen(false)} perfumeName={perfume.name} skin={skin} />
    </div>
  );
}
