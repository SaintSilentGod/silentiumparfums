// Silentium — the layering atelier.
// A manifesto on layering as an art, its laws, three pairings from the Silentium collection, and an
// interactive atelier: build your wardrobe (catalogue search, Fragrantica link or free text), sign in
// with Google and let the house perfumer (an LLM via a Supabase edge function) compose combinations.
// Three generations per account.

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useLocation } from "wouter";
import { useLang } from "@/contexts/LangContext";
import { useReveal } from "@/lib/useReveal";
import { perfumes, getPerfumeById } from "@/lib/perfumes";
import { BOTTLE_COLORS } from "@/lib/bottleLooks";
import { normalize, parseFragranticaUrl, searchCatalog } from "@/lib/fragranceCatalog";
import { supabase, useSession, signInWithGoogle, signOut } from "@/lib/supabase";

const C = { bg: "#07060a", ink: "#efe8dc", dim: "rgba(239,232,220,.6)", faint: "rgba(239,232,220,.18)", line: "rgba(239,232,220,.1)", gold: "#d6b47a", rose: "#e58fa3", violet: "#9b7bff" };
const serif: CSSProperties = { fontFamily: "'Cormorant Garamond', serif" };
const mono: CSSProperties = { fontFamily: "'JetBrains Mono', 'DM Mono', monospace" };
const LIMIT = 3;
const STORAGE_KEY = "silentium.wardrobe.v1";

interface WardrobeItem { brand: string; name: string; silentiumId?: string }
interface ComboPerfume { name: string; role: "base" | "middle" | "top"; sprays: number; where: string }
interface Combo { title: string; idea: string; perfumes: ComboPerfume[]; application: string; result: string; mood: string; occasion: string; season: string; why: string; intensity: number }
export interface LayeringResult { intro: string; combos: Combo[]; silentium: { id: string; title: string; pairWith: string; application: string; result: string; why: string } | null }

const itemKey = (i: WardrobeItem) => normalize(`${i.brand} ${i.name}`);

// Deterministic colour for any fragrance: Silentium uses its own liquid colour
function colorFor(item: { name: string; silentiumId?: string }) {
  if (item.silentiumId && BOTTLE_COLORS[item.silentiumId]) return BOTTLE_COLORS[item.silentiumId].liquid;
  let h = 0;
  for (const ch of normalize(item.name)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return hslHex(h % 360, 0.55, 0.58);
}

// hex (not hsl) so callers can append an alpha suffix like `${color}55`
function hslHex(h: number, s: number, l: number) {
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => Math.round(255 * (l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1)))).toString(16).padStart(2, "0");
  return `#${f(0)}${f(8)}${f(4)}`;
}

function MiniBottle({ color, size = 34 }: { color: string; size?: number }) {
  return (
    <svg viewBox="0 0 40 56" width={size} height={size * 1.4} aria-hidden>
      <rect x="13" y="2" width="14" height="10" rx="2" fill="#1a1714" stroke="rgba(239,232,220,.25)" />
      <rect x="16" y="11" width="8" height="4" fill="#cdb07a" />
      <rect x="4" y="15" width="32" height="38" rx="6" fill="rgba(255,255,255,.06)" stroke="rgba(239,232,220,.3)" />
      <rect x="8" y="22" width="24" height="27" rx="4" fill={color} opacity=".85" />
      <rect x="9" y="23" width="5" height="25" rx="2" fill="rgba(255,255,255,.25)" />
    </svg>
  );
}

// Two liquids braiding into a third — the hero motif
function MergeVisual() {
  return (
    <svg viewBox="0 0 400 400" style={{ width: "min(520px, 86vw)", height: "auto", display: "block", margin: "0 auto" }} aria-hidden>
      <defs>
        <filter id="lay-goo"><feGaussianBlur in="SourceGraphic" stdDeviation="14" result="b" /><feColorMatrix in="b" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -9" /></filter>
        <radialGradient id="lay-a"><stop offset="0" stopColor="#ffd9a0" /><stop offset="1" stopColor="#d6b47a" /></radialGradient>
        <radialGradient id="lay-b"><stop offset="0" stopColor="#f6b6c6" /><stop offset="1" stopColor="#9b7bff" /></radialGradient>
      </defs>
      <g filter="url(#lay-goo)">
        <circle className="lay-orb-a" cx="150" cy="200" r="78" fill="url(#lay-a)" />
        <circle className="lay-orb-b" cx="250" cy="200" r="78" fill="url(#lay-b)" />
        <circle className="lay-orb-c" cx="200" cy="200" r="34" fill="#efe8dc" />
      </g>
    </svg>
  );
}

function Reveal({ children, delay = 0, style }: { children: React.ReactNode; delay?: number; style?: CSSProperties }) {
  const { ref, visible } = useReveal();
  return <div ref={ref} style={{ ...style, opacity: visible ? 1 : 0, transform: visible ? "none" : "translateY(26px)", transition: `opacity 1.2s cubic-bezier(.16,1,.3,1) ${delay}ms, transform 1.2s cubic-bezier(.16,1,.3,1) ${delay}ms` }}>{children}</div>;
}

