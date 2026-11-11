// Silent Fog — "Beresta": birch bark, white with black marks, the way the scent is white ozone and black birch tar.
// The page opens in a whiteout and you walk into a birch grove (trunks drift past at different depths)
// to the bottle on a stump; then the same grove white and black side by side with a divider you drag;
// the drydown pins and the whole page goes from rain and fog to black tar; the notes are scratched on
// strips of birch bark; strength as birches growing out of the fog; the scenes hide in a fog you light
// up with a lantern; and a drop of tar falls into milk-white water to send a request.

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useLocation } from "wouter";
import { useLang } from "@/contexts/LangContext";
import Bottle3D from "@/components/Bottle3D";
import RequestDialog, { type DialogSkin } from "@/components/RequestDialog";
import { useReveal } from "@/lib/useReveal";
import { fragmentText, loopWhileVisible, pick, prefersReducedMotion, type WorldProps } from "./shared";

const C = { milk: "#eef1f1", fog: "#dfe4e5", grey: "#9aa3a5", ink: "#1d2224", tar: "#0b0c0d", dim: "rgba(29,34,36,.55)", faint: "rgba(29,34,36,.16)", light: "#f4f6f6", lightDim: "rgba(244,246,246,.6)" };
const serif: CSSProperties = { fontFamily: "'Cormorant Garamond', serif", fontWeight: 300 };
const wide: CSSProperties = { fontFamily: "'Jost', sans-serif", fontWeight: 300, textTransform: "uppercase", letterSpacing: ".42em" };
const body: CSSProperties = { fontFamily: "'Manrope', sans-serif", fontWeight: 300 };
const scratch: CSSProperties = { fontFamily: "'Old Standard TT', serif", fontStyle: "italic" };
const IMG = "/images/silent-fog";

const bottleLabel = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
  ctx.fillStyle = "#f2f4f4"; ctx.fillRect(0, 0, w, h);
  // birch marks across the label
  ctx.fillStyle = "#16191a";
  for (let i = 0; i < 9; i++) {
    const y = ((i * 37) % 100) / 100 * h, x = ((i * 61) % 100) / 100 * w, len = 40 + ((i * 29) % 90);
    ctx.beginPath(); ctx.ellipse(x, y, len, 4 + (i % 3) * 3, 0, 0, Math.PI * 2); ctx.fill();
  }
  ctx.fillStyle = "rgba(242,244,244,.86)"; ctx.fillRect(w * 0.08, h * 0.36, w * 0.84, h * 0.36);
  ctx.fillStyle = "#16191a"; ctx.textAlign = "center";
  ctx.font = "300 104px 'Cormorant Garamond', serif"; ctx.fillText("silent fog", w / 2, h * 0.58);
  ctx.font = "300 26px 'Jost', sans-serif"; ctx.fillText("O Z O N E  ·  B I R C H  T A R", w / 2, h * 0.68);
};
const bottleLook = { liquid: "#cfd7d9", liquidOpacity: 0.55, glass: "#ffffff", cap: "#141617", capRoughness: 0.6, collar: "#c9d0d2" };

