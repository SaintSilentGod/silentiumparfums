// narcisstic king — a cult of personality.
// An imperial propaganda poster: the bottle as a monument on a pedestal in front of rotating rays,
// a live counter of subjects who knelt, Decree № 1, notes as the social pyramid, the profile as
// hanging banners, memories as slogans pasted on a wall. Kneeling adds you to the counter.

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useLocation } from "wouter";
import { useLang } from "@/contexts/LangContext";
import Bottle3D from "@/components/Bottle3D";
import RequestDialog, { type DialogSkin } from "@/components/RequestDialog";
import { useReveal } from "@/lib/useReveal";
import { fragmentText, pick, prefersReducedMotion, type WorldProps } from "./shared";

const C = { black: "#0c0b0b", red: "#c1121f", deep: "#6e0910", cream: "#efe4cf", gold: "#d9b45a", ink: "#14100e" };
const block: CSSProperties = { fontFamily: "'Rubik Mono One', 'Oswald', sans-serif", fontWeight: 400 };
const cond: CSSProperties = { fontFamily: "'Oswald', 'Golos Text', sans-serif", fontWeight: 700, textTransform: "uppercase" };
const decree: CSSProperties = { fontFamily: "'Old Standard TT', serif" };
const mono: CSSProperties = { fontFamily: "'JetBrains Mono', monospace" };

function useSubjects() {
  const [n, setN] = useState(1289304);
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const id = setInterval(() => setN((v) => v + 1 + Math.floor(Math.random() * 6)), 900);
    return () => clearInterval(id);
  }, []);
  return [n, setN] as const;
}
const fmt = (n: number) => n.toLocaleString("ru-RU");

function Rays() {
  return (
    <div aria-hidden className="kg-rays" style={{ position: "absolute", left: "50%", top: "58%", width: "220vmax", height: "220vmax", marginLeft: "-110vmax", marginTop: "-110vmax", background: `repeating-conic-gradient(from 0deg, ${C.red} 0deg 7deg, ${C.black} 7deg 15deg)`, opacity: 0.9, maskImage: "radial-gradient(circle, #000 8%, transparent 46%)", WebkitMaskImage: "radial-gradient(circle, #000 8%, transparent 46%)" }} />
  );
}

function Star({ size = 18, color = C.gold }: { size?: number; color?: string }) {
  return <svg viewBox="0 0 20 20" width={size} height={size} style={{ display: "inline-block", verticalAlign: "-0.1em" }}><path d="M10 1l2.6 6.2 6.7.5-5.1 4.4 1.6 6.5L10 15.1 4.2 18.6l1.6-6.5L.7 7.7l6.7-.5z" fill={color} /></svg>;
}

function Crown({ size = 60, color = C.gold }: { size?: number; color?: string }) {
  return (
    <svg viewBox="0 0 120 70" width={size} height={size * 0.58}>
      <path d="M10 62 L6 16 L34 40 L60 4 L86 40 L114 16 L110 62 Z" fill={color} />
      <rect x="8" y="58" width="104" height="10" fill={color} />
    </svg>
  );
}

function Banner({ label, value, i }: { label: string; value: number; i: number }) {
  const { ref, visible } = useReveal();
  const h = 120 + value * 3.4;
  return (
    <div ref={ref} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: "1 1 0", minWidth: 92 }}>
      <div style={{ width: "100%", height: 10, background: `linear-gradient(${C.gold}, #8a6a22)`, borderRadius: 5 }} />
      <div style={{ width: "82%", overflow: "hidden", height: visible ? h : 0, transition: `height 1.6s cubic-bezier(.2,1.2,.4,1) ${i * 130}ms` }}>
        <div style={{ height: h, background: i % 2 ? C.deep : C.red, clipPath: "polygon(0 0, 100% 0, 100% 100%, 50% calc(100% - 26px), 0 100%)", display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 18, gap: 14, boxShadow: "inset 0 0 40px rgba(0,0,0,.35)" }}>
          <Star size={26} />
          <span style={{ ...block, fontSize: "clamp(1.6rem, 2.6vw, 2.4rem)", color: C.cream }}>{value}</span>
          <span style={{ ...cond, writingMode: "vertical-rl", transform: "rotate(180deg)", fontSize: "clamp(.9rem, 1.3vw, 1.15rem)", letterSpacing: ".2em", color: C.cream }}>{label}</span>
        </div>
      </div>
    </div>
  );
}

