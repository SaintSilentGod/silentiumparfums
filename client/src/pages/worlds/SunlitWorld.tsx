// Sunlit Memories — one summer day at a villa on Lake Como.
// The page opens on closed green shutters with sun leaking through; scrolling (or a tap) swings them
// open onto the lake. Below, on cream paper under drifting olive-leaf shadows: what it smells like in
// plain words, how it unfolds over one day (morning dew → warm rain → evening skin) as film prints,
// the notes as a pressed herbarium, how strong it is, what it reminds you of, and a postcard request
// that gets a stamp and a postmark before it's sent.

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useLocation } from "wouter";
import { useLang } from "@/contexts/LangContext";
import Bottle3D from "@/components/Bottle3D";
import RequestDialog, { type DialogSkin } from "@/components/RequestDialog";
import { useReveal } from "@/lib/useReveal";
import { pick, prefersReducedMotion, type WorldProps } from "./shared";

const C = { paper: "#f4ecd8", paper2: "#ebe0c4", ink: "#2c2a1e", olive: "#5d6b33", sage: "#7d8c5a", sun: "#e8a93a", stamp: "#ff7b1c", lake: "#3c6e8f", dim: "rgba(44,42,30,.62)" };
const serif: CSSProperties = { fontFamily: "'Cormorant Garamond', serif" };
const hand: CSSProperties = { fontFamily: "'Caveat', cursive" };
const mono: CSSProperties = { fontFamily: "'JetBrains Mono', monospace" };
const IMG = "/images/sunlit-memories";

// ── Shutters: closed at the top of the page, swing open as you scroll through the hero ──
function Shutters({ title, tagline, hint }: { title: string; tagline: string; hint: string }) {
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
        setP(Math.min(1, Math.max(0, -el.getBoundingClientRect().top / (span * 0.75))));
      });
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("scroll", update); window.removeEventListener("resize", update); };
  }, []);
  const open = () => {
    const el = wrap.current; if (!el) return;
    window.scrollTo({ top: el.offsetTop + (el.offsetHeight - window.innerHeight) * 0.8, behavior: "smooth" });
  };
  const e = 1 - Math.pow(1 - p, 3); // ease-out
  const angle = 4 + e * 104; // a crack of light even when closed
  return (
    <div ref={wrap} style={{ position: "relative", height: prefersReducedMotion() ? "100svh" : "210svh" }}>
      <div style={{ position: "sticky", top: 0, height: "100svh", overflow: "hidden", background: "#1d1a12" }}>
        <img src={`${IMG}/view.webp`} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", transform: `scale(${1.12 - e * 0.12})` }} />
        {/* warm light flooding in */}
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 40%, rgba(255,226,160,.55), transparent 60%)", opacity: 1 - e * 0.7, mixBlendMode: "screen" }} />
        <div style={{ position: "absolute", inset: 0, perspective: "1600px", pointerEvents: p >= 1 ? "none" : "auto" }} onClick={open}>
          {[0, 1].map((side) => (
            <div key={side} style={{ position: "absolute", top: 0, bottom: 0, [side ? "right" : "left"]: 0, width: "50.2%", transformOrigin: side ? "100% 50%" : "0% 50%", transform: `rotateY(${side ? angle : -angle}deg)`, cursor: "pointer" }}>
              <img src={`${IMG}/shutter.webp`} alt="" draggable={false} style={{ width: "100%", height: "100%", objectFit: "fill", display: "block", transform: side ? "scaleX(-1)" : "none", filter: `brightness(${0.62 + e * 0.3}) drop-shadow(0 0 40px rgba(0,0,0,.4))` }} />
            </div>
          ))}
          {/* sunlight through the gap */}
          <div style={{ position: "absolute", top: 0, bottom: 0, left: "50%", width: 10 + e * 300, transform: "translateX(-50%)", background: "linear-gradient(90deg, transparent, rgba(255,236,190,.85), transparent)", filter: "blur(8px)", opacity: 1 - e, pointerEvents: "none" }} />
        </div>
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "linear-gradient(0deg, rgba(30,24,12,.62) 0%, rgba(30,24,12,.25) 32%, transparent 55%)", opacity: e }} />
        <div style={{ position: "absolute", left: 0, right: 0, bottom: "12vh", textAlign: "center", color: "#fffaf0", pointerEvents: "none", opacity: Math.max(0, (e - 0.55) / 0.45), transform: `translateY(${(1 - e) * 30}px)`, textShadow: "0 2px 30px rgba(0,0,0,.45)" }}>
          <p style={{ ...mono, fontSize: 12, letterSpacing: ".35em", textTransform: "uppercase" }}>Lago di Como · 18.06</p>
          <h1 style={{ ...serif, fontStyle: "italic", fontWeight: 300, fontSize: "clamp(3.4rem, 10vw, 8.5rem)", lineHeight: 0.95, margin: "12px 0" }}>{title}</h1>
          <p style={{ ...serif, fontStyle: "italic", fontSize: "clamp(1.2rem, 2.4vw, 1.8rem)" }}>{tagline}</p>
        </div>
        <p className="sm-breathe" style={{ position: "absolute", left: 0, right: 0, bottom: 34, textAlign: "center", ...hand, fontSize: 26, color: "#fff6e0", pointerEvents: "none", opacity: 1 - e * 2, textShadow: "0 2px 12px rgba(0,0,0,.5)" }}>{hint}</p>
      </div>
    </div>
  );
}

