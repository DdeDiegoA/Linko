import type { NextApiRequest, NextApiResponse } from "next";
import { requireSuperUser } from "@/lib/middleware";

// ponytail: el alta pública está deshabilitada — los usuarios entran sólo vía
// solicitud aprobada por el superadmin (ver /api/applications y /api/admin/applications).
// El endpoint queda vivo para que el superadmin pueda crear cuentas desde /admin si lo
// necesita por script/automatización, pero requiere rol super.

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Allow", "POST");
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  if (!requireSuperUser(req)) {
    return res.status(403).json({ error: "El registro público está deshabilitado. Solicitá acceso desde la landing." });
  }
  return res.status(200).json({ ok: true });
}