function coverPoint(W: number, H: number, iw: number, ih: number, fx: number, fy: number) {
  const s = Math.max(W / iw, H / ih);
  return { x: (W - iw * s) / 2 + fx * iw * s, y: (H - ih * s) / 2 + fy * ih * s, s };
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

// Text that slowly comes out of the fog
function Emerge({ children, style, delay = 0 }: { children: React.ReactNode; style?: CSSProperties; delay?: number }) {
  const { ref, visible } = useReveal();
  return <div ref={ref} style={{ ...style, opacity: visible ? 1 : 0.04, filter: visible ? "blur(0)" : "blur(16px)", transition: `opacity 2.6s ease ${delay}ms, filter 3s ease ${delay}ms` }}>{children}</div>;
}

function Head({ kicker, title, dark }: { kicker: string; title: string; dark?: boolean }) {
  return (
    <Emerge style={{ textAlign: "center", marginBottom: 50 }}>
      <p style={{ ...wide, fontSize: 12, color: dark ? C.lightDim : C.dim }}>{kicker}</p>
      <h2 style={{ ...serif, fontSize: "clamp(2.4rem, 6vw, 4.8rem)", lineHeight: 1, marginTop: 12, color: dark ? C.light : C.ink }}>{title}</h2>
    </Emerge>
  );
}

// Drifting banks of fog (white smoke on transparency)
function Drift({ count = 4, opacity = 0.7, tint }: { count?: number; opacity?: number; tint?: string }) {
  if (prefersReducedMotion()) return null;
  return (
    <div aria-hidden style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
      {Array.from({ length: count }, (_, i) => (
        <img key={i} className="fg-drift" src={`${IMG}/fog.webp`} alt="" style={{ top: `${-20 + ((i * 37) % 70)}%`, opacity, filter: tint, animationDuration: `${38 + i * 9}s`, animationDelay: `${-i * 13}s` }} />
      ))}
    </div>
  );
}

// ── 1. Into the grove: a whiteout, then birches drift past at different depths ──
const STUMP = { x: 0.498, y: 0.588 }; // top of the stump in grove.webp (3:2)
const TRUNKS = [
  { src: "birch-1", x: 6, h: 150, depth: 2.4, flip: false },
  { src: "birch-2", x: 84, h: 160, depth: 2.9, flip: true },
  { src: "birch-3", x: 30, h: 120, depth: 1.5, flip: true },
  { src: "birch-1", x: 66, h: 115, depth: 1.3, flip: false },
];
// Phones get their own, sparser set. iOS Safari drops huge scaled layers (they turn into blank fog), so on a phone
// each trunk scales on its own small box, without blur, and never grows as large as on desktop.
const BIRCH_AR: Record<string, number> = { "birch-1": 233 / 1536, "birch-2": 341 / 1536, "birch-3": 208 / 1536 };
const TRUNKS_PHONE = [
  { src: "birch-3", x: 13, h: 128, depth: 1.5, flip: true },
  { src: "birch-2", x: 90, h: 128, depth: 1.9, flip: true },
  { src: "birch-1", x: 72, h: 92, depth: 1.1, flip: false, far: true },
];

function Grove({ t, description }: { t: (ru: string, en: string) => string; description: string }) {
  const still = prefersReducedMotion();
  const { ref, p } = usePinProgress<HTMLElement>(!still);
  const vp = useViewport();
  const k = still ? 1 : p;
  const stump = coverPoint(vp.w, vp.h, 1536, 1024, STUMP.x, STUMP.y);
  const origin = `${stump.x}px ${stump.y}px`;
  const white = still ? 0 : Math.max(0, 1 - k / 0.32); // the whiteout lifts first
  const titleOut = Math.min(1, k / 0.22);
  const bh = 0.15 * 1024 * stump.s; // bottle height in screen px before the zoom
  const phone = vp.w < 820;
  return (
    <section ref={ref} style={{ position: "relative", height: still ? "100svh" : "320svh", background: C.milk }}>
      <div style={{ position: still ? "relative" : "sticky", top: 0, height: "100svh", overflow: "hidden" }}>
        {/* the grove and the bottle on the stump walk towards you together */}
        <div style={{ position: "absolute", inset: 0, transformOrigin: origin, transform: `scale(${1 + k * (phone ? 0.9 : 1.15)})`, willChange: "transform" }}>
          <img src={`${IMG}/grove.webp`} alt={t("Берёзовая роща в густом тумане", "A birch grove in thick fog")} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
          <div style={{ position: "absolute", left: stump.x, top: stump.y, width: bh * 0.62, height: bh, transform: "translate(-50%, -88%)" }}>
            <Bottle3D style={{ position: "absolute", inset: 0 }} lighting="fog" {...bottleLook} spin={0.12} drawLabel={bottleLabel} />
          </div>
        </div>
        {/* nearer trunks pass the camera faster */}
        {!still && !phone && TRUNKS.map((b, i) => {
          const s = 1 + k * b.depth * 1.6;
          const fade = Math.max(0, Math.min(1, (1.05 - k * (0.5 + b.depth * 0.22)) * 2));
          return (
            <div key={i} aria-hidden style={{ position: "absolute", inset: 0, transformOrigin: origin, transform: `scale(${s})`, opacity: fade * (0.55 + Math.min(1, k * 3) * 0.45), pointerEvents: "none" }}>
              <img src={`${IMG}/${b.src}.webp`} alt="" style={{ position: "absolute", left: `${b.x}%`, bottom: `${-8 - b.depth * 6}%`, height: `${b.h}%`, maxWidth: "none", transform: `translateX(-50%) ${b.flip ? "scaleX(-1)" : ""}`, filter: `blur(${Math.max(0, (b.depth - 1.4) * 1.2)}px) contrast(${0.5 + b.depth * 0.13}) brightness(${1.18 - b.depth * 0.05})` }} />
            </div>
          );
        })}
        {!still && phone && TRUNKS_PHONE.map((b, i) => {
          const h = (b.h / 100) * vp.h, w = h * BIRCH_AR[b.src];
          const left = (b.x / 100) * vp.w - w / 2, top = vp.h * (1 + (8 + b.depth * 6) / 100) - h;
          const s = 1 + k * b.depth * 1.1;
          const fade = Math.max(0, Math.min(1, (1.05 - k * (0.5 + b.depth * 0.3)) * 2));
          return (
            <div key={i} aria-hidden style={{ position: "absolute", left, top, width: w, height: h, pointerEvents: "none", transformOrigin: `${stump.x - left}px ${stump.y - top}px`, transform: `scale(${s})`, opacity: fade * (b.depth < 1.3 ? 0.75 : 1) * (0.6 + Math.min(1, k * 3) * 0.4) }}>
              <img src={`${IMG}/${b.src}.webp`} alt="" style={{ display: "block", width: "100%", height: "100%", maxWidth: "none", transform: b.flip ? "scaleX(-1)" : undefined, ...("far" in b ? { maskImage: "linear-gradient(transparent, #000 30%)", WebkitMaskImage: "linear-gradient(transparent, #000 30%)" } : null) }} />
            </div>
          );
        })}
        <Drift count={3} opacity={0.32} />
        {/* the whiteout */}
        <div aria-hidden style={{ position: "absolute", inset: 0, background: C.milk, opacity: white, pointerEvents: "none" }} />
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "0 16px", opacity: 1 - titleOut, filter: `blur(${titleOut * 10}px)`, pointerEvents: "none" }}>
          <p style={{ ...wide, fontSize: 12, color: C.dim }}>{t("Берёзовый дёготь · озон", "Birch tar · ozone")}</p>
          <h1 style={{ ...serif, fontSize: "clamp(4rem, 13vw, 11rem)", lineHeight: 0.9, color: C.ink, margin: "14px 0 18px", letterSpacing: "-.01em" }}>Silent Fog</h1>
          <p style={{ ...body, fontSize: "clamp(1.02rem, 1.6vw, 1.25rem)", lineHeight: 1.6, color: C.dim, maxWidth: 520 }}>{description}</p>
        </div>
        {!still && <p className="fg-hint" style={{ position: "absolute", left: 0, right: 0, bottom: 24, textAlign: "center", ...wide, fontSize: 11, color: C.dim, opacity: 1 - titleOut }}>{t("Листайте — войдём в туман", "Scroll — into the fog")}</p>}
      </div>
    </section>
  );
}