function Poster({ text, i }: { text: string; i: number }) {
  const { ref, visible } = useReveal();
  const looks = [
    { bg: C.red, fg: C.cream },
    { bg: C.cream, fg: C.ink },
    { bg: C.black, fg: C.red },
    { bg: C.gold, fg: C.ink },
    { bg: C.deep, fg: C.cream },
  ][i % 5];
  const rot = [-3, 2.5, -1.5, 3.5, -2][i % 5];
  return (
    <div ref={ref} style={{ background: looks.bg, color: looks.fg, padding: "26px 22px 22px", minHeight: 220, display: "flex", flexDirection: "column", justifyContent: "space-between", boxShadow: "0 20px 40px rgba(0,0,0,.45)", transform: visible ? `rotate(${rot}deg)` : `rotate(${rot * 3}deg) scale(1.25)`, opacity: visible ? 1 : 0, transition: `transform .7s cubic-bezier(.2,1.6,.4,1) ${i * 110}ms, opacity .3s ${i * 110}ms`, position: "relative" }}>
      <span style={{ position: "absolute", top: -8, left: "50%", width: 70, height: 18, marginLeft: -35, background: "rgba(239,228,207,.55)", transform: "rotate(-4deg)" }} />
      <span style={{ ...mono, fontSize: 11, letterSpacing: ".2em", opacity: 0.7 }}>{["ЛОЗУНГ", "LOZUNG", "ПРИКАЗ", "ВОЗЗВАНИЕ", "ДЕВИЗ"][i % 5]} № {i + 1}</span>
      <p style={{ ...cond, fontSize: "clamp(1.6rem, 2.8vw, 2.4rem)", lineHeight: 0.98, letterSpacing: ".01em", margin: "18px 0" }}>{text}!</p>
      <span style={{ display: "flex", gap: 6 }}>{[0, 1, 2].map((k) => <Star key={k} size={16} color={looks.fg} />)}</span>
    </div>
  );
}

