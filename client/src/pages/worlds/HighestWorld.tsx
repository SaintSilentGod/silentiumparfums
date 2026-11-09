// Highest in the room — a night in a Manhattan penthouse, 1979.
// You ride the brass elevator up (the floor dial creeps 1 → PH while you scroll) and on PH the doors
// open by themselves onto a lounge with black leather and the skyline; the pointer becomes a lit cigar trailing smoke;
// the drydown is a record on the turntable — three tracks, the tonearm walks inward with the scroll;
// the notes lie in an open humidor with gold cigar bands; strength on hi-fi VU meters; the scenes are
// Polaroids you develop with a flash; and a gold lighter you flick open to send a request.

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useLocation } from "wouter";
import { useLang } from "@/contexts/LangContext";
import Bottle3D from "@/components/Bottle3D";
import RequestDialog, { type DialogSkin } from "@/components/RequestDialog";
import { useReveal } from "@/lib/useReveal";
import { fragmentText, pick, prefersReducedMotion, type WorldProps } from "./shared";

const C = { black: "#0b0807", leather: "#1a1210", oxblood: "#5a1a1a", brass: "#c9a24a", gold: "#e8c27a", amber: "#ff9a3c", cream: "#f2e6d0", pink: "#e88aa0", dim: "rgba(242,230,208,.62)", faint: "rgba(242,230,208,.18)" };
const display: CSSProperties = { fontFamily: "'Playfair Display', serif", fontStyle: "italic", fontWeight: 900 };
const sign: CSSProperties = { fontFamily: "'Oswald', sans-serif", fontWeight: 600, textTransform: "uppercase" };
const body: CSSProperties = { fontFamily: "'Manrope', sans-serif" };
const hand: CSSProperties = { fontFamily: "'Caveat', cursive", fontWeight: 600 };
const mono: CSSProperties = { fontFamily: "'JetBrains Mono', monospace" };
const IMG = "/images/highest-in-the-room";

// Tufted black leather, drawn: buttons on a diamond grid with soft folds between them
const TUFT = `radial-gradient(circle at 50% 50%, rgba(0,0,0,.75) 0 3px, rgba(255,230,200,.10) 4px, transparent 9px),
  radial-gradient(circle at 0 0, rgba(0,0,0,.75) 0 3px, rgba(255,230,200,.10) 4px, transparent 9px),
  radial-gradient(ellipse at 25% 25%, rgba(255,220,190,.07), transparent 45%),
  radial-gradient(ellipse at 75% 75%, rgba(255,220,190,.05), transparent 45%),
  linear-gradient(135deg, rgba(0,0,0,.35) 0 1px, transparent 1px 50%, rgba(0,0,0,.35) 50% calc(50% + 1px), transparent calc(50% + 1px)),
  linear-gradient(45deg, rgba(0,0,0,.35) 0 1px, transparent 1px 50%, rgba(0,0,0,.35) 50% calc(50% + 1px), transparent calc(50% + 1px)),
  ${C.leather}`;
const GRAIN = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.55'/%3E%3C/svg%3E")`;

const bottleLabel = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
  ctx.fillStyle = "#0d0a08"; ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = "#c9a24a"; ctx.lineWidth = 6; ctx.strokeRect(18, 18, w - 36, h - 36);
  ctx.lineWidth = 2; ctx.strokeRect(32, 32, w - 64, h - 64);
  ctx.fillStyle = "#e8c27a"; ctx.textAlign = "center";
  ctx.font = "italic 900 108px 'Playfair Display', serif"; ctx.fillText("Highest", w / 2, h * 0.47);
  ctx.font = "italic 400 52px 'Playfair Display', serif"; ctx.fillText("in the room", w / 2, h * 0.64);
  ctx.font = "600 28px 'Oswald', sans-serif"; ctx.fillText("PH · NEW YORK · 1979", w / 2, h * 0.84);
};
const bottleLook = { liquid: "#6a3412", liquidOpacity: 0.88, glass: "#f4e6d0", cap: "#0e0b09", capRoughness: 0.35, collar: "#d9b45e" };

// Where a point of a picture lands when it is drawn object-fit: cover over a W × H box
// (ax, ay: the object-position, 0.5 = centred)
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

function Reveal({ children, delay = 0, style }: { children: React.ReactNode; delay?: number; style?: CSSProperties }) {
  const { ref, visible } = useReveal();
  return <div ref={ref} style={{ ...style, opacity: visible ? 1 : 0, transform: visible ? "none" : "translateY(24px)", transition: `opacity 1.2s ease ${delay}ms, transform 1.2s cubic-bezier(.16,1,.3,1) ${delay}ms` }}>{children}</div>;
}

function Head({ kicker, title, color = C.gold }: { kicker: string; title: string; color?: string }) {
  return (
    <div style={{ textAlign: "center", marginBottom: 46 }}>
      <p style={{ ...sign, fontSize: 13, letterSpacing: ".4em", color }}>{kicker}</p>
      <h2 style={{ ...display, fontSize: "clamp(2.3rem, 5.6vw, 4.6rem)", lineHeight: 1.02, marginTop: 10, color: C.cream }}>{title}</h2>
    </div>
  );
}

// Slow cigar smoke drifting across a section
function Haze({ opacity = 0.35 }: { opacity?: number }) {
  if (prefersReducedMotion()) return null;
  return (
    <div aria-hidden style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", mixBlendMode: "screen" }}>
      {[0, 1, 2].map((i) => <img key={i} className="hi-haze" src={`${IMG}/smoke.webp`} alt="" style={{ left: `${-10 + i * 38}%`, top: `${10 + (i % 2) * 40}%`, opacity, animationDelay: `${-i * 9}s`, animationDuration: `${26 + i * 6}s` }} />)}
    </div>
  );
}

// ── 1. The elevator: the dial creeps up to PH, the doors open by themselves onto the penthouse ──
const ELEV = { iw: 1536, ih: 1024, pivot: { x: 0.5, y: 0.212 }, len: 0.078 }; // dial pivot and needle length, fractions of elevator.webp
const FLOORS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "PH"];
const FLOOR_DEG = [-83, -72, -57, -41, -22, -1, 19, 38, 54, 68, 83]; // the engraved numbers are not evenly spaced