// ── 2. White / black: the same grove in two states, a divider you drag ──
function Contrast({ t, top, base }: { t: (ru: string, en: string) => string; top: string[]; base: string[] }) {
  const box = useRef<HTMLDivElement>(null);
  const [x, setX] = useState(50);
  const touched = useRef(false);
  const dragging = useRef(false);
  const { ref: seen, visible } = useReveal();
  useEffect(() => {
    if (prefersReducedMotion() || !box.current) return;
    const t0 = performance.now();
    // breathes until you take it
    return loopWhileVisible(box.current, (now) => { if (!touched.current) setX(50 + Math.sin((now - t0) / 1600) * 14); }, "0px");
  }, []);
  const moveTo = (clientX: number) => {
    const r = box.current!.getBoundingClientRect();
    setX(Math.max(4, Math.min(96, ((clientX - r.left) / r.width) * 100)));
  };
  const share = Math.round(100 - x); // how much of the picture is black
  return (
    <section style={{ position: "relative", background: `linear-gradient(180deg, ${C.milk}, ${C.fog})`, padding: "110px clamp(12px,3vw,40px) 120px" }}>
      <Head kicker={t("Главный контраст", "The contrast")} title={t("Белое и чёрное", "White and black")} />
      <div ref={seen as React.RefObject<HTMLDivElement>} style={{ maxWidth: 1240, margin: "0 auto" }}>
        <div ref={box} className="fg-split" role="slider" tabIndex={0} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(x)} aria-label={t("Граница между туманом и дёгтем", "The line between fog and tar")}
          onPointerDown={(e) => { touched.current = true; dragging.current = true; (e.target as Element).setPointerCapture?.(e.pointerId); moveTo(e.clientX); }}
          onPointerMove={(e) => { if (dragging.current) moveTo(e.clientX); }}
          onPointerUp={() => { dragging.current = false; }}
          onKeyDown={(e) => { if (e.key === "ArrowLeft" || e.key === "ArrowRight") { touched.current = true; setX((v) => Math.max(4, Math.min(96, v + (e.key === "ArrowLeft" ? -4 : 4)))); } }}
          style={{ position: "relative", aspectRatio: "3 / 2", borderRadius: 4, overflow: "hidden", cursor: "ew-resize", touchAction: "pan-y", boxShadow: "0 40px 90px rgba(20,24,26,.25)", opacity: visible ? 1 : 0, transition: "opacity 1.6s ease" }}>
          <img src={`${IMG}/white.webp`} alt={t("Берёзы в белом утреннем тумане", "Birches in white morning fog")} draggable={false} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
          <img src={`${IMG}/black.webp`} alt={t("Те же берёзы ночью, в чёрном дыму", "The same birches at night, in black smoke")} draggable={false} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", clipPath: `inset(0 0 0 ${x}%)` }} />
          <span aria-hidden style={{ position: "absolute", top: 0, bottom: 0, left: `${x}%`, width: 2, marginLeft: -1, background: "linear-gradient(#fff, #fff 50%, #000 50%, #000)", boxShadow: "0 0 18px rgba(255,255,255,.6)" }} />
          <span aria-hidden className="fg-knob" style={{ left: `${x}%` }}>
            <span style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "linear-gradient(90deg, #f4f6f6 50%, #0b0c0d 50%)" }} />
            <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: C.ink }}>‹</span>
            <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: C.light }}>›</span>
          </span>
          <div style={{ position: "absolute", left: "3%", top: "5%", maxWidth: "40%", color: C.ink, opacity: x > 22 ? 1 : 0, transition: "opacity .4s", pointerEvents: "none" }}>
            <p style={{ ...wide, fontSize: 11 }}>{t("Озон", "Ozone")}</p>
            <p className="fg-split-notes" style={{ ...serif, fontSize: "clamp(1.1rem, 2.2vw, 1.8rem)", lineHeight: 1.2, marginTop: 6 }}>{top.join(" · ")}</p>
          </div>
          <div style={{ position: "absolute", right: "3%", top: "5%", maxWidth: "40%", textAlign: "right", color: C.light, opacity: x < 78 ? 1 : 0, transition: "opacity .4s", pointerEvents: "none" }}>
            <p style={{ ...wide, fontSize: 11 }}>{t("Дёготь", "Tar")}</p>
            <p className="fg-split-notes" style={{ ...serif, fontSize: "clamp(1.1rem, 2.2vw, 1.8rem)", lineHeight: 1.2, marginTop: 6 }}>{base.join(" · ")}</p>
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: 18, gap: 16, flexWrap: "wrap" }}>
          <p style={{ ...body, fontSize: 15, color: C.dim, maxWidth: 560, lineHeight: 1.6 }}>{t("Потяните границу. Свежесть и дёготь звучат одновременно: белое наверху, чёрное в глубине.", "Drag the line. Freshness and tar play at the same time: white on top, black underneath.")}</p>
          <p style={{ ...wide, fontSize: 11, color: C.ink, letterSpacing: ".3em" }}>{t("Туман", "Fog")} {100 - share}% · {t("дёготь", "tar")} {share}%</p>
        </div>
      </div>
    </section>
  );
}

