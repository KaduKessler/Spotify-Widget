
# TODO

Este arquivo descreve as tarefas necessárias para finalizar e melhorar o projeto, com foco em multi-usuário, segurança, integração com Spotify, refatoração do frontend e outras melhorias.

## Prioridades imediatas

- **Multi-usuário / Widgets por usuário**: criar uma rota de widget por usuário e garantir que cada `userId` tenha sua própria configuração (não compartilhar o mesmo `widget_config` global). Implementar tabela `user_widget_config` com `owner_id` e garantir fallback/compatibilidade com a configuração global existente.
- **Persistência de usuários**: garantir que a tabela `users` contenha `id`, `provider`, `username`, `avatar_url` e funções `upsertUser` / `getUserById` corretas. Associar configs ao `owner_id` (userId).
- **Segurança**: revisar sessão/cookies (assinatura, `httpOnly`, `sameSite`, `secure`), validar endpoints, proteção CSRF se necessário, e revisar quem pode alterar configurações do widget.

## Integração com Spotify

- **Receber `spotify-playing-now`**: permitir que o widget receba updates do estado de reprodução (webhook/POST) e atualize a exibição em tempo real.
- **Buscar faixas por URL**: implementar utilitário/endpoints para resolver URLs de Spotify e buscar metadados das faixas (título, artista, imagem) para uso no widget.

## Frontend (admin)

- **Componentizar `App.tsx`**: dividir `admin/src/App.tsx` em componentes reutilizáveis (Header, Auth/Login, Dashboard, WidgetEditor, Preview). Tornar lógica testável e separar hooks/serviços.
- **Reestilizar**: aplicar um design mais adequado (tema, espaçamento, tipografia, responsividade). Suporte a tema claro/escuro.

## Qualidade, infra e docs

- **Testes e CI**: adicionar testes essenciais (rotas de autenticação, endpoints críticos), lint/format e configurar pipeline CI (rodar build/test/lint). 
- **Documentação**: criar e atualizar `README.md` com passos de configuração, variáveis de ambiente (ex.: `SESSION_SECRET`, `GITHUB_*`, `AUTH_PROVIDER`) e fluxo de autenticação. Documentar como criar widgets por usuário.
- **Observability & Backlog**: planejar acessibilidade, i18n, logs estruturados e monitoramento de erros (Sentry/Outros).

## Ordem sugerida de trabalho

1. Criar/validar tabela `users` (se necessário) e garantir endpoints de login atualizando `users`.
2. Criar `user_widget_config` e adaptar rotas que leem/escrevem config para usar `request.userId`.
3. Revisar plugin `auth` e políticas de cookie/sessão (testar `AUTH_PROVIDER=none`, `password`, `github`).
4. Implementar endpoint para receber `spotify-playing-now` e utilitário para buscar tracks por URL.
5. Refatorar `App.tsx` em componentes e aplicar novo estilo.
6. Adicionar testes, CI e documentação.

## Segurança / Notas importantes

- Tratar `userId` como autoridade para operações por-usuário; validar sempre no backend.
- Cookies de sessão devem ser assinados e, em produção, `secure: true` e `sameSite` apropriado.
- Para integração com Spotify, evitar armazenar tokens sensíveis sem necessidade; se armazenar, criptografar/limitar acesso.
