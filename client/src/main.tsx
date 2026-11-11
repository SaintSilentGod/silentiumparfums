import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// After a deploy, an open tab may try to lazy-load a chunk that no longer exists; reload once to pick up the new build.
window.addEventListener("vite:preloadError", (e) => {
  try {
    if (sessionStorage.getItem("chunk-heal")) return;
    sessionStorage.setItem("chunk-heal", "1");
    e.preventDefault();
    location.reload();
  } catch {}
});
window.addEventListener("load", () => setTimeout(() => { try { sessionStorage.removeItem("chunk-heal"); } catch {} }, 10000));

createRoot(document.getElementById("root")!).render(<App />);