// Raindrops running down the glass (first stage of the drydown)
function Rain({ on }: { on: boolean }) {
  const drops = useMemo(() => Array.from({ length: 34 }, (_, i) => ({ x: (i * 37) % 100, d: 2.6 + (i % 5) * 0.9, delay: -((i * 0.83) % 6), s: 3 + (i % 4) * 2 })), []);
  if (prefersReducedMotion()) return null;
  return (
    <div aria-hidden style={{ position: "absolute", inset: 0, pointerEvents: "none", opacity: on ? 1 : 0, transition: "opacity 1.2s ease" }}>
      {drops.map((d, i) => <span key={i} className="fg-drop" style={{ left: `${d.x}%`, width: d.s, height: d.s * 1.5, animationDuration: `${d.d}s`, animationDelay: `${d.delay}s` }} />)}
    </div>
  );
}

// ── 4. The drydown: the page itself goes from rain and fog to black tar ──
const STAGES = [`${IMG}/stage-rain.webp`, `${IMG}/stage-air.webp`, `${IMG}/stage-tar.webp`];

function Clearing({ stages, t }: { stages: { when: string; text: string; notes: string }[]; t: (ru: string, en: string) => string }) {
  const still = prefersReducedMotion();
  const { ref, p } = usePinProgress<HTMLElement>(!still);
  const stage = still ? 0 : Math.min(2, Math.floor(p * 3));
  // a flick settles on the middle of a stage instead of skipping the heart (same trick as the map's landings)
  useEffect(() => {
    if (still) return;
    const root = document.documentElement;
    root.style.scrollSnapType = "y proximity";
    return () => { root.style.scrollSnapType = ""; };
  }, [still]);
  const dark = still ? 0 : Math.max(0, Math.min(1, (p - 0.45) / 0.45)); // white → black
  const mix = (a: number[], b: number[]) => `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * dark)).join(",")})`;
  const bg = mix([238, 241, 241], [11, 12, 13]);
  const ink = mix([29, 34, 36], [244, 246, 246]);
  const fogLeft = still ? 0.3 : Math.max(0, 1 - p * 1.4);
  return (
    <section ref={ref} style={{ position: "relative", height: still ? "auto" : "340svh", background: bg }}>
      {!still && [1, 3, 5].map((n) => <div key={n} aria-hidden style={{ position: "absolute", left: 0, width: 1, height: 1, top: `calc(240svh * ${n} / 6)`, scrollSnapAlign: "start", pointerEvents: "none" }} />)}
      <div style={{ position: still ? "relative" : "sticky", top: 0, minHeight: "100svh", display: "flex", flexDirection: "column", justifyContent: "center", padding: "70px clamp(16px,4vw,48px) 30px", overflow: "hidden", color: ink }}>
        <div aria-hidden style={{ position: "absolute", inset: 0, opacity: fogLeft, pointerEvents: "none" }}><Drift count={5} opacity={0.75} /></div>
        <div style={{ textAlign: "center", position: "relative" }}>
          <p style={{ ...wide, fontSize: 12, opacity: 0.6 }}>{t("Как раскрывается на коже", "How it unfolds on skin")}</p>
          <h2 style={{ ...serif, fontSize: "clamp(2.2rem, 5vw, 4rem)", marginTop: 8 }}>{t("Туман уходит", "The fog lifts")}</h2>
        </div>
        <div className="fg-lift" style={{ position: "relative", maxWidth: 1100, width: "100%", margin: "30px auto 0", display: "grid", gridTemplateColumns: "minmax(0,.9fr) minmax(0,1.1fr)", gap: "26px 60px", alignItems: "center" }}>
          <div className="fg-lift-photo" style={{ position: "relative", aspectRatio: "2 / 3", maxHeight: "62svh", width: "100%", margin: "0 auto", borderRadius: 3, overflow: "hidden", boxShadow: `0 40px 80px rgba(0,0,0,${0.15 + dark * 0.45})` }}>
            {STAGES.map((src, i) => <img key={src} src={src} alt="" loading="lazy" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: still ? (i === 0 ? 1 : 0) : stage === i ? 1 : 0, transform: stage === i ? "scale(1)" : "scale(1.06)", transition: "opacity 1.2s ease, transform 2.4s ease" }} />)}
            <Rain on={stage === 0} />
            <div aria-hidden style={{ position: "absolute", inset: 0, background: `rgba(238,241,241,${stage === 1 ? 0.28 : 0})`, transition: "background 1.2s" }} />
          </div>
          <div className="fg-lift-text" style={{ position: "relative", minHeight: "min(44svh, 360px)" }}>
            {stages.map((s, i) => (
              <article key={i} style={{ position: still ? "relative" : "absolute", inset: still ? undefined : 0, display: "flex", flexDirection: "column", justifyContent: "center", opacity: still || stage === i ? 1 : 0, filter: still || stage === i ? "blur(0)" : "blur(10px)", transition: "opacity .55s ease, filter .55s ease", marginBottom: still ? 30 : 0 }}>
                <p style={{ ...wide, fontSize: 11, opacity: 0.6 }}>{String(i + 1).padStart(2, "0")} · {t(["верх", "сердце", "база"][i], ["top", "heart", "base"][i])}</p>
                <p style={{ ...serif, fontSize: "clamp(2.4rem, 5vw, 4rem)", lineHeight: 1, marginTop: 10 }}>{s.when}</p>
                <p style={{ ...body, fontSize: "clamp(1.05rem, 1.6vw, 1.25rem)", lineHeight: 1.6, marginTop: 16 }}>{s.text}</p>
                <p style={{ ...wide, fontSize: 10, letterSpacing: ".22em", opacity: 0.55, marginTop: 18, lineHeight: 2 }}>{s.notes}</p>
              </article>
            ))}
          </div>
        </div>
        {!still && (
          <div aria-hidden style={{ display: "flex", justifyContent: "center", gap: 10, marginTop: 26 }}>
            {[0, 1, 2].map((i) => <span key={i} style={{ width: 40, height: 2, background: ink, opacity: i <= stage ? 0.9 : 0.2, transition: "opacity .4s" }} />)}
          </div>
        )}
      </div>
    </section>
  );
}

