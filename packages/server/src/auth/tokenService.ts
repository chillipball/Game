import jwt from "jsonwebtoken";
import { JWT_EXPIRY } from "@jarvis/shared";

const secret = () => {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error("JWT_SECRET env var is required");
  return s;
};

export function signToken(payload: Record<string, unknown> = {}): string {
  return jwt.sign(payload, secret(), { expiresIn: JWT_EXPIRY });
}

export function verifyToken(token: string): jwt.JwtPayload {
  const result = jwt.verify(token, secret());
  if (typeof result === "string") throw new Error("Unexpected string JWT payload");
  return result;
}