function Lift({ t, description }: { t: (ru: string, en: string) => string; description: string }) {
  const still = prefersReducedMotion();
  const { ref, p } = usePinProgress<HTMLElement>(!still);
  const room = useRef<HTMLDivElement>(null);
  const vp = useViewport();
  const ride = still ? 1 : Math.min(1, p / 0.8);
  // On PH the doors open by themselves and the page glides on into the penthouse; scrolling back down closes them
  const [opened, setOpened] = useState(still);
  const glide = useRef<number | undefined>(undefined);
  useEffect(() => {
    if (still) return;
    if (ride >= 1 && !opened) {
      setOpened(true);
      glide.current = window.setTimeout(() => {
        const el = ref.current; if (!el) return;
        const end = el.offsetTop + el.offsetHeight - window.innerHeight;
        if (window.scrollY < end - 4) window.scrollTo({ top: end, behavior: "smooth" });
      }, 1100);
    } else if (ride < 0.9 && opened) {
      setOpened(false);
      clearTimeout(glide.current);
    }
  }, [ride, opened, still, ref]);
  useEffect(() => () => clearTimeout(glide.current), []);
  const floor = Math.min(FLOORS.length - 1, Math.floor(ride * (FLOORS.length - 1) + 0.0001));
  const fi = ride * (FLOORS.length - 1), f0 = Math.floor(fi), f1 = Math.min(FLOORS.length - 1, f0 + 1);
  const angle = FLOOR_DEG[f0] + (FLOOR_DEG[f1] - FLOOR_DEG[f0]) * (fi - f0);
  const pv = coverPoint(vp.w, vp.h, ELEV.iw, ELEV.ih, ELEV.pivot.x, ELEV.pivot.y, 0.5, 0); // pinned to the top so the dial is never cropped
  const needle = ELEV.len * ELEV.iw * pv.s;
  const arrived = ride >= 1;
  const titleOut = Math.min(1, p / 0.2);
  const table = coverPoint(vp.w, vp.h, 1536, 1024, 0.5, 0.8); // the middle of the glass table top in penthouse.webp
  const bh = Math.min(380, Math.max(210, vp.h * 0.42));
  const doors = "transform 1.5s cubic-bezier(.65,0,.25,1) .25s, filter 1.5s ease .25s";
  const half = (side: 0 | 1): CSSProperties => ({ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", clipPath: side ? "inset(0 0 0 50%)" : "inset(0 50% 0 0)", transform: `translateX(${opened ? (side ? 52 : -52) : 0}%)`, filter: `brightness(${opened ? 0.6 : 1})`, transition: still ? "none" : doors, willChange: "transform" });
  return (
    <section ref={ref} style={{ position: "relative", height: still ? "100svh" : "230svh", background: C.black }}>
      <div ref={room} className={opened ? "hi-lounge" : undefined} style={{ position: still ? "relative" : "sticky", top: 0, height: "100svh", overflow: "hidden" }}>
        {/* the penthouse waits behind the doors: this is where the page begins */}
        <div style={{ position: "absolute", inset: 0, transform: `scale(${opened ? 1 : 1.12})`, transition: still ? "none" : "transform 2.2s cubic-bezier(.2,.7,.2,1) .25s" }}>
          <img src={`${IMG}/penthouse.webp`} alt={t("Пентхаус на Манхэттене: кожаный диван, латунная лампа, огни города", "A Manhattan penthouse: a leather sofa, a brass lamp, city lights")} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
          <Haze opacity={0.35} />
          <div style={{ position: "absolute", left: table.x, top: table.y, width: bh * 0.62, height: bh, transform: "translate(-50%, -96%)" }}>
            <div aria-hidden style={{ position: "absolute", left: "8%", right: "8%", bottom: "0%", height: "9%", borderRadius: "50%", background: "radial-gradient(ellipse, rgba(0,0,0,.6), transparent 70%)", filter: "blur(4px)" }} />
            <Bottle3D style={{ position: "absolute", inset: 0 }} lighting="gold" {...bottleLook} spin={0.18} drawLabel={bottleLabel} />
          </div>
        </div>
        <div aria-hidden style={{ position: "absolute", left: 0, right: 0, top: 0, height: "30%", background: "linear-gradient(rgba(8,5,3,.85), transparent)" }} />
        <div style={{ position: "absolute", left: 0, right: 0, top: "clamp(86px, 13vh, 130px)", textAlign: "center", pointerEvents: "none", padding: "0 16px", opacity: opened ? 1 : 0, transform: opened ? "none" : "translateY(16px)", transition: "opacity 1s ease 1.2s, transform 1.2s cubic-bezier(.16,1,.3,1) 1.2s" }}>
          <p style={{ ...sign, fontSize: 13, letterSpacing: ".4em", color: C.gold }}>{t("Пентхаус · 02:14", "Penthouse · 2:14 am")}</p>
          <h2 style={{ ...display, fontSize: "clamp(2.2rem, 5vw, 4rem)", color: C.cream, marginTop: 8, textShadow: "0 4px 30px rgba(0,0,0,.6)" }}>{t("Выше уже некуда", "There's nowhere higher")}</h2>
          <p className="hi-cigar-hint" style={{ ...mono, fontSize: 11, letterSpacing: ".2em", color: C.dim, marginTop: 10 }}>{t("ВОДИТЕ КУРСОРОМ — СИГАРА УЖЕ ЗАЖЖЕНА", "MOVE THE POINTER — THE CIGAR IS ALREADY LIT")}</p>
        </div>
        <SmokeTrail area={room} active={opened} />
        {/* the two door halves, with the dial riding on top of them */}
        {([0, 1] as const).map((side) => (
          <div key={side} aria-hidden={side === 1} style={half(side)}>
            <img src={`${IMG}/elevator.webp`} alt={side ? "" : t("Латунные двери лифта в стиле ар-деко", "Brass Art Deco elevator doors")} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 0%" }} />
            <div style={{ position: "absolute", left: pv.x, top: pv.y, width: 0, height: 0 }}>
              <span style={{ position: "absolute", left: -2, bottom: 0, width: 4, height: needle, borderRadius: 4, background: "linear-gradient(#2a1a0a, #120b05)", transformOrigin: "50% 100%", transform: `rotate(${angle}deg)`, boxShadow: "0 0 6px rgba(0,0,0,.6)" }} />
              <span style={{ position: "absolute", left: -9, top: -9, width: 18, height: 18, borderRadius: "50%", background: "radial-gradient(circle at 35% 35%, #ffe7a8, #8a6a20)", boxShadow: "0 2px 6px rgba(0,0,0,.6)" }} />
            </div>
          </div>
        ))}
        {/* PH lamp lights up on arrival */}
        <div aria-hidden style={{ position: "absolute", inset: 0, pointerEvents: "none", background: `radial-gradient(circle at ${pv.x}px ${pv.y}px, rgba(255,190,90,.4), transparent 30%)`, opacity: arrived && !opened ? 1 : 0, transition: "opacity .4s" }} />
        <div aria-hidden style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "linear-gradient(180deg, rgba(8,5,3,.0), rgba(8,5,3,.55) 72%, rgba(8,5,3,.85))", opacity: 1 - titleOut }} />
        <div style={{ position: "absolute", left: 0, right: 0, bottom: "clamp(70px, 13vh, 130px)", textAlign: "center", padding: "0 16px", pointerEvents: "none", opacity: 1 - titleOut, transform: `translateY(${titleOut * 30}px)` }}>
          <p style={{ ...sign, fontSize: 13, letterSpacing: ".45em", color: C.gold }}>{t("Манхэттен · 1979", "Manhattan · 1979")}</p>
          <h1 style={{ ...display, fontSize: "clamp(3.2rem, 9.5vw, 8rem)", lineHeight: 0.92, color: "#fff4dc", textShadow: "0 4px 40px rgba(0,0,0,.7), 0 0 60px rgba(255,170,80,.25)", margin: "10px 0 14px" }}>Highest in the room</h1>
          <p style={{ fontSize: "clamp(1.02rem, 1.6vw, 1.25rem)", lineHeight: 1.5, color: "#f3e6cf", maxWidth: 560, margin: "0 auto", textShadow: "0 2px 14px rgba(0,0,0,.8)" }}>{description}</p>
        </div>
        {/* floor readout */}
        <div aria-live="polite" style={{ position: "absolute", right: "clamp(14px, 3vw, 36px)", bottom: "clamp(16px, 4vh, 34px)", textAlign: "right", pointerEvents: "none", opacity: opened ? 0 : 1, transition: "opacity .5s" }}>
          <p style={{ ...sign, fontSize: 11, letterSpacing: ".35em", color: C.dim }}>{t("Этаж", "Floor")}</p>
          <p style={{ ...sign, fontSize: 44, lineHeight: 1, color: arrived ? C.amber : C.gold, textShadow: arrived ? "0 0 20px rgba(255,154,60,.7)" : "none", transition: "color .4s" }}>{FLOORS[floor]}</p>
        </div>
        {!still && <p className="hi-hint" style={{ position: "absolute", left: 0, right: 0, bottom: 22, textAlign: "center", ...sign, fontSize: 12, letterSpacing: ".35em", color: C.cream, opacity: 1 - titleOut, pointerEvents: "none" }}>{t("Листайте — поднимаемся ↓", "Scroll — going up ↓")}</p>}
      </div>
    </section>
  );
}

