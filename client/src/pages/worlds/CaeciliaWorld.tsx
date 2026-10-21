// Santa Caecilia — white flowers for the patron saint of music.
// Ivory, gilding and marble. Waterhouse's painting in a gilded frame, lily petals drifting down,
// the antiphon "Cantantibus organis", notes written into an illuminated choir book, the profile as
// organ pipes, a gallery of the masters who painted her (public domain), Maderno's marble,
// and a lily laid on the slab to send a request.

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useLocation } from "wouter";
import { useLang } from "@/contexts/LangContext";
import Bottle3D from "@/components/Bottle3D";
import RequestDialog, { type DialogSkin } from "@/components/RequestDialog";
import { useReveal } from "@/lib/useReveal";
import { fragmentText, pick, prefersReducedMotion, type WorldProps } from "./shared";

const C = { ivory: "#f5efe2", paper: "#faf6ec", ink: "#2a2420", dim: "rgba(42,36,32,.64)", faint: "rgba(42,36,32,.2)", gold: "#b8923a", goldL: "#e2c77e", red: "#8a2128", vellum: "#f1e3c2" };
const title: CSSProperties = { fontFamily: "'Forum', 'Cormorant SC', serif", fontWeight: 400 };
const body: CSSProperties = { fontFamily: "'EB Garamond', 'Cormorant Garamond', serif" };
const mono: CSSProperties = { fontFamily: "'JetBrains Mono', monospace" };
const GILT = "linear-gradient(135deg, #8a6a24 0%, #e9d08a 18%, #b8923a 35%, #f6e6b0 50%, #a8822e 66%, #e2c77e 82%, #7a5c1e 100%)";
const IMG = "/images/santa-caecilia";

const GALLERY = [
  { src: `${IMG}/raphael.webp`, artist: ["Рафаэль", "Raphael"], work: ["Экстаз святой Цецилии", "The Ecstasy of Saint Cecilia"], year: "1514–1516", where: ["Национальная пинакотека, Болонья", "Pinacoteca Nazionale, Bologna"], tall: true },
  { src: `${IMG}/reni.webp`, artist: ["Гвидо Рени", "Guido Reni"], work: ["Святая Цецилия", "Saint Cecilia"], year: "1606", where: ["Музей Нортона Саймона, Пасадина", "Norton Simon Museum, Pasadena"] },
  { src: `${IMG}/dolci.webp`, artist: ["Карло Дольчи", "Carlo Dolci"], work: ["Святая Цецилия за органом", "Saint Cecilia at the Organ"], year: "1671", where: ["Галерея старых мастеров, Дрезден", "Gemäldegalerie Alte Meister, Dresden"] },
  { src: `${IMG}/domenichino.webp`, artist: ["Доменикино", "Domenichino"], work: ["Святая Цецилия с виолой", "Saint Cecilia with a Viol"], year: "1617–1618", where: ["Лувр, Париж", "Louvre, Paris"], tall: true },
  { src: `${IMG}/gentileschi.webp`, artist: ["Артемизия Джентилески", "Artemisia Gentileschi"], work: ["Святая Цецилия с лютней", "Saint Cecilia Playing a Lute"], year: "ок. 1616", where: ["Галерея Спада, Рим", "Galleria Spada, Rome"] },
];

// Lily petals drifting down the page
function Petals() {
  const petals = useMemo(() => Array.from({ length: 14 }, (_, i) => ({ x: (i * 37) % 100, d: 14 + (i % 5) * 4, delay: -i * 2.3, s: 14 + (i % 4) * 6, r: (i * 53) % 360 })), []);
  if (prefersReducedMotion()) return null;
  return (
    <div aria-hidden style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 5, overflow: "hidden" }}>
      {petals.map((p, i) => (
        <svg key={i} className="sc-petal" viewBox="0 0 20 40" width={p.s} height={p.s * 2} style={{ left: `${p.x}%`, animationDuration: `${p.d}s`, animationDelay: `${p.delay}s`, ["--r" as string]: `${p.r}deg` }}>
          <path d="M10 0 C 18 10, 18 30, 10 40 C 2 30, 2 10, 10 0 Z" fill="#fffdf6" stroke="rgba(184,146,58,.35)" strokeWidth=".6" />
          <path d="M10 4 L10 36" stroke="rgba(184,146,58,.25)" strokeWidth=".5" />
        </svg>
      ))}
    </div>
  );
}