// ── 5. Birch-bark letters: every note scratched on a strip of bark ──
function BarkLetters({ groups }: { groups: { tier: string; notes: string[] }[] }) {
  return (
    <div style={{ maxWidth: 1180, margin: "0 auto", display: "flex", flexDirection: "column", gap: 46 }}>
      {groups.map((g, gi) => (
        <div key={gi}>
          <Emerge><p style={{ ...wide, fontSize: 11, color: C.lightDim, textAlign: "center", marginBottom: 18 }}>{g.tier}</p></Emerge>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "18px 22px" }}>
            {g.notes.map((n, i) => {
              const k = gi * 5 + i;
              return (
                <Emerge key={n} delay={i * 120}>
                  <div className="fg-bark" style={{ position: "relative", width: "clamp(170px, 22vw, 260px)", aspectRatio: "2", transform: `rotate(${((k * 37) % 9) - 4}deg)` }}>
                    <img src={`${IMG}/bark-${(k % 2) + 1}.webp`} alt="" aria-hidden style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain", filter: "drop-shadow(0 14px 18px rgba(0,0,0,.55))" }} />
                    <span style={{ ...scratch, position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 14%", textAlign: "center", fontSize: "clamp(1.05rem, 1.7vw, 1.45rem)", lineHeight: 1.05, color: "#3a2a1c", textShadow: "0 1px 0 rgba(255,255,255,.55), 0 -1px 0 rgba(0,0,0,.25)" }}>{n}</span>
                  </div>
                </Emerge>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── 6. Strength as birches growing out of the fog ──
function Birches({ facets, lang }: { facets: { label: { ru: string; en: string }; value: number }[]; lang: "ru" | "en" }) {
  const { ref, visible } = useReveal();
  return (
    <div ref={ref} className="fg-birches" style={{ position: "relative", maxWidth: 1000, margin: "0 auto", height: 520, display: "flex", alignItems: "flex-end", justifyContent: "space-around", gap: 10 }}>
      {facets.map((f, i) => (
        <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", height: "100%", justifyContent: "flex-end", flex: "1 1 0", minWidth: 0 }}>
          <p style={{ ...serif, fontSize: 30, color: C.ink, opacity: visible ? 1 : 0, transition: `opacity 1s ${1400 + i * 150}ms` }}>{f.value}</p>
          <div style={{ width: "clamp(26px, 5vw, 54px)", height: visible ? `${f.value * 0.8}%` : "0%", backgroundImage: `url(${IMG}/bark-tile.webp)`, backgroundSize: "160px auto", backgroundPosition: `${i * 37}px ${i * 53}px`, borderRadius: "40% 40% 2px 2px / 6px 6px 2px 2px", boxShadow: "inset -6px 0 10px rgba(0,0,0,.18), inset 4px 0 8px rgba(255,255,255,.4)", transition: `height 2.2s cubic-bezier(.16,1,.3,1) ${i * 150}ms` }} />
          <p style={{ ...body, fontSize: 13, lineHeight: 1.3, color: C.ink, textAlign: "center", marginTop: 12, minHeight: "2.6em" }}>{pick(lang, f.label)}</p>
        </div>
      ))}
      <div aria-hidden style={{ position: "absolute", left: "-6%", right: "-6%", bottom: 40, height: 120, background: "radial-gradient(ellipse at 50% 100%, rgba(238,241,241,.95), rgba(238,241,241,0) 70%)", pointerEvents: "none" }} />
    </div>
  );
}

// ── 7. Scenes hidden in fog: the pointer is a lantern ──
const SCENES = [1, 2, 3, 4].map((i) => `${IMG}/scene-${i}.webp`);

function Lantern({ scenes, t }: { scenes: string[]; t: (ru: string, en: string) => string }) {
  const area = useRef<HTMLDivElement>(null);
  const cards = useRef<(HTMLDivElement | null)[]>([]);
  const [found, setFound] = useState<boolean[]>(() => scenes.map(() => false));
  const user = useRef(false);
  useEffect(() => {
    const el = area.current; if (!el) return;
    const still = prefersReducedMotion();
    if (still) { setFound(scenes.map(() => true)); el.style.setProperty("--r", "0px"); return; }
    const lit = scenes.map(() => false);
    // r = the area's rect, read before any style write so the frame never forces an extra layout
    const put = (px: number, py: number, r: DOMRect) => {
      if (!lit.every(Boolean)) cards.current.forEach((c, i) => {
        if (!c || lit[i]) return;
        const b = c.getBoundingClientRect();
        if (px + r.left > b.left && px + r.left < b.right && py + r.top > b.top && py + r.top < b.bottom) { lit[i] = true; setFound((f) => (f[i] ? f : f.map((v, j) => (j === i ? true : v)))); }
      });
      el.style.setProperty("--x", `${px}px`); el.style.setProperty("--y", `${py}px`);
    };
    const move = (e: PointerEvent) => { user.current = true; const r = el.getBoundingClientRect(); put(e.clientX - r.left, e.clientY - r.top, r); };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerdown", move);
    // until someone takes the lantern, it wanders on its own
    const t0 = performance.now();
    const stop = loopWhileVisible(el, (now) => {
      if (user.current) return;
      const r = el.getBoundingClientRect(), s = (now - t0) / 1000;
      put((0.5 + Math.sin(s * 0.45) * 0.36) * r.width, (0.5 + Math.sin(s * 0.7 + 1) * 0.3) * r.height, r);
    }, "0px");
    return () => { stop(); el.removeEventListener("pointermove", move); el.removeEventListener("pointerdown", move); };
  }, [scenes]);
  return (
    <div ref={area} className="fg-lantern" style={{ position: "relative", maxWidth: 1180, margin: "0 auto", borderRadius: 6, overflow: "hidden", touchAction: "pan-y", ["--x" as string]: "50%", ["--y" as string]: "50%" }}>
      <div className="fg-scenes" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "clamp(10px, 2vw, 22px)", padding: "clamp(16px, 3vw, 40px)", background: "#c3cacc" }}>
        {scenes.map((s, i) => (
          <div key={i} ref={(el) => { cards.current[i] = el; }} style={{ position: "relative" }}>
            <img src={SCENES[i]} alt={s} loading="lazy" style={{ width: "100%", aspectRatio: "3 / 4", objectFit: "cover", borderRadius: 2, filter: "grayscale(.35) contrast(1.05)" }} />
            <p style={{ ...serif, fontSize: "clamp(1rem, 1.5vw, 1.25rem)", lineHeight: 1.3, color: C.ink, marginTop: 12, minHeight: "2.6em" }}>{s}</p>
          </div>
        ))}
      </div>
      {/* the fog with a hole where the lantern shines; what you've lit stays a little clearer */}
      <div aria-hidden className="fg-veil">
        <Drift count={4} opacity={0.9} />
      </div>
      <div aria-hidden style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "radial-gradient(circle at var(--x) var(--y), rgba(255,236,200,.18), transparent 22%)", mixBlendMode: "screen" }} />
      <p style={{ position: "absolute", left: 0, right: 0, bottom: 14, textAlign: "center", ...wide, fontSize: 10, color: C.dim, pointerEvents: "none", opacity: found.every(Boolean) ? 0 : 1, transition: "opacity .6s" }}>{t("Водите фонарём по туману", "Sweep the lantern through the fog")} · {found.filter(Boolean).length}/{scenes.length}</p>
    </div>
  );
}

// ── 8. The request: a drop of tar falls into milk-white water ──
function TarDrop({ onDone, t }: { onDone: () => void; t: (ru: string, en: string) => string }) {
  const [n, setN] = useState(0);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const drop = () => {
    setN((x) => x + 1);
    clearTimeout(timer.current);
    timer.current = window.setTimeout(onDone, prefersReducedMotion() ? 0 : 2600);
  };
  return (
    <button onClick={drop} className="fg-pool" aria-label={t("Уронить каплю дёгтя и оставить заявку", "Let a drop of tar fall and leave a request")} style={{ position: "relative", width: "min(560px, 92vw)", height: 380, marginTop: 20, background: "transparent", cursor: "pointer" }}>
      {/* the hanging drop */}
      <span aria-hidden className={n ? "fg-falling" : "fg-hanging"} key={`d${n}`} style={{ position: "absolute", left: "50%", top: 0, width: 22, height: 30, marginLeft: -11, background: "radial-gradient(circle at 35% 35%, #4a4f52, #0b0c0d 60%)", borderRadius: "50% 50% 50% 50% / 60% 60% 40% 40%", boxShadow: "0 6px 12px rgba(0,0,0,.25)" }} />
      {/* the water surface */}
      <span aria-hidden style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 150, borderRadius: "50%", background: "radial-gradient(ellipse at 50% 40%, #ffffff, #e6eaea 60%, #d6dcdd)", boxShadow: "inset 0 10px 30px rgba(0,0,0,.08), 0 30px 60px rgba(0,0,0,.12)" }} />
      {n > 0 && (
        <span key={`i${n}`} aria-hidden style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 150, borderRadius: "50%", overflow: "hidden" }}>
          <img className="fg-ink" src={`${IMG}/ink.webp`} alt="" />
          {[0, 1, 2].map((r) => <span key={r} className="fg-ring" style={{ animationDelay: `${0.62 + r * 0.25}s` }} />)}
        </span>
      )}
      {n === 0 && <span className="fg-hint" style={{ position: "absolute", left: 0, right: 0, bottom: 168, textAlign: "center", ...wide, fontSize: 11, color: C.dim }}>{t("Нажмите — капля упадёт", "Tap — let the drop fall")}</span>}
    </button>
  );
}

export default function FogWorld({ perfume }: WorldProps) {
  const [, navigate] = useLocation();
  const { lang, setLang, t } = useLang();
  const [open, setOpen] = useState(false);
  const g = perfume.guide!;
  const n = perfume.scentNotes;
  const Lp = (v: { ru: string; en: string }) => pick(lang, v);
  const fragments = pick(lang, perfume.memoryFragments).map(fragmentText);
  const tier = (k: "top" | "heart" | "base") => (n[k] ? pick(lang, n[k]!) : []);
  const stages = g.drydown.map((d) => ({ when: Lp(d.when), text: Lp(d.text), notes: tier(d.notes).join(" · ") }));
  const groups = [
    { tier: t("Верх", "Top"), notes: tier("top") },
    { tier: t("Сердце", "Heart"), notes: tier("heart") },
    { tier: t("База", "Base"), notes: tier("base") },
  ];

  const skin: DialogSkin = {
    overlay: "rgba(238,241,241,.82)",
    panel: { ...body, background: "#f7f9f9", padding: "34px 30px", color: C.ink, borderRadius: 4, boxShadow: "0 40px 100px rgba(20,24,26,.25)", border: `1px solid ${C.faint}` },
    title: { ...serif, fontSize: 40, color: C.ink },
    label: { ...wide, fontSize: 10, letterSpacing: ".3em", color: C.dim },
    input: { ...body, fontSize: 15, background: "#ffffff", border: `1px solid ${C.faint}`, padding: "11px 12px", color: C.ink, borderRadius: 2 },
    button: { ...wide, fontSize: 12, letterSpacing: ".35em", background: C.tar, color: C.light, padding: "15px", borderRadius: 2 },
    accent: C.ink,
    heading: { ru: "Капля в тумане", en: "A drop in the fog" },
    submit: { ru: "Отправить", en: "Send" },
    sent: { ru: "Получили. Ответим, когда рассеется туман.", en: "Received. We'll answer when the fog clears." },
  };

  const facts: [string, string][] = [
    [t("Сезон", "Season"), Lp(g.season)],
    [t("Когда носить", "When to wear"), Lp(g.time)],
  ];

  return (
    <div style={{ ...body, background: C.milk, color: C.ink, minHeight: "100vh", overflowX: "clip" }}>
      <style>{`
        .fg-hint { animation: fg-bob 2.6s ease-in-out infinite; } @keyframes fg-bob { 50% { transform: translateY(6px); opacity: .6; } }
        .fg-drift { position: absolute; left: -30%; width: 110%; max-width: none; animation: fg-drift linear infinite; }
        @keyframes fg-drift { 0% { transform: translateX(-20%) scale(1); } 50% { transform: translateX(25%) scale(1.1); } 100% { transform: translateX(-20%) scale(1); } }
        .fg-knob { position: absolute; top: 50%; width: 54px; height: 54px; margin: -27px 0 0 -27px; border-radius: 50%; box-shadow: 0 10px 30px rgba(0,0,0,.35), 0 0 0 2px rgba(255,255,255,.6); pointer-events: none; }
        .fg-drop { position: absolute; top: -10px; border-radius: 50% 50% 50% 50% / 40% 40% 60% 60%; background: radial-gradient(circle at 35% 30%, rgba(255,255,255,.9), rgba(255,255,255,.15) 60%); box-shadow: 0 1px 2px rgba(0,0,0,.25); animation: fg-run linear infinite; }
        @keyframes fg-run { 0% { transform: translateY(0); opacity: 0; } 10% { opacity: 1; } 100% { transform: translateY(110vh); opacity: .6; } }
        .fg-bark { transition: transform .5s cubic-bezier(.3,1.5,.5,1); } .fg-bark:hover { transform: rotate(0deg) scale(1.06) !important; }
        .fg-lantern { cursor: none; } @media (pointer: coarse) { .fg-lantern { cursor: auto; } }
        .fg-veil { position: absolute; inset: 0; pointer-events: none; background: rgba(214,220,221,.97);
          -webkit-mask-image: radial-gradient(circle at var(--x) var(--y), transparent 0, transparent 130px, #000 280px);
          mask-image: radial-gradient(circle at var(--x) var(--y), transparent 0, transparent 130px, #000 280px); }
        .fg-hanging { animation: fg-hang 2.6s ease-in-out infinite; transform-origin: 50% 0; }
        @keyframes fg-hang { 50% { transform: scaleY(1.12); } }
        .fg-falling { animation: fg-fall .62s cubic-bezier(.55,0,1,.45) forwards; }
        @keyframes fg-fall { 0% { transform: none; } 90% { transform: translateY(280px) scaleY(1.3); opacity: 1; } 100% { transform: translateY(300px) scale(.4); opacity: 0; } }
        .fg-ink { position: absolute; left: 50%; top: 45%; width: 520px; max-width: none; margin: -260px 0 0 -260px; transform: scale(.02) rotate(0deg); opacity: 0; animation: fg-ink 3.2s cubic-bezier(.15,.7,.2,1) .58s forwards; }
        @keyframes fg-ink { 0% { transform: scale(.02, .01) rotate(0deg); opacity: 0; } 8% { opacity: .95; } 100% { transform: scale(1, .42) rotate(25deg); opacity: .9; } }
        .fg-ring { position: absolute; left: 50%; top: 45%; width: 40px; height: 16px; margin: -8px 0 0 -20px; border-radius: 50%; border: 1px solid rgba(29,34,36,.35); opacity: 0; animation: fg-ring 1.8s ease-out forwards; }
        @keyframes fg-ring { 0% { transform: scale(.3); opacity: .8; } 100% { transform: scale(9); opacity: 0; } }
        @media (prefers-reduced-motion: reduce) { .fg-hint, .fg-drift, .fg-drop, .fg-hanging { animation: none; } }
        @media (max-width: 820px) {
          .fg-two, .fg-lift { grid-template-columns: 1fr !important; }
          .fg-lift-photo { height: 34svh !important; max-height: none !important; width: auto !important; }
          .fg-split-notes { display: none; }
          .fg-lift-text { min-height: 250px !important; }
          .fg-scenes { grid-template-columns: repeat(2, 1fr) !important; }
          .fg-birches { height: 380px !important; }
          .fg-facts { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 50, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px clamp(16px,3vw,28px)", ...wide, fontSize: 11, letterSpacing: ".25em", color: C.ink, mixBlendMode: "difference", filter: "invert(1)" }}>
        <button onClick={() => navigate("/map")}>← {t("Карта", "Map")}</button>
        <span style={{ ...serif, textTransform: "none", letterSpacing: ".04em", fontSize: 18 }}>Silentium</span>
        <span>{(["ru", "en"] as const).map((l) => <button key={l} onClick={() => setLang(l)} style={{ marginLeft: 10, opacity: lang === l ? 1 : 0.45 }}>{l.toUpperCase()}</button>)}</span>
      </nav>

      <Grove t={t} description={pick(lang, perfume.description)} />
      <Contrast t={t} top={tier("top")} base={tier("base")} />

      {/* what it smells like */}
      <section style={{ position: "relative", background: C.fog, padding: "110px clamp(16px,4vw,48px) 120px", overflow: "hidden" }}>
        <Drift count={3} opacity={0.6} />
        <div className="fg-two" style={{ position: "relative", maxWidth: 1180, margin: "0 auto", display: "grid", gridTemplateColumns: "1.25fr .75fr", gap: "40px 70px", alignItems: "center" }}>
          <Emerge>
            <p style={{ ...wide, fontSize: 12, color: C.dim }}>{t("Как он пахнет", "What it smells like")}</p>
            <p style={{ ...serif, fontSize: "clamp(1.55rem, 2.7vw, 2.25rem)", lineHeight: 1.35, marginTop: 16 }}>{Lp(g.plain)}</p>
            <dl className="fg-facts" style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "18px 30px", marginTop: 38 }}>
              {facts.map(([k, v]) => (
                <div key={k} style={{ borderTop: `1px solid ${C.faint}`, paddingTop: 12 }}>
                  <dt style={{ ...wide, fontSize: 10, letterSpacing: ".3em", color: C.dim }}>{k}</dt>
                  <dd style={{ fontSize: 16, lineHeight: 1.45, marginTop: 6 }}>{v}</dd>
                </div>
              ))}
            </dl>
            {g.tip && <p style={{ marginTop: 24, fontSize: 15, color: C.dim }}>— {Lp(g.tip)}</p>}
          </Emerge>
          <Emerge delay={300} style={{ textAlign: "center" }}>
            <p style={{ ...wide, fontSize: 11, color: C.dim }}>{t("Шлейф", "Sillage")}</p>
            <p style={{ ...serif, fontSize: "clamp(3rem, 6.5vw, 5.4rem)", lineHeight: 1, margin: "8px 0" }}>{Lp(g.sillage).split(" — ")[0]}</p>
            <p style={{ fontSize: 14, lineHeight: 1.6, color: C.dim, marginTop: 18, maxWidth: 300, marginInline: "auto" }}>{Lp(g.sillage).split(" — ")[1]}</p>
          </Emerge>
        </div>
      </section>

      <Clearing stages={stages} t={t} />

      {/* what it's made of: birch-bark letters on the black */}
      <section style={{ position: "relative", background: `radial-gradient(ellipse at 50% 0%, #1c2022, ${C.tar} 70%)`, padding: "110px clamp(12px,3vw,40px) 120px" }}>
        <Head kicker={t("Берестяные грамоты", "Birch-bark letters")} title={t("Из чего он сделан", "What it's made of")} dark />
        <BarkLetters groups={groups} />
      </section>

      {/* memories, condensing out of the dark into the fog */}
      <section style={{ position: "relative", background: `linear-gradient(180deg, ${C.tar}, #3a4244 30%, ${C.fog} 70%, ${C.milk})`, padding: "120px clamp(16px,6vw,90px) 140px", overflow: "hidden" }}>
        {fragments.map((f, i) => (
          <Emerge key={i} delay={i * 150} style={{ textAlign: i % 2 ? "right" : "left", margin: "0 0 9vh" }}>
            <p style={{ ...serif, fontStyle: "italic", fontSize: "clamp(1.8rem, 4.4vw, 3.6rem)", lineHeight: 1.1, color: i < 2 ? C.light : C.ink, opacity: 0.9 }}>{f}</p>
          </Emerge>
        ))}
      </section>

      {/* strength: birches */}
      <section style={{ position: "relative", background: C.milk, padding: "100px clamp(16px,4vw,48px) 110px" }}>
        <Head kicker={t("Характер", "Character")} title={t("Чего в нём больше всего", "What it holds the most of")} />
        <Birches facets={g.facets} lang={lang} />
      </section>

      {/* scenes: lantern in the fog */}
      <section style={{ position: "relative", background: `linear-gradient(180deg, ${C.milk}, ${C.fog})`, padding: "100px clamp(12px,3vw,40px) 110px" }}>
        <Head kicker={t("На что это похоже", "What it feels like")} title={t("Что прячется в тумане", "What hides in the fog")} />
        <Lantern scenes={pick(lang, g.scenes)} t={t} />
      </section>

      {/* request: a drop of tar */}
      <section style={{ position: "relative", background: C.milk, padding: "110px 16px 120px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", overflow: "hidden" }}>
        <Head kicker={t("Заявка", "Request")} title={t("Капля дёгтя", "A drop of tar")} />
        <p style={{ fontSize: 17, color: C.dim, marginTop: -26 }}>{t("В бочке тумана — одна чёрная капля. Нажмите, и откроется заявка.", "One black drop in a barrel of fog. Tap it and the request opens.")}</p>
        <TarDrop onDone={() => setOpen(true)} t={t} />
        <p style={{ fontSize: 15, color: C.dim, maxWidth: 440, lineHeight: 1.6, marginTop: 34 }}>{t("Оставьте контакт — мы напишем и расскажем, как получить флакон.", "Leave your contact — we'll write and tell you how to get a bottle.")}</p>
        <p style={{ ...wide, fontSize: 10, letterSpacing: ".25em", color: C.dim, marginTop: 10 }}>Extrait de parfum · {perfume.releaseDate} · {pick(lang, perfume.origin.location)}</p>
      </section>

      <RequestDialog open={open} onClose={() => setOpen(false)} perfumeName={perfume.name} skin={skin} />
    </div>
  );
}
