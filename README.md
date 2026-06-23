# UDoc


> O UDoc é uma plataforma interna de documentação e onboarding. Reúne editor de
> texto rico (TipTap) para criação colaborativa de documentos, quadros Kanban,
> chat em tempo real (WebSocket/STOMP), dashboards (Recharts) e exportação de
> documentos para PDF/Excel. Backend em Spring Boot + PostgreSQL, frontend React.

**Estrutura do repositório** (ajuste se for diferente):
```
UDOC-Onboarding/
├── backend/UDoc/      → Spring Boot + docker-compose.yml + .env.example
└── frontEnd/UDoc/     → React + Vite
```

## 🎯 Backend (Spring Boot)

### 🔐 Autenticação & Segurança
- JWT com roles obrigatória de senha no primeiro acesso
- Permissões granulares por módulo e ação

### 🏢 Organização Empresarial
- CRUD Logo | Código de matriz | Busca por CNPJ (com/sem máscara)
- Funcionários com vínculo à empresa
- Tipos: INTERNO / EXTERNO
- Usuários CRUD | Convite por e-mail | Reset de senha obrigatório

### 📄 Conteúdo
- Cards / Documentos CRUD
- Clone Público | Exportação PDF
- Trilhas CRUD | Kanban
- Vínculo com cards | Clone | Certificação

### 📚 Treinamentos Vendas
- CRUD Catálogo | Calendário | Gravações
- Matrículas | Catálogo + progresso

### 💬 Comunicação
- Chat em tempo real (WebSocket / STOMP)
- ISM → cliente + IA + NPS
- Notificações em tempo real (contador de não lidas)

### 🤖 IA Multi-provedor
**Suporte:** Groq, Gemini, OpenAI, DeepSeek, Claude, Ollama, Owen

---

## 📊 Níveis de Acesso
- **Usuário** / **Empresa** / **Global**

## 💡 Usos
- Suporte Análise de dúvidas
- Sugestão de conteúdo
- 🧠 Inteligência Classificação de dúvidas via IA | Ranking de tópicos | Sugestão de cards
- 🎮 Gamificação XP por ações | Ranking de usuários | Progressão por engajamento
- 🎯 Avaliação Quiz por card (pontuação) | NPS (cards, trilhas, atendimento)
- 📋 Auditoria Log de ações do sistema

---

## 🎨 Frontend (React + Mantine)
- UI AppShell com sidebar retrátil | Dark / Light mode | Responsivo
- 🎭 Editor (Tiptap) | Badges | Callouts | Imagens redimensionáveis | Vídeos | Código com highlight
- 💬 Chat global flutuante (tempo real)
- 📋 Kanban de trilhas (drag-and-drop)
- 🎫 Certificados customizáveis

---

## 🎯 Objetivo
**Documentar, padronizar, mensurar e universalizar o conhecimento de clientes internos e externos.**
Termômetro corporativo que diagnostica gaps de conhecimento, permite correlacionar churn x conhecimento, monitora engajamento e acompanha a jornada de aprendizado em tempo real.
Plataforma de onboarding e treinamento (LMS) com :
- IA integrada
- Gamificação
- Conteúdo em trilhas
- Comunicação em tempo real
- Escalabilidade corporativa
# Deploy

## 1. Backend

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
SENDGRID_API_KEY=          # opcional — sem isso, e-mails não são enviados
MAIL_FROM_ADDRESS=         # opcional
AI_KEY=                    # opcional (Groq) — sem isso, recursos de IA ficam off
```

```bash
docker compose up -d                          # postgres:5432 + backend:8081
docker compose --profile ollama up -d         # opcional, IA local (16GB+ RAM)
curl localhost:8081/api/health                # ou /actuator/health
```

- `ddl-auto`: `update` no 1º deploy (cria as tabelas), depois `validate`.
- Não publicar 8081/5432 para a internet.
- API documentada (SpringDoc): `http://localhost:8081/swagger-ui.html` — confirme se está sob `/api`.

## 2. Frontend

```bash
cd UDOC-Onboarding/frontEnd/UDoc
echo "VITE_API_URL=https://udoc.suaempresa.com/api" > .env.production   # build-time, rebuildar se mudar
npm install && npm run build                                            # -> dist/
```

Publicar o `dist/` (mesma máquina do back, servido pelo Nginx):
```bash
sudo mkdir -p /var/www/udoc
sudo cp -r dist /var/www/udoc/dist
```

## 3. Nginx (front + proxy /api + HTTPS)

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

Front e `/api` no mesmo domínio evitam CORS; domínio separado exige `CORS_ORIGIN` idêntico à URL do front.

## 4. Primeiro acesso

> **Primeiro acesso:** como entrar pela primeira vez com o banco recém-criado.
> Ex.: usuário admin seedado (login/senha padrão), endpoint de cadastro aberto,
> ou comando/script para criar o primeiro usuário. Sem isso o sistema sobe mas
> ninguém consegue logar.

---

# Stack Tecnológica

## Linguagens
| Linguagem  | Versão            |
|------------|-------------------|
| Java       | 21 (LTS)          |
| TypeScript | 5.8.3             |
| SQL        | PostgreSQL dialect|

