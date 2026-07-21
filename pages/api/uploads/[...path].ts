import type { NextApiRequest, NextApiResponse } from "next";
import path from "node:path";
import fs from "node:fs";

const uploadDir = path.join(process.cwd(), "public", "uploads");

const CONTENT_TYPES: Record<string, string> = {
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.setHeader("Allow", "GET, HEAD");
    return res.status(405).end();
  }

  const segments = req.query.path;
  const parts = Array.isArray(segments) ? segments : [segments ?? ""];

  const filePath = path.join(uploadDir, ...parts);
  if (!filePath.startsWith(uploadDir + path.sep)) {
    return res.status(400).end();
  }

  let stat;
  try {
    stat = fs.statSync(filePath);
  } catch {
    return res.status(404).end();
  }
  if (!stat.isFile()) {
    return res.status(404).end();
  }

  const contentType = CONTENT_TYPES[path.extname(filePath).toLowerCase()] ?? "application/octet-stream";
  res.setHeader("Content-Type", contentType);
  res.setHeader("Content-Length", stat.size);
  // filenames are random UUIDs — same URL always means same bytes, cache forever
  res.setHeader("Cache-Control", "public, max-age=31536000, immutable");

  if (req.method === "HEAD") return res.status(200).end();

  fs.createReadStream(filePath).pipe(res);
}
