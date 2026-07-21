import type { NextApiRequest, NextApiResponse } from "next";
import db from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { requireSuperUser } from "@/lib/middleware";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_RE = /^[a-z0-9_-]{3,30}$/;

export interface AdminUserRow {
  id: number;
  username: string;
  email: string;
  role: string;
  active: number;
  created_at: string;
  links: number;
  socials: number;
  visits: number;
  clicks: number;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const auth = requireSuperUser(req);
  if (!auth) {
    return res.status(401).json({ error: "No autorizado" });
  }

  if (req.method === "GET") {
    const users = db
      .prepare(`
        SELECT u.id, u.username, u.email, u.role, u.active, u.created_at,
               COALESCE(lc.n, 0) AS links,
               COALESCE(sc.n, 0) AS socials,
               COALESCE(vc.n, 0) AS visits,
               COALESCE(cc.n, 0) AS clicks
        FROM users u
        LEFT JOIN (SELECT page_id, COUNT(*) AS n FROM links GROUP BY page_id) lc ON lc.page_id = (SELECT id FROM pages WHERE user_id = u.id)
        LEFT JOIN (SELECT page_id, COUNT(*) AS n FROM social_links GROUP BY page_id) sc ON sc.page_id = (SELECT id FROM pages WHERE user_id = u.id)
        LEFT JOIN (SELECT page_id, COUNT(*) AS n FROM visits GROUP BY page_id) vc ON vc.page_id = (SELECT id FROM pages WHERE user_id = u.id)
        LEFT JOIN (SELECT link_id, COUNT(*) AS n FROM clicks GROUP BY link_id) cc ON cc.link_id IN (SELECT id FROM links WHERE page_id = (SELECT id FROM pages WHERE user_id = u.id))
        ORDER BY u.active DESC, u.created_at DESC
      `)
      .all() as AdminUserRow[];
    return res.status(200).json(users);
  }

  if (req.method === "POST") {
    const { email, username, password, role } = req.body ?? {};

    if (typeof email !== "string" || !EMAIL_RE.test(email)) {
      return res.status(400).json({ error: "Email inválido" });
    }
    if (typeof username !== "string" || !USERNAME_RE.test(username)) {
      return res.status(400).json({ error: "Username inválido (3-30 caracteres: minúsculas, números, - o _)" });
    }
    if (typeof password !== "string" || password.length < 8) {
      return res.status(400).json({ error: "Password debe tener al menos 8 caracteres" });
    }
    const userRole = role === "super" ? "super" : "user";

    const normalizedEmail = email.toLowerCase();
    const normalizedUsername = username.toLowerCase();
    const passwordHash = await hashPassword(password);

    try {
      const result = db.transaction(() => {
        const r = db
          .prepare("INSERT INTO users (email, password_hash, username, role) VALUES (?, ?, ?, ?)")
          .run(normalizedEmail, passwordHash, normalizedUsername, userRole);
        if (userRole === "user") {
          db.prepare("INSERT INTO pages (user_id) VALUES (?)").run(r.lastInsertRowid);
        }
        return r.lastInsertRowid as number;
      })();

      void result;
      return res.status(201).json({ username: normalizedUsername });
    } catch (err) {
      if (err instanceof Error && err.message.includes("UNIQUE constraint failed")) {
        return res.status(409).json({ error: "Email o username ya registrado" });
      }
      throw err;
    }
  }

  if (req.method === "PATCH") {
    const { id, role, active } = req.body ?? {};
    if (typeof id !== "number") {
      return res.status(400).json({ error: "id requerido" });
    }

    const target = db.prepare("SELECT id, role FROM users WHERE id = ?").get(id) as
      | { id: number; role: string }
      | undefined;
    if (!target) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    if (typeof role === "string") {
      const newRole = role === "super" ? "super" : "user";
      // No autodespedirse del super
      if (auth.userId === id && target.role === "super" && newRole !== "super") {
        return res.status(400).json({ error: "No puedes quitarte el rol super a ti mismo" });
      }
      db.prepare("UPDATE users SET role = ? WHERE id = ?").run(newRole, id);
    }
    if (typeof active === "number" && (active === 0 || active === 1)) {
      if (auth.userId === id && active === 0) {
        return res.status(400).json({ error: "No puedes desactivarte a ti mismo" });
      }
      db.prepare("UPDATE users SET active = ? WHERE id = ?").run(active, id);
    }

    return res.status(200).json({ ok: true });
  }

  if (req.method === "DELETE") {
    const id = Number(req.query.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: "id requerido" });
    }
    if (auth.userId === id) {
      return res.status(400).json({ error: "No puedes eliminarte a ti mismo" });
    }
    const target = db.prepare("SELECT id FROM users WHERE id = ?").get(id);
    if (!target) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }
    db.prepare("DELETE FROM users WHERE id = ?").run(id);
    return res.status(200).json({ ok: true });
  }

  res.setHeader("Allow", "GET, POST, PATCH, DELETE");
  return res.status(405).json({ error: "Method not allowed" });
}