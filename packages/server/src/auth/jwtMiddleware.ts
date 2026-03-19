import type { ExtendedError, Socket } from "socket.io";
import { verifyToken } from "./tokenService.js";

export function jwtAuth(socket: Socket, next: (err?: ExtendedError) => void): void {
  const token = socket.handshake.auth?.token as string | undefined;
  if (!token) {
    next(new Error("Missing auth token"));
    return;
  }
  try {
    (socket as Socket & { user: unknown }).user = verifyToken(token);
    next();
  } catch {
    next(new Error("Invalid auth token"));
  }
}
