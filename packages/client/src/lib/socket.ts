import { io, type Socket } from "socket.io-client";

let socket: Socket | null = null;

export async function getSocket(): Promise<Socket> {
  if (socket?.connected) return socket;

  // Fetch a fresh JWT
  const res = await fetch("/auth/token", { method: "POST" });
  const { token } = (await res.json()) as { token: string };

  socket = io({ auth: { token }, autoConnect: false });
  socket.connect();
  return socket;
}

export function getSocketSync(): Socket | null {
  return socket;
}
