// narcisstic king — an audience with a vain king in a dark baroque palace in London, at night.
// Crimson curtains part as you scroll onto the throne room; the bottle sits on the empty throne and a crown
// of gold and thorns comes down onto it — the coronation. Then: a royal decree on parchment (what it smells like),
// the coronation in three acts with a crown whose gems light up (blood → gold → leather), the treasury of gold
// coins you toss to read the notes on their backs, a hall of mirrors for the character, and a signet ring
// you press into hot wax to ask.

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useLocation } from "wouter";
import { useLang } from "@/contexts/LangContext";
import Bottle3D from "@/components/Bottle3D";
import RequestDialog, { type DialogSkin } from "@/components/RequestDialog";
import { useReveal } from "@/lib/useReveal";
import { pick, prefersReducedMotion, type WorldProps } from "./shared";

const C = { black: "#070405", velvet: "#3a0610", crimson: "#7a0d1c", blood: "#b3122a", gold: "#d8b25a", leaf: "#f1d68b", cream: "#f3e6cc", ink: "#2a1508", dim: "rgba(243,230,204,.6)", faint: "rgba(243,230,204,.18)" };
const regal: CSSProperties = { fontFamily: "'Cormorant SC', 'Cormorant Garamond', serif", fontWeight: 700 };
const serif: CSSProperties = { fontFamily: "'Cormorant Garamond', serif" };
const label: CSSProperties = { fontFamily: "'Forum', 'Cormorant SC', serif", textTransform: "uppercase" };
const IMG = "/images/narcisstic-king";
const GOLD_TEXT: CSSProperties = { background: "linear-gradient(180deg, #fff1c2 0%, #e6c06a 38%, #9a6a1e 60%, #f3d688 100%)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" };

const bottleLook = { liquid: "#6a0d1a", liquidOpacity: 0.95, glass: "#ffe8d0", cap: "#8a6420", capRoughness: 0.35, collar: "#e8c56a" };
const bottleLabel = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
  const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, "#3a0610"); g.addColorStop(1, "#16020a");
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = "#d8b25a"; ctx.lineWidth = 6; ctx.strokeRect(18, 18, w - 36, h - 36);
  ctx.lineWidth = 2; ctx.strokeRect(32, 32, w - 64, h - 64);
  ctx.fillStyle = "#f1d68b"; ctx.textAlign = "center";
  ctx.font = "italic 400 70px 'Cormorant Garamond', serif"; ctx.fillText("narcisstic", w / 2, h * 0.44);
  ctx.font = "700 128px 'Cormorant SC', serif"; ctx.fillText("KING", w / 2, h * 0.7);
};

// ── helpers ──
function coverPoint(W: number, H: number, iw: number, ih: number, fx: number, fy: number, ax = 0.5, ay = 0.5) {
  const s = Math.max(W / iw, H / ih);
  return { x: (W - iw * s) * ax + fx * iw * s, y: (H - ih * s) * ay + fy * ih * s, s };
}
function useViewport() {
  const [vp, setVp] = useState(() => ({ w: window.innerWidth, h: window.innerHeight }));
  useEffect(() => {
    const on = () => setVp({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, []);
  return vp;
}
// 0 → 1 while a tall section scrolls past its sticky viewport
function usePinProgress<T extends HTMLElement>(enabled = true) {
  const ref = useRef<T>(null);
  const [p, setP] = useState(0);
  useEffect(() => {
    if (!enabled) return;
    let raf = 0;
    const update = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const el = ref.current; if (!el) return;
        const r = el.getBoundingClientRect();
        setP(Math.min(1, Math.max(0, -r.top / Math.max(1, r.height - window.innerHeight))));
      });
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("scroll", update); window.removeEventListener("resize", update); };
  }, [enabled]);
  return { ref, p };
}
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const ease = (x: number) => { const t = clamp01(x); return t * t * (3 - 2 * t); };

function Reveal({ children, delay = 0, style }: { children: React.ReactNode; delay?: number; style?: CSSProperties }) {
  const { ref, visible } = useReveal();
  return <div ref={ref} style={{ ...style, opacity: visible ? 1 : 0, transform: visible ? "none" : "translateY(24px)", transition: `opacity 1.2s ease ${delay}ms, transform 1.2s cubic-bezier(.16,1,.3,1) ${delay}ms` }}>{children}</div>;
}
function Head({ kicker, title, dark }: { kicker: string; title: string; dark?: boolean }) {
  return (
    <div style={{ textAlign: "center", marginBottom: 46 }}>
      <p style={{ ...label, fontSize: 13, letterSpacing: ".45em", color: dark ? C.crimson : C.gold }}>✦ {kicker} ✦</p>
      <h2 style={{ ...regal, fontSize: "clamp(2.2rem, 5.4vw, 4.4rem)", lineHeight: 1.02, marginTop: 10, ...(dark ? { color: C.ink } : GOLD_TEXT) }}>{title}</h2>
    </div>
  );
}
// Damask wall: a tile darkened so text on it stays readable
const damask = (shade = 0.55): CSSProperties => ({ backgroundImage: `linear-gradient(rgba(7,4,5,${shade}), rgba(7,4,5,${shade})), url(${IMG}/damask.webp)`, backgroundSize: "auto, 340px 340px" });

