# Spotify Readme Widget

Widget SVG dinâmico mostrando sua música atual ou favorita do Spotify, perfeito para README do GitHub.

## ✨ Funcionalidades

- 🎵 **Now Playing**: Exibe a música que você está ouvindo em tempo real
- 📌 **Track Fixa**: Fixe uma música específica para exibir sempre
- 🎨 **Temas**: Dark e Light
- 🔒 **Privacidade**: Controle total sobre dados públicos
- 👥 **Multi-usuário**: Sistema completo de RBAC (Role-Based Access Control)
- 🔐 **Múltiplos Providers**: Autenticação por senha, GitHub OAuth ou modo público

## 🚀 Quick Start

### Requisitos

- Node.js 18+
- pnpm
- Conta Spotify Developer (para modo Now Playing)

### Instalação

```bash
# Clone o repositório
git clone https://github.com/your-username/spotify-readme.git
cd spotify-readme

# Configure variáveis de ambiente na raiz
cp .env.example .env

# Rode o script de setup (instala deps, gera SESSION_SECRET, migra DB)
bash ./script.sh

# Ou manualmente:
pnpm install
cd backend && pnpm exec prisma migrate dev

# Inicie backend + admin simultaneamente
pnpm dev
```

### Configuração Básica

Edite `.env` na raiz do projeto:

```env
# Autenticação (escolha um ou mais)
ENABLE_PASSWORD_AUTH=true
ENABLE_GITHUB_AUTH=false
ENABLE_NONE_AUTH=false

# Admin inicial (para password auth)
ADMIN_USERNAME=admin
ADMIN_PASSWORD=senha_forte_aqui

# Spotify (opcional para Now Playing)
SPOTIFY_CLIENT_ID=seu_client_id
SPOTIFY_CLIENT_SECRET=seu_client_secret
SPOTIFY_REDIRECT_URI=http://127.0.0.1:3000/auth/spotify/callback

# GitHub OAuth (se ENABLE_GITHUB_AUTH=true)
GITHUB_CLIENT_ID=seu_github_client_id
GITHUB_CLIENT_SECRET=seu_github_client_secret
GITHUB_CALLBACK_URL=http://127.0.0.1:3000/auth/github/callback
```

## 🔐 Sistema de Autenticação e RBAC

### Providers de Autenticação

O sistema suporta **múltiplos providers simultâneos**:

#### 1. Password Authentication

```env
ENABLE_PASSWORD_AUTH=true
ADMIN_USERNAME=admin
ADMIN_PASSWORD=sua_senha
```

- Permite múltiplas contas locais com senhas hasheadas (bcrypt)
- Credenciais armazenadas no banco de dados
- Admin inicial configurado via env vars (fallback)

#### 2. GitHub OAuth

```env
ENABLE_GITHUB_AUTH=true
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
GITHUB_CALLBACK_URL=http://127.0.0.1:3000/auth/github/callback
```

- Autenticação via GitHub OAuth
- Cria conta automaticamente no primeiro login (respeitando política de registro)

#### 3. None Mode (Public)

```env
ENABLE_NONE_AUTH=true
```

- Modo totalmente público, sem autenticação
- Útil para uso pessoal ou demos

### Roles e Permissões

O sistema tem 3 roles:

| Role | Permissões |
| --- | --- |
| `admin` | Acesso total: gestão de usuários, config global |
| `user` | Editar própria config do widget e credenciais |
| `viewer` | Apenas visualizar (sem edição) |

### Políticas de Registro

Controle quem pode criar conta:

```env
REGISTRATION_POLICY=open  # ou: github_whitelist, invite_only, closed
```

#### Opções

- **`open`**: Qualquer pessoa pode criar conta
- **`github_whitelist`**: Apenas usuários GitHub na whitelist
- **`invite_only`**: Apenas via convite de admin (futuro)
- **`closed`**: Nenhum registro novo permitido

#### GitHub Whitelist

**Configuração via `.env` (estática):**

Para `REGISTRATION_POLICY=github_whitelist`:

```env
GITHUB_WHITELIST=user1,user2,user3
```

Apenas esses usernames do GitHub poderão criar conta. Essa lista é importada automaticamente para o banco de dados na primeira execução.

**Gerenciamento dinâmico (via Admin Panel):**

Admins podem gerenciar a whitelist dinamicamente através do painel de administração:

- **Adicionar usuários**: Um por um ou em lote (até 100 por vez)
- **Validar no GitHub**: Opção para verificar se o username existe antes de adicionar
- **Rastrear origem**: Identifica se foi adicionado manualmente ou importado do `.env`
- **Remover usuários**: Soft-delete com auditoria (quem removeu e quando)
- **Buscar**: Campo de pesquisa para localizar usuários rapidamente

