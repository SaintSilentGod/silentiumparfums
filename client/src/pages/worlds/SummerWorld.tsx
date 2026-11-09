// Summer of 2009 — a personal blog from the summer of 2009, opened on an old desktop.
// A CRT switches on and a dial-up modem connects; behind the browser window the desktop wallpaper is a
// dacha meadow; the blog has a glossy header, a marquee, a profile with a cat, an mp3 player whose
// playlist is the notes, a Flash player with the bottle, a post about the scent, a compact digital
// camera you click through for the drydown, a poll for the strength, a photo album with a lightbox,
// a guestbook you can sign, and a candybar phone that types an SMS to send the request.

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useLocation } from "wouter";
import { useLang } from "@/contexts/LangContext";
import Bottle3D from "@/components/Bottle3D";
import RequestDialog, { type DialogSkin } from "@/components/RequestDialog";
import { useReveal } from "@/lib/useReveal";
import { fragmentText, pick, prefersReducedMotion, type WorldProps } from "./shared";

const font: CSSProperties = { fontFamily: "Verdana, Tahoma, 'Trebuchet MS', sans-serif" };
const trebuchet: CSSProperties = { fontFamily: "'Trebuchet MS', Tahoma, Verdana, sans-serif" };
const comic: CSSProperties = { fontFamily: "'Comic Sans MS', 'Comic Neue', 'Trebuchet MS', cursive" };
const tahoma: CSSProperties = { fontFamily: "Tahoma, Verdana, sans-serif" };
const stamp: CSSProperties = { fontFamily: "'Courier New', 'JetBrains Mono', monospace", fontWeight: "bold", color: "#ff9a2a", textShadow: "0 0 4px rgba(255,120,0,.8), 1px 1px 0 rgba(0,0,0,.5)", letterSpacing: ".06em" };
const LINK = "#1a5fb4";
const IMG = "/images/summer-of-2009";

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

