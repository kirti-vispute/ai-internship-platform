export type AuthRole = "intern" | "company";

type StoredSession = {
  role: AuthRole;
  token: string;
};

const AUTH_ROLE_KEY = "internai.auth.role";
const AUTH_LOGGED_IN_KEY = "internai.auth.logged_in";
const AUTH_TOKEN_KEY = "internai.auth.token";

export function setAuthSession(role: AuthRole, token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(AUTH_ROLE_KEY, role);
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  localStorage.setItem(AUTH_LOGGED_IN_KEY, "true");
}

export function clearAuthSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(AUTH_ROLE_KEY);
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_LOGGED_IN_KEY);
}

export function getAuthSession(): { loggedIn: boolean; role: AuthRole | null; token: string | null } {
  if (typeof window === "undefined") return { loggedIn: false, role: null, token: null };

  const loggedIn = localStorage.getItem(AUTH_LOGGED_IN_KEY) === "true";
  const roleValue = localStorage.getItem(AUTH_ROLE_KEY);
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  const role: AuthRole | null = roleValue === "intern" || roleValue === "company" ? roleValue : null;

  return { loggedIn, role, token };
}

export function requireAuthSession(): StoredSession {
  const session = getAuthSession();
  if (!session.loggedIn || !session.role || !session.token) {
    throw new Error("Session not found");
  }

  return { role: session.role, token: session.token };
}