**Como funciona:**

1. A whitelist do banco de dados **complementa** (não substitui) a do `.env`
2. Usuários na whitelist `.env` são importados automaticamente na primeira execução
3. Campo "Adicionado por" = NULL significa importação do `.env` ou sistema
4. Remover um usuário não deleta do banco (apenas marca como removido para auditoria)
5. É possível reativar usuários removidos adicionando novamente

### Admin Users

Defina admins via env:

```env
ADMIN_USERS=admin,johndoe,janedoe
```

- Usuários nesta lista sempre recebem role `admin`
- Funciona para autenticação por senha e GitHub
- Útil para promover admins sem acessar o banco
- Admins podem usar o painel para gerenciar a whitelist GitHub

### Permitir Cadastro por Senha

```env
ALLOW_PASSWORD_SIGNUP=true  # Permite criar contas locais
```

Se `false`, apenas o admin inicial do env pode logar (mais restritivo).

## 🎛 Painel Administrativo

Acesse `/admin` após autenticar-se.

### Aba "Configuração"

- **Modo**: Now Playing ou Track Fixa
- **Tema**: Dark ou Light
- **Track ID**: ID ou URL do Spotify para modo fixo
- **Privacidade**: Toggle para expor/ocultar JSON público
- **Spotify API**: Configure credenciais pessoais
- **Now Playing**: Conecte sua conta Spotify

### Aba "Usuários" (admin only)

Gerenciamento completo de usuários:

- **Listar usuários**: Veja todos os usuários, providers, roles e data de criação
- **Criar usuário**: Adicione novo usuário com senha (escolha role: admin/user/viewer)
- **Editar role**: Altere permissões de qualquer usuário
- **Redefinir senha**: Altere a senha de usuários locais (provider=password)

Apenas admins veem esta aba.

## 🛠 API Endpoints

### Públicos

- `GET /widget?user=username` - SVG do widget (tema via query param opcional)
- `GET /user/api/:username` - JSON com track atual (respeita privacidade)

### Autenticação

- `POST /auth/login` - Login com username/password
- `POST /auth/logout` - Logout
- `GET /auth/github` - Inicia OAuth GitHub
- `GET /auth/github/callback` - Callback GitHub OAuth
- `GET /auth/spotify` - Inicia OAuth Spotify (Now Playing)
- `GET /auth/spotify/callback` - Callback Spotify OAuth
- `POST /auth/spotify/disconnect` - Desconecta conta Spotify
- `GET /api/auth-config` - Providers e política de registro

### Autenticados

- `GET /api/me` - Info do usuário logado (inclui role)
- `GET /api/config` - Config do widget do usuário
- `POST /api/config` - Atualiza config do widget
- `GET /api/spotify-config` - Credenciais Spotify do usuário
- `POST /api/spotify-config` - Atualiza credenciais Spotify
- `DELETE /api/spotify-config` - Remove credenciais Spotify
- `GET /api/spotify/status` - Status da conexão Spotify
- `GET /api/spotify/now-playing` - Track atual (requer OAuth)

### Admin Only

- `GET /api/admin/users` - Lista todos os usuários
- `POST /api/admin/users` - Cria novo usuário (password)
- `PUT /api/admin/users/:username/role` - Atualiza role
- `PUT /api/admin/users/:username/password` - Redefine senha

## 🎨 Uso do Widget

### Markdown (GitHub README)

```markdown
![Spotify](https://seu-dominio.com/widget?user=seu_username)
```

### HTML

```html
<img src="https://seu-dominio.com/widget?user=seu_username" alt="Spotify Widget" />
```

### Com tema personalizado

```markdown
![Spotify](https://seu-dominio.com/widget?user=seu_username&theme=light)
```

## 🔒 Privacidade

O toggle **"Expor dados no JSON público"** na aba Flags controla:

- **Ligado**: Endpoint `/user/api/:username` retorna dados da track
- **Desligado**: Endpoint retorna `204 No Content` (oculta tudo)

Útil quando você quer pausar a exibição sem desconfigurar o widget.

## 📦 Estrutura do Projeto

```text
spotify-readme/
├── .env              # Variáveis de ambiente (raiz)
├── .env.example      # Template de variáveis
├── script.sh         # Setup automático
├── docker-compose.yml # Docker setup
├── backend/          # Servidor Fastify + Prisma
│   ├── src/
│   │   ├── routes/   # Endpoints
│   │   ├── lib/      # DB, config, auth helpers
│   │   └── plugins/  # Auth plugin
│   ├── prisma/       # Schema e migrations
│   └── data/         # SQLite (gitignored)
├── admin/            # Frontend React + Vite
│   ├── .env.local    # Variáveis frontend (VITE_*)
│   └── src/
│       ├── components/  # UsersPanel, etc
│       └── App.tsx      # Main UI
└── TODO.md           # Roadmap
```