// ── The boot: a CRT switches on and a dial-up modem connects (once per session) ──
function Boot({ t }: { t: (ru: string, en: string) => string }) {
  const [phase, setPhase] = useState<"crt" | "dial" | "gone">(() => {
    try { if (sessionStorage.getItem("y09-boot") || prefersReducedMotion()) return "gone"; } catch { /* private mode */ }
    return "crt";
  });
  const [pct, setPct] = useState(0);
  const lines = [t("Набор номера...", "Dialing..."), t("Проверка имени пользователя и пароля...", "Verifying username and password..."), t("Регистрация компьютера в сети...", "Registering your computer on the network..."), t("Подключено на скорости 56,6 Кбит/с", "Connected at 56.6 Kbps")];
  useEffect(() => {
    if (phase === "gone") return;
    try { sessionStorage.setItem("y09-boot", "1"); } catch { /* ignore */ }
    const a = window.setTimeout(() => setPhase("dial"), 900);
    let raf = 0; const t0 = performance.now() + 900;
    const step = (now: number) => {
      const p = Math.max(0, Math.min(100, ((now - t0) / 2600) * 100));
      setPct(p);
      if (p < 100) raf = requestAnimationFrame(step); else window.setTimeout(() => setPhase("gone"), 450);
    };
    raf = requestAnimationFrame(step);
    return () => { clearTimeout(a); cancelAnimationFrame(raf); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  if (phase === "gone") return null;
  const line = lines[Math.min(lines.length - 1, Math.floor(pct / 26))];
  return (
    <div onClick={() => setPhase("gone")} style={{ position: "fixed", inset: 0, zIndex: 1000, background: "#000", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
      {phase === "crt" && <div className="y09-crt" />}
      {phase === "dial" && (
        <div style={{ ...tahoma, width: "min(380px, 90vw)", background: "#ece9d8", border: "1px solid #0a246a", borderRadius: "7px 7px 2px 2px", boxShadow: "0 10px 40px rgba(0,0,0,.6)", overflow: "hidden", animation: "y09-pop .25s ease-out" }}>
          <div style={{ background: "linear-gradient(#3a8cf0, #1a5fd0 60%, #1450b8)", color: "#fff", fontSize: 12, fontWeight: "bold", padding: "5px 8px", display: "flex", justifyContent: "space-between" }}>
            <span>{t("Подключение к Интернету", "Connecting to the Internet")}</span><span style={{ background: "#d9452c", borderRadius: 3, padding: "0 5px", border: "1px solid #fff" }}>×</span>
          </div>
          <div style={{ padding: "18px 16px 16px", fontSize: 12, color: "#000" }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <span style={{ fontSize: 30 }}>☎</span>
              <div style={{ flex: 1 }}>
                <p>{line}</p>
                <div style={{ height: 14, marginTop: 8, border: "1px solid #888", background: "#fff", padding: 1, display: "flex", gap: 2 }}>
                  {Array.from({ length: 20 }, (_, i) => <span key={i} style={{ flex: "0 0 4.2%", background: i < pct / 5 ? "linear-gradient(#7fe07f, #2fb52f)" : "transparent" }} />)}
                </div>
                <p style={{ marginTop: 8, fontSize: 10, color: "#555", fontStyle: "italic" }}>{t("пиииу-кшшшш-дзынь-дзынь...", "beeeeoo-kshhhh-ding-ding...")}</p>
              </div>
            </div>
            <p style={{ marginTop: 12, fontSize: 10, color: "#666", textAlign: "right" }}>{t("нажмите, чтобы пропустить", "click to skip")}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function Box({ title, children, color = "#7cc04b", style, id }: { title: string; children: React.ReactNode; color?: string; style?: CSSProperties; id?: string }) {
  return (
    <div id={id} style={{ background: "#fff", border: "1px solid #b8d4e8", borderRadius: 8, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,.08)", ...style }}>
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

const glossy = (from: string, to: string): CSSProperties => ({ background: `linear-gradient(${from}, ${to} 50%, ${shade(to.startsWith("#") ? to : "#888888")} 51%, ${to})` });

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
        <span>▣ bottle_3d.swf</span><span>Flash Player 10</span>
      </div>
      <div style={{ position: "relative", height: 380, overflow: "hidden", background: "#8fd0ff" }}>
        <img src={`${IMG}/wallpaper.webp`} alt="" aria-hidden style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 30%" }} />
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
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, color: "#fff", fontSize: 12, background: "rgba(0,40,80,.35)", textShadow: "0 1px 2px #000" }}>
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

// ── mp3 player: the notes are the playlist ──
const DUR = ["3:12", "4:05", "2:48", "3:33", "4:21", "3:07", "2:59", "5:14", "3:41", "4:02"];

function Player({ notes, t }: { notes: string[]; t: (ru: string, en: string) => string }) {
  const [cur, setCur] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [sec, setSec] = useState(0);
  useEffect(() => {
    if (!playing || prefersReducedMotion()) return;
    const id = window.setInterval(() => setSec((s) => { if (s >= 3) { setCur((c) => (c + 1) % notes.length); return 0; } return s + 1; }), 1000);
    return () => clearInterval(id);
  }, [playing, notes.length]);
  return (
    <div style={{ background: "linear-gradient(#3b3f4a, #23262d)", border: "1px solid #111", borderRadius: 6, padding: 6, color: "#9dff6a", ...tahoma, boxShadow: "inset 0 1px 0 rgba(255,255,255,.15)" }}>
      <div style={{ display: "flex", gap: 6 }}>
        <div style={{ ...stamp, color: "#9dff6a", textShadow: "0 0 5px rgba(120,255,80,.6)", fontSize: 18, background: "#000", padding: "2px 6px", borderRadius: 3 }}>0:{String(sec * 7 + 13).padStart(2, "0")}</div>
        <div className="y09-marquee" style={{ flex: 1, background: "#000", borderRadius: 3, fontSize: 10, padding: "5px 4px", color: "#9dff6a" }}>
          <span key={cur}>{String(cur + 1).padStart(2, "0")}. {notes[cur]} — summer_2009.mp3 ({DUR[cur % DUR.length]}) *** </span>
        </div>
      </div>
      <div style={{ display: "flex", gap: 2, alignItems: "end", height: 22, margin: "6px 2px" }}>
        {Array.from({ length: 16 }, (_, i) => <span key={i} className={playing ? "y09-eq" : undefined} style={{ flex: 1, height: playing ? undefined : 3, background: "linear-gradient(#ff4a3a, #ffd400 40%, #3ce03c)", animationDelay: `${-((i * 137) % 900)}ms`, animationDuration: `${500 + ((i * 53) % 400)}ms` }} />)}
      </div>
      <div style={{ display: "flex", gap: 3, marginBottom: 6 }}>
        {[["⏮", () => setCur((c) => (c - 1 + notes.length) % notes.length)], [playing ? "❚❚" : "▶", () => setPlaying((p) => !p)], ["⏹", () => { setPlaying(false); setSec(0); }], ["⏭", () => setCur((c) => (c + 1) % notes.length)]].map(([l, fn], i) => (
          <button key={i} onClick={fn as () => void} style={{ flex: 1, fontSize: 10, padding: "2px 0", color: "#ddd", background: "linear-gradient(#6a6f7a, #3a3e46)", border: "1px solid #111", borderRadius: 3 }}>{l as string}</button>
        ))}
      </div>
      <ol style={{ listStyle: "none", margin: 0, padding: 0, background: "#000", borderRadius: 3, fontSize: 10, maxHeight: 170, overflow: "auto" }}>
        {notes.map((n, i) => (
          <li key={n} onClick={() => { setCur(i); setSec(0); setPlaying(true); }} style={{ display: "flex", justifyContent: "space-between", gap: 6, padding: "2px 5px", cursor: "pointer", color: i === cur ? "#fff" : "#2fd02f", background: i === cur ? "#1a3fa0" : "transparent" }}>
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{i + 1}. {n}</span><span>{DUR[i % DUR.length]}</span>
          </li>
        ))}
      </ol>
      <p style={{ fontSize: 9, color: "#888", marginTop: 4, textAlign: "center" }}>{t("плейлист = ноты аромата", "playlist = the notes")}</p>
    </div>
  );
}

// ── The drydown on a compact digital camera ──
const STAGE_NOTES: Record<"ru" | "en", string[][]> = {
  ru: [["Лист чёрной смородины", "Зелёные ноты", "Зелёное яблоко", "Конопля"], ["Жасмин", "Турецкая роза", "Воздушные ноты"], ["Белый мускус", "Iso E Super", "Патчули"]],
  en: [["Blackcurrant Leaf", "Green Notes", "Green Apple", "Cannabis"], ["Jasmine", "Turkish Rose", "Airy Notes"], ["White Musk", "Iso E Super", "Patchouli"]],
};
const STAMPS = ["27 07 2009  09:14", "27 07 2009  14:52", "27 07 2009  21:38"];
const CAM = { l: 0.067, t: 0.173, w: 0.656, h: 0.746 }; // the LCD inside camera.webp, fractions of the image
const PAD = { left: { x: 0.792, y: 0.602 }, right: { x: 0.913, y: 0.602 } }; // the arrows on its control pad

function Camera({ stages, lang, t }: { stages: { when: string; text: string }[]; lang: "ru" | "en"; t: (ru: string, en: string) => string }) {
  const [i, setI] = useState(0);
  const [flash, setFlash] = useState(0);
  const { ref, visible } = useReveal();
  const touched = useRef(false);
  useEffect(() => {
    if (!visible || prefersReducedMotion()) return;
    const id = window.setInterval(() => { if (!touched.current) setI((x) => (x + 1) % 3); }, 4200);
    return () => clearInterval(id);
  }, [visible]);
  const go = (d: number) => { touched.current = true; setI((x) => (x + d + 3) % 3); setFlash((f) => f + 1); };
  return (
    <div ref={ref} className="y09-cam" style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.1fr) minmax(0, .9fr)", gap: 16, alignItems: "center" }}>
      <div>
        <div style={{ position: "relative", aspectRatio: "900 / 520" }}>
          <img src={`${IMG}/camera.webp`} alt={t("Цифровой фотоаппарат", "A digital camera")} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain", filter: "drop-shadow(0 8px 14px rgba(0,0,0,.35))" }} />
          <div style={{ position: "absolute", left: `${CAM.l * 100}%`, top: `${CAM.t * 100}%`, width: `${CAM.w * 100}%`, height: `${CAM.h * 100}%`, overflow: "hidden", background: "#000", borderRadius: 2 }}>
            {[1, 2, 3].map((n, k) => <img key={n} src={`${IMG}/stage-${n}.webp`} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: i === k ? 1 : 0 }} />)}
            <span style={{ ...stamp, position: "absolute", right: "4%", bottom: "4%", fontSize: "clamp(9px, 1.3vw, 13px)" }}>{STAMPS[i]}</span>
            <span style={{ position: "absolute", left: "4%", top: "4%", fontSize: "clamp(8px, 1vw, 11px)", color: "#fff", textShadow: "0 1px 1px #000", ...tahoma }}>▶ {i + 1}/3 · IMG_07{27 + i * 3}.JPG</span>
            <span style={{ position: "absolute", right: "4%", top: "4%", fontSize: "clamp(8px, 1vw, 11px)", color: "#fff", textShadow: "0 1px 1px #000" }}>▮▮▯</span>
            {flash > 0 && <span key={flash} className="y09-flash" />}
          </div>
          {/* the real arrows on the camera's pad work too */}
          {([["left", -1], ["right", 1]] as const).map(([k, d]) => <button key={k} onClick={() => go(d)} aria-label={d < 0 ? t("Предыдущий снимок", "Previous shot") : t("Следующий снимок", "Next shot")} className="y09-pad" style={{ left: `${PAD[k].x * 100}%`, top: `${PAD[k].y * 100}%` }} />)}
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 6 }}>
          <button onClick={() => go(-1)} className="y09-btn" aria-label={t("Предыдущий снимок", "Previous shot")}>◀</button>
          <button onClick={() => go(1)} className="y09-btn" aria-label={t("Следующий снимок", "Next shot")}>▶</button>
        </div>
      </div>
      <div>
        <p style={{ fontSize: 11, color: "#888" }}>{t("Снимок", "Shot")} {i + 1} {t("из", "of")} 3</p>
        <h3 style={{ ...trebuchet, fontSize: 20, fontWeight: "bold", color: LINK, marginTop: 4 }}>{stages[i].when}</h3>
        <p style={{ marginTop: 8, lineHeight: 1.65 }}>{stages[i].text}</p>
        <p style={{ marginTop: 8, fontSize: 11, overflowWrap: "anywhere" }}>{STAGE_NOTES[lang][i].map((n) => <a key={n} className="y09-a" href="#y09-player" style={{ marginRight: 8 }}>#{n.toLowerCase().replace(/\s/g, "_")}</a>)}</p>
      </div>
    </div>
  );
}

// ── The poll: vote, then the results slide out ──
function Poll({ facets, lang, t }: { facets: { label: { ru: string; en: string }; value: number }[]; lang: "ru" | "en"; t: (ru: string, en: string) => string }) {
  const [pickI, setPick] = useState<number | null>(null);
  const [voted, setVoted] = useState(false);
  const [grow, setGrow] = useState(false);
  useEffect(() => { if (voted) { const id = requestAnimationFrame(() => setGrow(true)); return () => cancelAnimationFrame(id); } }, [voted]);
  return (
    <div>
      <p style={{ fontWeight: "bold", marginBottom: 8 }}>{t("Чего в нём больше всего?", "What does it hold the most of?")}</p>
      {!voted ? (
        <>
          {facets.map((f, i) => (
            <label key={i} style={{ display: "flex", alignItems: "center", gap: 6, padding: "3px 0", cursor: "pointer" }}>
              <input type="radio" name="y09-poll" checked={pickI === i} onChange={() => setPick(i)} /> {pick(lang, f.label)}
            </label>
          ))}
          <button onClick={() => setVoted(true)} className="y09-btn" style={{ marginTop: 8, padding: "4px 16px" }}>{t("Голосовать", "Vote")}</button>
          <span style={{ fontSize: 10, color: "#999", marginLeft: 8 }}><a className="y09-a" href="#y09-poll" onClick={(e) => { e.preventDefault(); setVoted(true); }}>{t("результаты", "results")}</a></span>
        </>
      ) : (
        <>
          {facets.map((f, i) => (
            <div key={i} style={{ marginBottom: 7 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}><span>{pick(lang, f.label)}{pickI === i ? " ✔" : ""}</span><b>{f.value}%</b></div>
              <div style={{ position: "relative", height: 12, borderRadius: 6, background: "#e8eef2", border: "1px solid #c4d2dc", overflow: "hidden" }}>
                <div style={{ width: grow ? `${f.value}%` : "0%", height: "100%", background: i % 2 ? "linear-gradient(#ffb3dc, #ff4fa3 55%, #e83390)" : "linear-gradient(#c6f08f, #6cc52f 55%, #4fae1c)", transition: `width 1.2s cubic-bezier(.2,1,.3,1) ${i * 90}ms` }} />
                <div style={{ position: "absolute", inset: "0 0 50% 0", background: "rgba(255,255,255,.45)" }} />
              </div>
            </div>
          ))}
          <p style={{ fontSize: 10, color: "#888", marginTop: 6 }}>{t("Всего голосов", "Total votes")}: {1337 + (pickI !== null ? 1 : 0)} · {t("спасибо, что проголосовали!", "thanks for voting!")}</p>
        </>
      )}
    </div>
  );
}

// ── Photo album with a lightbox ──
const PHOTOS = [1, 2, 3, 4, 5, 6].map((i) => `${IMG}/photo-${i}.webp`);
const PHOTO_STAMPS = ["24 07 2009", "25 07 2009", "26 07 2009", "28 07 2009", "29 07 2009", "31 07 2009"];

function Album({ captions, t }: { captions: string[]; t: (ru: string, en: string) => string }) {
  const [open, setOpen] = useState<number | null>(null);
  useEffect(() => {
    if (open === null) return;
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
      if (e.key === "ArrowRight") setOpen((o) => (o === null ? o : (o + 1) % PHOTOS.length));
      if (e.key === "ArrowLeft") setOpen((o) => (o === null ? o : (o - 1 + PHOTOS.length) % PHOTOS.length));
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [open]);
  return (
    <>
      <div className="y09-album" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
        {PHOTOS.map((src, i) => (
          <button key={src} onClick={() => setOpen(i)} className="y09-thumb" style={{ position: "relative", padding: 4, background: "#fff", border: "1px solid #ccc", boxShadow: "0 2px 4px rgba(0,0,0,.15)", cursor: "zoom-in" }}>
            <img src={src} alt={captions[i]} loading="lazy" style={{ display: "block", width: "100%", aspectRatio: "4 / 3", objectFit: "cover" }} />
            <span style={{ ...stamp, position: "absolute", right: 8, bottom: 26, fontSize: 9 }}>{PHOTO_STAMPS[i]}</span>
            <span style={{ display: "block", fontSize: 10, color: LINK, textDecoration: "underline", marginTop: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>IMG_{String(2731 + i * 17)}.JPG</span>
          </button>
        ))}
      </div>
      {open !== null && (
        <div onClick={() => setOpen(null)} style={{ position: "fixed", inset: 0, zIndex: 900, background: "rgba(0,0,0,.82)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ position: "relative", background: "#fff", padding: 10, borderRadius: 4, maxWidth: "min(900px, 94vw)", width: "100%", animation: "y09-pop .25s ease-out", ...font }}>
            <div style={{ position: "relative" }}>
              <img src={PHOTOS[open]} alt={captions[open]} style={{ display: "block", width: "100%", maxHeight: "70vh", objectFit: "contain", background: "#000" }} />
              <span style={{ ...stamp, position: "absolute", right: 14, bottom: 12, fontSize: 16 }}>{PHOTO_STAMPS[open]}</span>
              <button onClick={() => setOpen((open - 1 + PHOTOS.length) % PHOTOS.length)} className="y09-lb-nav" style={{ left: 0 }} aria-label={t("Назад", "Previous")}>‹</button>
              <button onClick={() => setOpen((open + 1) % PHOTOS.length)} className="y09-lb-nav" style={{ right: 0 }} aria-label={t("Вперёд", "Next")}>›</button>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8, fontSize: 12 }}>
              <span><b>{captions[open]}</b><br /><span style={{ color: "#777", fontSize: 11 }}>{t("Изображение", "Image")} {open + 1} {t("из", "of")} {PHOTOS.length}</span></span>
              <button onClick={() => setOpen(null)} style={{ fontSize: 11, color: "#555" }}>{t("Закрыть", "Close")} ✕</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── Guestbook you can sign ──
const USERS = ["~*Ka$ka*~", "xXx_DaNiLa_xXx", "летонавсегда", "sweet_berry_89", "ПрИнЦеСсКа", "DJ_Mosquito"];
const DATES = ["24.07.2009 22:13", "25.07.2009 01:47", "27.07.2009 19:02", "29.07.2009 23:58", "31.07.2009 14:20"];
const SMILES = [":)", ";)", ":D", "<3", "^_^", ":'("];

function Guestbook({ fragments, t }: { fragments: string[]; t: (ru: string, en: string) => string }) {
  const [mine, setMine] = useState<{ name: string; text: string }[]>([]);
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const entries = [...fragments.map((f, i) => ({ name: USERS[i % USERS.length], text: `${f} ${["))))", ":'(", "<3", "^_^", "..."][i % 5]}`, date: DATES[i % DATES.length], av: i })), ...mine.map((m, i) => ({ ...m, date: t("только что", "just now"), av: fragments.length + i }))];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {entries.map((e, i) => (
        <div key={i} style={{ display: "grid", gridTemplateColumns: "48px 1fr", gap: 10, padding: 8, background: i % 2 ? "#fff" : "#f2f8fc", border: "1px solid #dbe8f1", borderRadius: 6 }}>
          <img src={PHOTOS[e.av % PHOTOS.length]} alt="" style={{ width: 48, height: 48, objectFit: "cover", border: "1px solid #bbb" }} />
          <div>
            <p style={{ fontSize: 11 }}><a className="y09-a" href="#y09-guest"><b>{e.name}</b></a> <span style={{ color: "#999" }}>· {e.date}</span></p>
            <p style={{ marginTop: 3, wordBreak: "break-word" }}>{e.text}</p>
          </div>
        </div>
      ))}
      <form onSubmit={(ev) => { ev.preventDefault(); if (!text.trim()) return; setMine((m) => [...m, { name: name.trim() || t("Гость", "Guest"), text: text.trim().slice(0, 300) }]); setText(""); }} style={{ padding: 10, border: "1px dashed #9bc", borderRadius: 6, background: "#fbfdff" }}>
        <p style={{ fontWeight: "bold", fontSize: 12, marginBottom: 6 }}>{t("Оставить запись", "Sign the guestbook")}</p>
        <input value={name} onChange={(e) => setName(e.target.value.slice(0, 30))} placeholder={t("Ник", "Nickname")} style={{ width: "100%", marginBottom: 6, border: "1px solid #9bb", padding: "4px 6px", fontSize: 12, ...font }} />
        <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder={t("Твоё лето 2009...", "Your summer of 2009...")} rows={2} style={{ width: "100%", border: "1px solid #9bb", padding: "4px 6px", fontSize: 12, resize: "vertical", ...font }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6, gap: 6, flexWrap: "wrap" }}>
          <span>{SMILES.map((s) => <button type="button" key={s} onClick={() => setText((x) => `${x} ${s}`)} style={{ marginRight: 4, fontSize: 12, padding: "0 4px", border: "1px solid #ddd", borderRadius: 3, background: "#fff" }}>{s}</button>)}</span>
          <button type="submit" className="y09-btn" style={{ padding: "3px 14px" }}>{t("Добавить", "Add")}</button>
        </div>
      </form>
    </div>
  );
}

// ── The request: an SMS typed on a candybar phone ──
const SCREEN = { l: 0.175, t: 0.153, w: 0.643, h: 0.302 }; // the phone screen inside phone.webp
const T9 = "абвгдежзийклмнопрстуфхцчшщъыьэюя";

function Phone({ onSent, t }: { onSent: () => void; t: (ru: string, en: string) => string }) {
  const msg = t("хочу этот аромат!!", "i want this scent!!");
  const [typed, setTyped] = useState("");
  const [ghost, setGhost] = useState("");
  const [state, setState] = useState<"idle" | "typing" | "sending" | "sent">("idle");
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const run = () => {
    if (state === "typing" || state === "sending") return;
    timers.current.forEach(clearTimeout); timers.current = [];
    if (prefersReducedMotion()) { onSent(); return; }
    setState("typing"); setTyped(""); setGhost("");
    let at = 0;
    msg.split("").forEach((ch, i) => {
      // T9: a couple of wrong letters flicker before the right one lands
      [0, 1].forEach((k) => timers.current.push(window.setTimeout(() => setGhost(T9[(i * 7 + k * 3) % T9.length]), at + k * 45)));
      at += 110;
      timers.current.push(window.setTimeout(() => { setGhost(""); setTyped(msg.slice(0, i + 1)); }, at));
    });
    timers.current.push(window.setTimeout(() => setState("sending"), at + 400));
    timers.current.push(window.setTimeout(() => setState("sent"), at + 1500));
    timers.current.push(window.setTimeout(() => { onSent(); setState("idle"); }, at + 2400));
  };
  return (
    <button onClick={run} className="y09-phone" aria-label={t("Отправить СМС и оставить заявку", "Send an SMS and leave a request")} style={{ position: "relative", width: "min(210px, 56vw)", aspectRatio: "389 / 900", background: "transparent", cursor: "pointer" }}>
      <img src={`${IMG}/phone.webp`} alt={t("Мобильный телефон", "A mobile phone")} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain", filter: "drop-shadow(0 12px 18px rgba(0,0,0,.35))" }} />
      <div style={{ position: "absolute", left: `${SCREEN.l * 100}%`, top: `${SCREEN.t * 100}%`, width: `${SCREEN.w * 100}%`, height: `${SCREEN.h * 100}%`, background: "linear-gradient(#c4dcae, #a9c48e)", borderRadius: 2, padding: "7%", color: "#1d2a12", fontFamily: "'Courier New', monospace", fontWeight: "bold", fontSize: "clamp(12px, 3.4vw, 15px)", lineHeight: 1.3, textAlign: "left", overflow: "hidden", boxShadow: "inset 0 0 8px rgba(0,0,0,.35)" }}>
        {state === "idle" && <><p style={{ fontWeight: "bold" }}>{t("Новое СМС", "New SMS")}</p><p style={{ marginTop: 4 }}>{t("Нажми, чтобы написать", "Tap to write")} ▸</p><p style={{ position: "absolute", left: "6%", bottom: "6%", fontSize: "85%" }}>14:32 ▮▮▮▯</p></>}
        {state === "typing" && <p style={{ wordBreak: "break-all" }}>{typed}<span style={{ background: "#1d2a12", color: "#b8d48a" }}>{ghost || " "}</span><span className="y09-blink">|</span></p>}
        {state === "sending" && <p>{t("Отправка...", "Sending...")}<br />▓▓▓▓▓░░░</p>}
        {state === "sent" && <p style={{ fontWeight: "bold" }}>{t("Сообщение отправлено", "Message sent")} ✉</p>}
      </div>
    </button>
  );
}

export default function SummerWorld({ perfume }: WorldProps) {
  const [, navigate] = useLocation();
  const { lang, setLang, t } = useLang();
  const [open, setOpen] = useState(false);
  const g = perfume.guide!;
  const Lp = (v: { ru: string; en: string }) => pick(lang, v);
  const notes = perfume.scentNotes.all ? pick(lang, perfume.scentNotes.all) : [];
  const fragments = pick(lang, perfume.memoryFragments).map(fragmentText);
  const stages = g.drydown.map((d) => ({ when: Lp(d.when), text: Lp(d.text) }));
  const [visitor] = useState(() => String(427 + Math.floor(Math.random() * 40)).padStart(6, "0"));
  const clock = useMemo(() => "14:32", []);

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

  const facts: [string, string][] = [
    [t("Стойкость", "Longevity"), Lp(g.longevity)],
    [t("Шлейф", "Sillage"), Lp(g.sillage)],
    [t("Сезон", "Season"), Lp(g.season)],
    [t("Когда носить", "When to wear"), Lp(g.time)],
  ];

  return (
    <div style={{ ...font, minHeight: "100vh", color: "#222", fontSize: 13, paddingBottom: 60, overflowX: "clip", position: "relative" }}>
      {/* the desktop wallpaper */}
      <div aria-hidden style={{ position: "fixed", inset: 0, zIndex: -1, backgroundImage: `url(${IMG}/wallpaper.webp)`, backgroundSize: "cover", backgroundPosition: "50% 60%" }} />
      <GlitterTrail />
      <Boot t={t} />
      <style>{`
        .y09-marquee { overflow: hidden; white-space: nowrap; }
        .y09-marquee > span { display: inline-block; padding-left: 100%; animation: y09-scroll 22s linear infinite; }
        @keyframes y09-scroll { to { transform: translateX(-100%); } }
        .y09-star { animation: y09-spin 6s linear infinite; }
        @keyframes y09-spin { to { transform: rotate(360deg); } }
        .y09-blink { animation: y09-blink 1s steps(2) infinite; }
        @keyframes y09-blink { 50% { opacity: .2; } }
        .y09-eq { height: 30%; animation: y09-eq ease-in-out infinite alternate; }
        @keyframes y09-eq { from { height: 12%; } to { height: 100%; } }
        .y09-a { color: ${LINK}; text-decoration: underline; }
        .y09-a:hover { color: #ff3e8a; }
        .y09-btn { font-family: Tahoma, Verdana, sans-serif; font-size: 12px; padding: 3px 12px; color: #000; background: linear-gradient(#ffffff, #ece9d8); border: 1px solid #7a8a99; border-radius: 3px; box-shadow: inset 0 -1px 0 rgba(0,0,0,.1); cursor: pointer; }
        .y09-btn:hover { border-color: #e8a33a; box-shadow: inset 0 0 0 1px #f7c76b; }
        .y09-thumb { transition: transform .2s; } .y09-thumb:hover { transform: scale(1.04) rotate(-1deg); z-index: 2; }
        .y09-lb-nav { position: absolute; top: 0; bottom: 0; width: 22%; color: #fff; font-size: 54px; text-shadow: 0 2px 6px #000; opacity: 0; transition: opacity .2s; background: transparent; }
        .y09-lb-nav:hover { opacity: 1; }
        .y09-flash { position: absolute; inset: 0; background: #fff; animation: y09-flashk .45s ease-out forwards; pointer-events: none; }
        @keyframes y09-flashk { from { opacity: .95; } to { opacity: 0; } }
        .y09-crt { width: 100%; height: 3px; background: #fff; box-shadow: 0 0 30px 8px rgba(255,255,255,.7); animation: y09-crt .9s ease-out forwards; }
        @keyframes y09-crt { 0% { transform: scaleX(0); } 40% { transform: scaleX(1); height: 3px; } 100% { transform: scaleX(1); height: 100vh; opacity: .2; } }
        @keyframes y09-pop { from { transform: scale(.85); opacity: 0; } to { transform: none; opacity: 1; } }
        .y09-pad { position: absolute; width: 7%; aspect-ratio: 1; transform: translate(-50%, -50%); border-radius: 50%; background: transparent; cursor: pointer; }
        .y09-pad:hover { background: radial-gradient(circle, rgba(90,170,255,.45), transparent 70%); }
        .y09-phone { transition: transform .2s; } .y09-phone:hover { transform: rotate(-3deg) translateY(-4px); }
        .y09-cols { display: grid; grid-template-columns: 220px 1fr; gap: 14px; }
        @media (max-width: 760px) {
          .y09-cols { grid-template-columns: minmax(0, 1fr); } .y09-side { order: 2; min-width: 0; }
          .y09-cam { grid-template-columns: minmax(0, 1fr) !important; }
          .y09-album { grid-template-columns: repeat(2, 1fr) !important; }
          .y09-chrome-extra { display: none; }
        }
        @media (prefers-reduced-motion: reduce) { .y09-marquee > span, .y09-star, .y09-blink, .y09-eq { animation: none; } }
      `}</style>

      <div style={{ maxWidth: 1020, margin: "0 auto", padding: "18px 8px 0" }}>
        {/* the browser window */}
        <div style={{ border: "1px solid #0831d9", borderRadius: "8px 8px 0 0", overflow: "clip", boxShadow: "0 10px 40px rgba(0,30,80,.45)", background: "#ece9d8" }}>
          <div style={{ ...tahoma, display: "flex", alignItems: "center", gap: 8, padding: "5px 6px 5px 10px", color: "#fff", fontSize: 12, fontWeight: "bold", background: "linear-gradient(#3a8cf0, #1a5fd0 45%, #1450b8)", textShadow: "1px 1px 0 rgba(0,0,0,.4)" }}>
            <span>🌐</span><span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{perfume.name} :: {t("мой блог", "my blog")} — {t("Интернет-обозреватель", "Web Browser")}</span>
            {["_", "□"].map((b) => <span key={b} style={{ width: 20, height: 20, borderRadius: 3, border: "1px solid #fff", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(#5ea0f5, #2a6fe0)", fontSize: 11 }}>{b}</span>)}
            <button onClick={() => navigate("/map")} title={t("Закрыть и вернуться к карте", "Close and go back to the map")} style={{ width: 20, height: 20, borderRadius: 3, border: "1px solid #fff", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(#f08a6a, #d9452c)", color: "#fff", fontSize: 12, fontWeight: "bold" }}>×</button>
          </div>
          <div style={{ ...tahoma, display: "flex", alignItems: "center", gap: 6, padding: "4px 8px", fontSize: 11, borderBottom: "1px solid #c5c2b2" }}>
            <button onClick={() => navigate("/map")} className="y09-btn" style={{ padding: "2px 8px" }}>← {t("Назад", "Back")}</button>
            <span className="y09-chrome-extra" style={{ color: "#888" }}>→ {t("Вперёд", "Forward")}</span>
            <span className="y09-chrome-extra" style={{ color: "#555" }}>⟳ {t("Обновить", "Refresh")}</span>
            <span style={{ color: "#555" }}>{t("Адрес", "Address")}:</span>
            <span style={{ flex: 1, minWidth: 0, background: "#fff", border: "1px solid #7f9db9", padding: "2px 6px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>http://www.leto-2009.silentium/~blog/index.html</span>
            <span>{(["ru", "en"] as const).map((l) => <button key={l} onClick={() => setLang(l)} className="y09-btn" style={{ padding: "1px 6px", marginLeft: 3, fontWeight: lang === l ? "bold" : "normal" }}>{l.toUpperCase()}</button>)}</span>
          </div>

          {/* the blog itself */}
          <div style={{ background: "#f4fafe" }}>
            <header style={{ position: "relative", height: 150, background: "linear-gradient(#8fdc5a, #4caf2c 60%, #3c9a21)", overflow: "hidden" }}>
              <img src={`${IMG}/wallpaper.webp`} alt="" style={{ position: "absolute", right: 0, top: 0, height: "100%", width: "52%", objectFit: "cover", maskImage: "linear-gradient(90deg, transparent, #000 40%)", WebkitMaskImage: "linear-gradient(90deg, transparent, #000 40%)" }} />
              <div style={{ position: "absolute", inset: "0 0 52% 0", background: "linear-gradient(rgba(255,255,255,.5), rgba(255,255,255,.08))", borderRadius: "0 0 50% 50% / 0 0 30% 30%" }} />
              <div style={{ position: "relative", padding: "26px 24px" }}>
                <h1 style={{ ...trebuchet, fontSize: "clamp(30px, 6vw, 50px)", fontWeight: "bold", fontStyle: "italic", color: "#fff", letterSpacing: -1, textShadow: "0 2px 0 #2d7a14, 0 4px 10px rgba(0,0,0,.3)", lineHeight: 1 }}>{perfume.name}</h1>
                <p style={{ color: "#f4ffe0", fontSize: 13, marginTop: 8, textShadow: "0 1px 0 rgba(0,0,0,.3)" }}>{pick(lang, perfume.tagline)} :)</p>
              </div>
              <div style={{ position: "absolute", left: "min(420px, 62%)", top: 18, width: 76, height: 76, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div className="y09-star" style={{ position: "absolute", inset: 0, background: "#ffde00", clipPath: "polygon(50% 0,61% 18%,82% 10%,80% 32%,100% 40%,85% 55%,96% 75%,74% 76%,66% 97%,50% 84%,34% 97%,26% 76%,4% 75%,15% 55%,0 40%,20% 32%,18% 10%,39% 18%)" }} />
                <span style={{ position: "relative", fontWeight: "bold", color: "#d40000", fontSize: 13, transform: "rotate(-12deg)" }}>NEW!</span>
              </div>
            </header>
            <nav style={{ display: "flex", gap: 3, padding: "0 12px", background: "linear-gradient(#3c9a21, #2f7f18)", flexWrap: "wrap" }}>
              {[[t("Главная", "Home"), "#y09-top"], [t("Аромат", "Fragrance"), "#y09-post"], [t("Фотоаппарат", "Camera"), "#y09-cam"], [t("Фотки", "Photos"), "#y09-photos"], [t("Гостевая", "Guestbook"), "#y09-guest"], [t("Купить", "Buy"), "#y09-buy"]].map(([label, href], i) => (
                <a key={href} href={href} style={{ padding: "6px 14px", marginTop: 5, borderRadius: "7px 7px 0 0", fontSize: 12, fontWeight: "bold", color: i === 0 ? "#2f7f18" : "#fff", background: i === 0 ? "#f4fafe" : "linear-gradient(rgba(255,255,255,.25), rgba(255,255,255,.05))", textDecoration: "none" }}>{label}</a>
              ))}
            </nav>
            <div className="y09-marquee" style={{ background: "#fffbd0", borderBottom: "1px solid #e8dc80", color: "#9a5b00", fontSize: 12, padding: "4px 0" }}>
              <span>☀ {t("ЛЕТО 2009 ☀ дача ☀ смородина ☀ светлячки ☀ никаких уроков до 1 сентября!!! ☀ добавь меня в друзья ☀ ", "SUMMER 2009 ☀ dacha ☀ blackcurrant ☀ fireflies ☀ no school until September!!! ☀ add me as a friend ☀ ")}{perfume.name.toUpperCase()} ☀</span>
            </div>

            <div id="y09-top" className="y09-cols" style={{ padding: 14 }}>
              <aside className="y09-side" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <Box title={t("Мой профиль", "My profile")}>
                  <img src={`${IMG}/avatar.webp`} alt={t("Рыжий кот на крыльце дачи", "A ginger cat on the dacha porch")} style={{ width: "100%", aspectRatio: "1", objectFit: "cover", border: "3px solid #fff", outline: "1px solid #ccc" }} />
                  <p style={{ marginTop: 8, fontSize: 11, lineHeight: 1.7 }}>
                    <span style={{ color: "#3aa21c" }}>✿</span> <b>summer_2009</b> <span className="y09-blink" style={{ color: "#3aa21c", fontSize: 10 }}>{t("онлайн", "online")}</span><br />
                    <b>{t("Статус", "Status")}:</b> <i>{t("лето. дача. ничего не нужно :)", "summer. dacha. need nothing :)")}</i><br />
                    <b>{t("Настроение", "Mood")}:</b> {t("мечтательное", "dreamy")} (^_^)<br />
                    <b>{t("Откуда", "From")}:</b> {pick(lang, perfume.origin.location)}<br />
                    <b>{t("Слушаю", "Listening to")}:</b> {t("кассету без подписи", "an unlabelled cassette")}
                  </p>
                </Box>
                <div id="y09-player"><Player notes={notes} t={t} /></div>
                <Box title={t("Опрос", "Poll")} color="#e07bb5" id="y09-poll">
                  <Poll facets={g.facets} lang={lang} t={t} />
                </Box>
                <Box title={t("Счётчик", "Counter")} color="#5a8fd0">
                  <p style={{ fontSize: 11, textAlign: "center" }}>{t("Вы", "You are visitor")}</p>
                  <div style={{ display: "flex", justifyContent: "center", gap: 2, margin: "4px 0" }}>
                    {visitor.split("").map((d, i) => <span key={i} style={{ fontFamily: "'Courier New', monospace", background: "#111", color: "#5f5", padding: "1px 4px", fontWeight: "bold", fontSize: 15, borderRadius: 2 }}>{d}</span>)}
                  </div>
                  <p style={{ fontSize: 11, textAlign: "center" }}>{t("-й посетитель!", "")}</p>
                </Box>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4, justifyContent: "center" }}>
                  {["VALID XHTML", "MADE WITH NOTEPAD", "1024×768", "RSS"].map((b, i) => (
                    <span key={b} style={{ width: 88, height: 31, fontSize: 8, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", textAlign: "center", border: "1px solid #666", background: ["linear-gradient(#fff,#ddd)", "linear-gradient(#ffe,#fc6)", "linear-gradient(#cdf,#58c)", "linear-gradient(#fd9,#f80)"][i], color: i === 2 ? "#fff" : "#333" }}>{b}</span>
                  ))}
                </div>
              </aside>

              <main style={{ display: "flex", flexDirection: "column", gap: 14, minWidth: 0 }}>
                <FlashPlayer t={t} />

                <Box title={`${t("Запись от", "Post from")} 27.07.2009, 21:47`} color="#5a8fd0" id="y09-post">
                  <h2 style={{ ...trebuchet, fontSize: 22, color: LINK, fontWeight: "bold" }}>{t("как пахнет моё лето", "what my summer smells like")}</h2>
                  <p style={{ marginTop: 8, lineHeight: 1.75, fontSize: 13 }}>{Lp(g.plain)}</p>
                  <table style={{ marginTop: 12, width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                    <tbody>
                      {facts.map(([k, v], i) => (
                        <tr key={k} style={{ background: i % 2 ? "#fff" : "#eef6fb" }}>
                          <td style={{ padding: "5px 8px", fontWeight: "bold", width: "34%", borderBottom: "1px solid #dbe8f1" }}>{k}</td>
                          <td style={{ padding: "5px 8px", borderBottom: "1px solid #dbe8f1" }}>{v}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {g.tip && <p style={{ marginTop: 10, fontSize: 12, background: "#fffbd0", border: "1px solid #e8dc80", padding: "6px 8px", borderRadius: 4 }}>💡 {t("Совет", "Tip")}: {Lp(g.tip)}</p>}
                  <p style={{ marginTop: 10, fontSize: 11, color: "#777" }}>
                    {t("Настроение", "Mood")}: <b>{t("ностальгическое", "nostalgic")}</b> · {t("Музыка", "Music")}: <i>{t("кассета", "cassette")}</i> · <a className="y09-a" href="#y09-guest">{t("Комментарии", "Comments")} ({fragments.length})</a>
                  </p>
                </Box>

                <Box title={t("Как раскрывается: снимки с моей цифромыльницы", "How it unfolds: shots from my digicam")} color="#7cc04b" id="y09-cam">
                  <Camera stages={stages} lang={lang} t={t} />
                </Box>

                <Box title={`${t("Фотоальбом «Дача 2009»", "Photo album “Dacha 2009”")} (6)`} color="#e0a020" id="y09-photos">
                  <Album captions={pick(lang, g.scenes)} t={t} />
                </Box>

                <Box title={`${t("Гостевая книга", "Guestbook")} (${fragments.length})`} color="#5a8fd0" id="y09-guest">
                  <Guestbook fragments={fragments} t={t} />
                </Box>

                <div id="y09-buy" style={{ position: "relative", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-around", gap: 18, padding: 18, borderRadius: 10, border: "2px dashed #ff8ac4", background: "repeating-linear-gradient(45deg, #fff6fb 0 12px, #ffeef7 12px 24px)" }}>
                  <div style={{ maxWidth: 340 }}>
                    <p style={{ ...trebuchet, fontSize: 22, fontWeight: "bold", color: "#d6339a" }}>{t("Хочешь так же пахнуть летом?", "Want to smell like summer too?")}</p>
                    <p style={{ marginTop: 6, lineHeight: 1.6 }}>{t("Напиши мне СМС — нажми на телефон! Мы ответим и расскажем, как получить флакон.", "Send me an SMS — tap the phone! We'll reply and tell you how to get a bottle.")}</p>
                    <p style={{ fontSize: 11, color: "#666", marginTop: 8 }}>Extrait de parfum · {perfume.releaseDate} · {perfume.origin.coords}</p>
                  </div>
                  <Phone onSent={() => setOpen(true)} t={t} />
                </div>
              </main>
            </div>

            <footer style={{ borderTop: "1px solid #cfe1ee", padding: "12px 14px", fontSize: 10, color: "#789", textAlign: "center", background: "linear-gradient(#f4fafe, #e3f0f8)" }}>
              © 2009 Silentium · {t("Сайт лучше всего смотрится при разрешении 1024×768", "Best viewed at 1024×768")} · <a className="y09-a" href="#y09-top">{t("наверх", "top")} ↑</a>
            </footer>
          </div>
        </div>
      </div>

      {/* the taskbar */}
      <div style={{ ...tahoma, position: "fixed", left: 0, right: 0, bottom: 0, height: 32, zIndex: 60, display: "flex", alignItems: "center", gap: 8, background: "linear-gradient(#3f8cf3, #245edb 15%, #2257d4 85%, #1941a5)", borderTop: "1px solid #6aa0f5", color: "#fff", fontSize: 11 }}>
        <button onClick={() => navigate("/map")} style={{ height: "100%", padding: "0 18px 0 12px", fontWeight: "bold", fontStyle: "italic", fontSize: 14, color: "#fff", background: "linear-gradient(#5fbf4a, #3a9a2a 50%, #2f8a20)", borderRadius: "0 12px 12px 0", textShadow: "1px 1px 1px rgba(0,0,0,.4)" }}>{t("пуск", "start")}</button>
        <span style={{ padding: "4px 10px", background: "rgba(255,255,255,.18)", border: "1px solid rgba(0,0,0,.25)", borderRadius: 3, maxWidth: "40vw", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>🌐 {perfume.name} :: {t("мой блог", "my blog")}</span>
        <span style={{ flex: 1 }} />
        <span style={{ height: "100%", display: "flex", alignItems: "center", gap: 8, padding: "0 12px", background: "linear-gradient(#1290e8, #0e74d0)", borderLeft: "1px solid #0b5cad" }}>✿ 🔊 {clock}</span>
      </div>

      <RequestDialog open={open} onClose={() => setOpen(false)} perfumeName={perfume.name} skin={skin} />
    </div>
  );
}
