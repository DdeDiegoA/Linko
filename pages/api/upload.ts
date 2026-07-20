import type { NextApiRequest, NextApiResponse } from "next";
import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";
import { getAuthUser } from "@/lib/middleware";

export const config = { api: { bodyParser: false } };

const ALLOWED_MIME: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

const uploadDir = path.join(process.cwd(), "public", "uploads");
fs.mkdirSync(uploadDir, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, _file, cb) => {
      // username set on req by handler before multer runs; sanitized to folder-safe chars
      const username = (req as unknown as { _username?: string })._username || "_shared";
      const dir = path.join(uploadDir, username);
      fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (_req, file, cb) => {
      cb(null, `${crypto.randomUUID()}${ALLOWED_MIME[file.mimetype] ?? ""}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    cb(null, Boolean(ALLOWED_MIME[file.mimetype]));
  },
});

function runMiddleware(
  req: NextApiRequest,
  res: NextApiResponse,
  fn: (req: NextApiRequest, res: NextApiResponse, cb: (result: unknown) => void) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    fn(req, res, (result: unknown) => {
      if (result instanceof Error) return reject(result);
      resolve();
    });
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const authUser = getAuthUser(req);
  if (!authUser) {
    return res.status(401).json({ error: "No autenticado" });
  }

  // folder-safe username for per-user upload dir (registration already restricts to [a-z0-9_-])
  const safeUsername = authUser.username.replace(/[^a-z0-9_-]/gi, "").toLowerCase() || "_shared";
  (req as NextApiRequest & { _username?: string })._username = safeUsername;

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await runMiddleware(req, res, upload.single("file") as any);
  } catch {
    return res.status(400).json({ error: "Error al subir archivo" });
  }

  const file = (req as NextApiRequest & { file?: Express.Multer.File }).file;
  if (!file) {
    return res.status(400).json({ error: "Archivo inválido (jpg, png, webp, máx 5MB)" });
  }

  return res.status(200).json({ path: `/uploads/${safeUsername}/${file.filename}` });
}
