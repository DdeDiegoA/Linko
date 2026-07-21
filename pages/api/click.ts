import type { NextApiRequest, NextApiResponse } from "next";
import db from "@/lib/db";
import { trackClick } from "@/lib/analytics";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { linkId } = req.body ?? {};
  if (!Number.isInteger(linkId)) return res.status(400).json({ error: "linkId requerido" });

  const link = db.prepare("SELECT id FROM links WHERE id = ?").get(linkId);
  if (!link) return res.status(404).json({ error: "Link no encontrado" });

  trackClick(linkId);
  return res.status(204).end();
}
