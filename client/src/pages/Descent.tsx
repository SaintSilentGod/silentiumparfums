// Silentium — the descent.
// A tall scroll page: a stick figure climbs down an endless ladder. At each landing the camera pans,
// the ladder slides to the left and a corridor opens on the right with a door at its far end.
// The door leads to the perfume page. Everything per-frame is written straight to the DOM from one rAF loop.

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type RefObject } from "react";
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
const FOLLOW = 14;         // how fast the climber catches up with the scroll, 1/s — light smoothing, never a lag
const METERS_PER_PX = 0.04; // depth readout
const SCROLL_KEY = "silentium:descent-scroll";

type Layout = {
  vw: number; vh: number;
  first: number;  // scroll position of the first landing
  seg: number;    // scroll px from one landing to the next
  plat: number;   // half-width of the scroll zone where the climber stands still at a landing
  end: number;    // max scroll — a little below the last landing
  gap: number;    // ladder px between landings
  total: number;  // document height
  feetY: number;  // screen y of the climber's feet
  ladderTo: number; // screen x of the ladder while at a landing
  corrW: number; corrH: number;
  ledge: number;  // gap between the ladder axis and the corridor opening
  zoomBase: number; zoomLanding: number; // camera creeps into the corridor while you stand at the landing
  mobile: boolean;
};

function makeLayout(): Layout {
  const vw = window.innerWidth, vh = window.innerHeight;
  const mobile = vw < 720;
  const seg = Math.round(vh * 0.95), plat = Math.round(vh * 0.2), first = Math.round(vh * 0.75);
  const end = first + (STOPS.length - 1) * seg + seg;
  const feetY = Math.round(vh * 0.68);
  const ledge = mobile ? 70 : 100;
  // mobile: ladder hugs the left edge (room for the climber's arms), corridor fills the rest
  let corrW = mobile ? vw - 46 - ledge - 14 : Math.min(vw * 0.62, 1400);
  if (corrW * 0.5625 > feetY - 170) corrW = (feetY - 170) / 0.5625; // leave room for the name above it
  return {
    vw, vh, first, seg, plat, end, feetY, gap: Math.round(vh * 0.78),
    total: end + vh, mobile, zoomBase: mobile ? 1 : 1.3, zoomLanding: mobile ? 0.35 : 0.5,
    // ladder + corridor sit as one centred group, the ladder never further right than a quarter of the screen
    ladderTo: mobile ? 46 : Math.min(vw * 0.25, Math.max(vw * 0.12, (vw - corrW - ledge) / 2 - 40)),
    // corridor art is 16:9; on phones the opening is square and the art is cropped around the door
    corrW, corrH: mobile ? Math.min(corrW, feetY - 170) : corrW * 0.5625, ledge,
  };
}

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const smooth = (x: number) => { const t = clamp01(x); return t * t * (3 - 2 * t); };
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const landingAt = (i: number, L: Layout) => L.first + i * L.seg;

/** scroll → where the climber is, how much the camera is focused on a landing and which one.
 *  Landing i sits at scroll `first + i·seg`; within ±plat of it the climber stands still, between landings
 *  he eases out and in (so he arrives softly and the page's scroll-snap can settle right on the landing).
 *  The ladder slides aside a little before he stops and slides back as he leaves — the motions overlap. */
