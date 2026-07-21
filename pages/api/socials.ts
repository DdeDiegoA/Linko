import type { NextApiRequest, NextApiResponse } from "next";
import db from "@/lib/db";
import { requireRegularUser, getPageIdForUser } from "@/lib/middleware";
import { DEFAULT_SOCIAL_ICON, type SocialLink, type SocialPlatform } from "@/types";
import { TABLER_ICON_NAMES } from "@/lib/icons";

const PLATFORMS: SocialPlatform[] = [
  "github",
  "twitter",
  "instagram",
  "linkedin",
  "youtube",
  "tiktok",
  "other",
];
const HEX_COLOR_RE = /^#[0-9a-fA-F]{6}$/;
const ICON_SET = new Set(TABLER_ICON_NAMES);

// known → ícono por defecto. other → el del picker (validado contra tabler).
function resolveSocialIcon(platform: SocialPlatform, bodyIcon: unknown): string | null {
  if (platform !== "other") return DEFAULT_SOCIAL_ICON[platform];
  if (typeof bodyIcon !== "string" || !bodyIcon) return null;
  return ICON_SET.has(bodyIcon) ? bodyIcon : null;
}

function isValidUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function validateSocialFields(body: any): string | null {
  if (!PLATFORMS.includes(body.platform)) return "platform inválida";
  if (typeof body.url !== "string" || !isValidUrl(body.url)) return "url inválida";
  if (body.text !== undefined && typeof body.text !== "string") return "text inválido";
  if (body.platform === "other") {
    if (typeof body.icon !== "string" || !body.icon || !ICON_SET.has(body.icon))
      return "icon inválido para plataforma other";
  }
  // icon_color/icon_background_color sólo se validan cuando custom_color=1.
  // Cuando 0, la API rellena con los defaults del page.
  const customColor = body.custom_color === 1 || body.custom_color === true ? 1 : 0;
  if (customColor === 1) {
    if (!HEX_COLOR_RE.test(body.icon_color)) return "icon_color inválido";
    if (!HEX_COLOR_RE.test(body.icon_background_color)) return "icon_background_color inválido";
  }
  return null;
}

// page defaults de redes, respaldo para redes sin custom_color.
function pageSocialDefaults(pageId: number) {
  return db
    .prepare("SELECT social_icon_color, social_icon_background_color FROM pages WHERE id = ?")
    .get(pageId) as { social_icon_color: string; social_icon_background_color: string };
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
  const socials = db
    .prepare("SELECT * FROM social_links WHERE page_id = ? ORDER BY position ASC")
    .all(pageId) as SocialLink[];
  return res.status(200).json({ socials });
}

function handlePost(pageId: number, req: NextApiRequest, res: NextApiResponse) {
  const body = req.body ?? {};
  const error = validateSocialFields(body);
  if (error) return res.status(400).json({ error });

  const customColor = body.custom_color === 1 || body.custom_color === true ? 1 : 0;
  const defaults = pageSocialDefaults(pageId);
  const icon_color = customColor === 1 ? body.icon_color : defaults.social_icon_color;
  const icon_background_color = customColor === 1 ? body.icon_background_color : defaults.social_icon_background_color;

  const nextPos =
    (
      db
        .prepare("SELECT COALESCE(MAX(position), -1) as p FROM social_links WHERE page_id = ?")
        .get(pageId) as { p: number }
    ).p + 1;

  const result = db
    .prepare(
      `INSERT INTO social_links (page_id, platform, icon, icon_color, icon_background_color, custom_color, text, url, position) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      pageId,
      body.platform,
      resolveSocialIcon(body.platform, body.icon),
      icon_color,
      icon_background_color,
      customColor,
      body.text || "",
      body.url,
      nextPos
    );

  const social = db
    .prepare("SELECT * FROM social_links WHERE id = ?")
    .get(result.lastInsertRowid) as SocialLink;
  return res.status(201).json({ social });
}

function handlePut(pageId: number, req: NextApiRequest, res: NextApiResponse) {
  const body = req.body ?? {};
  const { id } = body;
  if (typeof id !== "number") return res.status(400).json({ error: "id requerido" });

  const existing = db.prepare("SELECT id FROM social_links WHERE id = ? AND page_id = ?").get(id, pageId);
  if (!existing) return res.status(404).json({ error: "Red social no encontrada" });

  const error = validateSocialFields(body);
  if (error) return res.status(400).json({ error });

  const customColor = body.custom_color === 1 || body.custom_color === true ? 1 : 0;
  const defaults = pageSocialDefaults(pageId);
  const icon_color = customColor === 1 ? body.icon_color : defaults.social_icon_color;
  const icon_background_color = customColor === 1 ? body.icon_background_color : defaults.social_icon_background_color;

  db.prepare(
    `UPDATE social_links SET platform=?, icon=?, icon_color=?, icon_background_color=?, custom_color=?, text=?, url=? WHERE id=? AND page_id=?`
  ).run(
    body.platform,
    resolveSocialIcon(body.platform, body.icon),
    icon_color,
    icon_background_color,
    customColor,
    body.text || "",
    body.url,
    id,
    pageId
  );

  const social = db.prepare("SELECT * FROM social_links WHERE id = ?").get(id) as SocialLink;
  return res.status(200).json({ social });
}

function handleDelete(pageId: number, req: NextApiRequest, res: NextApiResponse) {
  const id = Number(req.query.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: "id requerido" });

  const result = db.prepare("DELETE FROM social_links WHERE id = ? AND page_id = ?").run(id, pageId);
  if (result.changes === 0) return res.status(404).json({ error: "Red social no encontrada" });

  return res.status(204).end();
}
