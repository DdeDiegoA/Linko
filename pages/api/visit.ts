import type { NextApiRequest, NextApiResponse } from "next";
import db from "@/lib/db";
import { trackVisit } from "@/lib/analytics";
import { getAuthUser } from "@/lib/middleware";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { pageId } = req.body ?? {};
  if (!Number.isInteger(pageId)) return res.status(400).json({ error: "pageId requerido" });

  const page = db.prepare("SELECT id, user_id FROM pages WHERE id = ?").get(pageId) as
    | { id: number; user_id: number }
    | undefined;
  if (!page) return res.status(404).json({ error: "Página no encontrada" });

  const authUser = getAuthUser(req);
  if (authUser?.userId === page.user_id) return res.status(204).end();

  const fwd = req.headers["x-forwarded-for"];
  const ip =
    (Array.isArray(fwd) ? fwd[0] : fwd)?.split(",")[0]?.trim() ||
    req.socket.remoteAddress ||
    "unknown";

  trackVisit(pageId, ip);
  return res.status(204).end();
}
