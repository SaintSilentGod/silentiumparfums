// Silentium — Home Page
// Design: Void Romanticism — full-bleed dark hero, Cormorant Garamond display, DM Mono labels
// Gold accent #c9a96e, near-black background #080808

import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { useLang } from "@/contexts/LangContext";

export default function Home() {
  const [, navigate] = useLocation();
  const { lang, setLang, t } = useLang();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [titleVisible, setTitleVisible] = useState(false);
  const [subVisible, setSubVisible] = useState(false);
  const [btnVisible, setBtnVisible] = useState(false);

  // Particle animation on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    const particles: { x: number; y: number; vx: number; vy: number; size: number; opacity: number; life: number; maxLife: number }[] = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    for (let i = 0; i < 80; i++) {
      particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 1.5 + 0.3,
        opacity: Math.random() * 0.5 + 0.1,
        life: Math.random() * 200,
        maxLife: 200 + Math.random() * 300,
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.life++;
        if (p.life > p.maxLife) {
          p.x = Math.random() * canvas.width;
          p.y = Math.random() * canvas.height;
          p.life = 0;
          p.maxLife = 200 + Math.random() * 300;
        }
        const progress = p.life / p.maxLife;
        const fade = progress < 0.1 ? progress / 0.1 : progress > 0.9 ? (1 - progress) / 0.1 : 1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(201, 169, 110, ${p.opacity * fade})`;
        ctx.fill();
        p.x += p.vx;
        p.y += p.vy;
      });
      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  // Staggered entrance
  useEffect(() => {
    const t1 = setTimeout(() => setLoaded(true), 100);
    const t2 = setTimeout(() => setTitleVisible(true), 400);
    const t3 = setTimeout(() => setSubVisible(true), 900);
    const t4 = setTimeout(() => setBtnVisible(true), 1400);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, []);

  return (
    <div className="relative w-full h-screen overflow-hidden" style={{ background: "#080808" }}>
      {/* Hero background image */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url(https://d2xsxph8kpxj0f.cloudfront.net/120386225/Z5Dj7KAQS93qgLNa7h9H2n/hero-bg-TB6e9eSjpahissggf7VqRK.webp)`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          opacity: 0.55,
        }}
      />

      {/* Dark gradient overlay */}
      <div
        className="absolute inset-0 z-0"
        style={{
          background: "radial-gradient(ellipse at center, rgba(8,8,8,0.2) 0%, rgba(8,8,8,0.7) 60%, rgba(8,8,8,0.95) 100%)",
        }}
      />

      {/* Particle canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 z-10 pointer-events-none" />

      {/* Language switcher */}
      <div className="absolute top-8 right-8 z-30 flex items-center gap-3">
        <button
          onClick={() => setLang("ru")}
          className="font-mono-label text-xs transition-all duration-300"
          style={{ color: lang === "ru" ? "#c9a96e" : "rgba(232,228,220,0.3)" }}
        >
          RU
        </button>
        <span style={{ color: "rgba(232,228,220,0.15)", fontSize: "0.6rem" }}>|</span>
        <button
          onClick={() => setLang("en")}
          className="font-mono-label text-xs transition-all duration-300"
          style={{ color: lang === "en" ? "#c9a96e" : "rgba(232,228,220,0.3)" }}
        >
          EN
        </button>
      </div>

      {/* Top-left brand mark */}
      <div
        className="absolute top-8 left-8 z-30"
        style={{
          opacity: loaded ? 1 : 0,
          transition: "opacity 1s ease",
        }}
      >
        <span className="font-mono-label" style={{ color: "rgba(232,228,220,0.3)", fontSize: "0.6rem", letterSpacing: "0.3em" }}>
          SILENTIUM
        </span>
      </div>

      {/* Center content */}
      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center px-6 text-center">
        {/* Main title */}
        <div
          style={{
            opacity: titleVisible ? 1 : 0,
            transform: titleVisible ? "translateY(0)" : "translateY(20px)",
            transition: "opacity 1.2s cubic-bezier(0.16, 1, 0.3, 1), transform 1.2s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          <h1
            className="font-display"
            style={{
              fontSize: "clamp(4rem, 12vw, 10rem)",
              fontWeight: 300,
              letterSpacing: "0.15em",
              color: "#e8e4dc",
              lineHeight: 1,
              fontStyle: "italic",
            }}
          >
            Silentium
          </h1>
        </div>

        {/* Hairline divider */}
        <div
          style={{
            width: titleVisible ? "120px" : "0px",
            height: "0.5px",
            background: "rgba(201,169,110,0.4)",
            margin: "2rem auto",
            transition: "width 1.5s cubic-bezier(0.16, 1, 0.3, 1) 0.3s",
          }}
        />

        {/* Subtitle */}
        <div
          style={{
            opacity: subVisible ? 1 : 0,
            transform: subVisible ? "translateY(0)" : "translateY(12px)",
            transition: "opacity 1s cubic-bezier(0.16, 1, 0.3, 1), transform 1s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          <p
            className="font-mono-label"
            style={{
              color: "rgba(232,228,220,0.45)",
              letterSpacing: "0.25em",
              fontSize: "0.65rem",
              marginBottom: "0.5rem",
            }}
          >
            {t("ПАРФЮМЕРИЯ", "PERFUMERY")}
          </p>
          <p
            className="font-display"
            style={{
              color: "rgba(232,228,220,0.55)",
              fontSize: "clamp(0.9rem, 2vw, 1.2rem)",
              fontWeight: 300,
              fontStyle: "italic",
              letterSpacing: "0.05em",
            }}
          >
            {t("Рождённая из тишины", "Born from silence")}
          </p>
        </div>

        {/* CTA Button */}
        <div
          style={{
            opacity: btnVisible ? 1 : 0,
            transform: btnVisible ? "translateY(0)" : "translateY(12px)",
            transition: "opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
            marginTop: "3.5rem",
          }}
        >
          <button
            onClick={() => navigate("/map")}
            className="group relative"
            style={{
              border: "0.5px solid rgba(201,169,110,0.4)",
              background: "transparent",
              padding: "1rem 3rem",
              color: "#e8e4dc",
              fontFamily: "'DM Mono', monospace",
              fontSize: "0.65rem",
              letterSpacing: "0.25em",
              textTransform: "uppercase",
              transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(201,169,110,0.9)";
              (e.currentTarget as HTMLButtonElement).style.color = "#c9a96e";
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(201,169,110,0.05)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(201,169,110,0.4)";
              (e.currentTarget as HTMLButtonElement).style.color = "#e8e4dc";
              (e.currentTarget as HTMLButtonElement).style.background = "transparent";
            }}
          >
            {t("Найти свой аромат", "Find your scent")}
          </button>
        </div>
      </div>

      {/* Bottom coordinates */}
      <div
        className="absolute bottom-8 left-8 z-30"
        style={{
          opacity: btnVisible ? 1 : 0,
          transition: "opacity 1s ease 0.5s",
        }}
      >
        <span className="font-mono-label" style={{ color: "rgba(232,228,220,0.18)", fontSize: "0.55rem" }}>
          {t("ЭМОЦИОНАЛЬНАЯ КАРТА", "EMOTIONAL MAP")} — 10 {t("АРОМАТОВ", "FRAGRANCES")}
        </span>
      </div>

      {/* Bottom right signal */}
      <div
        className="absolute bottom-8 right-8 z-30 flex items-center gap-2"
        style={{
          opacity: btnVisible ? 1 : 0,
          transition: "opacity 1s ease 0.5s",
        }}
      >
        <span className="font-mono-label" style={{ color: "rgba(232,228,220,0.18)", fontSize: "0.55rem" }}>
          SIGNAL CLARITY
        </span>
        <div className="flex items-end gap-0.5">
          {[3, 5, 7, 9, 7, 5, 3, 5].map((h, i) => (
            <div
              key={i}
              style={{
                width: "2px",
                height: `${h}px`,
                background: i < 5 ? "rgba(201,169,110,0.6)" : "rgba(232,228,220,0.15)",
                borderRadius: "1px",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
