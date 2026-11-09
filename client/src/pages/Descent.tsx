// Silentium — the descent.
// A tall scroll page: a stick figure climbs down an endless ladder. At each landing the camera pans,
// the ladder slides to the left and a corridor opens on the right with a door at its far end.
// The door leads to the perfume page. Everything per-frame is written straight to the DOM from one rAF loop.

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { useLocation } from "wouter";
import { useLang } from "@/contexts/LangContext";
import { getPerfumeById } from "@/lib/perfumes";
import { BOTTLE_COLORS } from "@/lib/bottleLooks";

const mono: CSSProperties = { fontFamily: "'JetBrains Mono', 'DM Mono', monospace" };
const serif: CSSProperties = { fontFamily: "'Cormorant Garamond', serif" };
const INK = "#efe9ff";
const DIM = "rgba(239,233,255,.55)";

// From light to dark — the deeper you go, the heavier the scent
const STOPS = [
  "almost-nothing", "laundry-routine", "sunlit-memories", "summer-of-2009", "santa-caecilia", "self-addicted",
  "highest-in-the-room", "narcisstic-king", "synthetic-ecstasy", "russian-banya", "silent-fog", "seance",
];

const RUNG = 54;           // ladder rung spacing, px — one tile of ladder.webp
const LADDER_W = 86, RUNG_MID = 27; // tile width; rung centre within the tile (rails sit at ±37 px)
const CLIMB_SECONDS = 4;   // the climber never takes less than this between two landings — he lags behind a fast scroll
const METERS_PER_PX = 0.04; // depth readout
const SCROLL_KEY = "silentium:descent-scroll";

type Layout = {
  vw: number; vh: number;
  desc: number;   // scroll px spent climbing between landings
  gap: number;    // ladder px between landings
  hold: number;   // scroll px spent standing at a landing
  seg: number;
  total: number;  // scrollable height
  feetY: number;  // screen y of the climber's feet
  ladderTo: number; // screen x of the ladder while at a landing
  corrW: number; corrH: number;
  ledge: number;  // gap between the ladder axis and the corridor opening
};

function makeLayout(): Layout {
  const vw = window.innerWidth, vh = window.innerHeight;
  const mobile = vw < 720;
  const desc = Math.round(vh * 0.5), hold = Math.round(vh * 0.75);
  const feetY = Math.round(vh * 0.68);
  const ledge = mobile ? 70 : 100;
  // mobile: ladder hugs the left edge (room for the climber's arms), corridor fills the rest
  let corrW = mobile ? vw - 46 - ledge - 14 : Math.min(vw * 0.62, 1400);
  if (corrW * 0.5625 > feetY - 170) corrW = (feetY - 170) / 0.5625; // leave room for the name above it
  return {
    vw, vh, desc, hold, seg: desc + hold, feetY, gap: Math.round(vh * 0.78),
    total: STOPS.length * (desc + hold) + desc + vh,
    // ladder + corridor sit as one centred group, the ladder never further right than a quarter of the screen
    ladderTo: mobile ? 46 : Math.min(vw * 0.25, Math.max(vw * 0.12, (vw - corrW - ledge) / 2 - 40)),
    // corridor art is 16:9; on phones the opening is square and the art is cropped around the door
    corrW, corrH: mobile ? Math.min(corrW, feetY - 170) : corrW * 0.5625, ledge,
  };
}

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const smooth = (x: number) => { const t = clamp01(x); return t * t * (3 - 2 * t); };
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** scroll → where the climber is, how much the camera is focused on a landing and which one */
function timeline(s: number, L: Layout) {
  const n = STOPS.length;
  const k = L.gap / L.desc;
  if (s >= n * L.seg) return { depth: n * L.gap + (s - n * L.seg) * k, focus: 0, stop: -1 };
  const i = Math.floor(Math.max(0, s) / L.seg), w = s - i * L.seg;
  if (w < L.desc) return { depth: i * L.gap + w * k, focus: 0, stop: -1 };
  const h = (w - L.desc) / L.hold;
  return { depth: (i + 1) * L.gap, focus: smooth(h / 0.3) * (1 - smooth((h - 0.75) / 0.25)), stop: i };
}

