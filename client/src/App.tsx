import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LangProvider } from "./contexts/LangContext";
import Home from "./pages/Home";
import { lazy, Suspense } from "react";

// The map pulls in three.js; load it only when /map is opened
const NebulaMap = lazy(() => import("./pages/NebulaMap"));
const MapRoute = () => <Suspense fallback={<div style={{ position: "fixed", inset: 0, background: "#030208" }} />}><NebulaMap /></Suspense>;
import PerfumePage from "./pages/PerfumePage";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/map" component={MapRoute} />
      <Route path="/perfume/:id" component={PerfumePage} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <LangProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </LangProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
