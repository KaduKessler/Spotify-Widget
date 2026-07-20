
# TODO

Projeto de widget Spotify multi-usuário com múltiplos modos de autenticação e controle granular de acesso.

## Status geral

| Fase | Status |
| --- | --- |
| 1. Foundation | ✅ Concluído |
| 2. Security Hardening | ✅ Concluído |
| 3. Registration Policies | 🟡 Parcial — enforcement básico existe, falta fluxo de invite token de verdade |
| 4. Spotify Per-User | ✅ Concluído — credenciais e tokens criptografados em repouso |
| 5. Widget Features | 🟡 Quase completo — cache de busca de tracks não existe (só dedupe de 3s) |
| 6. Frontend Refactoring | 🟡 Parcial — falta extrair hooks e tema claro/escuro do painel |
| 7. Testing & Quality | ✅ Concluído — Vitest + husky, cobre auth/config/rate limit/multi-user |
| 8. CI/CD & Deploy | ✅ Concluído — CI completo + imagem publicada no GHCR + versionamento por tag |

---

## ✅ Fase 1: Foundation (Concluído)

### Backend (Fastify + Prisma)

- [x] Schema Prisma: `users` (autoincrement id + username único) e `widget_config` (1:1 per user)
- [x] Multi-usuário: cada userId tem config isolada; endpoint público `/user/:username`
- [x] Persistência: funções `upsertUser`, `getUserById`, `getUserByUsername`
- [x] Auth routes: `/auth/github`, `/auth/login`, `/auth/logout`, `/api/me`
- [x] Cookies: assinados, httpOnly, sameSite=lax, secure em produção
- [x] OAuth CSRF: `state` parameter no GitHub OAuth com validação constante
- [x] Admin API: GET/POST `/api/config`, GET/PUT `/api/widget` por usuário

### Frontend (React + Vite)

- [x] Session management: `/api/me` retorna user info
- [x] Auth flow: discover providers → login/signup → dashboard
- [x] Widget preview: integrado no admin UI

### Infra

- [x] Prisma migrations: sistema versionado
- [x] TypeScript ESM: compilação clean
- [x] gitignore: consolidado na raiz (node_modules, dist, .env, .prisma, *.sqlite)
- [x] pnpm-workspace: setup para backend + admin

---

## 🔐 Fase 2: Security Hardening (Concluído ✅)

### Rate Limiting & Brute Force Protection

- [x] Registrar `@fastify/rate-limit` no bootstrap
- [x] Limitar `/auth/github`, `/auth/login`, `/auth/logout` (10 req/5 min por IP)
- [x] Rate limit global (100 req/min) para outras rotas

### Input Validation

- [x] Validar POST `/api/config` e PUT `/api/widget` (mode, theme, trackId)
- [x] Helper `validateWidgetConfig` com validação de tipos e tamanhos
- [x] Rejeitar payloads com campos inesperados

### Password Security

- [x] Comparação constante (timingSafeEqual para evitar timing attacks)
- [x] Throttle/lockout após 5 falhas (cooldown 5 min por IP/username)
- [x] Logging de tentativas falhadas no console
- [x] Cookie com maxAge de 7 dias

### Documentação

- [x] README.md completo: setup, env vars, fluxos de auth, estrutura DB
- [x] Documentado rate limiting, throttling, cookies, CSRF
- [x] Guia de deployment e configuração de produção

---

## 🎯 Fase 3: Registration Policies (Alta Prioridade)

### Schema & Config Changes

- [x] Adicionar campo `spotifyClientId`, `spotifyClientSecret` em `User` (ainda sem encrypt)
  - Ou criar modelo `SpotifyConfig` (1:1 com User)
- [x] Adicionar env vars para políticas:
  - `REGISTRATION_POLICY`: `open` | `github_whitelist` | `invite_only` | `closed` (padrão: `open`)
  - `GITHUB_WHITELIST`: lista de usernames separada por vírgula (se policy=github_whitelist)
  - `ALLOW_PASSWORD_SIGNUP`: true | false (padrão: true)

### Registration Policy: Open (Baseline)

- [ ] Qualquer um faz signup via password (se enabled) ou GitHub (frontend ainda não trata)
- [ ] Validação básica (username único, email válido se necessário)
- [ ] Envio de confirmação por email (opcional, depois)

### Registration Policy: GitHub Whitelist

- [x] No fluxo `/auth/github/callback`, validar username contra `GITHUB_WHITELIST` (DB + env)
- [x] Se não na whitelist, rejeitar com mensagem apropriada
- [ ] Desabilitar password signup (redirecionar para GitHub) e ajustar UX

### Registration Policy: Invite Tokens

- [x] `REGISTRATION_POLICY=invite_only` bloqueia GitHub com 403 (`auth-github.ts`), mas é só um bloqueio duro: não existe token de convite de verdade ainda
- [ ] Nova rota: `POST /auth/invite/create` (admin only, retorna token)
- [ ] Nova rota: `POST /auth/invite/redeem/:token` (qualquer um, cria user)
- [ ] Token: armazenar em tabela `InviteToken` (token, expiresAt, createdBy, usedBy, usedAt)
- [ ] Validar expiração (ex: 7 dias) e se já foi usado
- [ ] Após uso, marcar como usado e guardar username que resgatou