// ——— stick figure ———
// Diagonal limbs move together over a two-rung cycle; a gripping limb is fixed to the ladder,
// so in body space it slides up as the body goes down, then swings back down to the next rung.
const HOLD = 0.5;
function limbY(u: number, low: number) {
  const reach = 2 * RUNG * HOLD;
  const p = ((u % 1) + 1) % 1;
  if (p < HOLD) return { y: low - reach * (p / HOLD), lift: 0 };
  const q = (p - HOLD) / (1 - HOLD);
  return { y: low - reach + reach * smooth(q), lift: Math.sin(q * Math.PI) };
}
function joint(ax: number, ay: number, bx: number, by: number, len: number, side: number) {
  const dx = bx - ax, dy = by - ay, d = Math.hypot(dx, dy) || 1;
  const mx = (ax + bx) / 2, my = (ay + by) / 2;
  const h = Math.sqrt(Math.max(0, len * len - (d / 2) * (d / 2)));
  return [mx + (-dy / d) * h * side, my + (dx / d) * h * side];
}
const HAND_LOW = 4 - 2 * RUNG, FOOT_LOW = 4; // two rungs apart, so hands and feet land on rungs together
/** limbs + torso as one path, plus where the head goes. `time` (s) drives breathing and idle shifts. */
function stickPose(depth: number, focus: number, time: number) {
  const u = depth / (2 * RUNG);
  const ph = u * Math.PI * 2;
  const climb = 1 - focus;
  // weight swings toward the planted foot, the body pulls up a little on each grip, the chest breathes
  const sway = Math.sin(ph) * 5 * climb + Math.sin(time * 0.7) * 1.6 * focus;
  const pull = (1 - Math.cos(ph * 2)) * 2 * climb;
  const breath = Math.sin(time * 1.7) * (0.8 + 0.8 * focus);
  const lean = 5 * focus; // at a landing he turns toward the corridor
  const shX = sway * 1.15 + lean, shY = -112 + pull + breath;
  const hipX = -sway * 0.55 + lean * 0.3, hipY = -62 + pull * 0.5;
  const limbs = [
    { root: [shX - 14, shY], tip: -37, low: HAND_LOW, ph: 0, len: 36, bend: -1 },  // left hand
    { root: [shX + 14, shY], tip: 37, low: HAND_LOW, ph: 0.5, len: 36, bend: 1 },  // right hand
    { root: [hipX - 8, hipY], tip: -20, low: FOOT_LOW, ph: 0.5, len: 37, bend: 1 }, // left foot
    { root: [hipX + 8, hipY], tip: 20, low: FOOT_LOW, ph: 0, len: 37, bend: -1 },   // right foot
  ];
  const d = limbs.map((l) => {
    const m = limbY(u + l.ph, l.low);
    // at a landing: settle into a calm stance (hands on the rails, feet on the ledge)
    const rest = l.low === HAND_LOW ? -132 + breath * 0.4 : 0;
    const tx = l.tip * (1 + m.lift * 0.22 * climb);
    const ty = lerp(m.y, rest, focus);
    const [jx, jy] = joint(l.root[0], l.root[1], tx, ty, l.len, l.bend);
    return `M${l.root[0].toFixed(1)} ${l.root[1].toFixed(1)} L${jx.toFixed(1)} ${jy.toFixed(1)} L${tx.toFixed(1)} ${ty.toFixed(1)}`;
  }).join(" ");
  // spine curves slightly with the sway
  const spine = `M${shX.toFixed(1)} ${(shY - 6).toFixed(1)} Q${((shX + hipX) / 2 + sway * 0.6).toFixed(1)} ${((shY + hipY) / 2).toFixed(1)} ${hipX.toFixed(1)} ${hipY.toFixed(1)}`;
  const bones = ` M${(shX - 14).toFixed(1)} ${shY.toFixed(1)} L${(shX + 14).toFixed(1)} ${shY.toFixed(1)} M${(hipX - 8).toFixed(1)} ${hipY.toFixed(1)} L${(hipX + 8).toFixed(1)} ${hipY.toFixed(1)}`;
  const head = [shX * 1.1 + lean * 0.8 + Math.sin(ph + 0.8) * 1.2 * climb, shY - 21 + Math.sin(ph * 2 + 0.6) * 1.2 * climb + breath * 0.3];
  return { d: d + " " + spine + bones, head };
}