// ── Olive-leaf shadows drifting over the paper ──
function LeafShadow({ style, delay = 0 }: { style: CSSProperties; delay?: number }) {
  return <img aria-hidden src={`${IMG}/leaf-shadow.webp`} alt="" className="sm-leaf" style={{ position: "absolute", pointerEvents: "none", mixBlendMode: "multiply", opacity: 0.38, animationDelay: `${delay}s`, ...style }} />;
}

// ── A film print with an orange date stamp ──
function Print({ src, stamp, alt, tilt }: { src: string; stamp: string; alt: string; tilt: number }) {
  const { ref, visible } = useReveal();
  return (
    <figure ref={ref} style={{ margin: 0, background: "#fffdf6", padding: "12px 12px 44px", boxShadow: "0 24px 50px rgba(60,45,20,.22)", transform: `rotate(${tilt}deg) translateY(${visible ? 0 : 30}px)`, opacity: visible ? 1 : 0, transition: "opacity 1.2s ease, transform 1.4s cubic-bezier(.16,1,.3,1)", position: "relative" }}>
      <div style={{ position: "relative", overflow: "hidden" }}>
        <img src={src} alt={alt} loading="lazy" style={{ display: "block", width: "100%", aspectRatio: "4 / 5", objectFit: "cover", filter: visible ? "saturate(1.05)" : "saturate(.2) brightness(1.4)", transition: "filter 2.4s ease .3s" }} />
        <span style={{ position: "absolute", right: 10, bottom: 8, ...mono, fontSize: 13, color: C.stamp, textShadow: "0 0 6px rgba(255,123,28,.7)", letterSpacing: ".05em" }}>{stamp}</span>
      </div>
    </figure>
  );
}

// ── Pressed specimen taped to the page ──
function Specimen({ src, name, latin, i }: { src: string; name: string; latin: string; i: number }) {
  const { ref, visible } = useReveal();
  return (
    <div ref={ref} className="sm-spec" style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: 10, opacity: visible ? 1 : 0, transform: visible ? "none" : "translateY(20px)", transition: `opacity 1s ease ${i * 150}ms, transform 1.2s cubic-bezier(.16,1,.3,1) ${i * 150}ms` }}>
      <div style={{ position: "relative", width: "100%", aspectRatio: "1", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <img src={src} alt={name} loading="lazy" style={{ maxWidth: "86%", maxHeight: "86%", filter: "drop-shadow(0 6px 8px rgba(60,45,20,.25))", transform: `rotate(${[-8, 6, -4, 9][i % 4]}deg)` }} />
        <span style={{ position: "absolute", top: "80%", left: "50%", width: 64, height: 20, background: "rgba(255,250,230,.6)", boxShadow: "0 1px 2px rgba(0,0,0,.08)", transform: `translate(-50%,-50%) rotate(${[-20, 15, -10, 25][i % 4]}deg)` }} />
      </div>
      <p style={{ ...hand, fontSize: 26, color: C.ink, lineHeight: 1 }}>{name}</p>
      <p style={{ ...serif, fontStyle: "italic", fontSize: 14, color: C.dim }}>{latin}</p>
    </div>
  );
}

