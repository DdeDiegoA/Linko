import type { NextApiRequest, NextApiResponse } from "next";
import crypto from "node:crypto";
import db from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { requireSuperUser } from "@/lib/middleware";

const MAX_SPOTS = 20;

export interface ApplicationRow {
  id: number;
  username: string;
  email: string;
  reason: string;
  status: string;
  created_at: string;
  reviewed_at: string | null;
  temp_password: string | null;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const auth = requireSuperUser(req);
  if (!auth) {
    return res.status(401).json({ error: "No autorizado" });
  }

  if (req.method === "GET") {
    const rows = db
      .prepare(
        `SELECT id, username, email, reason, status, created_at, reviewed_at
         FROM applications
         ORDER BY CASE status WHEN 'pending' THEN 0 ELSE 1 END, created_at ASC`
      )
      .all() as ApplicationRow[];
    return res.status(200).json(rows);
  }

  if (req.method === "POST") {
    const id = Number(req.body?.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: "id requerido" });
    }
    const app = db
      .prepare("SELECT id, username, email, status FROM applications WHERE id = ?")
      .get(id) as ApplicationRow | undefined;
    if (!app) {
      return res.status(404).json({ error: "Solicitud no encontrada" });
    }
    if (app.status !== "pending") {
      return res.status(400).json({ error: "La solicitud ya fue procesada" });
    }

    const activeNormalUsers =
      (db.prepare("SELECT COUNT(*) AS n FROM users WHERE role = 'user' AND active = 1").get() as { n: number }).n;
    if (activeNormalUsers >= MAX_SPOTS) {
      return res
        .status(409)
        .json({ error: `Cupo agotado (${MAX_SPOTS} usuarios activos). Liberá un cupo antes de aprobar.` });
    }

    const tempPassword = crypto.randomBytes(8).toString("base64url").slice(0, 12);
    const passwordHash = await hashPassword(tempPassword);

    try {
      db.transaction(() => {
        const r = db
          .prepare("INSERT INTO users (email, password_hash, username, role) VALUES (?, ?, ?, 'user')")
          .run(app.email, passwordHash, app.username);
        db.prepare("INSERT INTO pages (user_id) VALUES (?)").run(r.lastInsertRowid);
        db.prepare(
          "UPDATE applications SET status = 'approved', reviewed_at = datetime('now'), temp_password = ? WHERE id = ?"
        ).run(tempPassword, id);
      })();
    } catch (err) {
      if (err instanceof Error && err.message.includes("UNIQUE constraint failed")) {
        return res.status(409).json({ error: "Email o username ya registrado" });
      }
      throw err;
    }

    return res.status(200).json({ ok: true, tempPassword, username: app.username });
  }

  if (req.method === "DELETE") {
    const id = Number(req.body?.id ?? req.query.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: "id requerido" });
    }
    const app = db.prepare("SELECT id, status FROM applications WHERE id = ?").get(id) as
      | { id: number; status: string }
      | undefined;
    if (!app) {
      return res.status(404).json({ error: "Solicitud no encontrada" });
    }
    db.prepare(
      "UPDATE applications SET status = 'rejected', reviewed_at = datetime('now') WHERE id = ?"
    ).run(id);
    return res.status(200).json({ ok: true });
  }

  res.setHeader("Allow", "GET, POST, DELETE");
  return res.status(405).json({ error: "Method not allowed" });
}