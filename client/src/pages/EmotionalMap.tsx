// Silentium — Emotional Map Page
// Design: Void Romanticism — dark star-chart, gold particle network, 3-step emotion navigation
// Three.js particle system + SVG neural network overlay

import { useEffect, useRef, useState, useCallback } from "react";
import { useLocation } from "wouter";
import { useLang } from "@/contexts/LangContext";
import {
  step1Emotions,
  getStep2Emotions,
  getStep3Emotions,
  getResultPerfumes,
  getPerfumeById,
} from "@/lib/perfumes";

type Step = 0 | 1 | 2 | 3 | 4; // 0=intro, 1=step1, 2=step2, 3=step3, 4=result

interface Node {
  id: string;
  x: number;
  y: number;
  active: boolean;
  selected: boolean;
  dimmed: boolean;
}

const EMOTION_TRANSLATIONS: Record<string, { ru: string; en: string }> = {
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
  Passion: { ru: "Страсть", en: "Passion" },
  Melancholy: { ru: "Меланхолия", en: "Melancholy" },
  Devotion: { ru: "Преданность", en: "Devotion" },
  Darkness: { ru: "Тьма", en: "Darkness" },
  Void: { ru: "Пустота", en: "Void" },
  Tears: { ru: "Слёзы", en: "Tears" },
  Power: { ru: "Власть", en: "Power" },
};

function translateEmotion(e: string, lang: "ru" | "en") {
  return EMOTION_TRANSLATIONS[e]?.[lang] ?? e;
}

function buildNodes(emotions: string[], cx: number, cy: number, radius: number): Node[] {
  return emotions.map((e, i) => {
    const angle = (i / emotions.length) * Math.PI * 2 - Math.PI / 2;
    return {
      id: e,
      x: cx + Math.cos(angle) * radius,
      y: cy + Math.sin(angle) * radius,
      active: true,
      selected: false,
      dimmed: false,
    };
  });
}