// ── Strength as a strip of sunlight ──
function SunBar({ label, value, i }: { label: string; value: number; i: number }) {
  const { ref, visible } = useReveal();
  return (
    <div ref={ref} style={{ display: "grid", gridTemplateColumns: "minmax(130px, 200px) 1fr", gap: 18, alignItems: "center", padding: "12px 0", borderBottom: "1px solid rgba(44,42,30,.12)" }}>
      <span style={{ ...serif, fontSize: 21, color: C.ink }}>{label}</span>
      <div style={{ position: "relative", height: 14, borderRadius: 99, background: "rgba(93,107,51,.1)", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, width: visible ? `${value}%` : 0, borderRadius: 99, background: `linear-gradient(90deg, ${C.sage}, ${C.sun})`, boxShadow: "0 0 16px rgba(232,169,58,.45)", transition: `width 1.6s cubic-bezier(.16,1,.3,1) ${i * 120}ms` }} />
      </div>
    </div>
  );
}

function Head({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div style={{ textAlign: "center", marginBottom: 46 }}>
      <p style={{ ...hand, fontSize: 26, color: C.olive }}>{kicker}</p>
      <h2 style={{ ...serif, fontStyle: "italic", fontWeight: 400, fontSize: "clamp(2.2rem, 5vw, 3.8rem)", lineHeight: 1.05, color: C.ink, marginTop: 4 }}>{title}</h2>
    </div>
  );
}

const HERBS: { file: string; note: [string, string]; latin: string }[] = [
  { file: "herb-blackberry", note: ["Листья ежевики", "Blackberry leaves"], latin: "Rubus fruticosus" },
  { file: "herb-mint", note: ["Мята", "Mint"], latin: "Mentha spicata" },
  { file: "herb-jasmine", note: ["Жасмин", "Jasmine"], latin: "Jasminum officinale" },
  { file: "herb-neroli", note: ["Нероли", "Neroli"], latin: "Citrus aurantium" },
];