export default function KingWorld({ perfume }: WorldProps) {
  const [, navigate] = useLocation();
  const { lang, setLang, t } = useLang();
  const [open, setOpen] = useState(false);
  const [subjects, setSubjects] = useSubjects();
  const [mine, setMine] = useState<number | null>(null);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const fragments = pick(lang, perfume.memoryFragments).map(fragmentText);
  const n = perfume.scentNotes;
  const tiers = [
    { title: t("Корона", "The Crown"), sub: t("верхние ноты", "top notes"), notes: n.top ? pick(lang, n.top) : [], w: "38%", bg: C.red, fg: C.cream },
    { title: t("Двор", "The Court"), sub: t("ноты сердца", "heart notes"), notes: n.heart ? pick(lang, n.heart) : [], w: "64%", bg: C.cream, fg: C.ink },
    { title: t("Подданные", "The Subjects"), sub: t("базовые ноты", "base notes"), notes: n.base ? pick(lang, n.base) : [], w: "100%", bg: C.deep, fg: C.cream },
  ];

  const kneel = () => {
    const me = subjects + 1;
    setSubjects(me);
    setMine(me);
    timer.current = window.setTimeout(() => setOpen(true), prefersReducedMotion() ? 0 : 1100);
  };

  const skin: DialogSkin = {
    overlay: "rgba(12,11,11,.88)",
    panel: { background: C.cream, color: C.ink, padding: "34px 28px", border: `6px solid ${C.red}`, outline: `2px solid ${C.ink}`, outlineOffset: -14, boxShadow: "0 40px 100px rgba(0,0,0,.6)" },
    title: { ...block, fontSize: 24, color: C.red, lineHeight: 1.1 },
    label: { ...cond, fontSize: 12, letterSpacing: ".2em", color: "rgba(20,16,14,.6)" },
    input: { ...decree, fontSize: 18, background: "transparent", border: "none", borderBottom: `2px solid ${C.ink}`, padding: "6px 0", color: C.ink },
    button: { ...block, fontSize: 15, background: C.red, color: C.cream, padding: "16px", letterSpacing: ".04em" },
    accent: C.red,
    heading: { ru: "Прошение на имя короля", en: "Petition to the king" },
    submit: { ru: "Присягнуть", en: "Swear allegiance" },
    sent: { ru: "Присяга принята. Король доволен.", en: "Oath accepted. The king is pleased." },
  };

  return (
    <div style={{ background: C.black, color: C.cream, minHeight: "100vh", overflowX: "hidden" }}>
      <style>{`
        .kg-rays { animation: kg-spin 90s linear infinite; }
        @keyframes kg-spin { to { transform: rotate(360deg); } }
        .kg-mq { display: flex; width: max-content; animation: kg-mq 26s linear infinite; }
        .kg-mq.rev { animation-direction: reverse; }
        @keyframes kg-mq { to { transform: translateX(-50%); } }
        .kg-grain::after { content: ""; position: fixed; inset: 0; pointer-events: none; z-index: 60; opacity: .18; mix-blend-mode: overlay;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"); }
        .kg-kneel { transition: transform .15s ease, background .3s; }
        .kg-kneel:hover { background: #e01b2a !important; }
        .kg-kneel:active { transform: scale(.985); }
        .kg-pop { animation: kg-pop .9s cubic-bezier(.2,1.6,.4,1); }
        @keyframes kg-pop { from { transform: scale(1.6); color: ${C.gold}; } }
        @media (prefers-reduced-motion: reduce) { .kg-rays, .kg-mq { animation: none; } }
      `}</style>
      <div className="kg-grain" />

      <nav style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 30, display: "flex", justifyContent: "space-between", padding: "18px clamp(16px,3vw,36px)", ...cond, fontSize: 14, letterSpacing: ".2em" }}>
        <button onClick={() => navigate("/map")} style={{ color: C.cream }}>← {t("Карта", "Map")}</button>
        <span style={{ color: C.gold }}><Star size={14} /> {t("Министерство аромата", "Ministry of scent")} <Star size={14} /></span>
        <span>{(["ru", "en"] as const).map((l) => <button key={l} onClick={() => setLang(l)} style={{ marginLeft: 12, color: lang === l ? C.red : C.cream }}>{l}</button>)}</span>
      </nav>

      {/* the monument */}
      <header style={{ position: "relative", minHeight: "100vh", overflow: "hidden", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <Rays />
        <h1 aria-label="Narcisstic King" style={{ ...block, position: "relative", zIndex: 1, fontSize: "clamp(4rem, 17vw, 17rem)", lineHeight: 0.85, marginTop: "10vh", color: C.cream, letterSpacing: "-0.04em", textShadow: `0 10px 0 ${C.deep}` }}>{t("КОРОЛЬ", "KING")}</h1>
        <div style={{ position: "relative", zIndex: 2, marginTop: "-6vh", width: "min(560px, 90vw)", height: "52vh" }}>
          <Bottle3D style={{ position: "absolute", inset: 0 }} lighting="gold" liquid="#6a0d1a" liquidOpacity={0.95} glass="#ffe8d0" cap="#c9a24a" capRoughness={0.3} collar="#e8c56a" spin={0.25}
            drawLabel={(ctx, w, h) => {
              ctx.fillStyle = "#c1121f"; ctx.fillRect(0, 0, w, h);
              ctx.fillStyle = "#efe4cf"; ctx.textAlign = "center";
              ctx.font = "80px 'Rubik Mono One', sans-serif"; ctx.fillText("КОРОЛЬ", w / 2, h * 0.5);
              ctx.font = "700 54px 'Oswald', sans-serif"; ctx.fillText("NARCISSTIC KING", w / 2, h * 0.75);
              ctx.font = "60px serif"; ctx.fillText("★", w / 2, h * 0.24);
            }} />
        </div>
        {/* pedestal */}
        <div style={{ position: "relative", zIndex: 1, width: "min(420px, 76vw)", marginTop: -14 }}>
          <div style={{ height: 22, background: "linear-gradient(#e9dcc2, #b9a988)", clipPath: "polygon(6% 0, 94% 0, 100% 100%, 0 100%)" }} />
          <div style={{ height: "18vh", background: "linear-gradient(90deg, #9c8f74, #e3d6bb 30%, #cbbd9f 70%, #8f8268)", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 6, color: "#3b2f20" }}>
            <span style={{ ...cond, fontSize: "clamp(1.1rem, 2.4vw, 1.7rem)", letterSpacing: ".3em" }}>Narcisstic King</span>
            <span style={{ ...decree, fontStyle: "italic", fontSize: 15 }}>{pick(lang, perfume.tagline)}</span>
          </div>
        </div>
        {/* diagonal slogan band */}
        <div style={{ position: "absolute", left: "-10%", right: "-10%", bottom: "13vh", zIndex: 3, transform: "rotate(-6deg)", background: C.red, color: C.cream, padding: "12px 0", overflow: "hidden", boxShadow: "0 10px 30px rgba(0,0,0,.5)" }}>
          <div className="kg-mq" style={{ ...block, fontSize: "clamp(1rem, 2vw, 1.6rem)" }}>
            {[0, 1].map((k) => <span key={k} style={{ whiteSpace: "nowrap", paddingRight: 30 }}>{Array.from({ length: 4 }).map(() => t("ДА ЗДРАВСТВУЕТ КОРОЛЬ ★ ВЛАСТЬ — ЭТО АРОМАТ ★ ", "LONG LIVE THE KING ★ POWER IS A SCENT ★ ")).join("")}</span>)}
          </div>
        </div>
        {/* live counter */}
        <div style={{ position: "absolute", right: "clamp(16px,3vw,36px)", bottom: "clamp(16px,3vh,30px)", zIndex: 4, ...cond, letterSpacing: ".08em", textAlign: "right", textShadow: "0 2px 12px rgba(0,0,0,.8)" }}>
          <p style={{ fontSize: "clamp(1.6rem, 3vw, 2.6rem)", color: C.gold }}><Star size={22} /> {fmt(subjects)}</p>
          <p style={{ fontSize: 13, letterSpacing: ".25em", color: C.cream, opacity: 0.8 }}>{t("подданных преклонили колено", "subjects have knelt")}</p>
        </div>
      </header>

      {/* Decree № 1 */}
      <section style={{ padding: "16vh clamp(16px,5vw,64px) 10vh", display: "flex", justifyContent: "center" }}>
        <div style={{ position: "relative", maxWidth: 820, width: "100%", background: C.cream, color: C.ink, padding: "clamp(28px,5vw,60px)", boxShadow: "0 30px 80px rgba(0,0,0,.6)", transform: "rotate(-1deg)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: `4px double ${C.ink}`, paddingBottom: 16, marginBottom: 24 }}>
            <h2 style={{ ...block, fontSize: "clamp(1.8rem, 4.5vw, 3.4rem)", lineHeight: 1, color: C.red }}>{t("УКАЗ № 1", "DECREE № 1")}</h2>
            <Crown size={70} color={C.ink} />
          </div>
          <p style={{ ...decree, fontSize: "clamp(1.3rem, 2.4vw, 1.9rem)", lineHeight: 1.45 }}>{pick(lang, perfume.description)}</p>
          <p style={{ ...cond, fontSize: 15, letterSpacing: ".25em", marginTop: 28 }}>{t("Повелеваю:", "I command:")}</p>
          <ol style={{ ...decree, fontSize: "clamp(1.05rem, 1.7vw, 1.3rem)", lineHeight: 1.6, marginTop: 8, paddingLeft: 26, listStyle: "upper-roman" }}>
            <li>{t("носить на коже как корону;", "to wear it on the skin like a crown;")}</li>
            <li>{t("не отводить взгляд первым;", "never to look away first;")}</li>
            <li>{t(`помнить: ${pick(lang, perfume.tagline).toLowerCase()}.`, `to remember: ${pick(lang, perfume.tagline).toLowerCase()}.`)}</li>
          </ol>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: 34, gap: 20, flexWrap: "wrap" }}>
            <div>
              <p style={{ fontFamily: "'Caveat', cursive", fontSize: 40, lineHeight: 1, color: C.ink }}>{t("Его Величество", "His Majesty")}</p>
              <p style={{ ...mono, fontSize: 11, opacity: 0.6 }}>{pick(lang, perfume.origin.location)} · {perfume.releaseDate}</p>
            </div>
            <div style={{ width: 130, height: 130, borderRadius: "50%", border: `4px solid ${C.red}`, color: C.red, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", transform: "rotate(-14deg)", opacity: 0.85, ...cond, fontSize: 14, letterSpacing: ".15em", textAlign: "center" }}>
              <Crown size={44} color={C.red} />
              {t("утверждено", "approved")}
            </div>
          </div>
        </div>
      </section>

      {/* the pyramid */}
      <section style={{ padding: "10vh clamp(16px,5vw,64px)", maxWidth: 1100, margin: "0 auto" }}>
        <Title kicker={t("Общественный порядок", "Social order")} title={t("Иерархия", "Hierarchy")} />
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
          <Crown size={90} />
          {tiers.map((tier) => (
            <div key={tier.title} style={{ width: tier.w, minWidth: "min(280px, 100%)", background: tier.bg, color: tier.fg, padding: "22px 20px", textAlign: "center", boxShadow: "0 14px 30px rgba(0,0,0,.4)" }}>
              <p style={{ ...block, fontSize: "clamp(1rem, 2vw, 1.5rem)" }}>{tier.title}</p>
              <p style={{ ...mono, fontSize: 11, letterSpacing: ".2em", opacity: 0.7, marginTop: 4 }}>{tier.sub}</p>
              <p style={{ ...cond, fontWeight: 600, fontSize: "clamp(1rem, 1.8vw, 1.35rem)", letterSpacing: ".06em", marginTop: 12, lineHeight: 1.4 }}>{tier.notes.join(" · ")}</p>
            </div>
          ))}
        </div>
      </section>

      {/* banners */}
      <section style={{ padding: "10vh clamp(16px,5vw,64px)", maxWidth: 1200, margin: "0 auto" }}>
        <Title kicker={t("Показатели величия", "Measures of greatness")} title={t("Знамёна", "Banners")} />
        <div style={{ display: "flex", gap: "clamp(8px,2vw,22px)", alignItems: "flex-start", overflowX: "auto", paddingBottom: 10 }}>
          {perfume.radarAxes.map((a, i) => <Banner key={a.key} label={pick(lang, a.label)} value={a.value} i={i} />)}
        </div>
      </section>

      {/* slogans */}
      <section style={{ padding: "10vh clamp(16px,5vw,64px)", maxWidth: 1200, margin: "0 auto" }}>
        <Title kicker={t("Со стен столицы", "From the walls of the capital")} title={t("Лозунги", "Slogans")} />
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 26, padding: "10px 6px" }}>
          {fragments.map((f, i) => <div key={i} style={{ flex: "0 1 210px" }}><Poster text={f} i={i} /></div>)}
        </div>
      </section>

      {/* kneel */}
      <section style={{ padding: "12vh clamp(16px,5vw,64px) 0" }}>
        <button className="kg-kneel" onClick={kneel} style={{ width: "100%", background: C.red, color: C.cream, padding: "clamp(28px,6vh,56px) 16px", ...block, fontSize: "clamp(1.6rem, 5.5vw, 5rem)", lineHeight: 1, boxShadow: `0 -10px 0 ${C.deep} inset` }}>
          {t("ПРЕКЛОНИТЬ КОЛЕНО", "KNEEL")}
        </button>
        <div style={{ textAlign: "center", padding: "26px 0 40px", ...cond, letterSpacing: ".12em" }}>
          {mine ? (
            <p key={mine} className="kg-pop" style={{ fontSize: "clamp(1.2rem, 2.4vw, 1.8rem)", color: C.gold }}><Star /> {t(`Вы — подданный № ${fmt(mine)}`, `You are subject № ${fmt(mine)}`)} <Star /></p>
          ) : (
            <p style={{ fontSize: 14, letterSpacing: ".25em", opacity: 0.7 }}>{t("Король ждёт", "The king is waiting")} · Extrait de parfum · {perfume.origin.coords}</p>
          )}
        </div>
        <div style={{ margin: "0 -10%", background: C.cream, color: C.ink, padding: "10px 0", overflow: "hidden" }}>
          <div className="kg-mq rev" style={{ ...cond, fontSize: 18, letterSpacing: ".2em" }}>
            {[0, 1].map((k) => <span key={k} style={{ whiteSpace: "nowrap", paddingRight: 30 }}>{Array.from({ length: 6 }).map(() => t("НЕТ ВЛАСТИ КРОМЕ АРОМАТА ★ ", "NO POWER BUT SCENT ★ ")).join("")}</span>)}
          </div>
        </div>
      </section>
      <RequestDialog open={open} onClose={() => setOpen(false)} perfumeName={perfume.name} skin={skin} />
    </div>
  );
}

function Title({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div style={{ textAlign: "center", marginBottom: 36 }}>
      <p style={{ ...cond, fontSize: 14, letterSpacing: ".35em", color: C.gold }}><Star size={12} /> {kicker} <Star size={12} /></p>
      <h2 style={{ ...block, fontSize: "clamp(2.4rem, 7vw, 6rem)", lineHeight: 0.95, color: C.cream, marginTop: 8 }}>{title}</h2>
    </div>
  );
}