// Layers drawn as stacked bands, base at the bottom
function LayerStack({ layers }: { layers: { label: string; color: string; note?: string }[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column-reverse", gap: 4 }}>
      {layers.map((l, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 10, background: `linear-gradient(90deg, ${l.color}55, ${l.color}14)`, border: `1px solid ${l.color}55` }}>
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: l.color, flex: "none", boxShadow: `0 0 12px ${l.color}` }} />
          <span style={{ ...serif, fontSize: 19, flex: 1 }}>{l.label}</span>
          {l.note && <span style={{ ...mono, fontSize: 11, color: C.dim, textAlign: "right" }}>{l.note}</span>}
        </div>
      ))}
    </div>
  );
}

const LAWS = [
  { n: "I", ru: ["Тяжёлое — вниз, лёгкое — наверх", "Сначала плотное: смолы, дерево, амбра, ваниль, мускус. Сверху то, что летит: цитрусы, зелень, вода, прозрачные цветы. Лёгкое, нанесённое первым, просто утонет."], en: ["Heavy below, light on top", "Dense first: resins, woods, amber, vanilla, musk. Then what flies: citrus, greens, water, sheer florals. Put the light one first and it simply drowns."] },
  { n: "II", ru: ["Мост или контраст", "Общая нота делает переход бесшовным — два аромата становятся одним. Противоположности — свежесть поверх дыма, горечь поверх сладости — дают намеренный, острый эффект. Выбирайте сознательно."], en: ["A bridge or a contrast", "A shared note makes the seam disappear — two become one. Opposites — freshness over smoke, bitterness over sugar — make a deliberate, sharp effect. Choose on purpose."] },
  { n: "III", ru: ["Тишина между слоями", "Дайте первому аромату 30–60 секунд, чтобы спирт ушёл и он сел на кожу. Потом — следующий. Это пауза в музыке, а не потеря времени."], en: ["Silence between layers", "Give the first scent 30–60 seconds for the alcohol to lift and settle on skin. Then the next. It is a rest in music, not lost time."] },
  { n: "IV", ru: ["Два — правило, три — исключение", "Два аромата — уже новый. Третий добавляйте, только если без него композиция неполная. Четыре — это шум."], en: ["Two is the rule, three the exception", "Two scents already make a new one. Add a third only if the composition feels unfinished without it. Four is noise."] },
  { n: "V", ru: ["Кожа, ткань, волосы", "Место — часть рецепта. На коже аромат теплеет и раскрывается, на ткани держится дольше и звучит чище. Лёгкий верх на шарф, тяжёлую базу на запястья."], en: ["Skin, fabric, hair", "Placement is part of the recipe. Skin warms and opens a scent; fabric holds it longer and keeps it cleaner. A light top on a scarf, a heavy base on the wrists."] },
];

// Curated pairings from the house — no model needed
const HOUSE_PAIRS = [
  { a: "russian-banya", b: "laundry-routine", ru: ["Чистое тело после парной", "Хвоя, смолы и горячее дерево Banya под ледяной белизной Laundry — тепло, которое пахнет свежестью. Мост — чистая кожа."], en: ["Clean skin after the steam room", "The pine, resin and hot wood of Banya under the icy white of Laundry — warmth that smells fresh. The bridge is clean skin."] },
  { a: "seance", b: "silent-fog", ru: ["Свеча в тумане", "Ладан и берёзовый дёготь Seance, а сверху — озон и дождь Silent Fog. Контраст: дым становится прозрачным, как свет сквозь пелену."], en: ["A candle in the fog", "Seance's incense and birch tar with Silent Fog's ozone and rain on top. A contrast: smoke turns translucent, like light through a veil."] },
  { a: "self-addicted", b: "summer-of-2009", ru: ["Первая любовь на даче", "Ваниль, карамель и роза Self Addicted как база, сверху зелёная смородина Summer of 2009. Сладость становится юной, почти невинной."], en: ["First love at the dacha", "Self Addicted's vanilla, caramel and rose as the base, Summer of 2009's green blackcurrant on top. Sweetness turns young, almost innocent."] },
];

const LOADING_LINES = {
  ru: ["Читаю ваш гардероб…", "Ищу мост между нотами…", "Проверяю, кто из них тяжелее…", "Отбрасываю то, что поспорит…", "Пишу рецепты…"],
  en: ["Reading your wardrobe…", "Looking for a bridge between notes…", "Checking which one is heavier…", "Discarding what would clash…", "Writing the recipes…"],
};