### Registration Policy: Closed

- [x] `REGISTRATION_POLICY=closed` bloqueia GitHub com 403 (`auth-github.ts`)
- [x] Só bloqueia signup novo, login de quem já tem conta passa normal
- [ ] Admin criar contas manualmente (sem rota ainda)

---

## 🎵 Fase 4: Spotify Per-User Integration

### Schema & Storage

- [x] `spotifyClientId`, `spotifyClientSecret` na tabela `User`
- [x] `spotifyRefreshToken`, `spotifyAccessToken`, `spotifyTokenExpiresAt` (tokens OAuth do usuário)
- [x] **Criptografia**: `spotifyClientSecret`/`spotifyAccessToken`/`spotifyRefreshToken` criptografados em repouso (AES-256-GCM via Prisma Client Extension em `lib/db.ts`, transparente pras rotas). `spotifyClientId` fica em texto puro de propósito, não é segredo. Sem migração manual: descriptografia tolera valor legado em texto puro e reencripta na próxima escrita natural (refresh de token, ou re-salvar no painel)

### Admin UI

- [x] Seção "Integração Spotify" (aba Configuração do painel)
- [x] Form: input clientId, input clientSecret (password field)
- [x] Botão "Salvar"/"Atualizar" + "Limpar" (se já configurado)
- [x] Status "Configurado" com badge

### Backend Routes

- [x] `GET /api/spotify-config` (retorna clientId mascarado, se existir)
- [x] `POST /api/spotify-config` (valida e salva clientId/Secret)
- [x] `DELETE /api/spotify-config` (limpa credenciais do user)

### Widget com Spotify

- [x] Usa clientId/Secret do próprio usuário pra falar com a API do Spotify
- [x] Sem credenciais globais/hardcoded no `.env`
- [x] Now playing (com fallback pra última tocada) e busca de faixa por ID/URL pro modo Track fixa

---

## 📱 Fase 5: Widget Features

### Spotify Integration

- [x] `GET /api/spotify/now-playing` (poll sob demanda, sem webhook)
- [x] Fallback pra última faixa tocada quando nada tá tocando agora
- [ ] Cache de tracks consultadas (existe um cache de 3s no now-playing só pra dedupe de chamada simultânea, não é cache de busca)
- [x] Modo `NOW_PLAYING`: reflete a faixa atual a cada fetch do `/widget`

### SVG Widget

- [x] Gera SVG dinâmico baseado na config salva (mode, theme, aparência)
- [x] Modo `FIXED_TRACK` (track fixa escolhida no painel)
- [x] Modo `NOW_PLAYING` (faixa atual, com equalizer animado)
- [x] Tema dark/light + aparência customizável (fundo, cor do texto, escala) via query param
- [x] Endpoint real: `GET /widget?user=username` (não `/widget/:username.svg` como planejado aqui)

---

## 🎨 Fase 6: Frontend Refactoring

### Code Organization

- [x] `App.tsx` componentizado (nomes reais diferem do planejado aqui, mas a ideia foi feita):
  `DashboardHeader`, `LoginScreen`, `TabNav`, `WidgetEditorCard` (editor + preview juntos),
  `SpotifyPanel`, `NowPlayingCard`, `UsersPanel`, `GitHubWhitelistPanel`, `FlagsModal`,
  `Button`/`ModalShell`/`Toggle`/`Segmented`/`DataTable`/`ColorPicker` (compartilhados)
- [ ] Separar em hooks (`useSession`, `useAuth`, `useConfig`, `useSpotify`): estado ainda vive
  centralizado em `App.tsx` e é passado via props, funciona mas não foi extraído em hooks

### Styling & UX

- [x] Design consistente (glass cards, paleta única, motion, foco/contraste WCAG AA)
- [ ] Tema claro/escuro do próprio painel (o widget gerado tem dark/light, o painel em si é só dark)
- [x] Responsividade mobile (header, tabs, cards testados e ajustados)
- [x] Feedback visual: loading states (skeleton, min-duration), mensagens de erro/sucesso inline

---

## 🧪 Fase 7: Testing & Quality

Vitest no backend, rodando via `app.inject()` contra um SQLite de teste isolado
(`backend/data/test.sqlite`, migrado e limpo automaticamente). `pnpm test` na
raiz ou `pnpm --filter ./backend test`. Só backend por agora — sem testes de
frontend ainda.

### Unit Tests

- [x] Routes de auth: login (sucesso, senha errada, lockout após 5 falhas), logout
- [x] Config endpoints (GET/POST `/api/config`, com e sem sessão, payload inválido)
- [x] Validação de CSRF state no callback do GitHub (ausente, inválido, válido)
- [x] Rate limit behavior (`/auth/login` retorna 429 após o limite)
- [x] Políticas de registro: `closed`/`invite_only` bloqueiam signup mas não login existente, `github_whitelist` bloqueia quem não tá na lista

