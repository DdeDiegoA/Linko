import type { NextApiRequest, NextApiResponse } from "next";
import { verifyToken, type TokenPayload } from "@/lib/auth";
import db from "@/lib/db";

export function getAuthUser(req: NextApiRequest): TokenPayload | null {
  const token = req.cookies.token;
  if (!token) return null;
  return verifyToken(token);
}

export function getPageIdForUser(userId: number): number | null {
  const row = db.prepare("SELECT id FROM pages WHERE user_id = ?").get(userId) as
    | { id: number }
    | undefined;
  return row?.id ?? null;
}

export function setAuthCookie(res: NextApiResponse, token: string) {
  const isProd = process.env.NODE_ENV === "production";
  res.setHeader(
    "Set-Cookie",
    `token=${token}; HttpOnly; Path=/; Max-Age=${7 * 24 * 60 * 60}; SameSite=Lax${isProd ? "; Secure" : ""}`
  );
}

export function clearAuthCookie(res: NextApiResponse) {
  res.setHeader("Set-Cookie", "token=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax");
}

export function requireSuperUser(req: NextApiRequest): TokenPayload | null {
  const user = getAuthUser(req);
  if (!user) return null;
  const row = db.prepare("SELECT role FROM users WHERE id = ?").get(user.userId) as
    | { role: string }
    | undefined;
  if (row?.role !== "super") return null;
  return user;
}

// Admin (role "super") no tiene perfil/links/redes — sólo gestiona usuarios y ve analíticas.
export function requireRegularUser(req: NextApiRequest): TokenPayload | null {
  const user = getAuthUser(req);
  if (!user) return null;
  const row = db.prepare("SELECT role FROM users WHERE id = ?").get(user.userId) as
    | { role: string }
    | undefined;
  if (row?.role === "super") return null;
  return user;
}
