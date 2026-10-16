// Russian Banya — the steam room.
// The screen fogs over and you wipe it with the cursor; notes are burned into wooden planks;
// the profile is a row of banya gauges; "Поддать пару" floods the page with steam, then opens the request.

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useLocation } from "wouter";
import { useLang } from "@/contexts/LangContext";
import Bottle3D from "@/components/Bottle3D";
import RequestDialog, { type DialogSkin } from "@/components/RequestDialog";
import { useReveal } from "@/lib/useReveal";
import { fragmentText, pick, prefersReducedMotion, type WorldProps } from "./shared";

const C = { wood: "#6b4426", woodD: "#3b2414", woodL: "#a8743f", ink: "#1e120a", cream: "#f3e2c4", ember: "#ff7a2a", dim: "rgba(243,226,196,.6)" };
const display: CSSProperties = { fontFamily: "'Yeseva One', 'Playfair Display', serif" };
const body: CSSProperties = { fontFamily: "'Manrope', sans-serif" };
const mono: CSSProperties = { fontFamily: "'JetBrains Mono', monospace" };

const PLANKS = `repeating-linear-gradient(0deg, rgba(0,0,0,.35) 0 2px, transparent 2px 78px),
  repeating-linear-gradient(90deg, rgba(255,220,170,.05) 0 3px, transparent 3px 11px, rgba(0,0,0,.05) 11px 13px, transparent 13px 29px),
  linear-gradient(180deg, ${C.woodL}, ${C.wood} 40%, #5a361c)`;

// Condensation on glass over the hero: the pointer wipes it clear, it slowly fogs back
function SteamGlass() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current!;
    const ctx = cv.getContext("2d")!;
    const reduced = prefersReducedMotion();
    const SCALE = 0.5;
    const fog = (a: number) => { ctx.fillStyle = `rgba(238,232,224,${a})`; ctx.fillRect(0, 0, cv.width, cv.height); };
    const fit = () => {
      const r = cv.getBoundingClientRect();
      cv.width = Math.max(1, Math.round(r.width * SCALE));
      cv.height = Math.max(1, Math.round(r.height * SCALE));
      fog(0.5);
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(cv);
    let last: [number, number] | null = null;
    const drops: { x: number; y: number; v: number; life: number }[] = [];
    const wipe = (e: PointerEvent) => {
      const r = cv.getBoundingClientRect();
      const x = (e.clientX - r.left) * SCALE, y = (e.clientY - r.top) * SCALE;
      if (x < -40 || y < -40 || x > cv.width + 40 || y > cv.height + 40) { last = null; return; }
      ctx.globalCompositeOperation = "destination-out";
      ctx.lineCap = "round";
      ctx.lineWidth = 42;
      ctx.strokeStyle = "rgba(0,0,0,.92)";
      ctx.beginPath();
      const [lx, ly] = last ?? [x, y];
      ctx.moveTo(lx, ly); ctx.lineTo(x, y); ctx.stroke();
      ctx.globalCompositeOperation = "source-over";
      last = [x, y];
      if (Math.random() < 0.1) drops.push({ x: x + (Math.random() - 0.5) * 36, y: y + 18, v: 0.3 + Math.random() * 0.7, life: 200 });
    };
    window.addEventListener("pointermove", wipe);
    let raf = 0, frame = 0;
    const loop = () => {
      frame++;
      if (!reduced && frame % 4 === 0) fog(0.006);
      ctx.globalCompositeOperation = "destination-out";
      for (let i = drops.length - 1; i >= 0; i--) {
        const d = drops[i];
        d.y += d.v; d.life--;
        ctx.beginPath(); ctx.arc(d.x, d.y, 2, 0, Math.PI * 2); ctx.fill();
        if (d.life <= 0) drops.splice(i, 1);
      }
      ctx.globalCompositeOperation = "source-over";
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); window.removeEventListener("pointermove", wipe); };
  }, []);
  return <canvas ref={ref} aria-hidden style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 5, filter: "blur(5px)" }} />;
}

