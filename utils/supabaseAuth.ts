import type { SupabaseClient } from "@supabase/supabase-js";

type AuthError = { message: string } | null;

export type EmailAuthClient = {
  auth: {
    signUp: (input: { email: string; password: string }) => Promise<{ error: AuthError }>;
    signInWithPassword: (input: { email: string; password: string }) => Promise<{ error: AuthError }>;
    signInWithOAuth: (input: {
      provider: "google";
      options?: { redirectTo?: string };
    }) => Promise<{ data: unknown; error: AuthError }>;
    signOut: () => Promise<{ error: AuthError }>;
  };
};

export async function signUpWithEmail(
  client: EmailAuthClient,
  email: string,
  password: string
) {
  const { error } = await client.auth.signUp({ email, password });
  return { error: error?.message ?? null };
}

export async function signInWithEmail(
  client: EmailAuthClient,
  email: string,
  password: string
) {
  const { error } = await client.auth.signInWithPassword({ email, password });
  return { error: error?.message ?? null };
}

export async function signInWithGoogle(
  client: EmailAuthClient,
  redirectTo?: string
) {
  const targetUrl =
    redirectTo ||
    (typeof window !== "undefined"
      ? `${window.location.origin}/trips`
      : undefined);

  const { data, error } = await client.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: targetUrl,
    },
  });
  return { data, error: error?.message ?? null };
}

export async function signOutUser(client: EmailAuthClient) {
  const { error } = await client.auth.signOut();
  return { error: error?.message ?? null };
}