// In the penthouse the pointer becomes a lit cigar trailing smoke
function SmokeTrail({ area, active }: { area: React.RefObject<HTMLElement | null>; active: boolean }) {
  const cv = useRef<HTMLCanvasElement>(null);
  const cigar = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = area.current, canvas = cv.current;
    if (!active || !el || !canvas || prefersReducedMotion()) return;
    const ctx = canvas.getContext("2d")!;
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const puffs: { x: number; y: number; vx: number; vy: number; r: number; a: number; life: number; max: number }[] = [];
    const fit = () => { const r = el.getBoundingClientRect(); canvas.width = Math.round(r.width / 2); canvas.height = Math.round(r.height / 2); };
    fit();
    const ro = new ResizeObserver(fit); ro.observe(el);
    let px = -1, py = -1, last = 0;
    const emit = (x: number, y: number, n: number, spread = 0) => {
      for (let i = 0; i < n; i++) puffs.push({ x: x + (Math.random() - 0.5) * spread, y, vx: (Math.random() - 0.5) * 0.25, vy: -0.25 - Math.random() * 0.35, r: 3 + Math.random() * 4, a: 0.22 + Math.random() * 0.12, life: 0, max: 160 + Math.random() * 120 });
    };
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      px = (e.clientX - r.left) / 2; py = (e.clientY - r.top) / 2;
      setOn(true);
      if (cigar.current) cigar.current.style.transform = `translate(${e.clientX - r.left}px, ${e.clientY - r.top}px)`;
      const now = performance.now();
      if (now - last > 24) { last = now; emit(px, py, 1); }
    };
    const tap = (e: PointerEvent) => { const r = el.getBoundingClientRect(); emit((e.clientX - r.left) / 2, (e.clientY - r.top) / 2, 14, 18); };
    const enter = () => setOn(true), leave = () => { setOn(false); px = -1; };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerdown", tap);
    el.addEventListener("pointerenter", enter);
    el.addEventListener("pointerleave", leave);
    let raf = 0, frame = 0;
    const loop = () => {
      frame++;
      if (!coarse && px >= 0 && frame % 5 === 0) emit(px, py, 1); // a lit cigar keeps smoking when you hold still
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = puffs.length - 1; i >= 0; i--) {
        const s = puffs[i];
        s.life++; s.x += s.vx + Math.sin((s.life + i * 13) / 22) * 0.25; s.y += s.vy; s.r += 0.12;
        const k = s.life / s.max;
        const g = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r);
        g.addColorStop(0, `rgba(235,225,215,${s.a * (1 - k)})`); g.addColorStop(1, "rgba(235,225,215,0)");
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
        if (s.life >= s.max) puffs.splice(i, 1);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); el.removeEventListener("pointermove", move); el.removeEventListener("pointerdown", tap); el.removeEventListener("pointerenter", enter); el.removeEventListener("pointerleave", leave); setOn(false); };
  }, [area, active]);
  if (!active) return null;
  return (
    <>
      <canvas ref={cv} aria-hidden style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 5, filter: "blur(2px)" }} />
      <div aria-hidden className="hi-cigar-wrap" style={{ position: "absolute", left: 0, top: 0, zIndex: 6, pointerEvents: "none", opacity: on ? 1 : 0, transition: "opacity .3s" }}>
        <div ref={cigar} style={{ position: "absolute", left: 0, top: 0 }}>
          {/* a cigar drawn in CSS: the ember sits exactly on the pointer */}
          <div style={{ position: "absolute", left: -4, top: -6, width: 112, height: 12, transformOrigin: "4px 6px", transform: "rotate(28deg)" }}>
            <span style={{ position: "absolute", inset: 0, borderRadius: "6px 3px 3px 6px", background: "linear-gradient(180deg, #8a5a32, #5a361c 55%, #3a2212)", boxShadow: "0 6px 12px rgba(0,0,0,.6)" }} />
            <span style={{ position: "absolute", left: 66, top: -1, width: 14, height: 14, background: "linear-gradient(180deg, #f5d27a, #b88a2a)", borderRadius: 2 }} />
            <span style={{ position: "absolute", left: 0, top: 0, width: 9, height: 12, borderRadius: "6px 0 0 6px", background: "#3a3530" }} />
            <span className="hi-ember" style={{ position: "absolute", left: -2, top: 1, width: 8, height: 10, borderRadius: "50%", background: "radial-gradient(circle, #fff1b0, #ff7a1a 55%, #a8300a)" }} />
          </div>
        </div>
      </div>
    </>
  );
}

// ── 3. The drydown: a record on the turntable, three tracks ──
const TT = { platter: { x: 0.488, y: 0.486, r: 0.315 }, pivot: { x: 0.871, y: 0.215 } }; // fractions of turntable.webp (square)
const ARM = { pivot: { x: 0.77, y: 0.263 }, size: 0.55, rest: -42, start: -24, end: -2 }; // tonearm.webp pivot, its width vs. the deck, angles (deg)
const COVERS = [`${IMG}/cover-top.webp`, `${IMG}/cover-heart.webp`, `${IMG}/cover-base.webp`];

