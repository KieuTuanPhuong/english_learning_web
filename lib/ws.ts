import { API_BASE_URL } from "./env";
import { getAccessToken } from "./api";

function wsBase(): string {
  return API_BASE_URL.replace(/^http/, "ws");
}

export function openSocket(path: string, onMessage: (data: unknown) => void): WebSocket {
  const token = getAccessToken() ?? "";
  const ws = new WebSocket(`${wsBase()}${path}?token=${encodeURIComponent(token)}`);
  ws.onmessage = (e) => {
    try {
      onMessage(JSON.parse(e.data));
    } catch {
      /* ignore non-JSON */
    }
  };
  return ws;
}
