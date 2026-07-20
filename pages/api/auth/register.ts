import type { NextApiRequest, NextApiResponse } from "next";
import db from "@/lib/db";
import { hashPassword, signToken } from "@/lib/auth";
import { setAuthCookie } from "@/lib/middleware";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_RE = /^[a-z0-9_-]{3,30}$/;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email, password, username } = req.body ?? {};

  if (typeof email !== "string" || !EMAIL_RE.test(email)) {
    return res.status(400).json({ error: "Email inválido" });
  }
  if (typeof username !== "string" || !USERNAME_RE.test(username)) {
    return res
      .status(400)
      .json({ error: "Username inválido (3-30 caracteres: minúsculas, números, - o _)" });
  }
  if (typeof password !== "string" || password.length < 8) {
    return res.status(400).json({ error: "Password debe tener al menos 8 caracteres" });
  }

  const normalizedEmail = email.toLowerCase();
  const normalizedUsername = username.toLowerCase();
  const passwordHash = await hashPassword(password);

  try {
    const userId = db.transaction(() => {
      const result = db
        .prepare("INSERT INTO users (email, password_hash, username) VALUES (?, ?, ?)")
        .run(normalizedEmail, passwordHash, normalizedUsername);
      db.prepare("INSERT INTO pages (user_id) VALUES (?)").run(result.lastInsertRowid);
      return result.lastInsertRowid as number;
    })();

    const token = signToken({ userId, username: normalizedUsername });
    setAuthCookie(res, token);
    return res.status(201).json({ username: normalizedUsername });
  } catch (err) {
    if (err instanceof Error && err.message.includes("UNIQUE constraint failed")) {
      return res.status(409).json({ error: "Email o username ya registrado" });
    }
    throw err;
  }
}