function Record({ stages, t }: { stages: { when: string; text: string; notes: string }[]; t: (ru: string, en: string) => string }) {
  const still = prefersReducedMotion();
  const { ref, p } = usePinProgress<HTMLElement>(!still);
  const stage = still ? 0 : Math.min(2, Math.floor(p * 3.05));
  const playing = still || p > 0.02;
  const armAngle = still ? ARM.start : p < 0.02 ? ARM.rest : ARM.start + Math.min(1, p) * (ARM.end - ARM.start);
  const spin = p * 1440;
  return (
    <section ref={ref} style={{ position: "relative", height: still ? "auto" : "330svh", background: `radial-gradient(ellipse at 30% 50%, #2a1a12, ${C.black} 70%)` }}>
      <div style={{ position: still ? "relative" : "sticky", top: 0, minHeight: "100svh", display: "flex", flexDirection: "column", justifyContent: "center", padding: "70px clamp(16px,4vw,48px) 30px", overflow: "hidden" }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ ...sign, fontSize: 13, letterSpacing: ".4em", color: C.gold }}>{t("Как раскрывается на коже", "How it unfolds on skin")}</p>
          <h2 style={{ ...display, fontSize: "clamp(2rem, 4.6vw, 3.8rem)", marginTop: 6, color: C.cream }}>{t("Поставь пластинку", "Put the record on")}</h2>
        </div>
        <div className="hi-deck-grid" style={{ position: "relative", maxWidth: 1200, width: "100%", margin: "28px auto 0", display: "grid", gridTemplateColumns: "1.05fr .95fr", gap: "24px 56px", alignItems: "center" }}>
          {/* the deck */}
          <div className="hi-deck" style={{ position: "relative", width: "min(100%, 62svh, 560px)", aspectRatio: "1", margin: "0 auto" }}>
            <img src={`${IMG}/turntable.webp`} alt={t("Проигрыватель винила", "A record player")} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", filter: "drop-shadow(0 30px 40px rgba(0,0,0,.6))" }} />
            {/* the record: grooves, a sheen that stays put, the album art as the centre label */}
            <div style={{ position: "absolute", left: `${(TT.platter.x - TT.platter.r) * 100}%`, top: `${(TT.platter.y - TT.platter.r) * 100}%`, width: `${TT.platter.r * 200}%`, aspectRatio: "1" }}>
              <div className={playing && !still ? "hi-spin" : undefined} style={{ position: "absolute", inset: 0, borderRadius: "50%", transform: `rotate(${spin}deg)`, background: "repeating-radial-gradient(circle, #0c0c0c 0 1px, #161616 1px 2.4px), #111", boxShadow: "0 8px 20px rgba(0,0,0,.6)" }}>
                {[0.62, 0.78].map((r) => <span key={r} aria-hidden style={{ position: "absolute", inset: `${(1 - r) * 50}%`, borderRadius: "50%", boxShadow: "0 0 0 2px rgba(0,0,0,.85)" }} />)}
                <div style={{ position: "absolute", inset: "33%", borderRadius: "50%", overflow: "hidden", boxShadow: "0 0 0 3px #0a0a0a" }}>
                  {COVERS.map((c, i) => <img key={c} src={c} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: stage === i ? 1 : 0, transition: "opacity .6s" }} />)}
                  <span style={{ position: "absolute", left: "50%", top: "50%", width: "9%", aspectRatio: "1", transform: "translate(-50%,-50%)", borderRadius: "50%", background: "#d8d2c4", boxShadow: "inset 0 1px 2px rgba(0,0,0,.6)" }} />
                </div>
              </div>
              <span aria-hidden style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "conic-gradient(from 20deg, transparent 0 10%, rgba(255,255,255,.10) 14%, transparent 20% 55%, rgba(255,255,255,.07) 60%, transparent 66%)", pointerEvents: "none" }} />
            </div>
            {/* the tonearm, turning on its own pivot */}
            <img src={`${IMG}/tonearm.webp`} alt="" aria-hidden style={{ position: "absolute", left: `${(TT.pivot.x - ARM.pivot.x * ARM.size) * 100}%`, top: `${(TT.pivot.y - ARM.pivot.y * ARM.size) * 100}%`, width: `${ARM.size * 100}%`, transformOrigin: `${ARM.pivot.x * 100}% ${ARM.pivot.y * 100}%`, transform: `rotate(${armAngle}deg)`, transition: "transform .5s cubic-bezier(.3,1,.4,1)", filter: "drop-shadow(0 12px 10px rgba(0,0,0,.55))", maxWidth: "none" }} />
          </div>
          {/* the track card with its sleeve */}
          <div className="hi-tracks" style={{ position: "relative", minHeight: "min(56svh, 520px)" }}>
            {stages.map((s, i) => (
              <article key={i} className="hi-track" style={{ position: still ? "relative" : "absolute", inset: still ? undefined : 0, display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 24, alignItems: "center", opacity: still || stage === i ? 1 : 0, transform: still || stage === i ? "none" : `translateY(${i < stage ? -24 : 24}px)`, transition: "opacity .7s ease, transform .9s cubic-bezier(.16,1,.3,1)", marginBottom: still ? 30 : 0 }}>
                <img className="hi-sleeve" src={COVERS[i]} alt="" loading="lazy" style={{ width: "100%", aspectRatio: "1", objectFit: "cover", borderRadius: 3, boxShadow: "0 30px 60px rgba(0,0,0,.6), inset 0 0 0 1px rgba(255,255,255,.08)" }} />
                <div>
                  <p style={{ ...sign, fontSize: 13, letterSpacing: ".3em", color: C.amber }}>{t("Сторона A", "Side A")} · {i + 1}</p>
                  <p style={{ ...display, fontSize: "clamp(1.6rem, 2.6vw, 2.2rem)", color: C.cream, marginTop: 6 }}>{s.when}</p>
                  <p style={{ fontSize: "clamp(1.05rem, 1.6vw, 1.25rem)", lineHeight: 1.5, marginTop: 12 }}>{s.text}</p>
                  <p style={{ ...mono, fontSize: 12, color: C.dim, marginTop: 14, lineHeight: 1.7 }}>{s.notes}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
        {!still && (
          <div aria-hidden style={{ display: "flex", justifyContent: "center", gap: 10, marginTop: 22 }}>
            {[0, 1, 2].map((i) => <span key={i} style={{ width: 34, height: 4, borderRadius: 99, background: i <= stage ? C.amber : C.faint, transition: "background .4s" }} />)}
          </div>
        )}
      </div>
    </section>
  );
}

// ── 4. The humidor: the notes laid out on cedar, each with a gold cigar band ──
type Note = { file: string; label: [string, string]; tier: [string, string] };
const HUMIDOR: Note[] = [
  { file: "ing-cannabis", label: ["Каннабис", "Cannabis"], tier: ["верх", "top"] },
  { file: "ing-pinkpepper", label: ["Розовый перец", "Pink Pepper"], tier: ["верх", "top"] },
  { file: "ing-saffron", label: ["Шафран", "Saffron"], tier: ["верх", "top"] },
  { file: "ing-frangipani", label: ["Франжипани", "Frangipani"], tier: ["сердце", "heart"] },
  { file: "ing-iris", label: ["Ирис", "Iris"], tier: ["сердце", "heart"] },
  { file: "ing-suede", label: ["Замша", "Suede"], tier: ["сердце", "heart"] },
  { file: "ing-patchouli", label: ["Патчули", "Patchouli"], tier: ["база", "base"] },
  { file: "ing-sandalwood", label: ["Сандал", "Sandalwood"], tier: ["база", "base"] },
  { file: "ing-oakmoss", label: ["Дубовый мох", "Oakmoss"], tier: ["база", "base"] },
];

function Humidor({ lang }: { lang: "ru" | "en" }) {
  const { ref, visible } = useReveal();
  const L = (p: [string, string]) => (lang === "ru" ? p[0] : p[1]);
  return (
    <div ref={ref} className="hi-scroll" style={{ position: "relative", maxWidth: 1080, margin: "0 auto", perspective: 1600 }}>
      <div className="hi-scroll-in" style={{ position: "relative", aspectRatio: "1325 / 803" }}>
        <img src={`${IMG}/humidor.webp`} alt="" aria-hidden style={{ position: "absolute", inset: 0, width: "100%", height: "100%", filter: "drop-shadow(0 40px 50px rgba(0,0,0,.7))" }} />
        <div style={{ position: "absolute", left: "9.5%", right: "9.5%", top: "15.5%", bottom: "13.5%", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gridTemplateRows: "repeat(3, 1fr)", gap: "2%" }}>
          {HUMIDOR.map((n, i) => (
            <div key={n.file} className="hi-item" style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", opacity: visible ? 1 : 0, transition: `opacity .8s ease ${700 + i * 90}ms` }}>
              <img src={`${IMG}/${n.file}.webp`} alt={L(n.label)} loading="lazy" style={{ position: "absolute", inset: "0 12% 25%", width: "76%", height: "75%", objectFit: "contain", filter: "drop-shadow(0 10px 10px rgba(0,0,0,.45))" }} />
              <div className="hi-band" style={{ position: "absolute", left: "50%", bottom: "4%", transform: "translateX(-50%)", padding: "4px 12px 3px", background: "linear-gradient(180deg, #f6dc8e, #c9a24a 55%, #a07a28)", color: "#2a1a08", borderRadius: 2, boxShadow: "0 4px 10px rgba(0,0,0,.45), inset 0 0 0 1px rgba(90,60,10,.5)", textAlign: "center", whiteSpace: "nowrap" }}>
                <p style={{ ...sign, fontSize: "clamp(10px, 1.15vw, 13px)", letterSpacing: ".12em" }}>{L(n.label)}</p>
                <p style={{ ...mono, fontSize: 8, letterSpacing: ".2em", opacity: 0.75 }}>{L(n.tier).toUpperCase()}</p>
              </div>
            </div>
          ))}
        </div>
        {/* the lid swings open when the box comes into view */}
        <div aria-hidden style={{ position: "absolute", inset: 0, transformOrigin: "50% 0%", transform: visible ? "rotateX(96deg)" : "rotateX(0deg)", transition: "transform 1.6s cubic-bezier(.5,.05,.2,1) .2s", borderRadius: 10, background: "repeating-linear-gradient(90deg, rgba(0,0,0,.18) 0 2px, transparent 2px 14px), linear-gradient(135deg, #5a1e10, #2a0c06)", boxShadow: "inset 0 0 0 6px #1a0804, 0 20px 40px rgba(0,0,0,.6)", display: "flex", alignItems: "center", justifyContent: "center", backfaceVisibility: "hidden" }}>
          <span style={{ ...display, fontSize: "clamp(1.4rem, 3vw, 2.4rem)", color: C.gold, textShadow: "0 1px 0 #000" }}>Highest · PH</span>
        </div>
      </div>
    </div>
  );
}

// ── 5. Strength on hi-fi VU meters ──
function Meter({ label, value, i, live }: { label: string; value: number; i: number; live: boolean }) {
  const angle = live ? -48 + (value / 100) * 96 : -48;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ position: "relative", width: "100%", aspectRatio: "1.55", borderRadius: 6, overflow: "hidden", background: "radial-gradient(ellipse at 50% 120%, #ffd28a, #f3dfb4 60%, #e2c88e)", boxShadow: "inset 0 0 0 3px #1a1410, inset 0 6px 14px rgba(0,0,0,.35), 0 0 22px rgba(255,180,80,.25)" }}>
        <svg viewBox="0 0 155 100" aria-hidden style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
          <path d="M 25 72 A 62 62 0 0 1 116 40" fill="none" stroke="#2a1a10" strokeWidth="1.2" />
          <path d="M 116 40 A 62 62 0 0 1 130 72" fill="none" stroke="#c0281c" strokeWidth="4" />
          {Array.from({ length: 11 }, (_, k) => {
            const a = ((-48 + k * 9.6) * Math.PI) / 180, cx = 77.5, cy = 102;
            const r1 = 70, r2 = k % 2 ? 64 : 61;
            return <line key={k} x1={cx + Math.sin(a) * r1} y1={cy - Math.cos(a) * r1} x2={cx + Math.sin(a) * r2} y2={cy - Math.cos(a) * r2} stroke={k > 7 ? "#c0281c" : "#2a1a10"} strokeWidth={k % 2 ? 0.8 : 1.4} />;
          })}
          <text x="77.5" y="58" textAnchor="middle" fontFamily="Oswald, sans-serif" fontSize="9" letterSpacing="2" fill="#2a1a10">VU</text>
        </svg>
        <span className={live ? "hi-needle" : undefined} style={{ position: "absolute", left: "50%", bottom: "-2%", width: 2, height: "86%", marginLeft: -1, background: "#141010", transformOrigin: "50% 100%", transform: `rotate(${angle}deg)`, transition: `transform 1.8s cubic-bezier(.3,1.5,.5,1) ${i * 140}ms`, ["--a" as string]: `${angle}deg` }} />
        <span aria-hidden style={{ position: "absolute", left: "50%", bottom: "-9%", width: "22%", aspectRatio: "1", transform: "translateX(-50%)", borderRadius: "50%", background: "#1a1410" }} />
        <span aria-hidden style={{ position: "absolute", inset: 0, background: "linear-gradient(160deg, rgba(255,255,255,.35), transparent 40%)" }} />
      </div>
      <p style={{ ...sign, fontSize: 13, letterSpacing: ".18em", color: C.cream, marginTop: 12, textAlign: "center" }}>{label}</p>
      <p style={{ ...mono, fontSize: 12, color: C.amber, marginTop: 2 }}>{value}</p>
    </div>
  );
}

