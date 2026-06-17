# Deploy UDoc

## Backend

```bash
git clone https://github.com/guilhermediniz3/UDOC-Onboarding.git
cd UDOC-Onboarding/backend/UDoc
cp .env.example .env
```

`.env`:
```
DATABASE_URL=jdbc:postgresql://udoc-postgres:5432/udoc   # service name, não localhost
DATABASE_USERNAME=udoc
DATABASE_PASSWORD=
JWT_SECRET=                # openssl rand -base64 48
ENCRYPTION_KEY=            # openssl rand -hex 16  (32 chars exatos, obrigatório)
CORS_ORIGIN=https://udoc.suaempresa.com
APP_FRONTEND_URL=https://udoc.suaempresa.com
APP_BACKEND_URL=https://udoc.suaempresa.com/api
SENDGRID_API_KEY=          # opcional
MAIL_FROM_ADDRESS=         # opcional
AI_KEY=                    # opcional (Groq)
```

```bash
docker compose up -d                          # postgres:5432 + backend:8081
docker compose --profile ollama up -d         # opcional, IA local (16GB+ RAM)
curl localhost:8081/api/health                # ou /actuator/health
```

`ddl-auto`: `update` no 1º deploy, depois `validate`. Não publicar 8081/5432.

## Frontend

```bash
cd UDOC-Onboarding/frontEnd/UDoc
echo "VITE_API_URL=https://udoc.suaempresa.com/api" > .env.production   # build-time, rebuildar se mudar
npm install && npm run build                                            # -> dist/
```

## Nginx

```nginx
server {
    listen 443 ssl;
    server_name udoc.suaempresa.com;
    ssl_certificate     /etc/letsencrypt/live/udoc.suaempresa.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/udoc.suaempresa.com/privkey.pem;

    root /var/www/udoc/dist;
    index index.html;
    location / { try_files $uri $uri/ /index.html; }

    location /api/ {
        proxy_pass http://localhost:8081/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        client_max_body_size 500M;
    }
}
server { listen 80; server_name udoc.suaempresa.com; return 301 https://$host$request_uri; }
```

```bash
certbot --nginx -d udoc.suaempresa.com
```

Mesmo domínio para front e /api evita CORS; domínio separado exige `CORS_ORIGIN` idêntico à URL do front.