export default function EmotionalMap() {
  const [, navigate] = useLocation();
  const { lang, setLang, t } = useLang();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const neuralCanvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  const [step, setStep] = useState<Step>(0);
  const [sel1, setSel1] = useState<string | null>(null);
  const [sel2, setSel2] = useState<string | null>(null);
  const [sel3, setSel3] = useState<string | null>(null);
  const [resultIds, setResultIds] = useState<string[]>([]);
  const [introVisible, setIntroVisible] = useState(false);
  const [nodesVisible, setNodesVisible] = useState(false);
  const [transitioning, setTransitioning] = useState(false);

  const [centerX, setCenterX] = useState(() => typeof window !== 'undefined' ? window.innerWidth / 2 : 640);
  const [centerY, setCenterY] = useState(() => typeof window !== 'undefined' ? window.innerHeight / 2 : 400);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  // Particle system
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const particles: {
      x: number; y: number; vx: number; vy: number;
      size: number; opacity: number; life: number; maxLife: number;
    }[] = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      setCenterX(window.innerWidth / 2);
      setCenterY(window.innerHeight / 2);
    };
    resize();
    window.addEventListener("resize", resize);

    // Star dust background — dense golden micro-particles
    for (let i = 0; i < 400; i++) {
      particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 0.06,
        vy: (Math.random() - 0.5) * 0.06,
        size: Math.random() < 0.65 ? Math.random() * 0.7 + 0.15 : Math.random() * 1.8 + 0.7,
        opacity: Math.random() * 0.7 + 0.15,
        life: Math.random() * 500,
        maxLife: 400 + Math.random() * 600,
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Radial golden nebula glow at center
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.min(canvas.width, canvas.height) * 0.65);
      grad.addColorStop(0, 'rgba(201,169,110,0.12)');
      grad.addColorStop(0.3, 'rgba(180,130,80,0.07)');
      grad.addColorStop(0.6, 'rgba(150,100,60,0.03)');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        p.life++;
        if (p.life > p.maxLife) {
          p.x = Math.random() * canvas.width;
          p.y = Math.random() * canvas.height;
          p.life = 0;
          p.maxLife = 400 + Math.random() * 600;
        }
        const progress = p.life / p.maxLife;
        // Twinkle: sine wave opacity modulation
        const twinkle = 0.6 + 0.4 * Math.sin(progress * Math.PI * 4 + p.x);
        const fade = progress < 0.08 ? progress / 0.08 : progress > 0.92 ? (1 - progress) / 0.08 : 1;
        const finalOpacity = p.opacity * fade * twinkle;

        // Larger stars get a soft glow halo
        if (p.size > 1.0) {
          const halo = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3);
          halo.addColorStop(0, `rgba(201,169,110,${finalOpacity * 0.5})`);
          halo.addColorStop(1, 'rgba(201,169,110,0)');
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
          ctx.fillStyle = halo;
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(220, 190, 130, ${finalOpacity})`;
        ctx.fill();

        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
      });
      animRef.current = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  // Neural network Canvas renderer — axon-like paths with dashes, branches, dendrites
  useEffect(() => {
    const canvas = neuralCanvasRef.current;
    if (!canvas || nodes.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Seeded pseudo-random per node index for stable variation
    const rng = (seed: number) => {
      const x = Math.sin(seed * 9301 + 49297) * 233280;
      return x - Math.floor(x);
    };

    nodes.forEach((node, i) => {
      const isHovered = hoveredNode === node.id;
      const dx = node.x - centerX;
      const dy = node.y - centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const nx = dx / dist; // unit vector
      const ny = dy / dist;
      const perpX = -ny;
      const perpY = nx;

      // Each neuron gets a unique personality
      const style = Math.floor(rng(i * 3) * 4); // 0=smooth, 1=dashed, 2=branching, 3=wandering
      const curveSide = rng(i * 7) > 0.5 ? 1 : -1;
      const curveMag = dist * (0.18 + rng(i * 11) * 0.28);

      // Base color
      const alpha = isHovered ? 0.75 : 0.28 + rng(i * 5) * 0.12;
      const glowAlpha = isHovered ? 0.4 : 0.1;
      const lineWidth = isHovered ? 1.0 : 0.55 + rng(i * 13) * 0.25;

      // Control points for main curve
      const cp1x = centerX + dx * 0.28 + perpX * curveMag * curveSide;
      const cp1y = centerY + dy * 0.28 + perpY * curveMag * curveSide;
      const cp2x = centerX + dx * 0.72 - perpX * curveMag * curveSide * 0.5;
      const cp2y = centerY + dy * 0.72 - perpY * curveMag * curveSide * 0.5;

      // Helper: point on cubic bezier at t
      const bezier = (t: number) => ({
        x: Math.pow(1-t,3)*centerX + 3*Math.pow(1-t,2)*t*cp1x + 3*(1-t)*t*t*cp2x + t*t*t*node.x,
        y: Math.pow(1-t,3)*centerY + 3*Math.pow(1-t,2)*t*cp1y + 3*(1-t)*t*t*cp2y + t*t*t*node.y,
      });

      // --- GLOW layer ---
      ctx.save();
      ctx.shadowColor = isHovered ? 'rgba(201,169,110,0.9)' : 'rgba(201,169,110,0.5)';
      ctx.shadowBlur = isHovered ? 12 : 6;
      ctx.strokeStyle = `rgba(201,169,110,${glowAlpha})`;
      ctx.lineWidth = isHovered ? 5 : 3;
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, node.x, node.y);
      ctx.stroke();
      ctx.restore();

      // --- CORE line ---
      ctx.save();
      ctx.shadowColor = 'rgba(201,169,110,0.3)';
      ctx.shadowBlur = 3;
      ctx.strokeStyle = `rgba(${isHovered ? '230,200,150' : '201,169,110'},${alpha})`;
      ctx.lineWidth = lineWidth;

      if (style === 1) {
        // Dashed axon
        const dashLen = 4 + rng(i * 17) * 6;
        const gapLen = 3 + rng(i * 19) * 8;
        ctx.setLineDash([dashLen, gapLen]);
      } else if (style === 3) {
        // Dotted
        ctx.setLineDash([1.5, 5 + rng(i * 23) * 4]);
      } else {
        ctx.setLineDash([]);
      }

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, node.x, node.y);
      ctx.stroke();
      ctx.restore();

      // --- BRANCHES / DENDRITES (style 2 = branching, but add small ones to all) ---
      const branchCount = style === 2 ? 2 + Math.floor(rng(i * 29) * 2) : 1;
      for (let b = 0; b < branchCount; b++) {
        const t = 0.3 + rng(i * 31 + b * 7) * 0.45; // branch origin along main curve
        const origin = bezier(t);
        const branchSide = rng(i * 37 + b) > 0.5 ? 1 : -1;
        const branchLen = dist * (0.06 + rng(i * 41 + b * 3) * 0.12);
        // Branch direction: mix of perpendicular and forward
        const fwd = bezier(Math.min(t + 0.05, 1));
        const fwdX = fwd.x - origin.x;
        const fwdY = fwd.y - origin.y;
        const fwdLen = Math.sqrt(fwdX*fwdX + fwdY*fwdY) || 1;
        const bperpX = -fwdY / fwdLen;
        const bperpY = fwdX / fwdLen;
        const endX = origin.x + bperpX * branchLen * branchSide + fwdX / fwdLen * branchLen * 0.4;
        const endY = origin.y + bperpY * branchLen * branchSide + fwdY / fwdLen * branchLen * 0.4;
        // Branch control point
        const bcpX = origin.x + bperpX * branchLen * branchSide * 0.5;
        const bcpY = origin.y + bperpY * branchLen * branchSide * 0.5;

        ctx.save();
        ctx.strokeStyle = `rgba(201,169,110,${alpha * 0.45})`;
        ctx.lineWidth = lineWidth * 0.45;
        ctx.setLineDash(rng(i * 43 + b) > 0.5 ? [2, 4] : []);
        ctx.shadowColor = 'rgba(201,169,110,0.2)';
        ctx.shadowBlur = 3;
        ctx.beginPath();
        ctx.moveTo(origin.x, origin.y);
        ctx.quadraticCurveTo(bcpX, bcpY, endX, endY);
        ctx.stroke();
        ctx.restore();

        // Tiny terminal dot at branch end
        ctx.save();
        ctx.fillStyle = `rgba(201,169,110,${alpha * 0.5})`;
        ctx.shadowColor = 'rgba(201,169,110,0.4)';
        ctx.shadowBlur = 4;
        ctx.beginPath();
        ctx.arc(endX, endY, 1.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // --- GLOWING DOTS along path ---
      const dotCount = 2 + Math.floor(rng(i * 53) * 3);
      for (let d = 0; d < dotCount; d++) {
        const t = 0.15 + (d / (dotCount + 1)) * 0.7;
        const pt = bezier(t);
        const dotR = 0.8 + rng(i * 59 + d) * 1.2;
        ctx.save();
        ctx.fillStyle = `rgba(201,169,110,${alpha * (0.4 + rng(i * 61 + d) * 0.4)})`;
        ctx.shadowColor = 'rgba(201,169,110,0.6)';
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, dotR, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    });
  }, [nodes, hoveredNode, centerX, centerY]);

  // Intro animation
  useEffect(() => {
    const t1 = setTimeout(() => setIntroVisible(true), 200);
    const t2 = setTimeout(() => {
      setStep(1);
      setTimeout(() => setNodesVisible(true), 100);
    }, 1800);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  // Build nodes when step/selections change
  useEffect(() => {
    if (!centerX || !centerY) return;
    const radius = Math.min(centerX, centerY) * 0.52;

    let emotions: string[] = [];
    if (step === 1) emotions = step1Emotions;
    else if (step === 2 && sel1) emotions = getStep2Emotions(sel1);
    else if (step === 3 && sel1 && sel2) emotions = getStep3Emotions(sel1, sel2);

    const newNodes = buildNodes(emotions, centerX, centerY, radius);
    setNodes(newNodes);
  }, [step, sel1, sel2, centerX, centerY]);

  const handleNodeClick = useCallback((nodeId: string) => {
    if (transitioning) return;
    setTransitioning(true);

    if (step === 1) {
      setSel1(nodeId);
      setNodesVisible(false);
      setTimeout(() => {
        setStep(2);
        setNodesVisible(true);
        setTransitioning(false);
      }, 600);
    } else if (step === 2) {
      setSel2(nodeId);
      setNodesVisible(false);
      setTimeout(() => {
        setStep(3);
        setNodesVisible(true);
        setTransitioning(false);
      }, 600);
    } else if (step === 3 && sel1 && sel2) {
      setSel3(nodeId);
      const ids = getResultPerfumes(sel1, sel2, nodeId);
      setResultIds(ids);
      setNodesVisible(false);
      setTimeout(() => {
        setStep(4);
        setTransitioning(false);
      }, 600);
    }
  }, [step, sel1, sel2, transitioning]);

  const handleReset = () => {
    setNodesVisible(false);
    setTimeout(() => {
      setStep(1);
      setSel1(null);
      setSel2(null);
      setSel3(null);
      setResultIds([]);
      setNodesVisible(true);
    }, 400);
  };

  const stepLabel = (s: Step) => {
    if (s === 1) return t("Выберите эмоцию", "Choose an emotion");
    if (s === 2) return t("Углубитесь в чувство", "Go deeper");
    if (s === 3) return t("Последний слой", "Final layer");
    return "";
  };

  const pathEmotions = [sel1, sel2, sel3].filter(Boolean) as string[];

  return (
    <div className="relative w-full h-screen overflow-hidden" style={{ background: "#080808" }}>
      {/* Background */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url(https://d2xsxph8kpxj0f.cloudfront.net/120386225/Z5Dj7KAQS93qgLNa7h9H2n/emotional-map-bg-kdhNX3SdqjPa42Ap8qkYbd.webp)`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          opacity: 0.3,
        }}
      />
      <div className="absolute inset-0 z-0" style={{ background: "radial-gradient(ellipse at center, rgba(8,8,8,0) 0%, rgba(8,8,8,0.85) 80%)" }} />

      {/* Particle canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 z-10 pointer-events-none" />

      {/* Neural network Canvas — axon paths with dashes, branches, dendrites */}
      <canvas ref={neuralCanvasRef} className="absolute inset-0 z-20 pointer-events-none" />

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-40 flex items-center justify-between px-8 py-6" style={{ borderBottom: "0.5px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-6">
          <button
            onClick={() => navigate("/")}
            className="font-mono-label transition-colors duration-200"
            style={{ color: "rgba(232,228,220,0.3)", fontSize: "0.6rem" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#c9a96e"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(232,228,220,0.3)"; }}
          >
            ← SILENTIUM
          </button>
          <span className="font-mono-label" style={{ color: "rgba(232,228,220,0.15)", fontSize: "0.6rem" }}>
            {t("ЭМОЦИОНАЛЬНАЯ КАРТА", "EMOTIONAL MAP")}
          </span>
        </div>

        <div className="flex items-center gap-6">
          {/* Step indicator */}
          {step >= 1 && step <= 3 && (
            <div className="flex items-center gap-2">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  style={{
                    width: s <= step ? "20px" : "8px",
                    height: "1px",
                    background: s < step ? "#c9a96e" : s === step ? "rgba(201,169,110,0.8)" : "rgba(255,255,255,0.15)",
                    transition: "all 0.5s ease",
                  }}
                />
              ))}
            </div>
          )}

          {/* Lang switcher */}
          <div className="flex items-center gap-3">
            <button onClick={() => setLang("ru")} className="font-mono-label text-xs transition-colors duration-200"
              style={{ color: lang === "ru" ? "#c9a96e" : "rgba(232,228,220,0.3)" }}>RU</button>
            <span style={{ color: "rgba(232,228,220,0.15)", fontSize: "0.6rem" }}>|</span>
            <button onClick={() => setLang("en")} className="font-mono-label text-xs transition-colors duration-200"
              style={{ color: lang === "en" ? "#c9a96e" : "rgba(232,228,220,0.3)" }}>EN</button>
          </div>
        </div>
      </div>

      {/* Left sidebar — path */}
      <div className="absolute left-8 top-1/2 z-40 -translate-y-1/2 flex flex-col gap-6" style={{ width: "160px" }}>
        {step >= 1 && (
          <div>
            <p className="font-mono-label mb-3" style={{ color: "rgba(232,228,220,0.25)", fontSize: "0.55rem" }}>
              {t("ПУТЬ", "PATH")}
            </p>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="font-mono-label" style={{ color: "rgba(232,228,220,0.25)", fontSize: "0.55rem" }}>ORIGIN</span>
              </div>
              {pathEmotions.map((e, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span style={{ color: "rgba(232,228,220,0.2)", fontSize: "0.6rem" }}>↓</span>
                  <span
                    className="font-mono-label"
                    style={{
                      color: i === pathEmotions.length - 1 ? "#c9a96e" : "rgba(232,228,220,0.5)",
                      fontSize: "0.6rem",
                    }}
                  >
                    {translateEmotion(e, lang).toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {step >= 1 && step <= 3 && (
          <button
            onClick={handleReset}
            className="font-mono-label transition-colors duration-200 text-left"
            style={{ color: "rgba(232,228,220,0.2)", fontSize: "0.55rem" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(232,228,220,0.5)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(232,228,220,0.2)"; }}
          >
            ⊙ {t("СБРОС", "RESET")}
          </button>
        )}
      </div>

      {/* Right sidebar — signal */}
      <div className="absolute right-8 top-1/2 z-40 -translate-y-1/2 flex flex-col gap-4" style={{ width: "160px" }}>
        <div>
          <p className="font-mono-label mb-2" style={{ color: "rgba(232,228,220,0.25)", fontSize: "0.55rem" }}>
            SIGNAL CLARITY
          </p>
          <div className="flex items-end gap-0.5">
            {[3, 5, 7, 9, 11, 9, 7, 5].map((h, i) => (
              <div key={i} style={{
                width: "2px",
                height: `${h}px`,
                background: i < (step + 2) * 2 ? "rgba(201,169,110,0.6)" : "rgba(232,228,220,0.1)",
                borderRadius: "1px",
                transition: "background 0.5s ease",
              }} />
            ))}
          </div>
        </div>

        {hoveredNode && (
          <div style={{ borderTop: "0.5px solid rgba(255,255,255,0.07)", paddingTop: "1rem" }}>
            <p className="font-mono-label mb-1" style={{ color: "#c9a96e", fontSize: "0.6rem" }}>
              {translateEmotion(hoveredNode, lang).toUpperCase()}
            </p>
            <p style={{ color: "rgba(232,228,220,0.3)", fontSize: "0.65rem", fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic" }}>
              {t("Нажмите для выбора", "Click to select")}
            </p>
          </div>
        )}
      </div>

      {/* Intro overlay */}
      {step === 0 && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center">
          <div style={{
            opacity: introVisible ? 1 : 0,
            transform: introVisible ? "scale(1)" : "scale(0.95)",
            transition: "all 1.5s cubic-bezier(0.16, 1, 0.3, 1)",
          }}>
            {/* Origin point */}
            <div className="flex flex-col items-center gap-6">
              <div style={{
                width: "8px", height: "8px", borderRadius: "50%",
                background: "#c9a96e",
                boxShadow: "0 0 20px rgba(201,169,110,0.6), 0 0 60px rgba(201,169,110,0.2)",
                animation: "pulse 2s ease-in-out infinite",
              }} />
              <p className="font-mono-label" style={{ color: "rgba(232,228,220,0.3)", fontSize: "0.6rem", letterSpacing: "0.3em" }}>
                ORIGIN POINT
              </p>
              <h2 className="font-display" style={{
                fontSize: "clamp(1.5rem, 4vw, 2.5rem)",
                fontWeight: 300,
                fontStyle: "italic",
                color: "#e8e4dc",
                letterSpacing: "0.05em",
              }}>
                {t("Выберите эмоцию", "Choose an emotion")}
              </h2>
            </div>
          </div>
        </div>
      )}

      {/* Neural network nodes — lines drawn on canvas above */}
      {step >= 1 && step <= 3 && nodes.length > 0 && (
        <div className="absolute inset-0 z-30">

          {/* Center origin point */}
          <div
            className="absolute z-10"
            style={{
              left: centerX - 5,
              top: centerY - 5,
              width: "10px",
              height: "10px",
              borderRadius: "50%",
              background: "#c9a96e",
              boxShadow: "0 0 20px rgba(201,169,110,0.7), 0 0 50px rgba(201,169,110,0.3)",
            }}
          />

          {/* Step label */}
          <div
            className="absolute z-10 text-center"
            style={{
              left: "50%",
              top: centerY + 30,
              transform: "translateX(-50%)",
            }}
          >
            <p className="font-mono-label" style={{ color: "rgba(232,228,220,0.3)", fontSize: "0.55rem", letterSpacing: "0.25em" }}>
              {stepLabel(step)}
            </p>
          </div>

          {/* Emotion nodes */}
          {nodes.map((node) => (
            <button
              key={node.id}
              className="absolute z-20 flex flex-col items-center gap-1 group"
              style={{
                left: node.x,
                top: node.y,
                transform: "translate(-50%, -50%)",
                opacity: nodesVisible ? 1 : 0,
                transition: "opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "16px",
              }}
              onClick={() => handleNodeClick(node.id)}
              onMouseEnter={() => setHoveredNode(node.id)}
              onMouseLeave={() => setHoveredNode(null)}
            >
              {/* Node dot with ring */}
              <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {hoveredNode === node.id && (
                  <div style={{
                    position: "absolute",
                    width: "24px", height: "24px",
                    borderRadius: "50%",
                    border: "0.5px solid rgba(201,169,110,0.3)",
                    animation: "ringPulse 1.5s ease-in-out infinite",
                  }} />
                )}
                <div
                  style={{
                    width: hoveredNode === node.id ? "10px" : "5px",
                    height: hoveredNode === node.id ? "10px" : "5px",
                    borderRadius: "50%",
                    background: hoveredNode === node.id ? "#c9a96e" : "rgba(201,169,110,0.6)",
                    boxShadow: hoveredNode === node.id
                      ? "0 0 20px rgba(201,169,110,1), 0 0 50px rgba(201,169,110,0.4)"
                      : "0 0 6px rgba(201,169,110,0.4)",
                    transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                  }}
                />
              </div>
              {/* Cross marker */}
              <span style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, calc(-50% - 10px))",
                color: "rgba(201,169,110,0.4)",
                fontSize: "0.55rem",
                fontFamily: "monospace",
                pointerEvents: "none",
              }}>+</span>
              {/* Label */}
              <span
                className="font-mono-label"
                style={{
                  color: hoveredNode === node.id ? "#c9a96e" : "rgba(232,228,220,0.65)",
                  fontSize: "0.6rem",
                  letterSpacing: "0.2em",
                  transition: "color 0.25s ease",
                  whiteSpace: "nowrap",
                  marginTop: "6px",
                }}
              >
                {translateEmotion(node.id, lang).toUpperCase()}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Result screen */}
      {step === 4 && (
        <div
          className="absolute inset-0 z-30 flex flex-col items-center justify-center px-8"
          style={{
            opacity: 1,
            transition: "opacity 0.8s ease",
          }}
        >
          <div className="flex flex-col items-center gap-8 max-w-2xl w-full">
            {/* Signal found */}
            <div className="flex flex-col items-center gap-3">
              <div style={{
                width: "6px", height: "6px", borderRadius: "50%",
                background: "#c9a96e",
                boxShadow: "0 0 20px rgba(201,169,110,0.8), 0 0 60px rgba(201,169,110,0.3)",
              }} />
              <p className="font-mono-label" style={{ color: "#c9a96e", fontSize: "0.6rem", letterSpacing: "0.3em" }}>
                {t("СИГНАЛ НАЙДЕН", "SIGNAL FOUND")}
              </p>
              <h2 className="font-display text-center" style={{
                fontSize: "clamp(1.2rem, 3vw, 2rem)",
                fontWeight: 300,
                fontStyle: "italic",
                color: "#e8e4dc",
              }}>
                {t("Ваш путь привёл сюда", "Your path led here")}
              </h2>
              {/* Path summary */}
              <div className="flex items-center gap-2 flex-wrap justify-center">
                {pathEmotions.map((e, i) => (
                  <span key={i} className="flex items-center gap-2">
                    <span className="font-mono-label" style={{ color: "rgba(232,228,220,0.4)", fontSize: "0.55rem" }}>
                      {translateEmotion(e, lang).toUpperCase()}
                    </span>
                    {i < pathEmotions.length - 1 && (
                      <span style={{ color: "rgba(201,169,110,0.4)", fontSize: "0.55rem" }}>→</span>
                    )}
                  </span>
                ))}
              </div>
            </div>

            {/* Perfume cards */}
            <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
              {resultIds.map((id) => {
                const p = getPerfumeById(id);
                if (!p) return null;
                return (
                  <button
                    key={id}
                    onClick={() => navigate(`/perfume/${id}`)}
                    className="group flex flex-col gap-3 text-left"
                    style={{
                      border: "0.5px solid rgba(201,169,110,0.2)",
                      background: "rgba(8,8,8,0.8)",
                      padding: "1.5rem",
                      flex: 1,
                      maxWidth: "280px",
                      transition: "all 0.3s ease",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = "rgba(201,169,110,0.6)";
                      (e.currentTarget as HTMLElement).style.background = "rgba(201,169,110,0.04)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = "rgba(201,169,110,0.2)";
                      (e.currentTarget as HTMLElement).style.background = "rgba(8,8,8,0.8)";
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono-label" style={{ color: "rgba(232,228,220,0.25)", fontSize: "0.55rem" }}>
                        SILENTIUM
                      </span>
                      <span style={{ color: "rgba(201,169,110,0.4)", fontSize: "0.7rem" }}>→</span>
                    </div>
                    <h3 className="font-display" style={{
                      fontSize: "1.4rem",
                      fontWeight: 400,
                      fontStyle: "italic",
                      color: "#e8e4dc",
                      lineHeight: 1.2,
                    }}>
                      {p.name}
                    </h3>
                    <p style={{
                      color: "rgba(232,228,220,0.45)",
                      fontSize: "0.75rem",
                      fontFamily: "'Cormorant Garamond', serif",
                      fontStyle: "italic",
                      lineHeight: 1.5,
                    }}>
                      {lang === "ru" ? p.tagline.ru : p.tagline.en}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {p.emotionalPath.map((e) => (
                        <span key={e} className="font-mono-label" style={{
                          color: "rgba(201,169,110,0.5)",
                          fontSize: "0.5rem",
                          border: "0.5px solid rgba(201,169,110,0.2)",
                          padding: "2px 6px",
                        }}>
                          {translateEmotion(e, lang).toUpperCase()}
                        </span>
                      ))}
                    </div>
                    <div style={{
                      marginTop: "0.5rem",
                      paddingTop: "0.75rem",
                      borderTop: "0.5px solid rgba(255,255,255,0.06)",
                    }}>
                      <span className="font-mono-label" style={{ color: "rgba(201,169,110,0.7)", fontSize: "0.6rem" }}>
                        {t("ИССЛЕДОВАТЬ →", "EXPLORE →")}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Reset */}
            <button
              onClick={handleReset}
              className="font-mono-label transition-colors duration-200"
              style={{ color: "rgba(232,228,220,0.25)", fontSize: "0.6rem" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(232,228,220,0.6)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(232,228,220,0.25)"; }}
            >
              ⊙ {t("НАЧАТЬ ЗАНОВО", "START OVER")}
            </button>
          </div>
        </div>
      )}

      {/* Bottom bar */}
      <div className="absolute bottom-0 left-0 right-0 z-40 flex items-center justify-between px-8 py-5" style={{ borderTop: "0.5px solid rgba(255,255,255,0.06)" }}>
        <span className="font-mono-label" style={{ color: "rgba(232,228,220,0.15)", fontSize: "0.55rem" }}>
          {t("СИСТЕМА АКТИВНА", "SYSTEM ACTIVE")}
        </span>
        <div className="flex items-center gap-2">
          <span className="font-mono-label" style={{ color: "rgba(232,228,220,0.15)", fontSize: "0.55rem" }}>
            ORIGIN
          </span>
          <div className="flex items-center gap-1">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} style={{
                width: "20px", height: "1px",
                background: i < step ? "#c9a96e" : "rgba(255,255,255,0.12)",
                transition: "background 0.5s ease",
              }} />
            ))}
            <div style={{ width: "6px", height: "6px", borderRadius: "50%",
              background: step === 4 ? "#c9a96e" : "rgba(255,255,255,0.12)",
              transition: "background 0.5s ease",
            }} />
          </div>
          <span className="font-mono-label" style={{ color: "rgba(232,228,220,0.15)", fontSize: "0.55rem" }}>
            UNKNOWN
          </span>
        </div>
        <span className="font-mono-label" style={{ color: "rgba(232,228,220,0.15)", fontSize: "0.55rem" }}>
          {step === 4 ? t("СИГНАЛ НАЙДЕН", "SIGNAL FOUND") : `${t("ШАГ", "STEP")} ${Math.max(step, 1)}/3`}
        </span>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 20px rgba(201,169,110,0.6), 0 0 60px rgba(201,169,110,0.2); }
          50% { box-shadow: 0 0 30px rgba(201,169,110,0.9), 0 0 80px rgba(201,169,110,0.4); }
        }
        @keyframes ringPulse {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(2.5); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
