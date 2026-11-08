// Santa Caecilia — a walk through an enclosed garden of white flowers (hortus conclusus).
// A screen packed with gardenias bursts apart to open the page; the garden gate with layered parallax;
// a plain-words intro; the drydown as a pinned sideways walk from morning lilies to the evening oak;
// Cecilia herself at a portative organ — her hands move on the keys, now and then she lifts her face
// and sings, golden notes rise from the pipes and turn into petals; the notes as a flower bed;
// strength as lily stems; memories on stone plaques; and a lily dropped into the fountain to send a request.

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useLocation } from "wouter";
import { useLang } from "@/contexts/LangContext";
import Bottle3D from "@/components/Bottle3D";
import RequestDialog, { type DialogSkin } from "@/components/RequestDialog";
import { useReveal } from "@/lib/useReveal";
import { fragmentText, pick, prefersReducedMotion, type WorldProps } from "./shared";

const C = { ivory: "#f5efe2", paper: "#faf6ec", ink: "#2a2420", dim: "rgba(42,36,32,.64)", faint: "rgba(42,36,32,.16)", gold: "#b8923a", goldL: "#e2c77e", sage: "#7d8c5c", sageL: "#a9b58b", moss: "#55633d", red: "#8a2128" };
const title: CSSProperties = { fontFamily: "'Forum', 'Cormorant SC', serif", fontWeight: 400 };
const body: CSSProperties = { fontFamily: "'EB Garamond', 'Cormorant Garamond', serif" };
const mono: CSSProperties = { fontFamily: "'JetBrains Mono', monospace" };
const GILT = "linear-gradient(135deg, #8a6a24 0%, #e9d08a 18%, #b8923a 35%, #f6e6b0 50%, #a8822e 66%, #e2c77e 82%, #7a5c1e 100%)";
const IMG = "/images/santa-caecilia";
const PETALS = Array.from({ length: 8 }, (_, i) => `${IMG}/petal-${i + 1}.webp`);

const bottleLabel = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
  ctx.fillStyle = "#faf6ec"; ctx.fillRect(0, 0, w, h);
  const g = ctx.createLinearGradient(0, 0, w, h); g.addColorStop(0, "#8a6a24"); g.addColorStop(0.5, "#f0d995"); g.addColorStop(1, "#8a6a24");
  ctx.strokeStyle = g; ctx.lineWidth = 6; ctx.strokeRect(24, 24, w - 48, h - 48); ctx.lineWidth = 2; ctx.strokeRect(40, 40, w - 80, h - 80);
  ctx.save(); ctx.translate(w / 2, h * 0.27); ctx.fillStyle = g;
  for (const a of [-0.9, -0.3, 0.3, 0.9]) { ctx.save(); ctx.rotate(a); ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(22, -30, 12, -70, 0, -88); ctx.bezierCurveTo(-12, -70, -22, -30, 0, 0); ctx.fill(); ctx.restore(); }
  ctx.restore();
  ctx.fillStyle = "#2a2420"; ctx.textAlign = "center";
  ctx.font = "110px 'Forum', serif"; ctx.fillText("SANTA", w / 2, h * 0.6);
  ctx.fillText("CAECILIA", w / 2, h * 0.78);
  ctx.font = "26px 'JetBrains Mono', monospace"; ctx.fillStyle = "#8a6a24"; ctx.fillText("SILENTIUM · ROMA", w / 2, h * 0.9);
};
const bottleLook = { liquid: "#e6cf8f", liquidOpacity: 0.94, glass: "#fffdf6", cap: "#f2efe8", capRoughness: 0.55, collar: "#c9a54a" };

function useInView<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.05 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, inView };
}

// ── Intro: the screen is packed with identical gardenias that burst apart from the centre ──
function FlowerBurst({ onDone }: { onDone: () => void }) {
  const [go, setGo] = useState(false);
  const flowers = useMemo(() => {
    const W = window.innerWidth, H = window.innerHeight;
    // the image has a baked-in shadow and 8% padding, so the flower itself is ~84% of size
    const size = Math.max(150, Math.min(W, H) / 3.1);
    const step = size * 0.52;
    const cx = W / 2, cy = H / 2, far = Math.hypot(cx, cy);
    const out: { x: number; y: number; r: number; tx: number; ty: number; tr: number; d: number }[] = [];
    for (let y = -size / 2, row = 0; y < H + size / 2; y += step, row++) {
      for (let x = -size / 2 + (row % 2 ? step / 2 : 0); x < W + size / 2; x += step) {
        const dx = x - cx, dy = y - cy, dist = Math.hypot(dx, dy) || 1;
        const a = dist < 2 ? Math.random() * Math.PI * 2 : Math.atan2(dy, dx) + (Math.random() - 0.5) * 0.5;
        const push = far * (1.05 + Math.random() * 0.5);
        out.push({ x, y, r: Math.random() * 360, tx: Math.cos(a) * push, ty: Math.sin(a) * push, tr: (Math.random() - 0.5) * 300, d: (dist / far) * 520 + Math.random() * 120 });
      }
    }
    return { size, list: out };
  }, []);
  useEffect(() => {
    let seen = false;
    try { seen = sessionStorage.getItem("sc-intro") === "1"; sessionStorage.setItem("sc-intro", "1"); } catch { /* storage blocked */ }
    const html = document.documentElement; const prev = html.style.overflow; html.style.overflow = "hidden";
    const t1 = window.setTimeout(() => setGo(true), seen ? 250 : 1300);
    return () => { clearTimeout(t1); html.style.overflow = prev; };
  }, []);
  useEffect(() => {
    if (!go) return;
    document.documentElement.style.overflow = "";
    const t = window.setTimeout(onDone, 2400);
    return () => clearTimeout(t);
  }, [go, onDone]);
  return (
    <div aria-hidden onClick={() => setGo(true)} style={{ position: "fixed", inset: 0, zIndex: 200, overflow: "hidden", background: go ? "transparent" : C.ivory, transition: "background .9s ease .15s", pointerEvents: go ? "none" : "auto", cursor: "pointer" }}>
      {flowers.list.map((f, i) => (
        <img key={i} src={`${IMG}/intro-flower.webp`} alt="" draggable={false}
          style={{ position: "absolute", left: f.x - flowers.size / 2, top: f.y - flowers.size / 2, width: flowers.size, height: flowers.size, transform: go ? `translate(${f.tx}px, ${f.ty}px) rotate(${f.r + f.tr}deg) scale(1.5)` : `rotate(${f.r}deg)`, opacity: go ? 0 : 1, transition: `transform 1.7s cubic-bezier(.55,.05,.35,1) ${f.d}ms, opacity 1.1s ease ${f.d + 600}ms`, willChange: "transform" }} />
      ))}
      <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)", padding: "22px 40px", background: "rgba(250,246,236,.92)", borderRadius: 999, boxShadow: "0 20px 60px rgba(90,70,40,.2)", textAlign: "center", opacity: go ? 0 : 1, transition: "opacity .4s", whiteSpace: "nowrap" }}>
        <p style={{ ...body, fontStyle: "italic", fontSize: 16, color: C.gold }}>Hortus conclusus</p>
        <p style={{ ...title, fontSize: "clamp(1.6rem, 4vw, 2.4rem)", letterSpacing: ".06em", color: C.ink }}>Santa Caecilia</p>
      </div>
    </div>
  );
}

