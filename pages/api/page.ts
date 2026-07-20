import type { NextApiRequest, NextApiResponse } from "next";
import db from "@/lib/db";
import { getAuthUser } from "@/lib/middleware";
import type { Page, LinkItem, SocialLink } from "@/types";

const HEX_COLOR_RE = /^#[0-9a-fA-F]{6}$/;

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") return handleGet(req, res);
  if (req.method === "PUT") return handlePut(req, res);
  res.setHeader("Allow", "GET, PUT");
  return res.status(405).json({ error: "Method not allowed" });
}

function handleGet(req: NextApiRequest, res: NextApiResponse) {
  const { username } = req.query;
  if (typeof username !== "string") {
    return res.status(400).json({ error: "username requerido" });
  }

  const page = db
    .prepare(
      `SELECT pages.* FROM pages JOIN users ON users.id = pages.user_id WHERE users.username = ?`
    )
    .get(username.toLowerCase()) as Page | undefined;

  if (!page) {
    return res.status(404).json({ error: "Página no encontrada" });
  }

  const links = db
    .prepare("SELECT * FROM links WHERE page_id = ? ORDER BY position ASC")
    .all(page.id) as LinkItem[];

  const socials = db
    .prepare("SELECT * FROM social_links WHERE page_id = ? ORDER BY position ASC")
    .all(page.id) as SocialLink[];

  return res.status(200).json({ page, links, socials });
}

function handlePut(req: NextApiRequest, res: NextApiResponse) {
  const authUser = getAuthUser(req);
  if (!authUser) {
    return res.status(401).json({ error: "No autenticado" });
  }

  const { background_type, background_value, avatar_path, title, title_color, subtitle, subtitle_color } =
    req.body ?? {};

  if (background_type !== "image" && background_type !== "color") {
    return res.status(400).json({ error: "background_type inválido" });
  }
  if (typeof background_value !== "string" || !background_value) {
    return res.status(400).json({ error: "background_value requerido" });
  }
  if (typeof title !== "string" || typeof subtitle !== "string") {
    return res.status(400).json({ error: "title y subtitle deben ser texto" });
  }
  if (!HEX_COLOR_RE.test(title_color) || !HEX_COLOR_RE.test(subtitle_color)) {
    return res.status(400).json({ error: "Colores deben ser hex (#rrggbb)" });
  }
  if (avatar_path !== null && avatar_path !== undefined && typeof avatar_path !== "string") {
    return res.status(400).json({ error: "avatar_path inválido" });
  }

  db.prepare(
    `UPDATE pages SET background_type=?, background_value=?, avatar_path=?, title=?, title_color=?, subtitle=?, subtitle_color=? WHERE user_id=?`
  ).run(
    background_type,
    background_value,
    avatar_path ?? null,
    title,
    title_color,
    subtitle,
    subtitle_color,
    authUser.userId
  );

  const updated = db.prepare("SELECT * FROM pages WHERE user_id = ?").get(authUser.userId) as Page;
  return res.status(200).json({ page: updated });
}