// ——— corridor art (client/public/images/descent) ———
const ART = "/images/descent";
const IMG_W = 1672, IMG_H = 941; // corridor images, 16:9
/** the glowing doorway at the far end of each corridor image, in image px (measured by hand) */
const DOORWAYS: Record<string, [x: number, y: number, w: number, h: number]> = {
  "almost-nothing": [960, 424, 34, 95],
  "laundry-routine": [964, 424, 41, 91],
  "sunlit-memories": [1001, 424, 40, 107],
  "summer-of-2009": [968, 416, 40, 114],
  "santa-caecilia": [973, 424, 36, 107],
  "self-addicted": [970, 424, 46, 107],
  "highest-in-the-room": [989, 427, 38, 109],
  "narcisstic-king": [1005, 461, 35, 118],
  "synthetic-ecstasy": [973, 442, 37, 94],
  "russian-banya": [983, 430, 42, 108],
  "silent-fog": [984, 438, 35, 93],
  "seance": [1002, 478, 36, 98],
};
const ZOOM_BASE = 1.3, ZOOM_LANDING = 0.5; // camera creeps into the corridor while you stand at the landing

function Corridor({ id, glow, entering, label, focusable, onEnter, boxW, boxH }: { id: string; glow: string; entering: boolean; label: string; focusable: boolean; onEnter: () => void; boxW: number; boxH: number }) {
  const [x, y, w, h] = DOORWAYS[id];
  const pct = (v: number, of: number) => `${(v / of) * 100}%`;
  // cover the opening, keeping the doorway as close to its centre as the art allows
  const k = Math.max(boxW / IMG_W, boxH / IMG_H), cw = IMG_W * k, ch = IMG_H * k;
  const cx = (x + w / 2) * k, cy = (y + h / 2) * k;
  const left = Math.min(0, Math.max(boxW - cw, boxW / 2 - cx)), top = Math.min(0, Math.max(boxH - ch, boxH / 2 - cy));
  return (
    <div className={`ds-cam ${entering ? "is-enter" : ""}`} style={{ position: "absolute", left, top, width: cw, height: ch, transformOrigin: `${cx}px ${cy}px` }}>
      <img src={`${ART}/corridor-${id}.webp`} alt="" draggable={false} decoding="async" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />
      <div className="ds-bloom" style={{ left: pct(x + w / 2, IMG_W), top: pct(y + h / 2, IMG_H), background: `radial-gradient(circle, ${glow}aa, ${glow}33 25%, transparent 60%)` }} />
      <div style={{ position: "absolute", left: pct(x, IMG_W), top: pct(y, IMG_H), width: pct(w, IMG_W), height: pct(h, IMG_H), perspective: 300 }}>
        <img className="ds-leaf" src={`${ART}/door-${id}.webp`} alt="" draggable={false} decoding="async" />
      </div>
      {/* generous hit area around the small far doorway */}
      <button className="ds-hit" aria-label={label} tabIndex={focusable ? 0 : -1} onClick={onEnter}
        style={{ left: pct(x - w * 1.2, IMG_W), top: pct(y - h * 0.2, IMG_H), width: pct(w * 3.4, IMG_W), height: pct(h * 1.5, IMG_H) }} />
    </div>
  );
}

// ——— shaft decor between landings, on the wall left of the ladder (the right side belongs to the corridors) ———
type DecorKind = "torch" | "niche" | "plaque" | "grate" | "chain" | "roots";
const CARVINGS = ["SILENTIUM", "MEMENTO", "IN PROFUNDIS", "ODOR MEMORIAE", "NOX", "PER ASPERA", "TACE"];
/** `at` is a fraction of the gap below landing `gap` (-1 = above the first landing), `x` is px left of the ladder */
const DECOR: { gap: number; at: number; x: number; kind: DecorKind; text?: string }[] = [];
{
  const kinds: DecorKind[] = ["torch", "plaque", "niche", "chain", "torch", "grate", "roots", "niche"];
  for (let g = -1; g < STOPS.length + 1; g++) {
    const j = g + 1;
    DECOR.push({ gap: g, at: 0.28, x: 170 + ((j * 53) % 90), kind: kinds[(j * 2) % kinds.length], text: CARVINGS[j % CARVINGS.length] });
    DECOR.push({ gap: g, at: 0.74, x: 300 + ((j * 71) % 160), kind: kinds[(j * 2 + 1) % kinds.length], text: CARVINGS[(j + 4) % CARVINGS.length] });
  }
}