// Petals drifting down over the whole garden
function Petals() {
  const petals = useMemo(() => Array.from({ length: 12 }, (_, i) => ({ x: (i * 37 + 5) % 100, d: 16 + (i % 5) * 4, delay: -i * 2.7, s: 18 + (i % 4) * 7, r: (i * 53) % 360, src: PETALS[i % PETALS.length] })), []);
  if (prefersReducedMotion()) return null;
  return (
    <div aria-hidden style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 40, overflow: "hidden" }}>
      {petals.map((p, i) => <img key={i} className="sc-petal" src={p.src} alt="" style={{ left: `${p.x}%`, width: p.s, animationDuration: `${p.d}s`, animationDelay: `${p.delay}s`, ["--r" as string]: `${p.r}deg` }} />)}
    </div>
  );
}

function Reveal({ children, delay = 0, style }: { children: React.ReactNode; delay?: number; style?: CSSProperties }) {
  const { ref, visible } = useReveal();
  return <div ref={ref} style={{ ...style, opacity: visible ? 1 : 0, transform: visible ? "none" : "translateY(24px)", transition: `opacity 1.4s ease ${delay}ms, transform 1.4s cubic-bezier(.16,1,.3,1) ${delay}ms` }}>{children}</div>;
}

function Head({ kicker, title: heading, light }: { kicker: string; title: string; light?: boolean }) {
  return (
    <div style={{ textAlign: "center", marginBottom: 46 }}>
      <p style={{ ...body, fontStyle: "italic", fontSize: 20, color: light ? C.goldL : C.gold }}>{kicker}</p>
      <h2 style={{ ...title, fontSize: "clamp(2.3rem, 5.4vw, 4.2rem)", lineHeight: 1.02, letterSpacing: ".02em", marginTop: 6 }}>{heading}</h2>
    </div>
  );
}

// ── The walk: a pinned sideways stroll through three times of day ──
const WALK = [`${IMG}/walk-morning.webp`, `${IMG}/walk-noon.webp`, `${IMG}/walk-evening.webp`];
const ease = (t: number) => (t < 0.22 ? 0 : t > 0.78 ? 1 : (1 - Math.cos(((t - 0.22) / 0.56) * Math.PI)) / 2);

function Walk({ stages, t }: { stages: { when: string; text: string; notes: string }[]; t: (ru: string, en: string) => string }) {
  const wrap = useRef<HTMLElement>(null);
  const [p, setP] = useState(0);
  const still = prefersReducedMotion();
  useEffect(() => {
    if (still) return;
    let raf = 0;
    const update = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const el = wrap.current; if (!el) return;
        const r = el.getBoundingClientRect();
        setP(Math.min(1, Math.max(0, -r.top / (r.height - window.innerHeight))));
      });
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("scroll", update); window.removeEventListener("resize", update); };
  }, [still]);
  const raw = p * 2.25;
  const seg = Math.min(2, Math.floor(raw));
  const x = Math.min(2, seg + ease(raw - seg));
  const active = Math.round(x);
  if (still) {
    return (
      <section style={{ display: "grid", gap: 2 }}>
        {stages.map((s, i) => (
          <div key={i} style={{ position: "relative", minHeight: "80svh", display: "flex", alignItems: "flex-end" }}>
            <img src={WALK[i]} alt="" loading="lazy" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
            <WalkCard s={s} />
          </div>
        ))}
      </section>
    );
  }
  return (
    <section ref={wrap} style={{ position: "relative", height: "340svh", background: "#2b2a1f" }}>
      <div style={{ position: "sticky", top: 0, height: "100svh", overflow: "hidden" }}>
        <div style={{ display: "flex", width: "300vw", height: "100%", transform: `translate3d(${-x * 100}vw,0,0)`, willChange: "transform" }}>
          {stages.map((s, i) => (
            <div key={i} style={{ position: "relative", width: "100vw", height: "100%", overflow: "hidden", display: "flex", alignItems: "flex-end" }}>
              <img src={WALK[i]} alt="" loading="lazy" style={{ position: "absolute", top: 0, left: "-8%", width: "116%", maxWidth: "none", height: "100%", objectFit: "cover", transform: `translate3d(${Math.max(-1, Math.min(1, x - i)) * 6.5}%,0,0)` }} />
              <div aria-hidden style={{ position: "absolute", inset: 0, background: "linear-gradient(0deg, rgba(30,28,20,.55), transparent 45%), linear-gradient(180deg, rgba(30,28,20,.35), transparent 30%)" }} />
              <WalkCard s={s} faded={active !== i} />
            </div>
          ))}
        </div>
        <div style={{ position: "absolute", top: "clamp(64px, 10vh, 96px)", left: 0, right: 0, textAlign: "center", color: "#fbf7ec", pointerEvents: "none" }}>
          <p style={{ ...body, fontStyle: "italic", fontSize: 19, color: C.goldL }}>{t("Как раскрывается на коже", "How it unfolds on skin")}</p>
          <h2 style={{ ...title, fontSize: "clamp(2rem, 4.6vw, 3.6rem)", lineHeight: 1.05, textShadow: "0 2px 30px rgba(0,0,0,.45)" }}>{t("Прогулка по саду", "A walk through the garden")}</h2>
        </div>
        {/* the path: three stops */}
        <div aria-hidden style={{ position: "absolute", left: "50%", bottom: 22, transform: "translateX(-50%)", width: "min(360px, 70vw)", height: 20 }}>
          <div style={{ position: "absolute", left: 0, right: 0, top: 9, height: 2, background: "rgba(251,247,236,.3)" }} />
          <div style={{ position: "absolute", left: 0, top: 9, height: 2, width: `${(x / 2) * 100}%`, background: C.goldL }} />
          {[0, 1, 2].map((i) => <span key={i} style={{ position: "absolute", left: `${i * 50}%`, top: 2, width: 16, height: 16, marginLeft: -8, borderRadius: "50%", background: x >= i - 0.02 ? C.goldL : "rgba(251,247,236,.35)", border: "2px solid #fbf7ec", transition: "background .4s" }} />)}
        </div>
      </div>
    </section>
  );
}