// ── 1. The audience: curtains part, the bottle waits on the throne, the crown comes down ──
const HALL = { iw: 1536, ih: 1024, seat: { x: 0.5, y: 0.585 } };
function Audience({ t, description, tagline }: { t: (ru: string, en: string) => string; description: string; tagline: string }) {
  const still = prefersReducedMotion();
  const { ref, p } = usePinProgress<HTMLElement>(!still);
  const vp = useViewport();
  const open = still ? 1 : ease(p / 0.38);
  const descend = still ? 1 : ease((p - 0.34) / 0.44);
  const crowned = still || p > 0.8;
  const seat = coverPoint(vp.w, vp.h, HALL.iw, HALL.ih, HALL.seat.x, HALL.seat.y);
  const bh = 340 * seat.s; // sized to the throne, which is drawn at the image's cover scale
  const bw = bh * 0.62;
  // the crown sits on the cap: the cap's top is ~13% down the bottle box, its rim covers the cap's lower half
  const crownW = bw * 0.58, crownH = crownW * (633 / 700);
  const crownTop = bh * 0.26 - crownH;
  const lift = (1 - descend) * (seat.y + crownH); // starts above the top of the screen
  const zoom = 1.12 - 0.12 * open;
  return (
    <section ref={ref} style={{ position: "relative", height: still ? "100svh" : "280svh", background: C.black }}>
      <div style={{ position: still ? "relative" : "sticky", top: 0, height: "100svh", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, transform: `scale(${zoom})`, transformOrigin: `${seat.x}px ${seat.y}px` }}>
          <img src={`${IMG}/hall.webp`} alt={t("Тронный зал при свечах: пустой золотой трон, зеркала, красная дорожка", "A candlelit throne room: an empty gold throne, mirrors, a red carpet")} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
          <div aria-hidden className="kg-candle" style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 55%, rgba(255,170,80,.16), transparent 60%)" }} />
          {/* the bottle on the seat */}
          <div style={{ position: "absolute", left: seat.x, top: seat.y, width: bw, height: bh, transform: "translate(-50%, -96%)" }}>
            <div aria-hidden style={{ position: "absolute", left: "10%", right: "10%", bottom: "0%", height: "8%", borderRadius: "50%", background: "radial-gradient(ellipse, rgba(0,0,0,.65), transparent 70%)", filter: "blur(4px)" }} />
            <Bottle3D style={{ position: "absolute", inset: 0 }} lighting="gold" {...bottleLook} spin={0.16} drawLabel={bottleLabel} />
            {/* the crown coming down onto the cap */}
            <img src={`${IMG}/crown.webp`} alt="" aria-hidden style={{ position: "absolute", left: (bw - crownW) / 2, top: crownTop, width: crownW, maxWidth: "none", transform: `translate3d(0, ${-lift}px, 0) rotate(${(1 - descend) * -6}deg)`, filter: `drop-shadow(0 8px 10px rgba(0,0,0,.6)) drop-shadow(0 0 ${crowned ? 24 : 0}px rgba(255,200,100,.55))`, transition: "filter 1s ease" }} />
          </div>
        </div>
        {/* coronation flash */}
        <div aria-hidden style={{ position: "absolute", inset: 0, pointerEvents: "none", background: `radial-gradient(circle at ${seat.x}px ${seat.y - bh * 0.95}px, rgba(255,214,140,.45), transparent 40%)`, opacity: crowned ? 1 : 0, transition: "opacity 1.4s ease" }} />
        <div aria-hidden style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "linear-gradient(180deg, rgba(7,4,5,.75), transparent 28%, transparent 58%, rgba(7,4,5,.92))" }} />

        {/* the title, once he is crowned */}
        <div style={{ position: "absolute", left: 0, right: 0, bottom: "clamp(34px, 7vh, 80px)", textAlign: "center", padding: "0 16px", pointerEvents: "none", opacity: crowned ? 1 : 0, transform: crowned ? "none" : "translateY(18px)", transition: "opacity 1.2s ease .3s, transform 1.4s cubic-bezier(.16,1,.3,1) .3s" }}>
          <p style={{ ...label, fontSize: 13, letterSpacing: ".5em", color: C.gold }}>{t("Да здравствует король", "Long live the king")}</p>
          <h1 style={{ ...regal, fontSize: "clamp(3rem, 9vw, 7.4rem)", lineHeight: 0.92, margin: "8px 0 12px", ...GOLD_TEXT, filter: "drop-shadow(0 4px 30px rgba(0,0,0,.8))" }}>narcisstic king</h1>
          <p style={{ ...serif, fontStyle: "italic", fontSize: "clamp(1.1rem, 1.8vw, 1.4rem)", lineHeight: 1.45, color: C.cream, maxWidth: 580, margin: "0 auto", textShadow: "0 2px 14px rgba(0,0,0,.9)" }}>{description}</p>
          <p style={{ ...label, fontSize: 12, letterSpacing: ".3em", color: C.dim, marginTop: 14 }}>{tagline}</p>
        </div>

        {/* the curtains, closed until you scroll */}
        {([0, 1] as const).map((side) => (
          <div key={side} aria-hidden style={{ position: "absolute", top: "-2%", bottom: "-2%", width: "52%", [side ? "right" : "left"]: 0, transformOrigin: side ? "100% 0" : "0 0", transform: `translateX(${(side ? 1 : -1) * open * 88}%) scaleX(${1 - open * 0.35})`, zIndex: 4, pointerEvents: "none" }}>
            <img src={`${IMG}/curtain.webp`} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", transform: side ? "scaleX(-1)" : undefined, filter: "brightness(.9)" }} />
            <div style={{ position: "absolute", inset: 0, background: side ? "linear-gradient(90deg, rgba(0,0,0,.55), transparent 30%)" : "linear-gradient(270deg, rgba(0,0,0,.55), transparent 30%)" }} />
          </div>
        ))}
        {/* the herald, on the closed curtain */}
        <div style={{ position: "absolute", inset: 0, zIndex: 5, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "0 20px", pointerEvents: "none", opacity: 1 - ease(open / 0.35) }}>
          <p style={{ ...label, fontSize: 13, letterSpacing: ".5em", color: C.leaf, textShadow: "0 2px 10px rgba(0,0,0,.8)" }}>{t("Лондон · полночь", "London · midnight")}</p>
          <h2 style={{ ...regal, fontSize: "clamp(2.2rem, 6vw, 4.8rem)", lineHeight: 1.04, marginTop: 14, ...GOLD_TEXT, filter: "drop-shadow(0 3px 16px rgba(0,0,0,.9))" }}>{t("Его Величество", "His Majesty")}<br />{t("примет вас", "will see you now")}</h2>
          <p className="kg-hint" style={{ ...label, fontSize: 12, letterSpacing: ".35em", color: C.cream, marginTop: 34 }}>{t("Листайте — занавес поднимается ↓", "Scroll — the curtain rises ↓")}</p>
        </div>
      </div>
    </section>
  );
}

