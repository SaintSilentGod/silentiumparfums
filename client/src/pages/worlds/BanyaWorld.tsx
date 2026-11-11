// Russian Banya — a banya day, in the order of the ritual.
// A log banya on a frozen lake at blue hour: scrolling flies you up to the glowing door until steam
// floods the screen; inside, the steam room is fogged over and you wipe the glass (a birch venik
// follows the pointer and sheds leaves); the drydown is "give it steam" — the ladle pours onto the
// stones three times and the thermometer climbs; the notes hang drying in the changing room; strength
// as wooden thermometers; then out into the snow by the ice hole while frost creeps over the screen;
// and tea from the samovar to send a request.

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useLocation } from "wouter";
import { useLang } from "@/contexts/LangContext";
import Bottle3D from "@/components/Bottle3D";
import RequestDialog, { type DialogSkin } from "@/components/RequestDialog";
import { useReveal } from "@/lib/useReveal";
import { fragmentText, loopWhileVisible, pick, prefersReducedMotion, type WorldProps } from "./shared";

const C = { wood: "#6b4426", woodD: "#2a170c", woodL: "#a8743f", ink: "#1e120a", cream: "#f3e2c4", ember: "#ff7a2a", red: "#d2301c", ice: "#cfe3f2", night: "#0d1a2e", dim: "rgba(243,226,196,.66)" };
const display: CSSProperties = { fontFamily: "'Yeseva One', 'Playfair Display', serif" };
const body: CSSProperties = { fontFamily: "'Manrope', sans-serif" };
const mono: CSSProperties = { fontFamily: "'JetBrains Mono', monospace" };
const IMG = "/images/russian-banya";
const LEAVES = Array.from({ length: 8 }, (_, i) => `${IMG}/leaf-${i + 1}.webp`);

const PLANKS = `repeating-linear-gradient(0deg, rgba(0,0,0,.35) 0 2px, transparent 2px 78px),
  repeating-linear-gradient(90deg, rgba(255,220,170,.05) 0 3px, transparent 3px 11px, rgba(0,0,0,.05) 11px 13px, transparent 13px 29px),
  linear-gradient(180deg, ${C.woodL}, ${C.wood} 40%, #5a361c)`;
const DARK_PLANKS = `repeating-linear-gradient(0deg, rgba(0,0,0,.4) 0 2px, transparent 2px 90px),
  repeating-linear-gradient(90deg, rgba(255,200,140,.03) 0 3px, transparent 3px 13px),
  linear-gradient(180deg, #3a2112, ${C.woodD})`;

const bottleLabel = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
  ctx.fillStyle = "#c9925a"; ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 40; i++) { ctx.strokeStyle = `rgba(80,40,10,${0.08 + ((i * 37) % 10) / 80})`; ctx.lineWidth = 1 + (i % 3); ctx.beginPath(); const y = ((i * 53) % 100) / 100 * h; ctx.moveTo(0, y); ctx.bezierCurveTo(w * .3, y + 10, w * .6, y - 10, w, y + 4); ctx.stroke(); }
  ctx.fillStyle = "#2a160a"; ctx.textAlign = "center";
  ctx.font = "130px 'Yeseva One', serif"; ctx.fillText("БАНЯ", w / 2, h * 0.55);
  ctx.font = "34px 'JetBrains Mono', monospace"; ctx.fillText("RUSSIAN BANYA · 92°", w / 2, h * 0.82);
};
const bottleLook = { liquid: "#8a4f1e", liquidOpacity: 0.9, glass: "#fff2e0", cap: "#3a2414", capRoughness: 0.9, collar: "#b98a52" };

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

function Reveal({ children, delay = 0, style }: { children: React.ReactNode; delay?: number; style?: CSSProperties }) {
  const { ref, visible } = useReveal();
  return <div ref={ref} style={{ ...style, opacity: visible ? 1 : 0, transform: visible ? "none" : "translateY(24px)", transition: `opacity 1.2s ease ${delay}ms, transform 1.2s cubic-bezier(.16,1,.3,1) ${delay}ms` }}>{children}</div>;
}

function Head({ kicker, title, color = C.ember }: { kicker: string; title: string; color?: string }) {
  return (
    <div style={{ textAlign: "center", marginBottom: 46 }}>
      <p style={{ ...mono, fontSize: 12, letterSpacing: ".3em", textTransform: "uppercase", color }}>{kicker}</p>
      <h2 style={{ ...display, fontSize: "clamp(2.3rem, 5.6vw, 4.4rem)", lineHeight: 1.02, marginTop: 10 }}>{title}</h2>
    </div>
  );
}

// Falling snow inside a section
function Snow({ count = 60 }: { count?: number }) {
  const flakes = useMemo(() => Array.from({ length: count }, (_, i) => ({ x: (i * 61) % 100, s: 2 + (i % 4) * 1.4, d: 7 + (i % 7) * 1.6, delay: -((i * 1.37) % 12), drift: ((i * 29) % 60) - 30, o: 0.45 + (i % 5) * 0.1 })), [count]);
  if (prefersReducedMotion()) return null;
  return (
    <div aria-hidden style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
      {flakes.map((f, i) => <span key={i} className="bn-flake" style={{ left: `${f.x}%`, width: f.s, height: f.s, opacity: f.o, animationDuration: `${f.d}s`, animationDelay: `${f.delay}s`, ["--drift" as string]: `${f.drift}px` }} />)}
    </div>
  );
}

// ── 1. The approach: fly up to the glowing door until steam fills the screen ──
const DOOR = { x: 0.52, y: 0.57 }; // the lit gap of the door, as a fraction of banya-night.webp (3:2)

