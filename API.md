# API

Referência das rotas reais registradas no backend (`backend/src/routes/*.ts`). Todas fora da lista de "Público" exigem cookie de sessão (`session`), setado no login. Rotas de admin exigem `role: admin` além da sessão.

## Auth

| Método | Rota | Auth | Descrição |
| --- | --- | --- | --- |
| POST | `/auth/login` | — | Login por usuário/senha. Rate limit 10 req/5min, lockout após 5 falhas por IP+username |
| POST | `/auth/logout` | — | Limpa o cookie de sessão |
| GET | `/auth/github` | — | Inicia OAuth com GitHub, redireciona |
| GET | `/auth/github/callback` | — | Callback do OAuth, valida `state` (CSRF), cria sessão |
| GET | `/auth/spotify` | sessão | Inicia OAuth com Spotify (conecta a conta do usuário logado) |
| GET | `/auth/spotify/callback` | — | Callback do OAuth do Spotify |
| GET | `/api/me` | sessão | Retorna `username`/`role` da sessão atual |
| GET | `/api/auth-config` | — | Providers de login habilitados (pra montar a tela de login) |

## Config do widget

| Método | Rota | Auth | Descrição |
| --- | --- | --- | --- |
| GET | `/api/config` | sessão | Config do widget do usuário logado |
| POST | `/api/config` | sessão | Salva a config (valida `mode`/`theme`/`track_id` via Zod) |
| GET | `/api/widget` | sessão opcional | Rota legada equivalente a `/api/config` — o painel usa `/api/config`, não esta |
| PUT | `/api/widget` | sessão | Rota legada equivalente a `POST /api/config` |

## Spotify

| Método | Rota | Auth | Descrição |
| --- | --- | --- | --- |
| GET | `/api/spotify-config` | sessão | Client ID mascarado, se configurado |
| POST | `/api/spotify-config` | sessão | Salva Client ID/Secret do Spotify do usuário |
| DELETE | `/api/spotify-config` | sessão | Remove as credenciais |
| GET | `/api/spotify/now-playing` | sessão | Faixa tocando agora (com cache de 3s), fallback pra última tocada |
| GET | `/api/spotify/status` | sessão | Se a conta Spotify tá conectada |
| POST | `/api/spotify/disconnect` | sessão | Desconecta a conta Spotify |

## Admin

| Método | Rota | Auth | Descrição |
| --- | --- | --- | --- |
| GET | `/api/admin/users` | admin | Lista usuários |
| POST | `/api/admin/users` | admin | Cria usuário com senha |
| PUT | `/api/admin/users/:username/role` | admin | Muda a role de um usuário |
| PUT | `/api/admin/users/:username/password` | admin | Troca a senha de um usuário |
| GET | `/api/admin/whitelist` | admin | Lista a whitelist do GitHub |
| POST | `/api/admin/whitelist` | admin | Adiciona um username à whitelist |
| DELETE | `/api/admin/whitelist/:username` | admin | Remove (soft-delete) da whitelist |
| POST | `/api/admin/whitelist/batch` | admin | Importa vários usernames de uma vez |

## Público

| Método | Rota | Descrição |
| --- | --- | --- |
| GET | `/widget` | SVG do widget. Query params: `user`, `theme`, `bg`, `color`, `scale`, `spin`, `rainbow`, `scan` |
| GET | `/user/api/:username` | JSON público com a faixa/config do usuário (CORS liberado pra qualquer origem) |
| GET | `/api/whitelist/:username` | Se um username tá na whitelist do GitHub |
| GET | `/health` | Health check (usado pelo Docker healthcheck) |
| GET | `/ready` | Readiness check |
