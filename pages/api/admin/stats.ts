import type { NextApiRequest, NextApiResponse } from "next";
import db from "@/lib/db";
import { requireSuperUser } from "@/lib/middleware";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!requireSuperUser(req)) {
    return res.status(401).json({ error: "No autorizado" });
  }

  const count = (table: string) =>
    (db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get() as { n: number }).n;

  return res.status(200).json({
    users: count("users"),
    pages: count("pages"),
    links: count("links"),
    socials: count("social_links"),
    visits: count("visits"),
    clicks: count("clicks"),
  });
}