function Amplifier({ facets, lang }: { facets: { label: { ru: string; en: string }; value: number }[]; lang: "ru" | "en" }) {
  const { ref, visible } = useReveal();
  return (
    <div ref={ref} style={{ maxWidth: 1080, margin: "0 auto", padding: "clamp(18px, 3vw, 34px)", borderRadius: 10, background: "repeating-linear-gradient(90deg, rgba(255,255,255,.04) 0 1px, transparent 1px 3px), linear-gradient(180deg, #d9d6cf, #a9a49a)", boxShadow: "0 40px 80px rgba(0,0,0,.6), inset 0 1px 0 rgba(255,255,255,.6), inset 0 -2px 0 rgba(0,0,0,.25)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, color: "#2a2620" }}>
        <span style={{ ...sign, fontSize: 13, letterSpacing: ".35em" }}>Silentium · Stereo</span>
        <span style={{ display: "flex", alignItems: "center", gap: 8, ...mono, fontSize: 10, letterSpacing: ".2em" }}>POWER <span style={{ width: 9, height: 9, borderRadius: "50%", background: visible ? "#ff4a2a" : "#5a2a20", boxShadow: visible ? "0 0 10px #ff4a2a" : "none", transition: "all .4s" }} /></span>
      </div>
      <div className="hi-meters" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "clamp(14px, 2.4vw, 30px)", padding: "clamp(14px, 2vw, 24px)", borderRadius: 6, background: "#14100c", boxShadow: "inset 0 4px 14px rgba(0,0,0,.8)" }}>
        {facets.map((f, i) => <Meter key={i} label={pick(lang, f.label)} value={f.value} i={i} live={visible} />)}
      </div>
    </div>
  );
}

