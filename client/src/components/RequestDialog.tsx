// Shared request form; every perfume world dresses it in its own skin.

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useLang } from "@/contexts/LangContext";

export interface DialogSkin {
  overlay: string;
  panel: CSSProperties;
  title: CSSProperties;
  label: CSSProperties;
  input: CSSProperties;
  button: CSSProperties;
  accent: string;
  heading: { ru: string; en: string };
  submit: { ru: string; en: string };
  sent: { ru: string; en: string };
}

export default function RequestDialog({
  open, onClose, perfumeName, skin,
}: { open: boolean; onClose: () => void; perfumeName: string; skin: DialogSkin }) {
  const { t, lang } = useLang();
  const [data, setData] = useState({ name: "", telegram: "", phone: "", email: "" });
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trap, setTrap] = useState("");
  const openedAt = useRef(0);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  // Depends on `open` only: worlds pass a fresh onClose on every render (King re-renders every 0.9 s),
  // which used to reset openedAt so every real request looked "too fast" and was dropped as spam.
  useEffect(() => {
    if (!open) return;
    openedAt.current = Date.now();
    setError(null);
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onCloseRef.current(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);
  if (!open) return null;

  const ERRORS: Record<string, [string, string]> = {
    contact_required: ["Оставьте хотя бы один контакт: Telegram, телефон или email.", "Leave at least one contact: Telegram, phone or email."],
    email_invalid: ["Проверьте email — кажется, в нём опечатка.", "Check the email — it looks mistyped."],
    name_required: ["Как к вам обращаться?", "What should we call you?"],
  };
  const fallback: [string, string] = ["Не получилось отправить. Попробуйте ещё раз чуть позже.", "Couldn't send it. Please try again in a moment."];

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sending) return;
    if (!data.telegram.trim() && !data.phone.trim() && !data.email.trim()) { setError(t(...ERRORS.contact_required)); return; }
    setSending(true);
    setError(null);
    try {
      const r = await fetch("/api/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, perfume: perfumeName, lang, page: window.location.pathname, website: trap, elapsedMs: Date.now() - openedAt.current }),
      });
      const body = await r.json().catch(() => ({}));
      if (!r.ok || !body.ok) { setError(t(...(ERRORS[body.error as string] ?? fallback))); return; }
      setSent(true);
      setData({ name: "", telegram: "", phone: "", email: "" });
      setTimeout(() => { onClose(); setSent(false); }, 2800);
    } catch {
      setError(t(...fallback));
    } finally {
      setSending(false);
    }
  };

  const fields = [
    { key: "name", label: t("Имя", "Name"), placeholder: t("Ваше имя", "Your name"), required: true },
    { key: "telegram", label: "Telegram", placeholder: "@username", required: false },
    { key: "phone", label: t("Телефон", "Phone"), placeholder: "+7 (___) ___-__-__", required: false },
    { key: "email", label: "Email", placeholder: "email@example.com", required: false },
  ] as const;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={perfumeName}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, background: skin.overlay }}
    >
      <div style={{ width: "100%", maxWidth: 420, position: "relative", ...skin.panel }}>
        <button onClick={onClose} aria-label={t("Закрыть", "Close")}
          style={{ position: "absolute", top: 10, right: 14, fontSize: 22, lineHeight: 1, opacity: 0.6, color: "inherit" }}>×</button>
        {sent ? (
          <p style={{ ...skin.title, textAlign: "center", padding: "2rem 0" }}>{lang === "ru" ? skin.sent.ru : skin.sent.en}</p>
        ) : (
          <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <p style={skin.label}>{lang === "ru" ? skin.heading.ru : skin.heading.en}</p>
              <p style={skin.title}>{perfumeName}</p>
            </div>
            {fields.map((f) => (
              <label key={f.key} style={{ display: "block" }}>
                <span style={skin.label}>{f.label}{f.required && <span style={{ color: skin.accent }}> *</span>}</span>
                <input
                  value={data[f.key]}
                  required={f.required}
                  placeholder={f.placeholder}
                  onChange={(e) => { setData({ ...data, [f.key]: e.target.value }); setError(null); }}
                  type={f.key === "email" ? "email" : f.key === "phone" ? "tel" : "text"}
                  autoComplete={f.key === "name" ? "name" : f.key === "email" ? "email" : f.key === "phone" ? "tel" : "off"}
                  style={{ display: "block", width: "100%", marginTop: 6, outline: "none", ...skin.input }}
                />
              </label>
            ))}
            {/* honeypot: hidden from people, irresistible to bots */}
            <input value={trap} onChange={(e) => setTrap(e.target.value)} name="hp_x7" tabIndex={-1} autoComplete="off" aria-hidden="true"
              style={{ position: "absolute", left: -10000, width: 1, height: 1, opacity: 0 }} />
            <p style={{ ...skin.label, textTransform: "none", letterSpacing: 0, opacity: 0.75 }}>{t("Telegram, телефон или email — хотя бы что-то одно.", "Telegram, phone or email — at least one.")}</p>
            {error && <p role="alert" style={{ ...skin.label, textTransform: "none", letterSpacing: 0, color: skin.accent, opacity: 1 }}>{error}</p>}
            <button type="submit" disabled={sending} style={{ marginTop: 6, ...skin.button, opacity: sending ? 0.6 : 1, cursor: sending ? "wait" : "pointer" }}>
              {sending ? t("Отправляем…", "Sending…") : lang === "ru" ? skin.submit.ru : skin.submit.en}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