const decorImg = (name: string, style: CSSProperties) => <img src={`${ART}/${name}.webp`} alt="" draggable={false} decoding="async" style={{ position: "absolute", maxWidth: "none", ...style }} />;

function Decor({ kind, text }: { kind: DecorKind; text?: string }) {
  if (kind === "torch") return (
    <div style={{ position: "absolute", left: -15, top: -70 }}>
      <div className="ds-torch-glow" />
      {decorImg("torch", { left: 0, top: 0, width: 30, height: 127 })}
      <div className="ds-flame" style={{ left: 3, top: -24, width: 24, height: 36 }} />
    </div>
  );
  if (kind === "niche") return (
    <div style={{ position: "absolute", left: -40, top: -142 }}>
      <div className="ds-candle-glow" />
      {decorImg("niche", { left: 0, top: 0, width: 80, height: 143 })}
      <div className="ds-flame" style={{ left: 35, top: 74, width: 10, height: 16, animationDuration: "1.9s" }} />
    </div>
  );
  if (kind === "grate") return decorImg("grate", { left: -50, top: -86, width: 100, height: 85 });
  if (kind === "chain") return decorImg("chain", { left: -20, top: -150, width: 39, height: 240 });
  if (kind === "roots") return decorImg("roots", { left: -105, top: -120, width: 197, height: 210, opacity: 0.85 });
  return (
    <div style={{ position: "absolute", left: -120, top: -68, width: 240, height: 135 }}>
      {decorImg("plaque", { inset: 0, width: "100%", height: "100%" })}
      <span style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", ...serif, fontWeight: 600, fontSize: 19, letterSpacing: ".26em", color: "rgba(14,12,10,.78)", textShadow: "0 1px 0 rgba(255,255,255,.12)" }}>{text}</span>
    </div>
  );
}

