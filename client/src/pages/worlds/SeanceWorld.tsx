// Seance — a night in an old stone chapel.
// The hero is the chapel in the dark; the cursor is a candle that lights it up where it passes and
// leaves a slowly fading glow. Below, plain words: what it smells like, how it changes on skin
// (pages of an old book beside a swinging censer), how strong it is (beeswax candles),
// what it reminds you of (scenes surfacing from smoke), and a wax seal to send a request.

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useLocation } from "wouter";
import { useLang } from "@/contexts/LangContext";
import Bottle3D from "@/components/Bottle3D";
import RequestDialog, { type DialogSkin } from "@/components/RequestDialog";
import { useReveal } from "@/lib/useReveal";
import { pick, prefersReducedMotion, type WorldProps } from "./shared";

const C = {
  bg: "#070504",
  ink: "#e6d8bc",
  dim: "rgba(230,216,188,0.62)",
  faint: "rgba(230,216,188,0.3)",
  gold: "#c9a466",
  paperInk: "#2a1a0e",
};
const display: CSSProperties = { fontFamily: "'Ruslan Display', 'Cormorant Garamond', serif", fontWeight: 400 };
const serif: CSSProperties = { fontFamily: "'Old Standard TT', 'Cormorant Garamond', serif" };
const IMG = "/images/seance";

// ── The chapel: dark photo below, lit photo drawn through a mask the candle paints ──
function Chapel({ hint }: { hint: string }) {
  const box = useRef<HTMLDivElement>(null);
  const cv = useRef<HTMLCanvasElement>(null);
  const flame = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = box.current!, canvas = cv.current!;
    const ctx = canvas.getContext("2d")!;
    const mask = document.createElement("canvas");
    const mctx = mask.getContext("2d")!;
    const lit = new Image();
    lit.src = `${IMG}/chapel-lit.webp`;
    const reduced = prefersReducedMotion();
    const dpr = Math.min(1.5, window.devicePixelRatio || 1);
    const M = 0.25; // mask resolution
    let w = 0, h = 0;
    const fit = () => {
      w = el.clientWidth; h = el.clientHeight;
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      mask.width = Math.max(1, Math.round(w * M)); mask.height = Math.max(1, Math.round(h * M));
    };
    fit();
    const ro = new ResizeObserver(fit); ro.observe(el);

    // pointer, or a slowly wandering flame when nobody is moving one
    let px = -1, py = -1, lastMove = -1e9, visible = true;
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      px = e.clientX - r.left; py = e.clientY - r.top; lastMove = performance.now();
    };
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerdown", onMove);
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; });
    io.observe(el);

    const cover = () => {
      const s = Math.max(w / lit.width, h / lit.height);
      const dw = lit.width * s, dh = lit.height * s;
      return [(w - dw) / 2, (h - dh) / 2, dw, dh] as const;
    };
    const paint = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      if (!lit.complete || !lit.width) return;
      ctx.globalCompositeOperation = "source-over";
      ctx.drawImage(lit, ...cover());
      ctx.globalCompositeOperation = "destination-in";
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(mask, 0, 0, w, h);
      ctx.globalCompositeOperation = "source-over";
    };

    if (reduced) {
      lit.onload = () => { mctx.fillStyle = "rgba(0,0,0,.55)"; mctx.fillRect(0, 0, mask.width, mask.height); paint(); };
      return () => { ro.disconnect(); io.disconnect(); el.removeEventListener("pointermove", onMove); el.removeEventListener("pointerdown", onMove); };
    }

    let raf = 0, prev = performance.now();
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (!visible) { prev = now; return; }
      const dt = Math.min(0.1, (now - prev) / 1000); prev = now;
      let x = px, y = py;
      if (now - lastMove > 2500 || px < 0) {
        const t = now / 1000;
        x = w * (0.5 + 0.3 * Math.sin(t * 0.23) + 0.08 * Math.sin(t * 0.71));
        y = h * (0.5 + 0.18 * Math.sin(t * 0.31 + 1) + 0.05 * Math.sin(t * 0.9));
      }
      // the glow left behind cools down over ~3 s
      mctx.globalCompositeOperation = "destination-out";
      mctx.fillStyle = `rgba(0,0,0,${(1 - Math.exp(-dt / 1.4)).toFixed(4)})`;
      mctx.fillRect(0, 0, mask.width, mask.height);
      mctx.globalCompositeOperation = "source-over";
      const flick = 1 + Math.sin(now / 70) * 0.04 + Math.sin(now / 23) * 0.03;
      const r = Math.max(150, Math.min(w, h) * 0.32) * M * flick;
      const g = mctx.createRadialGradient(x * M, y * M, 0, x * M, y * M, r);
      g.addColorStop(0, "rgba(0,0,0,0.85)");
      g.addColorStop(0.3, "rgba(0,0,0,0.55)");
      g.addColorStop(0.65, "rgba(0,0,0,0.16)");
      g.addColorStop(1, "rgba(0,0,0,0)");
      mctx.fillStyle = g;
      mctx.beginPath(); mctx.arc(x * M, y * M, r, 0, Math.PI * 2); mctx.fill();
      if (flame.current) flame.current.style.transform = `translate(${x - 6}px, ${y - 30}px)`;
      paint();
    };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); el.removeEventListener("pointermove", onMove); el.removeEventListener("pointerdown", onMove); };
  }, []);

  return (
    <div ref={box} aria-hidden style={{ position: "absolute", inset: 0, overflow: "hidden", cursor: "none" }}>
      <img src={`${IMG}/chapel-dark.webp`} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
      <canvas ref={cv} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />
      <div ref={flame} style={{ position: "absolute", left: 0, top: 0, pointerEvents: "none" }}><div className="sn-flame" /></div>
      <p className="sn-breathe" style={{ position: "absolute", left: 0, right: 0, bottom: 28, textAlign: "center", ...serif, fontSize: 13, letterSpacing: "0.35em", textTransform: "uppercase", color: C.ink, zIndex: 2, textShadow: "0 0 12px #000" }}>{hint}</p>
    </div>
  );
}

