// Silent Fog — a white veil over everything.
// Drifting fog banks cover the page; notes float at different depths and come into focus on hover;
// the profile is "visibility in metres"; memories surface one at a time and dissolve again.

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useLocation } from "wouter";
import { useLang } from "@/contexts/LangContext";
import Bottle3D from "@/components/Bottle3D";
import RequestDialog, { type DialogSkin } from "@/components/RequestDialog";
import { useReveal } from "@/lib/useReveal";
import { fragmentText, notesFlat, pick, type WorldProps } from "./shared";

const C = { bg: "#dfe4e5", bg2: "#c9d0d2", ink: "#2b3335", dim: "rgba(43,51,53,.5)", faint: "rgba(43,51,53,.22)" };
const thin: CSSProperties = { fontFamily: "'Manrope', sans-serif", fontWeight: 200 };
const mono: CSSProperties = { fontFamily: "'JetBrains Mono', monospace" };

function FogBanks() {
  return (
    <div aria-hidden style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 20, overflow: "hidden" }}>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="fg-bank" style={{ top: `${(i * 19) % 90 - 10}%`, height: `${40 + (i % 3) * 15}vh`, animationDuration: `${50 + i * 9}s`, animationDelay: `${-i * 11}s`, opacity: 0.55 + (i % 2) * 0.2 }} />
      ))}
    </div>
  );
}

// Text that slowly emerges from blur as it enters the viewport
function Emerge({ children, style, delay = 0 }: { children: React.ReactNode; style?: CSSProperties; delay?: number }) {
  const { ref, visible } = useReveal();
  return <div ref={ref} style={{ ...style, opacity: visible ? 1 : 0.05, filter: visible ? "blur(0)" : "blur(18px)", transition: `opacity 3.2s ease ${delay}ms, filter 3.6s ease ${delay}ms` }}>{children}</div>;
}

function DepthNotes({ notes }: { notes: string[] }) {
  const [focus, setFocus] = useState<number | null>(null);
  return (
    <div style={{ position: "relative", height: "min(560px, 120vw)" }} onMouseLeave={() => setFocus(null)}>
      {notes.map((note, i) => {
        const depth = (i * 7) % 5; // 0 near … 4 far
        const blur = focus === i ? 0 : 2 + depth * 2.2;
        return (
          <button key={note} onMouseEnter={() => setFocus(i)} onFocus={() => setFocus(i)}
            style={{ ...thin, position: "absolute", left: `${6 + ((i * 41) % 76)}%`, top: `${6 + ((i * 29) % 82)}%`, fontSize: `${2.6 - depth * 0.35}rem`, color: C.ink, filter: `blur(${blur}px)`, opacity: focus === i ? 1 : 0.75 - depth * 0.1, transform: `translateX(-30%) scale(${focus === i ? 1.08 : 1})`, transition: "filter .9s ease, opacity .9s ease, transform .9s ease", whiteSpace: "nowrap" }}>
            {note}
          </button>
        );
      })}
    </div>
  );
}

function Visibility({ label, value, delay }: { label: string; value: number; delay: number }) {
  const { ref, visible } = useReveal();
  return (
    <div ref={ref} style={{ display: "grid", gridTemplateColumns: "minmax(110px, 200px) 1fr 90px", gap: 20, alignItems: "center", padding: "18px 0", borderBottom: `1px solid ${C.faint}` }}>
      <span style={{ ...thin, fontSize: 20, fontWeight: 300 }}>{label}</span>
      <div style={{ position: "relative", height: 1, background: C.faint }}>
        <div style={{ position: "absolute", left: 0, top: -1, height: 3, width: visible ? `${value}%` : 0, background: `linear-gradient(90deg, ${C.ink}, transparent)`, transition: `width 3s cubic-bezier(.16,1,.3,1) ${delay}ms` }} />
      </div>
      <span style={{ ...mono, fontSize: 12, color: C.dim, textAlign: "right" }}>{value * 10} m</span>
    </div>
  );
}

