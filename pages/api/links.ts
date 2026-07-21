import type { NextApiRequest, NextApiResponse } from "next";
import db from "@/lib/db";
import { requireRegularUser, getPageIdForUser } from "@/lib/middleware";
import type { LinkItem } from "@/types";

const MAX_LINKS = 20;
const HEX_COLOR_RE = /^#[0-9a-fA-F]{6}$/;

function isValidUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

// page defaults usados como respaldo cuando custom_style=0 (la API siempre
// guarda valores válidos en las columnas NOT NULL, aunque no se rendericen).
function pageLinkDefaults(pageId: number) {
  return db
    .prepare(
      "SELECT link_color, link_background_color, link_border_color, link_border_width FROM pages WHERE id = ?"
    )
    .get(pageId) as {
    link_color: string;
    link_background_color: string;
    link_border_color: string;
    link_border_width: number;
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function validateLinkFields(body: any, pageId: number): string | null {
  if (typeof body.text !== "string" || !body.text.trim()) return "text requerido";
  if (typeof body.url !== "string" || !isValidUrl(body.url)) return "url inválida";
  if (body.icon !== undefined && body.icon !== null && typeof body.icon !== "string")
    return "icon inválido";

  const customStyle = body.custom_style === 1 || body.custom_style === true ? 1 : 0;
  if (customStyle === 1) {
    if (!HEX_COLOR_RE.test(body.color)) return "color inválido";
    if (!HEX_COLOR_RE.test(body.background_color)) return "background_color inválido";
    if (!HEX_COLOR_RE.test(body.border_color)) return "border_color inválido";
    if (typeof body.border_width !== "number" || body.border_width < 0 || body.border_width > 20)
      return "border_width inválido";
  }
  return null;
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const authUser = requireRegularUser(req);
  if (!authUser) return res.status(401).json({ error: "No autenticado" });

  const pageId = getPageIdForUser(authUser.userId);
  if (!pageId) return res.status(404).json({ error: "Página no encontrada" });

  switch (req.method) {
    case "GET":
      return handleGet(pageId, res);
    case "POST":
      return handlePost(pageId, req, res);
    case "PUT":
      return handlePut(pageId, req, res);
    case "DELETE":
      return handleDelete(pageId, req, res);
    default:
      res.setHeader("Allow", "GET, POST, PUT, DELETE");
      return res.status(405).json({ error: "Method not allowed" });
  }
}

function handleGet(pageId: number, res: NextApiResponse) {
  const links = db
    .prepare("SELECT * FROM links WHERE page_id = ? ORDER BY position ASC")
    .all(pageId) as LinkItem[];
  return res.status(200).json({ links });
}

function handlePost(pageId: number, req: NextApiRequest, res: NextApiResponse) {
  const body = req.body ?? {};
  const error = validateLinkFields(body, pageId);
  if (error) return res.status(400).json({ error });

  const count = (
    db.prepare("SELECT COUNT(*) as n FROM links WHERE page_id = ?").get(pageId) as { n: number }
  ).n;
  if (count >= MAX_LINKS) {
    return res.status(400).json({ error: `Máximo ${MAX_LINKS} links` });
  }

  const nextPos =
    (
      db
        .prepare("SELECT COALESCE(MAX(position), -1) as p FROM links WHERE page_id = ?")
        .get(pageId) as { p: number }
    ).p + 1;

  const customStyle = body.custom_style === 1 || body.custom_style === true ? 1 : 0;
  const defaults = pageLinkDefaults(pageId);
  const color = customStyle === 1 ? body.color : defaults.link_color;
  const background_color = customStyle === 1 ? body.background_color : defaults.link_background_color;
  const border_color = customStyle === 1 ? body.border_color : defaults.link_border_color;
  const border_width = customStyle === 1 ? body.border_width : defaults.link_border_width;

  const result = db
    .prepare(
      `INSERT INTO links (page_id, icon, text, url, color, background_color, border_color, border_width, custom_style, position)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      pageId,
      body.icon || null,
      body.text,
      body.url,
      color,
      background_color,
      border_color,
      border_width,
      customStyle,
      nextPos
    );

  const link = db.prepare("SELECT * FROM links WHERE id = ?").get(result.lastInsertRowid) as LinkItem;
  return res.status(201).json({ link });
}

function handlePut(pageId: number, req: NextApiRequest, res: NextApiResponse) {
  const body = req.body ?? {};

  if (Array.isArray(body.reorder)) {
    const ids: unknown[] = body.reorder;
    if (!ids.every((id) => typeof id === "number")) {
      return res.status(400).json({ error: "reorder debe ser array de ids numéricos" });
    }
    const owned = db.prepare("SELECT id FROM links WHERE page_id = ?").all(pageId) as { id: number }[];
    const ownedIds = new Set(owned.map((l) => l.id));
    if (ids.length !== owned.length || !ids.every((id) => ownedIds.has(id as number))) {
      return res.status(400).json({ error: "reorder debe incluir exactamente los links propios" });
    }
    const update = db.prepare("UPDATE links SET position = ? WHERE id = ? AND page_id = ?");
    db.transaction(() => {
      ids.forEach((id, index) => update.run(index, id, pageId));
    })();
    const links = db
      .prepare("SELECT * FROM links WHERE page_id = ? ORDER BY position ASC")
      .all(pageId) as LinkItem[];
    return res.status(200).json({ links });
  }

  const { id } = body;
  if (typeof id !== "number") return res.status(400).json({ error: "id requerido" });

  const existing = db.prepare("SELECT id FROM links WHERE id = ? AND page_id = ?").get(id, pageId);
  if (!existing) return res.status(404).json({ error: "Link no encontrado" });

  const error = validateLinkFields(body, pageId);
  if (error) return res.status(400).json({ error });

  const customStyle = body.custom_style === 1 || body.custom_style === true ? 1 : 0;
  const defaults = pageLinkDefaults(pageId);
  const color = customStyle === 1 ? body.color : defaults.link_color;
  const background_color = customStyle === 1 ? body.background_color : defaults.link_background_color;
  const border_color = customStyle === 1 ? body.border_color : defaults.link_border_color;
  const border_width = customStyle === 1 ? body.border_width : defaults.link_border_width;

  db.prepare(
    `UPDATE links SET icon=?, text=?, url=?, color=?, background_color=?, border_color=?, border_width=?, custom_style=? WHERE id=? AND page_id=?`
  ).run(
    body.icon || null,
    body.text,
    body.url,
    color,
    background_color,
    border_color,
    border_width,
    customStyle,
    id,
    pageId
  );

  const link = db.prepare("SELECT * FROM links WHERE id = ?").get(id) as LinkItem;
  return res.status(200).json({ link });
}

function handleDelete(pageId: number, req: NextApiRequest, res: NextApiResponse) {
  const id = Number(req.query.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: "id requerido" });

  const result = db.prepare("DELETE FROM links WHERE id = ? AND page_id = ?").run(id, pageId);
  if (result.changes === 0) return res.status(404).json({ error: "Link no encontrado" });

  return res.status(204).end();
}
