const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"

export async function apiFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const headers: HeadersInit = {
    ...(options.body && !(options.body instanceof URLSearchParams)
      ? { "Content-Type": "application/json" }
      : {}),
    ...options.headers,
  }

  return fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
    credentials: "include",
  })
}