function Reveal({ children, delay = 0, style }: { children: React.ReactNode; delay?: number; style?: CSSProperties }) {
  const { ref, visible } = useReveal();
  return <div ref={ref} style={{ ...style, opacity: visible ? 1 : 0, transform: visible ? "none" : "translateY(24px)", transition: `opacity 1.4s ease ${delay}ms, transform 1.4s cubic-bezier(.16,1,.3,1) ${delay}ms` }}>{children}</div>;
}

// One line of an illuminated choir book: a red four-line staff, square neumes over each note
function ChantLine({ rubric, notes, first }: { rubric: string; notes: string[]; first?: boolean }) {
  return (
    <div style={{ display: "flex", gap: 18, alignItems: "flex-end", marginBottom: 34 }}>
      {first ? (
        <div aria-hidden style={{ flex: "none", width: 92, height: 112, display: "flex", alignItems: "center", justifyContent: "center", background: `radial-gradient(circle at 30% 30%, #2f4a8a, #1b2c57)`, border: "3px solid transparent", borderImage: `${GILT} 1`, boxShadow: "inset 0 0 0 2px #e2c77e" }}>
          <span style={{ ...title, fontSize: 86, lineHeight: 1, background: GILT, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>S</span>
        </div>
      ) : <div style={{ flex: "none", width: 92 }} />}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ ...body, fontStyle: "italic", color: C.red, fontSize: 17, marginBottom: 6 }}>{rubric}</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 26px" }}>
          {notes.map((n, i) => {
            const heights = [2, 1, 3, 0, 2, 1];
            return (
              <div key={n} style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                <svg viewBox="0 0 120 44" width="120" height="44" aria-hidden>
                  {[8, 18, 28, 38].map((y) => <line key={y} x1="0" x2="120" y1={y} y2={y} stroke={C.red} strokeWidth="1" opacity=".75" />)}
                  {[0, 1, 2].map((k) => {
                    const h = heights[(i + k) % heights.length];
                    return <rect key={k} x={14 + k * 30} y={34 - h * 10 - 5} width="10" height="10" fill="#1d1a17" transform={k === 1 ? `rotate(45 ${19 + k * 30} ${34 - h * 10})` : undefined} />;
                  })}
                </svg>
                <span style={{ ...body, fontSize: 21, color: C.ink, marginTop: 2 }}>{n}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function OrganPipes({ axes, lang }: { axes: { key: string; label: { ru: string; en: string }; value: number }[]; lang: "ru" | "en" }) {
  const { ref, visible } = useReveal();
  // tallest pipe in the middle, like a real organ façade
  const order = [...axes].sort((a, b) => b.value - a.value);
  const arranged: typeof axes = [];
  order.forEach((a, i) => (i % 2 ? arranged.push(a) : arranged.unshift(a)));
  return (
    <div ref={ref}>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "center", gap: "clamp(30px,5vw,64px)", height: 380, padding: "0 12px", borderBottom: "14px solid transparent", borderImage: `${GILT} 1` }}>
        {arranged.map((a, i) => (
          <div key={a.key} style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
            <span style={{ ...title, fontSize: 22, color: C.gold, opacity: visible ? 1 : 0, transition: `opacity 1s ${800 + i * 120}ms` }}>{a.value}</span>
            <div style={{ position: "relative", width: "clamp(34px, 6vw, 58px)", height: visible ? a.value * 3 : 0, transition: `height 1.8s cubic-bezier(.16,1,.3,1) ${i * 120}ms`, background: "linear-gradient(90deg, #8d8f94 0%, #f4f5f7 22%, #c4c7cc 45%, #fbfbfc 60%, #9c9ea3 100%)", borderRadius: "4px 4px 0 0", boxShadow: "0 10px 30px rgba(42,36,32,.18)" }}>
              <span style={{ position: "absolute", left: "18%", right: "18%", bottom: 46, height: 18, borderRadius: "50% 50% 0 0", background: "#2a2420", opacity: 0.8 }} />
              <span style={{ position: "absolute", left: 0, right: 0, bottom: 34, height: 12, background: "linear-gradient(#9c9ea3,#e6e7ea)", clipPath: "polygon(0 0, 100% 0, 80% 100%, 20% 100%)" }} />
            </div>
            <span style={{ position: "absolute", top: "calc(100% + 26px)", left: "50%", transform: "translateX(-50%)", width: "clamp(70px, 9vw, 104px)", textAlign: "center", ...body, fontSize: "clamp(12px, 1.3vw, 15px)", color: C.dim, lineHeight: 1.2, overflowWrap: "anywhere" }}>{pick(lang, a.label)}</span>
          </div>
        ))}
      </div>
      <div style={{ height: 60 }} />
    </div>
  );
}

export default function CaeciliaWorld({ perfume }: WorldProps) {
  const [, navigate] = useLocation();
  const { lang, setLang, t } = useLang();
  const [open, setOpen] = useState(false);
  const [lilyLaid, setLilyLaid] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const fragments = pick(lang, perfume.memoryFragments).map(fragmentText);
  const n = perfume.scentNotes;
  const L = (pair: string[]) => (lang === "ru" ? pair[0] : pair[1]);

  const layLily = () => {
    setLilyLaid(true);
    timer.current = window.setTimeout(() => setOpen(true), prefersReducedMotion() ? 0 : 1100);
  };

  const skin: DialogSkin = {
    overlay: "rgba(245,239,226,.86)",
    panel: { ...body, background: C.paper, color: C.ink, padding: "34px 30px", border: "10px solid transparent", borderImage: `${GILT} 1`, boxShadow: "0 40px 90px rgba(42,36,32,.25)" },
    title: { ...title, fontSize: 34, color: C.ink, letterSpacing: ".04em" },
    label: { ...body, fontStyle: "italic", fontSize: 15, color: C.red },
    input: { ...body, fontSize: 19, background: "transparent", border: "none", borderBottom: `1px solid ${C.faint}`, padding: "6px 0", color: C.ink },
    button: { ...title, fontSize: 18, letterSpacing: ".12em", background: GILT, color: "#3a2a10", padding: "14px" },
    accent: C.red,
    heading: { ru: "Прошение", en: "A request" },
    submit: { ru: "Отправить", en: "Send" },
    sent: { ru: "Ваша лилия принята.", en: "Your lily has been received." },
  };

  return (
    <div style={{ ...body, background: `radial-gradient(ellipse at 50% -10%, #fffdf6, ${C.ivory} 55%, #ece3cf)`, color: C.ink, minHeight: "100vh", overflowX: "hidden" }}>
      <style>{`
        .sc-petal { position: absolute; top: -60px; opacity: .85; animation: sc-fall linear infinite; filter: drop-shadow(0 2px 3px rgba(42,36,32,.12)); }
        @keyframes sc-fall {
          0% { transform: translate(0, -8vh) rotate(var(--r)); }
          25% { transform: translate(40px, 25vh) rotate(calc(var(--r) + 90deg)); }
          50% { transform: translate(-20px, 55vh) rotate(calc(var(--r) + 180deg)); }
          75% { transform: translate(35px, 82vh) rotate(calc(var(--r) + 260deg)); }
          100% { transform: translate(0, 112vh) rotate(calc(var(--r) + 340deg)); }
        }
        .sc-rays { background: repeating-conic-gradient(from 200deg at 50% -10%, rgba(255,250,232,.55) 0deg 4deg, transparent 4deg 11deg); mask-image: linear-gradient(#000, transparent 70%); -webkit-mask-image: linear-gradient(#000, transparent 70%); }
        .sc-frame img { transition: transform 1.4s cubic-bezier(.16,1,.3,1); }
        .sc-frame:hover img { transform: scale(1.04); }
        .sc-lily { transition: transform 1.1s cubic-bezier(.2,1.2,.4,1), opacity .6s; }
        .sc-marble { background:
          radial-gradient(ellipse at 20% 30%, rgba(160,150,140,.18), transparent 40%),
          radial-gradient(ellipse at 70% 60%, rgba(150,140,130,.14), transparent 45%),
          linear-gradient(115deg, transparent 40%, rgba(140,130,120,.16) 41%, transparent 43%),
          linear-gradient(160deg, transparent 60%, rgba(140,130,120,.12) 61%, transparent 62%),
          linear-gradient(#f7f4ee, #e6e0d5); }
      `}</style>
      <Petals />

      <nav style={{ position: "relative", zIndex: 10, display: "flex", justifyContent: "space-between", padding: "20px clamp(16px,4vw,48px)", ...title, fontSize: 15, letterSpacing: ".2em" }}>
        <button onClick={() => navigate("/map")} style={{ color: C.dim }}>← {t("КАРТА", "MAP")}</button>
        <span style={{ color: C.gold }}>SILENTIUM · ROMA</span>
        <span>{(["ru", "en"] as const).map((l) => <button key={l} onClick={() => setLang(l)} style={{ marginLeft: 12, color: lang === l ? C.red : C.dim }}>{l.toUpperCase()}</button>)}</span>
      </nav>

      {/* hero */}
      <header style={{ position: "relative", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 40, alignItems: "center", padding: "20px clamp(16px,5vw,80px) 100px", maxWidth: 1440, margin: "0 auto" }}>
        <div className="sc-rays" aria-hidden style={{ position: "absolute", inset: 0, pointerEvents: "none" }} />
        <div style={{ position: "relative", zIndex: 2 }}>
          <p style={{ ...body, fontStyle: "italic", color: C.red, fontSize: 20 }}>{t("Святой покровительнице музыки", "To the patron saint of music")}</p>
          <h1 style={{ ...title, fontSize: "clamp(3.6rem, 9vw, 8rem)", lineHeight: 0.92, letterSpacing: ".02em", margin: "12px 0 24px" }}>Santa<br />Caecilia</h1>
          <p style={{ fontSize: "clamp(1.25rem, 1.9vw, 1.6rem)", lineHeight: 1.45, maxWidth: 500, color: C.dim }}>{pick(lang, perfume.description)}</p>
          <p style={{ ...title, fontSize: 14, letterSpacing: ".3em", color: C.gold, marginTop: 26 }}>{pick(lang, perfume.keywords)}</p>
        </div>
        <div style={{ position: "relative", zIndex: 2 }}>
          <figure className="sc-frame" style={{ margin: 0, padding: 18, background: GILT, boxShadow: "0 40px 80px rgba(42,36,32,.3), inset 0 0 0 3px rgba(255,255,255,.35)" }}>
            <div style={{ padding: 6, background: "#5a4214" }}>
              <div style={{ overflow: "hidden" }}><img src={perfume.heroImage} alt={t("Джон Уильям Уотерхаус, «Святая Цецилия», 1895", "John William Waterhouse, Saint Cecilia, 1895")} style={{ display: "block", width: "100%", aspectRatio: "1800 / 1115", objectFit: "cover" }} /></div>
            </div>
          </figure>
          <p style={{ ...body, fontStyle: "italic", fontSize: 14, color: C.dim, marginTop: 10, textAlign: "right" }}>{t("Джон Уильям Уотерхаус. Святая Цецилия, 1895", "John William Waterhouse. Saint Cecilia, 1895")}</p>
          <div style={{ position: "absolute", left: "-14%", bottom: "-22%", width: "50%", height: "96%", zIndex: 3 }}>
            <Bottle3D style={{ position: "absolute", inset: 0 }} lighting="daylight" liquid="#e6cf8f" liquidOpacity={0.94} glass="#fffdf6" cap="#f2efe8" capRoughness={0.55} collar="#c9a54a" spin={0.18}
              drawLabel={(ctx, w, h) => {
                ctx.fillStyle = "#faf6ec"; ctx.fillRect(0, 0, w, h);
                const g = ctx.createLinearGradient(0, 0, w, h); g.addColorStop(0, "#8a6a24"); g.addColorStop(0.5, "#f0d995"); g.addColorStop(1, "#8a6a24");
                ctx.strokeStyle = g; ctx.lineWidth = 6; ctx.strokeRect(24, 24, w - 48, h - 48); ctx.lineWidth = 2; ctx.strokeRect(40, 40, w - 80, h - 80);
                // a small lily
                ctx.save(); ctx.translate(w / 2, h * 0.27); ctx.fillStyle = g;
                for (const a of [-0.9, -0.3, 0.3, 0.9]) { ctx.save(); ctx.rotate(a); ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(22, -30, 12, -70, 0, -88); ctx.bezierCurveTo(-12, -70, -22, -30, 0, 0); ctx.fill(); ctx.restore(); }
                ctx.restore();
                ctx.fillStyle = "#2a2420"; ctx.textAlign = "center";
                ctx.font = "110px 'Forum', serif"; ctx.fillText("SANTA", w / 2, h * 0.6);
                ctx.fillText("CAECILIA", w / 2, h * 0.78);
                ctx.font = "26px 'JetBrains Mono', monospace"; ctx.fillStyle = "#8a6a24"; ctx.fillText("SILENTIUM · ROMA", w / 2, h * 0.9);
              }} />
          </div>
        </div>
      </header>

      <main style={{ position: "relative", zIndex: 2, maxWidth: 1180, margin: "0 auto", padding: "0 clamp(16px,5vw,64px) 60px" }}>
        {/* antiphon */}
        <section style={{ textAlign: "center", padding: "12vh 0" }}>
          <Reveal>
            <p style={{ ...title, fontSize: "clamp(1.4rem, 3vw, 2.3rem)", letterSpacing: ".08em", lineHeight: 1.4, color: C.ink }}>CANTANTIBUS ORGANIS<br />CAECILIA IN CORDE SUO<br />SOLI DOMINO DECANTABAT</p>
            <div style={{ width: 120, height: 2, background: GILT, margin: "26px auto" }} />
            <p style={{ fontStyle: "italic", fontSize: "clamp(1.25rem, 2.2vw, 1.7rem)", color: C.dim, maxWidth: 680, margin: "0 auto", lineHeight: 1.45 }}>{t("«Когда звучали органы, Цецилия пела в сердце своём одному Господу». Её символ — белая лилия: чистота, которую не смогли сломать.", "“While the organs played, Cecilia sang in her heart to the Lord alone.” Her emblem is the white lily — a purity that could not be broken.")}</p>
          </Reveal>
        </section>

        {/* choir book */}
        <section style={{ marginBottom: 130 }}>
          <Reveal><SectionHead kicker={t("Певческая книга", "The choir book")} title={t("Ноты, записанные невмами", "Notes, written in neumes")} /></Reveal>
          <Reveal>
            <div style={{ background: `radial-gradient(ellipse at 50% 40%, #f8ecd0, ${C.vellum} 60%, #e2cf9f)`, padding: "clamp(24px,5vw,56px)", boxShadow: "0 30px 70px rgba(42,36,32,.22), inset 0 0 60px rgba(150,110,40,.25)", borderRadius: 4 }}>
              {n.top && <ChantLine first rubric={t("Ad initium · в начале", "Ad initium · at the opening")} notes={pick(lang, n.top)} />}
              {n.heart && <ChantLine rubric={t("In medio · в сердце", "In medio · at the heart")} notes={pick(lang, n.heart)} />}
              {n.base && <ChantLine rubric={t("In fine · в завершении", "In fine · at the close")} notes={pick(lang, n.base)} />}
              <p style={{ ...body, fontStyle: "italic", color: C.red, textAlign: "right", fontSize: 18 }}>{t("Главная нота — лилия, как в её венке.", "The leading note is the lily, as in her crown.")}</p>
            </div>
          </Reveal>
        </section>

        {/* organ */}
        <section style={{ marginBottom: 130 }}>
          <Reveal><SectionHead kicker={t("Орган", "The organ")} title={t("Как он звучит", "How it sounds")} /></Reveal>
          <OrganPipes axes={perfume.radarAxes} lang={lang} />
        </section>

        {/* gallery */}
        <section style={{ marginBottom: 130 }}>
          <Reveal><SectionHead kicker={t("Галерея", "The gallery")} title={t("Её писали мастера", "The masters who painted her")} /></Reveal>
          <div style={{ columns: "3 260px", columnGap: 26 }}>
            {GALLERY.map((g, i) => (
              <Reveal key={g.src} delay={(i % 3) * 120} style={{ breakInside: "avoid", marginBottom: 30 }}>
                <figure className="sc-frame" style={{ margin: 0 }}>
                  <div style={{ padding: 12, background: GILT, boxShadow: "0 24px 50px rgba(42,36,32,.25)" }}>
                    <div style={{ overflow: "hidden", background: "#3a2a10" }}>
                      <img src={g.src} alt={`${L(g.artist)}, ${L(g.work)}`} loading="lazy" style={{ display: "block", width: "100%", height: "auto" }} />
                    </div>
                  </div>
                  <figcaption style={{ marginTop: 12, padding: "10px 12px", background: C.paper, border: `1px solid ${C.faint}` }}>
                    <p style={{ ...title, fontSize: 18, letterSpacing: ".04em" }}>{L(g.artist)}</p>
                    <p style={{ fontStyle: "italic", fontSize: 17, color: C.ink }}>{L(g.work)}, {g.year}</p>
                    <p style={{ ...mono, fontSize: 10, color: C.dim, marginTop: 4, letterSpacing: ".06em" }}>{L(g.where)}</p>
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        </section>

        {/* hymn */}
        <section style={{ marginBottom: 130, maxWidth: 720, marginInline: "auto" }}>
          <Reveal><SectionHead kicker={t("Гимн", "The hymn")} title={t("Что помнит лилия", "What the lily remembers")} center /></Reveal>
          {fragments.map((f, i) => (
            <Reveal key={i} delay={i * 80}>
              <p style={{ display: "flex", gap: 16, alignItems: "baseline", fontSize: "clamp(1.35rem, 2.4vw, 1.8rem)", lineHeight: 1.35, padding: "14px 0", borderBottom: i < fragments.length - 1 ? `1px solid ${C.faint}` : "none" }}>
                <span style={{ color: C.red, fontSize: 22, flex: "none" }}>℣</span>
                <span><span style={{ ...title, fontSize: "1.6em", lineHeight: 0.8, color: C.gold, marginRight: 2 }}>{f.charAt(0)}</span>{f.slice(1)}</span>
              </p>
            </Reveal>
          ))}
        </section>
      </main>

      {/* Maderno's marble */}
      <section style={{ position: "relative", zIndex: 2, background: "#17130f", color: "#efe6d4", padding: "14vh clamp(16px,6vw,90px)" }}>
        <div style={{ maxWidth: 1180, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 40, alignItems: "center" }}>
          <Reveal>
            <img src={`${IMG}/maderno.webp`} alt={t("Стефано Мадерно, «Святая Цецилия», 1600", "Stefano Maderno, Saint Cecilia, 1600")} loading="lazy" style={{ width: "100%", display: "block", filter: "sepia(.25) contrast(1.05)", boxShadow: "0 30px 80px rgba(0,0,0,.6)" }} />
          </Reveal>
          <Reveal delay={150}>
            <p style={{ ...title, fontSize: 14, letterSpacing: ".3em", color: C.goldL }}>{t("МРАМОР · 1600", "MARBLE · 1600")}</p>
            <h2 style={{ ...title, fontSize: "clamp(2rem, 4.4vw, 3.4rem)", lineHeight: 1.05, margin: "14px 0 18px" }}>{t("Такой, какой её нашли", "As she was found")}</h2>
            <p style={{ fontSize: 20, lineHeight: 1.55, opacity: 0.85 }}>{t("В 1599 году в римской базилике Санта-Чечилия-ин-Трастевере вскрыли её гробницу. Скульптор Стефано Мадерно вырезал из белого мрамора то, что увидел: девушку, лежащую на боку, словно спящую, с лицом, отвернувшимся к земле. Этот аромат — о той же тишине.", "In 1599 her tomb in the Roman basilica of Santa Cecilia in Trastevere was opened. The sculptor Stefano Maderno carved in white marble what he saw: a girl lying on her side as if asleep, her face turned to the ground. This fragrance is about that same silence.")}</p>
            <p style={{ ...mono, fontSize: 11, opacity: 0.5, marginTop: 16 }}>{perfume.origin.coords} · {pick(lang, perfume.origin.location)}</p>
          </Reveal>
        </div>
      </section>

      {/* the lily on the slab */}
      <section style={{ position: "relative", zIndex: 2, padding: "14vh clamp(16px,5vw,64px) 12vh", textAlign: "center" }}>
        <p style={{ ...title, fontSize: "clamp(2rem, 4.6vw, 3.6rem)", lineHeight: 1.1 }}>{pick(lang, perfume.tagline)}</p>
        <p style={{ fontStyle: "italic", fontSize: 20, color: C.dim, marginTop: 10 }}>{t("Оставьте лилию — и мы ответим.", "Leave a lily — and we will answer.")}</p>
        <div className="sc-marble" style={{ position: "relative", maxWidth: 760, height: 150, margin: "40px auto 0", borderRadius: 6, boxShadow: "0 30px 60px rgba(42,36,32,.22), inset 0 -8px 0 rgba(42,36,32,.08)" }}>
          <svg className="sc-lily" viewBox="0 0 260 90" width="260" aria-hidden style={{ position: "absolute", left: "50%", top: "50%", marginLeft: -130, marginTop: -45, opacity: lilyLaid ? 1 : 0, transform: lilyLaid ? "translateY(0) rotate(-6deg)" : "translateY(-140px) rotate(-30deg)" }}>
            <path d="M20 60 C 80 54, 140 50, 200 44" stroke="#6f7d4c" strokeWidth="4" fill="none" />
            <path d="M120 52 C 110 40, 92 36, 80 44 C 96 46, 108 50, 120 52 Z" fill="#7f8f58" />
            <g transform="translate(205 42)">
              {[-60, -20, 20, 60].map((a) => <path key={a} d="M0 0 C 14 -10, 36 -12, 52 -2 C 36 4, 14 6, 0 0 Z" fill="#fffdf6" stroke="#e2d6b8" transform={`rotate(${a})`} />)}
              <circle r="4" fill="#d9a43a" />
            </g>
          </svg>
          <button onClick={layLily} disabled={lilyLaid && !open} style={{ position: "absolute", left: "50%", bottom: -26, transform: "translateX(-50%)", ...title, fontSize: 17, letterSpacing: ".18em", padding: "14px 30px", background: GILT, color: "#3a2a10", boxShadow: "0 10px 30px rgba(184,146,58,.4)" }}>
            {t("ОСТАВИТЬ ЛИЛИЮ", "LEAVE A LILY")}
          </button>
        </div>
        <p style={{ ...mono, fontSize: 12, color: C.dim, marginTop: 60 }}>Extrait de parfum · {perfume.releaseDate}</p>
      </section>

      <footer style={{ position: "relative", zIndex: 2, borderTop: `1px solid ${C.faint}`, padding: "18px clamp(16px,5vw,64px)", ...mono, fontSize: 10, color: C.dim, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
        <span>Silentium · Santa Caecilia</span>
        <span>{t("Изображения картин и скульптуры: Wikimedia Commons, общественное достояние.", "Paintings and sculpture images: Wikimedia Commons, public domain.")}</span>
      </footer>
      <RequestDialog open={open} onClose={() => { setOpen(false); setLilyLaid(false); }} perfumeName={perfume.name} skin={skin} />
    </div>
  );
}

function SectionHead({ kicker, title: heading, center }: { kicker: string; title: string; center?: boolean }) {
  return (
    <div style={{ marginBottom: 34, textAlign: center ? "center" : "left" }}>
      <p style={{ ...body, fontStyle: "italic", fontSize: 20, color: C.red }}>{kicker}</p>
      <h2 style={{ ...title, fontSize: "clamp(2.2rem, 5vw, 4rem)", lineHeight: 1, letterSpacing: ".02em", marginTop: 6 }}>{heading}</h2>
    </div>
  );
}