function WalkCard({ s, faded }: { s: { when: string; text: string; notes: string }; faded?: boolean }) {
  return (
    <div style={{ position: "relative", margin: "0 clamp(16px, 6vw, 90px) clamp(70px, 12vh, 120px)", maxWidth: 520, padding: "24px 26px", background: "rgba(250,246,236,.9)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)", borderRadius: "120px 120px 10px 10px / 60px 60px 10px 10px", boxShadow: "0 30px 70px rgba(0,0,0,.3)", opacity: faded ? 0 : 1, transform: faded ? "translateY(20px)" : "none", transition: "opacity .7s ease, transform .9s cubic-bezier(.16,1,.3,1)", textAlign: "center" }}>
      <p style={{ ...title, fontSize: 15, letterSpacing: ".22em", color: C.gold, textTransform: "uppercase", marginTop: 8 }}>{s.when}</p>
      <p style={{ ...body, fontSize: "clamp(1.2rem, 1.9vw, 1.45rem)", lineHeight: 1.4, color: C.ink, marginTop: 10 }}>{s.text}</p>
      {s.notes && <p style={{ ...body, fontStyle: "italic", fontSize: 15, color: C.dim, marginTop: 10 }}>{s.notes}</p>}
    </div>
  );
}

// ── Cecilia at the organ ──
// Patches (in % of the base figure) that are swapped over the base: a second hand position and a singing face.
const HANDS = { left: 40.625, top: 35.612, width: 39.453, height: 15.625 };
const SING = { left: 19.434, top: 1.432, width: 48.34, height: 27.865 };
const RHYTHM = [420, 300, 300, 600, 340, 260, 520, 380, 300, 700];
const NOTES = Array.from({ length: 9 }, (_, i) => ({ dx: 40 + ((i * 47) % 150), rot: ((i * 71) % 120) - 60, delay: -i * 0.85, petal: PETALS[i % PETALS.length], kind: i % 3 }));

function NoteGlyph({ kind }: { kind: number }) {
  return (
    <svg viewBox="0 0 30 40" width="26" height="34" aria-hidden>
      <defs><linearGradient id={`scg${kind}`} x1="0" x2="1" y1="0" y2="1"><stop offset="0" stopColor="#f6e6b0" /><stop offset=".5" stopColor="#b8923a" /><stop offset="1" stopColor="#e2c77e" /></linearGradient></defs>
      <g fill={`url(#scg${kind})`}>
        {kind === 2 ? (<><ellipse cx="7" cy="33" rx="6" ry="4.5" transform="rotate(-20 7 33)" /><ellipse cx="23" cy="29" rx="6" ry="4.5" transform="rotate(-20 23 29)" /><rect x="11.5" y="5" width="2" height="28" /><rect x="27.5" y="1" width="2" height="28" /><path d="M11.5 5 L29.5 1 L29.5 6 L11.5 10 Z" /></>)
          : (<><ellipse cx="10" cy="32" rx="7" ry="5" transform="rotate(-20 10 32)" /><rect x="15.5" y="3" width="2.2" height="29" />{kind === 1 && <path d="M17.7 3 C 26 8, 28 14, 23 22 C 25 15, 22 11, 17.7 10 Z" />}</>)}
      </g>
    </svg>
  );
}

