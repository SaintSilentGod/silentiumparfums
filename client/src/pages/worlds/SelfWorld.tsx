// Self addicted — 3 a.m., a mirror and a phone.
// Everything is reflected; notes are a diary page; the profile is a row of filling hearts;
// memories are iMessage bubbles typed live; the request is a lipstick kiss on the mirror.

import { useEffect, useState, type CSSProperties } from "react";
import { useLocation } from "wouter";
import { useLang } from "@/contexts/LangContext";
import Bottle3D from "@/components/Bottle3D";
import RequestDialog, { type DialogSkin } from "@/components/RequestDialog";
import { useReveal } from "@/lib/useReveal";
import { fragmentText, pick, prefersReducedMotion, type WorldProps } from "./shared";

const C = { bg: "#120c0e", pink: "#ffb3c8", rose: "#e8577a", cream: "#fbeef0", dim: "rgba(251,238,240,.55)", lilac: "#c9a8ff" };
const serif: CSSProperties = { fontFamily: "'Playfair Display', serif" };
const hand: CSSProperties = { fontFamily: "'Caveat', cursive" };
const sans: CSSProperties = { fontFamily: "-apple-system, 'SF Pro Text', 'Manrope', sans-serif" };
const mono: CSSProperties = { fontFamily: "'JetBrains Mono', monospace" };

function Sparkles() {
  return (
    <div aria-hidden style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 1 }}>
      {Array.from({ length: 40 }).map((_, i) => (
        <span key={i} className="sa-spark" style={{ left: `${(i * 37) % 100}%`, top: `${(i * 61) % 100}%`, animationDelay: `${(i % 9) * 0.45}s`, fontSize: 8 + (i % 4) * 4 }}>✦</span>
      ))}
    </div>
  );
}

function Heart({ value, label, i }: { value: number; label: string; i: number }) {
  const { ref, visible } = useReveal();
  const id = `sa-h-${i}`;
  return (
    <div ref={ref} style={{ textAlign: "center" }}>
      <svg viewBox="0 0 100 92" style={{ width: "100%", maxWidth: 120 }}>
        <defs><clipPath id={id}><path d="M50 88 C 20 66, 2 48, 2 28 C 2 12, 14 2, 28 2 C 38 2, 46 8, 50 16 C 54 8, 62 2, 72 2 C 86 2, 98 12, 98 28 C 98 48, 80 66, 50 88 Z" /></clipPath></defs>
        <path d="M50 88 C 20 66, 2 48, 2 28 C 2 12, 14 2, 28 2 C 38 2, 46 8, 50 16 C 54 8, 62 2, 72 2 C 86 2, 98 12, 98 28 C 98 48, 80 66, 50 88 Z" fill="rgba(255,179,200,.08)" stroke={C.pink} strokeWidth="1.5" />
        <g clipPath={`url(#${id})`}>
          <rect x="0" width="100" height="92" fill="url(#sa-grad)" style={{ transform: `translateY(${visible ? 92 - value * 0.92 : 92}px)`, transition: `transform 2s cubic-bezier(.16,1,.3,1) ${i * 160}ms` }} />
        </g>
        <defs><linearGradient id="sa-grad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ffb3c8" /><stop offset="1" stopColor="#e8577a" /></linearGradient></defs>
      </svg>
      <p style={{ ...serif, fontStyle: "italic", fontSize: 18, marginTop: 6 }}>{label}</p>
      <p style={{ ...mono, fontSize: 11, color: C.dim }}>{value}%</p>
    </div>
  );
}

