import type { NextApiRequest, NextApiResponse } from "next";
import { getAuthUser, getPageIdForUser } from "@/lib/middleware";
import { getAnalytics } from "@/lib/analytics";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const authUser = getAuthUser(req);
  if (!authUser) return res.status(401).json({ error: "No autenticado" });

  const pageId = getPageIdForUser(authUser.userId);
  if (!pageId) return res.status(404).json({ error: "Página no encontrada" });

  return res.status(200).json(getAnalytics(pageId));
}