function Cecilia({ t }: { t: (ru: string, en: string) => string }) {
  const { ref, inView } = useInView<HTMLDivElement>();
  const [hands, setHands] = useState(false);
  const [sing, setSing] = useState(false);
  const [fast, setFast] = useState(false);
  const fastRef = useRef(false);
  fastRef.current = fast;
  const fastTimer = useRef<number | undefined>(undefined);
  const still = prefersReducedMotion();
  useEffect(() => {
    if (!inView || still) return;
    let i = 0, timer = 0;
    const tick = () => { setHands((h) => !h); timer = window.setTimeout(tick, RHYTHM[i++ % RHYTHM.length] / (fastRef.current ? 2.2 : 1)); };
    timer = window.setTimeout(tick, 400);
    let s1 = 0, s2 = 0;
    const loop = () => { setSing(true); s2 = window.setTimeout(() => setSing(false), 2800); s1 = window.setTimeout(loop, 8000); };
    s1 = window.setTimeout(loop, 3200);
    return () => { clearTimeout(timer); clearTimeout(s1); clearTimeout(s2); };
  }, [inView, still]);
  useEffect(() => () => clearTimeout(fastTimer.current), []);
  const play = () => { setFast(true); clearTimeout(fastTimer.current); fastTimer.current = window.setTimeout(() => setFast(false), 2600); };
  const patch = (b: typeof HANDS): CSSProperties => ({ position: "absolute", left: `${b.left}%`, top: `${b.top}%`, width: `${b.width}%`, height: `${b.height}%`, pointerEvents: "none" });
  return (
    <section style={{ position: "relative", overflow: "hidden", padding: "110px clamp(16px,4vw,48px) 90px", background: `radial-gradient(ellipse at 70% 40%, #fffdf6, ${C.ivory} 55%, #e9e0cb)` }}>
      <img src={`${IMG}/walk-noon.webp`} alt="" aria-hidden loading="lazy" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.22, filter: "blur(10px) saturate(.8)" }} />
      <div className="sc-two" style={{ position: "relative", maxWidth: 1180, margin: "0 auto", display: "grid", gridTemplateColumns: ".95fr 1.05fr", gap: "40px 60px", alignItems: "center" }}>
        <Reveal>
          <p style={{ ...body, fontStyle: "italic", fontSize: 20, color: C.gold }}>{t("Хозяйка сада", "The lady of the garden")}</p>
          <h2 style={{ ...title, fontSize: "clamp(2.6rem, 6vw, 4.8rem)", lineHeight: 0.98, margin: "8px 0 22px" }}>{t("Святая Цецилия", "Saint Cecilia")}</h2>
          <p style={{ ...title, fontSize: "clamp(1.05rem, 1.7vw, 1.3rem)", letterSpacing: ".08em", lineHeight: 1.5, color: C.moss }}>CANTANTIBUS ORGANIS<br />CAECILIA IN CORDE SUO<br />SOLI DOMINO DECANTABAT</p>
          <div style={{ width: 110, height: 2, background: GILT, margin: "20px 0" }} />
          <p style={{ ...body, fontSize: "clamp(1.15rem, 1.7vw, 1.35rem)", lineHeight: 1.55, color: C.ink }}>{t("Римлянка III века. В день её свадьбы играли органы, а она пела в сердце своём только Богу. Поэтому её называют покровительницей музыки.", "A Roman girl of the third century. On her wedding day the organs played, while she sang in her heart to God alone. That is why she is the patron saint of music.")}</p>
          <p style={{ ...body, fontSize: "clamp(1.15rem, 1.7vw, 1.35rem)", lineHeight: 1.55, color: C.dim, marginTop: 14 }}>{t("По преданию, ангел увенчал её венком из белых роз и лилий. Из этих цветов и сделан аромат.", "Legend says an angel crowned her with a wreath of white roses and lilies. Those are the flowers this fragrance is made of.")}</p>
          <p style={{ ...body, fontStyle: "italic", fontSize: 16, color: C.gold, marginTop: 22 }}>{t("Проведите рукой по клавишам — она заиграет быстрее.", "Run your hand over the keys — she'll play faster.")}</p>
        </Reveal>
        <div ref={ref} style={{ position: "relative", width: "min(520px, 100%)", margin: "0 auto" }}>
          <div aria-hidden style={{ position: "absolute", inset: "4% -6% 0", borderRadius: "50% 50% 8px 8px / 36% 36% 8px 8px", background: "radial-gradient(ellipse at 50% 35%, rgba(255,250,232,.95), rgba(255,250,232,.4) 55%, transparent 72%)" }} />
          <div className={still ? undefined : "sc-breathe"} style={{ position: "relative", aspectRatio: "2 / 3" }}>
            <img src={`${IMG}/cecilia.webp`} alt={t("Святая Цецилия играет на портативном органе", "Saint Cecilia playing a portative organ")} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", filter: "drop-shadow(0 30px 40px rgba(90,70,40,.25))" }} />
            <img src={`${IMG}/cecilia-hands.webp`} alt="" aria-hidden style={{ ...patch(HANDS), opacity: hands ? 1 : 0, transition: `opacity ${fast ? 60 : 110}ms linear` }} />
            <img src={`${IMG}/cecilia-sing.webp`} alt="" aria-hidden style={{ ...patch(SING), opacity: sing ? 1 : 0, transition: "opacity .7s ease" }} />
            {/* notes rising from the pipes, turning into petals */}
            {!still && inView && NOTES.map((n, i) => (
              <span key={i} className={`sc-note${fast ? " sc-note-fast" : ""}`} style={{ ["--dx" as string]: `${n.dx}px`, ["--rot" as string]: `${n.rot}deg`, animationDelay: `${n.delay}s` }}>
                <span className="sc-note-g"><NoteGlyph kind={n.kind} /></span>
                <img className="sc-note-p" src={n.petal} alt="" />
              </span>
            ))}
            {/* the keyboard and pipes: hover or tap to play faster */}
            <button aria-label={t("Сыграть на органе", "Play the organ")} onPointerEnter={play} onPointerMove={play} onClick={play} style={{ position: "absolute", left: "48%", top: "14%", width: "46%", height: "40%", background: "transparent", cursor: "pointer", borderRadius: 20 }} />
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Notes as a flower bed, with the bottle growing among them ──
type Bed = { file: string; label: [string, string]; tier: [string, string]; w: number };
const BED: Bed[] = [
  { file: "ing-patchouli", label: ["Пачули", "Patchouli"], tier: ["база", "base"], w: 14.5 },
  { file: "ing-jasmine", label: ["Жасмин", "Jasmine"], tier: ["сердце", "heart"], w: 13 },
  { file: "ing-lily", label: ["Лилия", "Lily"], tier: ["сердце", "heart"], w: 13 },
  { file: "bottle", label: ["", ""], tier: ["", ""], w: 14 },
  { file: "ing-gardenia", label: ["Гардения", "Gardenia"], tier: ["сердце", "heart"], w: 15.5 },
  { file: "ing-frangipani", label: ["Франжипани", "Frangipani"], tier: ["сердце", "heart"], w: 15.5 },
  { file: "ing-oakmoss", label: ["Дубовый мох", "Oakmoss"], tier: ["база", "base"], w: 14.5 },
];

