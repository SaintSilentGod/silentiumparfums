// Supabase client for the layering atelier (Google sign-in, wardrobe, generations).
// Public values only: the anon key is safe in the browser; row-level security guards the data.
import { createClient, type Session, type SupabaseClient } from "@supabase/supabase-js";
import { useEffect, useState } from "react";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/** null until VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are configured */
export const supabase: SupabaseClient | null = url && anonKey ? createClient(url, anonKey) : null;

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(!supabase);
  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setReady(true); });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);
  return { session, ready };
}

export function signInWithGoogle(returnPath = "/layering") {
  return supabase?.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${window.location.origin}${returnPath}` } });
}

export function signOut() {
  return supabase?.auth.signOut();
}