## Backend
| Tecnologia          | Versão    | Função                              |
|---------------------|-----------|-------------------------------------|
| Spring Boot         | 3.5.14    | Framework principal                 |
| Spring Web          | via Boot  | API REST                            |
| Spring Data JPA     | via Boot  | ORM / acesso ao banco               |
| Spring Security     | via Boot  | Autenticação e autorização          |
| Spring Validation   | via Boot  | Validação de DTOs                   |
| Spring Mail         | via Boot  | Envio de e-mails                    |
| Spring WebSocket    | via Boot  | Chat em tempo real (STOMP)          |
| Spring AOP          | via Boot  | Interceptação para auditoria        |
| JJWT                | 0.12.6    | Geração e validação de tokens JWT   |
| SpringDoc OpenAPI   | 2.8.9     | Documentação Swagger automática     |
| Maven               | 3.9+      | Build e gerenciamento de dependências |

## Banco de Dados
| Tecnologia | Versão          | Função                          |
|------------|-----------------|---------------------------------|
| PostgreSQL | 16              | Banco relacional principal      |
| Hibernate  | via Spring Boot | ORM (mapeamento objeto-relacional) |

## Frontend — Core
| Tecnologia       | Versão  | Função              |
|------------------|---------|---------------------|
| React            | 18.3.1  | Framework de UI     |
| Vite             | 5.4.19  | Build tool e dev server |
| React Router DOM | 6.30.1  | Roteamento SPA      |
| Axios            | 1.16.0  | Requisições HTTP    |

## Frontend — UI
| Tecnologia            | Versão | Função                                   |
|-----------------------|--------|------------------------------------------|
| Mantine Core          | 8.3.6  | Componentes de UI (AppShell, Table, Modal, etc.) |
| Mantine Hooks         | 8.3.6  | useDisclosure, useLocalStorage, useMediaQuery, etc. |
| Mantine Dates         | 8.3.6  | Calendário e inputs de data              |
| Mantine Notifications | 8.3.6  | Toasts e notificações                    |
| Tabler Icons React    | 3.35.0 | Biblioteca de ícones SVG                 |
| React Icons           | 5.6.0  | Ícones complementares                    |

## Frontend — Editor de Texto Rico (TipTap)
| Pacote                                  | Versão  | Função                              |
|-----------------------------------------|---------|-------------------------------------|
| @tiptap/react                           | 3.23.4  | Core do editor                      |
| @tiptap/starter-kit                     | 3.23.4  | Extensões básicas (bold, italic, listas, etc.) |
| @tiptap/extension-image                 | 3.23.4  | Inserção de imagens                 |
| @tiptap/extension-link                  | 3.23.4  | Links clicáveis                     |
| @tiptap/extension-code-block-lowlight   | 3.23.4  | Blocos de código com syntax highlight |
| @tiptap/extension-youtube               | 3.23.4  | Embed de vídeos YouTube             |
| @tiptap/extension-text-align            | 3.23.4  | Alinhamento de texto                |
| @tiptap/extension-underline             | 3.23.4  | Sublinhado                          |
| @tiptap/extension-color                 | 3.26.0  | Cor de texto                        |
| @tiptap/extension-text-style            | 3.26.0  | Estilos inline                      |
| @tiptap/extension-placeholder           | 3.23.4  | Placeholder no editor               |
| @tiptap/extension-horizontal-rule       | 3.23.4  | Linha horizontal                    |
| tiptap-extension-resizable-image        | 2.1.0   | Imagens redimensionáveis            |
| lowlight                                | 3.3.0   | Syntax highlighting nos blocos de código |

## Frontend — Funcionalidades específicas
| Tecnologia        | Versão  | Função                            |
|-------------------|---------|-----------------------------------|
| @stomp/stompjs    | 7.3.0   | WebSocket/STOMP (chat em tempo real) |
| sockjs-client     | 1.6.1   | Fallback WebSocket                |
| Recharts          | 3.8.1   | Gráficos e dashboards             |
| @dnd-kit/core     | 6.3.1   | Drag-and-drop                     |
| @dnd-kit/sortable | 10.0.0  | Listas ordenáveis (Kanban)        |
| dayjs             | 1.11.21 | Manipulação de datas              |
| html2pdf.js       | 0.14.0  | Exportação de documentos para PDF |
| xlsx              | 0.18.5  | Exportação para Excel             |
| react-colorful    | 5.7.0   | Seletor de cor                    |
| markerjs2         | 2.32.7  | Anotação sobre imagens            |
| tui-image-editor  | 3.15.3  | Editor de imagens                 |

## Infraestrutura
| Tecnologia     | Versão  | Função                              |
|----------------|---------|-------------------------------------|
| Docker         | 24+     | Containerização                     |
| Docker Compose | V2      | Orquestração local (backend + banco)|
| Git            | qualquer| Versionamento                       |

---

# Setup 

## Obrigatório
```
JDK 21          → https://adoptium.net  (Temurin 21 LTS)
Maven 3.9+      → https://maven.apache.org/download.cgi
Node.js 20+     → https://nodejs.org (versão LTS)
Docker Desktop  → https://docs.docker.com/get-docker
Git             → https://git-scm.com
```

## IDEs recomendadas
- **IntelliJ IDEA** (Community/Ultimate) → backend Java
- **VS Code** → frontend TypeScript
  - Extensões úteis: ESLint, Prettier, Volar (ou ES7 React Snippets)

## Opcional mas útil
- **DBeaver / pgAdmin** → GUI para o PostgreSQL
- **Postman / Insomnia** → testar endpoints da API REST

## Primeiros comandos após clonar
Backend:
```bash
docker compose up -d        # sobe banco + backend
```
Frontend:
```bash
npm install
npm run dev                 # http://localhost:5173
```