// ── 2. The decree: what it smells like, set out as articles ──
const ROMAN = ["I", "II", "III", "IV", "V"];
function Decree({ plain, facts, tip, t }: { plain: string; facts: [string, string][]; tip?: string; t: (ru: string, en: string) => string }) {
  return (
    <section style={{ position: "relative", ...damask(0.62), padding: "110px clamp(12px,3vw,40px) 120px" }}>
      <Reveal style={{ maxWidth: 760, margin: "0 auto" }}>
        {/* the scroll is sliced: the rolls at the ends keep their shape, only the sheet in between stretches with the text */}
        <div style={{ containerType: "inline-size", filter: "drop-shadow(0 40px 60px rgba(0,0,0,.6))" }}>
        <div className="kg-decree" style={{ position: "relative", color: C.ink }}>
          <p style={{ ...label, fontSize: 12, letterSpacing: ".4em", textAlign: "center", color: C.crimson }}>{t("Указ № 1 · о том, как пахнет король", "Decree № 1 · on how the king smells")}</p>
          <h2 style={{ ...regal, fontSize: "clamp(2rem, 4.6vw, 3.4rem)", textAlign: "center", lineHeight: 1.05, marginTop: 10 }}>{t("Как он пахнет", "What it smells like")}</h2>
          <p className="kg-plain" style={{ ...serif, fontSize: "clamp(1.2rem, 2vw, 1.5rem)", lineHeight: 1.5, marginTop: 22 }}><span style={{ ...regal, fontSize: "2.6em", float: "left", lineHeight: 0.8, margin: "6px 10px 0 0", color: C.crimson }}>{plain.charAt(0)}</span>{plain.slice(1)}</p>
          <div style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(122,13,28,.5), transparent)", margin: "30px 0 22px" }} />
          <dl style={{ display: "grid", gap: 16 }}>
            {facts.map(([k, v], i) => (
              <div key={k} className="kg-article" style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "0 14px", alignItems: "baseline" }}>
                <dt style={{ ...regal, fontSize: 15, color: C.crimson, minWidth: 92 }}>{t("Статья", "Article")} {ROMAN[i]}.</dt>
                <dd style={{ ...serif, fontSize: 18, lineHeight: 1.4 }}><b style={{ ...label, fontWeight: 400, fontSize: 12, letterSpacing: ".2em" }}>{k}:</b> {v}</dd>
              </div>
            ))}
          </dl>
          {tip && <p style={{ ...serif, fontStyle: "italic", fontSize: 17, lineHeight: 1.5, marginTop: 24 }}><span style={{ ...label, fontStyle: "normal", fontSize: 12, letterSpacing: ".2em", color: C.crimson }}>{t("Примечание", "Note")}: </span>{tip}</p>}
          <img src={`${IMG}/seal.webp`} alt={t("Красная сургучная печать с терновым венцом", "A red wax seal with a crown of thorns")} style={{ display: "block", margin: "26px auto -20px", width: "clamp(84px, 13vw, 116px)", transform: "rotate(-8deg)", filter: "drop-shadow(0 6px 8px rgba(0,0,0,.4))" }} />
        </div>
        </div>
      </Reveal>
    </section>
  );
}

