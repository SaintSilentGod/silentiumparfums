// Summer of 2009 — a personal blog page from 2009.
// Glossy Web 2.0 header, sidebar profile, visitor counter, a "Flash" player holding the bottle,
// tag cloud of notes, polaroids, a guestbook of memories and a glitter cursor trail.

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useLocation } from "wouter";
import { useLang } from "@/contexts/LangContext";
import Bottle3D from "@/components/Bottle3D";
import RequestDialog, { type DialogSkin } from "@/components/RequestDialog";
import { useReveal } from "@/lib/useReveal";
import { fragmentText, notesFlat, pick, prefersReducedMotion, type WorldProps } from "./shared";

const font: CSSProperties = { fontFamily: "Verdana, Tahoma, 'Trebuchet MS', sans-serif" };
const trebuchet: CSSProperties = { fontFamily: "'Trebuchet MS', Tahoma, Verdana, sans-serif" };
const comic: CSSProperties = { fontFamily: "'Comic Sans MS', 'Comic Neue', 'Trebuchet MS', cursive" };
const LINK = "#1a5fb4";

// ── Glitter trail behind the cursor ──
function GlitterTrail() {
  useEffect(() => {
    if (prefersReducedMotion() || window.matchMedia("(pointer: coarse)").matches) return;
    const colors = ["#ff5fa2", "#ffd400", "#5fd3ff", "#9dff5f", "#ffffff"];
    let last = 0;
    const onMove = (e: PointerEvent) => {
      const now = performance.now();
      if (now - last < 28) return;
      last = now;
      const s = document.createElement("span");
      s.textContent = Math.random() > 0.5 ? "✦" : "✧";
      s.style.cssText = `position:fixed;left:${e.clientX + (Math.random() * 14 - 7)}px;top:${e.clientY + (Math.random() * 14 - 7)}px;pointer-events:none;z-index:999;font-size:${10 + Math.random() * 10}px;color:${colors[(Math.random() * colors.length) | 0]};text-shadow:0 0 6px #fff;transition:transform .9s ease-out, opacity .9s ease-out;`;
      document.body.appendChild(s);
      requestAnimationFrame(() => { s.style.transform = `translateY(${20 + Math.random() * 20}px) rotate(${Math.random() * 180}deg)`; s.style.opacity = "0"; });
      setTimeout(() => s.remove(), 950);
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, []);
  return null;
}

function Box({ title, children, color = "#7cc04b", style }: { title: string; children: React.ReactNode; color?: string; style?: CSSProperties }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #b8d4e8", borderRadius: 8, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,.08)", ...style }}>
      <div style={{ background: `linear-gradient(${color}, ${shade(color)})`, color: "#fff", fontWeight: "bold", fontSize: 12, padding: "5px 10px", textShadow: "0 1px 0 rgba(0,0,0,.3)", position: "relative" }}>
        <span style={{ position: "absolute", inset: "0 0 50% 0", background: "rgba(255,255,255,.28)" }} />
        <span style={{ position: "relative" }}>{title}</span>
      </div>
      <div style={{ padding: 10 }}>{children}</div>
    </div>
  );
}
const shade = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  const f = (v: number) => Math.max(0, Math.round(v * 0.72));
  return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`;
};

// ── Fake Flash player that "loads" the 3D bottle ──
function FlashPlayer({ t }: { t: (ru: string, en: string) => string }) {
  const { ref, visible } = useReveal();
  const [pct, setPct] = useState(0);
  useEffect(() => {
    if (!visible) return;
    let raf = 0; const t0 = performance.now();
    const step = (now: number) => {
      const p = Math.min(100, Math.floor(((now - t0) / 1600) * 100));
      setPct(p);
      if (p < 100) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [visible]);
  return (
    <div ref={ref} style={{ border: "1px solid #888", borderRadius: 4, overflow: "hidden", background: "#333", boxShadow: "0 3px 8px rgba(0,0,0,.25)" }}>
      <div style={{ background: "linear-gradient(#5d5d5d,#3a3a3a)", color: "#eee", fontSize: 11, padding: "4px 8px", display: "flex", justifyContent: "space-between" }}>
        <span>▣ bottle_3d.swf</span><span>Adobe Flash Player 10</span>
      </div>
      <div style={{ position: "relative", height: 420, background: "linear-gradient(#bfe6ff, #e9f7ff 55%, #d8f0c8)" }}>
        <div style={{ position: "absolute", left: "-10%", right: "-10%", bottom: -60, height: 160, borderRadius: "50%", background: "radial-gradient(ellipse at 50% 0%, #9fd46a, #5aa437 70%)" }} />
        {pct >= 100 && (
          <Bottle3D
            style={{ position: "absolute", inset: 0 }}
            lighting="daylight" liquid="#3e7a1e" liquidOpacity={0.85} glass="#eaffea" cap="#2b1a2e" capRoughness={0.6} collar="#d9d9d9" spin={0.5}
            drawLabel={(ctx, w, h) => {
              const g = ctx.createLinearGradient(0, 0, 0, h);
              g.addColorStop(0, "#ffffff"); g.addColorStop(1, "#d8f3ff");
              ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
              ctx.fillStyle = "#ff3e8a"; ctx.font = "bold italic 120px 'Trebuchet MS', sans-serif"; ctx.textAlign = "center";
              ctx.fillText("summer", w / 2, h * 0.42);
              ctx.fillStyle = "#1a5fb4"; ctx.font = "bold 150px 'Trebuchet MS', sans-serif"; ctx.fillText("2009", w / 2, h * 0.78);
              ctx.fillStyle = "#ffcc00"; ctx.font = "90px sans-serif"; ctx.fillText("★", w * 0.86, h * 0.3);
            }}
          />
        )}
        {pct < 100 && (
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, color: "#245", fontSize: 12 }}>
            <span>{t("Загрузка...", "Loading...")} {pct}%</span>
            <div style={{ width: 220, height: 14, border: "1px solid #6a8fb0", borderRadius: 7, background: "#fff", overflow: "hidden" }}>
              <div style={{ width: `${pct}%`, height: "100%", background: "linear-gradient(#9be15d,#3fae2a)" }} />
            </div>
          </div>
        )}
      </div>
      <div style={{ background: "linear-gradient(#4a4a4a,#2c2c2c)", color: "#ccc", fontSize: 11, padding: "5px 8px", display: "flex", gap: 10, alignItems: "center" }}>
        <span>▶</span><span>❚❚</span>
        <div style={{ flex: 1, height: 4, background: "#555", borderRadius: 2 }}><div style={{ width: "62%", height: "100%", background: "#7cc04b", borderRadius: 2 }} /></div>
        <span>{t("крути мышкой!", "drag to spin!")}</span>
      </div>
    </div>
  );
}

const USERS = ["~*Ka$ka*~", "xXx_DaNiLa_xXx", "летонавсегда", "sweet_berry_89", "ПрИнЦеСсКа", "DJ_Mosquito"];
const DATES = ["24.07.2009 22:13", "25.07.2009 01:47", "27.07.2009 19:02", "29.07.2009 23:58", "31.07.2009 14:20"];

export default function SummerWorld({ perfume }: WorldProps) {
  const [, navigate] = useLocation();
  const { lang, setLang, t } = useLang();
  const [open, setOpen] = useState(false);
  const notes = notesFlat(perfume, lang);
  const gallery = perfume.gallery ?? [];
  const fragments = pick(lang, perfume.memoryFragments).map(fragmentText);
  const [visitor] = useState(() => String(427 + Math.floor(Math.random() * 40)).padStart(6, "0"));
  const sizes = useRef(notes.map((_, i) => [13, 18, 11, 22, 15, 26, 12, 17, 20, 14][i % 10]));

  const skin: DialogSkin = {
    overlay: "rgba(20,40,60,.55)",
    panel: { ...font, background: "#fff", border: "1px solid #8ab", borderRadius: 10, padding: 0, color: "#222", boxShadow: "0 10px 40px rgba(0,0,0,.4)", overflow: "hidden", paddingBottom: 18, paddingLeft: 18, paddingRight: 18, paddingTop: 50, backgroundImage: "linear-gradient(#5aa9e6, #2f7fc4)", backgroundSize: "100% 34px", backgroundRepeat: "no-repeat" },
    title: { ...trebuchet, fontWeight: "bold", fontStyle: "italic", fontSize: 24, color: "#ff3e8a" },
    label: { fontSize: 11, color: "#456", fontWeight: "bold" },
    input: { border: "1px solid #9bb", borderRadius: 3, padding: "5px 6px", fontSize: 13, background: "linear-gradient(#f3f3f3, #fff 40%)", ...font },
    button: { ...trebuchet, fontWeight: "bold", fontSize: 16, color: "#fff", padding: "10px", borderRadius: 18, border: "1px solid #2a8a1a", background: "linear-gradient(#a6ea6b, #4fbf2d 50%, #3aa21c 51%, #5bd03a)", textShadow: "0 -1px 0 rgba(0,0,0,.3)", boxShadow: "0 2px 4px rgba(0,0,0,.3)" },
    accent: "#ff3e8a",
    heading: { ru: "Заказать :)", en: "Order it :)" },
    submit: { ru: "Отправить!!!", en: "Send!!!" },
    sent: { ru: "Ура! Мы тебе напишем ^_^", en: "Yay! We'll write you ^_^" },
  };

  return (
    <div style={{ ...font, minHeight: "100vh", color: "#222", fontSize: 13, background: "linear-gradient(#3d93d9 0, #8cc8f0 380px, #d9eefa 900px, #eef8fd)", paddingBottom: 40, overflowX: "hidden" }}>
      <GlitterTrail />
      <style>{`
        .y09-marquee { overflow: hidden; white-space: nowrap; }
        .y09-marquee > span { display: inline-block; padding-left: 100%; animation: y09-scroll 22s linear infinite; }
        @keyframes y09-scroll { to { transform: translateX(-100%); } }
        .y09-star { animation: y09-spin 6s linear infinite; }
        @keyframes y09-spin { to { transform: rotate(360deg); } }
        .y09-blink { animation: y09-blink 1s steps(2) infinite; }
        @keyframes y09-blink { 50% { opacity: .2; } }
        .y09-polaroid { transition: transform .35s cubic-bezier(.2,1.4,.4,1), box-shadow .35s; }
        .y09-polaroid:hover { transform: rotate(0deg) scale(1.08) !important; z-index: 5; box-shadow: 0 12px 28px rgba(0,0,0,.35) !important; }
        .y09-a { color: ${LINK}; text-decoration: underline; }
        .y09-a:hover { color: #ff3e8a; }
        .y09-buy:hover { filter: brightness(1.08); transform: translateY(-1px); }
        .y09-cols { display: grid; grid-template-columns: 210px 1fr; gap: 14px; }
        @media (max-width: 760px) { .y09-cols { grid-template-columns: 1fr; } .y09-side { order: 2; } }
        @media (prefers-reduced-motion: reduce) { .y09-marquee > span, .y09-star, .y09-blink { animation: none; } }
      `}</style>

      <div style={{ maxWidth: 980, margin: "0 auto", padding: "14px 10px 0" }}>
        {/* top strip */}
        <div style={{ display: "flex", justifyContent: "space-between", color: "#fff", fontSize: 11, marginBottom: 8, textShadow: "0 1px 1px rgba(0,0,0,.3)" }}>
          <button onClick={() => navigate("/map")} style={{ color: "#fff", textDecoration: "underline", fontSize: 11 }}>« {t("назад к карте эмоций", "back to the emotion map")}</button>
          <span>
            {t("Язык", "Language")}:{" "}
            {(["ru", "en"] as const).map((l) => (
              <button key={l} onClick={() => setLang(l)} style={{ color: "#fff", fontWeight: lang === l ? "bold" : "normal", textDecoration: "underline", marginLeft: 6, fontSize: 11 }}>{l === "ru" ? "Русский" : "English"}</button>
            ))}
          </span>
        </div>

        <div style={{ background: "#f4fafe", border: "1px solid #7fb2d8", borderRadius: 12, boxShadow: "0 0 24px rgba(0,40,80,.3)", overflow: "hidden" }}>
          {/* glossy header */}
          <header style={{ position: "relative", height: 150, background: "linear-gradient(#8fdc5a, #4caf2c 60%, #3c9a21)", overflow: "hidden" }}>
            <div style={{ position: "absolute", inset: "0 0 52% 0", background: "linear-gradient(rgba(255,255,255,.55), rgba(255,255,255,.12))", borderRadius: "0 0 50% 50% / 0 0 30% 30%" }} />
            <img src={perfume.heroImage} alt="" style={{ position: "absolute", right: 0, top: 0, height: "100%", width: "46%", objectFit: "cover", maskImage: "linear-gradient(90deg, transparent, #000 40%)", WebkitMaskImage: "linear-gradient(90deg, transparent, #000 40%)", opacity: 0.9 }} />
            <div style={{ position: "relative", padding: "26px 24px" }}>
              <h1 style={{ ...trebuchet, fontSize: "clamp(30px, 6vw, 50px)", fontWeight: "bold", fontStyle: "italic", color: "#fff", letterSpacing: -1, textShadow: "0 2px 0 #2d7a14, 0 4px 10px rgba(0,0,0,.3)", lineHeight: 1 }}>{perfume.name}</h1>
              <p style={{ color: "#f4ffe0", fontSize: 13, marginTop: 8, textShadow: "0 1px 0 rgba(0,0,0,.3)" }}>{pick(lang, perfume.tagline)} :)</p>
            </div>
            <div style={{ position: "absolute", left: "min(420px, 60%)", top: 18, width: 76, height: 76, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div className="y09-star" style={{ position: "absolute", inset: 0, background: "#ffde00", clipPath: "polygon(50% 0,61% 18%,82% 10%,80% 32%,100% 40%,85% 55%,96% 75%,74% 76%,66% 97%,50% 84%,34% 97%,26% 76%,4% 75%,15% 55%,0 40%,20% 32%,18% 10%,39% 18%)" }} />
              <span style={{ position: "relative", fontWeight: "bold", color: "#d40000", fontSize: 13, transform: "rotate(-12deg)" }}>NEW!</span>
            </div>
          </header>
          {/* tabs */}
          <nav style={{ display: "flex", gap: 3, padding: "0 12px", background: "linear-gradient(#3c9a21, #2f7f18)", flexWrap: "wrap" }}>
            {[[t("Главная", "Home"), "#y09-top"], [t("Аромат", "Fragrance"), "#y09-notes"], [t("Фотки", "Photos"), "#y09-photos"], [t("Гостевая", "Guestbook"), "#y09-guest"], [t("Купить", "Buy"), "#y09-buy"]].map(([label, href], i) => (
              <a key={href} href={href} style={{ padding: "6px 14px", marginTop: 5, borderRadius: "7px 7px 0 0", fontSize: 12, fontWeight: "bold", color: i === 0 ? "#2f7f18" : "#fff", background: i === 0 ? "#f4fafe" : "linear-gradient(rgba(255,255,255,.25), rgba(255,255,255,.05))", textDecoration: "none" }}>{label}</a>
            ))}
          </nav>
          {/* marquee */}
          <div className="y09-marquee" style={{ background: "#fffbd0", borderBottom: "1px solid #e8dc80", color: "#9a5b00", fontSize: 12, padding: "4px 0" }}>
            <span>☀ {t("ЛЕТО 2009 ☀ дача ☀ смородина ☀ светлячки ☀ никаких уроков до 1 сентября!!! ☀ добавь меня в друзья ☀ ", "SUMMER 2009 ☀ dacha ☀ blackcurrant ☀ fireflies ☀ no school until September!!! ☀ add me as a friend ☀ ")}{perfume.name.toUpperCase()} ☀</span>
          </div>

          <div id="y09-top" className="y09-cols" style={{ padding: 14 }}>
            {/* sidebar */}
            <aside className="y09-side" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <Box title={t("Мой профиль", "My profile")}>
                <img src={gallery[0] ?? perfume.heroImage} alt="" style={{ width: "100%", aspectRatio: "1", objectFit: "cover", border: "3px solid #fff", outline: "1px solid #ccc" }} />
                <p style={{ marginTop: 8, fontSize: 11, lineHeight: 1.6 }}>
                  <b>{t("Статус", "Status")}:</b> <i>{t("лето. дача. ничего не нужно :)", "summer. dacha. need nothing :)")}</i><br />
                  <b>{t("Настроение", "Mood")}:</b> {perfume.emotionalPath.map((e) => e.toLowerCase()).join(", ")}<br />
                  <b>{t("Откуда", "From")}:</b> {pick(lang, perfume.origin.location)}<br />
                  <span className="y09-blink" style={{ color: "#3aa21c" }}>●</span> {t("онлайн", "online")}
                </p>
              </Box>
              <Box title={t("Сейчас играет", "Now playing")} color="#e07bb5">
                <p style={{ fontSize: 11 }}>♫ {t("кассета без подписи (сторона Б)", "unlabelled cassette (side B)")}</p>
                <div style={{ display: "flex", gap: 2, alignItems: "end", height: 18, marginTop: 6 }}>
                  {[6, 12, 9, 16, 7, 13, 10, 15, 5, 11].map((h, i) => <span key={i} className="y09-blink" style={{ width: 6, height: h, background: "linear-gradient(#ff9ad5,#e0389a)", animationDelay: `${i * 110}ms` }} />)}
                </div>
              </Box>
              <Box title={t("Счётчик", "Counter")} color="#5a8fd0">
                <p style={{ fontSize: 11, textAlign: "center" }}>{t("Вы", "You are visitor")}</p>
                <div style={{ display: "flex", justifyContent: "center", gap: 2, margin: "4px 0" }}>
                  {visitor.split("").map((d, i) => <span key={i} style={{ fontFamily: "'Courier New', monospace", background: "#111", color: "#5f5", padding: "1px 4px", fontWeight: "bold", fontSize: 15, borderRadius: 2 }}>{d}</span>)}
                </div>
                <p style={{ fontSize: 11, textAlign: "center" }}>{t("-й посетитель!", "")}</p>
              </Box>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4, justifyContent: "center" }}>
                {["VALID XHTML", "MADE WITH NOTEPAD", "IE 7 OK", "RSS"].map((b, i) => (
                  <span key={b} style={{ width: 88, height: 31, fontSize: 8, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", textAlign: "center", border: "1px solid #666", background: ["linear-gradient(#fff,#ddd)", "linear-gradient(#ffe,#fc6)", "linear-gradient(#cdf,#58c)", "linear-gradient(#fd9,#f80)"][i], color: i === 2 ? "#fff" : "#333" }}>{b}</span>
                ))}
              </div>
            </aside>

            {/* main */}
            <main style={{ display: "flex", flexDirection: "column", gap: 14, minWidth: 0 }}>
              <FlashPlayer t={t} />

              <Box title={`${t("Запись от", "Post from")} 23.07.2009, 21:47`} color="#5a8fd0">
                <h2 style={{ ...trebuchet, fontSize: 22, color: LINK, fontWeight: "bold" }}>{t("это лето я не забуду никогда", "i will never forget this summer")}</h2>
                <p style={{ marginTop: 8, lineHeight: 1.7, fontSize: 13 }}>{pick(lang, perfume.description)}</p>
                <p style={{ marginTop: 8, fontSize: 11, color: "#777" }}>
                  {t("Настроение", "Mood")}: <b>{t("ностальгическое", "nostalgic")}</b> · {t("Музыка", "Music")}: <i>{t("кассета", "cassette")}</i> · <a className="y09-a" href="#y09-guest">{t("Комментарии", "Comments")} ({fragments.length})</a>
                </p>
              </Box>

              <div id="y09-notes" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14 }}>
                <Box title={t("Теги (ноты)", "Tags (notes)")} color="#e0a020">
                  <p style={{ lineHeight: 2, textAlign: "center" }}>
                    {notes.map((n, i) => (
                      <a key={n} className="y09-a" href="#y09-notes" style={{ fontSize: sizes.current[i], margin: "0 6px", color: ["#1a5fb4", "#d6339a", "#3a9a1c", "#e07b00"][i % 4], fontWeight: sizes.current[i] > 18 ? "bold" : "normal" }}>{n}</a>
                    ))}
                  </p>
                </Box>
                <Box title={t("Мой рейтинг", "My rating")} color="#e07bb5">
                  <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                    {perfume.radarAxes.map((a) => (
                      <div key={a.key}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
                          <b>{pick(lang, a.label)}</b>
                          <span style={{ color: "#f0a800", letterSpacing: 1 }}>{"★★★★★".slice(0, Math.round(a.value / 20))}<span style={{ color: "#ccc" }}>{"★★★★★".slice(Math.round(a.value / 20))}</span></span>
                        </div>
                        <div style={{ height: 12, borderRadius: 6, background: "#e8eef2", border: "1px solid #c4d2dc", overflow: "hidden", position: "relative" }}>
                          <div style={{ width: `${a.value}%`, height: "100%", background: "linear-gradient(#ffb3dc, #ff4fa3 55%, #e83390)" }} />
                          <div style={{ position: "absolute", inset: "0 0 50% 0", background: "rgba(255,255,255,.45)" }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </Box>
              </div>

              {gallery.length > 0 && (
                <Box title={`${t("Фотоальбом «Дача 2009»", "Photo album “Dacha 2009”")} (${gallery.length + 1})`} color="#7cc04b">
                  <div id="y09-photos" style={{ display: "flex", flexWrap: "wrap", gap: 18, justifyContent: "center", padding: "12px 0 6px" }}>
                    {[perfume.heroImage, ...gallery].map((src, i) => (
                      <figure key={src} className="y09-polaroid" style={{ margin: 0, background: "#fff", padding: "8px 8px 10px", boxShadow: "0 4px 10px rgba(0,0,0,.25)", transform: `rotate(${[-4, 3, -2, 5, -3][i % 5]}deg)`, width: 170, position: "relative" }}>
                        <img src={src} alt="" loading="lazy" style={{ width: "100%", aspectRatio: "1", objectFit: "cover", display: "block", filter: "saturate(1.15) contrast(1.05) sepia(.12)" }} />
                        <figcaption style={{ ...comic, marginTop: 6, minHeight: 30, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", fontSize: 12, lineHeight: 1.2, color: "#444" }}>{fragments[i % fragments.length]?.toLowerCase()}</figcaption>
                      </figure>
                    ))}
                  </div>
                </Box>
              )}

              <Box title={`${t("Гостевая книга", "Guestbook")} (${fragments.length})`} color="#5a8fd0">
                <div id="y09-guest" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {fragments.map((f, i) => (
                    <div key={i} style={{ display: "grid", gridTemplateColumns: "48px 1fr", gap: 10, padding: 8, background: i % 2 ? "#fff" : "#f2f8fc", border: "1px solid #dbe8f1", borderRadius: 6 }}>
                      <img src={[perfume.heroImage, ...gallery][(i + 1) % (gallery.length + 1)]} alt="" style={{ width: 48, height: 48, objectFit: "cover", border: "1px solid #bbb" }} />
                      <div>
                        <p style={{ fontSize: 11 }}><a className="y09-a" href="#y09-guest"><b>{USERS[i % USERS.length]}</b></a> <span style={{ color: "#999" }}>· {DATES[i % DATES.length]}</span></p>
                        <p style={{ marginTop: 3 }}>{f} {["))))", ":'(", "<3", "^_^", "..."][i % 5]}</p>
                        <p style={{ fontSize: 10, marginTop: 3 }}><a className="y09-a" href="#y09-guest">{t("Ответить", "Reply")}</a></p>
                      </div>
                    </div>
                  ))}
                </div>
              </Box>

              <div id="y09-buy" style={{ position: "relative", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 14, padding: 18, borderRadius: 10, border: "2px dashed #ff8ac4", background: "repeating-linear-gradient(45deg, #fff6fb 0 12px, #ffeef7 12px 24px)" }}>
                <div>
                  <p style={{ ...trebuchet, fontSize: 20, fontWeight: "bold", color: "#d6339a" }}>{t("Хочешь так же пахнуть летом?", "Want to smell like summer too?")}</p>
                  <p style={{ fontSize: 11, color: "#666", marginTop: 4 }}>Extrait de parfum · {perfume.releaseDate} · {perfume.origin.coords}</p>
                </div>
                <button className="y09-buy" onClick={() => setOpen(true)} style={{ ...skin.button, fontSize: 20, padding: "12px 34px", borderRadius: 26, position: "relative", transition: "all .15s" }}>
                  {t("Купить сейчас!", "Buy now!")}
                  <span className="y09-blink" style={{ position: "absolute", top: -12, right: -14, background: "#ff2a2a", color: "#fff", fontSize: 10, padding: "2px 6px", borderRadius: 8, transform: "rotate(12deg)" }}>{t("ХИТ!", "HOT!")}</span>
                </button>
              </div>
            </main>
          </div>

          <footer style={{ borderTop: "1px solid #cfe1ee", padding: "12px 14px", fontSize: 10, color: "#789", textAlign: "center", background: "linear-gradient(#f4fafe, #e3f0f8)" }}>
            © 2009 Silentium · {t("Сайт лучше всего смотрится в Internet Explorer 7 при разрешении 1024×768", "Best viewed in Internet Explorer 7 at 1024×768")} · <a className="y09-a" href="#y09-top">{t("наверх", "top")} ↑</a>
          </footer>
        </div>
      </div>

      <RequestDialog open={open} onClose={() => setOpen(false)} perfumeName={perfume.name} skin={skin} />
    </div>
  );
}
