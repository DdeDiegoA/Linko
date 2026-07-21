import crypto from "node:crypto";
import db from "@/lib/db";

export function trackVisit(pageId: number, ip: string): void {
  const ipHash = crypto.createHash("sha256").update(ip).digest("hex");
  db.prepare("INSERT INTO visits (page_id, ip_hash) VALUES (?, ?)").run(pageId, ipHash);
}

export function trackClick(linkId: number): void {
  db.prepare("INSERT INTO clicks (link_id) VALUES (?)").run(linkId);
}

export interface Analytics {
  visits_7d: number;
  visits_30d: number;
  clicks_30d: number;
  click_rate: number;
  top_links: { id: number; text: string; clicks: number }[];
}

export function getAnalytics(pageId: number): Analytics {
  const visits_7d = (
    db
      .prepare(
        "SELECT COUNT(*) as n FROM visits WHERE page_id = ? AND timestamp >= datetime('now', '-7 days')"
      )
      .get(pageId) as { n: number }
  ).n;

  const visits_30d = (
    db
      .prepare(
        "SELECT COUNT(*) as n FROM visits WHERE page_id = ? AND timestamp >= datetime('now', '-30 days')"
      )
      .get(pageId) as { n: number }
  ).n;

  const clicks_30d = (
    db
      .prepare(
        `SELECT COUNT(*) as n FROM clicks
         JOIN links ON links.id = clicks.link_id
         WHERE links.page_id = ? AND clicks.timestamp >= datetime('now', '-30 days')`
      )
      .get(pageId) as { n: number }
  ).n;

  const click_rate = visits_30d > 0 ? (clicks_30d / visits_30d) * 100 : 0;

  const top_links = db
    .prepare(
      `SELECT links.id, links.text, COUNT(clicks.id) AS clicks
       FROM links LEFT JOIN clicks ON clicks.link_id = links.id
       WHERE links.page_id = ?
       GROUP BY links.id, links.text
       ORDER BY clicks DESC, links.position ASC`
    )
    .all(pageId) as { id: number; text: string; clicks: number }[];

  return { visits_7d, visits_30d, clicks_30d, click_rate, top_links };
}