### Integration Tests

- [x] Fluxo completo: cria user (admin) → login → `POST /api/config` → `GET /widget` reflete a config salva
- [x] Múltiplos users: isolamento de dados confirmado via `/api/config`

### Code Quality

- [x] ~~ESLint + Prettier configurados~~ — obsoleto, projeto já usa Biome pra lint+format
- [x] Type checking strict: `pnpm typecheck` na raiz (`tsc --noEmit` nos dois pacotes, `strict: true` já ligado)
- [x] Pre-commit hooks (husky): `biome check` + `typecheck` em `.husky/pre-commit`

**Bugs achados escrevendo os testes** (corrigidos, não só documentados):
- Lockout de login nunca disparava de verdade: `checkThrottle` apagava o contador de tentativas a cada chamada, não só quando o lock expirava (`auth-password.ts`)
- Rate limit devolvia 500 em vez de 429: `errorResponseBuilder` dos dois limiters não incluía `statusCode`, caía no fallback genérico do error handler (`index.ts`)

---

## 🚀 Fase 8: CI/CD & Deploy

`.github/workflows/ci.yml`: lint (Biome) + typecheck + testes + build dos dois
pacotes + `pnpm audit`, em todo push/PR. Job separado builda e publica a
imagem Docker no GHCR.

### GitHub Actions

- [x] Build: `tsc`/`tsc -b` + build do frontend (job `test`)
- [x] Test: roda a suite Vitest do backend (job `test`)
- [x] Lint: `biome ci` (substitui o ESLint, que nunca foi usado neste projeto)
- [x] Publica imagem Docker no GHCR (job `docker-image`) só em push de tag `vX.Y.Z`, com tags semver (`latest`/`vX.Y.Z`/`vX.Y`/`vX`). Push em `main` sem tag só builda pra validar o `Dockerfile`, não publica nada. Sem staging/prod de verdade — projeto é self-hosted, não tem servidor próprio pra apontar um deploy automático

### Versionamento

- [x] `package.json` dos 3 pacotes sincronizados em `1.0.0`
- [x] Release = `git tag vX.Y.Z && git push origin vX.Y.Z` (documentado no README)

### Documentation

- [x] README.md completo (revisado contra o código real, com diagrama Mermaid)
- [x] Como hospedar self-hosted (seção "🐳 Docker" do README + variante "sem clonar o repo" com a imagem do GHCR)
- [x] `API.md` (rotas reais, agrupadas por área, com requisito de auth de cada uma)
- [x] Diagrama de fluxo (Mermaid, embutido no README, sem arquivo ARCHITECTURE.md separado)

**Bug achado escrevendo o `API.md`**: `GET /api/whitelist/:username` tinha
comentário "público" no código mas retornava 401 de verdade — não tava na
allowlist do hook de auth (`plugins/auth.ts`). Corrigido + testado.

---

## ✅ Extras concluídos fora do escopo original

- Admin UI para gestão de usuários e whitelist GitHub (tabelas, batch import) no frontend
- Fluxo de whitelist GitHub completo no backend (modelo, rotas admin, import do .env, reativação suave)
- Postman collections e ambientes (auth, admin, public API) + README de uso
- Variáveis do admin parametrizadas via `.env` (`VITE_DEV_PORT`, `VITE_BACKEND_URL`) e `vite.config.ts` lendo-as com `loadEnv`
- Aparência customizável do widget via query param (fundo, cor do texto, escala) além de tema/spin/rainbow/scan
- `pnpm audit`: 0 vulnerabilidades (era 51)
- `biome ci` limpo em todo o projeto
- Redesign completo do painel: editor unificado (config + preview), header com menu de usuário, tabelas e modais padronizados, contraste WCAG AA
- Widget customization completo: color picker próprio (react-colorful, popover) pra fundo/texto e slider de escala no editor
- Deploy real via Docker: `Dockerfile` + `docker-compose.yml` + entrypoint que gera segredos sozinho na 1ª execução, testado ponta a ponta

---

## 📚 Extras & Backlog

### Nice to Have

- [ ] Email confirmação (signup validation)
- [ ] Two-factor authentication (TOTP)
- [ ] Logs estruturados (structured logging)
- [ ] Monitoring (Sentry para erros)
- [ ] Analytics (opcional)

### Accessibility & i18n

- [ ] WCAG 2.1 AA (a11y)
- [ ] i18n suporte (en, pt-br)

### Advanced Features (Very Future)

- [ ] Playlist support (mostrar faixas de playlist)
- [ ] Multiple widgets por user
- [ ] Compartilhar config entre users
- [ ] API pública para integração third-party

---

## 🎯 Próximos passos sugeridos

1. Sistema de invite token de verdade, se a policy for pra valer (Fase 3)
2. Extrair estado do `App.tsx` pra hooks (`useSession`, `useAuth` etc) (Fase 6)
