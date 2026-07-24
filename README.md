# Linko

Link-in-bio minimalista para creators, freelancers y comunidades. Tu link, sin marca ajena.

## Stack

- **Next.js 16** (Pages Router) + **React 19**
- **TypeScript** + **Tailwind CSS**
- **better-sqlite3** (SQLite local)
- **JWT** (auth) + **bcryptjs** (hash de passwords)
- **motion** (animaciones) + **@tabler/icons-react**
- **Vitest** (tests)

## Estructura

```
pages/
  index.tsx          Landing
  login.tsx register.tsx
  dashboard/         Editor de tu página (links, redes, estilo, ícono)
  u/[username]/      Página pública de cada usuario
  api/               auth, links, socials, page, upload, admin
components/          LinkEditor, SocialEditor, StyleEditor, IconPicker, PublicPage, animate-ui/
lib/                 auth, db, middleware, utils, icons
types/               Tipados compartidos
```

## Ponerlo en marcha

```bash
npm install
cp .env.example .env.local   # completar JWT_SECRET y LINKO_SUPER_*
npm run dev                  # http://localhost:3000
```

La DB (`data/linko.db`) se crea sola en el primer arranque. `public/uploads/` guarda avatares y assets.

## Scripts

| Script | Qué hace |
|--------|----------|
| `npm run dev`  | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm start`    | Servir el build |
| `npm run lint` | ESLint |
| `npm test`     | Vitest (single run) |

## Variables de entorno

| Var | Obligatoria | Default | Descripción |
|-----|:-----------:|---------|-------------|
| `JWT_SECRET` | ✅ | — | Secreto para firmar tokens de sesión |
| `LINKO_SUPER_EMAIL` | ⚠️ | `admin@linko.local` | Email del admin inicial |
| `LINKO_SUPER_USERNAME` | ⚠️ | `admin` | Username del admin inicial |
| `LINKO_SUPER_PASSWORD` | ⚠️ | `linko-admin-2024` | Password del admin inicial — **cambiar en producción** |

> ⚠️ Si no se setean, el super admin usa las credenciales hardcodeadas arriba. En producción, **siempre** setear `LINKO_SUPER_PASSWORD`.

## Docker

```bash
docker build -t linko .
docker run -p 3000:3000 -v $(pwd)/data:/app/data linko
```

Requiere `next.config.ts` con `output: 'standalone'` y `JWT_SECRET` inyectado como env.

## Despliegue en Dokku (Mac Mini VPS)

Subdominio: **linko.decodgo.com**. El VPS usa Cloudflare Tunnel → NGINX → Dokku. Como CF maneja TLS, hay que evitar el redirect loop que genera Dokku.

### Setup inicial (VPS)

```bash
ssh macmini-remote

# 1. Crear app
dokku apps:create linko

# 2. Storage persistente (SQLite + uploads)
sudo mkdir -p /var/lib/dokku/data/storage/linko/{data,uploads}
sudo chown -R dokku:dokku /var/lib/dokku/data/storage/linko
dokku storage:mount linko /var/lib/dokku/data/storage/linko/data:/app/data
dokku storage:mount linko /var/lib/dokku/data/storage/linko/uploads:/app/public/uploads

# 3. Variables de entorno
dokku config:set linko PORT=3000 NODE_ENV=production
dokku config:set linko JWT_SECRET="$(openssl rand -base64 32)"
dokku config:set linko LINKO_SUPER_EMAIL="admin@linko.app"
dokku config:set linko LINKO_SUPER_PASSWORD="$(openssl rand -base64 16)"

# 4. Dominio
dokku domains:add linko linko.decodgo.com

# 5. Límite de tamaño de subida (nginx default es 1MB, la app permite 5MB)
dokku nginx:set linko client-max-body-size 10m
```

### Deploy inicial

```bash
git remote add dokku dokku@decodgo.com:linko
git push dokku main
```

### Post-deploy: NGINX fix + hook

```bash
# Fix inmediato (evitar redirect loop con CF Tunnel)
sudo sed -i 's|return 301 https.*|proxy_pass http://linko-3000;|' /home/dokku/linko/nginx.conf
sudo nginx -s reload

# Hook para que persista en cada redeploy
sudo tee /home/dokku/linko/hooks/post-deploy > /dev/null << 'HOOK'
#!/bin/bash
set -e
APP="linko"
NGINX_CONF="/home/dokku/$APP/nginx.conf"
if grep -q "return 301" "$NGINX_CONF"; then
  sudo sed -i 's|return 301 https.*|proxy_pass http://'"$APP"'-3000;|' "$NGINX_CONF"
  sudo nginx -s reload
  echo "[post-deploy] NGINX fix applied for $APP"
fi
HOOK
sudo chmod +x /home/dokku/linko/hooks/post-deploy
```

### CF Tunnel

Agregar en `/etc/cloudflared/config.yml` (antes del catch-all):

```yaml
  - hostname: linko.decodgo.com
    service: http://127.0.0.1:80
    originRequest:
      httpHostHeader: linko.decodgo.com
```

```bash
sudo systemctl restart cloudflared
```

### Verificación

```bash
curl -sI -H "Host: linko.decodgo.com" http://127.0.0.1:80 | head -1
# HTTP/1.1 200 OK

curl -sI https://linko.decodgo.com | head -1
# HTTP/2 200
```

> Plan de deploy completo: `../deploy-linko-plan.md`

## Autor

Diego Arenas — [diegoarenas111@gmail.com](mailto:diegoarenas111@gmail.com)

## Estado

v0.1.0 — base funcional: registro/login, editor de página, página pública, panel admin. Dominio propio y analíticas detalladas en roadmap.
