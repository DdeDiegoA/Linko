import type { NextApiRequest, NextApiResponse } from "next";
import db from "@/lib/db";
import { requireRegularUser } from "@/lib/middleware";
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
  const authUser = requireRegularUser(req);
  if (!authUser) {
    return res.status(401).json({ error: "No autenticado" });
  }

  const {
    background_type,
    background_value,
    avatar_path,
    title,
    title_color,
    subtitle,
    subtitle_color,
    link_color,
    link_background_color,
    link_border_color,
    link_border_width,
    social_icon_color,
    social_icon_background_color,
  } = req.body ?? {};

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

  // Defaults de links/redes se validan sólo si vienen en el body (dashboard
  // de perfil no los edita pero los reenvía; el de links/redes sí).
  const linkDefaultsProvided =
    link_color !== undefined ||
    link_background_color !== undefined ||
    link_border_color !== undefined ||
    link_border_width !== undefined ||
    social_icon_color !== undefined ||
    social_icon_background_color !== undefined;

  let resLinkColor: string | undefined;
  let resLinkBg: string | undefined;
  let resLinkBorder: string | undefined;
  let resLinkBorderWidth: number | undefined;
  let resSocialColor: string | undefined;
  let resSocialBg: string | undefined;

  if (linkDefaultsProvided) {
    if (
      typeof link_color !== "string" ||
      !HEX_COLOR_RE.test(link_color) ||
      typeof link_background_color !== "string" ||
      !HEX_COLOR_RE.test(link_background_color) ||
      typeof link_border_color !== "string" ||
      !HEX_COLOR_RE.test(link_border_color) ||
      typeof link_border_width !== "number" ||
      link_border_width < 0 ||
      link_border_width > 20 ||
      typeof social_icon_color !== "string" ||
      !HEX_COLOR_RE.test(social_icon_color) ||
      typeof social_icon_background_color !== "string" ||
      !HEX_COLOR_RE.test(social_icon_background_color)
    ) {
      return res.status(400).json({ error: "Defaults de links/redes inválidos" });
    }
    resLinkColor = link_color;
    resLinkBg = link_background_color;
    resLinkBorder = link_border_color;
    resLinkBorderWidth = link_border_width;
    resSocialColor = social_icon_color;
    resSocialBg = social_icon_background_color;
  }

  // Si no vienen defaults nuevos, preservamos los actuales releyéndolos.
  if (!linkDefaultsProvided) {
    const current = db.prepare("SELECT link_color, link_background_color, link_border_color, link_border_width, social_icon_color, social_icon_background_color FROM pages WHERE user_id = ?").get(authUser.userId) as {
      link_color: string;
      link_background_color: string;
      link_border_color: string;
      link_border_width: number;
      social_icon_color: string;
      social_icon_background_color: string;
    };
    resLinkColor = current.link_color;
    resLinkBg = current.link_background_color;
    resLinkBorder = current.link_border_color;
    resLinkBorderWidth = current.link_border_width;
    resSocialColor = current.social_icon_color;
    resSocialBg = current.social_icon_background_color;
  }

  db.prepare(
    `UPDATE pages SET background_type=?, background_value=?, avatar_path=?, title=?, title_color=?, subtitle=?, subtitle_color=?, link_color=?, link_background_color=?, link_border_color=?, link_border_width=?, social_icon_color=?, social_icon_background_color=? WHERE user_id=?`
  ).run(
    background_type,
    background_value,
    avatar_path ?? null,
    title,
    title_color,
    subtitle,
    subtitle_color,
    resLinkColor,
    resLinkBg,
    resLinkBorder,
    resLinkBorderWidth,
    resSocialColor,
    resSocialBg,
    authUser.userId
  );

  const updated = db.prepare("SELECT * FROM pages WHERE user_id = ?").get(authUser.userId) as Page;
  return res.status(200).json({ page: updated });
}
