
# TODO

Projeto de widget Spotify multi-usuário com múltiplos modos de autenticação e controle granular de acesso.

## Status geral

| Fase | Status |
| --- | --- |
| 1. Foundation | ✅ Concluído |
| 2. Security Hardening | ✅ Concluído |
| 3. Registration Policies | 🟡 Parcial — enforcement básico existe, falta fluxo de invite token e distinguir signup de login no bloqueio |
| 4. Spotify Per-User | 🟡 Quase completo — falta encriptar credenciais em repouso |
| 5. Widget Features | 🟡 Quase completo — cache de busca de tracks não existe (só dedupe de 3s) |
| 6. Frontend Refactoring | 🟡 Parcial — falta extrair hooks e tema claro/escuro do painel |
| 7. Testing & Quality | 🔴 Pendente — zero testes, zero lint config, zero pre-commit |
| 8. CI/CD & Deploy | 🟡 Parcial — docs prontas, GitHub Actions não existe |

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
- [ ] **Bug**: o check roda antes do upsert e barra até usuário já existente tentando logar de novo, não só signup novo — devia distinguir os dois casos
- [ ] Admin criar contas manualmente (sem rota ainda)

---

## 🎵 Fase 4: Spotify Per-User Integration

### Schema & Storage

- [x] `spotifyClientId`, `spotifyClientSecret` na tabela `User`
- [x] `spotifyRefreshToken`, `spotifyAccessToken`, `spotifyTokenExpiresAt` (tokens OAuth do usuário)
- [ ] **Criptografia**: hoje armazenado em texto puro, secret mascarado só na exibição (UI). Encriptar em repouso continua pendente

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

- [x] README.md completo (revisado contra o código real, com diagrama Mermaid)
- [x] Como hospedar self-hosted (coberto na seção "🐳 Docker" do README, sem arquivo separado)
- [ ] API.md (documentar endpoints)
- [x] Diagrama de fluxo (Mermaid, embutido no README, sem arquivo ARCHITECTURE.md separado)

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

1. Corrigir o bug de bloqueio de usuário existente nas policies `closed`/`invite_only` (Fase 3)
2. Testes automatizados: hoje é zero cobertura, maior risco real do projeto (Fase 7)
3. GitHub Actions básico (build + lint + audit) antes de qualquer coisa mais além (Fase 8)
4. Encriptar credenciais Spotify em repouso (Fase 4)
5. Sistema de invite token de verdade, se a policy for pra valer (Fase 3)