// ── 3. The coronation in three acts: the gems on the crown light up one by one ──
const ACTS = ["act-blood", "act-gold", "act-leather"];
const GEMS = [{ c: "#ff2a44", glow: "rgba(255,40,70,.9)" }, { c: "#ffc24a", glow: "rgba(255,190,70,.9)" }, { c: "#2a1a14", glow: "rgba(150,90,40,.8)" }];
const ACT_BG = ["#2a0308", "#2a1a04", "#120a06"];
function Coronation({ stages, t }: { stages: { when: string; text: string; notes: string }[]; t: (ru: string, en: string) => string }) {
  const still = prefersReducedMotion();
  const { ref, p } = usePinProgress<HTMLElement>(!still);
  const stage = still ? 2 : Math.min(2, Math.floor(p * 3.05));
  const actName = [t("Акт первый", "Act one"), t("Акт второй", "Act two"), t("Акт третий", "Act three")];
  return (
    <section ref={ref} style={{ position: "relative", height: still ? "auto" : "330svh", background: C.black }}>
      <div style={{ position: still ? "relative" : "sticky", top: 0, minHeight: "100svh", overflow: "hidden", display: "flex", flexDirection: "column", justifyContent: "center", padding: "74px clamp(16px,4vw,48px) 30px", background: `radial-gradient(ellipse at 30% 50%, ${ACT_BG[stage]}, ${C.black} 72%)`, transition: "background 1s ease" }}>
        <div className="kg-acts-head" style={{ textAlign: "center" }}>
          <p style={{ ...label, fontSize: 13, letterSpacing: ".45em", color: C.gold }}>{t("Как раскрывается на коже", "How it unfolds on skin")}</p>
          <h2 style={{ ...regal, fontSize: "clamp(2rem, 4.6vw, 3.6rem)", marginTop: 6, ...GOLD_TEXT }}>{t("Коронация в трёх актах", "A coronation in three acts")}</h2>
        </div>
        <div className="kg-acts" style={{ position: "relative", maxWidth: 1180, width: "100%", margin: "26px auto 0", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px 56px", alignItems: "center" }}>
          {/* the painting of the act in a gilded frame */}
          <div className="kg-act-frame" style={{ position: "relative", width: "min(100%, 58svh, 540px)", aspectRatio: "1", margin: "0 auto", padding: "4.5%", background: "linear-gradient(135deg, #f6dc8e, #8a5c1a 30%, #e6c06a 50%, #6e4510 75%, #f1d68b)", boxShadow: "0 40px 80px rgba(0,0,0,.7), inset 0 0 0 3px rgba(0,0,0,.35)" }}>
            <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden", boxShadow: "inset 0 0 0 2px #3a240a" }}>
              {ACTS.map((a, i) => <img key={a} src={`${IMG}/${a}.webp`} alt="" loading="lazy" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: stage === i ? 1 : 0, transform: stage === i ? "scale(1)" : "scale(1.06)", transition: "opacity 1s ease, transform 1.6s ease" }} />)}
            </div>
          </div>
          <div>
            {/* the crown with its three gems */}
            <div className="kg-crown" style={{ position: "relative", width: "min(240px, 58%)", margin: "0 auto 44px" }}>
              <img src={`${IMG}/cushion.webp`} alt="" aria-hidden style={{ width: "100%", display: "block", marginTop: "18%" }} />
              <img src={`${IMG}/crown.webp`} alt={t("Корона на бархатной подушке", "The crown on a velvet cushion")} style={{ position: "absolute", left: "19%", width: "62%", top: "-30%", filter: "drop-shadow(0 10px 10px rgba(0,0,0,.6))" }} />
              <div style={{ position: "absolute", left: 0, right: 0, bottom: "-30px", display: "flex", justifyContent: "center", gap: 18 }}>
                {GEMS.map((g, i) => (
                  <span key={i} aria-hidden style={{ width: 16, height: 16, transform: "rotate(45deg)", background: i <= stage ? g.c : "#2a2420", boxShadow: i <= stage ? `0 0 16px 4px ${g.glow}, inset 0 0 0 2px rgba(255,255,255,.35)` : "inset 0 0 0 1px rgba(216,178,90,.5)", transition: "all .6s ease" }} />
                ))}
              </div>
            </div>
            <div className={`kg-act-cards${still ? " still" : ""}`} style={{ position: "relative", minHeight: "min(36svh, 300px)" }}>
              {stages.map((s, i) => (
                <article key={i} style={{ position: still ? "relative" : "absolute", inset: still ? undefined : 0, opacity: still || stage === i ? 1 : 0, transform: still || stage === i ? "none" : `translateY(${i < stage ? -22 : 22}px)`, transition: "opacity .7s ease, transform .9s cubic-bezier(.16,1,.3,1)", marginBottom: still ? 30 : 0, textAlign: "center" }}>
                  <p style={{ ...label, fontSize: 12, letterSpacing: ".4em", color: GEMS[i].c === "#2a1a14" ? C.gold : GEMS[i].c }}>{actName[i]}</p>
                  <p className="kg-act-when" style={{ ...regal, fontSize: "clamp(2rem, 3.4vw, 2.8rem)", color: C.cream, marginTop: 4 }}>{s.when}</p>
                  <p className="kg-act-text" style={{ ...serif, fontSize: "clamp(1.15rem, 1.7vw, 1.35rem)", lineHeight: 1.5, marginTop: 10, color: C.cream }}>{s.text}</p>
                  <p className="kg-act-notes" style={{ ...label, fontSize: 12, letterSpacing: ".18em", color: C.dim, marginTop: 14, lineHeight: 1.8 }}>{s.notes}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── 4. The treasury: every note is struck on the back of a gold coin ──
function Coin({ note, i, flipped, onToss, tossKey }: { note: string; i: number; flipped: boolean; onToss: () => void; tossKey: number }) {
  return (
    <button className="kg-coin" onClick={onToss} aria-label={note} aria-pressed={flipped} style={{ animationDelay: `${(i % 6) * 60}ms` }}>
      <span key={tossKey} className={tossKey ? "kg-toss" : undefined} style={{ display: "block", width: "100%", height: "100%" }}>
        <span className="kg-coin-in" style={{ transform: `rotateY(${flipped ? 180 + 720 : 0}deg)`, transition: tossKey ? "transform 1s cubic-bezier(.3,.7,.3,1)" : "none" }}>
          <img className="kg-face" src={`${IMG}/coin-heads.webp`} alt="" draggable={false} />
          <span className="kg-face kg-back">
            <img src={`${IMG}/coin-tails.webp`} alt="" draggable={false} />
            <span className="kg-engraved" style={{ fontSize: note.length > 12 ? "clamp(.78rem, 1.6vw, 1.02rem)" : "clamp(.95rem, 2vw, 1.25rem)" }}>{note}</span>
          </span>
        </span>
      </span>
    </button>
  );
}
function Treasury({ tiers, t }: { tiers: { title: string; notes: string[] }[]; t: (ru: string, en: string) => string }) {
  const all = tiers.flatMap((tier) => tier.notes);
  const [flipped, setFlipped] = useState<boolean[]>(() => all.map(() => false));
  const [toss, setToss] = useState<number[]>(() => all.map(() => 0));
  const flip = (i: number) => { setFlipped((f) => f.map((v, j) => (j === i ? !v : v))); setToss((k) => k.map((v, j) => (j === i ? v + 1 : v))); };
  const spill = () => {
    const to = !flipped.every(Boolean);
    all.forEach((_, i) => window.setTimeout(() => { setFlipped((f) => f.map((v, j) => (j === i ? to : v))); setToss((k) => k.map((v, j) => (j === i ? v + 1 : v))); }, i * 70));
  };
  let idx = 0;
  return (
    <section style={{ position: "relative", background: `radial-gradient(ellipse at 50% 0%, #2c1606, ${C.black} 70%)`, padding: "110px clamp(12px,3vw,40px) 110px" }}>
      <Head kicker={t("Королевская казна", "The royal treasury")} title={t("Из чего он сделан", "What it's made of")} />
      <p style={{ ...serif, fontStyle: "italic", fontSize: 19, color: C.dim, textAlign: "center", marginTop: -26 }}>{t("Подбросьте монету — на обороте выбита нота.", "Toss a coin — a note is struck on its back.")}</p>
      <div style={{ maxWidth: 1080, margin: "40px auto 0", display: "grid", gap: 44 }}>
        {tiers.map((tier) => (
          <div key={tier.title}>
            <p style={{ ...label, fontSize: 13, letterSpacing: ".4em", color: C.gold, textAlign: "center", marginBottom: 18 }}>— {tier.title} —</p>
            <div className="kg-coins" style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "clamp(10px, 2vw, 22px)" }}>
              {tier.notes.map((note) => { const i = idx++; return <Coin key={note + i} note={note} i={i} flipped={flipped[i]} tossKey={toss[i]} onToss={() => flip(i)} />; })}
            </div>
          </div>
        ))}
      </div>
      <div style={{ textAlign: "center", marginTop: 44 }}>
        <button className="kg-btn" onClick={spill}>{flipped.every(Boolean) ? t("Перевернуть обратно", "Turn them back") : t("Высыпать всю казну", "Spill the whole treasury")}</button>
      </div>
    </section>
  );
}

// ── 5. The hall of mirrors: how much of each thing it holds ──
function Mirrors({ facets, lang }: { facets: { label: { ru: string; en: string }; value: number }[]; lang: "ru" | "en" }) {
  const { ref, visible } = useReveal<HTMLDivElement>();
  return (
    <div ref={ref} className="kg-mirrors-scroll">
      <div className="kg-mirrors" style={{ display: "flex", alignItems: "flex-end", justifyContent: "center", gap: "clamp(8px, 1.6vw, 20px)", maxWidth: 1080, margin: "0 auto" }}>
        {facets.map((f, i) => {
          const k = 0.45 + f.value / 100 * 0.55; // a louder facet gets a bigger mirror
          return (
            <div key={i} className="kg-mirror" style={{ flex: `${k} 1 0`, transformOrigin: "50% 100%", transform: visible ? "none" : "scale(.7)", opacity: visible ? 1 : 0, transition: `transform 1.6s cubic-bezier(.16,1,.3,1) ${i * 120}ms, opacity 1s ease ${i * 120}ms` }}>
              <img src={`${IMG}/mirror.webp`} alt="" draggable={false} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "fill" }} />
              <div className="kg-glass">
                <img src={`${IMG}/crown.webp`} alt="" aria-hidden style={{ width: "62%", opacity: 0.22, filter: "blur(1.5px) sepia(.4)", transform: "scaleX(-1)" }} />
                <span style={{ ...regal, fontSize: "clamp(1.5rem, 3vw, 2.4rem)", lineHeight: 1, ...GOLD_TEXT }}>{f.value}</span>
                <span style={{ ...label, fontSize: "clamp(9px, 1vw, 11px)", letterSpacing: ".14em", color: C.cream, lineHeight: 1.35, textAlign: "center", padding: "0 6%" }}>{pick(lang, f.label)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── 6. The signet: press the ring into the hot wax ──
function Signet({ onSealed, t }: { onSealed: () => void; t: (ru: string, en: string) => string }) {
  const [pressing, setPressing] = useState(false);
  const [sealed, setSealed] = useState(false);
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const PRESS = prefersReducedMotion() ? 0 : 420;
  const press = () => {
    if (sealed) { onSealed(); return; }
    if (pressing) return;
    setPressing(true);
    timers.current.push(window.setTimeout(() => { setSealed(true); setPressing(false); }, PRESS));
    timers.current.push(window.setTimeout(onSealed, PRESS + 900));
  };
  return (
    <div style={{ position: "relative", width: 300, height: 360, margin: "30px auto 0" }}>
      <img src={`${IMG}/${sealed ? "seal" : "wax"}.webp`} alt={sealed ? t("Печать с короной", "The crown seal") : t("Горячий сургуч", "Hot sealing wax")} style={{ position: "absolute", left: 50, bottom: 0, width: 200, filter: "drop-shadow(0 10px 14px rgba(0,0,0,.6))" }} />
      {sealed && <div aria-hidden className="kg-burst" />}
      <button className="kg-ring" aria-label={t("Прижать перстень к сургучу", "Press the ring into the wax")} onClick={press}
        style={{ transform: sealed ? "translate(10%, 10px) rotate(24deg) scale(.85)" : pressing ? "translate(-50%, 132px) scale(.9)" : "translate(-50%, 0)", transition: pressing ? `transform ${PRESS}ms cubic-bezier(.5,0,.7,.4)` : "transform .6s cubic-bezier(.3,1.5,.5,1)" }}>
        <img src={`${IMG}/ring.webp`} alt="" draggable={false} style={{ width: "100%", display: "block", pointerEvents: "none" }} />
      </button>
    </div>
  );
}

export default function KingWorld({ perfume }: WorldProps) {
  const [, navigate] = useLocation();
  const { lang, setLang, t } = useLang();
  const [open, setOpen] = useState(false);
  const g = perfume.guide!;
  const n = perfume.scentNotes;
  const Lp = (v: { ru: string; en: string }) => pick(lang, v);
  const stages = g.drydown.map((d) => ({ when: Lp(d.when), text: Lp(d.text), notes: n[d.notes] ? pick(lang, n[d.notes]!).join(" · ") : "" }));
  const tiers = [
    { title: t("Корона · верх", "The crown · top"), notes: n.top ? pick(lang, n.top) : [] },
    { title: t("Двор · сердце", "The court · heart"), notes: n.heart ? pick(lang, n.heart) : [] },
    { title: t("Подвалы · база", "The vaults · base"), notes: n.base ? pick(lang, n.base) : [] },
  ];
  const facts: [string, string][] = [
    [t("Шлейф", "Sillage"), Lp(g.sillage)],
    [t("Сезон", "Season"), Lp(g.season)],
    [t("Когда носить", "When to wear"), Lp(g.time)],
  ];

  const skin: DialogSkin = {
    overlay: "rgba(7,4,5,.86)",
    panel: { ...serif, background: `linear-gradient(rgba(58,6,16,.92), rgba(30,3,8,.96)), url(${IMG}/damask.webp)`, backgroundSize: "auto, 300px 300px", padding: "34px 28px", color: C.cream, borderRadius: 4, border: "none", boxShadow: "0 40px 100px rgba(0,0,0,.7), inset 0 0 0 2px #d8b25a, inset 0 0 0 8px #3a0610, inset 0 0 0 9px rgba(216,178,90,.6)" },
    title: { ...regal, fontSize: 34, ...GOLD_TEXT },
    label: { ...label, fontSize: 11, letterSpacing: ".25em", color: C.dim },
    input: { ...serif, fontSize: 18, background: "rgba(0,0,0,.35)", border: "1px solid rgba(216,178,90,.45)", padding: "10px 12px", color: C.cream, borderRadius: 2 },
    button: { ...regal, fontSize: 18, letterSpacing: ".18em", background: "linear-gradient(180deg, #f6dc8e, #d8b25a 55%, #9a6a1e)", color: "#2a0a08", padding: "14px", borderRadius: 2, boxShadow: "0 0 30px rgba(216,178,90,.35)" },
    accent: C.gold,
    heading: { ru: "Прошение на высочайшее имя", en: "A petition to His Majesty" },
    submit: { ru: "Скрепить печатью", en: "Seal it" },
    sent: { ru: "Прошение принято. Король благосклонен.", en: "Petition received. The king is gracious." },
  };

  return (
    <div style={{ ...serif, background: C.black, color: C.cream, minHeight: "100vh", overflowX: "clip" }}>
      <style>{`
        .kg-decree { border-style: solid; border-width: calc(200 / 846 * 100cqw) calc(165 / 846 * 100cqw) calc(316 / 846 * 100cqw); border-image: url(${IMG}/decree.webp) 200 165 316 fill / calc(200 / 846 * 100cqw) calc(165 / 846 * 100cqw) calc(316 / 846 * 100cqw) stretch; padding: 4px 3cqw 0; }
        .kg-hint { animation: kg-bob 2.4s ease-in-out infinite; } @keyframes kg-bob { 50% { transform: translateY(6px); opacity: .6; } }
        .kg-candle { animation: kg-candle 3.2s ease-in-out infinite alternate; } @keyframes kg-candle { 0% { opacity: .7; } 45% { opacity: 1; } 60% { opacity: .82; } 100% { opacity: .95; } }
        .kg-btn { ${"font-family: 'Cormorant SC', serif; font-weight: 700;"} font-size: 18px; letter-spacing: .18em; padding: 14px 30px; color: #2a0a08; background: linear-gradient(180deg, #f6dc8e, #d8b25a 55%, #9a6a1e); box-shadow: 0 0 30px rgba(216,178,90,.3), inset 0 1px 0 rgba(255,255,255,.5); transition: transform .2s, box-shadow .3s; }
        .kg-btn:hover { transform: translateY(-2px); box-shadow: 0 0 44px rgba(216,178,90,.5), inset 0 1px 0 rgba(255,255,255,.5); }
        .kg-coin { position: relative; width: clamp(96px, 13vw, 132px); aspect-ratio: 1; perspective: 700px; border-radius: 50%; }
        .kg-coin:focus-visible { outline: 2px solid ${C.leaf}; outline-offset: 4px; }
        .kg-coin-in { position: absolute; inset: 0; display: block; transform-style: preserve-3d; }
        .kg-face { position: absolute; inset: 0; width: 100%; height: 100%; backface-visibility: hidden; -webkit-backface-visibility: hidden; filter: drop-shadow(0 8px 10px rgba(0,0,0,.55)); }
        .kg-back { transform: rotateY(180deg); display: block; }
        .kg-back img { position: absolute; inset: 0; width: 100%; height: 100%; }
        .kg-engraved { position: absolute; left: 18%; right: 18%; top: 30%; bottom: 22%; display: flex; align-items: center; justify-content: center; text-align: center; font-family: 'Cormorant SC', serif; font-weight: 700; line-height: 1.05; color: #2e1602; text-shadow: 0 1px 0 rgba(255,236,170,.7), 0 -1px 1px rgba(30,12,0,.55); }
        .kg-coin:hover .kg-coin-in { filter: brightness(1.12); }
        .kg-toss { animation: kg-toss 1s cubic-bezier(.3,.7,.3,1); } @keyframes kg-toss { 0% { transform: translateY(0); } 45% { transform: translateY(-70px) scale(1.08); } 100% { transform: translateY(0); } }
        .kg-mirror { position: relative; flex: 0 0 auto; aspect-ratio: 560 / 1008; }
        .kg-glass { position: absolute; left: 21%; right: 21%; top: 26%; bottom: 15%; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; overflow: hidden; }
        .kg-glass::after { content: ""; position: absolute; inset: -40%; background: linear-gradient(115deg, transparent 40%, rgba(255,240,200,.16) 50%, transparent 60%); transform: translateX(-60%); transition: transform 1.1s ease; pointer-events: none; }
        .kg-mirror:hover .kg-glass::after { transform: translateX(60%); }
        .kg-ring { position: absolute; left: 50%; top: 0; width: 150px; cursor: pointer; filter: drop-shadow(0 18px 18px rgba(0,0,0,.6)); }
        .kg-ring:focus-visible { outline: 2px solid ${C.leaf}; outline-offset: 6px; border-radius: 50%; }
        .kg-burst { position: absolute; left: 50%; bottom: 60px; width: 360px; height: 360px; margin-left: -180px; border-radius: 50%; pointer-events: none; background: radial-gradient(circle, rgba(255,214,140,.55), transparent 60%); animation: kg-burst 1.2s ease-out forwards; }
        @keyframes kg-burst { from { transform: scale(.3); opacity: 1; } to { transform: scale(1.4); opacity: 0; } }
        @media (prefers-reduced-motion: reduce) { .kg-hint, .kg-candle, .kg-toss { animation: none; } }
        @media (max-width: 820px) {
          .kg-acts { grid-template-columns: 1fr !important; gap: 14px !important; }
          .kg-acts-head h2 { font-size: 1.7rem !important; }
          .kg-act-frame { width: min(64%, 26svh) !important; }
          .kg-crown { width: 96px !important; margin: 0 auto 44px !important; }
          .kg-act-cards { min-height: 0 !important; }
          .kg-act-cards:not(.still) { height: min(40svh, 300px); }
          .kg-act-when { font-size: 1.6rem !important; }
          .kg-act-text { font-size: 1rem !important; line-height: 1.45 !important; margin-top: 6px !important; }
          .kg-act-notes { font-size: 10px !important; margin-top: 8px !important; line-height: 1.6 !important; }
          .kg-article { grid-template-columns: 1fr !important; }
          .kg-plain { font-size: 1.08rem !important; line-height: 1.42 !important; }
          .kg-mirrors-scroll { overflow-x: auto; overscroll-behavior-x: contain; scrollbar-width: none; padding-bottom: 16px; }
          .kg-mirrors-scroll::-webkit-scrollbar { display: none; }
          .kg-mirrors { width: 700px; justify-content: flex-start !important; }
        }
        .kg-swipe { display: none; } @media (max-width: 820px) { .kg-swipe { display: block; } }
      `}</style>

      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 50, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px clamp(16px,3vw,28px)", ...label, fontSize: 13, letterSpacing: ".22em", color: C.cream, background: "linear-gradient(rgba(7,4,5,.8), transparent)" }}>
        <button onClick={() => navigate("/map")} style={{ color: C.cream }}>← {t("К карте", "Map")}</button>
        <span style={{ ...regal, fontSize: 18, letterSpacing: ".08em", textTransform: "none", ...GOLD_TEXT }}>Silentium</span>
        <span>{(["ru", "en"] as const).map((l) => <button key={l} onClick={() => setLang(l)} style={{ marginLeft: 10, color: lang === l ? C.leaf : C.dim }}>{l.toUpperCase()}</button>)}</span>
      </nav>

      <Audience t={t} description={Lp(perfume.description)} tagline={Lp(perfume.tagline)} />

      <Decree plain={Lp(g.plain)} facts={facts} tip={g.tip && Lp(g.tip)} t={t} />

      <Coronation stages={stages} t={t} />

      <Treasury tiers={tiers} t={t} />

      {/* the hall of mirrors */}
      <section style={{ position: "relative", background: `linear-gradient(180deg, ${C.black}, #1a0a06 50%, ${C.black})`, padding: "110px clamp(12px,3vw,40px) 110px" }}>
        <Head kicker={t("Зал зеркал", "The hall of mirrors")} title={t("Чего в нём больше всего", "What it holds the most of")} />
        <p style={{ ...serif, fontStyle: "italic", fontSize: 19, color: C.dim, textAlign: "center", marginTop: -26, marginBottom: 34 }}>{t("Чем выше зеркало, тем сильнее это звучит.", "The taller the mirror, the louder it plays.")}</p>
        <Mirrors facets={g.facets} lang={lang} />
        <p className="kg-swipe" style={{ ...label, fontSize: 11, letterSpacing: ".25em", color: C.dim, textAlign: "center", marginTop: 8 }}>{t("← листайте вбок →", "← swipe sideways →")}</p>
      </section>

      {/* request: the signet ring */}
      <section style={{ position: "relative", ...damask(0.7), padding: "110px 16px 120px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
        <Head kicker={t("Заявка", "Request")} title={t("Печать короля", "The king's seal")} />
        <p style={{ ...serif, fontStyle: "italic", fontSize: 20, color: C.cream, marginTop: -26 }}>{t("Нажмите на перстень — он оставит оттиск на горячем сургуче.", "Tap the ring — it will leave its mark in the hot wax.")}</p>
        <Signet onSealed={() => setOpen(true)} t={t} />
        <p style={{ ...serif, fontSize: 18, color: C.dim, maxWidth: 460, lineHeight: 1.6, marginTop: 34 }}>{t("Оставьте контакт — мы напишем и расскажем, как получить флакон.", "Leave your contact — we'll write and tell you how to get a bottle.")}</p>
        <p style={{ ...label, fontSize: 11, letterSpacing: ".2em", color: C.dim, marginTop: 10 }}>Extrait de parfum · {perfume.releaseDate} · {pick(lang, perfume.origin.location)}</p>
      </section>

      <RequestDialog open={open} onClose={() => setOpen(false)} perfumeName={perfume.name} skin={skin} />
    </div>
  );
}