function FlowerBed({ lang }: { lang: "ru" | "en" }) {
  const { ref, visible } = useReveal();
  const L = (p: [string, string]) => (lang === "ru" ? p[0] : p[1]);
  return (
    <div ref={ref} style={{ maxWidth: 1360, margin: "0 auto" }}>
      <div className="sc-bed" style={{ display: "flex", alignItems: "flex-end", justifyContent: "center", padding: "0 1%" }}>
        {BED.map((b, i) => (
          <div key={b.file} className={b.file === "bottle" ? "sc-bed-bottle" : "sc-bed-item"} style={{ width: `${b.w}%`, display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ width: "100%", transformOrigin: "50% 100%", transform: visible ? "none" : "scaleY(0) scaleX(.6)", opacity: visible ? 1 : 0, transition: `transform 1.6s cubic-bezier(.2,1.2,.4,1) ${i * 140}ms, opacity .6s ease ${i * 140}ms` }}>
              {b.file === "bottle" ? (
                <div style={{ position: "relative", width: "120%", marginLeft: "-10%", aspectRatio: "0.5", marginBottom: "-42%" }}>
                  <Bottle3D style={{ position: "absolute", inset: 0 }} lighting="daylight" {...bottleLook} spin={0.22} drawLabel={bottleLabel} />
                </div>
              ) : (
                <img className="sc-sway" src={`${IMG}/${b.file}.webp`} alt={L(b.label)} loading="lazy" style={{ display: "block", width: "100%", animationDelay: `${i * -1.1}s`, filter: "drop-shadow(0 12px 14px rgba(70,80,40,.18))" }} />
              )}
            </div>
            {b.label[0] && <p className="sc-mlabel" style={{ ...body, fontSize: 16, color: C.ink, textAlign: "center", lineHeight: 1.1, marginTop: 6 }}>{L(b.label)}<br /><span style={{ fontStyle: "italic", fontSize: 13, color: C.gold }}>{L(b.tier)}</span></p>}
          </div>
        ))}
      </div>
      {/* the soil and the plant tags */}
      <div aria-hidden style={{ height: 20, borderRadius: "50% 50% 8px 8px / 100% 100% 8px 8px", background: "linear-gradient(#a9b58b, #7d8c5c 60%, #5f6b45)", boxShadow: "0 18px 30px rgba(70,80,40,.2)" }} />
      <div className="sc-bed sc-tags" style={{ display: "flex", justifyContent: "center", padding: "0 1%" }}>
        {BED.map((b) => (
          <div key={b.file} className={b.file === "bottle" ? "sc-bed-bottle sc-tag-empty" : "sc-bed-item"} style={{ width: `${b.w}%`, display: "flex", justifyContent: "center" }}>
            {b.label[0] && (
              <div style={{ marginTop: -4, padding: "10px 8px 8px", minWidth: "84%", textAlign: "center", background: "#f7f1e2", border: "1px solid rgba(120,100,60,.25)", borderRadius: "4px 4px 40% 40% / 4px 4px 14px 14px", boxShadow: "0 6px 14px rgba(90,70,40,.12)" }}>
                <p style={{ ...body, fontSize: "clamp(15px, 1.6vw, 19px)", color: C.ink, lineHeight: 1.1 }}>{L(b.label)}</p>
                <p style={{ ...body, fontStyle: "italic", fontSize: 13, color: C.gold }}>{L(b.tier)}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Strength as white lilies rising out of the soil ──
function Stems({ facets, lang }: { facets: { label: { ru: string; en: string }; value: number }[]; lang: "ru" | "en" }) {
  const { ref, visible } = useReveal();
  return (
    <div ref={ref}>
      <div style={{ display: "flex", justifyContent: "center", alignItems: "flex-end", gap: "clamp(6px, 3vw, 46px)", height: 380, borderBottom: "16px solid transparent", borderImage: "linear-gradient(#a9b58b, #6f7d4f) 1" }}>
        {facets.map((f, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "clamp(48px, 12vw, 120px)" }}>
            <span style={{ ...title, fontSize: 20, color: C.gold, opacity: visible ? 1 : 0, transition: `opacity 1s ${900 + i * 120}ms`, marginBottom: 4 }}>{f.value}</span>
            <div style={{ width: "min(100%, 80px)", height: visible ? 30 + f.value * 3.1 : 0, overflow: "hidden", transition: `height 2s cubic-bezier(.16,1,.3,1) ${i * 130}ms` }}>
              <img src={`${IMG}/stem.webp`} alt="" loading="lazy" style={{ display: "block", width: "100%" }} />
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "center", gap: "clamp(6px, 3vw, 46px)", marginTop: 14 }}>
        {facets.map((f, i) => <span key={i} style={{ width: "clamp(48px, 12vw, 120px)", textAlign: "center", ...body, fontSize: "clamp(12px, 1.4vw, 16px)", lineHeight: 1.2, color: C.dim, hyphens: "auto" }} lang={lang}>{pick(lang, f.label)}</span>)}
      </div>
    </div>
  );
}

export default function CaeciliaWorld({ perfume }: WorldProps) {
  const [, navigate] = useLocation();
  const { lang, setLang, t } = useLang();
  const [intro, setIntro] = useState(() => typeof window !== "undefined" && !prefersReducedMotion());
  const [open, setOpen] = useState(false);
  const [drops, setDrops] = useState(0);
  const timer = useRef<number | undefined>(undefined);
  const hero = useRef<HTMLElement>(null);
  useEffect(() => () => clearTimeout(timer.current), []);
  const g = perfume.guide!;
  const n = perfume.scentNotes;
  const Lp = (v: { ru: string; en: string }) => pick(lang, v);
  const fragments = pick(lang, perfume.memoryFragments).map(fragmentText);
  const shownNotes = new Set(BED.map((b) => b.label[lang === "ru" ? 0 : 1].toLowerCase()));
  const otherNotes = (["top", "heart", "base"] as const).flatMap((k) => (n[k] ? pick(lang, n[k]!) : [])).filter((x) => !shownNotes.has(x.toLowerCase()));
  const endIntro = useMemo(() => () => setIntro(false), []);

  // hero parallax: the far garden drifts a little, the near flowers drift more
  useEffect(() => {
    const el = hero.current;
    if (!el || prefersReducedMotion()) return;
    let raf = 0;
    const set = (mx: number, my: number) => { el.style.setProperty("--mx", mx.toFixed(3)); el.style.setProperty("--my", my.toFixed(3)); };
    const move = (e: PointerEvent) => { if (e.pointerType !== "mouse") return; cancelAnimationFrame(raf); raf = requestAnimationFrame(() => set(e.clientX / window.innerWidth - 0.5, e.clientY / window.innerHeight - 0.5)); };
    const scroll = () => el.style.setProperty("--sy", String(Math.min(window.scrollY, window.innerHeight)));
    window.addEventListener("pointermove", move);
    window.addEventListener("scroll", scroll, { passive: true });
    return () => { cancelAnimationFrame(raf); window.removeEventListener("pointermove", move); window.removeEventListener("scroll", scroll); };
  }, []);

  const drop = () => {
    setDrops((d) => d + 1);
    clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setOpen(true), prefersReducedMotion() ? 0 : 1500);
  };

  const skin: DialogSkin = {
    overlay: "rgba(245,239,226,.86)",
    panel: { ...body, background: C.paper, color: C.ink, padding: "54px 30px 34px", borderRadius: "120px 120px 14px 14px / 60px 60px 14px 14px", border: `1px solid ${C.sageL}`, boxShadow: "0 40px 90px rgba(42,36,32,.25)" },
    title: { ...title, fontSize: 34, color: C.ink, letterSpacing: ".04em", textAlign: "center" },
    label: { ...body, fontStyle: "italic", fontSize: 15, color: C.moss },
    input: { ...body, fontSize: 19, background: "transparent", border: "none", borderBottom: `1px solid ${C.faint}`, padding: "6px 0", color: C.ink },
    button: { ...title, fontSize: 18, letterSpacing: ".12em", background: GILT, color: "#3a2a10", padding: "14px", borderRadius: 999 },
    accent: C.gold,
    heading: { ru: "Из белого сада", en: "From the white garden" },
    submit: { ru: "Отправить", en: "Send" },
    sent: { ru: "Ваша лилия принята.", en: "Your lily has been received." },
  };

  const facts: [string, string][] = [
    [t("Стойкость", "Longevity"), Lp(g.longevity)],
    [t("Шлейф", "Sillage"), Lp(g.sillage)],
    [t("Сезон", "Season"), Lp(g.season)],
    [t("Когда носить", "When to wear"), Lp(g.time)],
  ];
  const stages = g.drydown.map((d) => ({ when: Lp(d.when), text: Lp(d.text), notes: n[d.notes] ? pick(lang, n[d.notes]!).join(" · ") : "" }));

  return (
    <div style={{ ...body, background: C.ivory, color: C.ink, minHeight: "100vh", overflowX: "clip" }}>
      <style>{`
        .sc-petal { position: absolute; top: -60px; opacity: .9; animation: sc-fall linear infinite; filter: drop-shadow(0 3px 4px rgba(90,70,40,.18)); }
        @keyframes sc-fall {
          0% { transform: translate(0, -8vh) rotate(var(--r)); }
          25% { transform: translate(40px, 25vh) rotate(calc(var(--r) + 90deg)); }
          50% { transform: translate(-20px, 55vh) rotate(calc(var(--r) + 180deg)); }
          75% { transform: translate(35px, 82vh) rotate(calc(var(--r) + 260deg)); }
          100% { transform: translate(0, 112vh) rotate(calc(var(--r) + 340deg)); }
        }
        .sc-hero-far { transform: translate3d(0, calc(var(--sy, 0) * .25px), 0); }
        .sc-hero-bg { transform: translate3d(calc(var(--mx, 0) * -14px), calc(var(--my, 0) * -10px), 0) scale(1.07); transition: transform .9s cubic-bezier(.2,.8,.3,1); }
        .sc-hero-front { transform: translate3d(calc(var(--mx, 0) * -24px), calc(var(--my, 0) * -10px), 0) scale(1.06); transition: transform .9s cubic-bezier(.2,.8,.3,1); transform-origin: 50% 100%; }
        .sc-hero-title { transform: translate3d(0, calc(var(--sy, 0) * .35px), 0); }
        .sc-breathe { animation: sc-breathe 5.5s ease-in-out infinite; transform-origin: 50% 100%; }
        @keyframes sc-breathe { 50% { transform: scale(1.008, 1.012); } }
        .sc-note { position: absolute; left: 76%; top: 16%; pointer-events: none; animation: sc-rise 7.6s linear infinite; }
        .sc-note-fast { animation-duration: 3.8s; }
        .sc-note > * { position: absolute; left: 0; top: 0; }
        .sc-note-g { animation: inherit; animation-name: sc-note-g; }
        .sc-note-p { width: 22px; animation: inherit; animation-name: sc-note-p; }
        @keyframes sc-rise { 0% { transform: translate(0, 0) rotate(0); opacity: 0; } 8% { opacity: 1; } 85% { opacity: 1; } 100% { transform: translate(var(--dx), -360px) rotate(var(--rot)); opacity: 0; } }
        @keyframes sc-note-g { 0%, 40% { opacity: 1; transform: scale(1); } 58%, 100% { opacity: 0; transform: scale(.4); } }
        @keyframes sc-note-p { 0%, 40% { opacity: 0; transform: scale(.4); } 58%, 100% { opacity: 1; transform: scale(1); } }
        .sc-sway { transform-origin: 50% 100%; animation: sc-sway 6s ease-in-out infinite; }
        .sc-sway:hover { animation-duration: 1.4s; }
        @keyframes sc-sway { 0%, 100% { transform: rotate(-1.4deg); } 50% { transform: rotate(1.4deg); } }
        .sc-marble { background:
          radial-gradient(ellipse at 20% 30%, rgba(160,150,140,.18), transparent 40%),
          radial-gradient(ellipse at 70% 60%, rgba(150,140,130,.14), transparent 45%),
          linear-gradient(115deg, transparent 40%, rgba(140,130,120,.16) 41%, transparent 43%),
          linear-gradient(160deg, transparent 60%, rgba(140,130,120,.12) 61%, transparent 62%),
          linear-gradient(#f7f4ee, #e3ddd0); }
        .sc-engraved { color: #6d655a; text-shadow: 0 1px 0 rgba(255,255,255,.85), 0 -1px 0 rgba(0,0,0,.12); }
        .sc-lily-drop { animation: sc-drop 1.1s cubic-bezier(.45,0,.4,1) both, sc-bob 4s ease-in-out 1.1s infinite; }
        @keyframes sc-drop { from { transform: translate(-50%, -340%) rotate(-50deg) scale(1.3); opacity: 0; } 20% { opacity: 1; } to { transform: translate(-50%, -50%) rotate(-8deg) scale(1); } }
        @keyframes sc-bob { 50% { transform: translate(-50%, -54%) rotate(-4deg) scale(1); } }
        .sc-ripple { position: absolute; left: 50%; top: 50%; width: 70%; height: 70%; border-radius: 50%; border: 2px solid rgba(255,255,255,.8); transform: translate(-50%,-50%) scale(0); opacity: 0; animation: sc-ripple 2.2s ease-out both; }
        @keyframes sc-ripple { 0% { transform: translate(-50%,-50%) scale(.05); opacity: .9; } 100% { transform: translate(-50%,-50%) scale(1.5); opacity: 0; } }
        .sc-fountain:hover .sc-hint { opacity: 1; transform: none; }
        .sc-mlabel { display: none; }
        @media (max-width: 820px) { .sc-mlabel { display: block; } }
        .sc-scroll { animation: sc-scroll 2.4s ease-in-out infinite; } @keyframes sc-scroll { 50% { transform: translateY(8px); opacity: .5; } }
        @media (prefers-reduced-motion: reduce) { .sc-sway, .sc-breathe, .sc-scroll, .sc-lily-drop { animation: none; } .sc-hero-far, .sc-hero-bg, .sc-hero-front, .sc-hero-title { transform: none; } }
        @media (max-width: 820px) {
          .sc-two { grid-template-columns: 1fr !important; }
          .sc-bed { flex-wrap: wrap; }
          .sc-bed .sc-bed-item { width: 31% !important; }
          .sc-bed .sc-bed-bottle { width: 40% !important; order: -1; margin: 0 30%; }
          .sc-tags { display: none !important; }
          .sc-bed .sc-bed-item { margin-bottom: 18px; }
        }
      `}</style>
      {intro && <FlowerBurst onDone={endIntro} />}
      <Petals />

      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 50, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px clamp(16px,3vw,28px)", ...title, fontSize: 14, letterSpacing: ".2em", color: C.ink, background: "linear-gradient(rgba(245,239,226,.8), transparent)" }}>
        <button onClick={() => navigate("/map")} style={{ color: C.ink }}>← {t("КАРТА", "MAP")}</button>
        <span style={{ color: C.gold }}>SILENTIUM · ROMA</span>
        <span>{(["ru", "en"] as const).map((l) => <button key={l} onClick={() => setLang(l)} style={{ marginLeft: 12, color: lang === l ? C.gold : C.dim }}>{l.toUpperCase()}</button>)}</span>
      </nav>

      {/* hero: the garden gate */}
      <header ref={hero} style={{ position: "relative", height: "100svh", minHeight: 620, overflow: "hidden", background: "#e9e4d2" }}>
        <div className="sc-hero-far" style={{ position: "absolute", inset: 0 }}>
          <img className="sc-hero-bg" src={`${IMG}/garden-hero.webp`} alt={t("Закрытый сад белых цветов на рассвете", "An enclosed garden of white flowers at dawn")} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
        <div aria-hidden style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(250,246,236,.85), rgba(250,246,236,.25) 34%, transparent 55%)" }} />
        <div className="sc-hero-title" style={{ position: "absolute", left: 0, right: 0, top: "clamp(76px, 13vh, 130px)", textAlign: "center", padding: "0 16px" }}>
          <p style={{ ...body, fontStyle: "italic", fontSize: "clamp(1.05rem, 1.8vw, 1.35rem)", color: C.gold }}>{t("Святой покровительнице музыки", "To the patron saint of music")}</p>
          <h1 style={{ ...title, fontSize: "clamp(3.4rem, 10vw, 8.4rem)", lineHeight: 0.9, letterSpacing: ".02em", margin: "6px 0 10px", textShadow: "0 0 40px rgba(250,246,236,.9)" }}>Santa Caecilia</h1>
          <p style={{ ...body, fontStyle: "italic", fontSize: "clamp(1.2rem, 2.2vw, 1.7rem)", color: C.ink, textShadow: "0 0 20px rgba(250,246,236,.9)" }}>{t("Сад белых цветов", "A garden of white flowers")}</p>
        </div>
        <div style={{ position: "absolute", left: "50%", top: "68%", width: "min(230px, 44vw)", filter: "drop-shadow(0 0 1px rgba(90,70,40,.5)) drop-shadow(0 12px 18px rgba(90,70,40,.25))", height: "min(36vh, 340px)", transform: "translate(-50%,-50%)" }}>
          <div aria-hidden style={{ position: "absolute", left: "8%", right: "8%", bottom: "4%", height: "12%", borderRadius: "50%", background: "radial-gradient(ellipse, rgba(70,60,40,.45), transparent 70%)", filter: "blur(6px)" }} />
          <Bottle3D style={{ position: "absolute", inset: 0 }} lighting="daylight" {...bottleLook} spin={0.18} drawLabel={bottleLabel} />
        </div>
        <img className="sc-hero-front" src={`${IMG}/garden-front.webp`} alt="" aria-hidden style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 100%", pointerEvents: "none" }} />
        <p className="sc-scroll" style={{ position: "absolute", left: 0, right: 0, bottom: 18, textAlign: "center", ...body, fontStyle: "italic", fontSize: 17, color: "#fbf7ec", textShadow: "0 1px 10px rgba(0,0,0,.5)" }}>{t("Войдите в сад ↓", "Step into the garden ↓")}</p>
      </header>

      {/* what it smells like */}
      <section className="sc-two" style={{ maxWidth: 1180, margin: "0 auto", padding: "110px clamp(16px,4vw,48px) 120px", display: "grid", gridTemplateColumns: "1.15fr .85fr", gap: "50px 70px", alignItems: "center" }}>
        <Reveal>
          <p style={{ ...body, fontStyle: "italic", fontSize: 20, color: C.gold }}>{t("Как он пахнет", "What it smells like")}</p>
          <p style={{ ...body, fontSize: "clamp(1.55rem, 2.7vw, 2.2rem)", lineHeight: 1.32, marginTop: 12 }}>{Lp(g.plain)}</p>
          <dl style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px 30px", marginTop: 40 }}>
            {facts.map(([k, v]) => (
              <div key={k} style={{ borderTop: `1px solid ${C.sageL}`, paddingTop: 12 }}>
                <dt style={{ ...title, fontSize: 13, letterSpacing: ".22em", textTransform: "uppercase", color: C.moss }}>{k}</dt>
                <dd style={{ fontSize: 19, lineHeight: 1.4, marginTop: 6 }}>{v}</dd>
              </div>
            ))}
          </dl>
          {g.tip && <p style={{ marginTop: 26, fontSize: 17, color: C.dim }}><span style={{ color: C.gold }}>❀ </span>{Lp(g.tip)}</p>}
        </Reveal>
        <Reveal delay={150}>
          <div style={{ position: "relative", padding: "150px 28px 30px", borderRadius: "220px 220px 18px 18px / 160px 160px 18px 18px", background: `radial-gradient(circle at 50% 18%, #fffdf6, #efe7d4 70%)`, border: `1px solid ${C.faint}`, boxShadow: "0 30px 70px rgba(90,70,40,.15)" }}>
            <img className="sc-sway" src={`${IMG}/lily-single.webp`} alt="" aria-hidden style={{ position: "absolute", left: "50%", top: 18, width: 150, marginLeft: -75, animationDuration: "8s" }} />
            <p style={{ ...title, fontSize: 13, letterSpacing: ".22em", textTransform: "uppercase", color: C.moss, textAlign: "center" }}>{t("На что это похоже", "What it feels like")}</p>
            {pick(lang, g.scenes).map((s, i) => (
              <p key={i} style={{ fontStyle: "italic", fontSize: "clamp(1.1rem, 1.6vw, 1.3rem)", lineHeight: 1.4, padding: "12px 0", borderBottom: i < 3 ? `1px solid ${C.faint}` : "none", textAlign: "center" }}>{s}</p>
            ))}
          </div>
        </Reveal>
      </section>

      {/* the walk: drydown */}
      <Walk stages={stages} t={t} />

      {/* Cecilia herself */}
      <Cecilia t={t} />

      {/* notes as a flower bed */}
      <section style={{ padding: "120px clamp(16px,4vw,48px) 110px", background: `linear-gradient(180deg, ${C.ivory}, #eef0e2)` }}>
        <Head kicker={t("Из чего он сделан", "What it's made of")} title={t("Грядка белых цветов", "A bed of white flowers")} />
        <FlowerBed lang={lang} />
        {otherNotes.length > 0 && <p style={{ textAlign: "center", fontSize: 17, color: C.dim, maxWidth: 720, margin: "36px auto 0", lineHeight: 1.6 }}><span style={{ fontStyle: "italic", color: C.gold }}>{t("А ещё", "And also")}:</span> {otherNotes.join(" · ")}</p>}
      </section>

      {/* strength */}
      <section style={{ maxWidth: 900, margin: "0 auto", padding: "110px clamp(16px,4vw,48px) 120px" }}>
        <Head kicker={t("Характер", "Character")} title={t("Чего в нём больше всего", "What it holds the most of")} />
        <Stems facets={g.facets} lang={lang} />
      </section>

      {/* memories on stone plaques along the path */}
      <section style={{ maxWidth: 820, margin: "0 auto", padding: "120px clamp(16px,4vw,48px) 60px" }}>
        <Head kicker={t("Таблички вдоль дорожки", "Plaques along the path")} title={t("Что помнит сад", "What the garden remembers")} />
        {fragments.map((f, i) => (
          <Reveal key={i} delay={60}>
            {i > 0 && <div aria-hidden style={{ display: "flex", justifyContent: "center", gap: 18, margin: "14px 0" }}>{[0, 1].map((k) => <span key={k} style={{ width: 34, height: 14, borderRadius: "50%", background: "#d6cfbf", transform: `translateX(${(i % 2 ? -1 : 1) * (k ? 12 : -12)}px)` }} />)}</div>}
            <div className="sc-marble" style={{ width: "min(560px, 100%)", margin: "0 auto", transform: `translateX(${i % 2 ? 9 : -9}%) rotate(${i % 2 ? 0.8 : -0.8}deg)`, padding: "22px 26px", borderRadius: 8, boxShadow: "0 14px 30px rgba(90,70,40,.16), inset 0 -5px 0 rgba(42,36,32,.07)", textAlign: "center" }}>
              <p className="sc-engraved" style={{ ...title, fontSize: "clamp(1.15rem, 2.2vw, 1.55rem)", letterSpacing: ".08em", textTransform: "uppercase", lineHeight: 1.3 }}>{f}</p>
            </div>
          </Reveal>
        ))}
      </section>

      {/* request: drop a lily into the fountain */}
      <section style={{ padding: "60px 16px 120px", display: "flex", flexDirection: "column", alignItems: "center", gap: 18, textAlign: "center" }}>
        <p style={{ ...title, fontSize: "clamp(2rem, 4.6vw, 3.6rem)", lineHeight: 1.1 }}>{pick(lang, perfume.tagline)}</p>
        <p style={{ fontStyle: "italic", fontSize: 20, color: C.dim }}>{t("Бросьте лилию в фонтан — и мы ответим.", "Drop a lily into the fountain — and we will answer.")}</p>
        <button onClick={drop} className="sc-fountain" aria-label={t("Бросить лилию в фонтан и оставить заявку", "Drop a lily into the fountain and leave a request")} style={{ position: "relative", width: "min(640px, 94vw)", aspectRatio: "1100 / 659", marginTop: 50, cursor: "pointer", background: "transparent" }}>
          <img src={`${IMG}/fountain.webp`} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", filter: "drop-shadow(0 30px 40px rgba(90,70,40,.25))" }} />
          <span aria-hidden style={{ position: "absolute", left: "8.5%", top: "7%", width: "83%", height: "38%", borderRadius: "50%", overflow: "hidden" }}>
            {drops > 0 && [0, 1, 2].map((k) => <span key={`${drops}-${k}`} className="sc-ripple" style={{ animationDelay: `${1 + k * 0.35}s` }} />)}
          </span>
          {drops > 0 && <img key={drops} className="sc-lily-drop" src={`${IMG}/lily-single.webp`} alt="" aria-hidden style={{ position: "absolute", left: "50%", top: "26%", width: "24%", filter: "drop-shadow(0 8px 6px rgba(40,80,70,.25))" }} />}
          {drops === 0 && <span className="sc-hint" style={{ position: "absolute", left: 0, right: 0, top: "-12%", ...body, fontStyle: "italic", fontSize: 19, color: C.gold, opacity: 0.8, transform: "translateY(6px)", transition: "opacity .3s, transform .3s" }}>{t("нажмите на фонтан", "tap the fountain")}</span>}
        </button>
        <p style={{ fontSize: 16, color: C.dim, maxWidth: 440, lineHeight: 1.6, marginTop: 18 }}>{t("Оставьте контакт — мы напишем и расскажем, как получить флакон.", "Leave your contact — we'll write and tell you how to get a bottle.")}</p>
        <p style={{ ...mono, fontSize: 12, color: C.dim }}>Extrait de parfum · {perfume.releaseDate} · {pick(lang, perfume.origin.location)}</p>
      </section>

      <footer style={{ borderTop: `1px solid ${C.faint}`, padding: "18px clamp(16px,5vw,64px)", ...mono, fontSize: 10, color: C.dim, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
        <span>Silentium · Santa Caecilia</span>
      </footer>
      <RequestDialog open={open} onClose={() => setOpen(false)} perfumeName={perfume.name} skin={skin} />
    </div>
  );
}
