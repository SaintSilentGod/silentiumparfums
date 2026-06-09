// Silentium — Perfume Page
// Design: Void Romanticism — editorial dark layout, radar chart, scent notes, request form
// Reference: second image (Summer of 2009 page)

import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { getPerfumeById } from "@/lib/perfumes";
import { useLang } from "@/contexts/LangContext";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from "recharts";

const EMOTION_TRANSLATIONS: Record<string, { ru: string; en: string }> = {
  love: { ru: "Любовь", en: "Love" },
  isolation: { ru: "Изоляция", en: "Isolation" },
  melancholy: { ru: "Меланхолия", en: "Melancholy" },
  memoryClarity: { ru: "Ясность памяти", en: "Memory Clarity" },
  warmth: { ru: "Тепло", en: "Warmth" },
};

const EMOTION_PATH_TRANSLATIONS: Record<string, { ru: string; en: string }> = {
  Love: { ru: "Любовь", en: "Love" },
  Isolation: { ru: "Изоляция", en: "Isolation" },
  Euphoria: { ru: "Эйфория", en: "Euphoria" },
  Ritual: { ru: "Ритуал", en: "Ritual" },
  Nostalgia: { ru: "Ностальгия", en: "Nostalgia" },
  Obsession: { ru: "Одержимость", en: "Obsession" },
  Warmth: { ru: "Тепло", en: "Warmth" },
  Fear: { ru: "Страх", en: "Fear" },
  Silence: { ru: "Тишина", en: "Silence" },
  Peace: { ru: "Покой", en: "Peace" },
  Madness: { ru: "Безумие", en: "Madness" },
  Confidence: { ru: "Уверенность", en: "Confidence" },
};

function WaveformFake() {
  const bars = Array.from({ length: 60 }, (_, i) => {
    const h = 4 + Math.abs(Math.sin(i * 0.4 + 1) * 14) + Math.abs(Math.sin(i * 0.8) * 8);
    return h;
  });
  return (
    <div className="flex items-center gap-px" style={{ height: "32px" }}>
      {bars.map((h, i) => (
        <div
          key={i}
          style={{
            width: "2px",
            height: `${h}px`,
            background: "rgba(201,169,110,0.35)",
            borderRadius: "1px",
          }}
        />
      ))}
    </div>
  );
}

