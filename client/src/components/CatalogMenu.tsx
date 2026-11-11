// Catalog menu: three lines that open a list of every perfume. Used on the home page and the map only.
import { useEffect, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { useLocation } from "wouter";
import { perfumes } from "@/lib/perfumes";
import { useLang } from "@/contexts/LangContext";

const INK = "#e8e4dc";
const GOLD = "#c9a96e";

export default function CatalogMenu({ style }: { style?: CSSProperties }) {
  const [open, setOpen] = useState(false);
  const [, navigate] = useLocation();
  const { t } = useLang();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [open]);

  const line = (i: number): CSSProperties => ({
    position: "absolute", left: 0, width: 26, height: 1.5, background: INK, borderRadius: 1,
    top: open ? 9 : 2 + i * 7,
    opacity: open && i === 1 ? 0 : 1,
    transform: open ? `rotate(${i === 0 ? 45 : i === 2 ? -45 : 0}deg)` : "none",
    transition: "transform .35s cubic-bezier(.16,1,.3,1), top .35s cubic-bezier(.16,1,.3,1), opacity .2s",
  });

  return (
    <>
      <style>{`
        .cm-item { color: rgba(232,228,220,.62); transition: color .2s, transform .3s cubic-bezier(.16,1,.3,1); }
        .cm-item:hover, .cm-item:focus-visible { color: ${GOLD}; transform: translateX(6px); outline: none; }
      `}</style>

      {createPortal(<>
      <div
        onClick={() => setOpen(false)}
        aria-hidden
        style={{ position: "fixed", inset: 0, zIndex: 58, background: "rgba(3,2,6,.55)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)", opacity: open ? 1 : 0, pointerEvents: open ? "auto" : "none", transition: "opacity .4s ease" }}
      />
      <nav
        aria-label={t("Каталог ароматов", "Fragrance catalog")}
        aria-hidden={!open}
        style={{ position: "fixed", top: 0, bottom: 0, left: 0, zIndex: 59, width: "min(420px, 100vw)", overflowY: "auto", padding: "84px 34px 32px", background: "linear-gradient(180deg, #0b0910, #050408)", borderRight: "0.5px solid rgba(201,169,110,.25)", transform: open ? "none" : "translateX(-102%)", transition: "transform .5s cubic-bezier(.16,1,.3,1)", visibility: open ? "visible" : "hidden" }}
      >
        <p className="font-mono-label" style={{ color: "rgba(232,228,220,.35)", fontSize: "0.6rem", letterSpacing: "0.3em", marginBottom: 22 }}>
          {t("АРОМАТЫ", "FRAGRANCES")}
        </p>
        <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {perfumes.map((p, i) => (
            <li key={p.id} style={{ opacity: open ? 1 : 0, transform: open ? "none" : "translateX(-14px)", transition: `opacity .4s ease ${open ? 120 + i * 35 : 0}ms, transform .5s cubic-bezier(.16,1,.3,1) ${open ? 120 + i * 35 : 0}ms` }}>
              <button
                className="cm-item font-display"
                tabIndex={open ? 0 : -1}
                onClick={() => { setOpen(false); navigate(`/perfume/${p.id}`); }}
                style={{ display: "block", width: "100%", textAlign: "left", padding: "6px 0", fontSize: "clamp(1.3rem, 4.4vw, 1.6rem)", fontStyle: "italic", fontWeight: 300, letterSpacing: "0.02em", background: "transparent", cursor: "pointer" }}
              >
                {p.name}
              </button>
            </li>
          ))}
        </ul>
      </nav>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? t("Закрыть каталог", "Close catalog") : t("Каталог ароматов", "Fragrance catalog")}
        aria-expanded={open}
        style={{ position: "fixed", top: 26, left: 26, zIndex: 60, width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", cursor: "pointer", ...style }}
      >
        <span style={{ position: "relative", width: 26, height: 20, display: "block" }}>
          {[0, 1, 2].map((i) => <span key={i} style={line(i)} />)}
        </span>
      </button>
      </>, document.body)}
    </>
  );
}
