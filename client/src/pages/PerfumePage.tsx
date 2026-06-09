// Silentium — Perfume Page
// Design: Void Romanticism — scroll-reveal sections, wider left panel, compact hero image
// Each content row fades in column-by-column as user scrolls down

import React, { useState, useEffect, useRef } from "react";
import { useLocation, useParams } from "wouter";
import { getPerfumeById } from "@/lib/perfumes";
import { useLang } from "@/contexts/LangContext";
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer,
} from "recharts";

// ── Intersection Observer hook for scroll-reveal ──
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.01, rootMargin: "0px 0px -20px 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

// Wrapper for a 3-column grid row — one observer triggers all 3 columns with stagger
function RevealGridRow({ children, cols = 3 }: { children: React.ReactNode; cols?: number }) {
  const { ref, visible } = useReveal();
  const items = React.Children.toArray(children);
  return (
    <>
      {/* Invisible sentinel that the observer watches */}
      <div ref={ref} style={{ gridColumn: `1 / -1`, height: 0, overflow: "hidden" }} />
      {items.map((child, i) =>
        React.isValidElement(child)
          ? React.cloneElement(child as React.ReactElement<{ style?: React.CSSProperties }>, {
              style: {
                ...(child as React.ReactElement<{ style?: React.CSSProperties }>).props.style,
                opacity: visible ? 1 : 0,
                transform: visible ? "translateY(0)" : "translateY(28px)",
                transition: `opacity 0.85s cubic-bezier(0.16,1,0.3,1) ${i * 220}ms, transform 0.85s cubic-bezier(0.16,1,0.3,1) ${i * 220}ms`,
              },
            })
          : child
      )}
    </>
  );
}

