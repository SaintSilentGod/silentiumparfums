// Sunlit Memories — an Italian summer shot on film.
// Leaf shadows sway across cream paper; notes are a herbarium; the profile is a light meter;
// memories are film frames with an orange date stamp; the request is a postcard.

import { useState, type CSSProperties } from "react";
import { useLocation } from "wouter";
import { useLang } from "@/contexts/LangContext";
import Bottle3D from "@/components/Bottle3D";
import RequestDialog, { type DialogSkin } from "@/components/RequestDialog";
import { useReveal } from "@/lib/useReveal";
import { fragmentText, pick, type WorldProps } from "./shared";

const C = { paper: "#f4ecd8", paper2: "#ebe0c4", ink: "#2c2a1e", olive: "#5d6b33", sun: "#e8a93a", stamp: "#ff7b1c", dim: "rgba(44,42,30,.6)" };
const serif: CSSProperties = { fontFamily: "'Cormorant Garamond', serif" };
const hand: CSSProperties = { fontFamily: "'Caveat', cursive" };
const mono: CSSProperties = { fontFamily: "'JetBrains Mono', monospace" };

// Moving leaf shadows (komorebi) laid over the whole page
function LeafShadows() {
  const leaves = Array.from({ length: 26 }, (_, i) => ({
    x: (i * 37) % 100, y: (i * 53) % 100, s: 60 + ((i * 29) % 90), r: (i * 47) % 360, d: 6 + (i % 5) * 1.7,
  }));
  return (
    <div aria-hidden style={{ position: "fixed", inset: "-10%", pointerEvents: "none", zIndex: 30, mixBlendMode: "multiply", opacity: 0.22, filter: "blur(6px)" }}>
      {leaves.map((l, i) => (
        <svg key={i} viewBox="0 0 100 60" className="sl-leaf" style={{ position: "absolute", left: `${l.x}%`, top: `${l.y}%`, width: l.s, transform: `rotate(${l.r}deg)`, animationDuration: `${l.d}s`, animationDelay: `${-i * 0.7}s` }}>
          <path d="M2 30 C 25 0, 75 0, 98 30 C 75 60, 25 60, 2 30 Z" fill="#3d4a1c" />
        </svg>
      ))}
    </div>
  );
}

const LEAF_PATHS = [
  "M50 5 C 80 30, 80 70, 50 95 C 20 70, 20 30, 50 5 Z",
  "M50 5 C 90 20, 85 75, 50 95 C 15 75, 10 20, 50 5 Z",
  "M50 8 L 62 30 L 85 32 L 68 50 L 75 78 L 50 64 L 25 78 L 32 50 L 15 32 L 38 30 Z",
  "M50 5 C 70 25, 95 40, 50 95 C 5 40, 30 25, 50 5 Z",
];

function Herbarium({ notes }: { notes: { label: string; tier: string }[] }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 18 }}>
      {notes.map((n, i) => (
        <figure key={n.label + i} className="sl-card" style={{ margin: 0, background: "#fbf6e8", padding: "16px 14px 12px", boxShadow: "0 1px 0 #d8cca8, 0 10px 24px rgba(80,60,20,.12)", transform: `rotate(${[-1.5, 1, -0.5, 1.8, -1][i % 5]}deg)`, position: "relative" }}>
          <span style={{ position: "absolute", top: -6, left: "50%", width: 54, height: 16, marginLeft: -27, background: "rgba(240,225,170,.75)", transform: "rotate(-3deg)" }} />
          <svg viewBox="0 0 100 100" style={{ width: "70%", display: "block", margin: "0 auto" }}>
            <path d={LEAF_PATHS[i % LEAF_PATHS.length]} fill={["#7d8c46", "#a3a854", "#c8a24a", "#6b7d3a"][i % 4]} opacity=".85" />
            <path d="M50 10 L50 92" stroke="#4c5626" strokeWidth="1.5" opacity=".6" />
          </svg>
          <figcaption style={{ marginTop: 8 }}>
            <p style={{ ...hand, fontSize: 22, lineHeight: 1, color: C.ink }}>{n.label}</p>
            <p style={{ ...mono, fontSize: 9, color: C.dim, marginTop: 4, letterSpacing: ".12em", textTransform: "uppercase" }}>{n.tier} · №{String(i + 1).padStart(2, "0")}</p>
          </figcaption>
        </figure>
      ))}
    </div>
  );
}