// ── Text that surfaces word by word, like ink appearing ──
function GhostText({ text, style }: { text: string; style?: CSSProperties }) {
  const { ref, visible } = useReveal<HTMLParagraphElement>();
  return (
    <p ref={ref} style={style}>
      {text.split(" ").map((w, i) => (
        <span key={i} style={{ display: "inline-block", marginRight: "0.28em", opacity: visible ? 1 : 0, filter: visible ? "blur(0)" : "blur(8px)", transition: `opacity 1.3s ease ${i * 60}ms, filter 1.5s ease ${i * 60}ms` }}>{w}</span>
      ))}
    </p>
  );
}

// ── Censer swinging on its chains, smoke rising from it ──
function Censer() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (prefersReducedMotion()) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => { if (ref.current) ref.current.style.transform = `rotate(${Math.sin(window.scrollY / 220) * 10}deg)`; });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { cancelAnimationFrame(raf); window.removeEventListener("scroll", onScroll); };
  }, []);
  return (
    <div aria-hidden style={{ position: "relative", height: "100%", display: "flex", justifyContent: "center" }}>
      <div ref={ref} style={{ position: "relative", height: "min(80vh, 720px)", transformOrigin: "50% 0", transition: "transform .6s cubic-bezier(.3,.7,.4,1)" }}>
      <div className="sn-sway" style={{ position: "relative", height: "100%", transformOrigin: "50% 0" }}>
        <img src={`${IMG}/censer.webp`} alt="" style={{ height: "100%", display: "block", filter: "drop-shadow(0 20px 40px rgba(0,0,0,.6)) brightness(1.05)" }} />
        <div style={{ position: "absolute", left: "50%", bottom: "16%", width: 0, height: 0 }}>
          <img className="sn-smoke a" src={`${IMG}/smoke-1.webp`} alt="" />
          <img className="sn-smoke b" src={`${IMG}/smoke-3.webp`} alt="" />
          <img className="sn-smoke c" src={`${IMG}/smoke-1.webp`} alt="" />
        </div>
      </div>
      </div>
    </div>
  );
}

