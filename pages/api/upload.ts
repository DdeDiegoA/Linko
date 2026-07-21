import type { NextApiRequest, NextApiResponse } from "next";
import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";
import sharp from "sharp";
import { requireRegularUser } from "@/lib/middleware";

export const config = { api: { bodyParser: false } };

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);

const uploadDir = path.join(process.cwd(), "public", "uploads");
fs.mkdirSync(uploadDir, { recursive: true });

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    cb(null, ALLOWED_MIME.has(file.mimetype));
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

  const authUser = requireRegularUser(req);
  if (!authUser) {
    return res.status(401).json({ error: "No autenticado" });
  }

  // folder-safe username for per-user upload dir (registration already restricts to [a-z0-9_-])
  const safeUsername = authUser.username.replace(/[^a-z0-9_-]/gi, "").toLowerCase() || "_shared";

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

  const dir = path.join(uploadDir, safeUsername);
  fs.mkdirSync(dir, { recursive: true });
  const filename = `${crypto.randomUUID()}.webp`;

  try {
    await sharp(file.buffer)
      // link-in-bio images never need to render larger than this; resizing is the
      // single biggest compression win, quality tuning alone leaves it on the table
      .resize({ width: 2048, height: 2048, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82 }) // visually lossless in practice, ~25-35% smaller than q90+
      .toFile(path.join(dir, filename));
  } catch {
    return res.status(400).json({ error: "Error al procesar imagen" });
  }

  return res.status(200).json({ path: `/uploads/${safeUsername}/${filename}` });
}
