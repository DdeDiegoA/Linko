import type { NextApiRequest, NextApiResponse } from "next";
import { clearAuthCookie } from "@/lib/middleware";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }
  clearAuthCookie(res);
  return res.status(204).end();
}