// ── One page torn from an old book ──
function Page({ when, text, notes, i }: { when: string; text: string; notes: string[]; i: number }) {
  const { ref, visible } = useReveal();
  return (
    <article ref={ref} style={{ position: "relative", aspectRatio: "640 / 943", width: "min(440px, 100%)", marginLeft: i % 2 ? "auto" : 0, transform: `rotate(${[-2.5, 1.8, -1.2][i % 3]}deg) translateY(${visible ? 0 : 40}px)`, opacity: visible ? 1 : 0, transition: "opacity 1.2s ease, transform 1.4s cubic-bezier(.16,1,.3,1)" }}>
      <img src={`${IMG}/page.webp`} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", filter: "drop-shadow(0 30px 40px rgba(0,0,0,.55))" }} />
      <div style={{ position: "relative", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 16%", color: C.paperInk }}>
        <p style={{ ...serif, fontSize: 12, letterSpacing: "0.3em", textTransform: "uppercase", color: "#8a2a1c" }}>{["I", "II", "III"][i]} · {when}</p>
        <p style={{ ...serif, fontStyle: "italic", fontSize: "clamp(1.2rem, 2.2vw, 1.6rem)", lineHeight: 1.45, marginTop: 18 }}>{text}</p>
        <div style={{ height: 1, background: "rgba(42,26,14,.25)", margin: "22px 0 16px" }} />
        <p style={{ ...serif, fontSize: 14, lineHeight: 1.7, color: "rgba(42,26,14,.75)" }}>{notes.join(" · ")}</p>
      </div>
    </article>
  );
}

// ── A beeswax candle per facet; its height is the strength ──
function Candle({ value, label, i }: { value: number; label: string; i: number }) {
  const { ref, visible } = useReveal();
  const h = 40 + value * 2.2;
  return (
    <div ref={ref} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, width: 96 }}>
      <div style={{ height: 270, display: "flex", flexDirection: "column", justifyContent: "flex-end", alignItems: "center" }}>
        <div className="sn-flame" style={{ opacity: visible ? 1 : 0, transition: `opacity .8s ease ${i * 160 + 900}ms`, animationDelay: `${i * 300}ms` }} />
        <div style={{ height: visible ? h : 0, overflow: "hidden", transition: `height 1.6s cubic-bezier(.16,1,.3,1) ${i * 160}ms`, display: "flex", alignItems: "flex-start" }}>
          <img src={`${IMG}/candle.webp`} alt="" style={{ height: 262, width: "auto", display: "block", filter: "drop-shadow(0 0 18px rgba(255,170,80,.25))" }} />
        </div>
      </div>
      <span style={{ ...serif, fontSize: 13, letterSpacing: "0.12em", textTransform: "uppercase", color: C.ink, textAlign: "center", lineHeight: 1.3 }}>{label}</span>
      <span style={{ display: "flex", gap: 3 }} aria-label={`${value}/100`}>
        {Array.from({ length: 5 }).map((_, k) => <span key={k} style={{ width: 6, height: 6, borderRadius: "50%", background: k < Math.round(value / 20) ? C.gold : "rgba(201,164,102,.18)" }} />)}
      </span>
    </div>
  );
}

