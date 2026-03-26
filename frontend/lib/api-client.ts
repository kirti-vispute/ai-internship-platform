import { getAuthSession } from "@/lib/session";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

type ApiRequestOptions = RequestInit & {
  token?: string;
};

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  headers.set("Accept", "application/json");

  const hasBody = options.body && !(options.body instanceof FormData);
  if (hasBody) headers.set("Content-Type", "application/json");

  const session = getAuthSession();
  const token = options.token || session.token;
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
      cache: "no-store"
    });
  } catch {
    throw new Error("Cannot reach backend API. Start backend with `npm run server:dev` and check MongoDB connection.");
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error((data as { message?: string }).message || "Request failed");
  }

  return data as T;
}
