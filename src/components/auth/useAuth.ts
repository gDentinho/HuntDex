"use client";

import { useCallback, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabaseClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";


function consumeAuthErrorFromUrl(): string | null {
  if (typeof window === "undefined") return null;
  const url = new URL(window.location.href);
  const fragment = new URLSearchParams(url.hash.startsWith("#error=") ? url.hash.slice(1) : "");
  const description = url.searchParams.get("error_description") ?? fragment.get("error_description");
  const code = url.searchParams.get("error_code") ?? url.searchParams.get("error") ?? fragment.get("error");
  if (!description && !code) return null;
  for (const key of ["error", "error_code", "error_description"]) url.searchParams.delete(key);
  if (url.hash.startsWith("#error=")) url.hash = "#dashboard";
  window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
  return description ? `Login não concluído: ${description}` : "Login com Discord não foi concluído.";
}
function cleanAuthCodeFromUrl() {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  if (!url.searchParams.has("code")) return;
  url.searchParams.delete("code");
  window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const client = getSupabaseClient();
    if (!client) return;

    const redirectError = consumeAuthErrorFromUrl();
    if (redirectError) queueMicrotask(() => setError(redirectError));

    let mounted = true;
    client.auth
      .getSession()
      .then(({ data, error: authError }: { data: { session: { user: User } | null }; error: Error | null }) => {
        if (!mounted) return;
        if (authError) setError("Não foi possível restaurar sua sessão.");
        setUser(data.session?.user ?? null);
        if (data.session) cleanAuthCodeFromUrl();
      })
      .catch(() => {
        if (mounted) setError("Não foi possível restaurar sua sessão.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event: string, session: { user: User } | null) => {
      if (!mounted) return;
      setUser(session?.user ?? null);
      setLoading(false);
      setError(null);
      if (session) cleanAuthCodeFromUrl();
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signInWithDiscord = useCallback(async () => {
    const client = getSupabaseClient();
    if (!client) {
      setError("Configure o Supabase antes de usar o login com Discord.");
      return;
    }
    setError(null);
    const redirectTo = `${window.location.origin}${window.location.pathname}`;
    const { error: authError } = await client.auth.signInWithOAuth({
      provider: "discord",
      options: { redirectTo },
    });
    if (authError) {
      setError("Não foi possível iniciar o login com Discord.");
    }
  }, []);

  const signOut = useCallback(async () => {
    const client = getSupabaseClient();
    if (!client) return;
    setError(null);
    const { error: authError } = await client.auth.signOut();
    if (authError) setError("Não foi possível sair da conta. Tente novamente.");
  }, []);

  return {
    configured: isSupabaseConfigured,
    user,
    loading,
    error,
    signInWithDiscord,
    signOut,
  };
}