// Round banya gauge (thermometer / hygrometer)
function Gauge({ label, value, delay, unit }: { label: string; value: number; delay: number; unit: string }) {
  const { ref, visible } = useReveal();
  const a = -135 + (visible ? value : 0) * 2.7;
  return (
    <div ref={ref} style={{ textAlign: "center" }}>
      <div style={{ width: "min(170px, 40vw)", aspectRatio: "1", margin: "0 auto", borderRadius: "50%", padding: 12, background: `radial-gradient(circle at 35% 30%, ${C.woodL}, ${C.woodD})`, boxShadow: "0 14px 30px rgba(0,0,0,.45), inset 0 2px 3px rgba(255,220,170,.3)" }}>
        <svg viewBox="-50 -50 100 100" style={{ width: "100%", height: "100%", borderRadius: "50%", background: "radial-gradient(circle at 40% 35%, #fbf1dc, #e3cfa7)", boxShadow: "inset 0 3px 8px rgba(0,0,0,.4)" }}>
          {Array.from({ length: 28 }).map((_, i) => {
            const ang = ((-135 + i * 10) * Math.PI) / 180;
            const long = i % 3 === 0;
            return <line key={i} x1={Math.sin(ang) * 40} y1={-Math.cos(ang) * 40} x2={Math.sin(ang) * (long ? 33 : 36)} y2={-Math.cos(ang) * (long ? 33 : 36)} stroke={i > 22 ? "#c0391b" : C.ink} strokeWidth={long ? 1.4 : 0.7} />;
          })}
          <text y="20" textAnchor="middle" style={{ ...mono, fontSize: 9 }} fill={C.ink}>{value}{unit}</text>
          <g style={{ transform: `rotate(${a}deg)`, transition: `transform 2s cubic-bezier(.3,1.4,.5,1) ${delay}ms` }}>
            <path d="M -2 6 L 0 -36 L 2 6 Z" fill="#c0391b" />
          </g>
          <circle r="4" fill={C.woodD} />
        </svg>
      </div>
      <p style={{ ...display, fontSize: 20, marginTop: 12, color: C.cream }}>{label}</p>
    </div>
  );
}