export default function Descent() {
  const [, navigate] = useLocation();
  const { lang, setLang, t } = useLang();
  const [L, setL] = useState<Layout>(() => makeLayout());
  const [active, setActive] = useState(-1);
  const [entering, setEntering] = useState<string | null>(null);

  const ladderRef = useRef<HTMLDivElement>(null);
  const climberRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<SVGPathElement>(null);
  const headRef = useRef<SVGCircleElement>(null);
  const worldRef = useRef<HTMLDivElement>(null);
  const posRef = useRef(-1); // where the climber actually is, in scroll px — chases window.scrollY at a limited speed
  const lampRef = useRef<HTMLDivElement>(null);
  const wallRef = useRef<HTMLDivElement>(null);
  const wallLitRef = useRef<HTMLDivElement>(null);
  const depthRef = useRef<HTMLSpanElement>(null);
  const introRef = useRef<HTMLDivElement>(null);
  const stopRefs = useRef<(HTMLDivElement | null)[]>([]);
  const activeRef = useRef(-1);
  const enteringRef = useRef(false);

  useEffect(() => {
    const onResize = () => setL(makeLayout());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // come back to the same landing after visiting a perfume
  useLayoutEffect(() => {
    let saved: string | null = null;
    try { saved = sessionStorage.getItem(SCROLL_KEY); } catch { /* storage blocked */ }
    window.scrollTo(0, saved ? Number(saved) : 0);
    posRef.current = window.scrollY;
  }, []);

  useEffect(() => {
    let raf = 0, prev = performance.now();
    if (posRef.current < 0) posRef.current = window.scrollY;
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.05, (now - prev) / 1000);
      prev = now;
      // ease toward the scroll position, but never faster than one landing per CLIMB_SECONDS
      // (unless the jump is long — e.g. the landing index — then hurry proportionally)
      const target = window.scrollY, diff = target - posRef.current;
      const cap = Math.max(L.seg / CLIMB_SECONDS, Math.abs(diff) > L.seg * 1.5 ? Math.abs(diff) * 1.4 : 0) * dt;
      const step = diff * (1 - Math.exp(-dt * 3));
      posRef.current += Math.abs(diff) < 0.5 ? diff : Math.sign(step) * Math.min(Math.abs(step), cap);
      const s = posRef.current;
      const { depth, focus, stop } = timeline(s, L);
      const ladderX = lerp(L.vw / 2, L.ladderTo, focus);

      if (ladderRef.current) {
        ladderRef.current.style.transform = `translate3d(${ladderX}px,0,0)`;
        // rungs line up with where the hands and feet grip
        ladderRef.current.style.backgroundPosition = `0 ${((L.feetY + FOOT_LOW + 6 - RUNG_MID - depth) % RUNG + RUNG) % RUNG}px`;
      }
      if (climberRef.current) climberRef.current.style.transform = `translate3d(${ladderX}px,${L.feetY}px,0)`;
      const pose = stickPose(depth, focus, now / 1000);
      bodyRef.current?.setAttribute("d", pose.d);
      headRef.current?.setAttribute("cx", pose.head[0].toFixed(1));
      headRef.current?.setAttribute("cy", pose.head[1].toFixed(1));
      if (worldRef.current) worldRef.current.style.transform = `translate3d(${ladderX}px,${L.feetY - depth}px,0)`;
      if (lampRef.current) lampRef.current.style.transform = `translate3d(${ladderX}px,${L.feetY - 70}px,0)`;
      const wallPos = `${(ladderX - L.vw / 2) * 0.6}px ${-depth * 0.85}px`;
      if (wallRef.current) wallRef.current.style.backgroundPosition = wallPos;
      if (wallLitRef.current) {
        const m = `radial-gradient(circle at ${ladderX}px ${L.feetY - 70}px, #000 0, rgba(0,0,0,.35) 200px, transparent 420px)`;
        wallLitRef.current.style.backgroundPosition = wallPos;
        wallLitRef.current.style.maskImage = m;
        wallLitRef.current.style.webkitMaskImage = m;
      }
      if (depthRef.current) depthRef.current.textContent = `−${(depth * METERS_PER_PX).toFixed(1)} ${lang === "ru" ? "м" : "m"}`;
      if (introRef.current) introRef.current.style.opacity = String(1 - smooth(s / (L.vh * 0.5)));

      STOPS.forEach((_, i) => {
        const el = stopRefs.current[i];
        if (!el) return;
        const y = L.feetY + (i + 1) * L.gap - depth;
        const vis = y > -L.vh * 0.2 && y < L.vh * 1.9;
        el.style.display = vis ? "block" : "none";
        if (!vis) return;
        const f = i === stop ? focus : 0;
        el.style.transform = `translate3d(${ladderX}px,${y}px,0)`;
        el.style.setProperty("--f", f.toFixed(3));
      });

      const a = focus > 0.5 ? stop : -1;
      if (a !== activeRef.current) { activeRef.current = a; setActive(a); }
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [L, lang]);

  const enter = (id: string) => {
    if (enteringRef.current) return;
    enteringRef.current = true;
    try { sessionStorage.setItem(SCROLL_KEY, String(Math.round(posRef.current))); } catch { /* storage blocked */ }
    setEntering(id);
    window.setTimeout(() => navigate(`/perfume/${id}`), 950);
  };

  const jumpTo = (i: number) => window.scrollTo({ top: i * L.seg + L.desc + L.hold * 0.45, behavior: "smooth" });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Enter" && activeRef.current >= 0) enter(STOPS[activeRef.current]); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const entGlow = entering ? BOTTLE_COLORS[entering]?.glow ?? "#fff" : "#fff";

  return (
    <div style={{ height: L.total, background: "#050408", color: INK }}>
      <style>{`
        .ds-btn { color: ${DIM}; transition: color .2s; } .ds-btn:hover { color: ${INK}; }
        .ds-stop { position: absolute; left: 0; top: 0; will-change: transform; --f: 0; }
        .ds-reveal { opacity: var(--f); transform: translateY(calc((1 - var(--f)) * 14px)); }
        .ds-cam { transform: scale(calc(${ZOOM_BASE} + var(--f) * ${ZOOM_LANDING})); }
        .ds-cam.is-enter { transform: scale(16); filter: brightness(1.5); transition: transform 1.1s cubic-bezier(.7,0,.25,1), filter 1.1s; }
        .ds-leaf { position: absolute; inset: 0; width: 100%; height: 100%; transform-origin: 0 50%; transition: transform .9s cubic-bezier(.16,1,.3,1), filter .9s;
          filter: brightness(.82) drop-shadow(0 0 3px rgba(0,0,0,.6)); }
        .ds-cam:has(.ds-hit:hover) .ds-leaf, .ds-cam:has(.ds-hit:focus-visible) .ds-leaf, .ds-cam.is-enter .ds-leaf { transform: rotateY(-72deg); filter: brightness(.55); }
        .ds-bloom { position: absolute; width: 22%; aspect-ratio: 1; translate: -50% -50%; border-radius: 50%; pointer-events: none; mix-blend-mode: screen; opacity: .25; transition: opacity .9s; }
        .ds-cam:has(.ds-hit:hover) .ds-bloom, .ds-cam.is-enter .ds-bloom { opacity: .9; }
        .ds-hit { position: absolute; border-radius: 6px; cursor: pointer; outline: none; }
        .ds-portal { position: absolute; pointer-events: none; border-style: solid; border-width: 34px 28px 0; border-image: url(${ART}/frame.webp) 102 88 0 89 / 34px 28px 0 round stretch; filter: brightness(.8); }
        .ds-hit:focus-visible { box-shadow: 0 0 0 2px ${INK}; }
        .ds-dot { width: 7px; height: 7px; border-radius: 50%; border: 1px solid ${DIM}; transition: all .3s; }
        .ds-dot:hover { border-color: ${INK}; }
        .ds-flame { position: absolute; left: 1px; top: 4px; width: 18px; height: 30px; border-radius: 50% 50% 45% 45% / 62% 62% 38% 38%;
          background: radial-gradient(ellipse at 50% 75%, #fff6d8 0%, #ffc864 30%, #ff7a1e 62%, rgba(255,80,20,0) 72%);
          transform-origin: 50% 90%; animation: ds-flick 1.3s ease-in-out infinite alternate; filter: blur(.4px); mix-blend-mode: screen; }
        @keyframes ds-flick { 0% { transform: scale(1, 1) skewX(0); } 30% { transform: scale(.92, 1.08) skewX(-3deg); } 60% { transform: scale(1.05, .94) skewX(2deg); } 100% { transform: scale(.96, 1.04) skewX(-1deg); } }
        .ds-torch-glow { position: absolute; left: -330px; top: -320px; width: 680px; height: 680px; border-radius: 50%; pointer-events: none;
          background: radial-gradient(circle, rgba(255,160,70,.2), rgba(255,120,40,.07) 30%, transparent 62%); animation: ds-glow 2.3s ease-in-out infinite alternate; }
        .ds-candle-glow { position: absolute; left: -80px; top: -60px; width: 228px; height: 228px; border-radius: 50%; pointer-events: none;
          background: radial-gradient(circle, rgba(255,200,120,.16), transparent 60%); animation: ds-glow 3.1s ease-in-out infinite alternate; }
        @keyframes ds-glow { 0% { opacity: .75; } 40% { opacity: 1; } 55% { opacity: .82; } 100% { opacity: .95; } }
        .ds-hint { animation: ds-bob 2.4s ease-in-out infinite; } @keyframes ds-bob { 50% { transform: translateY(6px); opacity: .5; } }
        @media (max-width: 720px) { .ds-rail { display: none !important; } .ds-cap { font-size: 1.5rem !important; } .ds-hit { left: 0 !important; top: 0 !important; width: 100% !important; height: 100% !important; } .ds-cam { transform: scale(calc(1 + var(--f) * .35)); } }
      `}</style>

      <div style={{ position: "fixed", inset: 0, overflow: "hidden" }}>
        {/* shaft wall — stone blocks drifting with depth */}
        <div ref={wallRef} style={{ position: "absolute", inset: 0, opacity: 0.28, backgroundImage: `url(${ART}/wall.webp)`, backgroundSize: "360px 360px" }} />
        {/* the same wall, fully lit, showing only around the climber's lamp */}
        <div ref={wallLitRef} style={{ position: "absolute", inset: 0, opacity: 0.75, backgroundImage: `url(${ART}/wall.webp)`, backgroundSize: "360px 360px" }} />
        {/* the climber's light */}
        <div ref={lampRef} style={{ position: "absolute", left: 0, top: 0, width: 0, height: 0 }}>
          <div style={{ position: "absolute", left: -520, top: -520, width: 1040, height: 1040, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,236,200,.13), rgba(255,236,200,.04) 35%, transparent 65%)" }} />
        </div>

        {/* torches, niches and carvings on the shaft wall — one layer that moves with the ladder */}
        <div ref={worldRef} style={{ position: "absolute", left: 0, top: 0, width: 0, height: 0, willChange: "transform" }} aria-hidden>
          {DECOR.map((d, i) => (
            <div key={i} style={{ position: "absolute", left: -d.x, top: (d.gap + 1 + d.at) * L.gap - 60 }}>
              <Decor kind={d.kind} text={d.text} />
            </div>
          ))}
        </div>

        {/* landings with their corridors */}
        {STOPS.map((id, i) => {
          const p = getPerfumeById(id);
          const look = BOTTLE_COLORS[id] ?? { glow: "#fff", liquid: "#555", cap: "#222" };
          const ledge = L.ledge;
          return (
            <div key={id} ref={(el) => { stopRefs.current[i] = el; }} className="ds-stop">
              {/* ledge from the ladder into the corridor */}
              <img src={`${ART}/ledge.webp`} alt="" draggable={false} style={{ position: "absolute", maxWidth: "none", left: -130, top: -6, width: 130 + ledge + 30, height: 26, filter: "brightness(.85) drop-shadow(0 8px 10px rgba(0,0,0,.7))" }} />
              {/* glow leaking out into the shaft */}
              <div style={{ position: "absolute", left: ledge + L.corrW * 0.64 - 300, top: -L.corrH * 0.47 - 300, width: 600, height: 600, borderRadius: "50%", background: `radial-gradient(circle, ${look.glow}22, transparent 60%)`, pointerEvents: "none" }} />
              {/* opening in the wall */}
              <div style={{ position: "absolute", left: ledge, top: -L.corrH, width: L.corrW, height: L.corrH, overflow: "hidden", background: "#050408" }}>
                <Corridor id={id} glow={look.glow} entering={entering === id} focusable={active === i} onEnter={() => enter(id)} boxW={L.corrW} boxH={L.corrH}
                  label={t(`Открыть дверь: ${p?.name}`, `Open the door: ${p?.name}`)} />
                <div style={{ position: "absolute", inset: 0, pointerEvents: "none", boxShadow: "inset 0 0 60px 10px rgba(5,4,8,.9)" }} />
              </div>
              <div className="ds-portal" style={{ left: ledge - 28, top: -L.corrH - 34, width: L.corrW + 56, height: L.corrH + 34 }} />
              {/* name above the opening */}
              <div className="ds-reveal" style={{ position: "absolute", left: ledge, top: -L.corrH - 84, width: L.corrW, display: "flex", alignItems: "baseline", gap: 14, pointerEvents: "none" }}>
                <span style={{ ...mono, fontSize: 11, letterSpacing: ".3em", color: look.glow }}>№ {String(i + 1).padStart(2, "0")}</span>
                <span className="ds-cap" style={{ ...serif, fontStyle: "italic", fontWeight: 300, fontSize: "2.2rem", lineHeight: 1, whiteSpace: "nowrap" }}>{p?.name}</span>
              </div>
              {/* tagline + call to action under the ledge */}
              <div className="ds-reveal" style={{ position: "absolute", left: ledge, top: 26, width: L.corrW, pointerEvents: "none" }}>
                <p style={{ ...serif, fontStyle: "italic", fontSize: "1.25rem", color: INK }}>{p ? (lang === "ru" ? p.tagline.ru : p.tagline.en) : ""}</p>
                <p style={{ ...mono, fontSize: 11, letterSpacing: ".22em", textTransform: "uppercase", color: look.glow, marginTop: 8 }}>{t("нажмите на дверь →", "click the door →")}</p>
              </div>
            </div>
          );
        })}

        {/* the endless ladder */}
        <div ref={ladderRef} style={{
          position: "absolute", top: 0, bottom: 0, left: -LADDER_W / 2, width: LADDER_W,
          backgroundImage: `url(${ART}/ladder.webp)`, backgroundSize: `${LADDER_W}px ${RUNG}px`, backgroundRepeat: "repeat-y",
          filter: "brightness(.9) drop-shadow(0 0 10px rgba(0,0,0,.8))",
        }} />

        {/* the climber */}
        <div ref={climberRef} style={{ position: "absolute", left: 0, top: 0, width: 0, height: 0 }}>
          <svg width="120" height="180" viewBox="-60 -165 120 180" style={{ position: "absolute", left: -60, top: -165, overflow: "visible", filter: "drop-shadow(0 0 6px rgba(255,236,200,.35))" }} aria-hidden>
            <path ref={bodyRef} d={stickPose(0, 0, 0).d} fill="none" stroke={INK} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
            <circle ref={headRef} cx="0" cy="-133" r="12" fill="#050408" stroke={INK} strokeWidth="3.2" />
          </svg>
        </div>

        {/* darkness above and below */}
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "linear-gradient(#050408 0%, transparent 18%, transparent 80%, #050408 100%)" }} />

        {/* intro */}
        <div ref={introRef} style={{ position: "absolute", left: 0, right: 0, top: "16vh", textAlign: "center", pointerEvents: "none", padding: "0 16px" }}>
          <p style={{ ...mono, fontSize: 11, letterSpacing: ".35em", color: DIM, textTransform: "uppercase" }}>{t("спуск", "the descent")}</p>
          <h1 style={{ ...serif, fontStyle: "italic", fontWeight: 300, fontSize: "clamp(1.8rem, 4vw, 3.2rem)", lineHeight: 1.1, marginTop: 8, textShadow: "0 0 18px #050408, 0 0 36px #050408" }}>{t("Чем глубже — тем тише", "The deeper, the quieter")}</h1>
          <p className="ds-hint" style={{ ...mono, fontSize: 11, letterSpacing: ".22em", color: DIM, textTransform: "uppercase", marginTop: "calc(68vh - 16vh - 40px)", textShadow: "0 0 12px #050408" }}>↓ {t("листайте вниз", "scroll down")}</p>
        </div>

        {/* bottom of the shaft */}
        {active === -1 && (
          <BottomNote L={L} t={t} onTop={() => window.scrollTo({ top: 0, behavior: "smooth" })} onNebula={() => navigate("/nebula")} />
        )}

        {/* header */}
        <header style={{ position: "absolute", top: 0, left: 0, right: 0, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "22px clamp(16px,3vw,32px)", ...mono, fontSize: 12, letterSpacing: ".2em" }}>
          <button className="ds-btn" onClick={() => navigate("/")}>← SILENTIUM</button>
          <span ref={depthRef} style={{ color: DIM }} aria-hidden>−0.0 м</span>
          <span>{(["ru", "en"] as const).map((l) => <button key={l} className="ds-btn" onClick={() => setLang(l)} style={{ marginLeft: 12, color: lang === l ? INK : undefined }}>{l.toUpperCase()}</button>)}</span>
        </header>

        {/* landings index */}
        <nav className="ds-rail" aria-label={t("Площадки", "Landings")} style={{ position: "absolute", right: "clamp(16px,2.4vw,28px)", top: "50%", transform: "translateY(-50%)", display: "flex", flexDirection: "column", gap: 12 }}>
          {STOPS.map((id, i) => {
            const glow = BOTTLE_COLORS[id]?.glow ?? INK;
            return (
              <button key={id} className="ds-dot" title={getPerfumeById(id)?.name} aria-label={getPerfumeById(id)?.name} onClick={() => jumpTo(i)}
                style={active === i ? { background: glow, borderColor: glow, boxShadow: `0 0 10px ${glow}` } : undefined} />
            );
          })}
        </nav>

        {/* stepping through the door */}
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: entGlow, opacity: entering ? 1 : 0, transition: "opacity .55s ease .45s" }} />
      </div>
    </div>
  );
}

function BottomNote({ L, t, onTop, onNebula }: { L: Layout; t: (ru: string, en: string) => string; onTop: () => void; onNebula: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const k = smooth((window.scrollY - STOPS.length * L.seg - L.desc * 0.4) / (L.desc * 0.5));
      if (ref.current) { ref.current.style.opacity = String(k); ref.current.style.pointerEvents = k > 0.5 ? "auto" : "none"; }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [L]);
  return (
    <div ref={ref} style={{ position: "absolute", left: 0, right: 0, top: "24vh", textAlign: "center", opacity: 0, padding: "0 16px" }}>
      <p style={{ ...serif, fontStyle: "italic", fontWeight: 300, fontSize: "clamp(1.6rem, 3.4vw, 2.6rem)" }}>{t("Дальше — только тишина", "Below this, only silence")}</p>
      <div style={{ ...mono, fontSize: 12, letterSpacing: ".2em", textTransform: "uppercase", marginTop: 20, display: "flex", gap: 28, justifyContent: "center" }}>
        <button className="ds-btn" onClick={onTop}>↑ {t("наверх", "back up")}</button>
        <button className="ds-btn" onClick={onNebula}>{t("туманность", "nebula")} →</button>
      </div>
    </div>
  );
}
