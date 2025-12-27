# Postman Collections - Spotify Readme

Collections completas da API do Spotify Readme para testes e desenvolvimento.

## 📁 Estrutura

```text
postman/
├── collections/
│   ├── 01-Auth.postman_collection.json          # Autenticação e sessão
│   ├── 02-Admin.postman_collection.json         # Rotas administrativas
│   └── 03-Public-API.postman_collection.json    # APIs públicas e config
└── environments/
  ├── local.postman_environment.json           # Ambiente de desenvolvimento
  └── production.postman_environment.json      # Ambiente de produção
```

## 🚀 Como Usar

### 1. Importar no Postman

1. Abra o Postman
2. Clique em **Import**
3. Selecione todos os arquivos `.json` desta pasta
4. Collections e Environments serão importados automaticamente

### 2. Configurar Environment

1. No canto superior direito, selecione o environment **"Local"** ou **"Production"**
2. Edite as variáveis se necessário:
   - `baseUrl`: URL do backend
   - `adminUrl`: URL do frontend admin
   - `testUsername`: Username para testes (apenas Local)
   - `testPassword`: Senha para testes (apenas Local)
   - `session`: Cookie de sessão (preenchido automaticamente após login)

### 3. Ordem de Execução Recomendada

#### Para testar autenticação

1. **01-Auth** > Config > Get Auth Config
2. **01-Auth** > Password Auth > Login
3. **01-Auth** > Session > Get Current User

#### Para testar admin

1. Faça login primeiro (veja acima)
2. **02-Admin** > Users Management > List All Users
3. **02-Admin** > GitHub Whitelist > List Whitelist

#### Para testar APIs públicas

1. **03-Public API** > Health Checks > Health
2. **03-Public API** > Widget > Get Widget SVG

## 📚 Collections Detalhadas

### 01 - Autenticação

**Endpoints incluídos:**

- ✅ Get Auth Config (providers disponíveis)
- ✅ Login/Logout (password auth)
- ✅ GitHub OAuth (initiate + callback)
- ✅ Get Current User (sessão)
- ✅ Spotify OAuth (connect + disconnect)
- ✅ Spotify Status

**Testes automáticos:**

- Valida status codes
- Captura cookie de sessão automaticamente
- Valida estrutura de resposta

### 02 - Admin

**Endpoints incluídos:**

**Users Management:**

- ✅ List All Users
- ✅ Create User (password)
- ✅ Update User Role
- ✅ Reset User Password

**GitHub Whitelist:**

- ✅ List Whitelist
- ✅ Add to Whitelist (com/sem validação GitHub)
- ✅ Remove from Whitelist
- ✅ Batch Import (até 100 usernames)

**Validation Helpers:**

- ✅ Check if User in Whitelist
- ✅ Validate GitHub Username (GitHub API)

**Requisitos:**

- Requer autenticação com role `admin`
- Cookie de sessão é adicionado automaticamente após login

### 03 - Public API

**Endpoints incluídos:**

**Health Checks:**

- ✅ Health
- ✅ Ready

**Widget (público):**

- ✅ Get Widget SVG
- ✅ Get User Public JSON

**Widget Config (autenticado):**

- ✅ Get My Config
- ✅ Update Config (NOW_PLAYING ou FIXED_TRACK)

**Spotify Config (autenticado):**

- ✅ Get/Update/Delete Spotify Credentials

**Now Playing (autenticado):**

- ✅ Get Now Playing (track atual)

## 🔧 Variáveis de Environment

### Local Environment

| Variável | Valor Padrão | Tipo | Descrição |
| --- | --- | --- | --- |
| `baseUrl` | `http://127.0.0.1:3000` | default | URL do backend |
| `adminUrl` | `http://127.0.0.1:5173` | default | URL do frontend |
| `testUsername` | `admin` | default | Username para testes |
| `testPassword` | `admin` | secret | Senha para testes |
| `session` | `""` | secret | Cookie de sessão (auto) |

### Production Environment

| Variável | Valor | Tipo | Descrição |
| --- | --- | --- | --- |
| `baseUrl` | `https://seu-dominio.com` | default | URL do backend prod |
| `adminUrl` | `https://admin.seu-dominio.com` | default | URL do frontend prod |
| `session` | `""` | secret | Cookie de sessão |

**⚠️ Importante:** Altere as URLs de produção antes de usar!

## 🧪 Testes Automatizados

Todas as requests principais incluem testes automatizados que validam:

- ✅ Status codes (200, 201, 401, 403, etc)
- ✅ Estrutura de resposta (propriedades obrigatórias)
- ✅ Tipos de dados corretos
- ✅ Captura automática de cookies e tokens

**Exemplo de teste (POST Login):**

```javascript
pm.test("Login successful", function () {
    pm.response.to.have.status(200);
    pm.expect(pm.response.json()).to.have.property('ok', true);
});

pm.test("Session cookie set", function () {
    const cookies = pm.cookies.all();
    const sessionCookie = cookies.find(c => c.name === 'session');
    pm.expect(sessionCookie).to.exist;
    pm.environment.set("session", sessionCookie.value);
});
```

## 📝 Notas Importantes

### Autenticação

- O cookie `session` é capturado automaticamente após login bem-sucedido
- Requests subsequentes usam esse cookie para autenticação
- Para testar como outro usuário, faça logout e login novamente

### GitHub OAuth

- Endpoints `/auth/github` e `/auth/github/callback` precisam ser testados no browser
- As requests no Postman são apenas para referência/documentação

### Spotify OAuth

- Similar ao GitHub, precisa ser testado no browser
- Requer Spotify Developer App configurado

### Rate Limiting

- Auth routes: 10 requests/minuto por IP
- Outras routes: 100 requests/minuto por IP
- Se atingir o limite, aguarde 1 minuto

### Admin Endpoints

- Requer role `admin`
- Se receber `403 Forbidden`, verifique se:
  1. Está autenticado (fez login)
  2. Seu usuário tem role `admin`
  3. Cookie de sessão está válido

## 🐛 Troubleshooting

### "Unauthorized" (401)

- Verifique se fez login (Collection 01-Auth > Login)
- Verifique se o cookie `session` está presente

### "Forbidden" (403)

- Seu usuário não tem role `admin`
- Use um usuário admin ou configure `ADMIN_USERS` no `.env`

### "Connection refused"

- Verifique se o backend está rodando (`pnpm dev` no `/backend`)
- Verifique a URL no environment (`baseUrl`)

### "Session cookie not set"

- Verifique se o test script está rodando (aba Tests)
- Manualmente copie o cookie `session` da resposta

## 📖 Documentação Adicional

Para mais informações sobre a API, consulte:

- [README.md](../README.md) - Documentação completa do projeto
- [backend/src/routes/](../backend/src/routes/) - Código-fonte das rotas

---

**Última atualização:** 27/12/2025
