import { Router } from "express";
import { signToken } from "../auth/tokenService.js";
import { auditLog } from "../audit/auditLogger.js";

const router = Router();

/**
 * POST /auth/token
 * Issues a 24-hour JWT. In production, add credentials validation here.
 */
router.post("/token", (_req, res) => {
  const token = signToken();
  auditLog({ type: "auth", data: { event: "token_issued" } });
  res.json({ token });
});

export default router;
