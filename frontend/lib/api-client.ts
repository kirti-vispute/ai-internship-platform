import { getAuthSession } from "@/lib/session";

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000").replace(/\/+$/, "");

type ApiRequestOptions = RequestInit & {
  token?: string;
};

function buildApiUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;

  let normalizedPath = path.startsWith("/") ? path : `/${path}`;

  // Keep health probe outside /api namespace.
  if (normalizedPath === "/health" || normalizedPath.startsWith("/health?")) {
    return `${API_BASE_URL}${normalizedPath}`;
  }

  if (!normalizedPath.startsWith("/api/")) {
    normalizedPath = `/api${normalizedPath}`;
  }

  normalizedPath = normalizedPath.replace(/^\/api\/api\//, "/api/");
  return `${API_BASE_URL}${normalizedPath}`;
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  headers.set("Accept", "application/json");

  const hasBody = options.body && !(options.body instanceof FormData);
  if (hasBody) headers.set("Content-Type", "application/json");

  const session = getAuthSession();
  const token = options.token || session.token;
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const url = buildApiUrl(path);
  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
      cache: "no-store"
    });
  } catch (error) {
    console.error("[apiRequest] Network error", {
      url,
      method: options.method || "GET",
      message: error instanceof Error ? error.message : String(error),
      apiBaseUrl: API_BASE_URL
    });
    throw new Error(`Cannot reach backend API at ${API_BASE_URL}. Check NEXT_PUBLIC_API_BASE_URL and backend availability.`);
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const serverMessage = (data as { message?: string }).message;
    console.error("[apiRequest] API error response", {
      url,
      method: options.method || "GET",
      status: response.status,
      statusText: response.statusText,
      body: data
    });
    throw new Error(serverMessage || `Request failed (${response.status} ${response.statusText})`);
  }

  return data as T;
}

export async function testBackendConnectivity() {
  return apiRequest<{ status?: string; service?: string }>("/health");
}
