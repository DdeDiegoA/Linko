import type { NextApiRequest, NextApiResponse } from "next";
import db from "@/lib/db";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_RE = /^[a-z0-9_-]{3,30}$/;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email, username, reason } = req.body ?? {};

  if (typeof email !== "string" || !EMAIL_RE.test(email)) {
    return res.status(400).json({ error: "Email inválido" });
  }
  if (typeof username !== "string" || !USERNAME_RE.test(username)) {
    return res.status(400).json({ error: "Username inválido (3-30 caracteres: minúsculas, números, - o _)" });
  }
  if (typeof reason !== "string" || reason.trim().length < 20) {
    return res.status(400).json({ error: "Contanos un poco más (mínimo 20 caracteres)" });
  }
  if (reason.length > 500) {
    return res.status(400).json({ error: "El texto no puede superar los 500 caracteres" });
  }

  const normalizedEmail = email.toLowerCase();
  const normalizedUsername = username.toLowerCase();

  // No aceptar duplicados contra usuarios existentes ni solicitudes pendientes previas.
  const existingUser = db
    .prepare("SELECT 1 FROM users WHERE email = ? OR username = ?")
    .get(normalizedEmail, normalizedUsername);
  if (existingUser) {
    return res.status(409).json({ error: "Ese email o username ya está registrado" });
  }
  const existingPending = db
    .prepare("SELECT 1 FROM applications WHERE (email = ? OR username = ?) AND status = 'pending'")
    .get(normalizedEmail, normalizedUsername);
  if (existingPending) {
    return res.status(409).json({ error: "Ya tenés una solicitud pendiente" });
  }

  db.prepare(
    "INSERT INTO applications (username, email, reason) VALUES (?, ?, ?)"
  ).run(normalizedUsername, normalizedEmail, reason.trim());

  return res.status(201).json({ ok: true });
}