## 🧪 Desenvolvimento

### Backend

```bash
cd backend

# Dev mode com hot reload
pnpm dev

# Compilar
pnpm build

# Prisma Studio (GUI do banco)
pnpm exec prisma studio
```

### Frontend

```bash
cd admin

# Dev server (proxy para backend em 3000)
pnpm dev

# Build produção
pnpm build
```

## ⚙️ Setup Automático

Para acelerar a configuração local, use o script de setup na raiz:

```bash
# macOS/Linux ou Windows com Git Bash/WSL
bash ./script.sh

# Em seguida, inicie ambos os serviços
pnpm dev
```

O script:

- Cria `.env` na raiz (a partir de `.env.example` ou com defaults) e gera `SESSION_SECRET` automaticamente.
- Cria `admin/.env.local` com `VITE_BACKEND_URL=http://127.0.0.1:3000`.
- Executa `pnpm install` na raiz.
- Roda `prisma migrate dev` no backend.

**Nota:** O arquivo `.env` fica na **raiz do projeto**, não dentro de `backend/`. O backend lê automaticamente o `.env` da raiz.

## 🐳 Docker Quickstart

Se encontrar erros de build nativo (`better-sqlite3`) ou preferir isolar tudo em um container, use Docker:

### Preparação

1. Copie o arquivo de exemplo de ambiente:

```bash
cp .env.example .env
```

1. Edite `.env` com suas variáveis (mínimo recomendado para desenvolvimento):

```env
SESSION_SECRET=meu_secret_aleatorio_32_chars
ENABLE_PASSWORD_AUTH=true
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin12345
ENABLE_GITHUB_AUTH=false
APP_URL=http://localhost:3000
ADMIN_URL=http://localhost:3000/admin
ENABLE_HELMET=true
HELMET_DISABLE_HSTS=true
```

### Build e execução

```bash
# Build da imagem e start do container em background
docker compose up --build -d

# Ver logs
docker compose logs -f app

# Parar
docker compose down

# Parar e remover volumes
docker compose down -v
```

### Notas

- O compose mapeia `./data:/app/data` para persistir o banco SQLite.
- A imagem é compilada com suporte a multi-arquitetura (amd64 e arm64).
- O healthcheck verifica a API a cada 30s.
- Variáveis com `:-` têm valores padrão (não precisam estar no `.env`).

## 📝 Variáveis de Ambiente Completas

```env
# === Auth Providers ===
ENABLE_PASSWORD_AUTH=true
ENABLE_GITHUB_AUTH=false
ENABLE_NONE_AUTH=false

# === Registration Policy ===
REGISTRATION_POLICY=open  # open | github_whitelist | invite_only | closed
ALLOW_PASSWORD_SIGNUP=true

# === Admin Config ===
ADMIN_USERS=admin,user1,user2
ADMIN_USERNAME=admin
ADMIN_PASSWORD=senha_forte

# === GitHub OAuth ===
GITHUB_CLIENT_ID=seu_github_client_id
GITHUB_CLIENT_SECRET=seu_github_secret
GITHUB_CALLBACK_URL=http://127.0.0.1:3000/auth/github/callback
GITHUB_WHITELIST=user1,user2  # Para REGISTRATION_POLICY=github_whitelist

# === Spotify (Global Fallback) ===
SPOTIFY_CLIENT_ID=seu_spotify_client_id
SPOTIFY_CLIENT_SECRET=seu_spotify_secret
SPOTIFY_REDIRECT_URI=http://127.0.0.1:3000/auth/spotify/callback

# === Session ===
SESSION_SECRET=chave_aleatoria_segura_aqui

# === Server ===
PORT=3000
HOST=127.0.0.1

# === Security Headers ===
# Ative Helmet em produção para enviar headers de segurança.
# Se você usa um reverse proxy (Nginx Proxy Manager/Cloudflare) que já envia HSTS,
# desative apenas o HSTS do app para evitar duplicações.
ENABLE_HELMET=true            
HELMET_DISABLE_HSTS=true      
```

## 🤝 Contribuindo

Contribuições são bem-vindas! Abra issues ou PRs.

## 📄 Licença

MIT License - veja [LICENSE](LICENSE) para detalhes.

## 🙏 Créditos

- Inspirado em diversos projetos de widgets Spotify para GitHub
- Construído com Fastify, Prisma, React e Vite