export default function BanyaWorld({ perfume }: WorldProps) {
  const [, navigate] = useLocation();
  const { lang, setLang, t } = useLang();
  const [open, setOpen] = useState(false);
  const [steam, setSteam] = useState(false);
  const fragments = pick(lang, perfume.memoryFragments).map(fragmentText);
  const gallery = perfume.gallery ?? [];
  const n = perfume.scentNotes;
  const groups = [[t("Верх", "Top"), n.top], [t("Сердце", "Heart"), n.heart], [t("База", "Base"), n.base]] as const;

  const pour = () => {
    if (prefersReducedMotion()) { setOpen(true); return; }
    setSteam(true);
    setTimeout(() => setOpen(true), 1300);
    setTimeout(() => setSteam(false), 2600);
  };

  const skin: DialogSkin = {
    overlay: "rgba(30,18,10,.75)",
    panel: { ...body, background: PLANKS, padding: "30px 26px", color: C.cream, borderRadius: 6, boxShadow: "0 30px 80px rgba(0,0,0,.6)", border: `3px solid ${C.woodD}` },
    title: { ...display, fontSize: 34, color: C.cream },
    label: { ...mono, fontSize: 10, letterSpacing: ".14em", textTransform: "uppercase", color: C.dim },
    input: { ...body, fontSize: 15, background: "rgba(30,18,10,.45)", border: `1px solid ${C.woodL}`, padding: "10px 12px", color: C.cream, borderRadius: 3 },
    button: { ...display, fontSize: 20, background: C.ember, color: C.ink, padding: "12px", borderRadius: 3, boxShadow: "0 0 30px rgba(255,122,42,.4)" },
    accent: C.ember,
    heading: { ru: "Записаться в парную", en: "Book the steam room" },
    submit: { ru: "С лёгким паром", en: "Enjoy the steam" },
    sent: { ru: "С лёгким паром! Скоро свяжемся.", en: "Enjoy the steam! We'll be in touch." },
  };

  return (
    <div style={{ ...body, background: PLANKS, color: C.cream, minHeight: "100vh", overflowX: "hidden" }}>
      <style>{`
        .bn-burn { color: #2a1406; text-shadow: 0 1px 0 rgba(255,210,150,.35), 0 0 6px rgba(120,50,10,.35); }
        .bn-cloud { position: fixed; border-radius: 50%; background: radial-gradient(circle, rgba(250,246,240,.95), rgba(250,246,240,0) 70%); pointer-events: none; z-index: 60; animation: bn-rise 2.6s ease-out forwards; }
        @keyframes bn-rise { from { transform: translateY(40vh) scale(.4); opacity: 0; } 30% { opacity: 1; } to { transform: translateY(-30vh) scale(2.2); opacity: 0; } }
        .bn-tag { transition: transform .5s cubic-bezier(.2,1.5,.4,1); transform-origin: 50% 0; }
        .bn-tag:hover { transform: rotate(0deg) !important; }
        .bn-photo img { transition: filter 1.2s ease; filter: blur(8px) brightness(1.15) saturate(.6); }
        .bn-photo:hover img { filter: none; }
      `}</style>
      {steam && Array.from({ length: 14 }).map((_, i) => (
        <div key={i} className="bn-cloud" style={{ left: `${(i * 23) % 100 - 15}%`, bottom: "-20vh", width: `${40 + (i % 4) * 15}vw`, height: `${40 + (i % 4) * 15}vw`, animationDelay: `${i * 70}ms` }} />
      ))}

      <nav style={{ position: "relative", zIndex: 40, display: "flex", justifyContent: "space-between", padding: "18px clamp(16px,4vw,48px)", ...mono, fontSize: 12 }}>
        <button onClick={() => navigate("/map")} style={{ color: C.cream }}>← {t("к карте", "map")}</button>
        <span style={{ color: C.dim }}>{t("ПАРНАЯ · 92°C · ВЛАЖНОСТЬ 60%", "STEAM ROOM · 92°C · HUMIDITY 60%")}</span>
        <span>{(["ru", "en"] as const).map((l) => <button key={l} onClick={() => setLang(l)} style={{ marginLeft: 10, color: lang === l ? C.ember : C.dim }}>{l.toUpperCase()}</button>)}</span>
      </nav>

      {/* hero */}
      <header style={{ position: "relative", minHeight: "88vh", overflow: "hidden", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", alignItems: "center", gap: 30, padding: "20px clamp(16px,5vw,80px) 60px" }}>
        <SteamGlass />
        <div>
          <p style={{ ...mono, fontSize: 12, color: C.dim, letterSpacing: ".3em" }}>{t("ПРОТРИТЕ СТЕКЛО", "WIPE THE GLASS")}</p>
          <h1 style={{ ...display, fontSize: "clamp(3.6rem, 10vw, 8.5rem)", lineHeight: 0.9, margin: "14px 0 20px", color: C.cream, textShadow: "0 4px 30px rgba(0,0,0,.45)" }}>{t("Русская", "Russian")}<br />{t("баня", "Banya")}</h1>
          <p style={{ fontSize: "clamp(1.1rem, 1.7vw, 1.4rem)", lineHeight: 1.5, maxWidth: 480 }}>{pick(lang, perfume.description)}</p>
          <p style={{ ...display, fontSize: 26, color: C.ember, marginTop: 18 }}>{pick(lang, perfume.tagline)}</p>
        </div>
        <div style={{ position: "relative", height: "min(76vh, 640px)" }}>
          <div style={{ position: "absolute", left: "50%", bottom: "4%", width: "70%", height: "18%", marginLeft: "-35%", borderRadius: "50%", background: "radial-gradient(ellipse, rgba(255,122,42,.45), transparent 70%)", filter: "blur(10px)" }} />
          <Bottle3D style={{ position: "absolute", inset: 0 }} lighting="heat" liquid="#8a4f1e" liquidOpacity={0.9} glass="#fff2e0" cap="#3a2414" capRoughness={0.9} collar="#b98a52" spin={0.2}
            drawLabel={(ctx, w, h) => {
              ctx.fillStyle = "#c9925a"; ctx.fillRect(0, 0, w, h);
              for (let i = 0; i < 40; i++) { ctx.strokeStyle = `rgba(80,40,10,${0.08 + Math.random() * 0.12})`; ctx.lineWidth = 1 + Math.random() * 3; ctx.beginPath(); const y = Math.random() * h; ctx.moveTo(0, y); ctx.bezierCurveTo(w * .3, y + 10, w * .6, y - 10, w, y + 4); ctx.stroke(); }
              ctx.fillStyle = "#2a160a"; ctx.textAlign = "center";
              ctx.font = "130px 'Yeseva One', serif"; ctx.fillText("БАНЯ", w / 2, h * 0.55);
              ctx.font = "34px 'JetBrains Mono', monospace"; ctx.fillText("RUSSIAN BANYA · 92°", w / 2, h * 0.82);
            }} />
        </div>
      </header>

      <main style={{ position: "relative", maxWidth: 1180, margin: "0 auto", padding: "40px clamp(16px,4vw,48px) 100px" }}>
        {/* planks with burned notes */}
        <section style={{ marginBottom: 110 }}>
          <H kicker={t("выжжено на полке", "burned into the bench")} title={t("Состав", "Composition")} />
          <div style={{ borderRadius: 4, overflow: "hidden", boxShadow: "0 30px 60px rgba(0,0,0,.4)" }}>
            {groups.map(([tier, g], gi) => g && (
              <div key={tier} style={{ background: `linear-gradient(180deg, ${["#d29a5e", "#c58b50", "#b97d45"][gi]}, ${["#b97f45", "#a96f39", "#9a6230"][gi]})`, borderBottom: "3px solid #4a2c16", padding: "22px clamp(16px,3vw,32px)", display: "flex", flexWrap: "wrap", alignItems: "baseline", gap: "6px 26px", position: "relative" }}>
                <span style={{ position: "absolute", left: 10, top: 10, width: 8, height: 8, borderRadius: "50%", background: "#3b2414", boxShadow: "inset 0 1px 1px rgba(255,255,255,.3)" }} />
                <span style={{ position: "absolute", right: 10, top: 10, width: 8, height: 8, borderRadius: "50%", background: "#3b2414" }} />
                <span className="bn-burn" style={{ ...mono, fontSize: 11, letterSpacing: ".2em", textTransform: "uppercase", width: 90 }}>{tier}</span>
                {pick(lang, g).map((note) => <span key={note} className="bn-burn" style={{ ...display, fontSize: "clamp(1.3rem, 2.4vw, 2rem)" }}>{note}</span>)}
              </div>
            ))}
          </div>
        </section>

        <section style={{ marginBottom: 110 }}>
          <H kicker={t("приборы на стене", "gauges on the wall")} title={t("Жар и пар", "Heat and steam")} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 30 }}>
            {perfume.radarAxes.map((a, i) => <Gauge key={a.key} label={pick(lang, a.label)} value={a.value} unit={i % 2 ? "%" : "°"} delay={i * 160} />)}
          </div>
        </section>

        {gallery.length > 0 && (
          <section style={{ marginBottom: 110 }}>
            <H kicker={t("за запотевшим окном", "behind the fogged window")} title={t("Предбанник", "The dressing room")} />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
              {[perfume.heroImage, ...gallery].slice(0, 6).map((src) => (
                <div key={src} className="bn-photo" style={{ overflow: "hidden", border: `10px solid ${C.woodD}`, boxShadow: "inset 0 0 0 2px #8a5a30", aspectRatio: "4 / 3" }}>
                  <img src={src} alt="" loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                </div>
              ))}
            </div>
            <p style={{ ...mono, fontSize: 11, color: C.dim, marginTop: 12 }}>{t("Наведите, чтобы протереть стекло.", "Hover to wipe the glass.")}</p>
          </section>
        )}

        <section style={{ marginBottom: 110 }}>
          <H kicker={t("бирки на крючках", "tags on the hooks")} title={t("Что помнит тело", "What the body remembers")} />
          <div style={{ display: "flex", flexWrap: "wrap", gap: 22, justifyContent: "center", borderTop: `6px solid ${C.woodD}`, paddingTop: 0 }}>
            {fragments.map((f, i) => (
              <div key={i} className="bn-tag" style={{ display: "flex", flexDirection: "column", alignItems: "center", transform: `rotate(${[-6, 4, -3, 7, -5][i % 5]}deg)` }}>
                <span style={{ width: 2, height: 30 + (i % 3) * 18, background: "#d6c19a" }} />
                <div style={{ width: 170, padding: "22px 14px 18px", background: "linear-gradient(#d9a46a, #b77d44)", borderRadius: "8px 8px 14px 14px", boxShadow: "0 12px 20px rgba(0,0,0,.35)", position: "relative", textAlign: "center" }}>
                  <span style={{ position: "absolute", top: 8, left: "50%", width: 10, height: 10, marginLeft: -5, borderRadius: "50%", background: C.woodD }} />
                  <p style={{ ...mono, fontSize: 11, color: C.ink, opacity: 0.7 }}>№ {i + 1}</p>
                  <p className="bn-burn" style={{ ...display, fontSize: 19, lineHeight: 1.2, marginTop: 4 }}>{f}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, textAlign: "center" }}>
          <button onClick={pour} style={{ position: "relative", display: "flex", alignItems: "center", gap: 18, padding: "18px 34px 18px 22px", borderRadius: 999, background: "linear-gradient(#ffb070, #ff7a2a 55%, #d8550f)", color: C.ink, ...display, fontSize: 28, boxShadow: "0 0 50px rgba(255,122,42,.55), inset 0 2px 3px rgba(255,255,255,.5)" }}>
            <svg viewBox="0 0 60 40" width="54" height="36"><path d="M4 14 Q 4 34 24 34 Q 40 34 40 14 Z" fill={C.woodD} /><path d="M38 18 L 58 6" stroke={C.woodD} strokeWidth="5" strokeLinecap="round" /><path d="M10 10 q 4 -6 0 -10 M20 10 q 4 -6 0 -10 M30 10 q 4 -6 0 -10" stroke={C.ink} strokeWidth="1.5" fill="none" opacity=".6" /></svg>
            {t("Поддать пару", "Add steam")}
          </button>
          <p style={{ ...mono, fontSize: 12, color: C.dim }}>Extrait de parfum · {perfume.releaseDate} · {perfume.origin.coords}</p>
        </section>
      </main>
      <RequestDialog open={open} onClose={() => setOpen(false)} perfumeName={perfume.name} skin={skin} />
    </div>
  );
}

function H({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div style={{ marginBottom: 30 }}>
      <p style={{ ...mono, fontSize: 12, letterSpacing: ".25em", textTransform: "uppercase", color: C.ember }}>{kicker}</p>
      <h2 style={{ ...display, fontSize: "clamp(2.2rem, 5vw, 4rem)", lineHeight: 1, color: C.cream, textShadow: "0 3px 20px rgba(0,0,0,.4)" }}>{title}</h2>
    </div>
  );
}
