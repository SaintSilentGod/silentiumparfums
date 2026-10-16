import { lazy, type ComponentType } from "react";
import type { WorldProps } from "./shared";

// Every fragrance has its own page; ids not listed here fall back to the shared template.
// Each world (and three.js with it) loads only when its page is opened.
export const worlds: Record<string, ComponentType<WorldProps>> = {
  seance: lazy(() => import("./SeanceWorld")),
  "summer-of-2009": lazy(() => import("./SummerWorld")),
  "laundry-routine": lazy(() => import("./LaundryWorld")),
  "sunlit-memories": lazy(() => import("./SunlitWorld")),
  "russian-banya": lazy(() => import("./BanyaWorld")),
  "synthetic-ecstasy": lazy(() => import("./SyntheticWorld")),
  "highest-in-the-room": lazy(() => import("./HighestWorld")),
  "silent-fog": lazy(() => import("./FogWorld")),
  "narcisstic-king": lazy(() => import("./KingWorld")),
  "self-addicted": lazy(() => import("./SelfWorld")),
};