export default function Layering() {
  const [, navigate] = useLocation();
  const { lang, setLang, t } = useLang();
  const { session } = useSession();

  // ── wardrobe ──
  const [wardrobe, setWardrobe] = useState<WardrobeItem[]>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; }
  });
  const syncedFor = useRef<string | null>(null);
  useEffect(() => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(wardrobe)); } catch { /* storage may be unavailable */ } }, [wardrobe]);

  // On sign-in: merge the local shelf with the saved one, then keep the account copy updated
  useEffect(() => {
    const uid = session?.user.id;
    if (!supabase || !uid || syncedFor.current === uid) return;
    syncedFor.current = uid;
    supabase.from("wardrobes").select("items").eq("user_id", uid).maybeSingle().then(({ data }) => {
      const remote = (data?.items as WardrobeItem[] | undefined) ?? [];
      setWardrobe((local) => {
        const merged = [...remote];
        for (const i of local) if (!merged.some((m) => itemKey(m) === itemKey(i))) merged.push(i);
        return merged;
      });
    });
  }, [session]);
  useEffect(() => {
    const uid = session?.user.id;
    if (!supabase || !uid || syncedFor.current !== uid) return;
    const id = setTimeout(() => { supabase!.from("wardrobes").upsert({ user_id: uid, items: wardrobe, updated_at: new Date().toISOString() }); }, 600);
    return () => clearTimeout(id);
  }, [wardrobe, session]);

  const add = (item: WardrobeItem) => {
    setWardrobe((w) => (w.some((x) => itemKey(x) === itemKey(item)) || w.length >= 40 ? w : [...w, item]));
    setQuery("");
    setActive(0);
  };
  const remove = (item: WardrobeItem) => setWardrobe((w) => w.filter((x) => itemKey(x) !== itemKey(item)));

  // ── search ──
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const fromLink = useMemo(() => parseFragranticaUrl(query), [query]);
  const suggestions = useMemo(() => {
    if (fromLink) return [];
    const q = normalize(query);
    const own = q.length >= 1 ? perfumes.filter((p) => normalize(`silentium ${p.name}`).includes(q)).map((p) => ({ brand: "Silentium", name: p.name, silentiumId: p.id })) : [];
    return [...own, ...searchCatalog(query, 8 - Math.min(own.length, 4)).map((e) => ({ brand: e.brand, name: e.name }))].slice(0, 8);
  }, [query, fromLink]);
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, suggestions.length)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    if (e.key === "Enter") {
      e.preventDefault();
      if (fromLink) return add(fromLink);
      if (suggestions[active]) return add(suggestions[active]);
      if (query.trim().length >= 2) add(manualItem(query));
    }
  };
  const manualItem = (q: string): WardrobeItem => ({ brand: "", name: q.trim().slice(0, 80) });

  // ── generations ──
  const [used, setUsed] = useState<number | null>(null);
  const [history, setHistory] = useState<{ id: string; created_at: string; result: LayeringResult }[]>([]);
  const [result, setResult] = useState<LayeringResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lineIdx, setLineIdx] = useState(0);
  const resultRef = useRef<HTMLDivElement>(null);

  const loadUsage = useCallback(async () => {
    if (!supabase || !session) { setUsed(null); setHistory([]); return; }
    const { data } = await supabase.from("layering_generations").select("id, created_at, status, result").neq("status", "failed").order("created_at", { ascending: false });
    setUsed(data?.length ?? 0);
    setHistory(((data ?? []).filter((r) => r.status === "done" && r.result) as { id: string; created_at: string; result: LayeringResult }[]));
  }, [session]);
  useEffect(() => { loadUsage(); }, [loadUsage]);

  useEffect(() => {
    if (!busy) return;
    const id = setInterval(() => setLineIdx((i) => (i + 1) % LOADING_LINES.ru.length), 2600);
    return () => clearInterval(id);
  }, [busy]);

  const remaining = used === null ? LIMIT : Math.max(0, LIMIT - used);

  useEffect(() => {
    if (import.meta.env.DEV && new URLSearchParams(window.location.search).has("demo")) import("./layeringDemo").then((m) => setResult(m.DEMO_RESULT));
  }, []);

  const generate = async () => {
    if (!supabase || !session || busy || wardrobe.length < 2 || remaining <= 0) return;
    setBusy(true); setError(null); setLineIdx(0);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("layering", { body: { wardrobe: wardrobe.map(({ brand, name }) => ({ brand, name })), lang } });
      if (fnError) {
        let code = "";
        try { code = (await (fnError as { context?: Response }).context?.json())?.error ?? ""; } catch { /* not json */ }
        setError(
          code === "limit_reached" ? t("Все три смешивания уже использованы.", "All three blends have been used.")
          : code === "limit_ip" ? t("С этого устройства сегодня смешивали слишком часто. Попробуйте завтра.", "Too many blends from this device today. Try tomorrow.")
          : code === "wardrobe_too_small" ? t("Добавьте хотя бы два аромата.", "Add at least two fragrances.")
          : t("Парфюмер не смог закончить рецепт. Попытка не списана — попробуйте ещё раз.", "The perfumer couldn't finish. The attempt wasn't counted — please try again."),
        );
      } else {
        setResult(data.result as LayeringResult);
        setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
      }
    } catch {
      setError(t("Нет связи с ателье. Попробуйте ещё раз.", "Can't reach the atelier. Please try again."));
    } finally {
      setBusy(false);
      loadUsage();
    }
  };

  const colorByName = (name: string) => {
    const k = normalize(name);
    const item = wardrobe.find((w) => normalize(w.name) === k) ?? wardrobe.find((w) => normalize(w.name).includes(k) || k.includes(normalize(w.name)));
    return colorFor(item ?? { name });
  };

  return (
    <div style={{ ...serif, background: C.bg, color: C.ink, minHeight: "100vh", overflowX: "hidden" }}>
      <style>{`
        .lay-orb-a { animation: lay-a 9s ease-in-out infinite; transform-origin: 200px 200px; }
        .lay-orb-b { animation: lay-b 9s ease-in-out infinite; transform-origin: 200px 200px; }
        .lay-orb-c { animation: lay-c 9s ease-in-out infinite; transform-origin: 200px 200px; }
        @keyframes lay-a { 0%,100% { transform: translate(-40px, 0) rotate(0); } 50% { transform: translate(30px, -10px) rotate(180deg); } }
        @keyframes lay-b { 0%,100% { transform: translate(40px, 0) rotate(0); } 50% { transform: translate(-30px, 10px) rotate(-180deg); } }
        @keyframes lay-c { 0%,100% { transform: scale(.4); opacity: .4; } 50% { transform: scale(1.25); opacity: 1; } }
        .lay-glow { background: radial-gradient(ellipse at 30% 20%, rgba(214,180,122,.14), transparent 55%), radial-gradient(ellipse at 80% 70%, rgba(155,123,255,.12), transparent 55%); }
        .lay-chip { transition: border-color .3s, transform .3s; } .lay-chip:hover { border-color: rgba(239,232,220,.35) !important; transform: translateY(-2px); }
        .lay-btn { transition: transform .2s, box-shadow .3s, opacity .3s; } .lay-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 16px 50px rgba(214,180,122,.35); }
        .lay-btn:disabled { opacity: .45; cursor: not-allowed; }
        .lay-line { animation: lay-line .6s ease; } @keyframes lay-line { from { opacity: 0; transform: translateY(6px); } }
        .lay-card { animation: lay-card .9s cubic-bezier(.16,1,.3,1) both; } @keyframes lay-card { from { opacity: 0; transform: translateY(30px); } }
        @media (prefers-reduced-motion: reduce) { .lay-orb-a, .lay-orb-b, .lay-orb-c { animation: none; } }
      `}</style>

      {/* nav */}
      <nav style={{ position: "sticky", top: 0, zIndex: 30, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px clamp(16px,4vw,48px)", background: "rgba(7,6,10,.75)", backdropFilter: "blur(12px)", borderBottom: `1px solid ${C.line}`, ...mono, fontSize: 12, letterSpacing: ".18em" }}>
        <button onClick={() => navigate("/")} style={{ color: C.dim }}>← SILENTIUM</button>
        <span style={{ color: C.gold }}>{t("АТЕЛЬЕ ЛЕЙЕРИНГА", "LAYERING ATELIER")}</span>
        <span style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <button onClick={() => navigate("/map")} style={{ color: C.dim }}>{t("КАРТА", "MAP")}</button>
          {(["ru", "en"] as const).map((l) => <button key={l} onClick={() => setLang(l)} style={{ color: lang === l ? C.gold : C.dim }}>{l.toUpperCase()}</button>)}
        </span>
      </nav>

      {/* hero */}
      <header className="lay-glow" style={{ minHeight: "92vh", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", alignItems: "center", gap: 30, padding: "40px clamp(16px,6vw,90px)" }}>
        <div>
          <p style={{ ...mono, fontSize: 12, letterSpacing: ".35em", color: C.gold }}>{t("ЛЕЙЕРИНГ", "LAYERING")}</p>
          <h1 style={{ fontSize: "clamp(3rem, 8vw, 7rem)", fontWeight: 300, fontStyle: "italic", lineHeight: 0.92, margin: "18px 0 26px" }}>{t("Два аромата.", "Two scents.")}<br />{t("Третий —", "A third —")}<br /><span style={{ color: C.gold }}>{t("ваш.", "yours.")}</span></h1>
          <p style={{ fontSize: "clamp(1.2rem, 1.9vw, 1.55rem)", lineHeight: 1.45, color: C.dim, maxWidth: 520 }}>{t("Лейеринг — это когда вы перестаёте носить чужие ароматы и начинаете сочинять свой. Из того, что уже стоит у вас на полке.", "Layering is when you stop wearing other people's scents and start composing your own. From what already stands on your shelf.")}</p>
          <a href="#atelier" style={{ display: "inline-block", marginTop: 32, ...mono, fontSize: 12, letterSpacing: ".25em", color: C.ink, borderBottom: `1px solid ${C.gold}`, paddingBottom: 6 }}>{t("СОБРАТЬ СВОЙ ГАРДЕРОБ ↓", "BUILD YOUR WARDROBE ↓")}</a>
        </div>
        <MergeVisual />
      </header>

      <main style={{ maxWidth: 1180, margin: "0 auto", padding: "0 clamp(16px,5vw,64px)" }}>
        {/* manifesto */}
        <section style={{ padding: "16vh 0 12vh", maxWidth: 860 }}>
          <Reveal><p style={{ ...mono, fontSize: 12, letterSpacing: ".3em", color: C.gold, marginBottom: 26 }}>{t("МАНИФЕСТ", "MANIFESTO")}</p></Reveal>
          {[
            t("Аромат — это слово. Лейеринг — это фраза.", "A fragrance is a word. Layering is a sentence."),
            t("Парфюмер закончил свою работу, когда флакон закрыли. Ваша начинается, когда вы его открываете. Два аромата на коже не складываются — они спорят, договариваются, переплетаются и через час звучат так, как не звучит ни один из них по отдельности.", "The perfumer's work ended when the bottle was sealed. Yours begins when you open it. Two scents on skin don't add up — they argue, negotiate, braid together, and an hour later sound like neither of them alone."),
            t("Это не способ «усилить» аромат и не трюк для стойкости. Это способ сказать о себе то, чего не написано ни на одной этикетке. Тот же человек, что вчера пах холодным металлом, сегодня может пахнуть металлом, нагретым солнцем. Разница — в одном слое.", "It isn't a way to 'boost' a scent or a longevity trick. It is a way to say something about yourself that isn't written on any label. The person who smelled of cold metal yesterday can smell of sun-warmed metal today. The difference is one layer."),
            t("Лейеринг — это искусство, потому что в нём есть ошибки. И лучшие сочетания почти всегда кто-то нашёл случайно.", "Layering is an art because it has mistakes. And the best pairings were almost always found by accident."),
          ].map((p, i) => (
            <Reveal key={i} delay={i * 80}><p style={{ fontSize: i === 0 ? "clamp(2rem, 4.6vw, 3.6rem)" : "clamp(1.25rem, 2vw, 1.6rem)", fontStyle: i === 0 ? "italic" : "normal", fontWeight: i === 0 ? 300 : 400, lineHeight: i === 0 ? 1.1 : 1.55, color: i === 0 ? C.ink : C.dim, marginBottom: i === 0 ? 36 : 22 }}>{p}</p></Reveal>
          ))}
        </section>

        {/* laws */}
        <section style={{ padding: "6vh 0 12vh" }}>
          <Reveal><SectionTitle kicker={t("ПЯТЬ ЗАКОНОВ", "FIVE LAWS")} title={t("Как это работает", "How it works")} /></Reveal>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", borderTop: `1px solid ${C.line}`, borderLeft: `1px solid ${C.line}` }}>
            {LAWS.map((l, i) => (
              <Reveal key={l.n} delay={i * 90} style={{ padding: "30px 24px 34px", borderRight: `1px solid ${C.line}`, borderBottom: `1px solid ${C.line}` }}>
                <p style={{ ...serif, fontSize: 46, fontStyle: "italic", color: C.gold, lineHeight: 1 }}>{l.n}</p>
                <h3 style={{ fontSize: 26, lineHeight: 1.15, margin: "14px 0 12px", fontWeight: 500 }}>{lang === "ru" ? l.ru[0] : l.en[0]}</h3>
                <p style={{ fontSize: 18, lineHeight: 1.5, color: C.dim }}>{lang === "ru" ? l.ru[1] : l.en[1]}</p>
              </Reveal>
            ))}
          </div>
        </section>

        {/* house pairings */}
        <section style={{ padding: "6vh 0 12vh" }}>
          <Reveal><SectionTitle kicker={t("ИЗ НАШЕЙ КОЛЛЕКЦИИ", "FROM OUR COLLECTION")} title={t("Три сочетания дома", "Three house pairings")} /></Reveal>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 }}>
            {HOUSE_PAIRS.map((p, i) => {
              const a = getPerfumeById(p.a)!, b = getPerfumeById(p.b)!;
              return (
                <Reveal key={i} delay={i * 120} style={{ border: `1px solid ${C.line}`, borderRadius: 18, padding: 24, background: "rgba(255,255,255,.02)" }}>
                  <h3 style={{ fontSize: 30, fontStyle: "italic", fontWeight: 400, lineHeight: 1.1, marginBottom: 18 }}>{lang === "ru" ? p.ru[0] : p.en[0]}</h3>
                  <LayerStack layers={[
                    { label: a.name, color: BOTTLE_COLORS[a.id].liquid, note: t("база · 2 пшика · запястья", "base · 2 sprays · wrists") },
                    { label: b.name, color: BOTTLE_COLORS[b.id].liquid, note: t("верх · 1–2 пшика · шея", "top · 1–2 sprays · neck") },
                  ]} />
                  <p style={{ fontSize: 18, lineHeight: 1.5, color: C.dim, marginTop: 18 }}>{lang === "ru" ? p.ru[1] : p.en[1]}</p>
                  <div style={{ display: "flex", gap: 16, marginTop: 16, ...mono, fontSize: 11, letterSpacing: ".15em" }}>
                    <button onClick={() => navigate(`/perfume/${a.id}`)} style={{ color: C.gold }}>{a.name.toUpperCase()} →</button>
                    <button onClick={() => navigate(`/perfume/${b.id}`)} style={{ color: C.gold }}>{b.name.toUpperCase()} →</button>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </section>

        {/* the atelier */}
        <section id="atelier" style={{ padding: "8vh 0 10vh", scrollMarginTop: 70 }}>
          <Reveal><SectionTitle kicker={t("АТЕЛЬЕ", "THE ATELIER")} title={t("Ваш гардероб", "Your wardrobe")} /></Reveal>
          <p style={{ fontSize: 20, lineHeight: 1.5, color: C.dim, maxWidth: 640, marginTop: -10, marginBottom: 30 }}>{t("Соберите то, что у вас есть. Найдите аромат в списке, вставьте ссылку с Fragrantica или просто впишите название — и парфюмер дома сочинит сочетания именно из вашей полки.", "Gather what you own. Find a fragrance in the list, paste a Fragrantica link or just type a name — and the house perfumer will compose pairings from your shelf alone.")}</p>

          {/* search */}
          <div style={{ position: "relative", maxWidth: 720 }}>
            <input
              value={query}
              onChange={(e) => { setQuery(e.target.value); setActive(0); }}
              onKeyDown={onKey}
              placeholder={t("Название, бренд или ссылка с Fragrantica", "Name, brand or a Fragrantica link")}
              aria-label={t("Добавить аромат", "Add a fragrance")}
              style={{ width: "100%", ...serif, fontSize: 22, padding: "16px 20px", borderRadius: 14, background: "rgba(255,255,255,.04)", border: `1px solid ${C.faint}`, color: C.ink, outline: "none" }}
            />
            {query.trim().length >= 2 && (
              <div role="listbox" style={{ position: "absolute", left: 0, right: 0, top: "calc(100% + 6px)", zIndex: 10, borderRadius: 14, background: "#120f17", border: `1px solid ${C.faint}`, boxShadow: "0 30px 60px rgba(0,0,0,.6)", overflow: "hidden" }}>
                {fromLink ? (
                  <Option active onPick={() => add(fromLink)} brand={fromLink.brand} name={fromLink.name} hint={t("из ссылки Fragrantica", "from the Fragrantica link")} />
                ) : (
                  <>
                    {suggestions.map((s, i) => <Option key={`${s.brand}|${s.name}`} active={i === active} onPick={() => add(s)} brand={s.brand} name={s.name} color={colorFor(s)} />)}
                    <Option active={active === suggestions.length} onPick={() => add(manualItem(query))} brand="" name={`«${query.trim()}»`} hint={t("добавить как есть", "add as typed")} />
                  </>
                )}
              </div>
            )}
          </div>

          {/* shelf */}
          <div style={{ marginTop: 28, minHeight: 120, borderRadius: 20, border: `1px dashed ${C.faint}`, padding: 18, display: "flex", flexWrap: "wrap", gap: 12, alignItems: "flex-start" }}>
            {wardrobe.length === 0 && <p style={{ ...mono, fontSize: 12, color: C.dim, letterSpacing: ".1em", padding: 12 }}>{t("Полка пока пуста. Добавьте хотя бы два аромата.", "The shelf is empty. Add at least two fragrances.")}</p>}
            {wardrobe.map((w) => (
              <div key={itemKey(w)} className="lay-chip" style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px 8px 8px", borderRadius: 14, border: `1px solid ${C.line}`, background: "rgba(255,255,255,.03)" }}>
                <MiniBottle color={colorFor(w)} size={24} />
                <span>
                  {w.brand && <span style={{ ...mono, display: "block", fontSize: 10, letterSpacing: ".12em", color: C.dim, textTransform: "uppercase" }}>{w.brand}</span>}
                  <span style={{ fontSize: 18 }}>{w.name}</span>
                </span>
                <button onClick={() => remove(w)} aria-label={t(`Убрать ${w.name}`, `Remove ${w.name}`)} style={{ color: C.dim, fontSize: 18, marginLeft: 4 }}>×</button>
              </div>
            ))}
          </div>

          {/* action */}
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 20, marginTop: 30 }}>
            {!supabase ? (
              <p style={{ ...mono, fontSize: 12, color: C.dim, letterSpacing: ".1em" }}>{t("Ателье открывается совсем скоро — гардероб уже сохраняется в этом браузере.", "The atelier opens very soon — your wardrobe is already saved in this browser.")}</p>
            ) : !session ? (
              <button className="lay-btn" onClick={() => signInWithGoogle()} style={{ ...mono, fontSize: 13, letterSpacing: ".2em", padding: "16px 26px", borderRadius: 999, background: C.ink, color: C.bg, display: "flex", alignItems: "center", gap: 12 }}>
                <GoogleMark /> {t("ВОЙТИ ЧЕРЕЗ GOOGLE, ЧТОБЫ СМЕШАТЬ", "SIGN IN WITH GOOGLE TO BLEND")}
              </button>
            ) : (
              <button className="lay-btn" onClick={generate} disabled={busy || wardrobe.length < 2 || remaining <= 0} style={{ ...mono, fontSize: 14, letterSpacing: ".25em", padding: "18px 34px", borderRadius: 999, background: `linear-gradient(90deg, ${C.gold}, ${C.rose})`, color: C.bg }}>
                {busy ? t("СМЕШИВАЮ…", "BLENDING…") : t("СМЕШАТЬ", "BLEND")}
              </button>
            )}
            {supabase && session && (
              <span style={{ ...mono, fontSize: 12, color: C.dim, letterSpacing: ".1em" }}>
                {t(`Осталось смешиваний: ${remaining} из ${LIMIT}`, `Blends left: ${remaining} of ${LIMIT}`)}
                {" · "}<button onClick={() => signOut()} style={{ color: C.dim, textDecoration: "underline" }}>{t("выйти", "sign out")}</button>
              </span>
            )}
            {supabase && !session && <span style={{ ...mono, fontSize: 12, color: C.dim }}>{t(`Три бесплатных смешивания на аккаунт.`, `Three free blends per account.`)}</span>}
          </div>
          {error && <p role="alert" style={{ ...mono, fontSize: 13, color: C.rose, marginTop: 16 }}>{error}</p>}

          {busy && (
            <div style={{ marginTop: 40, display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
              <div style={{ width: 220 }}><MergeVisual /></div>
              <p key={lineIdx} className="lay-line" style={{ fontSize: 24, fontStyle: "italic", color: C.dim }}>{LOADING_LINES[lang][lineIdx]}</p>
              <p style={{ ...mono, fontSize: 11, letterSpacing: ".15em", color: C.faint }}>{t("ОБЫЧНО ЭТО ЗАНИМАЕТ 30–60 СЕКУНД", "THIS USUALLY TAKES 30–60 SECONDS")}</p>
            </div>
          )}
        </section>

        {/* result */}
        {result && <div ref={resultRef} style={{ scrollMarginTop: 80 }}><ResultView result={result} colorByName={colorByName} lang={lang} t={t} navigate={navigate} /></div>}

        {/* history */}
        {history.length > 0 && (
          <section style={{ padding: "6vh 0 12vh" }}>
            <p style={{ ...mono, fontSize: 12, letterSpacing: ".3em", color: C.gold, marginBottom: 16 }}>{t("ВАШИ ПРОШЛЫЕ СМЕШИВАНИЯ", "YOUR PAST BLENDS")}</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {history.map((h) => (
                <button key={h.id} className="lay-chip" onClick={() => { setResult(h.result); setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth" }), 50); }} style={{ ...mono, fontSize: 12, padding: "10px 14px", borderRadius: 12, border: `1px solid ${C.line}`, color: C.ink }}>
                  {new Date(h.created_at).toLocaleDateString(lang === "ru" ? "ru-RU" : "en-GB", { day: "numeric", month: "long" })} · {h.result.combos.map((c) => c.title).slice(0, 2).join(" / ")}
                </button>
              ))}
            </div>
          </section>
        )}
      </main>

      <footer style={{ borderTop: `1px solid ${C.line}`, padding: "26px clamp(16px,5vw,64px)", ...mono, fontSize: 11, color: C.dim, letterSpacing: ".1em", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <span>Silentium · {t("Ателье лейеринга", "Layering atelier")}</span>
        <span>{t("Рецепты сочиняет ИИ-парфюмер дома. Доверяйте своей коже больше, чем любому рецепту.", "Recipes are composed by the house's AI perfumer. Trust your skin more than any recipe.")}</span>
      </footer>
    </div>
  );
}

function SectionTitle({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div style={{ marginBottom: 34 }}>
      <p style={{ ...mono, fontSize: 12, letterSpacing: ".3em", color: C.gold }}>{kicker}</p>
      <h2 style={{ fontSize: "clamp(2.4rem, 5.5vw, 4.4rem)", fontWeight: 300, fontStyle: "italic", lineHeight: 1, marginTop: 10 }}>{title}</h2>
    </div>
  );
}

function Option({ brand, name, hint, color, active, onPick }: { brand: string; name: string; hint?: string; color?: string; active: boolean; onPick: () => void }) {
  return (
    <button role="option" aria-selected={active} onMouseDown={(e) => { e.preventDefault(); onPick(); }} style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", textAlign: "left", padding: "10px 16px", background: active ? "rgba(239,232,220,.07)" : "transparent", borderBottom: `1px solid ${C.line}` }}>
      {color ? <MiniBottle color={color} size={18} /> : <span style={{ width: 18, textAlign: "center", color: C.gold }}>+</span>}
      <span style={{ flex: 1 }}>
        {brand && <span style={{ ...mono, fontSize: 10, letterSpacing: ".12em", color: brand === "Silentium" ? C.gold : C.dim, textTransform: "uppercase", marginRight: 10 }}>{brand}</span>}
        <span style={{ fontSize: 19, color: C.ink }}>{name}</span>
      </span>
      {hint && <span style={{ ...mono, fontSize: 11, color: C.dim }}>{hint}</span>}
    </button>
  );
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 48 48" width="18" height="18" aria-hidden>
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.5l6.7-6.7C35.6 2.4 30.2 0 24 0 14.6 0 6.6 5.4 2.7 13.3l7.8 6C12.4 13.7 17.7 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.2 5.3-4.6 6.9l7.4 5.7c4.3-4 6.9-9.9 6.9-17.1z" />
      <path fill="#FBBC05" d="M10.5 28.7c-.5-1.4-.8-3-.8-4.7s.3-3.2.8-4.7l-7.8-6C1 16.6 0 20.2 0 24s1 7.4 2.7 10.7l7.8-6z" />
      <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.8-5.8l-7.4-5.7c-2.1 1.4-4.8 2.3-8.4 2.3-6.3 0-11.6-4.2-13.5-9.9l-7.8 6C6.6 42.6 14.6 48 24 48z" />
    </svg>
  );
}

function ResultView({ result, colorByName, lang, t, navigate }: { result: LayeringResult; colorByName: (n: string) => string; lang: "ru" | "en"; t: (ru: string, en: string) => string; navigate: (to: string) => void }) {
  const roleLabel = (r: ComboPerfume["role"]) => (r === "base" ? t("база", "base") : r === "middle" ? t("середина", "middle") : t("верх", "top"));
  const bonus = result.silentium ? getPerfumeById(result.silentium.id) : undefined;
  return (
    <section style={{ padding: "4vh 0 10vh" }}>
      <p style={{ ...mono, fontSize: 12, letterSpacing: ".3em", color: C.gold }}>{t("РЕЦЕПТЫ", "THE RECIPES")}</p>
      <p style={{ fontSize: "clamp(1.6rem, 3.4vw, 2.6rem)", fontStyle: "italic", fontWeight: 300, lineHeight: 1.25, margin: "14px 0 40px", maxWidth: 900 }}>{result.intro}</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 22 }}>
        {result.combos.map((c, i) => (
          <article key={i} className="lay-card" style={{ animationDelay: `${i * 140}ms`, border: `1px solid ${C.line}`, borderRadius: 22, padding: 26, background: "linear-gradient(160deg, rgba(255,255,255,.04), rgba(255,255,255,.01))" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
              <h3 style={{ fontSize: 32, fontStyle: "italic", fontWeight: 400, lineHeight: 1.05 }}>{c.title}</h3>
              <span title={t("Интенсивность", "Intensity")} style={{ display: "flex", gap: 4, flex: "none" }}>
                {[1, 2, 3, 4, 5].map((k) => <span key={k} style={{ width: 7, height: 7, borderRadius: "50%", background: k <= c.intensity ? C.gold : C.faint }} />)}
              </span>
            </div>
            <p style={{ fontSize: 18, color: C.dim, margin: "10px 0 18px", lineHeight: 1.45 }}>{c.idea}</p>
            <LayerStack layers={c.perfumes.map((p) => ({ label: p.name, color: colorByName(p.name), note: `${roleLabel(p.role)} · ${p.sprays} ${t("пш.", "spr.")} · ${p.where}` }))} />
            <dl style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "10px 16px", marginTop: 20, fontSize: 17, lineHeight: 1.45 }}>
              {([[t("Как", "How"), c.application], [t("Звучит", "Smells"), c.result], [t("Настроение", "Mood"), c.mood], [t("Куда", "Where"), c.occasion], [t("Сезон", "Season"), c.season], [t("Почему", "Why"), c.why]] as const).map(([k, v]) => (
                <div key={k} style={{ display: "contents" }}>
                  <dt style={{ ...mono, fontSize: 10, letterSpacing: ".18em", color: C.gold, textTransform: "uppercase", paddingTop: 5 }}>{k}</dt>
                  <dd style={{ color: C.ink }}>{v}</dd>
                </div>
              ))}
            </dl>
          </article>
        ))}
      </div>

      {bonus && result.silentium && (
        <article className="lay-card" style={{ animationDelay: `${result.combos.length * 140}ms`, marginTop: 30, borderRadius: 26, padding: "30px clamp(20px,4vw,40px)", border: `1px solid ${C.gold}55`, background: `radial-gradient(ellipse at 0% 0%, ${BOTTLE_COLORS[bonus.id]?.glow ?? C.gold}22, transparent 60%), rgba(255,255,255,.02)`, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 26, alignItems: "center" }}>
          <div>
            <p style={{ ...mono, fontSize: 11, letterSpacing: ".3em", color: C.gold }}>{t("ЧЕГО НЕ ХВАТАЕТ ВАШЕЙ ПОЛКЕ", "WHAT YOUR SHELF IS MISSING")}</p>
            <h3 style={{ fontSize: 38, fontStyle: "italic", fontWeight: 400, lineHeight: 1.05, margin: "12px 0" }}>{result.silentium.title}</h3>
            <p style={{ fontSize: 18, color: C.dim, lineHeight: 1.5 }}>{result.silentium.why}</p>
            <button onClick={() => navigate(`/perfume/${bonus.id}`)} className="lay-btn" style={{ marginTop: 20, ...mono, fontSize: 12, letterSpacing: ".22em", padding: "14px 24px", borderRadius: 999, border: `1px solid ${C.gold}`, color: C.gold }}>{t(`ОТКРЫТЬ ${bonus.name.toUpperCase()} →`, `DISCOVER ${bonus.name.toUpperCase()} →`)}</button>
          </div>
          <div>
            <LayerStack layers={[{ label: result.silentium.pairWith, color: colorByName(result.silentium.pairWith) }, { label: `Silentium · ${bonus.name}`, color: BOTTLE_COLORS[bonus.id]?.liquid ?? C.gold }]} />
            <p style={{ fontSize: 17, lineHeight: 1.5, marginTop: 14 }}><span style={{ ...mono, fontSize: 10, letterSpacing: ".18em", color: C.gold }}>{t("КАК", "HOW")} </span>{result.silentium.application}</p>
            <p style={{ fontSize: 17, lineHeight: 1.5, marginTop: 8, color: C.dim }}>{result.silentium.result}</p>
          </div>
        </article>
      )}
      <p style={{ ...mono, fontSize: 11, color: C.dim, marginTop: 24 }}>{lang === "ru" ? "Это отправная точка. Начните с меньшего количества пшиков и доверяйте коже." : "This is a starting point. Begin with fewer sprays and trust your skin."}</p>
    </section>
  );
}
