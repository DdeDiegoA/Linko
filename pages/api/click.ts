import type { NextApiRequest, NextApiResponse } from "next";
import db from "@/lib/db";
import { trackClick } from "@/lib/analytics";
import { getAuthUser } from "@/lib/middleware";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { linkId } = req.body ?? {};
  if (!Number.isInteger(linkId)) return res.status(400).json({ error: "linkId requerido" });

  const link = db
    .prepare("SELECT links.id, pages.user_id FROM links JOIN pages ON pages.id = links.page_id WHERE links.id = ?")
    .get(linkId) as { id: number; user_id: number } | undefined;
  if (!link) return res.status(404).json({ error: "Link no encontrado" });

  const authUser = getAuthUser(req);
  if (authUser?.userId === link.user_id) return res.status(204).end();

  trackClick(linkId);
  return res.status(204).end();
}
