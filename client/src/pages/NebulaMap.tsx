// Silentium — the emotional nebula map.
// Three choices, each a dive through a nebula; the last layer reveals the matching bottles.

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { useLocation } from "wouter";
import { useLang } from "@/contexts/LangContext";
import { NebulaEngine, type NebulaItem } from "@/components/nebula/NebulaEngine";
import { step1Emotions, getStep2Emotions, getStep3Emotions, getResultPerfumes, getPerfumeById } from "@/lib/perfumes";
import { EMOTION_META } from "@/lib/emotionLayouts";
import { EMOTION_COLORS, emotionName } from "@/lib/emotions";
import { BOTTLE_COLORS } from "@/lib/bottleLooks";

const mono: CSSProperties = { fontFamily: "'JetBrains Mono', 'DM Mono', monospace" };
const serif: CSSProperties = { fontFamily: "'Cormorant Garamond', serif" };
const INK = "#efe9ff";
const DIM = "rgba(239,233,255,.55)";

export default function NebulaMap() {
  const [, navigate] = useLocation();
  const { lang, setLang, t } = useLang();
  const hostRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<NebulaEngine | null>(null);
  const [path, setPath] = useState<string[]>([]);
  const pathRef = useRef<string[]>([]);
  const [hovered, setHovered] = useState<NebulaItem | null>(null);
  const langRef = useRef(lang);
  langRef.current = lang;

  const emotionItems = useCallback((ids: string[]): NebulaItem[] =>
    ids.map((id) => ({ id, kind: "emotion", label: emotionName(id, langRef.current), color: EMOTION_COLORS[id] ?? "#ffffff" })), []);

  const perfumeItems = useCallback((ids: string[]): NebulaItem[] =>
    ids.map((id) => {
      const p = getPerfumeById(id);
      const look = BOTTLE_COLORS[id];
      return { id, kind: "perfume", label: p?.name ?? id, color: look?.glow ?? "#ffffff", liquid: look?.liquid, cap: look?.cap };
    }), []);

  const itemsFor = useCallback((p: string[]): NebulaItem[] => {
    if (p.length === 0) return emotionItems(step1Emotions);
    if (p.length === 1) return emotionItems(getStep2Emotions(p[0]));
    if (p.length === 2) return emotionItems(getStep3Emotions(p[0], p[1]));
    return perfumeItems(getResultPerfumes(p[0], p[1], p[2]));
  }, [emotionItems, perfumeItems]);

  useEffect(() => {
    const engine = new NebulaEngine(hostRef.current!, labelRef.current!, {
      onHover: setHovered,
      onSelect: (item) => {
        if (item.kind === "perfume") { navigate(`/perfume/${item.id}`); return; }
        const next = [...pathRef.current, item.id];
        pathRef.current = next;
        setPath(next);
        engine.push(itemsFor(next), item.id);
      },
    });
    engineRef.current = engine;
    engine.push(itemsFor([]));
    return () => { engine.dispose(); engineRef.current = null; };
  }, [itemsFor, navigate]);

  useEffect(() => {
    engineRef.current?.relabel((it) => (it.kind === "emotion" ? emotionName(it.id, lang) : it.label));
  }, [lang]);

  const back = () => {
    const e = engineRef.current;
    if (!e || e.busy || pathRef.current.length === 0) return;
    const next = pathRef.current.slice(0, -1);
    pathRef.current = next;
    setPath(next);
    e.pop();
  };
  const reset = () => {
    const e = engineRef.current;
    if (!e || e.busy || pathRef.current.length === 0) return;
    pathRef.current = [];
    setPath([]);
    e.reset();
  };

  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => { if (ev.key === "Escape") back(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const step = path.length;
  const last = path[path.length - 1];
  const question = step === 0 ? t("Что вы чувствуете сейчас?", "What do you feel right now?")
    : step === 1 ? t(`Что живёт внутри — ${emotionName(last, "ru").toLowerCase()}?`, `What lives inside ${emotionName(last, "en").toLowerCase()}?`)
    : step === 2 ? t("И глубже всего?", "And deepest of all?")
    : t("Туманность нашла ваш аромат", "The nebula found your scent");

  const meta = hovered?.kind === "emotion" ? EMOTION_META[hovered.id] : null;
  const perfume = hovered?.kind === "perfume" ? getPerfumeById(hovered.id) : null;
  const unlocks = hovered?.kind === "emotion"
    ? (step === 0 ? getStep2Emotions(hovered.id) : step === 1 ? getStep3Emotions(path[0], hovered.id) : getResultPerfumes(path[0], path[1], hovered.id).map((id) => getPerfumeById(id)?.name ?? id))
    : [];

  return (
    <div style={{ position: "fixed", inset: 0, background: "#030208", color: INK, overflow: "hidden", userSelect: "none" }}>
      <style>{`
        .nebula-label { position: absolute; left: 0; top: 0; display: inline-flex; align-items: center; gap: 10px; padding: 8px 14px; border-radius: 999px;
          font-family: 'JetBrains Mono', monospace; font-size: 13px; letter-spacing: .18em; text-transform: uppercase; color: ${INK};
          background: rgba(10,8,20,.35); border: 1px solid rgba(239,233,255,.12); backdrop-filter: blur(6px); white-space: nowrap;
          transition: opacity .4s ease, background .3s, border-color .3s, letter-spacing .3s; will-change: transform; }
        .nebula-label.is-hover, .nebula-label:focus-visible { background: rgba(239,233,255,.12); border-color: rgba(239,233,255,.5); letter-spacing: .24em; outline: none; }
        .nebula-label--perfume { font-family: 'Cormorant Garamond', serif; font-style: italic; font-size: 22px; letter-spacing: .02em; text-transform: none; padding: 8px 18px; }
        .nebula-label--perfume.is-hover { letter-spacing: .04em; }
        .nebula-label__dot { width: 8px; height: 8px; border-radius: 50%; flex: none; }
        .nebula-label__cta { font-family: 'JetBrains Mono', monospace; font-style: normal; font-size: 14px; opacity: .7; }
        .nb-btn { color: ${DIM}; transition: color .2s; } .nb-btn:hover { color: ${INK}; }
        .nb-q { animation: nb-q 1.4s cubic-bezier(.16,1,.3,1) both; } @keyframes nb-q { from { opacity: 0; transform: translateY(10px); filter: blur(8px); } }
        @media (max-width: 720px) { .nb-panel { left: 16px !important; right: 16px !important; width: auto !important; bottom: 120px !important; } .nebula-label { font-size: 11px; padding: 6px 10px; } }
      `}</style>

      <div ref={hostRef} style={{ position: "absolute", inset: 0 }} />
      <div ref={labelRef} style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 5 }} />
      {/* vignette + grain */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 6, background: "radial-gradient(ellipse at center, transparent 55%, rgba(3,2,8,.75))" }} />

      {/* header */}
      <header style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 10, display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "22px clamp(16px,3vw,32px)", ...mono, fontSize: 12, letterSpacing: ".2em" }}>
        <button className="nb-btn" onClick={() => navigate("/")}>← SILENTIUM</button>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }} aria-label={t(`Шаг ${Math.min(step + 1, 4)} из 4`, `Step ${Math.min(step + 1, 4)} of 4`)}>
          {[0, 1, 2, 3].map((i) => (
            <span key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ width: i === step ? 10 : 7, height: i === step ? 10 : 7, borderRadius: "50%", background: i < step ? EMOTION_COLORS[path[i]] : i === step ? INK : "transparent", border: i > step ? `1px solid ${DIM}` : "none", boxShadow: i < step ? `0 0 10px ${EMOTION_COLORS[path[i]]}` : "none", transition: "all .4s" }} />
              {i < 3 && <span style={{ width: 28, height: 1, background: i < step ? "rgba(239,233,255,.5)" : "rgba(239,233,255,.15)" }} />}
            </span>
          ))}
        </div>
        <span>{(["ru", "en"] as const).map((l) => <button key={l} className="nb-btn" onClick={() => setLang(l)} style={{ marginLeft: 12, color: lang === l ? INK : undefined }}>{l.toUpperCase()}</button>)}</span>
      </header>

      {/* question */}
      <div style={{ position: "absolute", top: "clamp(64px, 10vh, 96px)", left: 0, right: 0, zIndex: 10, textAlign: "center", pointerEvents: "none", padding: "0 16px" }}>
        <p style={{ ...mono, fontSize: 11, letterSpacing: ".35em", color: DIM, textTransform: "uppercase" }}>{t("эмоциональная туманность", "emotional nebula")}</p>
        <h1 key={question} className="nb-q" style={{ ...serif, fontStyle: "italic", fontWeight: 300, fontSize: "clamp(1.8rem, 4vw, 3.2rem)", lineHeight: 1.1, marginTop: 8, textShadow: "0 2px 30px rgba(3,2,8,.9)" }}>{question}</h1>
      </div>

      {/* path + controls */}
      <div style={{ position: "absolute", left: "clamp(16px,3vw,32px)", bottom: "clamp(16px,4vh,32px)", zIndex: 10, display: "flex", flexDirection: "column", gap: 14, ...mono, fontSize: 12 }}>
        {path.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
            {path.map((id, i) => (
              <span key={id + i} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 12px", borderRadius: 999, border: "1px solid rgba(239,233,255,.15)", background: "rgba(10,8,20,.5)", letterSpacing: ".14em", textTransform: "uppercase" }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: EMOTION_COLORS[id], boxShadow: `0 0 8px ${EMOTION_COLORS[id]}` }} />
                {emotionName(id, lang)}
              </span>
            ))}
          </div>
        )}
        <div style={{ display: "flex", gap: 22, letterSpacing: ".18em", textTransform: "uppercase" }}>
          {path.length > 0 && <button className="nb-btn" onClick={back}>← {t("назад", "back")}</button>}
          {path.length > 1 && <button className="nb-btn" onClick={reset}>⊙ {t("к началу", "restart")}</button>}
          {path.length === 0 && <span style={{ color: DIM }}>{t("наведите на туманность · нажмите, чтобы войти", "hover a nebula · click to dive in")}</span>}
        </div>
      </div>

      {/* hover panel */}
      {hovered && (meta || perfume) && (
        <aside className="nb-panel" style={{ pointerEvents: "none", position: "absolute", right: "clamp(16px,3vw,32px)", bottom: "clamp(16px,4vh,32px)", width: 320, zIndex: 10, padding: "20px 22px", borderRadius: 14, background: "rgba(10,8,20,.62)", backdropFilter: "blur(18px)", border: `1px solid ${hovered.color}55`, boxShadow: `0 0 50px ${hovered.color}22` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
            <span style={{ ...(perfume ? { ...serif, fontStyle: "italic", fontSize: 28 } : { ...mono, fontSize: 14, letterSpacing: ".2em", textTransform: "uppercase" as const }), color: INK }}>{hovered.label}</span>
            {meta && <span style={{ ...mono, fontSize: 12, color: hovered.color }}>{meta.score}%</span>}
          </div>
          {meta && (
            <>
              <p style={{ ...serif, fontStyle: "italic", fontSize: 20, lineHeight: 1.3, marginTop: 10, color: INK }}>{lang === "ru" ? meta.description.ru : meta.description.en}</p>
              <div style={{ height: 2, background: "rgba(239,233,255,.1)", marginTop: 14, borderRadius: 2 }}><div style={{ width: `${meta.score}%`, height: "100%", background: hovered.color, borderRadius: 2, boxShadow: `0 0 10px ${hovered.color}` }} /></div>
              {unlocks.length > 0 && (
                <p style={{ ...mono, fontSize: 11, color: DIM, marginTop: 14, lineHeight: 1.7, letterSpacing: ".08em" }}>
                  {step < 2 ? t("внутри: ", "inside: ") : t("ведёт к: ", "leads to: ")}
                  <span style={{ color: INK }}>{unlocks.map((u) => (step < 2 ? emotionName(u, lang) : u)).join(" · ")}</span>
                </p>
              )}
            </>
          )}
          {perfume && (
            <>
              <p style={{ ...serif, fontStyle: "italic", fontSize: 20, lineHeight: 1.3, marginTop: 8, color: INK }}>{lang === "ru" ? perfume.tagline.ru : perfume.tagline.en}</p>
              <p style={{ ...mono, fontSize: 11, color: DIM, marginTop: 10, letterSpacing: ".12em", textTransform: "uppercase" }}>{perfume.emotionalPath.map((e) => emotionName(e, lang)).join(" · ")}</p>
              <p style={{ ...mono, fontSize: 12, color: hovered.color, marginTop: 14, letterSpacing: ".18em", textTransform: "uppercase" }}>{t("нажмите, чтобы войти →", "click to enter →")}</p>
            </>
          )}
        </aside>
      )}
    </div>
  );
}