// ── 6. Polaroids on black leather: tap to flash and develop ──
const POLAROIDS = [1, 2, 3, 4].map((i) => `${IMG}/polaroid-${i}.webp`);
const TILTS = [-6, 4, -3, 7];

function Polaroid({ src, caption, i, t }: { src: string; caption: string; i: number; t: (ru: string, en: string) => string }) {
  const [shot, setShot] = useState(false);
  const still = prefersReducedMotion();
  const developed = shot || still;
  return (
    <button onClick={() => setShot(true)} aria-label={t(`Проявить снимок: ${caption}`, `Develop the photo: ${caption}`)} className="hi-polaroid" style={{ position: "relative", display: "block", width: "100%", padding: "6% 6% 0", background: "#f4f1ea", borderRadius: 2, transform: `rotate(${TILTS[i % 4]}deg)`, boxShadow: "0 24px 40px rgba(0,0,0,.6)", cursor: developed ? "default" : "pointer", textAlign: "center" }}>
      <div style={{ position: "relative", aspectRatio: "1", overflow: "hidden", background: "#2a2622" }}>
        <img src={src} alt={caption} loading="lazy" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: developed ? "none" : "brightness(.35) sepia(1) blur(6px) saturate(.3)", opacity: developed ? 1 : 0.4, transition: still ? "none" : "filter 4.5s ease .4s, opacity 3s ease .2s" }} />
        {shot && !still && <span aria-hidden className="hi-flash" />}
        {!developed && <span style={{ position: "absolute", left: 0, right: 0, bottom: 10, ...mono, fontSize: 10, letterSpacing: ".2em", color: "rgba(242,230,208,.7)" }}>{t("НАЖМИТЕ · ВСПЫШКА", "TAP · FLASH")}</span>}
      </div>
      <p style={{ ...hand, fontSize: "clamp(1.05rem, 1.6vw, 1.35rem)", lineHeight: 1.2, color: "#1e1a16", padding: "10px 4px 14px", minHeight: "3.4em", display: "flex", alignItems: "center", justifyContent: "center" }}>{caption}</p>
    </button>
  );
}

// ── 7. The request: a gold lighter you flick open ──
const WICK = { x: 0.456, y: 0.235 }; // the wick in lighter-open.webp, fractions of the image

function Lighter({ onLit, t }: { onLit: () => void; t: (ru: string, en: string) => string }) {
  const [lit, setLit] = useState(0);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const flick = () => {
    setLit((x) => x + 1);
    clearTimeout(timer.current);
    timer.current = window.setTimeout(onLit, prefersReducedMotion() ? 0 : 1700);
  };
  return (
    <button onClick={flick} className="hi-lighter" aria-label={t("Открыть зажигалку и оставить заявку", "Flick the lighter open and leave a request")} style={{ position: "relative", width: "min(340px, 74vw)", aspectRatio: "1240 / 1268", marginTop: 30, background: "transparent", cursor: "pointer" }}>
      <img src={`${IMG}/lighter-closed.webp`} alt={t("Золотая зажигалка", "A gold lighter")} className={lit ? "hi-flick-out" : undefined} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: lit ? 0 : 1, filter: "drop-shadow(0 30px 30px rgba(0,0,0,.6))" }} />
      {/* the two pictures are not the same lighter pixel for pixel, so the swap hides inside a quick flick */}
      <img src={`${IMG}/lighter-open.webp`} alt="" aria-hidden className={lit ? "hi-flick-in" : undefined} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: lit ? 1 : 0, filter: "drop-shadow(0 30px 30px rgba(0,0,0,.6))" }} />
      {lit > 0 && (
        <div key={lit} aria-hidden style={{ position: "absolute", left: `${WICK.x * 100}%`, top: `${WICK.y * 100}%`, width: 0, height: 0, pointerEvents: "none" }}>
          <span className="hi-glow" />
          <img className="hi-flame" src={`${IMG}/flame.webp`} alt="" />
          <img className="hi-rise" src={`${IMG}/smoke.webp`} alt="" />
        </div>
      )}
      {lit === 0 && <span className="hi-taphint" style={{ position: "absolute", left: "50%", bottom: -6, transform: "translateX(-50%)", ...sign, fontSize: 12, letterSpacing: ".3em", color: C.gold, whiteSpace: "nowrap" }}>{t("Щёлкните крышкой", "Flick it open")}</span>}
    </button>
  );
}