function Approach({ t, description }: { t: (ru: string, en: string) => string; description: string }) {
  const still = prefersReducedMotion();
  const { ref, p } = usePinProgress<HTMLElement>(!still);
  const [origin, setOrigin] = useState("52% 57%");
  useEffect(() => {
    // object-fit: cover crops the picture, so find where the door actually is on this screen
    const fit = () => {
      const W = window.innerWidth, H = window.innerHeight, iw = 1600, ih = 1067;
      const s = Math.max(W / iw, H / ih);
      setOrigin(`${(W - iw * s) / 2 + DOOR.x * iw * s}px ${(H - ih * s) / 2 + DOOR.y * ih * s}px`);
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);
  const zoom = Math.min(1, p / 0.8);
  const scale = 1 + Math.pow(zoom, 2.2) * 7;
  const glow = Math.min(1, p / 0.7);
  const steam = Math.max(0, Math.min(1, (p - 0.42) / 0.38));
  const titleOut = Math.min(1, p / 0.18);
  return (
    <section ref={ref} style={{ position: "relative", height: still ? "100svh" : "260svh", background: C.night }}>
      <div style={{ position: still ? "relative" : "sticky", top: 0, height: "100svh", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, transformOrigin: origin, transform: `scale(${scale})`, willChange: "transform" }}>
          <img src={`${IMG}/banya-night.webp`} alt={t("Русская баня у замёрзшего озера зимним вечером", "A Russian banya by a frozen lake on a winter evening")} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
          <div aria-hidden style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at ${origin}, rgba(255,170,80,${0.55 * glow}) 0, rgba(255,140,60,${0.25 * glow}) 6%, transparent 22%)`, mixBlendMode: "screen" }} />
        </div>
        <Snow count={70} />
        <div aria-hidden style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(8,16,30,.55), transparent 40%)", opacity: 1 - titleOut }} />
        <div style={{ position: "absolute", left: 0, right: 0, top: "clamp(80px, 14vh, 140px)", textAlign: "center", padding: "0 16px", opacity: 1 - titleOut, transform: `translateY(${-titleOut * 40}px)` }}>
          <p style={{ ...mono, fontSize: 12, letterSpacing: ".35em", color: C.ice }}>{t("БАННЫЙ ДЕНЬ", "A BANYA DAY")}</p>
          <h1 style={{ ...display, fontSize: "clamp(3.4rem, 10vw, 8rem)", lineHeight: 0.92, color: "#fdf6ea", textShadow: "0 4px 40px rgba(0,0,0,.5)", margin: "12px 0 14px" }}>{t("Русская баня", "Russian Banya")}</h1>
          <p style={{ fontSize: "clamp(1.05rem, 1.7vw, 1.3rem)", lineHeight: 1.5, color: "#e8eef5", maxWidth: 560, margin: "0 auto", textShadow: "0 2px 16px rgba(0,0,0,.6)" }}>{description}</p>
        </div>
        {/* steam bursting out of the door */}
        <div aria-hidden style={{ position: "absolute", inset: 0, pointerEvents: "none", opacity: steam }}>
          {[0, 1, 2, 3, 4].map((i) => <img key={i} src={`${IMG}/steam.webp`} alt="" style={{ position: "absolute", left: `${50 + (i - 2) * 16}%`, top: "50%", width: "70vmax", transform: `translate(-50%,-50%) scale(${0.6 + steam * (1.2 + i * 0.15)}) rotate(${i * 70}deg)`, opacity: 0.9 }} />)}
          <div style={{ position: "absolute", inset: 0, background: "#f4ede4", opacity: Math.max(0, (steam - 0.45) / 0.55) }} />
        </div>
        <p className="bn-hint" style={{ position: "absolute", left: 0, right: 0, bottom: 22, textAlign: "center", ...mono, fontSize: 12, letterSpacing: ".25em", color: "#e8eef5", opacity: 1 - titleOut }}>{t("ЛИСТАЙТЕ — ЗАЙДЁМ ВНУТРЬ ↓", "SCROLL — LET'S GO IN ↓")}</p>
      </div>
    </section>
  );
}

// ── 2. The steam room: fogged glass you wipe clear ──
function SteamGlass() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current!;
    const ctx = cv.getContext("2d")!;
    const reduced = prefersReducedMotion();
    const SCALE = 0.5;
    const fog = (a: number) => { ctx.fillStyle = `rgba(244,237,228,${a})`; ctx.fillRect(0, 0, cv.width, cv.height); };
    const fit = () => {
      const r = cv.getBoundingClientRect();
      cv.width = Math.max(1, Math.round(r.width * SCALE));
      cv.height = Math.max(1, Math.round(r.height * SCALE));
      fog(0.86);
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
      ctx.lineWidth = 56;
      ctx.strokeStyle = "rgba(0,0,0,.95)";
      ctx.beginPath();
      const [lx, ly] = last ?? [x, y];
      ctx.moveTo(lx, ly); ctx.lineTo(x, y); ctx.stroke();
      ctx.globalCompositeOperation = "source-over";
      last = [x, y];
      if (Math.random() < 0.12) drops.push({ x: x + (Math.random() - 0.5) * 46, y: y + 24, v: 0.3 + Math.random() * 0.7, life: 220 });
    };
    window.addEventListener("pointermove", wipe);
    let frame = 0;
    const stop = loopWhileVisible(cv, () => {
      frame++;
      if (!reduced && frame % 4 === 0) fog(0.005);
      ctx.globalCompositeOperation = "destination-out";
      for (let i = drops.length - 1; i >= 0; i--) {
        const d = drops[i];
        d.y += d.v; d.life--;
        ctx.beginPath(); ctx.arc(d.x, d.y, 2.2, 0, Math.PI * 2); ctx.fill();
        if (d.life <= 0) drops.splice(i, 1);
      }
      ctx.globalCompositeOperation = "source-over";
    }, "0px");
    return () => { stop(); ro.disconnect(); window.removeEventListener("pointermove", wipe); };
  }, []);
  return <canvas ref={ref} aria-hidden style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", filter: "blur(6px)" }} />;
}

// A birch venik follows the pointer, swings with its speed and sheds leaves
function Venik({ area }: { area: React.RefObject<HTMLElement | null> }) {
  const venik = useRef<HTMLImageElement>(null);
  const holder = useRef<HTMLDivElement>(null);
  const [leaves, setLeaves] = useState<{ id: number; x: number; y: number; src: string; dx: number; r: number }[]>([]);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = area.current;
    if (!el || prefersReducedMotion() || window.matchMedia("(pointer: coarse)").matches) return;
    let lastX = 0, lastT = 0, angle = 0, raf = 0, id = 0, lastLeaf = 0, settle = 0;
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      const now = performance.now(), dt = Math.max(8, now - lastT);
      const v = (e.clientX - lastX) / dt;
      lastX = e.clientX; lastT = now;
      angle = Math.max(-40, Math.min(40, angle * 0.6 + v * 22));
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        if (holder.current) holder.current.style.transform = `translate(${x}px, ${y}px)`;
        if (venik.current) venik.current.style.transform = `translate(-50%, -30%) rotate(${angle}deg)`;
      });
      clearTimeout(settle);
      settle = window.setTimeout(() => { angle = 0; if (venik.current) venik.current.style.transform = "translate(-50%, -30%) rotate(0deg)"; }, 110);
      if (Math.abs(v) > 0.9 && now - lastLeaf > 70) {
        lastLeaf = now;
        const leaf = { id: id++, x, y, src: LEAVES[id % LEAVES.length], dx: -v * 40 + (Math.random() - 0.5) * 60, r: (Math.random() - 0.5) * 540 };
        setLeaves((ls) => [...ls.slice(-22), leaf]);
      }
    };
    const enter = () => setOn(true), leave = () => setOn(false);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerenter", enter);
    el.addEventListener("pointerleave", leave);
    return () => { cancelAnimationFrame(raf); clearTimeout(settle); el.removeEventListener("pointermove", move); el.removeEventListener("pointerenter", enter); el.removeEventListener("pointerleave", leave); };
  }, [area]);
  return (
    <div aria-hidden style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 6 }}>
      {leaves.map((l) => <img key={l.id} className="bn-leaf" src={l.src} alt="" style={{ left: l.x, top: l.y, ["--dx" as string]: `${l.dx}px`, ["--r" as string]: `${l.r}deg` }} />)}
      <div ref={holder} style={{ position: "absolute", left: 0, top: 0, opacity: on ? 1 : 0, transition: "opacity .3s" }}>
        <img ref={venik} src={`${IMG}/venik.webp`} alt="" style={{ display: "block", width: 150, maxWidth: "none", transformOrigin: "50% 85%", transform: "translate(-50%, -30%)", transition: "transform .35s cubic-bezier(.3,1.6,.5,1)", filter: "drop-shadow(0 20px 20px rgba(0,0,0,.35))" }} />
      </div>
    </div>
  );
}

function SteamRoom({ t }: { t: (ru: string, en: string) => string }) {
  const area = useRef<HTMLElement>(null);
  return (
    <section ref={area} className="bn-room" style={{ position: "relative", height: "100svh", minHeight: 560, overflow: "hidden", background: "#f4ede4" }}>
      <img src={`${IMG}/parilka.webp`} alt={t("Парная: липовые полки, пар и свет из окна", "The steam room: linden benches, steam and window light")} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
      <div style={{ position: "absolute", left: "45%", bottom: "30%", width: "min(220px, 40vw)", height: "min(36vh, 320px)", transform: "translateX(-50%)" }}>
        <div aria-hidden style={{ position: "absolute", left: "10%", right: "10%", bottom: "2%", height: "10%", borderRadius: "50%", background: "radial-gradient(ellipse, rgba(60,30,10,.55), transparent 70%)", filter: "blur(5px)" }} />
        <Bottle3D style={{ position: "absolute", inset: 0 }} lighting="heat" {...bottleLook} spin={0.2} drawLabel={bottleLabel} />
      </div>
      <SteamGlass />
      <div aria-hidden style={{ position: "absolute", left: 0, right: 0, top: 0, height: "22%", background: "linear-gradient(#f4ede4, transparent)" }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: "clamp(70px, 12vh, 120px)", textAlign: "center", pointerEvents: "none", padding: "0 16px" }}>
        <p style={{ ...mono, fontSize: 12, letterSpacing: ".3em", color: C.wood }}>{t("ПАРНАЯ · 92°C", "STEAM ROOM · 92°C")}</p>
        <h2 style={{ ...display, fontSize: "clamp(2.2rem, 5vw, 4rem)", color: C.ink, marginTop: 8 }}>{t("Протрите стекло", "Wipe the glass")}</h2>
      </div>
      <Venik area={area} />
    </section>
  );
}

// ── 3. Give it steam: three pours onto the stones, the thermometer climbs ──
const STAGES = [`${IMG}/stage-fresh.webp`, `${IMG}/stage-heat.webp`, `${IMG}/stage-wood.webp`];

function Thermo({ temp, height = 420 }: { temp: number; height?: number }) {
  // tube runs from 7% to 90% of the image; scale 40–120 °C
  const k = Math.max(0, Math.min(1, (temp - 40) / 80));
  return (
    <div style={{ position: "relative", height, aspectRatio: "150 / 774" }}>
      <img src={`${IMG}/thermo.webp`} alt="" aria-hidden style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />
      <span aria-hidden style={{ position: "absolute", left: "50%", bottom: "8%", width: "7%", minWidth: 4, height: `${2 + k * 83}%`, transform: "translateX(-50%)", borderRadius: 99, background: `linear-gradient(${C.red}, #ff5a3c)`, boxShadow: "0 0 8px rgba(255,80,40,.6)", transition: "height .5s ease" }} />
      <span aria-hidden style={{ position: "absolute", left: "50%", bottom: "4.5%", width: "26%", aspectRatio: "1", transform: "translateX(-50%)", borderRadius: "50%", background: `radial-gradient(circle at 35% 35%, #ff8a6a, ${C.red})` }} />
      {[60, 80, 100].map((d) => <span key={d} aria-hidden style={{ position: "absolute", right: "62%", bottom: `${8 + ((d - 40) / 80) * 85}%`, transform: "translateY(50%)", ...mono, fontSize: 10, color: "#4a2a12" }}>{d}</span>)}
    </div>
  );
}

function Pour({ stages, t }: { stages: { when: string; text: string; notes: string }[]; t: (ru: string, en: string) => string }) {
  const still = prefersReducedMotion();
  const { ref, p } = usePinProgress<HTMLElement>(!still);
  const stage = Math.min(2, Math.floor(p * 3.05));
  const [bursts, setBursts] = useState<number[]>([]);
  const [pouring, setPouring] = useState(0);
  const last = useRef(-1);
  const burst = () => setBursts((b) => [...b.slice(-3), Date.now() + Math.random()]);
  useEffect(() => {
    if (still || stage === last.current) return;
    last.current = stage;
    setPouring((n) => n + 1);
    const id = window.setTimeout(burst, 650);
    return () => clearTimeout(id);
  }, [stage, still]);
  const temp = still ? 92 : 60 + Math.min(1, p * 1.1) * 35;
  return (
    <section ref={ref} style={{ position: "relative", height: still ? "auto" : "330svh", background: DARK_PLANKS }}>
      <div style={{ position: still ? "relative" : "sticky", top: 0, minHeight: "100svh", display: "flex", flexDirection: "column", justifyContent: "center", padding: "70px clamp(16px,4vw,48px) 30px", overflow: "hidden" }}>
        <div aria-hidden style={{ position: "absolute", left: "26%", bottom: "-10%", width: "60vmin", height: "60vmin", transform: "translateX(-50%)", borderRadius: "50%", background: "radial-gradient(circle, rgba(255,110,40,.28), transparent 65%)" }} />
        <div style={{ textAlign: "center", position: "relative" }}>
          <p style={{ ...mono, fontSize: 12, letterSpacing: ".3em", color: C.ember }}>{t("КАК РАСКРЫВАЕТСЯ НА КОЖЕ", "HOW IT UNFOLDS ON SKIN")}</p>
          <h2 style={{ ...display, fontSize: "clamp(2rem, 4.6vw, 3.6rem)", marginTop: 6 }}>{t("Поддай пару", "Give it steam")}</h2>
        </div>
        <div className="bn-pour" style={{ position: "relative", maxWidth: 1180, width: "100%", margin: "26px auto 0", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px 50px", alignItems: "center" }}>
          {/* stove, ladle, thermometer */}
          <div style={{ position: "relative", display: "flex", alignItems: "flex-end", justifyContent: "center", gap: "clamp(16px, 4vw, 50px)", height: "min(62svh, 560px)" }}>
            <div className="bn-thermo" style={{ alignSelf: "center" }}>
              <Thermo temp={temp} height={Math.min(380, 0.42 * (typeof window !== "undefined" ? window.innerHeight : 800))} />
              <p style={{ ...display, fontSize: 30, color: C.cream, textAlign: "center", marginTop: 6 }}>{Math.round(temp)}°</p>
            </div>
            <div style={{ position: "relative", height: "100%", aspectRatio: "520 / 886" }}>
              {/* steam bursts */}
              {bursts.map((b) => (
                <div key={b} aria-hidden style={{ position: "absolute", left: "50%", top: "8%", width: 0, height: 0, pointerEvents: "none" }}>
                  {[0, 1, 2, 3, 4].map((i) => <img key={i} className="bn-burst" src={`${IMG}/steam.webp`} alt="" style={{ ["--x" as string]: `${(i - 2) * 30}px`, ["--rot" as string]: `${(i - 2) * 25}deg`, animationDelay: `${i * 90}ms` }} />)}
                </div>
              ))}
              {!still && <img className="bn-idle" src={`${IMG}/steam.webp`} alt="" aria-hidden style={{ position: "absolute", left: "50%", top: "-30%", width: "90%", marginLeft: "-45%", pointerEvents: "none" }} />}
              <button onClick={burst} aria-label={t("Плеснуть на камни", "Splash the stones")} style={{ position: "absolute", inset: 0, background: "transparent", cursor: "pointer" }}>
                <img src={`${IMG}/kamenka.webp`} alt={t("Каменка с раскалёнными камнями", "A stove with red-hot stones")} style={{ width: "100%", height: "100%", filter: "drop-shadow(0 30px 40px rgba(0,0,0,.6))" }} />
              </button>
              {/* the ladle: bowl over the stones, handle to the right */}
              <div aria-hidden key={pouring} className={still ? undefined : "bn-ladle"} style={{ position: "absolute", left: "42%", top: "-3%", width: "112%", transformOrigin: "88% 50%", pointerEvents: "none" }}>
                <img src={`${IMG}/kovsh.webp`} alt="" style={{ display: "block", width: "100%", filter: "drop-shadow(0 10px 12px rgba(0,0,0,.4))" }} />
                <span className="bn-stream" />
              </div>
            </div>
          </div>
          {/* stage card */}
          <div className="bn-stages" style={{ position: "relative", minHeight: "min(56svh, 520px)" }}>
            {stages.map((s, i) => (
              <article key={i} className="bn-stage" style={{ position: still ? "relative" : "absolute", inset: still ? undefined : 0, display: "grid", gridTemplateColumns: "minmax(0,.9fr) minmax(0,1.1fr)", gap: 22, alignItems: "center", opacity: still || stage === i ? 1 : 0, transform: still || stage === i ? "none" : `translateY(${i < stage ? -24 : 24}px)`, transition: "opacity .7s ease, transform .9s cubic-bezier(.16,1,.3,1)", marginBottom: still ? 30 : 0 }}>
                <img className="bn-stage-photo" src={STAGES[i]} alt="" loading="lazy" style={{ width: "100%", aspectRatio: "2 / 3", objectFit: "cover", borderRadius: 14, boxShadow: "0 30px 60px rgba(0,0,0,.5)" }} />
                <div>
                  <p style={{ ...mono, fontSize: 12, letterSpacing: ".25em", color: C.ember }}>{String(i + 1).padStart(2, "0")} · {s.when.toUpperCase()}</p>
                  <p style={{ fontSize: "clamp(1.1rem, 1.7vw, 1.35rem)", lineHeight: 1.5, marginTop: 12 }}>{s.text}</p>
                  <p style={{ ...mono, fontSize: 12, color: C.dim, marginTop: 14, lineHeight: 1.7 }}>{s.notes}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
        {!still && (
          <div aria-hidden style={{ display: "flex", justifyContent: "center", gap: 10, marginTop: 22 }}>
            {[0, 1, 2].map((i) => <span key={i} style={{ width: 34, height: 4, borderRadius: 99, background: i <= stage ? C.ember : "rgba(243,226,196,.2)", transition: "background .4s" }} />)}
          </div>
        )}
        <p style={{ ...mono, fontSize: 11, letterSpacing: ".2em", color: C.dim, textAlign: "center", marginTop: 12 }}>{t("НАЖМИТЕ НА КАМНИ, ЧТОБЫ ПОДДАТЬ ЕЩЁ", "TAP THE STONES FOR MORE STEAM")}</p>
      </div>
    </section>
  );
}

// ── 4. The changing room: notes drying on twine under the ceiling ──
type Bundle = { file: string; label: [string, string]; tier: [string, string]; w: number; drop: number };
const BUNDLES: Bundle[] = [
  { file: "ing-fir", label: ["Пихта", "Fir"], tier: ["верх", "top"], w: 14, drop: 0 },
  { file: "ing-eucalyptus", label: ["Эвкалипт", "Eucalyptus"], tier: ["верх", "top"], w: 13, drop: 30 },
  { file: "ing-hay", label: ["Сено", "Hay"], tier: ["верх", "top"], w: 12, drop: 8 },
  { file: "ing-mint", label: ["Мята", "Mint"], tier: ["верх", "top"], w: 12, drop: 40 },
  { file: "ing-juniper", label: ["Можжевельник", "Juniper"], tier: ["сердце", "heart"], w: 13, drop: 4 },
  { file: "ing-cardamom", label: ["Кардамон", "Cardamom"], tier: ["сердце", "heart"], w: 7, drop: 26 },
  { file: "ing-cedar", label: ["Кедр", "Cedar"], tier: ["база", "base"], w: 9, drop: 10 },
];

function DryingLine({ lang }: { lang: "ru" | "en" }) {
  const { ref, visible } = useReveal();
  const L = (p: [string, string]) => (lang === "ru" ? p[0] : p[1]);
  return (
    <div ref={ref} className="bn-scroll" style={{ position: "relative", maxWidth: 1240, margin: "0 auto" }}>
      <div className="bn-scroll-in">
      <div aria-hidden style={{ height: 30, borderRadius: 4, background: `linear-gradient(180deg, #8a5a30, #5a361c)`, boxShadow: "0 14px 24px rgba(0,0,0,.45), inset 0 2px 0 rgba(255,220,170,.25)" }} />
      <div className="bn-line" style={{ display: "flex", justifyContent: "space-around", alignItems: "flex-start", padding: "0 1%" }}>
        {BUNDLES.map((b, i) => (
          <div key={b.file} className="bn-hang" style={{ width: `${b.w}%`, display: "flex", flexDirection: "column", alignItems: "center", animationDelay: `${i * -0.9}s` }}>
            <span aria-hidden style={{ width: 2, height: 18 + b.drop, background: "#c8a878" }} />
            <img src={`${IMG}/${b.file}.webp`} alt={L(b.label)} loading="lazy" style={{ width: "100%", marginTop: -6, opacity: visible ? 1 : 0, transform: visible ? "none" : "translateY(-30px)", transition: `opacity .8s ease ${i * 110}ms, transform 1.2s cubic-bezier(.2,1.4,.4,1) ${i * 110}ms`, filter: "drop-shadow(0 18px 18px rgba(0,0,0,.45))" }} />
            <div style={{ marginTop: 10, padding: "6px 10px", background: "#efe1c2", color: C.ink, borderRadius: 3, transform: `rotate(${(i % 2 ? 3 : -3)}deg)`, boxShadow: "0 6px 12px rgba(0,0,0,.35)", textAlign: "center", whiteSpace: "nowrap" }}>
              <p style={{ ...display, fontSize: "clamp(13px, 1.4vw, 17px)" }}>{L(b.label)}</p>
              <p style={{ ...mono, fontSize: 9, letterSpacing: ".12em", color: C.wood }}>{L(b.tier).toUpperCase()}</p>
            </div>
          </div>
        ))}
      </div>
      </div>
    </div>
  );
}

// ── 5. Strength as a row of wooden thermometers ──
function Thermometers({ facets, lang }: { facets: { label: { ru: string; en: string }; value: number }[]; lang: "ru" | "en" }) {
  const { ref, visible } = useReveal();
  return (
    <div ref={ref} className="bn-thermos" style={{ display: "flex", justifyContent: "center", gap: "clamp(10px, 3.4vw, 46px)", flexWrap: "wrap" }}>
      {facets.map((f, i) => (
        <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "clamp(80px, 12vw, 130px)" }}>
          <p style={{ ...display, fontSize: 26, color: C.cream, opacity: visible ? 1 : 0, transition: `opacity .8s ${1200 + i * 120}ms` }}>{f.value}</p>
          <div style={{ transition: `none` }}>
            <ThermoReveal value={visible ? f.value : 0} delay={i * 140} />
          </div>
          <p style={{ fontSize: 14, lineHeight: 1.3, color: C.cream, textAlign: "center", marginTop: 10 }}>{pick(lang, f.label)}</p>
        </div>
      ))}
    </div>
  );
}

function ThermoReveal({ value, delay }: { value: number; delay: number }) {
  return (
    <div style={{ position: "relative", height: 300, aspectRatio: "150 / 774" }}>
      <img src={`${IMG}/thermo.webp`} alt="" aria-hidden style={{ position: "absolute", inset: 0, width: "100%", height: "100%", filter: "drop-shadow(0 12px 16px rgba(0,0,0,.45))" }} />
      <span aria-hidden style={{ position: "absolute", left: "50%", bottom: "8%", width: "7%", minWidth: 4, height: `${2 + (value / 100) * 83}%`, transform: "translateX(-50%)", borderRadius: 99, background: `linear-gradient(${C.red}, #ff5a3c)`, boxShadow: "0 0 8px rgba(255,80,40,.6)", transition: `height 1.8s cubic-bezier(.16,1,.3,1) ${delay}ms` }} />
      <span aria-hidden style={{ position: "absolute", left: "50%", bottom: "4.5%", width: "26%", aspectRatio: "1", transform: "translateX(-50%)", borderRadius: "50%", background: `radial-gradient(circle at 35% 35%, #ff8a6a, ${C.red})` }} />
    </div>
  );
}

// ── 6. Out into the snow: frost creeps over the screen ──
function Cold({ scenes, fragments, t }: { scenes: string[]; fragments: string[]; t: (ru: string, en: string) => string }) {
  const ref = useRef<HTMLElement>(null);
  const [f, setF] = useState(0);
  useEffect(() => {
    let raf = 0;
    const update = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const el = ref.current; if (!el) return;
        const r = el.getBoundingClientRect(), vh = window.innerHeight;
        setF(Math.min(1, Math.max(0, (vh - r.top) / (vh + r.height * 0.5))));
      });
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => { cancelAnimationFrame(raf); window.removeEventListener("scroll", update); };
  }, []);
  return (
    <section ref={ref} style={{ position: "relative", minHeight: "130svh", overflow: "hidden", background: C.night, display: "flex", alignItems: "center" }}>
      <img src={`${IMG}/snow-hole.webp`} alt={t("Следы на снегу ведут к проруби", "Footprints in the snow lead to an ice hole")} loading="lazy" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
      <div aria-hidden style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, #2a170c 0%, rgba(13,26,46,.2) 14%, rgba(13,26,46,.25) 70%, #0d1a2e)" }} />
      <Snow count={50} />
      <img aria-hidden src={`${IMG}/frost.webp`} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", pointerEvents: "none", opacity: Math.min(1, f * 1.4), transform: `scale(${1.35 - f * 0.35})` }} />
      <div className="bn-two" style={{ position: "relative", maxWidth: 1180, margin: "0 auto", width: "100%", padding: "16vh clamp(16px,4vw,48px)", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "36px 60px", alignItems: "center" }}>
        <Reveal>
          <p style={{ ...mono, fontSize: 12, letterSpacing: ".3em", color: C.ice }}>{t("ПОСЛЕ ПАРНОЙ", "AFTER THE STEAM ROOM")}</p>
          <h2 style={{ ...display, fontSize: "clamp(2.4rem, 5.6vw, 4.6rem)", lineHeight: 1, color: "#fff", marginTop: 10, textShadow: "0 4px 30px rgba(0,0,0,.5)" }}>{t("И сразу в снег", "Straight into the snow")}</h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 14px", marginTop: 26 }}>
            {fragments.map((x, i) => <span key={i} style={{ ...mono, fontSize: 12, color: C.ice, padding: "6px 10px", border: "1px solid rgba(207,227,242,.35)", borderRadius: 99, background: "rgba(13,26,46,.35)" }}>{x}</span>)}
          </div>
        </Reveal>
        <Reveal delay={150}>
          <div style={{ padding: "26px 28px", borderRadius: 18, background: "rgba(220,235,248,.14)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)", border: "1px solid rgba(220,235,248,.35)", boxShadow: "0 30px 70px rgba(0,0,0,.35)" }}>
            <p style={{ ...mono, fontSize: 11, letterSpacing: ".25em", color: C.ice }}>{t("НА ЧТО ЭТО ПОХОЖЕ", "WHAT IT FEELS LIKE")}</p>
            {scenes.map((s, i) => <p key={i} style={{ fontSize: "clamp(1.05rem, 1.6vw, 1.25rem)", lineHeight: 1.45, color: "#fff", padding: "12px 0", borderBottom: i < scenes.length - 1 ? "1px solid rgba(220,235,248,.2)" : "none" }}>{s}</p>)}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export default function BanyaWorld({ perfume }: WorldProps) {
  const [, navigate] = useLocation();
  const { lang, setLang, t } = useLang();
  const [open, setOpen] = useState(false);
  const [tea, setTea] = useState(0);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const g = perfume.guide!;
  const n = perfume.scentNotes;
  const Lp = (v: { ru: string; en: string }) => pick(lang, v);
  const fragments = pick(lang, perfume.memoryFragments).map(fragmentText);
  const shown = new Set(BUNDLES.map((b) => b.label[lang === "ru" ? 0 : 1].toLowerCase()));
  const otherNotes = (["top", "heart", "base"] as const).flatMap((k) => (n[k] ? pick(lang, n[k]!) : [])).filter((x) => !shown.has(x.toLowerCase()));
  const stages = g.drydown.map((d) => ({ when: Lp(d.when), text: Lp(d.text), notes: n[d.notes] ? pick(lang, n[d.notes]!).join(" · ") : "" }));

  const pourTea = () => {
    setTea((x) => x + 1);
    clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setOpen(true), prefersReducedMotion() ? 0 : 2300);
  };

  const skin: DialogSkin = {
    overlay: "rgba(30,18,10,.78)",
    panel: { ...body, background: PLANKS, padding: "30px 26px", color: C.cream, borderRadius: 8, boxShadow: "0 30px 80px rgba(0,0,0,.6)", border: `3px solid ${C.woodD}` },
    title: { ...display, fontSize: 34, color: C.cream },
    label: { ...mono, fontSize: 10, letterSpacing: ".14em", textTransform: "uppercase", color: C.dim },
    input: { ...body, fontSize: 15, background: "rgba(30,18,10,.45)", border: `1px solid ${C.woodL}`, padding: "10px 12px", color: C.cream, borderRadius: 4 },
    button: { ...display, fontSize: 20, background: C.ember, color: C.ink, padding: "12px", borderRadius: 4, boxShadow: "0 0 30px rgba(255,122,42,.4)" },
    accent: C.ember,
    heading: { ru: "Чай после бани", en: "Tea after the banya" },
    submit: { ru: "С лёгким паром", en: "Enjoy the steam" },
    sent: { ru: "С лёгким паром! Скоро свяжемся.", en: "Enjoy the steam! We'll be in touch." },
  };

  const facts: [string, string][] = [
    [t("Стойкость", "Longevity"), Lp(g.longevity)],
    [t("Шлейф", "Sillage"), Lp(g.sillage)],
    [t("Сезон", "Season"), Lp(g.season)],
    [t("Когда носить", "When to wear"), Lp(g.time)],
  ];

  return (
    <div style={{ ...body, background: C.woodD, color: C.cream, minHeight: "100vh", overflowX: "clip" }}>
      <style>{`
        .bn-flake { position: absolute; top: -10px; border-radius: 50%; background: #fff; animation: bn-snow linear infinite; }
        @keyframes bn-snow { to { transform: translate(var(--drift), 105svh); } }
        .bn-hint { animation: bn-bob 2.4s ease-in-out infinite; } @keyframes bn-bob { 50% { transform: translateY(6px); } }
        .bn-room { cursor: none; } @media (pointer: coarse) { .bn-room { cursor: auto; } }
        .bn-leaf { position: absolute; width: 34px; margin: -17px 0 0 -17px; animation: bn-leaf 1.8s cubic-bezier(.3,.1,.6,1) forwards; }
        @keyframes bn-leaf { 0% { transform: translate(0,0) rotate(0); opacity: 1; } 100% { transform: translate(var(--dx), 260px) rotate(var(--r)); opacity: 0; } }
        .bn-ladle { animation: bn-ladle 2.4s ease-in-out both; }
        @keyframes bn-ladle { 0% { transform: translate(30%, -30%) rotate(0); opacity: 0; } 15% { transform: none; opacity: 1; } 30%, 62% { transform: rotate(-26deg); } 85% { transform: none; opacity: 1; } 100% { transform: translate(30%, -30%); opacity: 0; } }
        .bn-stream { position: absolute; left: 4%; top: 52%; width: 5px; height: 46px; scale: 1 0; border-radius: 99px; background: linear-gradient(rgba(220,240,255,.95), rgba(220,240,255,.2)); transform-origin: 50% 0; transform: rotate(26deg); animation: bn-stream 2.4s ease-in-out both; }
        @keyframes bn-stream { 0%, 30% { scale: 1 0; opacity: 0; } 36% { scale: 1 1; opacity: 1; } 58% { scale: 1 1; opacity: 1; } 66%, 100% { scale: 1 0; opacity: 0; } }
        .bn-burst { position: absolute; left: 0; top: 0; width: 220px; margin: -110px 0 0 -110px; opacity: 0; animation: bn-burst 2.8s cubic-bezier(.2,.7,.3,1) forwards; }
        @keyframes bn-burst { 0% { transform: translate(var(--x), 40px) scale(.3) rotate(0); opacity: 0; } 15% { opacity: .95; } 100% { transform: translate(calc(var(--x) * 3), -360px) scale(2.4) rotate(var(--rot)); opacity: 0; } }
        .bn-idle { opacity: .35; animation: bn-idle 6s ease-in-out infinite; } @keyframes bn-idle { 0%, 100% { transform: translateY(10px) scale(.9); opacity: .2; } 50% { transform: translateY(-30px) scale(1.05); opacity: .45; } }
        .bn-hang { transform-origin: 50% 0; animation: bn-sway 5.5s ease-in-out infinite; }
        .bn-hang:hover { animation: bn-kick 1.8s cubic-bezier(.3,.6,.4,1) 1, bn-sway 5.5s ease-in-out 1.8s infinite; }
        @keyframes bn-sway { 0%, 100% { transform: rotate(-1.6deg); } 50% { transform: rotate(1.6deg); } }
        @keyframes bn-kick { 0% { transform: rotate(0); } 15% { transform: rotate(9deg); } 35% { transform: rotate(-7deg); } 55% { transform: rotate(4deg); } 75% { transform: rotate(-2deg); } 100% { transform: rotate(-1.6deg); } }
        .bn-pourtea { position: absolute; width: 5px; border-radius: 99px; background: linear-gradient(#c56a1c, #8a3b0c); transform-origin: 50% 0; animation: bn-pourtea 2.2s ease-in-out both; }
        @keyframes bn-pourtea { 0% { transform: scaleY(0); opacity: 0; } 10% { opacity: 1; } 15%, 75% { transform: scaleY(1); opacity: 1; } 90%, 100% { transform: scaleY(1) translateY(100%); opacity: 0; } }
        .bn-teasteam { position: absolute; width: 60%; left: 20%; top: -55%; opacity: 0; animation: bn-teasteam 4s ease-out 1.6s infinite; pointer-events: none; }
        @keyframes bn-teasteam { 0% { transform: translateY(20px) scale(.5); opacity: 0; } 30% { opacity: .55; } 100% { transform: translateY(-60px) scale(1.1); opacity: 0; } }
        .bn-tap:hover .bn-taphint { opacity: 1; }
        .bn-swipe { display: none; } @media (max-width: 820px) { .bn-swipe { display: block; } }
        @media (prefers-reduced-motion: reduce) { .bn-hint, .bn-hang, .bn-ladle, .bn-idle, .bn-teasteam { animation: none; } }
        @media (max-width: 820px) {
          .bn-two, .bn-pour { grid-template-columns: 1fr !important; }
          .bn-stage { grid-template-columns: 1fr !important; }
          .bn-stage-photo { display: none; }
          .bn-scroll { overflow-x: auto; overscroll-behavior-x: contain; scrollbar-width: none; padding-bottom: 20px; }
          .bn-scroll::-webkit-scrollbar { display: none; }
          .bn-scroll-in { width: 820px; padding: 0 12px; }
          .bn-pour > div:first-child { height: 30svh !important; }
          .bn-thermo > div { height: 26svh !important; }
          .bn-stages { min-height: 210px !important; }
        }
      `}</style>

      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 50, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px clamp(16px,3vw,28px)", ...mono, fontSize: 12, letterSpacing: ".1em", color: C.cream, background: "linear-gradient(rgba(20,12,6,.7), transparent)" }}>
        <button onClick={() => navigate("/map")} style={{ color: C.cream }}>← {t("К КАРТЕ", "MAP")}</button>
        <span style={{ ...display, letterSpacing: ".02em", fontSize: 16 }}>Silentium</span>
        <span>{(["ru", "en"] as const).map((l) => <button key={l} onClick={() => setLang(l)} style={{ marginLeft: 10, color: lang === l ? C.ember : C.dim }}>{l.toUpperCase()}</button>)}</span>
      </nav>

      <Approach t={t} description={pick(lang, perfume.description)} />
      <SteamRoom t={t} />

      {/* what it smells like */}
      <section style={{ background: PLANKS, padding: "100px clamp(16px,4vw,48px) 110px" }}>
        <div className="bn-two" style={{ maxWidth: 1180, margin: "0 auto", display: "grid", gridTemplateColumns: "1.2fr .8fr", gap: "40px 70px", alignItems: "center" }}>
          <Reveal>
            <p style={{ ...mono, fontSize: 12, letterSpacing: ".3em", color: "#ffd7a8" }}>{t("КАК ОН ПАХНЕТ", "WHAT IT SMELLS LIKE")}</p>
            <p style={{ ...display, fontSize: "clamp(1.5rem, 2.6vw, 2.15rem)", lineHeight: 1.35, marginTop: 14, color: "#fff6e6", textShadow: "0 2px 12px rgba(40,20,5,.4)" }}>{Lp(g.plain)}</p>
            <dl style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "18px 30px", marginTop: 36 }}>
              {facts.map(([k, v]) => (
                <div key={k} style={{ padding: "12px 14px", background: "rgba(30,18,10,.35)", borderRadius: 6, boxShadow: "inset 0 1px 0 rgba(255,220,170,.12)" }}>
                  <dt style={{ ...mono, fontSize: 10, letterSpacing: ".2em", textTransform: "uppercase", color: "#ffd7a8" }}>{k}</dt>
                  <dd style={{ fontSize: 16, lineHeight: 1.4, marginTop: 6, color: "#fff6e6" }}>{v}</dd>
                </div>
              ))}
            </dl>
            {g.tip && <p style={{ marginTop: 22, fontSize: 15, color: "#fff0dc" }}><span style={{ color: C.ember }}>♨ </span>{Lp(g.tip)}</p>}
          </Reveal>
          <Reveal delay={150}>
            <div style={{ textAlign: "center", padding: "36px 22px", borderRadius: 10, background: "rgba(30,18,10,.45)", boxShadow: "inset 0 0 0 2px rgba(255,220,170,.12), 0 30px 60px rgba(0,0,0,.35)" }}>
              <p style={{ ...mono, fontSize: 11, letterSpacing: ".25em", color: "#ffd7a8" }}>{t("СТОЙКОСТЬ", "LONGEVITY")}</p>
              <p style={{ ...display, fontSize: "clamp(4rem, 9vw, 6.5rem)", lineHeight: 1, margin: "10px 0", color: C.ember, textShadow: "0 0 40px rgba(255,122,42,.45)" }}>{Lp(g.longevity).replace(/\s.*$/, "")}</p>
              <p style={{ ...display, fontSize: 22 }}>{Lp(g.longevity).replace(/^\S+\s?/, "")}</p>
              <p style={{ fontSize: 14, lineHeight: 1.55, color: C.dim, marginTop: 14 }}>{t("Хвоя уходит первой, а тёплое дерево остаётся на коже до вечера.", "The pine goes first; the warm wood stays on the skin until evening.")}</p>
            </div>
          </Reveal>
        </div>
      </section>

      <Pour stages={stages} t={t} />

      {/* the changing room: notes drying */}
      <section style={{ background: `radial-gradient(ellipse at 50% 0%, #5a361c, ${C.woodD} 70%)`, padding: "110px clamp(12px,3vw,40px) 110px" }}>
        <Head kicker={t("Предбанник", "The changing room")} title={t("Из чего он сделан", "What it's made of")} />
        <DryingLine lang={lang} />
        <p className="bn-swipe" style={{ ...mono, fontSize: 11, letterSpacing: ".2em", color: C.dim, textAlign: "center", marginTop: 6 }}>{t("← ЛИСТАЙТЕ ВБОК →", "← SWIPE SIDEWAYS →")}</p>
        {otherNotes.length > 0 && <p style={{ textAlign: "center", fontSize: 15, color: C.dim, maxWidth: 760, margin: "40px auto 0", lineHeight: 1.7 }}><span style={{ color: C.ember }}>{t("А ещё", "And also")}:</span> {otherNotes.join(" · ")}</p>}
      </section>

      {/* strength */}
      <section style={{ background: DARK_PLANKS, padding: "110px clamp(16px,4vw,48px) 120px" }}>
        <Head kicker={t("Характер", "Character")} title={t("Чего в нём больше всего", "What it holds the most of")} />
        <Thermometers facets={g.facets} lang={lang} />
      </section>

      <Cold scenes={pick(lang, g.scenes)} fragments={fragments} t={t} />

      {/* request: tea from the samovar */}
      <section style={{ position: "relative", background: `radial-gradient(ellipse at 50% 40%, #4a2a14, ${C.woodD} 70%)`, padding: "110px 16px 120px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
        <Head kicker={t("Заявка", "Request")} title={t("Чай после бани", "Tea after the banya")} />
        <p style={{ fontSize: 17, color: C.dim, marginTop: -26 }}>{t("Нажмите на самовар — нальём чаю и откроем заявку.", "Tap the samovar — we'll pour the tea and open the request.")}</p>
        <button onClick={pourTea} className="bn-tap" aria-label={t("Налить чай из самовара и оставить заявку", "Pour tea from the samovar and leave a request")} style={{ position: "relative", width: "min(460px, 92vw)", aspectRatio: "460 / 560", marginTop: 40, background: "transparent", cursor: "pointer" }}>
          {/* samovar on a wooden stand, glass on the table under the tap */}
          <div aria-hidden style={{ position: "absolute", left: "4%", top: "84%", width: "60%", height: "10%", borderRadius: 6, background: "linear-gradient(#8a5a30, #4a2a14)", boxShadow: "0 16px 30px rgba(0,0,0,.5)" }} />
          <div aria-hidden style={{ position: "absolute", left: "-6%", right: "-6%", top: "94%", height: "4%", borderRadius: 3, background: "linear-gradient(#6b4426, #3a2112)" }} />
          <img src={`${IMG}/samovar.webp`} alt={t("Латунный самовар", "A brass samovar")} style={{ position: "absolute", left: "6%", top: "13.8%", width: "56%", filter: "drop-shadow(0 24px 30px rgba(0,0,0,.55))" }} />
          {/* the samovar is 56% × 70.2% of this box from (6%, 13.8%); its tap at 79% × 74% → 50.2% × 65.7% */}
          {tea > 0 && <span key={`s${tea}`} className="bn-pourtea" style={{ left: "50.2%", marginLeft: -2, top: "65.7%", height: "7%" }} />}
          <div style={{ position: "absolute", left: "40.7%", top: "68.8%", width: "25%", aspectRatio: "440 / 539" }}>
            <img src={`${IMG}/glass-empty.webp`} alt="" aria-hidden style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />
            <img key={`g${tea}`} src={`${IMG}/glass-full.webp`} alt="" aria-hidden style={{ position: "absolute", inset: 0, width: "100%", height: "100%", clipPath: tea > 0 ? "inset(4% 0 0 0)" : "inset(100% 0 0 0)", transition: tea > 0 ? "clip-path 1.6s ease-in .35s" : "none" }} />
            {tea > 0 && <img className="bn-teasteam" src={`${IMG}/steam.webp`} alt="" aria-hidden />}
          </div>
          {tea === 0 && <span className="bn-taphint" style={{ position: "absolute", left: "60%", top: "61%", ...mono, fontSize: 11, letterSpacing: ".15em", color: "#ffd7a8", opacity: 0.75, transition: "opacity .3s", whiteSpace: "nowrap" }}>← {t("КРАНИК", "THE TAP")}</span>}
        </button>
        <p style={{ fontSize: 15, color: C.dim, maxWidth: 440, lineHeight: 1.6, marginTop: 30 }}>{t("Оставьте контакт — мы напишем и расскажем, как получить флакон.", "Leave your contact — we'll write and tell you how to get a bottle.")}</p>
        <p style={{ ...mono, fontSize: 11, color: C.dim, marginTop: 10 }}>Extrait de parfum · {perfume.releaseDate} · {pick(lang, perfume.origin.location)}</p>
      </section>

      <RequestDialog open={open} onClose={() => setOpen(false)} perfumeName={perfume.name} skin={skin} />
    </div>
  );
}