export default function PerfumePage() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { lang, setLang, t } = useLang();
  const [showForm, setShowForm] = useState(false);
  const [pageVisible, setPageVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setPageVisible(true), 100);
    return () => clearTimeout(t);
  }, []);
  const [formData, setFormData] = useState({ name: "", telegram: "", phone: "", email: "" });
  const [formSent, setFormSent] = useState(false);

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

  const radarData = [
    { subject: lang === "ru" ? "Любовь" : "Love", value: perfume.emotionalProfile.love },
    { subject: lang === "ru" ? "Изоляция" : "Isolation", value: perfume.emotionalProfile.isolation },
    { subject: lang === "ru" ? "Меланхолия" : "Melancholy", value: perfume.emotionalProfile.melancholy },
    { subject: lang === "ru" ? "Ясность" : "Clarity", value: perfume.emotionalProfile.memoryClarity },
    { subject: lang === "ru" ? "Тепло" : "Warmth", value: perfume.emotionalProfile.warmth },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormSent(true);
    setTimeout(() => setShowForm(false), 2000);
  };

  return (
    <div style={{ background: "#080808", minHeight: "100vh", color: "#e8e4dc", opacity: pageVisible ? 1 : 0, transform: pageVisible ? "translateY(0)" : "translateY(12px)", transition: "opacity 0.8s cubic-bezier(0.16,1,0.3,1), transform 0.8s cubic-bezier(0.16,1,0.3,1)" }}>
      {/* Top navigation */}
      <div
        className="sticky top-0 z-50 flex items-center justify-between px-8 py-5"
        style={{ borderBottom: "0.5px solid rgba(255,255,255,0.06)", background: "rgba(8,8,8,0.95)", backdropFilter: "blur(10px)" }}
      >
        <div className="flex items-center gap-6">
          <button
            onClick={() => navigate("/map")}
            className="font-mono-label transition-colors duration-200"
            style={{ color: "rgba(232,228,220,0.3)", fontSize: "0.6rem" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#c9a96e"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(232,228,220,0.3)"; }}
          >
            ← {t("ВЕРНУТЬСЯ К КАРТЕ", "RETURN TO MAP")}
          </button>
          <span style={{ color: "rgba(255,255,255,0.1)", fontSize: "0.6rem" }}>|</span>
          <span className="font-mono-label" style={{ color: "rgba(232,228,220,0.2)", fontSize: "0.6rem" }}>
            {t("ЭМОЦИОНАЛЬНАЯ КАРТА", "EMOTIONAL MAP")}
          </span>
        </div>
        <div className="flex items-center gap-6">
          <span className="font-mono-label" style={{ color: "rgba(232,228,220,0.2)", fontSize: "0.6rem" }}>
            SILENTIUM
          </span>
          <div className="flex items-center gap-3">
            <button onClick={() => setLang("ru")} className="font-mono-label text-xs transition-colors duration-200"
              style={{ color: lang === "ru" ? "#c9a96e" : "rgba(232,228,220,0.3)" }}>RU</button>
            <span style={{ color: "rgba(232,228,220,0.15)", fontSize: "0.6rem" }}>|</span>
            <button onClick={() => setLang("en")} className="font-mono-label text-xs transition-colors duration-200"
              style={{ color: lang === "en" ? "#c9a96e" : "rgba(232,228,220,0.3)" }}>EN</button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-12">
        {/* Top section: left info + right hero image */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
          {/* Left: Name + description */}
          <div className="flex flex-col justify-between" style={{ minHeight: "400px" }}>
            <div>
              <div className="flex flex-wrap gap-2 mb-6">
                {perfume.emotionalPath.map((e) => (
                  <span key={e} className="font-mono-label" style={{
                    color: "rgba(201,169,110,0.6)",
                    fontSize: "0.55rem",
                    border: "0.5px solid rgba(201,169,110,0.2)",
                    padding: "3px 8px",
                  }}>
                    {(EMOTION_PATH_TRANSLATIONS[e]?.[lang] ?? e).toUpperCase()}
                  </span>
                ))}
              </div>

              <h1 className="font-display" style={{
                fontSize: "clamp(2.5rem, 6vw, 5rem)",
                fontWeight: 400,
                fontStyle: "italic",
                color: "#e8e4dc",
                lineHeight: 1.05,
                letterSpacing: "-0.01em",
                marginBottom: "1.5rem",
              }}>
                {perfume.name}
              </h1>

              <div style={{ width: "60px", height: "0.5px", background: "rgba(201,169,110,0.4)", marginBottom: "1.5rem" }} />

              <p style={{
                color: "rgba(232,228,220,0.6)",
                fontSize: "1rem",
                fontFamily: "'Cormorant Garamond', serif",
                fontStyle: "italic",
                lineHeight: 1.7,
                maxWidth: "440px",
              }}>
                {lang === "ru" ? perfume.description.ru : perfume.description.en}
              </p>
            </div>

            <div className="flex flex-col gap-4 mt-8">
              <button
                onClick={() => setShowForm(true)}
                style={{
                  border: "0.5px solid rgba(201,169,110,0.5)",
                  background: "transparent",
                  padding: "1rem 2rem",
                  color: "#e8e4dc",
                  fontFamily: "'DM Mono', monospace",
                  fontSize: "0.65rem",
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  transition: "all 0.3s ease",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  maxWidth: "280px",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(201,169,110,1)";
                  (e.currentTarget as HTMLElement).style.background = "rgba(201,169,110,0.06)";
                  (e.currentTarget as HTMLElement).style.color = "#c9a96e";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(201,169,110,0.5)";
                  (e.currentTarget as HTMLElement).style.background = "transparent";
                  (e.currentTarget as HTMLElement).style.color = "#e8e4dc";
                }}
              >
                {t("ЗАПРОСИТЬ АРОМАТ", "REQUEST FRAGRANCE")}
                <span style={{ marginLeft: "1rem" }}>↗</span>
              </button>
            </div>
          </div>

          {/* Right: Hero image */}
          <div style={{
            position: "relative",
            height: "480px",
            overflow: "hidden",
            border: "0.5px solid rgba(255,255,255,0.06)",
          }}>
            <img
              src="https://d2xsxph8kpxj0f.cloudfront.net/120386225/Z5Dj7KAQS93qgLNa7h9H2n/perfume-detail-HgXjcpwxD3dbumE8WXCxXQ.webp"
              alt={perfume.name}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                filter: "brightness(0.75) contrast(1.1)",
              }}
            />
            <div style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(to bottom, transparent 50%, rgba(8,8,8,0.8) 100%)",
            }} />
            <div style={{
              position: "absolute",
              bottom: "1.5rem",
              left: "1.5rem",
            }}>
              <span className="font-mono-label" style={{ color: "rgba(232,228,220,0.3)", fontSize: "0.55rem" }}>
                {t("ВИЗУАЛЬНЫЙ РЕФЕРЕНС", "VISUAL REFERENCE")} 01/01
              </span>
            </div>
          </div>
        </div>

        {/* Bottom grid: scent notes + emotional profile + description + ambient */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0" style={{ border: "0.5px solid rgba(255,255,255,0.06)" }}>
          {/* Scent Notes */}
          <div style={{ padding: "2rem", borderRight: "0.5px solid rgba(255,255,255,0.06)" }}>
            <p className="font-mono-label mb-6" style={{ color: "rgba(232,228,220,0.3)", fontSize: "0.6rem" }}>
              {t("НОТЫ АРОМАТА", "SCENT NOTES")}
            </p>

            {perfume.scentNotes.all ? (
              <div>
                <div className="flex flex-wrap gap-1">
                  {(lang === "ru" ? perfume.scentNotes.all.ru : perfume.scentNotes.all.en).map((note) => (
                    <span key={note} style={{
                      color: "rgba(232,228,220,0.6)",
                      fontSize: "0.75rem",
                      fontFamily: "'Cormorant Garamond', serif",
                      fontStyle: "italic",
                    }}>
                      {note}
                      <span style={{ color: "rgba(201,169,110,0.3)", margin: "0 4px" }}>·</span>
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-5">
                {perfume.scentNotes.top && (
                  <div>
                    <p className="font-mono-label mb-2" style={{ color: "rgba(232,228,220,0.2)", fontSize: "0.5rem" }}>
                      {t("ВЕРХНИЕ", "TOP")}
                    </p>
                    {(lang === "ru" ? perfume.scentNotes.top.ru : perfume.scentNotes.top.en).map((note) => (
                      <p key={note} style={{ color: "rgba(232,228,220,0.65)", fontSize: "0.8rem", fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", lineHeight: 1.8 }}>
                        {note}
                      </p>
                    ))}
                  </div>
                )}
                {perfume.scentNotes.heart && (
                  <div>
                    <p className="font-mono-label mb-2" style={{ color: "rgba(232,228,220,0.2)", fontSize: "0.5rem" }}>
                      {t("СЕРДЦЕ", "HEART")}
                    </p>
                    {(lang === "ru" ? perfume.scentNotes.heart.ru : perfume.scentNotes.heart.en).map((note) => (
                      <p key={note} style={{ color: "rgba(232,228,220,0.65)", fontSize: "0.8rem", fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", lineHeight: 1.8 }}>
                        {note}
                      </p>
                    ))}
                  </div>
                )}
                {perfume.scentNotes.base && (
                  <div>
                    <p className="font-mono-label mb-2" style={{ color: "rgba(232,228,220,0.2)", fontSize: "0.5rem" }}>
                      {t("БАЗА", "BASE")}
                    </p>
                    {(lang === "ru" ? perfume.scentNotes.base.ru : perfume.scentNotes.base.en).map((note) => (
                      <p key={note} style={{ color: "rgba(232,228,220,0.65)", fontSize: "0.8rem", fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", lineHeight: 1.8 }}>
                        {note}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Emotional Profile Radar */}
          <div style={{ padding: "2rem", borderRight: "0.5px solid rgba(255,255,255,0.06)" }}>
            <p className="font-mono-label mb-4" style={{ color: "rgba(232,228,220,0.3)", fontSize: "0.6rem" }}>
              {t("ЭМОЦИОНАЛЬНЫЙ ПРОФИЛЬ", "EMOTIONAL PROFILE")}
            </p>
            <div style={{ height: "220px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="rgba(255,255,255,0.08)" />
                  <PolarAngleAxis
                    dataKey="subject"
                    tick={{
                      fill: "rgba(232,228,220,0.4)",
                      fontSize: 9,
                      fontFamily: "'DM Mono', monospace",
                    }}
                  />
                  <Radar
                    name="profile"
                    dataKey="value"
                    stroke="rgba(201,169,110,0.8)"
                    fill="rgba(201,169,110,0.12)"
                    strokeWidth={1}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            {/* Percentages */}
            <div className="flex flex-col gap-2 mt-4">
              {Object.entries(perfume.emotionalProfile).map(([key, val]) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="font-mono-label" style={{ color: "rgba(232,228,220,0.35)", fontSize: "0.5rem" }}>
                    {(EMOTION_TRANSLATIONS[key]?.[lang] ?? key).toUpperCase()}
                  </span>
                  <div className="flex items-center gap-2">
                    <div style={{
                      width: "60px", height: "1px",
                      background: `linear-gradient(to right, rgba(201,169,110,${val / 100 * 0.8}), rgba(201,169,110,0.1))`,
                    }} />
                    <span className="font-mono-label" style={{ color: "rgba(201,169,110,0.6)", fontSize: "0.5rem" }}>
                      {val}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Description + Ambient */}
          <div style={{ padding: "2rem" }}>
            <p className="font-mono-label mb-4" style={{ color: "rgba(232,228,220,0.3)", fontSize: "0.6rem" }}>
              {t("ОПИСАНИЕ", "DESCRIPTION")}
            </p>
            <p style={{
              color: "rgba(232,228,220,0.55)",
              fontSize: "0.85rem",
              fontFamily: "'Cormorant Garamond', serif",
              fontStyle: "italic",
              lineHeight: 1.8,
              marginBottom: "2rem",
            }}>
              {lang === "ru" ? perfume.description.ru : perfume.description.en}
            </p>

            <div style={{ borderTop: "0.5px solid rgba(255,255,255,0.06)", paddingTop: "1.5rem" }}>
              <p className="font-mono-label mb-3" style={{ color: "rgba(232,228,220,0.3)", fontSize: "0.6rem" }}>
                {t("AMBIENT MEMORY", "AMBIENT MEMORY")}
              </p>
              <WaveformFake />
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-2">
                  <span style={{ color: "rgba(232,228,220,0.2)", fontSize: "0.7rem" }}>▶</span>
                  <span className="font-mono-label" style={{ color: "rgba(232,228,220,0.25)", fontSize: "0.55rem" }}>
                    {t("PLAY AMBIENCE", "PLAY AMBIENCE")}
                  </span>
                </div>
                <span className="font-mono-label" style={{ color: "rgba(232,228,220,0.2)", fontSize: "0.55rem" }}>
                  02:47
                </span>
              </div>
            </div>

            <div style={{ borderTop: "0.5px solid rgba(255,255,255,0.06)", paddingTop: "1.5rem", marginTop: "1.5rem" }}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono-label" style={{ color: "rgba(232,228,220,0.2)", fontSize: "0.55rem" }}>
                  {t("КОНЦЕНТРАЦИЯ", "CONCENTRATION")}
                </span>
                <span className="font-mono-label" style={{ color: "rgba(232,228,220,0.5)", fontSize: "0.55rem" }}>
                  EXTRAIT DE PARFUM
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-mono-label" style={{ color: "rgba(232,228,220,0.2)", fontSize: "0.55rem" }}>
                  {t("СТАТУС", "STATUS")}
                </span>
                <span className="font-mono-label" style={{ color: "#c9a96e", fontSize: "0.55rem" }}>
                  {t("ДОСТУПЕН", "AVAILABLE")}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Request Form Modal */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(8,8,8,0.92)", backdropFilter: "blur(8px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowForm(false); }}
        >
          <div style={{
            border: "0.5px solid rgba(201,169,110,0.3)",
            background: "#0d0d0d",
            padding: "2.5rem",
            width: "100%",
            maxWidth: "440px",
          }}>
            {formSent ? (
              <div className="text-center py-8">
                <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#c9a96e", margin: "0 auto 1rem", boxShadow: "0 0 20px rgba(201,169,110,0.6)" }} />
                <p className="font-mono-label" style={{ color: "#c9a96e", fontSize: "0.6rem", letterSpacing: "0.2em" }}>
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
                    <p className="font-mono-label" style={{ color: "rgba(232,228,220,0.3)", fontSize: "0.55rem" }}>
                      {t("ЗАПРОС АРОМАТА", "FRAGRANCE REQUEST")}
                    </p>
                    <p className="font-display mt-1" style={{ color: "#e8e4dc", fontStyle: "italic", fontSize: "1.2rem" }}>
                      {perfume.name}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowForm(false)}
                    style={{ color: "rgba(232,228,220,0.3)", fontSize: "1.2rem", lineHeight: 1 }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#e8e4dc"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(232,228,220,0.3)"; }}
                  >
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
                      <label className="font-mono-label block mb-1.5" style={{ color: "rgba(232,228,220,0.3)", fontSize: "0.5rem" }}>
                        {label}
                        {required && <span style={{ color: "#c9a96e", marginLeft: "4px" }}>*</span>}
                      </label>
                      <input
                        type="text"
                        placeholder={placeholder}
                        value={formData[key as keyof typeof formData]}
                        onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                        required={required}
                        style={{
                          width: "100%",
                          background: "rgba(255,255,255,0.03)",
                          border: "0.5px solid rgba(255,255,255,0.1)",
                          padding: "0.75rem 1rem",
                          color: "#e8e4dc",
                          fontFamily: "'DM Mono', monospace",
                          fontSize: "0.75rem",
                          outline: "none",
                          transition: "border-color 0.2s ease",
                        }}
                        onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = "rgba(201,169,110,0.5)"; }}
                        onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = "rgba(255,255,255,0.1)"; }}
                      />
                    </div>
                  ))}

                  <button
                    type="submit"
                    style={{
                      marginTop: "0.5rem",
                      border: "0.5px solid rgba(201,169,110,0.5)",
                      background: "transparent",
                      padding: "1rem",
                      color: "#e8e4dc",
                      fontFamily: "'DM Mono', monospace",
                      fontSize: "0.65rem",
                      letterSpacing: "0.2em",
                      textTransform: "uppercase",
                      transition: "all 0.3s ease",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.75rem",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.background = "rgba(201,169,110,0.08)";
                      (e.currentTarget as HTMLElement).style.borderColor = "rgba(201,169,110,0.9)";
                      (e.currentTarget as HTMLElement).style.color = "#c9a96e";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background = "transparent";
                      (e.currentTarget as HTMLElement).style.borderColor = "rgba(201,169,110,0.5)";
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