export default function SunlitWorld({ perfume }: WorldProps) {
  const [, navigate] = useLocation();
  const { lang, setLang, t } = useLang();
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(0); // 0 blank → 1 stamp → 2 postmark
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const g = perfume.guide!;
  const n = perfume.scentNotes;
  const L = (v: { ru: string; en: string }) => pick(lang, v);
  const prints = [`${IMG}/morning.webp`, `${IMG}/rain.webp`, `${IMG}/curtain.webp`];
  const stamps = ["'23 6 18  08:12", "'23 6 18  13:40", "'23 6 18  20:05"];
  const otherNotes = [...(n.heart ? pick(lang, n.heart) : []), ...(n.base ? pick(lang, n.base) : [])].filter((x) => !HERBS.some((h) => h.note.includes(x)));

  const send = () => {
    if (sent) { setOpen(true); return; }
    const fast = prefersReducedMotion();
    setSent(1);
    timers.current.push(window.setTimeout(() => setSent(2), fast ? 0 : 650));
    timers.current.push(window.setTimeout(() => setOpen(true), fast ? 0 : 1500));
  };

  const facts: [string, string][] = [
    [t("Стойкость", "Longevity"), L(g.longevity)],
    [t("Шлейф", "Sillage"), L(g.sillage)],
    [t("Сезон", "Season"), L(g.season)],
    [t("Когда носить", "When to wear"), L(g.time)],
  ];

  const skin: DialogSkin = {
    overlay: "rgba(44,42,30,.55)",
    panel: { ...serif, background: "#fbf6e8", color: C.ink, padding: "34px 30px", borderRadius: 4, boxShadow: "0 30px 80px rgba(44,42,30,.35)", backgroundImage: "repeating-linear-gradient(transparent 0 33px, rgba(93,107,51,.12) 33px 34px)" },
    title: { ...serif, fontStyle: "italic", fontSize: 38, color: C.olive },
    label: { ...hand, fontSize: 20, color: C.dim },
    input: { ...hand, fontSize: 24, background: "transparent", border: "none", borderBottom: `1px solid ${C.sage}`, padding: "4px 0", color: C.ink },
    button: { ...mono, fontSize: 13, letterSpacing: ".2em", textTransform: "uppercase", background: C.olive, color: "#fbf6e8", padding: "15px", borderRadius: 2 },
    accent: C.stamp,
    heading: { ru: "Открытка из Комо", en: "A postcard from Como" },
    submit: { ru: "Отправить", en: "Send" },
    sent: { ru: "Открытка в пути ☀ Скоро ответим.", en: "The postcard is on its way ☀ We'll write back soon." },
  };

  return (
    <div style={{ background: C.paper, color: C.ink, minHeight: "100vh", overflowX: "clip", ...serif }}>
      <style>{`
        .sm-breathe { animation: sm-breathe 3.5s ease-in-out infinite; } @keyframes sm-breathe { 50% { opacity: .45; } }
        .sm-leaf { animation: sm-leaf 11s ease-in-out infinite alternate; transform-origin: 0 0; }
        @keyframes sm-leaf { 0% { transform: rotate(-2deg) translate(0, 0); } 50% { transform: rotate(1.5deg) translate(10px, 6px); } 100% { transform: rotate(-1deg) translate(-6px, 10px); } }
        .sm-spec img { transition: transform .6s cubic-bezier(.2,1.4,.4,1); } .sm-spec:hover img { transform: rotate(0deg) scale(1.06) !important; }
        .sm-stamp { animation: sm-stamp .6s cubic-bezier(.3,1.5,.5,1) both; }
        @keyframes sm-stamp { from { transform: translate(-80px, -120px) rotate(-30deg) scale(1.6); opacity: 0; } }
        .sm-mark { animation: sm-mark .45s cubic-bezier(.5,0,.2,1) both; }
        @keyframes sm-mark { from { transform: scale(1.8) rotate(-20deg); opacity: 0; } }
        @media (prefers-reduced-motion: reduce) { .sm-breathe, .sm-leaf, .sm-stamp, .sm-mark { animation: none; } }
        @media (max-width: 820px) { .sm-intro, .sm-day { grid-template-columns: 1fr !important; } .sm-day > :first-child { order: 0 !important; } }
      `}</style>

      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 50, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px clamp(16px,3vw,28px)", ...mono, fontSize: 11, letterSpacing: ".15em", color: "#fffaf0", mixBlendMode: "difference" }}>
        <button onClick={() => navigate("/map")} style={{ color: "inherit" }}>← {t("КАРТА", "MAP")}</button>
        <span>SILENTIUM · COMO</span>
        <span>{(["ru", "en"] as const).map((l) => <button key={l} onClick={() => setLang(l)} style={{ marginLeft: 10, color: "inherit", opacity: lang === l ? 1 : 0.45 }}>{l.toUpperCase()}</button>)}</span>
      </nav>

      <Shutters title={perfume.name} tagline={t("Сад сразу после летнего дождя", "A garden right after summer rain")} hint={t("откройте ставни ↓", "open the shutters ↓")} />

      {/* what it smells like */}
      <section style={{ position: "relative" }}>
        <LeafShadow style={{ top: -40, right: -120, width: "min(1100px, 120vw)" }} />
        <div className="sm-intro" style={{ position: "relative", maxWidth: 1180, margin: "0 auto", padding: "110px clamp(16px,4vw,48px) 120px", display: "grid", gridTemplateColumns: "1fr 1.15fr", gap: "40px 60px", alignItems: "center" }}>
          <div style={{ position: "relative", height: "min(66vh, 600px)" }}>
            <div style={{ position: "absolute", inset: "12% 8%", borderRadius: "50%", background: "radial-gradient(circle, rgba(255,214,120,.5), transparent 65%)", filter: "blur(24px)" }} />
            <Bottle3D style={{ position: "absolute", inset: 0 }} lighting="daylight" liquid="#c7c76a" liquidOpacity={0.95} glass="#fffbe8" cap="#efe6cf" capRoughness={0.7} collar="#d6b97a" spin={0.22}
              drawLabel={(ctx, w, h) => {
                ctx.fillStyle = "#fbf6e8"; ctx.fillRect(0, 0, w, h);
                ctx.fillStyle = "#5d6b33"; ctx.textAlign = "center";
                ctx.font = "italic 300 120px 'Cormorant Garamond', serif"; ctx.fillText("Sunlit", w / 2, h * 0.45);
                ctx.font = "italic 300 96px 'Cormorant Garamond', serif"; ctx.fillText("Memories", w / 2, h * 0.7);
                ctx.font = "28px 'JetBrains Mono', monospace"; ctx.fillStyle = "#8a7a50"; ctx.fillText("COMO · 2023", w / 2, h * 0.88);
              }} />
          </div>
          <div>
            <p style={{ ...hand, fontSize: 28, color: C.olive }}>{t("как он пахнет", "what it smells like")}</p>
            <p style={{ ...serif, fontStyle: "italic", fontSize: "clamp(1.6rem, 2.9vw, 2.4rem)", lineHeight: 1.3, marginTop: 10 }}>{L(g.plain)}</p>
            <dl style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px 30px", marginTop: 40 }}>
              {facts.map(([k, v]) => (
                <div key={k} style={{ borderTop: `1px solid ${C.sage}66`, paddingTop: 12 }}>
                  <dt style={{ ...mono, fontSize: 11, letterSpacing: ".2em", textTransform: "uppercase", color: C.olive }}>{k}</dt>
                  <dd style={{ fontSize: 20, lineHeight: 1.35, marginTop: 6 }}>{v}</dd>
                </div>
              ))}
            </dl>
            {g.tip && <p style={{ ...hand, fontSize: 26, color: C.stamp, marginTop: 30, transform: "rotate(-1.5deg)" }}>☀ {L(g.tip)}</p>}
          </div>
        </div>
      </section>

      {/* one day: how it unfolds */}
      <section style={{ position: "relative", background: C.paper2, padding: "110px clamp(16px,4vw,48px) 120px" }}>
        <LeafShadow style={{ top: 0, left: -200, width: "min(1000px, 110vw)", transform: "scaleX(-1)" }} delay={-4} />
        <div style={{ position: "relative", maxWidth: 1080, margin: "0 auto" }}>
          <Head kicker={t("как раскрывается на коже", "how it unfolds on skin")} title={t("Один день у озера", "One day by the lake")} />
          <div style={{ display: "flex", flexDirection: "column", gap: "clamp(60px, 12vh, 130px)" }}>
            {g.drydown.map((d, i) => (
              <div key={i} className="sm-day" style={{ display: "grid", gridTemplateColumns: "1fr 1.1fr", gap: "30px 70px", alignItems: "center" }}>
                <div style={{ order: i % 2 ? 1 : 0, maxWidth: 420, width: "100%", justifySelf: "center" }}>
                  <Print src={prints[i]} stamp={stamps[i]} alt={L(d.when)} tilt={[-2.5, 2, -1.5][i]} />
                </div>
                <div>
                  <p style={{ ...mono, fontSize: 12, letterSpacing: ".25em", textTransform: "uppercase", color: C.stamp }}>{L(d.when)}</p>
                  <p style={{ ...serif, fontStyle: "italic", fontSize: "clamp(1.5rem, 2.6vw, 2.2rem)", lineHeight: 1.3, marginTop: 14 }}>{L(d.text)}</p>
                  <p style={{ ...hand, fontSize: 24, color: C.olive, marginTop: 16 }}>{n[d.notes] ? pick(lang, n[d.notes]!).join(", ").toLowerCase() : ""}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* herbarium */}
      <section style={{ position: "relative", padding: "110px clamp(16px,4vw,48px) 100px" }}>
        <LeafShadow style={{ top: 60, right: -160, width: "min(900px, 100vw)" }} delay={-7} />
        <div style={{ position: "relative", maxWidth: 1100, margin: "0 auto" }}>
          <Head kicker={t("гербарий", "herbarium")} title={t("Что я собрал тем летом", "What I gathered that summer")} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: "30px 24px" }}>
            {HERBS.map((h, i) => <Specimen key={h.file} i={i} src={`${IMG}/${h.file}.webp`} name={lang === "ru" ? h.note[0] : h.note[1]} latin={h.latin} />)}
          </div>
          {otherNotes.length > 0 && <p style={{ ...hand, fontSize: 26, color: C.dim, textAlign: "center", marginTop: 40 }}>{t("а ещё", "and also")}: {otherNotes.join(", ").toLowerCase()}</p>}
        </div>
      </section>

      {/* strength */}
      <section style={{ maxWidth: 860, margin: "0 auto", padding: "60px clamp(16px,4vw,48px) 120px" }}>
        <Head kicker={t("из чего он сложен", "what it's made of")} title={t("Чем длиннее луч — тем сильнее", "The longer the ray, the stronger")} />
        {g.facets.map((f, i) => <SunBar key={i} i={i} label={L(f.label)} value={f.value} />)}
      </section>

      {/* scenes */}
      <section style={{ position: "relative", background: C.paper2, padding: "110px clamp(16px,4vw,48px) 120px" }}>
        <LeafShadow style={{ bottom: 0, left: -100, width: "min(1000px, 110vw)" }} delay={-2} />
        <div className="sm-intro" style={{ position: "relative", maxWidth: 1120, margin: "0 auto", display: "grid", gridTemplateColumns: "0.9fr 1.1fr", gap: "40px 70px", alignItems: "center" }}>
          <Print src={`${IMG}/barefoot.webp`} stamp="'23 6 18  17:31" alt={t("Босиком по мокрой траве", "Barefoot on wet grass")} tilt={-2} />
          <div>
            <p style={{ ...hand, fontSize: 28, color: C.olive }}>{t("на что это похоже", "what it reminds you of")}</p>
            {pick(lang, g.scenes).map((s, i) => (
              <p key={i} style={{ ...serif, fontStyle: "italic", fontSize: "clamp(1.3rem, 2.3vw, 1.85rem)", lineHeight: 1.35, padding: "16px 0", borderBottom: i < 3 ? "1px solid rgba(44,42,30,.12)" : "none" }}>{s}</p>
            ))}
          </div>
        </div>
      </section>

      {/* postcard request */}
      <section style={{ padding: "110px 16px 140px", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <Head kicker={t("заявка", "request")} title={t("Напишите нам открытку", "Send us a postcard")} />
        <button onClick={send} aria-label={t("Отправить открытку и оставить заявку", "Send the postcard and leave a request")} style={{ position: "relative", width: "min(760px, 100%)", aspectRatio: "1400 / 933", transform: "rotate(-1.2deg)", boxShadow: "0 30px 70px rgba(60,45,20,.28)", textAlign: "left" }}>
          <img src={`${IMG}/postcard.webp`} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />
          <div style={{ position: "absolute", left: "7%", top: "14%", width: "38%", ...hand, color: "#2b3a6b", fontSize: "clamp(16px, 2.8vw, 27px)", lineHeight: 1.3 }}>
            Ciao! ☀<br />{t("Хочу Sunlit Memories. Напишите мне, как получить флакон.", "I'd love Sunlit Memories. Write to me about getting a bottle.")}
          </div>
          <div style={{ position: "absolute", left: "55%", top: "45%", ...hand, color: "#2b3a6b", fontSize: "clamp(16px, 2.6vw, 25px)" }}>Silentium<br />Lago di Como</div>
          <span style={{ position: "absolute", right: "3.8%", top: "4%", width: "13.5%", aspectRatio: "281 / 360" }}>
            {sent >= 1 && <img className="sm-stamp" src={`${IMG}/stamp.webp`} alt="" style={{ width: "100%", height: "100%", display: "block", filter: "drop-shadow(0 2px 3px rgba(0,0,0,.25))" }} />}
          </span>
          {sent >= 2 && (
            <svg className="sm-mark" viewBox="0 0 200 120" style={{ position: "absolute", right: "8.5%", top: "8%", width: "26%", color: "rgba(43,58,107,.75)" }} aria-hidden>
              <circle cx="58" cy="60" r="44" fill="none" stroke="currentColor" strokeWidth="3" />
              <circle cx="58" cy="60" r="34" fill="none" stroke="currentColor" strokeWidth="1.5" />
              <text x="58" y="56" textAnchor="middle" fill="currentColor" style={{ ...mono, fontSize: 13, fontWeight: 700 }}>COMO</text>
              <text x="58" y="74" textAnchor="middle" fill="currentColor" style={{ ...mono, fontSize: 11 }}>18·06·23</text>
              {[0, 1, 2, 3].map((k) => <path key={k} d={`M 106 ${36 + k * 14} q 12 -7 24 0 t 24 0 t 24 0 t 24 0`} fill="none" stroke="currentColor" strokeWidth="2.5" />)}
            </svg>
          )}
          {!sent && <span className="sm-breathe" style={{ position: "absolute", right: "6%", bottom: "8%", ...mono, fontSize: 12, letterSpacing: ".2em", textTransform: "uppercase", color: C.stamp }}>{t("нажмите, чтобы отправить", "tap to send")}</span>}
        </button>
        <p style={{ ...mono, fontSize: 12, color: C.dim, marginTop: 40 }}>Extrait de parfum · {perfume.releaseDate} · {L(perfume.origin.location)}</p>
      </section>

      <RequestDialog open={open} onClose={() => setOpen(false)} perfumeName={perfume.name} skin={skin} />
    </div>
  );
}
