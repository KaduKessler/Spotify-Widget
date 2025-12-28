
# TODO

Projeto de widget Spotify multi-usuário com múltiplos modos de autenticação e controle granular de acesso.

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

- [ ] Nova rota: `POST /auth/invite/create` (admin only, retorna token)
- [ ] Nova rota: `POST /auth/invite/redeem/:token` (qualquer um, cria user)
- [ ] Token: armazenar em tabela `InviteToken` (token, expiresAt, createdBy, usedBy, usedAt)
- [ ] Validar expiração (ex: 7 dias) e se já foi usado
- [ ] Após uso, marcar como usado e guardar username que resgatou

### Registration Policy: Closed

- [ ] Admin apenas cria contas manualmente (future work)
- [ ] Sem rotas de signup públicas

---

## 🎵 Fase 4: Spotify Per-User Integration

### Schema & Storage

- [ ] Adicionar `spotifyClientId`, `spotifyClientSecret` à tabela `User` (ou modelo `SpotifyConfig`)
- [ ] Opcionalmente: `spotifyRefreshToken`, `spotifyAccessToken`, `spotifyTokenExpiresAt`
- [ ] **Criptografia**:
  - Decidir se encrypt secrets (usar `crypto` builtin ou `@noble/ciphers`)
  - Ou apenas armazenar mascarado (mostrar últimos 4 chars no UI)

### Admin UI

- [ ] Nova seção: "Spotify Settings"
- [ ] Form: input clientId, input clientSecret (password field)
- [ ] Botão: "Save Credentials"
- [ ] Botão: "Clear Credentials" (se já configurado)
- [ ] Status: "Configured ✓" ou "Not configured"

### Backend Routes

- [x] `GET /api/spotify-config` (retorna clientId mascarado, se existir)
- [x] `POST /api/spotify-config` (valida e salva clientId/Secret)
- [x] `DELETE /api/spotify-config` (limpa credenciais do user)

### Widget com Spotify (Future)

- [ ] Usar clientId/Secret do user para fazer requisições à API Spotify
- [ ] Não usar credenciais globais/hardcoded
- [ ] Implementar search de tracks, fetch de now playing, etc

---

## 📱 Fase 5: Widget Features

### Spotify Integration

- [ ] Endpoint `POST /api/spotify-now-playing` (webhook/polling)
  - Recebe update de reprodução, salva em `widget_config.currentTrack`
- [ ] Endpoint `POST /api/spotify-search` (busca faixas por query)
  - Usa clientId/Secret do user autenticado
- [ ] Cache de tracks consultadas (opcional, depois)
- [ ] Modo `NOW_PLAYING`: atualiza em tempo real (polling ou webhook)

### SVG Widget

- [ ] Gerar SVG dinâmico baseado em `widget_config` (mode, theme, currentTrack)
- [ ] Suporte a modo `FIXED_TRACK` (mostra track fixa)
- [ ] Suporte a modo `NOW_PLAYING` (mostra track atual + info Spotify)
- [ ] Styles: dark/light theme
- [ ] Endpoint: `GET /widget/:username.svg` (retorna SVG renderizado)

---

## 🎨 Fase 6: Frontend Refactoring

### Code Organization

- [ ] Componentizar `App.tsx`:
  - `Header.tsx` (logo, user menu, logout)
  - `AuthForm.tsx` (login/signup com múltiplos providers)
  - `Dashboard.tsx` (tabs: widget editor, spotify config, preview)
  - `WidgetEditor.tsx` (form: mode, theme, trackId)
  - `SpotifyConfig.tsx` (form: clientId, clientSecret)
  - `Preview.tsx` (mostra widget em tempo real)
- [ ] Separar serviços/hooks:
  - `useSession()` → manage user/username
  - `useAuth()` → login/logout/signup
  - `useConfig()` → fetch/update widget config
  - `useSpotify()` → fetch/update Spotify credentials

### Styling & UX

- [ ] Aplicar design melhorado (tema, espaçamento, tipografia)
- [ ] Suporte tema claro/escuro (persistir em localStorage)
- [ ] Responsividade mobile
- [ ] Feedback visual: loading states, error messages, success toasts

---

## ✅ Extras concluídos fora do escopo original

- Admin UI para gestão de usuários e whitelist GitHub (tabelas, batch import) no frontend
- Fluxo de whitelist GitHub completo no backend (modelo, rotas admin, import do .env, reativação suave)
- Postman collections e ambientes (auth, admin, public API) + README de uso
- Variáveis do admin parametrizadas via `.env` (`VITE_DEV_PORT`, `VITE_BACKEND_URL`) e `vite.config.ts` lendo-as com `loadEnv`

---

## 🧪 Fase 7: Testing & Quality

### Unit Tests

- [ ] Routes de auth (login, logout, signup, callback)
- [ ] Config endpoints (GET/POST/PUT)
- [ ] Validação de CSRF state
- [ ] Rate limit behavior

### Integration Tests

- [ ] Fluxo completo: signup → login → config save → preview
- [ ] Múltiplos users: isolamento de dados

### Code Quality

- [ ] ESLint + Prettier configurados
- [ ] Type checking strict (tsc --noEmit)
- [ ] Pre-commit hooks (husky)

---

## 🚀 Fase 8: CI/CD & Deploy

### GitHub Actions

- [ ] Build: tsc + build frontend
- [ ] Test: rodar suite de testes
- [ ] Lint: ESLint check
- [ ] Deploy: staging/prod (após approval)

### Documentation

- [ ] README.md completo
- [ ] DEPLOYMENT.md (como hospedar self-hosted)
- [ ] API.md (documentar endpoints)
- [ ] ARCHITECTURE.md (diagrama de fluxo)

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

- [ ] Widget customization (color picker, font size)
- [ ] Playlist support (mostrar faixas de playlist)
- [ ] Multiple widgets por user
- [ ] Compartilhar config entre users
- [ ] API pública para integração third-party

---

## 🎯 Priorização Recomendada

1. **Segurança** (Fase 2): rate limit, validação, password hashing
2. **Políticas de Signup** (Fase 3): open → whitelist → invite → closed
3. **Spotify Per-User** (Fase 4): credenciais, storage, UI
4. **Widget Features** (Fase 5): integração real com Spotify
5. **Frontend** (Fase 6): componentes, UX
6. **Testes & Infra** (Fase 7-8): automação e deploy
