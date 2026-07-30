"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import {
  getSupabaseBrowserClient,
  isSupabaseConfigured,
} from "../../lib/supabase/client";
import {
  signInWithEmail,
  signInWithGoogle,
  signOutUser,
  signUpWithEmail,
} from "../../utils/supabaseAuth";

type AuthResult = { error: string | null };
type AccountUpdate = { displayName?: string; password?: string };
type AuthContextValue = {
  user: User | null;
  ready: boolean;
  configured: boolean;
  signUp: (email: string, password: string) => Promise<AuthResult>;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signInWithGoogle: (redirectTo?: string) => Promise<AuthResult>;
  updateAccount: (input: AccountUpdate) => Promise<AuthResult>;
  signOut: () => Promise<AuthResult>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const configured = isSupabaseConfigured();
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(!configured);

  useEffect(() => {
    const client = getSupabaseBrowserClient();
    if (!client) return;

    let active = true;
    void client.auth.getSession().then(({ data }) => {
      if (active) {
        setUser(data.session?.user ?? null);
        setReady(true);
      }
    });

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, session) => {
      if (active) {
        setUser(session?.user ?? null);
        setReady(true);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = useCallback(
    async (email: string, password: string) => {
      const client = getSupabaseBrowserClient();
      return client
        ? signUpWithEmail(client, email, password)
        : { error: "Supabase 환경변수가 설정되지 않았습니다." };
    },
    []
  );

  const signIn = useCallback(
    async (email: string, password: string) => {
      const client = getSupabaseBrowserClient();
      return client
        ? signInWithEmail(client, email, password)
        : { error: "Supabase 환경변수가 설정되지 않았습니다." };
    },
    []
  );

  const signInGoogle = useCallback(
    async (redirectTo?: string) => {
      const client = getSupabaseBrowserClient();
      return client
        ? signInWithGoogle(client, redirectTo)
        : { error: "Supabase 환경변수가 설정되지 않았습니다." };
    },
    []
  );

  const signOut = useCallback(async () => {
    const client = getSupabaseBrowserClient();
    return client
      ? signOutUser(client)
      : { error: null };
  }, []);

  const updateAccount = useCallback(async ({ displayName, password }: AccountUpdate) => {
    const client = getSupabaseBrowserClient();
    if (!client) return { error: "Supabase 환경변수가 설정되지 않았습니다." };
    const attributes: {
      data?: { full_name: string; name: string };
      password?: string;
    } = {};
    const trimmedName = displayName?.trim();
    if (trimmedName) attributes.data = { full_name: trimmedName, name: trimmedName };
    if (password) attributes.password = password;
    if (!attributes.data && !attributes.password) return { error: "변경할 정보를 입력해주세요." };
    const { data, error } = await client.auth.updateUser(attributes);
    if (data.user) setUser(data.user);
    return { error: error?.message ?? null };
  }, []);

  const value = useMemo(
    () => ({
      user,
      ready,
      configured,
      signUp,
      signIn,
      signInWithGoogle: signInGoogle,
      updateAccount,
      signOut,
    }),
    [user, ready, configured, signUp, signIn, signInGoogle, updateAccount, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