function Chat({ messages, t }: { messages: string[]; t: (ru: string, en: string) => string }) {
  const { ref, visible } = useReveal();
  const [shown, setShown] = useState(0);
  const [typing, setTyping] = useState(false);
  useEffect(() => {
    if (!visible) return;
    if (prefersReducedMotion()) { setShown(messages.length); return; }
    let raf = 0; const t0 = performance.now();
    const step = (now: number) => {
      const e = now - t0;
      const k = Math.min(messages.length, Math.floor(e / 1500));
      setShown(k); setTyping(k < messages.length && e % 1500 > 500);
      if (k < messages.length) raf = requestAnimationFrame(step);
      else setTyping(false);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [visible, messages.length]);
  const fromMe = (i: number) => i % 2 === 1;
  return (
    <div ref={ref} style={{ ...sans, width: "min(380px, 100%)", margin: "0 auto", borderRadius: 44, padding: "16px 14px 22px", background: "#000", border: "10px solid #1c1c1e", boxShadow: "0 40px 100px rgba(232,87,122,.25), 0 0 0 2px #333" }}>
      <div style={{ textAlign: "center", padding: "6px 0 14px", borderBottom: "1px solid #222" }}>
        <div style={{ width: 46, height: 46, borderRadius: "50%", margin: "0 auto", background: `linear-gradient(135deg, ${C.pink}, ${C.lilac})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🪞</div>
        <p style={{ color: "#fff", fontSize: 12, marginTop: 4 }}>{t("я ♡", "me ♡")}</p>
      </div>
      <p style={{ textAlign: "center", color: "#8e8e93", fontSize: 11, margin: "12px 0" }}>{t("Сегодня 03:12", "Today 3:12 AM")}</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, minHeight: 280 }}>
        {messages.slice(0, shown).map((m, i) => (
          <div key={i} style={{ alignSelf: fromMe(i) ? "flex-end" : "flex-start", maxWidth: "78%", padding: "8px 13px", borderRadius: 18, borderBottomRightRadius: fromMe(i) ? 4 : 18, borderBottomLeftRadius: fromMe(i) ? 18 : 4, background: fromMe(i) ? "#0a84ff" : "#262629", color: "#fff", fontSize: 15, lineHeight: 1.3, animation: "sa-pop .35s cubic-bezier(.2,1.6,.4,1)" }}>{m}</div>
        ))}
        {typing && <div style={{ alignSelf: shown % 2 ? "flex-end" : "flex-start", padding: "10px 14px", borderRadius: 18, background: shown % 2 ? "#0a84ff" : "#262629", display: "flex", gap: 4 }}>{[0, 1, 2].map((d) => <span key={d} className="sa-dot" style={{ animationDelay: `${d * 0.15}s` }} />)}</div>}
        {shown === messages.length && <p style={{ alignSelf: "flex-end", color: "#8e8e93", fontSize: 10 }}>{t("Прочитано 03:14", "Read 3:14 AM")}</p>}
      </div>
    </div>
  );
}

export default function SelfWorld({ perfume }: WorldProps) {
  const [, navigate] = useLocation();
  const { lang, setLang, t } = useLang();
  const [open, setOpen] = useState(false);
  const [kisses, setKisses] = useState<{ x: number; y: number; r: number }[]>([]);
  const fragments = pick(lang, perfume.memoryFragments).map(fragmentText);
  const gallery = perfume.gallery ?? [];
  const n = perfume.scentNotes;

  const kiss = (e: React.MouseEvent<HTMLButtonElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    setKisses((k) => [...k, { x: e.clientX - r.left, y: e.clientY - r.top, r: Math.random() * 40 - 20 }]);
    setTimeout(() => setOpen(true), 650);
  };

  const skin: DialogSkin = {
    overlay: "rgba(18,12,14,.8)",
    panel: { ...serif, background: "linear-gradient(160deg, #2a1a1f, #160e11)", padding: "34px 28px", color: C.cream, borderRadius: 26, border: `1px solid ${C.pink}55`, boxShadow: `0 0 80px ${C.rose}44` },
    title: { ...serif, fontStyle: "italic", fontSize: 36, color: C.pink },
    label: { ...hand, fontSize: 20, color: C.dim },
    input: { ...sans, fontSize: 15, background: "rgba(255,255,255,.06)", border: "none", borderRadius: 14, padding: "12px 14px", color: C.cream },
    button: { ...serif, fontStyle: "italic", fontSize: 20, background: `linear-gradient(90deg, ${C.pink}, ${C.rose})`, color: "#2a0a12", padding: "12px", borderRadius: 999 },
    accent: C.rose,
    heading: { ru: "Записка самому себе", en: "A note to myself" },
    submit: { ru: "Отправить ♡", en: "Send ♡" },
    sent: { ru: "Доставлено ♡ ты прекрасен", en: "Delivered ♡ you look gorgeous" },
  };

  return (
    <div style={{ ...serif, background: `radial-gradient(ellipse at 50% -10%, #3a1a24, ${C.bg} 60%)`, color: C.cream, minHeight: "100vh", overflowX: "hidden" }}>
      <style>{`
        .sa-spark { position: absolute; color: ${C.pink}; animation: sa-tw 3.6s ease-in-out infinite; opacity: 0; }
        @keyframes sa-tw { 50% { opacity: .8; transform: scale(1.3) rotate(20deg); } }
        .sa-reflect { -webkit-box-reflect: below 4px linear-gradient(transparent 40%, rgba(0,0,0,.4)); }
        @keyframes sa-pop { from { transform: scale(.6); opacity: 0; } }
        .sa-dot { width: 7px; height: 7px; border-radius: 50%; background: #9a9aa0; animation: sa-bounce 1s infinite; }
        @keyframes sa-bounce { 30% { transform: translateY(-4px); } }
        .sa-photo { transition: transform .6s cubic-bezier(.2,1.4,.4,1); } .sa-photo:hover { transform: translateY(-8px) rotate(0deg) !important; }
        @media (prefers-reduced-motion: reduce) { .sa-spark { animation: none; opacity: .4; } }
      `}</style>
      <Sparkles />

      <nav style={{ position: "relative", zIndex: 5, display: "flex", justifyContent: "space-between", padding: "20px clamp(16px,4vw,48px)", ...hand, fontSize: 22 }}>
        <button onClick={() => navigate("/map")} style={{ color: C.dim }}>← {t("карта", "map")}</button>
        <span style={{ color: C.pink }}>♡ 03:12 ♡</span>
        <span>{(["ru", "en"] as const).map((l) => <button key={l} onClick={() => setLang(l)} style={{ marginLeft: 10, color: lang === l ? C.pink : C.dim }}>{l}</button>)}</span>
      </nav>

      <header style={{ position: "relative", zIndex: 2, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", alignItems: "center", gap: 30, padding: "20px clamp(16px,5vw,80px) 120px", maxWidth: 1400, margin: "0 auto" }}>
        <div>
          <p style={{ ...hand, fontSize: 30, color: C.pink }}>{t("дорогой дневник,", "dear diary,")}</p>
          <h1 className="sa-reflect" style={{ fontSize: "clamp(3.6rem, 10vw, 8.6rem)", fontStyle: "italic", fontWeight: 400, lineHeight: 0.9, letterSpacing: "-0.02em", margin: "6px 0 0" }}>Self<br /><span style={{ color: C.pink }}>addicted</span></h1>
          <p style={{ fontSize: "clamp(1.1rem, 1.8vw, 1.4rem)", lineHeight: 1.5, maxWidth: 460, marginTop: 90, color: C.dim }}>{pick(lang, perfume.description)}</p>
        </div>
        {/* oval mirror with the bottle */}
        <div style={{ position: "relative", width: "min(460px, 86vw)", aspectRatio: "3 / 4", margin: "0 auto" }}>
          <div style={{ position: "absolute", inset: 0, borderRadius: "50%", padding: 14, background: "linear-gradient(135deg, #f6e3c8, #b48a5a 40%, #f6e3c8 60%, #9a7448)", boxShadow: "0 40px 90px rgba(0,0,0,.6)" }}>
            <div style={{ position: "relative", width: "100%", height: "100%", borderRadius: "50%", overflow: "hidden", background: `url(${perfume.heroImage}) center/cover` }}>
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(255,255,255,.28), transparent 35%, rgba(255,179,200,.18) 70%, transparent), rgba(18,12,14,.45)" }} />
              <Bottle3D style={{ position: "absolute", inset: "10% 6% 4%" }} lighting="studio" liquid="#f2a7b8" liquidOpacity={0.88} glass="#fff0f4" cap="#1a1214" capRoughness={0.35} collar="#f0c9a0" spin={0.2}
                drawLabel={(ctx, w, h) => {
                  ctx.fillStyle = "#fbeef0"; ctx.fillRect(0, 0, w, h);
                  ctx.fillStyle = "#e8577a"; ctx.textAlign = "center";
                  ctx.font = "italic 400 120px 'Playfair Display', serif"; ctx.fillText("Self", w / 2, h * 0.44);
                  ctx.font = "italic 400 86px 'Playfair Display', serif"; ctx.fillText("addicted", w / 2, h * 0.68);
                  ctx.font = "60px serif"; ctx.fillText("♡", w / 2, h * 0.9);
                }} />
            </div>
          </div>
        </div>
      </header>

      <main style={{ position: "relative", zIndex: 2, maxWidth: 1140, margin: "0 auto", padding: "0 clamp(16px,5vw,64px) 120px" }}>
        {/* diary page */}
        <section style={{ marginBottom: 130 }}>
          <div style={{ background: "#fdf2f4", color: "#3a1a24", padding: "40px clamp(20px,5vw,60px) 40px clamp(60px,8vw,90px)", borderRadius: 4, transform: "rotate(-1deg)", boxShadow: "0 30px 70px rgba(0,0,0,.5)", backgroundImage: "repeating-linear-gradient(transparent 0 37px, rgba(232,87,122,.18) 37px 38px), linear-gradient(90deg, transparent 50px, rgba(232,87,122,.45) 50px 52px, transparent 52px)", position: "relative" }}>
            <p style={{ ...hand, fontSize: 38, color: C.rose, lineHeight: "38px" }}>{t("что я ношу на коже:", "what I wear on my skin:")}</p>
            {([[t("сначала", "first"), n.top], [t("потом", "then"), n.heart], [t("и навсегда", "and forever"), n.base]] as const).map(([w, g]) => g && (
              <p key={w} style={{ ...hand, fontSize: 28, lineHeight: "38px" }}><span style={{ color: C.rose }}>{w} — </span>{pick(lang, g).join(", ")}</p>
            ))}
            <p style={{ ...hand, fontSize: 28, lineHeight: "38px", color: C.rose, textAlign: "right" }}>♡ xoxo</p>
            <span style={{ position: "absolute", top: -14, right: 50, width: 90, height: 28, background: "rgba(255,179,200,.7)", transform: "rotate(4deg)" }} />
          </div>
        </section>

        <section style={{ marginBottom: 130 }}>
          <H kicker={t("насколько сильно", "how much")} title={t("Любовь к себе", "Self-love")} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 24 }}>
            {perfume.radarAxes.map((a, i) => <Heart key={a.key} value={a.value} label={pick(lang, a.label)} i={i} />)}
          </div>
        </section>

        {gallery.length > 0 && (
          <section style={{ marginBottom: 130 }}>
            <H kicker={t("в отражении", "in the reflection")} title={t("Галерея зеркал", "Hall of mirrors")} />
            <div style={{ display: "flex", flexWrap: "wrap", gap: 22, justifyContent: "center", paddingBottom: 80 }}>
              {gallery.map((src, i) => (
                <div key={src} className="sa-photo sa-reflect" style={{ width: 200, aspectRatio: "3 / 4", borderRadius: "100px 100px 8px 8px", overflow: "hidden", border: "6px solid #e8cfa8", transform: `rotate(${[-3, 2, -1.5, 3][i % 4]}deg)` }}>
                  <img src={src} alt="" loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                </div>
              ))}
            </div>
          </section>
        )}

        <section style={{ marginBottom: 130, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 40, alignItems: "center" }}>
          <div>
            <H kicker={t("сообщения, которые не стоило читать", "messages you shouldn't read")} title={t("Переписка с собой", "Texting myself")} />
          </div>
          <Chat messages={fragments} t={t} />
        </section>

        <section style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18, textAlign: "center" }}>
          <p style={{ ...hand, fontSize: 32, color: C.pink }}>{pick(lang, perfume.tagline)}</p>
          <button onClick={kiss} aria-label={t("Поцеловать зеркало и оформить заявку", "Kiss the mirror and request")} style={{ position: "relative", width: "min(340px, 86vw)", height: 200, borderRadius: "50%", background: "linear-gradient(135deg, rgba(255,255,255,.18), rgba(255,255,255,.04) 40%, rgba(255,179,200,.12))", border: "8px solid #e8cfa8", overflow: "hidden", boxShadow: "0 20px 50px rgba(0,0,0,.5)" }}>
            <span style={{ ...serif, fontStyle: "italic", fontSize: 24, color: C.cream }}>{t("поцелуй зеркало", "kiss the mirror")}</span>
            {kisses.map((k, i) => (
              <svg key={i} viewBox="0 0 100 60" style={{ position: "absolute", left: k.x - 40, top: k.y - 24, width: 80, transform: `rotate(${k.r}deg)`, animation: "sa-pop .3s ease", pointerEvents: "none" }}>
                <path d="M5 30 Q 25 5, 50 22 Q 75 5, 95 30 Q 75 34, 50 30 Q 25 34, 5 30 Z" fill="#c8103c" opacity=".85" />
                <path d="M5 30 Q 30 56, 50 52 Q 70 56, 95 30 Q 75 36, 50 34 Q 25 36, 5 30 Z" fill="#a80a30" opacity=".85" />
              </svg>
            ))}
          </button>
          <p style={{ ...mono, fontSize: 12, color: C.dim }}>Extrait de parfum · {perfume.releaseDate} · {pick(lang, perfume.origin.location)}</p>
        </section>
      </main>
      <RequestDialog open={open} onClose={() => setOpen(false)} perfumeName={perfume.name} skin={skin} />
    </div>
  );
}

function H({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div style={{ marginBottom: 30, textAlign: "center" }}>
      <p style={{ ...hand, fontSize: 26, color: C.pink }}>{kicker}</p>
      <h2 style={{ ...serif, fontStyle: "italic", fontSize: "clamp(2.4rem, 5.5vw, 4.4rem)", lineHeight: 1 }}>{title}</h2>
    </div>
  );
}