export default function HighestWorld({ perfume }: WorldProps) {
  const [, navigate] = useLocation();
  const { lang, setLang, t } = useLang();
  const [open, setOpen] = useState(false);
  const g = perfume.guide!;
  const n = perfume.scentNotes;
  const Lp = (v: { ru: string; en: string }) => pick(lang, v);
  const fragments = pick(lang, perfume.memoryFragments).map(fragmentText);
  const scenes = pick(lang, g.scenes);
  const shown = useMemo(() => new Set(HUMIDOR.map((b) => b.label[lang === "ru" ? 0 : 1].toLowerCase())), [lang]);
  const otherNotes = [...new Set((["top", "heart", "base"] as const).flatMap((k) => (n[k] ? pick(lang, n[k]!) : [])))].filter((x) => !shown.has(x.toLowerCase()));
  const stages = g.drydown.map((d) => ({ when: Lp(d.when), text: Lp(d.text), notes: n[d.notes] ? pick(lang, n[d.notes]!).join(" · ") : "" }));

  const skin: DialogSkin = {
    overlay: "rgba(8,5,3,.82)",
    panel: { ...body, background: TUFT, backgroundSize: "56px 56px, 56px 56px, 100% 100%, 100% 100%, 56px 56px, 56px 56px, auto", padding: "32px 28px", color: C.cream, borderRadius: 10, boxShadow: "0 40px 100px rgba(0,0,0,.7), inset 0 0 0 2px #c9a24a", border: "none" },
    title: { ...display, fontSize: 36, color: C.gold },
    label: { ...sign, fontSize: 11, letterSpacing: ".25em", color: C.dim },
    input: { ...body, fontSize: 15, background: "rgba(0,0,0,.45)", border: "1px solid rgba(201,162,74,.5)", padding: "11px 12px", color: C.cream, borderRadius: 4 },
    button: { ...sign, fontSize: 16, letterSpacing: ".3em", background: "linear-gradient(180deg, #f6dc8e, #c9a24a 60%, #a07a28)", color: "#1a1008", padding: "14px", borderRadius: 4, boxShadow: "0 0 30px rgba(232,194,122,.35)" },
    accent: C.gold,
    heading: { ru: "Вы в списке гостей", en: "You're on the guest list" },
    submit: { ru: "Подняться в пентхаус", en: "Take me up" },
    sent: { ru: "Вы в списке. Лифт уже едет за вами.", en: "You're on the list. The elevator is on its way." },
  };

  const facts: [string, string][] = [
    [t("Стойкость", "Longevity"), Lp(g.longevity)],
    [t("Шлейф", "Sillage"), Lp(g.sillage)],
    [t("Сезон", "Season"), Lp(g.season)],
    [t("Когда носить", "When to wear"), Lp(g.time)],
  ];
  const leatherBg: CSSProperties = { background: TUFT, backgroundSize: "64px 64px, 64px 64px, 100% 100%, 100% 100%, 64px 64px, 64px 64px, auto" };

  return (
    <div style={{ ...body, background: C.black, color: C.cream, minHeight: "100vh", overflowX: "clip" }}>
      <style>{`
        .hi-grain { position: fixed; inset: -50%; z-index: 60; pointer-events: none; background-image: ${GRAIN}; opacity: .09; mix-blend-mode: overlay; animation: hi-grain 1s steps(4) infinite; }
        @keyframes hi-grain { 0% { transform: translate(0,0); } 25% { transform: translate(-3%,2%); } 50% { transform: translate(2%,-3%); } 75% { transform: translate(-2%,-1%); } }
        .hi-hint { animation: hi-bob 2.4s ease-in-out infinite; } @keyframes hi-bob { 50% { transform: translateY(6px); } }
        .hi-haze { position: absolute; width: 70vmax; max-width: none; animation: hi-haze linear infinite; }
        @keyframes hi-haze { 0% { transform: translate(-10%, 6%) rotate(0deg) scale(1); } 50% { transform: translate(14%, -8%) rotate(12deg) scale(1.15); } 100% { transform: translate(-10%, 6%) rotate(0deg) scale(1); } }
        .hi-lounge { cursor: none; } @media (pointer: coarse) { .hi-lounge { cursor: auto; } .hi-cigar-wrap { display: none; } }
        .hi-ember { animation: hi-ember 1.6s ease-in-out infinite; } @keyframes hi-ember { 50% { box-shadow: 0 0 14px 5px rgba(255,120,30,.75); } 0%, 100% { box-shadow: 0 0 8px 2px rgba(255,120,30,.5); } }
        .hi-spin { animation: hi-spin 1.8s linear infinite; } @keyframes hi-spin { to { rotate: 360deg; } }
        .hi-item { transition: transform .4s cubic-bezier(.3,1.5,.5,1); } .hi-item:hover { transform: translateY(-8px) scale(1.06); z-index: 2; }
        .hi-needle { animation: hi-needle 2.6s ease-in-out 2s infinite; }
        @keyframes hi-needle { 0%, 100% { transform: rotate(var(--a)); } 30% { transform: rotate(calc(var(--a) + 3deg)); } 55% { transform: rotate(calc(var(--a) - 2deg)); } 80% { transform: rotate(calc(var(--a) + 1.5deg)); } }
        .hi-polaroid { transition: transform .4s cubic-bezier(.3,1.4,.5,1); } .hi-polaroid:hover { transform: rotate(0deg) scale(1.04) !important; z-index: 2; }
        .hi-flash { position: absolute; inset: 0; background: #fff; animation: hi-flash 1s ease-out forwards; pointer-events: none; }
        @keyframes hi-flash { 0% { opacity: 1; } 100% { opacity: 0; } }
        .hi-dymo { display: inline-block; padding: 6px 12px 5px; background: linear-gradient(180deg, #1c1c1c, #0a0a0a); color: #f4f4f4; border-radius: 3px; font-family: 'JetBrains Mono', monospace; font-size: 13px; letter-spacing: .14em; text-transform: uppercase; text-shadow: 0 1px 0 rgba(255,255,255,.35), 0 -1px 0 rgba(0,0,0,.8); box-shadow: 0 6px 12px rgba(0,0,0,.5), inset 0 1px 0 rgba(255,255,255,.12); }
        .hi-glow { position: absolute; left: -120px; top: -150px; width: 240px; height: 240px; border-radius: 50%; background: radial-gradient(circle, rgba(255,170,60,.45), transparent 65%); animation: hi-on .3s ease-out both; }
        .hi-flame { position: absolute; left: -55px; top: -88px; width: 110px; max-width: none; mix-blend-mode: screen; transform-origin: 50% 90%; animation: hi-on .25s ease-out both, hi-flicker .18s ease-in-out .25s infinite alternate; }
        @keyframes hi-on { from { transform: scaleY(.1); opacity: 0; } to { transform: none; opacity: 1; } }
        @keyframes hi-flicker { from { transform: scale(1, 1) skewX(0deg); } to { transform: scale(.94, 1.06) skewX(2deg); } }
        .hi-rise { position: absolute; left: -90px; top: -320px; width: 180px; max-width: none; mix-blend-mode: screen; opacity: 0; animation: hi-rise 3.2s ease-out .6s infinite; }
        @keyframes hi-rise { 0% { transform: translateY(60px) scale(.4); opacity: 0; } 30% { opacity: .55; } 100% { transform: translateY(-80px) scale(1.2); opacity: 0; } }
        .hi-taphint { animation: hi-bob 2.4s ease-in-out infinite; }
        .hi-flick-out { animation: hi-flick-out .22s ease-in both; }
        @keyframes hi-flick-out { 0% { opacity: 1; transform: none; } 100% { opacity: 0; transform: rotate(-4deg) scale(1.04); } }
        .hi-flick-in { animation: hi-flick-in .45s cubic-bezier(.3,1.6,.5,1) both; }
        @keyframes hi-flick-in { 0% { opacity: 0; transform: rotate(4deg) scale(.96); } 40% { opacity: 1; } 100% { opacity: 1; transform: none; } }
        .hi-lighter:hover img:first-child { transform: rotate(-2deg); transition: transform .3s; }
        @media (prefers-reduced-motion: reduce) { .hi-grain, .hi-hint, .hi-haze, .hi-ember, .hi-spin, .hi-needle, .hi-taphint { animation: none; } }
        @media (max-width: 820px) {
          .hi-two, .hi-deck-grid { grid-template-columns: 1fr !important; }
          .hi-track { grid-template-columns: 1fr !important; }
          .hi-sleeve { display: none; }
          .hi-deck { width: min(100%, 40svh) !important; }
          .hi-tracks { min-height: 230px !important; }
          .hi-meters { grid-template-columns: repeat(2, 1fr) !important; }
          .hi-facts { grid-template-columns: 1fr !important; }
          .hi-photos { grid-template-columns: repeat(2, 1fr) !important; }
          .hi-scroll { overflow-x: auto; overscroll-behavior-x: contain; scrollbar-width: none; padding-bottom: 20px; }
          .hi-scroll::-webkit-scrollbar { display: none; }
          .hi-scroll-in { width: 760px; }
          .hi-cigar-hint { display: none; }
        }
        .hi-swipe { display: none; } @media (max-width: 820px) { .hi-swipe { display: block; } }
      `}</style>
      <div aria-hidden className="hi-grain" />

      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 50, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px clamp(16px,3vw,28px)", ...sign, fontSize: 12, letterSpacing: ".2em", color: C.cream, background: "linear-gradient(rgba(8,5,3,.75), transparent)" }}>
        <button onClick={() => navigate("/map")} style={{ color: C.cream }}>← {t("К карте", "Map")}</button>
        <span style={{ ...display, letterSpacing: ".02em", fontSize: 18, textTransform: "none", color: C.gold }}>Silentium</span>
        <span>{(["ru", "en"] as const).map((l) => <button key={l} onClick={() => setLang(l)} style={{ marginLeft: 10, color: lang === l ? C.gold : C.dim }}>{l.toUpperCase()}</button>)}</span>
      </nav>

      <Lift t={t} description={pick(lang, perfume.description)} />

      {/* what it smells like: the club membership card on black leather */}
      <section style={{ ...leatherBg, padding: "110px clamp(16px,4vw,48px) 120px" }}>
        <div className="hi-two" style={{ maxWidth: 1180, margin: "0 auto", display: "grid", gridTemplateColumns: "1.2fr .8fr", gap: "40px 70px", alignItems: "center" }}>
          <Reveal>
            <p style={{ ...sign, fontSize: 13, letterSpacing: ".4em", color: C.gold }}>{t("Как он пахнет", "What it smells like")}</p>
            <p style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(1.45rem, 2.5vw, 2.05rem)", lineHeight: 1.4, marginTop: 14, color: "#fff4e2" }}>{Lp(g.plain)}</p>
            <dl className="hi-facts" style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "16px 26px", marginTop: 36 }}>
              {facts.map(([k, v]) => (
                <div key={k} style={{ padding: "12px 14px", borderLeft: `2px solid ${C.brass}`, background: "rgba(0,0,0,.35)" }}>
                  <dt style={{ ...sign, fontSize: 11, letterSpacing: ".25em", color: C.gold }}>{k}</dt>
                  <dd style={{ fontSize: 16, lineHeight: 1.4, marginTop: 6, color: "#fff4e2" }}>{v}</dd>
                </div>
              ))}
            </dl>
            {g.tip && <p style={{ marginTop: 22, fontSize: 15, color: "#f3e3c8" }}><span style={{ color: C.amber }}>✦ </span>{Lp(g.tip)}</p>}
          </Reveal>
          <Reveal delay={150}>
            {/* the members' card */}
            <div style={{ position: "relative", aspectRatio: "1.586", padding: "7% 8%", borderRadius: 14, color: "#2a1a08", background: "linear-gradient(125deg, #f8e2a0, #d4ac52 35%, #f1d48a 55%, #b98c34 80%, #e9c878)", boxShadow: "0 40px 80px rgba(0,0,0,.65), inset 0 1px 0 rgba(255,255,255,.6)", transform: "rotate(-4deg)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <span style={{ ...display, fontSize: "clamp(1.1rem, 2vw, 1.5rem)" }}>Highest in the room</span>
                <span style={{ ...sign, fontSize: 10, letterSpacing: ".3em" }}>PH</span>
              </div>
              <div>
                <p style={{ ...sign, fontSize: 10, letterSpacing: ".3em", opacity: 0.75 }}>{t("Стойкость", "Longevity")}</p>
                <p style={{ ...display, fontSize: "clamp(2.6rem, 6vw, 4.4rem)", lineHeight: 1 }}>{Lp(g.longevity)}</p>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", ...mono, fontSize: 11, letterSpacing: ".18em" }}>
                <span>{t("ЧЛЕН КЛУБА", "MEMBER")} · №0079</span>
                <span>NEW YORK</span>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <Record stages={stages} t={t} />

      {/* what it's made of: the humidor */}
      <section style={{ position: "relative", background: `radial-gradient(ellipse at 50% 0%, #3a1a10, ${C.black} 70%)`, padding: "110px clamp(12px,3vw,40px) 110px" }}>
        <Head kicker={t("Хьюмидор", "The humidor")} title={t("Из чего он сделан", "What it's made of")} />
        <Humidor lang={lang} />
        <p className="hi-swipe" style={{ ...mono, fontSize: 11, letterSpacing: ".2em", color: C.dim, textAlign: "center", marginTop: 6 }}>{t("← ЛИСТАЙТЕ ВБОК →", "← SWIPE SIDEWAYS →")}</p>
        {otherNotes.length > 0 && <p style={{ textAlign: "center", fontSize: 15, color: C.dim, maxWidth: 760, margin: "40px auto 0", lineHeight: 1.7 }}><span style={{ color: C.gold }}>{t("А ещё", "And also")}:</span> {otherNotes.join(" · ")}</p>}
      </section>

      {/* strength: VU meters */}
      <section style={{ position: "relative", background: `linear-gradient(180deg, ${C.black}, #1a0f0a)`, padding: "110px clamp(16px,4vw,48px) 120px" }}>
        <Head kicker={t("Характер", "Character")} title={t("Чего в нём больше всего", "What it holds the most of")} />
        <Amplifier facets={g.facets} lang={lang} />
      </section>

      {/* scenes: Polaroids on leather, memories on Dymo tape */}
      <section style={{ position: "relative", ...leatherBg, padding: "110px clamp(16px,4vw,48px) 120px", overflow: "hidden" }}>
        <Haze opacity={0.18} />
        <Head kicker={t("На что это похоже", "What it feels like")} title={t("Снимки той ночи", "Shots from that night")} />
        <div className="hi-photos" style={{ position: "relative", maxWidth: 1100, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "clamp(18px, 3vw, 40px)" }}>
          {scenes.slice(0, 4).map((s, i) => <Reveal key={i} delay={i * 120} style={{ marginTop: i % 2 ? 40 : 0 }}><Polaroid src={POLAROIDS[i]} caption={s} i={i} t={t} /></Reveal>)}
        </div>
        <div style={{ position: "relative", display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "14px 18px", maxWidth: 900, margin: "70px auto 0" }}>
          {fragments.map((f, i) => <span key={i} className="hi-dymo" style={{ transform: `rotate(${((i * 37) % 7) - 3}deg)` }}>{f}</span>)}
        </div>
      </section>

      {/* request: the gold lighter */}
      <section style={{ position: "relative", background: `radial-gradient(ellipse at 50% 45%, #2e1a10, ${C.black} 70%)`, padding: "110px 16px 120px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
        <Head kicker={t("Заявка", "Request")} title={t("Есть огонёк?", "Got a light?")} />
        <p style={{ fontSize: 17, color: C.dim, marginTop: -26 }}>{t("Щёлкните зажигалкой — откроем заявку.", "Flick the lighter — we'll open the request.")}</p>
        <Lighter onLit={() => setOpen(true)} t={t} />
        <p style={{ fontSize: 15, color: C.dim, maxWidth: 440, lineHeight: 1.6, marginTop: 34 }}>{t("Оставьте контакт — мы напишем и расскажем, как получить флакон.", "Leave your contact — we'll write and tell you how to get a bottle.")}</p>
        <p style={{ ...mono, fontSize: 11, color: C.dim, marginTop: 10 }}>Extrait de parfum · {perfume.releaseDate} · {pick(lang, perfume.origin.location)}</p>
      </section>

      <RequestDialog open={open} onClose={() => setOpen(false)} perfumeName={perfume.name} skin={skin} />
    </div>
  );
}
