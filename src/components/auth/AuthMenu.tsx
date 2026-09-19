"use client";

import { Cloud, LogIn, LogOut, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { useAuth } from "./useAuth";

type AuthState = ReturnType<typeof useAuth>;

function avatarInitial(name: string): string {
  const cleaned = name.replace(/^[^\p{L}\p{N}]+/u, "");
  return (cleaned[0] ?? name[0] ?? "D").toUpperCase();
}

function displayName(auth: AuthState): string {
  const user = auth.user;
  if (!user) return "";
  const metadata = user.user_metadata ?? {};
  return (
    metadata.full_name ??
    metadata.name ??
    metadata.global_name ??
    metadata.preferred_username ??
    user.email ??
    "Conta Discord"
  );
}

export function AuthMenu({ auth }: { auth: AuthState }) {
  if (!auth.configured) {
    return (
      <Button
        variant="outline"
        size="sm"
        disabled
        title="Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"
      >
        <Cloud /> Cloud não configurada
      </Button>
    );
  }

  if (auth.loading) {
    return (
      <Button variant="outline" size="sm" disabled>
        <LoaderCircle className="auth-spinner" /> Verificando conta…
      </Button>
    );
  }

  if (!auth.user) {
    return (
      <Button variant="outline" size="sm" onClick={() => void auth.signInWithDiscord()}>
        <LogIn /> Entrar com Discord
      </Button>
    );
  }

  const name = displayName(auth);
  const avatarUrl =
    typeof auth.user.user_metadata?.avatar_url === "string"
      ? auth.user.user_metadata.avatar_url
      : null;

  return (
    <div className="auth-account">
      <div className="auth-user" title={auth.user.email ?? name}>
        <span
          className="auth-avatar"
          style={
            avatarUrl
              ? {
                  backgroundImage: `url(${avatarUrl})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }
              : undefined
          }
        >
          {avatarUrl ? "" : avatarInitial(name)}
        </span>
        <span className="auth-name">{name}</span>
      </div>
      <Button variant="ghost" size="sm" onClick={() => void auth.signOut()}>
        <LogOut /> Sair
      </Button>
    </div>
  );
}
