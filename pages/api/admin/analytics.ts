import type { NextApiRequest, NextApiResponse } from "next";
import { requireSuperUser, getPageIdForUser } from "@/lib/middleware";
import { getAnalytics } from "@/lib/analytics";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!requireSuperUser(req)) {
    return res.status(401).json({ error: "No autorizado" });
  }

  const userId = Number(req.query.userId);
  if (!Number.isInteger(userId)) {
    return res.status(400).json({ error: "userId requerido" });
  }

  const pageId = getPageIdForUser(userId);
  if (!pageId) {
    return res.status(404).json({ error: "Usuario sin página" });
  }

  return res.status(200).json(getAnalytics(pageId));
}