function timeline(s: number, L: Layout) {
  const n = STOPS.length;
  const i = Math.max(0, Math.min(n - 1, Math.round((s - L.first) / L.seg))); // nearest landing
  const d = s - landingAt(i, L), at = (i + 1) * L.gap;
  const focus = 1 - smooth((Math.abs(d) - L.plat * 0.5) / (L.plat * 1.1));
  let depth = at;
  if (d < -L.plat) {
    // still above landing i: climbing from the previous one (or from the top)
    const from = i === 0 ? 0 : landingAt(i - 1, L) + L.plat, to = landingAt(i, L) - L.plat;
    depth = i * L.gap + L.gap * smooth((s - from) / (to - from));
  } else if (d > L.plat) {
    const to = i === n - 1 ? L.end : landingAt(i + 1, L) - L.plat, from = landingAt(i, L) + L.plat;
    depth = at + L.gap * smooth((s - from) / (to - from));
  }
  return { depth, focus, stop: focus > 0 ? i : -1 };
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
  const shadeRef = useRef<HTMLDivElement>(null);
  const noteRef = useRef<HTMLDivElement>(null);
  const decorRefs = useRef<(HTMLDivElement | null)[]>([]);
  const bodyRef = useRef<SVGPathElement>(null);
  const headRef = useRef<SVGCircleElement>(null);
  const worldRef = useRef<HTMLDivElement>(null);
  const posRef = useRef(-1); // where the climber actually is, in scroll px — chases window.scrollY at a limited speed
  const wallRef = useRef<HTMLDivElement>(null);
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

  // scroll-snap on the page itself: a flick settles on the nearest landing instead of stopping between two
  useEffect(() => {
    const root = document.documentElement;
    root.style.scrollSnapType = "y proximity";
    return () => { root.style.scrollSnapType = ""; };
  }, []);

  useEffect(() => {
    let raf = 0, prev = performance.now();
    if (posRef.current < 0) posRef.current = window.scrollY;
    // per-frame values are written only when they change — most of the page is still while you scroll
    const cache = new Map<string, string>();
    const put = (el: HTMLElement | SVGElement | null | undefined, slot: string, key: string, v: string) => {
      if (!el || cache.get(slot) === v) return;
      cache.set(slot, v);
      el.style.setProperty(key, v);
    };
    const mod = (x: number, m: number) => ((x % m) + m) % m;
    const stops = stopRefs.current.map((el) => el && {
      el, cam: el.querySelector<HTMLElement>(".ds-cam"), reveal: Array.from(el.querySelectorAll<HTMLElement>(".ds-reveal")),
    });
    const decorY = DECOR.map((d) => (d.gap + 1 + d.at) * L.gap - 60);

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.05, (now - prev) / 1000);
      prev = now;
      const target = window.scrollY, diff = target - posRef.current;
      posRef.current += Math.abs(diff) < 0.5 ? diff : diff * (1 - Math.exp(-dt * FOLLOW));
      const s = posRef.current;
      const { depth, focus, stop } = timeline(s, L);
      const ladderX = lerp(L.vw / 2, L.ladderTo, focus);
      const lx = ladderX.toFixed(1);

      // ladder: a strip one rung taller than the screen, shifted by the rung phase — no repaint, just a move
      put(ladderRef.current, "ladder", "transform", `translate3d(${lx}px,${(mod(L.feetY + FOOT_LOW + 6 - RUNG_MID - depth, RUNG) - RUNG).toFixed(1)}px,0)`);
      put(climberRef.current, "climber", "transform", `translate3d(${lx}px,${L.feetY}px,0)`);
      const pose = stickPose(depth, focus, now / 1000);
      bodyRef.current?.setAttribute("d", pose.d);
      headRef.current?.setAttribute("cx", pose.head[0].toFixed(1));
      headRef.current?.setAttribute("cy", pose.head[1].toFixed(1));
      put(worldRef.current, "world", "transform", `translate3d(${lx}px,${(L.feetY - depth).toFixed(1)}px,0)`);
      // stone wall: an oversized tile layer moved within one tile; the lamp light is a gradient that only slides sideways
      put(wallRef.current, "wall", "transform", `translate3d(${mod((ladderX - L.vw / 2) * 0.6, 360).toFixed(1)}px,${mod(-depth * 0.85, 360).toFixed(1)}px,0)`);
      put(shadeRef.current, "shade", "transform", `translate3d(${(ladderX - L.vw / 2).toFixed(1)}px,0,0)`);
      if (depthRef.current) {
        const txt = `−${(depth * METERS_PER_PX).toFixed(1)} ${lang === "ru" ? "м" : "m"}`;
        if (cache.get("depth") !== txt) { cache.set("depth", txt); depthRef.current.textContent = txt; }
      }
      put(introRef.current, "intro", "opacity", (1 - smooth(s / (L.vh * 0.5))).toFixed(3));
      const k = smooth((s - landingAt(STOPS.length - 1, L) - L.plat - (L.end - landingAt(STOPS.length - 1, L) - L.plat) * 0.4) / ((L.end - landingAt(STOPS.length - 1, L) - L.plat) * 0.5));
      put(noteRef.current, "note", "opacity", k.toFixed(3));
      put(noteRef.current, "note-pe", "pointer-events", k > 0.5 ? "auto" : "none");

      decorY.forEach((wy, i) => {
        const y = L.feetY - depth + wy;
        put(decorRefs.current[i], `decor${i}`, "display", y > -400 && y < L.vh + 400 ? "block" : "none");
      });

      stops.forEach((st, i) => {
        if (!st) return;
        const y = L.feetY + (i + 1) * L.gap - depth;
        const vis = y > -L.vh * 0.2 && y < L.vh * 1.9;
        put(st.el, `s${i}`, "display", vis ? "block" : "none");
        if (!vis) return;
        const f = i === stop ? focus : 0;
        put(st.el, `s${i}t`, "transform", `translate3d(${lx}px,${y.toFixed(1)}px,0)`);
        put(st.cam, `s${i}c`, "scale", (L.zoomBase + f * L.zoomLanding).toFixed(4));
        const fo = f.toFixed(3), ft = `translate3d(0,${((1 - f) * 14).toFixed(1)}px,0)`;
        st.reveal.forEach((r, j) => { put(r, `s${i}r${j}o`, "opacity", fo); put(r, `s${i}r${j}t`, "transform", ft); });
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

  const jumpTo = (i: number) => window.scrollTo({ top: landingAt(i, L), behavior: "smooth" });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Enter" && activeRef.current >= 0) enter(STOPS[activeRef.current]); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const entGlow = entering ? BOTTLE_COLORS[entering]?.glow ?? "#fff" : "#fff";

  return (
    <div style={{ position: "relative", height: L.total, background: "#050408", color: INK }}>
      {STOPS.map((id, i) => <div key={id} className="ds-snap" style={{ top: landingAt(i, L) }} aria-hidden />)}
      <div className="ds-snap" style={{ top: L.end }} aria-hidden />
      <style>{`
        .ds-btn { color: ${DIM}; transition: color .2s; } .ds-btn:hover { color: ${INK}; }
        .ds-stop { position: absolute; left: 0; top: 0; will-change: transform; }
        .ds-reveal { opacity: 0; }
        .ds-snap { position: absolute; left: 0; width: 1px; height: 1px; scroll-snap-align: start; pointer-events: none; }
        .ds-cam.is-enter { transform: scale(16); filter: brightness(1.5); transition: transform 1.1s cubic-bezier(.7,0,.25,1), filter 1.1s; }
        .ds-leaf { position: absolute; inset: 0; width: 100%; height: 100%; transform-origin: 0 50%; transition: transform .9s cubic-bezier(.16,1,.3,1), filter .9s;
          filter: brightness(.82) drop-shadow(0 0 3px rgba(0,0,0,.6)); }
        .ds-cam:has(.ds-hit:hover) .ds-leaf, .ds-cam:has(.ds-hit:focus-visible) .ds-leaf, .ds-cam.is-enter .ds-leaf { transform: rotateY(-72deg); filter: brightness(.55); }
        .ds-bloom { position: absolute; width: 22%; aspect-ratio: 1; translate: -50% -50%; border-radius: 50%; pointer-events: none; opacity: .18; transition: opacity .9s; }
        .ds-cam:has(.ds-hit:hover) .ds-bloom, .ds-cam.is-enter .ds-bloom { opacity: .7; }
        .ds-hit { position: absolute; border-radius: 6px; cursor: pointer; outline: none; }
        .ds-portal { position: absolute; pointer-events: none; border-style: solid; border-width: 34px 28px 0; border-image: url(${ART}/frame.webp) 102 88 0 89 / 34px 28px 0 round stretch; filter: brightness(.8); }
        .ds-hit:focus-visible { box-shadow: 0 0 0 2px ${INK}; }
        .ds-dot { width: 7px; height: 7px; border-radius: 50%; border: 1px solid ${DIM}; transition: all .3s; }
        .ds-dot:hover { border-color: ${INK}; }
        .ds-flame { position: absolute; left: 1px; top: 4px; width: 18px; height: 30px; border-radius: 50% 50% 45% 45% / 62% 62% 38% 38%;
          background: radial-gradient(ellipse at 50% 75%, #fff6d8 0%, #ffc864 30%, #ff7a1e 62%, rgba(255,80,20,0) 72%);
          transform-origin: 50% 90%; animation: ds-flick 1.3s ease-in-out infinite alternate; }
        @keyframes ds-flick { 0% { transform: scale(1, 1) skewX(0); } 30% { transform: scale(.92, 1.08) skewX(-3deg); } 60% { transform: scale(1.05, .94) skewX(2deg); } 100% { transform: scale(.96, 1.04) skewX(-1deg); } }
        .ds-torch-glow { position: absolute; left: -330px; top: -320px; width: 680px; height: 680px; border-radius: 50%; pointer-events: none;
          background: radial-gradient(circle, rgba(255,160,70,.2), rgba(255,120,40,.07) 30%, transparent 62%); }
        .ds-candle-glow { position: absolute; left: -80px; top: -60px; width: 228px; height: 228px; border-radius: 50%; pointer-events: none;
          background: radial-gradient(circle, rgba(255,200,120,.16), transparent 60%); }
        .ds-hint { animation: ds-bob 2.4s ease-in-out infinite; } @keyframes ds-bob { 50% { transform: translateY(6px); opacity: .5; } }
        @media (max-width: 720px) { .ds-rail { display: none !important; } .ds-cap { font-size: 1.5rem !important; } .ds-hit { left: 0 !important; top: 0 !important; width: 100% !important; height: 100% !important; } }
      `}</style>

      <div style={{ position: "fixed", inset: 0, overflow: "hidden" }}>
        {/* shaft wall — stone blocks drifting with depth; one tile of slack on each side, moved by transform only */}
        <div ref={wallRef} style={{ position: "absolute", left: -360, top: -360, width: L.vw + 720, height: L.vh + 720, opacity: 0.8, willChange: "transform", backgroundImage: `url(${ART}/wall.webp)`, backgroundSize: "360px 360px" }} />
        {/* the climber's lamp: warm light + darkness around it, painted once and slid sideways with the ladder */}
        <div ref={shadeRef} style={{
          position: "absolute", left: 0, top: 0, height: L.vh, width: L.vw / 2 + L.vw - L.ladderTo + 2, willChange: "transform", pointerEvents: "none",
          background: `radial-gradient(circle at ${L.vw / 2}px ${L.feetY - 70}px, rgba(255,236,200,.13) 0, rgba(255,236,200,.04) 257px, transparent 478px),
            radial-gradient(circle at ${L.vw / 2}px ${L.feetY - 70}px, rgba(5,4,8,0) 0, rgba(5,4,8,.41) 200px, rgba(5,4,8,.65) 420px)`,
        }} />

        {/* torches, niches and carvings on the shaft wall — one layer that moves with the ladder */}
        <div ref={worldRef} style={{ position: "absolute", left: 0, top: 0, width: 0, height: 0, willChange: "transform" }} aria-hidden>
          {DECOR.map((d, i) => (
            <div key={i} ref={(el) => { decorRefs.current[i] = el; }} style={{ position: "absolute", left: -d.x, top: (d.gap + 1 + d.at) * L.gap - 60, display: "none" }}>
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
          position: "absolute", top: 0, height: L.vh + 2 * RUNG, left: -LADDER_W / 2, width: LADDER_W, willChange: "transform",
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
        <BottomNote noteRef={noteRef} t={t} onTop={() => window.scrollTo({ top: 0, behavior: "smooth" })} onNebula={() => navigate("/nebula")} />

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

function BottomNote({ noteRef, t, onTop, onNebula }: { noteRef: RefObject<HTMLDivElement | null>; t: (ru: string, en: string) => string; onTop: () => void; onNebula: () => void }) {
  // opacity and pointer-events are driven by the main frame loop
  return (
    <div ref={noteRef} style={{ position: "absolute", left: 0, right: 0, top: "24vh", textAlign: "center", opacity: 0, pointerEvents: "none", padding: "0 16px" }}>
      <p style={{ ...serif, fontStyle: "italic", fontWeight: 300, fontSize: "clamp(1.6rem, 3.4vw, 2.6rem)" }}>{t("Дальше — только тишина", "Below this, only silence")}</p>
      <div style={{ ...mono, fontSize: 12, letterSpacing: ".2em", textTransform: "uppercase", marginTop: 20, display: "flex", gap: 28, justifyContent: "center" }}>
        <button className="ds-btn" onClick={onTop}>↑ {t("наверх", "back up")}</button>
        <button className="ds-btn" onClick={onNebula}>{t("туманность", "nebula")} →</button>
      </div>
    </div>
  );
}