export default function SeanceWorld({ perfume }: WorldProps) {
  const [, navigate] = useLocation();
  const { lang, setLang, t } = useLang();
  const [open, setOpen] = useState(false);
  const [stamped, setStamped] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const g = perfume.guide!;
  const n = perfume.scentNotes;
  const gallery = perfume.gallery ?? [];
  const L = (v: { ru: string; en: string }) => pick(lang, v);

  const stamp = () => {
    setStamped(true);
    timer.current = window.setTimeout(() => setOpen(true), prefersReducedMotion() ? 0 : 750);
  };

  const skin: DialogSkin = {
    overlay: "rgba(3,2,1,0.9)",
    panel: { background: "radial-gradient(circle at 50% 0%, #2a1d12, #0d0906 70%)", border: `1px solid ${C.gold}55`, padding: "2.5rem 2rem", color: C.ink, borderRadius: "160px 160px 6px 6px", paddingTop: "4.5rem" },
    title: { ...display, fontSize: 34, color: C.gold, marginTop: 4 },
    label: { ...serif, fontSize: 12, letterSpacing: "0.18em", textTransform: "uppercase", color: C.dim },
    input: { background: "transparent", border: "none", borderBottom: `1px solid ${C.gold}55`, padding: "8px 2px", color: C.ink, ...serif, fontSize: 16 },
    button: { background: "#5a0f12", color: "#f0dcc0", padding: "14px", ...display, fontSize: 18, letterSpacing: 2, borderRadius: 999, boxShadow: "inset 0 -4px 10px rgba(0,0,0,.5), 0 0 30px rgba(110,25,20,.5)" },
    accent: C.gold,
    heading: { ru: "Заявка", en: "Request" },
    submit: { ru: "Отправить", en: "Send" },
    sent: { ru: "Письмо запечатано. Мы скоро ответим.", en: "The letter is sealed. We'll answer soon." },
  };

  const facts: [string, string][] = [
    [t("Шлейф", "Sillage"), L(g.sillage)],
    [t("Сезон", "Season"), L(g.season)],
    [t("Время", "Time of day"), L(g.time)],
  ];

  return (
    <div style={{ background: C.bg, color: C.ink, minHeight: "100vh", overflowX: "clip", ...serif }}>
      <style>{`
        .sn-breathe { animation: sn-breathe 4s ease-in-out infinite; } @keyframes sn-breathe { 50% { opacity: .35; } }
        .sn-sway { animation: sn-sway 5s ease-in-out infinite; } @keyframes sn-sway { 0%,100% { rotate: -4deg; } 50% { rotate: 4deg; } }
        .sn-smoke { position: absolute; bottom: 0; width: 120px; transform-origin: 50% 100%; opacity: 0; pointer-events: none; animation: sn-rise 9s ease-out infinite; }
        .sn-smoke.a { left: -70px; } .sn-smoke.b { left: -30px; width: 90px; animation-delay: 3s; } .sn-smoke.c { left: -60px; animation-delay: 6s; transform: scaleX(-1); }
        @keyframes sn-rise { 0% { opacity: 0; translate: 0 30px; scale: .6 .5; } 20% { opacity: .75; } 100% { opacity: 0; translate: 20px -420px; scale: 1.3 1.6; } }
        .sn-flame { width: 12px; height: 26px; margin-bottom: -9px; position: relative; z-index: 1; border-radius: 50% 50% 45% 45% / 65% 65% 35% 35%;
          background: radial-gradient(circle at 50% 75%, #fff6d8 0 18%, #ffc35a 40%, #ff7a1a 70%, transparent 72%);
          box-shadow: 0 0 22px 8px rgba(255,150,50,.35), 0 0 80px 24px rgba(255,120,40,.12);
          animation: sn-flick 2.2s infinite ease-in-out; transform-origin: 50% 90%; }
        @keyframes sn-flick { 0%,100% { transform: scale(1) rotate(-1deg); } 25% { transform: scale(1.06,.94) rotate(2deg); } 50% { transform: scale(.95,1.08) rotate(-2deg); } 75% { transform: scale(1.03,.97) rotate(1deg); } }
        .sn-seal { transition: transform .5s cubic-bezier(.3,1.6,.5,1), filter .5s; }
        .sn-seal:hover { transform: scale(1.04) rotate(-3deg); }
        .sn-stamped { animation: sn-stamp .7s cubic-bezier(.5,0,.2,1) both; }
        @keyframes sn-stamp { 0% { transform: scale(1.5) rotate(-12deg); filter: drop-shadow(0 40px 30px rgba(0,0,0,.6)); } 55% { transform: scale(.92) rotate(2deg); } 100% { transform: scale(1) rotate(0); } }
        .sn-arch img { transition: transform 1.2s cubic-bezier(.16,1,.3,1), filter 1.2s; filter: sepia(.35) brightness(.7); }
        .sn-arch:hover img { transform: scale(1.06); filter: sepia(.1) brightness(1); }
        @media (prefers-reduced-motion: reduce) { .sn-breathe, .sn-sway, .sn-smoke, .sn-flame, .sn-stamped { animation: none; } .sn-smoke { opacity: .5; } }
        @media (max-width: 820px) {
          .sn-split { display: block !important; }
          .sn-censer { height: 100svh !important; margin-bottom: -100svh; opacity: .45; z-index: 0; pointer-events: none; }
          .sn-pages { position: relative; z-index: 1; }
          .sn-intro { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* nav */}
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 50, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px clamp(16px,3vw,28px)", fontSize: 12, letterSpacing: "0.2em", textTransform: "uppercase", background: "linear-gradient(rgba(7,5,4,.7), transparent)" }}>
        <button onClick={() => navigate("/map")} style={{ color: C.dim, ...serif, letterSpacing: "0.2em" }}>← {t("к карте", "to the map")}</button>
        <span style={{ ...display, color: C.gold, letterSpacing: "0.3em" }}>Silentium · № I</span>
        <span style={{ display: "flex", gap: 10 }}>
          {(["ru", "en"] as const).map((l) => <button key={l} onClick={() => setLang(l)} style={{ color: lang === l ? C.gold : C.faint, ...serif }}>{l.toUpperCase()}</button>)}
        </span>
      </nav>

      {/* hero: the chapel */}
      <header style={{ position: "relative", height: "100svh", minHeight: 560 }}>
        <Chapel hint={t("Ведите свечой — темнота отступит", "Move the candle — the dark gives way")} />
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: `linear-gradient(0deg, ${C.bg} 0%, rgba(7,5,4,0) 35%), linear-gradient(90deg, rgba(7,5,4,.75) 0%, rgba(7,5,4,0) 55%)` }} />
        <div style={{ position: "absolute", left: "clamp(16px,6vw,90px)", bottom: "clamp(70px,14vh,140px)", pointerEvents: "none", maxWidth: 620 }}>
          <p style={{ fontSize: 12, letterSpacing: "0.4em", textTransform: "uppercase", color: C.gold }}>Extrait de parfum · № I</p>
          <h1 style={{ ...display, fontSize: "clamp(4rem, 13vw, 10rem)", lineHeight: 0.9, color: C.ink, margin: "14px 0 18px", textShadow: "0 0 50px rgba(255,160,70,.3)" }}>{perfume.name}</h1>
          <p style={{ fontStyle: "italic", fontSize: "clamp(1.2rem, 2.2vw, 1.7rem)", color: C.ink }}>{t("Ладан и дым в старой часовне ночью", "Incense and smoke in an old chapel at night")}</p>
        </div>
      </header>

      {/* what it smells like */}
      <section className="sn-intro" style={{ maxWidth: 1180, margin: "0 auto", padding: "80px clamp(16px,4vw,48px) 120px", display: "grid", gridTemplateColumns: "1fr 1.1fr", gap: "40px 60px", alignItems: "center" }}>
        <div style={{ position: "relative", height: "min(70vh, 620px)" }}>
          <div style={{ position: "absolute", inset: "15% 10%", borderRadius: "50%", background: "radial-gradient(circle, rgba(255,150,60,.22), transparent 65%)", filter: "blur(20px)" }} />
          <Bottle3D style={{ position: "absolute", inset: 0 }} lighting="candle" liquid="#5a3712" liquidOpacity={0.94} glass="#f1e3c6" cap="#0a0908" collar="#a8875a" spin={0.18}
            drawLabel={(ctx, w, h) => {
              ctx.fillStyle = "#d9ccb0"; ctx.fillRect(0, 0, w, h);
              ctx.strokeStyle = "#3b2a18"; ctx.lineWidth = 6; ctx.strokeRect(22, 22, w - 44, h - 44);
              ctx.lineWidth = 2; ctx.strokeRect(38, 38, w - 76, h - 76);
              ctx.fillStyle = "#1c130b"; ctx.textAlign = "center";
              ctx.font = "150px 'Ruslan Display', serif"; ctx.fillText("SEANCE", w / 2, h * 0.58);
              ctx.font = "italic 38px 'Old Standard TT', serif"; ctx.fillText("extrait de parfum · № I", w / 2, h * 0.8);
              ctx.font = "30px 'Old Standard TT', serif"; ctx.fillText("S I L E N T I U M", w / 2, h * 0.24);
            }} />
        </div>
        <div>
          <p style={{ fontSize: 12, letterSpacing: "0.4em", textTransform: "uppercase", color: C.gold }}>{t("Как он пахнет", "What it smells like")}</p>
          <GhostText text={L(g.plain)} style={{ fontStyle: "italic", fontSize: "clamp(1.5rem, 2.8vw, 2.3rem)", lineHeight: 1.35, color: C.ink, marginTop: 18 }} />
          <dl style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "22px 30px", marginTop: 40 }}>
            {facts.map(([k, v]) => (
              <div key={k} style={{ borderTop: `1px solid ${C.gold}44`, paddingTop: 12 }}>
                <dt style={{ fontSize: 11, letterSpacing: "0.25em", textTransform: "uppercase", color: C.gold }}>{k}</dt>
                <dd style={{ fontSize: 17, lineHeight: 1.4, marginTop: 6, color: C.ink }}>{v}</dd>
              </div>
            ))}
          </dl>
          {g.tip && <p style={{ marginTop: 28, fontSize: 15, color: C.dim, display: "flex", gap: 10 }}><span style={{ color: C.gold }}>✦</span>{L(g.tip)}</p>}
        </div>
      </section>

      {/* how it changes: censer + book pages */}
      <section style={{ maxWidth: 1180, margin: "0 auto", padding: "40px clamp(16px,4vw,48px) 140px" }}>
        <Title kicker={t("Как раскрывается на коже", "How it unfolds on skin")} title={t("Три страницы одной ночи", "Three pages of one night")} />
        <div className="sn-split" style={{ display: "grid", gridTemplateColumns: "0.8fr 1.2fr", gap: 40, marginTop: 40 }}>
          <div className="sn-censer" style={{ position: "sticky", top: 0, height: "100vh" }}><Censer /></div>
          <div className="sn-pages" style={{ display: "flex", flexDirection: "column", gap: "clamp(40px, 10vh, 110px)", padding: "6vh 0" }}>
            {g.drydown.map((d, i) => (
              <Page key={i} i={i} when={L(d.when)} text={L(d.text)} notes={n[d.notes] ? pick(lang, n[d.notes]!) : []} />
            ))}
          </div>
        </div>
      </section>

      {/* strength: candles */}
      <section style={{ maxWidth: 1080, margin: "0 auto", padding: "40px 24px 140px" }}>
        <Title kicker={t("Из чего он сложен", "What it's made of")} title={t("Чем выше свеча — тем сильнее", "The taller the candle, the stronger")} />
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "30px 26px", marginTop: 40 }}>
          {g.facets.map((f, i) => <Candle key={i} i={i} value={f.value} label={L(f.label)} />)}
        </div>
      </section>

      {/* scenes */}
      <section style={{ position: "relative", padding: "60px 24px 140px", overflow: "hidden" }}>
        <img className="sn-smoke a" src={`${IMG}/smoke-1.webp`} alt="" style={{ left: "8%", bottom: 0, width: 260, animationDuration: "14s" }} />
        <img className="sn-smoke b" src={`${IMG}/smoke-3.webp`} alt="" style={{ left: "auto", right: "10%", bottom: 0, width: 200, animationDuration: "16s" }} />
        <div style={{ position: "relative", maxWidth: 820, margin: "0 auto", textAlign: "center" }}>
          <Title kicker={t("На что это похоже", "What it reminds you of")} title={t("Если закрыть глаза", "If you close your eyes")} />
          {pick(lang, g.scenes).map((s, i) => (
            <div key={i} style={{ padding: "5vh 0 0" }}>
              <GhostText text={s} style={{ fontStyle: "italic", fontSize: "clamp(1.3rem, 2.6vw, 2rem)", lineHeight: 1.4, color: C.ink }} />
              {i < g.scenes.ru.length - 1 && <p style={{ color: C.gold, marginTop: "5vh", opacity: 0.6 }}>✦</p>}
            </div>
          ))}
        </div>
      </section>

      {/* gallery */}
      {gallery.length > 0 && (
        <section style={{ padding: "20px clamp(16px,4vw,48px) 140px" }}>
          <Title kicker={t("Где он живёт", "Where it lives")} title={t("Места этого запаха", "Places of this scent")} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 18, maxWidth: 1240, margin: "30px auto 0", alignItems: "end" }}>
            {gallery.map((src, i) => (
              <figure key={src} className="sn-arch" style={{ margin: 0, overflow: "hidden", borderRadius: "999px 999px 4px 4px", border: `1px solid ${C.gold}40`, aspectRatio: i % 2 ? "3 / 5" : "3 / 4.4", boxShadow: "0 30px 60px rgba(0,0,0,.6)" }}>
                <img src={src} alt="" loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              </figure>
            ))}
          </div>
        </section>
      )}

      {/* request: seal the letter */}
      <section style={{ padding: "20px 16px 140px", display: "flex", justifyContent: "center" }}>
        <div style={{ position: "relative", width: "min(620px, 100%)", aspectRatio: "640 / 943", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "0 13%" }}>
          <img src={`${IMG}/page.webp`} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", transform: "rotate(-1deg)", filter: "drop-shadow(0 40px 60px rgba(0,0,0,.6))" }} />
          <div style={{ position: "relative", width: "100%", color: C.paperInk }}>
            <p style={{ ...serif, fontSize: 12, letterSpacing: "0.3em", textTransform: "uppercase", color: "#8a2a1c" }}>{t("Заявка", "Request")}</p>
            <p style={{ ...display, fontSize: "clamp(1.8rem, 4.5vw, 2.6rem)", lineHeight: 1.1, margin: "14px 0" }}>{t("Хотите Seance?", "Want Seance?")}</p>
            <p style={{ ...serif, fontStyle: "italic", fontSize: "clamp(16px, 2.4vw, 19px)", lineHeight: 1.5 }}>{t("Оставьте контакт — мы напишем вам и расскажем, как получить флакон.", "Leave your contact — we'll write back and tell you how to get a bottle.")}</p>
            <button onClick={stamp} aria-label={t("Запечатать письмо и оставить заявку", "Seal the letter and send a request")} className={`sn-seal ${stamped ? "sn-stamped" : ""}`} style={{ display: "block", margin: "28px auto 10px", width: "min(170px, 40vw)" }}>
              <img src={`${IMG}/seal.webp`} alt="" style={{ width: "100%", display: "block", filter: "drop-shadow(0 10px 14px rgba(0,0,0,.45))" }} />
            </button>
            <p style={{ ...serif, fontSize: 12, letterSpacing: "0.25em", textTransform: "uppercase", color: "rgba(42,26,14,.7)" }}>{t("Нажмите на печать", "Press the seal")}</p>
            <p style={{ ...serif, fontSize: 13, marginTop: 26, color: "rgba(42,26,14,.65)" }}>Extrait de parfum · {perfume.releaseDate} · {L(perfume.origin.location)}</p>
          </div>
        </div>
      </section>

      <RequestDialog open={open} onClose={() => { setOpen(false); setStamped(false); }} perfumeName={perfume.name} skin={skin} />
    </div>
  );
}

function Title({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div style={{ textAlign: "center" }}>
      <p style={{ fontSize: 12, letterSpacing: "0.4em", textTransform: "uppercase", color: C.gold }}>{kicker}</p>
      <h2 style={{ ...display, fontSize: "clamp(2rem, 4.5vw, 3.4rem)", color: C.ink, marginTop: 10, lineHeight: 1.1 }}>{title}</h2>
    </div>
  );
}
