#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
ADMIN_DIR="$ROOT_DIR/admin"

cmd_exists() {
  command -v "$1" >/dev/null 2>&1
}

echo "==> Checking pnpm"
if ! cmd_exists pnpm; then
  echo "ERROR: pnpm not found. Install it: npm i -g pnpm"
  exit 1
fi

echo "==> Checking Node.js version (>= 18)"
if ! cmd_exists node; then
  echo "ERROR: node not found. Install Node.js 18+."
  exit 1
fi
NODE_MAJOR=$(node -v | sed 's/^v//' | cut -d. -f1)
if [[ "$NODE_MAJOR" -lt 18 ]]; then
  echo "ERROR: Node.js 18+ required. Detected: $(node -v)"
  exit 1
fi

generate_secret() {
  if cmd_exists openssl; then
    openssl rand -hex 32
  else
    node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  fi
}

ensure_backend_env() {
  mkdir -p "$BACKEND_DIR"
  local env_file="$BACKEND_DIR/.env"
  local example="$BACKEND_DIR/.env.example"
  if [[ -f "$env_file" ]]; then
    echo "==> backend/.env already exists, skipping creation."
  else
    if [[ -f "$example" ]]; then
      cp "$example" "$env_file"
      echo "==> Copied backend/.env from example."
    else
      cat > "$env_file" <<'EOF'
NODE_ENV=development
PORT=3000
HOST=127.0.0.1
SESSION_SECRET=
ENABLE_PASSWORD_AUTH=true
ENABLE_GITHUB_AUTH=false
ENABLE_NONE_AUTH=false
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin12345
APP_URL=http://127.0.0.1:3000
ADMIN_URL=http://127.0.0.1:5173
ENABLE_HELMET=false
HELMET_DISABLE_HSTS=false
REGISTRATION_POLICY=open
GITHUB_WHITELIST=
EOF
      echo "==> Created backend/.env with defaults."
    fi
    local secret
    secret=$(generate_secret)
    if grep -q "^SESSION_SECRET=" "$env_file"; then
      # Attempt portable in-place replacement (sed), fallback to Node if sed fails
      if ! sed -i.bak "s/^SESSION_SECRET=.*/SESSION_SECRET=${secret}/" "$env_file" 2>/dev/null; then
        node -e "const fs=require('fs');const p=process.argv[1], sec=process.argv[2];let s=fs.readFileSync(p,'utf8');s=s.replace(/^SESSION_SECRET=.*/m,'SESSION_SECRET='+sec);fs.writeFileSync(p,s);" "$env_file" "$secret"
      fi
    else
      echo "SESSION_SECRET=$secret" >> "$env_file"
    fi
  fi
}

ensure_admin_env() {
  mkdir -p "$ADMIN_DIR"
  local env_local="$ADMIN_DIR/.env.local"
  if [[ -f "$env_local" ]]; then
    echo "==> admin/.env.local exists, skipping."
  else
    cat > "$env_local" <<'EOF'
VITE_BACKEND_URL=http://127.0.0.1:3000
VITE_DEV_PORT=5173
EOF
    echo "==> Created admin/.env.local"
  fi
}

install_deps() {
  echo "==> Installing dependencies (pnpm install)"
  pnpm install
}

init_db() {
  echo "==> Running Prisma migrate dev (backend)"
  (cd "$BACKEND_DIR" && pnpm exec prisma migrate dev --name init || true)
}

main() {
  ensure_backend_env
  ensure_admin_env
  install_deps
  init_db
  echo "==> Setup completed. To start dev servers: pnpm dev"
}

main "$@"
