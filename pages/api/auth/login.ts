import type { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";
import db from "@/lib/db";
import { verifyPassword, signToken } from "@/lib/auth";
import { setAuthCookie } from "@/lib/middleware";

// ponytail: single-process in-memory limiter — fine while constitution rules out horizontal scaling.
const attempts = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 60_000;
const MAX_ATTEMPTS = 3;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = attempts.get(ip);
  if (!entry || now > entry.resetAt) {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_ATTEMPTS;
}

// Fixed-cost dummy hash so lookups for unknown emails take as long as real ones (avoids timing-based user enumeration).
const DUMMY_HASH = bcrypt.hashSync("linko-timing-guard", 10);

interface UserRow {
  id: number;
  username: string;
  password_hash: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const ip =
    (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
    req.socket.remoteAddress ||
    "unknown";
  if (isRateLimited(ip)) {
    return res.status(429).json({ error: "Demasiados intentos. Probá de nuevo en un minuto." });
  }

  const { email, password } = req.body ?? {};
  if (typeof email !== "string" || typeof password !== "string") {
    return res.status(401).json({ error: "Credenciales inválidas" });
  }

  const user = db
    .prepare("SELECT id, username, password_hash, active FROM users WHERE email = ?")
    .get(email.toLowerCase()) as (UserRow & { active: number }) | undefined;

  const valid = await verifyPassword(password, user?.password_hash ?? DUMMY_HASH);
  if (!user || !valid) {
    return res.status(401).json({ error: "Credenciales inválidas" });
  }
  if (!user.active) {
    return res.status(403).json({ error: "Cuenta desactivada. Contactá al administrador." });
  }

  const token = signToken({ userId: user.id, username: user.username });
  setAuthCookie(res, token);
  return res.status(200).json({ username: user.username });
}
