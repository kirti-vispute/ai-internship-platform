"use client";

import { useCallback, useEffect, useState } from "react";
import { getAuthSession, type AuthRole } from "@/lib/session";

export type AuthSessionState = {
  loggedIn: boolean;
  role: AuthRole | null;
  token: string | null;
  email: string | null;
};

export function useAuthSession(): AuthSessionState {
  const read = useCallback((): AuthSessionState => {
    const session = getAuthSession();
    return {
      loggedIn: session.loggedIn,
      role: session.role,
      token: session.token,
      email: session.email
    };
  }, []);

  // Initialize to the logged-out default, not `read()`: React re-runs a
  // lazy useState initializer on the client's first render before
  // hydration, so calling read() here would return the real localStorage
  // session client-side while the server (no localStorage) rendered the
  // logged-out markup -- a hydration mismatch. The real session is applied
  // in the effect below, after hydration completes.
  const [session, setSession] = useState<AuthSessionState>({ loggedIn: false, role: null, token: null, email: null });

  useEffect(() => {
    setSession(read());
    const sync = () => setSession(read());
    window.addEventListener("storage", sync);
    window.addEventListener("internai-auth-change", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("internai-auth-change", sync);
    };
  }, [read]);

  return session;
}
