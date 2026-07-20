#!/bin/sh
set -e

mkdir -p /app/data

# Sem SESSION_SECRET definido: gera um sozinho na primeira execução e
# persiste no volume, pra não exigir que quem só quer testar rode
# openssl na mão antes de subir o container.
SECRET_FILE=/app/data/.session_secret
if [ -z "$SESSION_SECRET" ]; then
  if [ -f "$SECRET_FILE" ]; then
    SESSION_SECRET="$(cat "$SECRET_FILE")"
  else
    SESSION_SECRET="$(node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))")"
    echo "$SESSION_SECRET" > "$SECRET_FILE"
    echo "SESSION_SECRET gerado automaticamente e salvo em $SECRET_FILE"
  fi
  export SESSION_SECRET
fi

# Mesma ideia pra ENCRYPTION_KEY (criptografa credenciais Spotify em
# repouso): gera e persiste sozinha, sem imprimir no log — não é
# credencial que o usuário precisa copiar, só existe.
ENCRYPTION_KEY_FILE=/app/data/.encryption_key
if [ -z "$ENCRYPTION_KEY" ]; then
  if [ -f "$ENCRYPTION_KEY_FILE" ]; then
    ENCRYPTION_KEY="$(cat "$ENCRYPTION_KEY_FILE")"
  else
    ENCRYPTION_KEY="$(node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))")"
    echo "$ENCRYPTION_KEY" > "$ENCRYPTION_KEY_FILE"
  fi
  export ENCRYPTION_KEY
fi

# Mesma ideia pro ADMIN_PASSWORD, quando password auth está ligado e
# ninguém definiu uma senha própria: gera, persiste e imprime uma vez
# no log (só na primeira execução) pra dar pra copiar e logar.
PASSWORD_FILE=/app/data/.admin_password
if [ -z "$ADMIN_PASSWORD" ] && [ "$ENABLE_PASSWORD_AUTH" != "false" ]; then
  if [ -f "$PASSWORD_FILE" ]; then
    ADMIN_PASSWORD="$(cat "$PASSWORD_FILE")"
  else
    ADMIN_PASSWORD="$(node -e "console.log(require('node:crypto').randomBytes(12).toString('base64url'))")"
    echo "$ADMIN_PASSWORD" > "$PASSWORD_FILE"
    echo ""
    echo "================================================================"
    echo " Nenhum ADMIN_PASSWORD definido. Senha gerada pra você:"
    echo ""
    echo "   usuário: ${ADMIN_USERNAME:-owner}"
    echo "   senha:   $ADMIN_PASSWORD"
    echo ""
    echo " Salva em $PASSWORD_FILE. Troque depois de logar."
    echo "================================================================"
    echo ""
  fi
  export ADMIN_PASSWORD
fi

cd /app/backend
./node_modules/.bin/prisma migrate deploy

# cwd precisa ser backend/, o server resolve o build do admin
# via path.join(process.cwd(), '..', 'admin', 'dist')
exec node dist/index.js