function RevealCol({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) {
  const { ref, visible } = useReveal();
  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(24px)",
        transition: `opacity 0.9s cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 0.9s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

function WaveformFake({ accentColor }: { accentColor: string }) {
  const bars = Array.from({ length: 80 }, (_, i) => {
    const h = 3 + Math.abs(Math.sin(i * 0.35 + 1) * 12) + Math.abs(Math.sin(i * 0.7) * 6);
    return h;
  });
  return (
    <div className="flex items-center gap-px" style={{ height: "28px" }}>
      {bars.map((h, i) => (
        <div key={i} style={{ width: "2px", height: `${h}px`, background: `${accentColor}55`, borderRadius: "1px" }} />
      ))}
    </div>
  );
}

function WorldMap({ accentColor, location }: { accentColor: string; location: string }) {
  return (
    <div style={{
      position: "relative", height: "110px",
      background: "rgba(255,255,255,0.02)",
      border: "0.5px solid rgba(255,255,255,0.06)",
      overflow: "hidden",
    }}>
      <svg viewBox="0 0 400 200" style={{ width: "100%", height: "100%", opacity: 0.22 }}>
        <path d="M 60 60 Q 80 50 100 55 Q 120 45 140 50 Q 160 55 155 70 Q 150 85 130 90 Q 110 95 90 85 Q 70 80 60 70 Z" fill="none" stroke={accentColor} strokeWidth="0.8"/>
        <path d="M 165 55 Q 185 45 210 50 Q 230 48 245 60 Q 255 75 250 90 Q 240 105 220 110 Q 195 115 175 105 Q 160 95 162 75 Z" fill="none" stroke={accentColor} strokeWidth="0.8"/>
        <path d="M 250 65 Q 280 55 310 60 Q 340 65 355 80 Q 365 95 355 115 Q 340 130 310 135 Q 280 138 260 125 Q 245 110 248 90 Z" fill="none" stroke={accentColor} strokeWidth="0.8"/>
        <path d="M 170 120 Q 185 115 200 120 Q 215 125 210 140 Q 200 155 185 155 Q 170 150 168 135 Z" fill="none" stroke={accentColor} strokeWidth="0.8"/>
        <path d="M 80 110 Q 95 105 110 112 Q 120 120 115 135 Q 105 145 90 142 Q 78 135 78 122 Z" fill="none" stroke={accentColor} strokeWidth="0.8"/>
        <path d="M 320 130 Q 340 125 355 135 Q 365 148 355 160 Q 340 168 325 162 Q 315 152 318 140 Z" fill="none" stroke={accentColor} strokeWidth="0.8"/>
        <circle cx="200" cy="90" r="3" fill={accentColor} opacity="0.9"/>
        <circle cx="200" cy="90" r="8" fill={accentColor} opacity="0.2"/>
        <circle cx="200" cy="90" r="14" fill={accentColor} opacity="0.07"/>
      </svg>
      <div style={{ position: "absolute", bottom: "8px", left: "10px" }}>
        <p style={{ color: "rgba(232,228,220,0.4)", fontSize: "0.52rem", fontFamily: "'DM Mono', monospace", letterSpacing: "0.12em" }}>
          {location}
        </p>
      </div>
    </div>
  );
}

export default function PerfumePage() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { lang, setLang, t } = useLang();
  const [showForm, setShowForm] = useState(false);
  const [pageVisible, setPageVisible] = useState(false);
  const [formData, setFormData] = useState({ name: "", telegram: "", phone: "", email: "" });
  const [formSent, setFormSent] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setPageVisible(true), 80);
    window.scrollTo(0, 0);
    return () => clearTimeout(timer);
  }, [params.id]);

  const perfume = getPerfumeById(params.id);

  if (!perfume) {
    return (
      <div className="flex items-center justify-center h-screen" style={{ background: "#080808" }}>
        <div className="text-center">
          <p className="font-mono-label" style={{ color: "rgba(232,228,220,0.3)" }}>
            {t("АРОМАТ НЕ НАЙДЕН", "FRAGRANCE NOT FOUND")}
          </p>
          <button onClick={() => navigate("/map")} className="font-mono-label mt-4 block" style={{ color: "#c9a96e", fontSize: "0.6rem" }}>
            ← {t("ВЕРНУТЬСЯ К КАРТЕ", "RETURN TO MAP")}
          </button>
        </div>
      </div>
    );
  }

  const { accentColor, accentColorDim, radarFill } = perfume;

  const radarData = perfume.radarAxes.map((axis) => ({
    subject: lang === "ru" ? axis.label.ru : axis.label.en,
    value: axis.value,
  }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormSent(true);
    setTimeout(() => { setShowForm(false); setFormSent(false); }, 2500);
  };

  // Shared cell style
  const cell = (extra?: React.CSSProperties): React.CSSProperties => ({
    padding: "1.5rem",
    borderTop: "0.5px solid rgba(255,255,255,0.06)",
    ...extra,
  });

  return (
    <div style={{
      background: "#080808",
      color: "#e8e4dc",
      opacity: pageVisible ? 1 : 0,
      transition: "opacity 0.6s ease",
      overflowX: "hidden",
    }}>

      {/* ── TOP NAV ── */}
      <div className="sticky top-0 z-50 flex items-center justify-between px-6 py-4"
        style={{ borderBottom: "0.5px solid rgba(255,255,255,0.06)", background: "rgba(8,8,8,0.96)", backdropFilter: "blur(12px)" }}>
        <div className="flex items-center gap-5">
          <button onClick={() => navigate("/map")}
            className="font-mono-label transition-colors duration-200"
            style={{ color: "rgba(232,228,220,0.35)", fontSize: "0.58rem" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = accentColor; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(232,228,220,0.35)"; }}>
            ← {t("ВЕРНУТЬСЯ К КАРТЕ", "RETURN TO MAP")}
          </button>
          <span style={{ color: "rgba(255,255,255,0.08)" }}>|</span>
          <span className="font-mono-label" style={{ color: "rgba(232,228,220,0.2)", fontSize: "0.58rem" }}>
            {t("ЭМОЦИОНАЛЬНАЯ КАРТА", "EMOTIONAL MAP")}
          </span>
        </div>
        <div className="flex items-center gap-5">
          <span className="font-mono-label" style={{ color: "rgba(232,228,220,0.2)", fontSize: "0.58rem" }}>SILENTIUM</span>
          <div className="flex items-center gap-2">
            <button onClick={() => setLang("ru")} className="font-mono-label text-xs transition-colors duration-200"
              style={{ color: lang === "ru" ? accentColor : "rgba(232,228,220,0.3)" }}>RU</button>
            <span style={{ color: "rgba(232,228,220,0.15)", fontSize: "0.6rem" }}>|</span>
            <button onClick={() => setLang("en")} className="font-mono-label text-xs transition-colors duration-200"
              style={{ color: lang === "en" ? accentColor : "rgba(232,228,220,0.3)" }}>EN</button>
          </div>
          <div className="flex items-end gap-px">
            {[3,5,7,9,11,9,7,5].map((h,i) => (
              <div key={i} style={{ width:"2px", height:`${h}px`, background: i < 6 ? `${accentColor}99` : "rgba(255,255,255,0.1)", borderRadius:"1px" }} />
            ))}
          </div>
        </div>
      </div>

      {/* ── SECTION 1: LEFT PANEL + HERO IMAGE ── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "360px 1fr",
        minHeight: "100vh",
      }}>
        {/* Left sticky panel */}
        <div style={{
          borderRight: "0.5px solid rgba(255,255,255,0.06)",
          padding: "2.5rem 2rem",
          display: "flex",
          flexDirection: "column",
          gap: "1.5rem",
          position: "sticky",
          top: "57px",
          height: "calc(100vh - 57px)",
          overflowY: "auto",
          scrollbarWidth: "none",
        }}>
          {/* Tags */}
          <div className="flex flex-wrap gap-1.5">
            {perfume.emotionalPath.map((e) => (
              <span key={e} className="font-mono-label" style={{
                color: `${accentColor}cc`, fontSize: "0.5rem",
                border: `0.5px solid ${accentColor}44`, padding: "2px 7px",
              }}>{e.toLowerCase()}</span>
            ))}
          </div>

          {/* Title */}
          <h1 className="font-display" style={{
            fontSize: "clamp(1.8rem, 3.5vw, 2.8rem)",
            fontWeight: 400,
            color: accentColor,
            lineHeight: 1.05,
            letterSpacing: "0.02em",
            textTransform: "uppercase",
          }}>
            {perfume.name}
          </h1>

          {/* Tagline */}
          <p style={{ color: "rgba(232,228,220,0.35)", fontSize: "0.68rem", fontFamily: "'DM Mono', monospace", letterSpacing: "0.06em" }}>
            {perfume.emotionalPath.map((e) => e.toLowerCase()).join(" · ")}
          </p>

          {/* Description */}
          <p style={{
            color: "rgba(232,228,220,0.6)", fontSize: "0.8rem",
            fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", lineHeight: 1.8,
          }}>
            {lang === "ru" ? perfume.description.ru : perfume.description.en}
          </p>

          {/* Origin */}
          <div>
            <p className="font-mono-label mb-1.5" style={{ color: "rgba(232,228,220,0.25)", fontSize: "0.5rem" }}>ORIGIN</p>
            <p style={{ color: accentColor, fontSize: "0.68rem", fontFamily: "'DM Mono', monospace", lineHeight: 1.6 }}>
              {perfume.origin.coords}
            </p>
            <p style={{ color: "rgba(232,228,220,0.45)", fontSize: "0.68rem", fontFamily: "'DM Mono', monospace" }}>
              {lang === "ru" ? perfume.origin.location.ru : perfume.origin.location.en}
            </p>
          </div>

          {/* Open Location */}
          <button style={{
            border: "0.5px solid rgba(232,228,220,0.2)", background: "transparent",
            padding: "0.75rem 1rem", color: "#e8e4dc",
            fontFamily: "'DM Mono', monospace", fontSize: "0.6rem",
            letterSpacing: "0.15em", textTransform: "uppercase",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            transition: "all 0.25s ease",
          }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = accentColor; (e.currentTarget as HTMLElement).style.color = accentColor; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(232,228,220,0.2)"; (e.currentTarget as HTMLElement).style.color = "#e8e4dc"; }}
          >
            {t("OPEN LOCATION", "OPEN LOCATION")} <span>↗</span>
          </button>
          <p style={{ color: "rgba(232,228,220,0.18)", fontSize: "0.5rem", fontFamily: "'DM Mono', monospace" }}>
            VIEW ON GOOGLE MAPS
          </p>
        </div>

        {/* Right: hero image */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ position: "relative", height: "calc(100vh - 57px)", overflow: "hidden" }}>
            <p className="font-mono-label absolute top-4 left-4 z-10" style={{ color: "rgba(232,228,220,0.3)", fontSize: "0.5rem" }}>
              VISUAL REFERENCE
            </p>
            <p className="font-mono-label absolute top-4 right-4 z-10" style={{ color: "rgba(232,228,220,0.3)", fontSize: "0.5rem" }}>
              01 / 01
            </p>
            <img
              src={perfume.heroImage}
              alt={perfume.name}
              style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", filter: "brightness(0.78) contrast(1.06)" }}
            />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 55%, rgba(8,8,8,0.75) 100%)" }} />
          </div>
        </div>
      </div>

      {/* ── SECTION 2: SCENT NOTES + RADAR + DESCRIPTION ── */}
      <div>
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          borderTop: "0.5px solid rgba(255,255,255,0.06)",
        }}>
          <RevealGridRow>
          {/* Col 1: Scent Notes */}
          <div style={{ padding: "2rem 1.5rem", borderRight: "0.5px solid rgba(255,255,255,0.06)", minHeight: "520px" }}>
              <p className="font-mono-label mb-5" style={{ color: "rgba(232,228,220,0.3)", fontSize: "0.55rem" }}>
                {t("SCENT NOTES", "SCENT NOTES")}
              </p>
              {perfume.scentNotes.all ? (
                <div className="flex flex-col gap-1">
                  {(lang === "ru" ? perfume.scentNotes.all.ru : perfume.scentNotes.all.en).map((note) => (
                    <p key={note} style={{ color: "rgba(232,228,220,0.65)", fontSize: "0.78rem", fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", lineHeight: 1.75 }}>{note}</p>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col gap-5">
                  {perfume.scentNotes.top && (
                    <div>
                      <p className="font-mono-label mb-2" style={{ color: "rgba(232,228,220,0.2)", fontSize: "0.48rem" }}>TOP</p>
                      {(lang === "ru" ? perfume.scentNotes.top.ru : perfume.scentNotes.top.en).map((note) => (
                        <p key={note} style={{ color: "rgba(232,228,220,0.65)", fontSize: "0.78rem", fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", lineHeight: 1.75 }}>{note}</p>
                      ))}
                    </div>
                  )}
                  {perfume.scentNotes.heart && (
                    <div>
                      <p className="font-mono-label mb-2" style={{ color: "rgba(232,228,220,0.2)", fontSize: "0.48rem" }}>HEART</p>
                      {(lang === "ru" ? perfume.scentNotes.heart.ru : perfume.scentNotes.heart.en).map((note) => (
                        <p key={note} style={{ color: "rgba(232,228,220,0.65)", fontSize: "0.78rem", fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", lineHeight: 1.75 }}>{note}</p>
                      ))}
                    </div>
                  )}
                  {perfume.scentNotes.base && (
                    <div>
                      <p className="font-mono-label mb-2" style={{ color: "rgba(232,228,220,0.2)", fontSize: "0.48rem" }}>BASE</p>
                      {(lang === "ru" ? perfume.scentNotes.base.ru : perfume.scentNotes.base.en).map((note) => (
                        <p key={note} style={{ color: "rgba(232,228,220,0.65)", fontSize: "0.78rem", fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", lineHeight: 1.75 }}>{note}</p>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <p className="font-mono-label mt-5" style={{ color: `${accentColor}77`, fontSize: "0.48rem" }}>
                {lang === "ru" ? perfume.keywords.ru : perfume.keywords.en}
              </p>
          </div>

          {/* Col 2: Emotional Profile */}
          <div style={{ padding: "2rem 1.5rem", borderRight: "0.5px solid rgba(255,255,255,0.06)", minHeight: "520px" }}>
              <p className="font-mono-label mb-4" style={{ color: "rgba(232,228,220,0.3)", fontSize: "0.55rem" }}>
                {t("EMOTIONAL PROFILE", "EMOTIONAL PROFILE")} ✦
              </p>
              <div style={{ height: "220px" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke={`${accentColor}22`} />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: "rgba(232,228,220,0.4)", fontSize: 8, fontFamily: "'DM Mono', monospace" }} />
                    <Radar name="profile" dataKey="value" stroke={accentColor} fill={radarFill} strokeWidth={0.8} dot={{ fill: accentColor, r: 2 }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-col gap-2 mt-3">
                {perfume.radarAxes.map((axis) => (
                  <div key={axis.key} className="flex items-center justify-between">
                    <span className="font-mono-label" style={{ color: "rgba(232,228,220,0.3)", fontSize: "0.48rem" }}>
                      {(lang === "ru" ? axis.label.ru : axis.label.en).toUpperCase()}
                    </span>
                    <span className="font-mono-label" style={{ color: accentColor, fontSize: "0.55rem" }}>{axis.value}%</span>
                  </div>
                ))}
              </div>
          </div>

          {/* Col 3: Description + World Map + Location */}
          <div style={{ padding: "2rem 1.5rem", minHeight: "520px", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div>
                <p className="font-mono-label mb-2" style={{ color: "rgba(232,228,220,0.3)", fontSize: "0.55rem" }}>
                  {t("DESCRIPTION", "DESCRIPTION")}
                </p>
                <p style={{ color: "rgba(232,228,220,0.55)", fontSize: "0.78rem", fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", lineHeight: 1.8 }}>
                  {lang === "ru" ? perfume.description.ru : perfume.description.en}
                </p>
              </div>
              <div>
                <p className="font-mono-label mb-2" style={{ color: "rgba(232,228,220,0.25)", fontSize: "0.5rem" }}>
                  {t("WORLD MANIFESTATION", "WORLD MANIFESTATION")}
                </p>
                <WorldMap accentColor={accentColor} location={lang === "ru" ? perfume.origin.location.ru : perfume.origin.location.en} />
              </div>
              <div style={{ borderTop: "0.5px solid rgba(255,255,255,0.06)", paddingTop: "1rem" }}>
                <p className="font-mono-label mb-2" style={{ color: "rgba(232,228,220,0.25)", fontSize: "0.5rem" }}>
                  {t("PHYSICAL LOCATION", "PHYSICAL LOCATION")}
                </p>
                <div style={{ border: "0.5px solid rgba(255,255,255,0.08)", padding: "0.7rem" }}>
                  <p style={{ color: accentColor, fontSize: "0.63rem", fontFamily: "'DM Mono', monospace", lineHeight: 1.6 }}>{perfume.origin.coords}</p>
                  <p style={{ color: "rgba(232,228,220,0.45)", fontSize: "0.63rem", fontFamily: "'DM Mono', monospace" }}>
                    {lang === "ru" ? perfume.origin.location.ru : perfume.origin.location.en}
                  </p>
                </div>
              </div>
          </div>
          </RevealGridRow>
        </div>

        {/* ── SECTION 3: MEMORY FRAGMENTS + AMBIENT + REQUEST ── */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          borderTop: "0.5px solid rgba(255,255,255,0.06)",
        }}>
          <RevealGridRow>
          {/* Memory Fragments */}
          <div style={{ padding: "2rem 1.5rem", borderRight: "0.5px solid rgba(255,255,255,0.06)" }}>
              <p className="font-mono-label mb-4" style={{ color: "rgba(232,228,220,0.3)", fontSize: "0.5rem" }}>
                {t("MEMORY FRAGMENTS", "MEMORY FRAGMENTS")}
              </p>
              <div className="flex flex-col gap-2">
                {(lang === "ru" ? perfume.memoryFragments.ru : perfume.memoryFragments.en).map((f, i) => (
                  <p key={i} style={{ color: `${accentColor}bb`, fontSize: "0.65rem", fontFamily: "'DM Mono', monospace", lineHeight: 1.6 }}>{f}</p>
                ))}
                <p style={{ color: "rgba(232,228,220,0.2)", fontSize: "0.6rem", fontFamily: "'DM Mono', monospace" }}>...</p>
              </div>
              <p className="font-mono-label mt-4" style={{ color: "rgba(232,228,220,0.2)", fontSize: "0.48rem" }}>
                {t("FRAGMENTS RECOVERED", "FRAGMENTS RECOVERED")}: {perfume.memoryFragments.ru.length} / 12
              </p>
          </div>

          {/* Ambient Memory */}
          <div style={{ padding: "2rem 1.5rem", borderRight: "0.5px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column", gap: "1rem" }}>
              <p className="font-mono-label" style={{ color: "rgba(232,228,220,0.3)", fontSize: "0.5rem" }}>
                {t("AMBIENT MEMORY", "AMBIENT MEMORY")}
              </p>
              <WaveformFake accentColor={accentColor} />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span style={{ color: "rgba(232,228,220,0.25)", fontSize: "0.75rem" }}>▶</span>
                  <span className="font-mono-label" style={{ color: "rgba(232,228,220,0.3)", fontSize: "0.5rem" }}>
                    {t("PLAY AMBIENCE", "PLAY AMBIENCE")}
                  </span>
                </div>
                <span className="font-mono-label" style={{ color: "rgba(232,228,220,0.2)", fontSize: "0.5rem" }}>03:28</span>
              </div>
          </div>

          {/* Request */}
          <div style={{ padding: "2rem 1.5rem", display: "flex", flexDirection: "column", justifyContent: "flex-end", gap: "0.75rem" }}>
              <button
                onClick={() => setShowForm(true)}
                style={{
                  border: `0.5px solid ${accentColor}88`, background: "transparent",
                  padding: "1rem 1.25rem", color: "#e8e4dc",
                  fontFamily: "'DM Mono', monospace", fontSize: "0.6rem",
                  letterSpacing: "0.15em", textTransform: "uppercase",
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  transition: "all 0.3s ease",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = accentColor;
                  (e.currentTarget as HTMLElement).style.background = `${accentColor}0d`;
                  (e.currentTarget as HTMLElement).style.color = accentColor;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = `${accentColor}88`;
                  (e.currentTarget as HTMLElement).style.background = "transparent";
                  (e.currentTarget as HTMLElement).style.color = "#e8e4dc";
                }}
              >
                {t("REQUEST MANIFESTATION", "REQUEST MANIFESTATION")} <span>↗</span>
              </button>
          </div>
          </RevealGridRow>
        </div>

        {/* ── FOOTER ROW ── */}
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
          borderTop: "0.5px solid rgba(255,255,255,0.06)",
          padding: "1.25rem 1.5rem",
        }}>
          <div>
            <p className="font-mono-label" style={{ color: "rgba(232,228,220,0.2)", fontSize: "0.48rem" }}>{t("RELEASE", "RELEASE")}</p>
            <p className="font-mono-label mt-1" style={{ color: "rgba(232,228,220,0.5)", fontSize: "0.6rem" }}>{perfume.releaseDate}</p>
          </div>
          <div>
            <p className="font-mono-label" style={{ color: "rgba(232,228,220,0.2)", fontSize: "0.48rem" }}>{t("CONCENTRATION", "CONCENTRATION")}</p>
            <p className="font-mono-label mt-1" style={{ color: "rgba(232,228,220,0.5)", fontSize: "0.6rem" }}>EXTRAIT DE PARFUM</p>
          </div>
          <div>
            <p className="font-mono-label" style={{ color: "rgba(232,228,220,0.2)", fontSize: "0.48rem" }}>{t("STATUS", "STATUS")}</p>
            <p className="font-mono-label mt-1" style={{ color: accentColor, fontSize: "0.6rem" }}>{t("AVAILABLE", "AVAILABLE")}</p>
          </div>
        </div>
      </div>

      {/* ── REQUEST FORM MODAL ── */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(8,8,8,0.93)", backdropFilter: "blur(10px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowForm(false); }}
        >
          <div style={{
            border: `0.5px solid ${accentColor}55`, background: "#0d0d0d",
            padding: "2.5rem", width: "100%", maxWidth: "420px",
          }}>
            {formSent ? (
              <div className="text-center py-8">
                <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: accentColor, margin: "0 auto 1rem", boxShadow: `0 0 20px ${accentColor}` }} />
                <p className="font-mono-label" style={{ color: accentColor, fontSize: "0.6rem", letterSpacing: "0.2em" }}>
                  {t("ЗАПРОС ОТПРАВЛЕН", "REQUEST SENT")}
                </p>
                <p className="font-display mt-3" style={{ color: "rgba(232,228,220,0.5)", fontStyle: "italic", fontSize: "1rem" }}>
                  {t("Мы свяжемся с вами", "We will contact you")}
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="font-mono-label" style={{ color: "rgba(232,228,220,0.3)", fontSize: "0.5rem" }}>
                      {t("ЗАПРОС АРОМАТА", "FRAGRANCE REQUEST")}
                    </p>
                    <p className="font-display mt-1" style={{ color: accentColor, fontStyle: "italic", fontSize: "1.3rem" }}>
                      {perfume.name}
                    </p>
                  </div>
                  <button onClick={() => setShowForm(false)}
                    style={{ color: "rgba(232,228,220,0.3)", fontSize: "1.4rem", lineHeight: 1 }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#e8e4dc"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(232,228,220,0.3)"; }}>
                    ×
                  </button>
                </div>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  {[
                    { key: "name", label: t("ИМЯ", "NAME"), placeholder: t("Ваше имя", "Your name"), required: true },
                    { key: "telegram", label: "TELEGRAM", placeholder: "@username", required: false },
                    { key: "phone", label: t("ТЕЛЕФОН", "PHONE"), placeholder: "+7 (___) ___-__-__", required: false },
                    { key: "email", label: "EMAIL", placeholder: "email@example.com", required: false },
                  ].map(({ key, label, placeholder, required }) => (
                    <div key={key}>
                      <label className="font-mono-label block mb-1.5" style={{ color: "rgba(232,228,220,0.3)", fontSize: "0.48rem" }}>
                        {label}{required && <span style={{ color: accentColor, marginLeft: "4px" }}>*</span>}
                      </label>
                      <input
                        type="text" placeholder={placeholder}
                        value={formData[key as keyof typeof formData]}
                        onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                        required={required}
                        style={{
                          width: "100%", background: "rgba(255,255,255,0.03)",
                          border: "0.5px solid rgba(255,255,255,0.1)",
                          padding: "0.7rem 1rem", color: "#e8e4dc",
                          fontFamily: "'DM Mono', monospace", fontSize: "0.72rem",
                          outline: "none", transition: "border-color 0.2s ease",
                        }}
                        onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = `${accentColor}88`; }}
                        onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = "rgba(255,255,255,0.1)"; }}
                      />
                    </div>
                  ))}
                  <button type="submit" style={{
                    marginTop: "0.5rem", border: `0.5px solid ${accentColor}88`,
                    background: "transparent", padding: "0.9rem", color: "#e8e4dc",
                    fontFamily: "'DM Mono', monospace", fontSize: "0.6rem",
                    letterSpacing: "0.2em", textTransform: "uppercase",
                    transition: "all 0.3s ease", display: "flex",
                    alignItems: "center", justifyContent: "center", gap: "0.75rem",
                  }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.background = `${accentColor}12`;
                      (e.currentTarget as HTMLElement).style.borderColor = accentColor;
                      (e.currentTarget as HTMLElement).style.color = accentColor;
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background = "transparent";
                      (e.currentTarget as HTMLElement).style.borderColor = `${accentColor}88`;
                      (e.currentTarget as HTMLElement).style.color = "#e8e4dc";
                    }}
                  >
                    {t("ОТПРАВИТЬ ЗАПРОС", "SEND REQUEST")} ↗
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