// Light-meter needle per axis
function LightMeter({ label, value, delay }: { label: string; value: number; delay: number }) {
  const { ref, visible } = useReveal();
  const angle = -60 + (visible ? value : 0) * 1.2;
  return (
    <div ref={ref} style={{ textAlign: "center" }}>
      <svg viewBox="0 0 120 80" style={{ width: "100%", maxWidth: 170 }}>
        <rect x="2" y="2" width="116" height="76" rx="10" fill="#22201a" />
        <path d="M18 66 A 48 48 0 0 1 102 66" fill="none" stroke="#4a463a" strokeWidth="10" />
        <path d="M18 66 A 48 48 0 0 1 102 66" fill="none" stroke={C.sun} strokeWidth="10" strokeDasharray="4 3" opacity=".9" />
        {[-60, -30, 0, 30, 60].map((a) => <line key={a} x1="60" y1="70" x2={60 + Math.sin((a * Math.PI) / 180) * 40} y2={70 - Math.cos((a * Math.PI) / 180) * 40} stroke="#f4ecd8" strokeWidth=".6" opacity=".35" />)}
        <g style={{ transform: `rotate(${angle}deg)`, transformOrigin: "60px 70px", transition: `transform 1.8s cubic-bezier(.3,1.6,.5,1) ${delay}ms` }}>
          <line x1="60" y1="70" x2="60" y2="24" stroke="#ff5a2a" strokeWidth="1.6" />
        </g>
        <circle cx="60" cy="70" r="4" fill="#f4ecd8" />
      </svg>
      <p style={{ ...serif, fontSize: 20, fontStyle: "italic" }}>{label}</p>
      <p style={{ ...mono, fontSize: 11, color: C.dim }}>f/{(value / 10).toFixed(1)}</p>
    </div>
  );
}