// One memory at a time, surfacing and dissolving
function Drifting({ items }: { items: string[] }) {
  const [i, setI] = useState(0);
  const [shown, setShown] = useState(true);
  const t = useRef<number[]>([]);
  useEffect(() => {
    const cycle = () => {
      setShown(false);
      t.current.push(window.setTimeout(() => { setI((k) => (k + 1) % items.length); setShown(true); }, 2200));
    };
    const id = window.setInterval(cycle, 6200);
    return () => { clearInterval(id); t.current.forEach(clearTimeout); };
  }, [items.length]);
  return (
    <div style={{ minHeight: 220, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
      <p style={{ ...thin, fontSize: "clamp(2rem, 5vw, 4rem)", lineHeight: 1.1, opacity: shown ? 1 : 0, filter: shown ? "blur(0)" : "blur(20px)", letterSpacing: shown ? "0" : "0.1em", transition: "opacity 2.2s ease, filter 2.2s ease, letter-spacing 2.2s ease" }}>{items[i]}</p>
      <div style={{ display: "flex", gap: 10, marginTop: 30 }}>
        {items.map((_, k) => <span key={k} style={{ width: 6, height: 6, borderRadius: "50%", background: k === i ? C.ink : C.faint, transition: "background 1s" }} />)}
      </div>
    </div>
  );
}

export default function FogWorld({ perfume }: WorldProps) {
  const [, navigate] = useLocation();
  const { lang, setLang, t } = useLang();
  const [open, setOpen] = useState(false);
  const notes = notesFlat(perfume, lang);
  const fragments = pick(lang, perfume.memoryFragments).map(fragmentText);
  const gallery = perfume.gallery ?? [];

  const skin: DialogSkin = {
    overlay: "rgba(223,228,229,.82)",
    panel: { ...thin, background: "rgba(240,243,244,.9)", backdropFilter: "blur(20px)", padding: "34px 30px", color: C.ink, boxShadow: "0 40px 120px rgba(43,51,53,.2)" },
    title: { ...thin, fontSize: 38, lineHeight: 1 },
    label: { ...mono, fontSize: 10, letterSpacing: ".2em", textTransform: "uppercase", color: C.dim },
    input: { ...thin, fontWeight: 300, fontSize: 18, background: "transparent", border: "none", borderBottom: `1px solid ${C.faint}`, padding: "8px 0", color: C.ink },
    button: { ...mono, fontSize: 12, letterSpacing: ".3em", textTransform: "uppercase", border: `1px solid ${C.ink}`, color: C.ink, padding: "14px" },
    accent: C.ink,
    heading: { ru: "Оставьте след", en: "Leave a trace" },
    submit: { ru: "Растворить в тумане", en: "Dissolve into the fog" },
    sent: { ru: "Мы найдём вас.", en: "We will find you." },
  };

  return (
    <div style={{ ...thin, background: `linear-gradient(${C.bg}, ${C.bg2} 60%, ${C.bg})`, color: C.ink, minHeight: "100vh", overflowX: "hidden" }}>
      <style>{`
        .fg-bank { position: absolute; left: -60%; width: 220%; background: radial-gradient(ellipse at 50% 50%, rgba(245,248,249,.95), rgba(245,248,249,0) 60%); filter: blur(30px); animation: fg-drift linear infinite alternate; }
        @keyframes fg-drift { from { transform: translateX(-12%); } to { transform: translateX(12%); } }
        .fg-photo img { filter: blur(10px) grayscale(.6) brightness(1.15); transition: filter 2.5s ease; }
        .fg-photo:hover img { filter: blur(0) grayscale(.3) brightness(1); }
        .fg-in { animation: fg-in 4s ease .6s both; }
        @keyframes fg-in { from { opacity: 0; filter: blur(20px); } to { opacity: 1; filter: blur(0); } }
        @media (prefers-reduced-motion: reduce) { .fg-bank, .fg-in { animation: none; } }
      `}</style>
      <FogBanks />

      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 50, display: "flex", justifyContent: "space-between", padding: "22px clamp(16px,4vw,48px)", ...mono, fontSize: 11, letterSpacing: ".2em", color: C.dim }}>
        <button onClick={() => navigate("/map")} style={{ color: C.dim }}>← {t("карта", "map")}</button>
        <span>{t("видимость", "visibility")} 40 m</span>
        <span>{(["ru", "en"] as const).map((l) => <button key={l} onClick={() => setLang(l)} style={{ marginLeft: 10, color: lang === l ? C.ink : C.faint }}>{l.toUpperCase()}</button>)}</span>
      </nav>

      <header style={{ position: "relative", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "90px 16px 40px" }}>
        <img src={perfume.heroImage} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.35, filter: "grayscale(.5) contrast(.8)", mixBlendMode: "multiply" }} />
        <div style={{ position: "relative", height: "min(58vh, 520px)", width: "min(520px, 90vw)", zIndex: 25 }}>
          <Bottle3D style={{ position: "absolute", inset: 0 }} lighting="fog" liquid="#c8d2d4" liquidOpacity={0.55} glass="#ffffff" cap="#e8ecee" capRoughness={0.95} collar="#b9c2c6" spin={0.08}
            drawLabel={(ctx, w, h) => {
              ctx.fillStyle = "rgba(240,243,244,.92)"; ctx.fillRect(0, 0, w, h);
              ctx.fillStyle = "#2b3335"; ctx.textAlign = "center";
              ctx.font = "200 110px 'Manrope', sans-serif"; ctx.fillText("silent fog", w / 2, h * 0.56);
              ctx.font = "26px 'JetBrains Mono', monospace"; ctx.fillStyle = "#7d878a"; ctx.fillText("54.5186° N · 37.5665° E", w / 2, h * 0.8);
            }} />
        </div>
        <div className="fg-in" style={{ position: "relative", zIndex: 25 }}>
          <h1 style={{ ...thin, fontSize: "clamp(3.4rem, 10vw, 9rem)", letterSpacing: "-0.04em", lineHeight: 0.9 }}>silent fog</h1>
          <p style={{ ...thin, fontWeight: 300, fontSize: "clamp(1.1rem, 2vw, 1.5rem)", marginTop: 16 }}>{pick(lang, perfume.tagline)}</p>
        </div>
      </header>

      <main style={{ position: "relative", zIndex: 25, maxWidth: 1100, margin: "0 auto", padding: "60px clamp(16px,5vw,64px) 120px" }}>
        <section style={{ minHeight: "70vh", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
          <Emerge><p style={{ ...thin, fontSize: "clamp(1.8rem, 4.2vw, 3.4rem)", lineHeight: 1.25 }}>{pick(lang, perfume.description)}</p></Emerge>
        </section>

        <section style={{ marginBottom: 140 }}>
          <Emerge><Label k={t("ноты на разной глубине", "notes at different depths")} title={t("Наведите, чтобы навести резкость", "Hover to bring into focus")} /></Emerge>
          <DepthNotes notes={notes} />
        </section>

        <section style={{ marginBottom: 140 }}>
          <Emerge><Label k={t("метеосводка", "weather report")} title={t("Видимость", "Visibility")} /></Emerge>
          {perfume.radarAxes.map((a, i) => <Visibility key={a.key} label={pick(lang, a.label)} value={a.value} delay={i * 250} />)}
        </section>

        {gallery.length > 0 && (
          <section style={{ marginBottom: 140 }}>
            <Emerge><Label k={t("сквозь пелену", "through the veil")} title={t("Силуэты", "Silhouettes")} /></Emerge>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 10 }}>
              {gallery.map((src, i) => (
                <div key={src} className="fg-photo" style={{ overflow: "hidden", aspectRatio: i % 2 ? "3 / 4" : "4 / 5", marginTop: i % 2 ? 60 : 0 }}>
                  <img src={src} alt="" loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                </div>
              ))}
            </div>
          </section>
        )}

        <section style={{ marginBottom: 140 }}>
          <Emerge><Label k={t("то, что исчезает", "what fades")} title="" /></Emerge>
          <Drifting items={fragments} />
        </section>

        <section style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>
          <Emerge><p style={{ ...thin, fontSize: "clamp(1.6rem, 3.6vw, 2.8rem)" }}>{t("Хотите исчезнуть вместе с ним?", "Want to disappear with it?")}</p></Emerge>
          <button onClick={() => setOpen(true)} style={{ ...mono, fontSize: 12, letterSpacing: ".35em", textTransform: "uppercase", padding: "18px 40px", border: `1px solid ${C.ink}`, color: C.ink, background: "rgba(245,248,249,.4)", backdropFilter: "blur(8px)" }}>{t("Выйти из тумана", "Step out of the fog")}</button>
          <p style={{ ...mono, fontSize: 11, color: C.dim }}>Extrait de parfum · {perfume.releaseDate} · {perfume.origin.coords}</p>
        </section>
      </main>
      <RequestDialog open={open} onClose={() => setOpen(false)} perfumeName={perfume.name} skin={skin} />
    </div>
  );
}

function Label({ k, title }: { k: string; title: string }) {
  return (
    <div style={{ marginBottom: 30, textAlign: "center" }}>
      <p style={{ ...mono, fontSize: 11, letterSpacing: ".3em", textTransform: "uppercase", color: C.dim }}>{k}</p>
      {title && <h2 style={{ ...thin, fontSize: "clamp(2rem, 4.5vw, 3.6rem)", marginTop: 10 }}>{title}</h2>}
    </div>
  );
}
