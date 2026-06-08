// Read as a direct literal so Next inlines NEXT_PUBLIC_ values into the client bundle.
// Do NOT destructure process.env or use a dynamic key, or the value won't be inlined.
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";