export default function SunlitWorld({ perfume }: WorldProps) {
  const [, navigate] = useLocation();
  const { lang, setLang, t } = useLang();
  const [open, setOpen] = useState(false);
  const fragments = pick(lang, perfume.memoryFragments).map(fragmentText);
  const n = perfume.scentNotes;
  const notes = [
    ...(n.top ? pick(lang, n.top).map((label) => ({ label, tier: t("верх", "top") })) : []),
    ...(n.heart ? pick(lang, n.heart).map((label) => ({ label, tier: t("сердце", "heart") })) : []),
    ...(n.base ? pick(lang, n.base).map((label) => ({ label, tier: t("база", "base") })) : []),
  ];

  const skin: DialogSkin = {
    overlay: "rgba(60,50,25,.45)",
    panel: { background: "#fbf6e8", padding: "30px 28px", color: C.ink, boxShadow: "0 30px 80px rgba(60,40,10,.35)", border: "10px solid #fff", outline: `1px dashed ${C.olive}`, outlineOffset: -18 },
    title: { ...hand, fontSize: 40, color: C.olive, lineHeight: 1 },
    label: { ...mono, fontSize: 10, letterSpacing: ".14em", textTransform: "uppercase", color: C.dim },
    input: { ...hand, fontSize: 24, background: "transparent", border: "none", borderBottom: `1px solid ${C.dim}`, padding: "2px 0", color: C.ink },
    button: { ...serif, fontSize: 20, fontStyle: "italic", background: C.olive, color: "#fbf6e8", padding: "10px", borderRadius: 2 },
    accent: C.stamp,
    heading: { ru: "Открытка на Комо", en: "A postcard to Como" },
    submit: { ru: "Отправить открытку", en: "Send the postcard" },
    sent: { ru: "Открытка в пути ✉", en: "The postcard is on its way ✉" },
  };

  return (
    <div style={{ ...serif, background: `radial-gradient(ellipse at 70% 0%, #fff6dc, ${C.paper} 50%, ${C.paper2})`, color: C.ink, minHeight: "100vh", overflowX: "hidden", position: "relative" }}>
      <style>{`
        .sl-leaf { animation: sl-sway ease-in-out infinite alternate; }
        @keyframes sl-sway { from { translate: 0 0; } to { translate: 26px 14px; rotate: 8deg; } }
        .sl-card { transition: transform .5s cubic-bezier(.2,1.4,.4,1); }
        .sl-card:hover { transform: rotate(0) translateY(-6px) scale(1.04) !important; }
        .sl-grain::after { content: ""; position: fixed; inset: 0; pointer-events: none; z-index: 31; opacity: .16; mix-blend-mode: multiply;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"); }
        @media (prefers-reduced-motion: reduce) { .sl-leaf { animation: none; } }
      `}</style>
      <div className="sl-grain" />
      <LeafShadows />

      <nav style={{ position: "relative", zIndex: 40, display: "flex", justifyContent: "space-between", padding: "20px clamp(16px,4vw,48px)", ...mono, fontSize: 12 }}>
        <button onClick={() => navigate("/map")} style={{ color: C.ink }}>← {t("карта", "map")}</button>
        <span style={{ color: C.dim }}>ROLL 03 · 36 EXP · ISO 200</span>
        <span>{(["ru", "en"] as const).map((l) => <button key={l} onClick={() => setLang(l)} style={{ marginLeft: 10, color: lang === l ? C.stamp : C.dim }}>{l.toUpperCase()}</button>)}</span>
      </nav>

      {/* hero */}
      <header style={{ position: "relative", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", alignItems: "center", gap: 30, padding: "10px clamp(16px,5vw,80px) 60px", maxWidth: 1400, margin: "0 auto" }}>
        <div>
          <p style={{ ...hand, fontSize: 28, color: C.olive }}>{t("Лаго-ди-Комо, 18 июня", "Lago di Como, 18 June")}</p>
          <h1 style={{ fontSize: "clamp(4rem, 11vw, 9.5rem)", fontWeight: 300, fontStyle: "italic", lineHeight: 0.85, letterSpacing: "-0.03em", margin: "10px 0 24px" }}>Sunlit<br /><span style={{ paddingLeft: "0.6em" }}>Memories</span></h1>
          <p style={{ fontSize: "clamp(1.3rem, 2vw, 1.7rem)", lineHeight: 1.4, maxWidth: 520 }}>{pick(lang, perfume.description)}</p>
        </div>
        <div style={{ position: "relative" }}>
          <div style={{ position: "relative", background: "#fff", padding: "14px 14px 64px", boxShadow: "0 30px 60px rgba(80,60,20,.25)", transform: "rotate(2.5deg)", maxWidth: 520, margin: "0 auto" }}>
            <div style={{ position: "relative", aspectRatio: "4 / 4.4", overflow: "hidden", background: `url(${perfume.heroImage}) center/cover` }}>
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(transparent 40%, rgba(255,230,170,.35)), radial-gradient(circle at 80% 10%, rgba(255,240,190,.6), transparent 50%)" }} />
              <span style={{ ...mono, position: "absolute", right: 14, bottom: 10, color: C.stamp, fontSize: 18, textShadow: "0 0 6px rgba(255,123,28,.8)", letterSpacing: 2 }}>'23 6 18</span>
            </div>
            <p style={{ ...hand, position: "absolute", bottom: 14, left: 0, right: 0, textAlign: "center", fontSize: 28 }}>{pick(lang, perfume.tagline)}</p>
          </div>
          <Bottle3D style={{ position: "absolute", left: "-16%", bottom: "-14%", width: "62%", height: "78%", zIndex: 3 }} lighting="daylight" liquid="#c7c76a" liquidOpacity={0.95} glass="#fffbe8" cap="#efe6cf" capRoughness={0.7} collar="#d6b97a" spin={0.22}
                drawLabel={(ctx, w, h) => {
                  ctx.fillStyle = "#fbf6e8"; ctx.fillRect(0, 0, w, h);
                  ctx.fillStyle = "#5d6b33"; ctx.textAlign = "center";
                  ctx.font = "italic 300 120px 'Cormorant Garamond', serif"; ctx.fillText("Sunlit", w / 2, h * 0.45);
                  ctx.font = "italic 300 96px 'Cormorant Garamond', serif"; ctx.fillText("Memories", w / 2, h * 0.7);
                  ctx.font = "28px 'JetBrains Mono', monospace"; ctx.fillStyle = "#8a7a50"; ctx.fillText("COMO · 2023", w / 2, h * 0.88);
                }} />
        </div>
      </header>

      <main style={{ position: "relative", zIndex: 1, maxWidth: 1180, margin: "0 auto", padding: "40px clamp(16px,4vw,48px) 100px" }}>
        <section style={{ marginBottom: 110 }}>
          <Head kicker={t("гербарий", "herbarium")} title={t("Что я собрал тем летом", "What I gathered that summer")} />
          <Herbarium notes={notes} />
        </section>

        <section style={{ marginBottom: 110 }}>
          <Head kicker={t("экспонометр", "light meter")} title={t("Сколько было света", "How much light there was")} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 26 }}>
            {perfume.radarAxes.map((a, i) => <LightMeter key={a.key} label={pick(lang, a.label)} value={a.value} delay={i * 150} />)}
          </div>
        </section>

        <section style={{ marginBottom: 110 }}>
          <Head kicker={t("плёнка", "film")} title={t("Кадры, которые остались", "Frames that stayed")} />
          <div style={{ background: "#1c1a14", padding: "26px 0", overflowX: "auto", position: "relative", scrollbarWidth: "none" }}>
            <div style={{ position: "absolute", top: 6, left: 0, right: 0, height: 10, backgroundImage: "repeating-linear-gradient(90deg, transparent 0 14px, #f4ecd8 14px 26px)", opacity: 0.5 }} />
            <div style={{ position: "absolute", bottom: 6, left: 0, right: 0, height: 10, backgroundImage: "repeating-linear-gradient(90deg, transparent 0 14px, #f4ecd8 14px 26px)", opacity: 0.5 }} />
            <div style={{ display: "flex", gap: 14, padding: "0 20px", width: "max-content" }}>
              {fragments.map((f, i) => (
                <div key={i} style={{ width: 240, aspectRatio: "3 / 2", position: "relative", overflow: "hidden", background: `url(${perfume.heroImage}) ${[10, 30, 50, 70, 90][i % 5]}% ${[20, 70, 40, 80, 30][i % 5]}%/260% auto`, filter: `sepia(.25) saturate(1.2) hue-rotate(${i * 6 - 10}deg)` }}>
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(transparent 45%, rgba(0,0,0,.65))" }} />
                  <p style={{ ...hand, position: "absolute", left: 12, bottom: 8, right: 12, color: "#fff6dc", fontSize: 22, lineHeight: 1 }}>{f}</p>
                  <span style={{ ...mono, position: "absolute", right: 8, top: 6, color: C.stamp, fontSize: 12, textShadow: "0 0 5px rgba(255,123,28,.8)" }}>'23 6 {18 + i}</span>
                  <span style={{ ...mono, position: "absolute", left: 8, top: 6, color: "#f4ecd8", fontSize: 10, opacity: 0.7 }}>{12 + i}A</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* postcard */}
        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", background: "#fbf6e8", boxShadow: "0 30px 70px rgba(80,60,20,.2)", border: "12px solid #fff" }}>
          <div style={{ padding: "34px 30px", borderRight: `1px solid ${C.paper2}` }}>
            <p style={{ ...hand, fontSize: 30, lineHeight: 1.25, color: C.ink }}>{t("Если хочешь вернуть этот день — напиши мне.", "If you want that day back — write to me.")}</p>
            <p style={{ ...mono, fontSize: 11, color: C.dim, marginTop: 20, lineHeight: 1.8 }}>Extrait de parfum · {perfume.releaseDate}<br />{perfume.origin.coords}</p>
          </div>
          <div style={{ padding: "30px", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 20 }}>
            <div style={{ width: 92, height: 112, border: "4px dotted #fff", outline: `1px solid ${C.olive}`, background: `url(${perfume.heroImage}) center/cover`, boxShadow: "0 2px 6px rgba(0,0,0,.2)" }} />
            <button onClick={() => setOpen(true)} style={{ ...serif, fontStyle: "italic", fontSize: 26, color: C.olive, borderBottom: `1px solid ${C.olive}`, alignSelf: "stretch", textAlign: "left", padding: "6px 0" }}>{t("Подписать и отправить →", "Sign and send →")}</button>
          </div>
        </section>
      </main>
      <RequestDialog open={open} onClose={() => setOpen(false)} perfumeName={perfume.name} skin={skin} />
    </div>
  );
}

function Head({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div style={{ marginBottom: 30 }}>
      <p style={{ ...hand, fontSize: 26, color: C.olive }}>{kicker}</p>
      <h2 style={{ ...serif, fontWeight: 300, fontStyle: "italic", fontSize: "clamp(2.2rem, 5vw, 4rem)", lineHeight: 1 }}>{title}</h2>
    </div>
  );
}
