#!/usr/bin/env bash

set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="${SCRIPT_DIR}"
DIST_DIR="${APP_DIR}/dist"
DEFAULT_SITE_NAME="docs-site"

SITE_NAME="${SITE_NAME:-$DEFAULT_SITE_NAME}"
DOMAIN="${DOMAIN:-_}"
WWW_ROOT="${WWW_ROOT:-/var/www/${SITE_NAME}}"
NGINX_AVAILABLE="/etc/nginx/sites-available/${SITE_NAME}"
NGINX_ENABLED="/etc/nginx/sites-enabled/${SITE_NAME}"

if [[ "${EUID}" -ne 0 ]]; then
  echo "Run as root: sudo bash deploy-ubuntu-2404.sh"
  exit 1
fi

if [[ ! -f "${APP_DIR}/package.json" ]]; then
  echo "package.json not found in ${APP_DIR}"
  exit 1
fi

if ! command -v apt-get >/dev/null 2>&1; then
  echo "This script supports Ubuntu/Debian only (apt-get required)."
  exit 1
fi

export DEBIAN_FRONTEND=noninteractive

echo "[1/7] Installing system dependencies..."
apt-get update
apt-get install -y curl ca-certificates gnupg ufw nginx rsync

echo "[2/7] Installing Node.js 22.x..."
if ! command -v node >/dev/null 2>&1 || ! node -v | grep -Eq '^v22\.'; then
  install -d -m 0755 /etc/apt/keyrings
  curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key \
    | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg
  echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_22.x nodistro main" \
    > /etc/apt/sources.list.d/nodesource.list
  apt-get update
  apt-get install -y nodejs
fi

echo "[3/7] Installing npm dependencies and building project..."
cd "${APP_DIR}"
npm ci
npm run build

if [[ ! -d "${DIST_DIR}" ]]; then
  echo "Build failed: ${DIST_DIR} was not generated."
  exit 1
fi

echo "[4/7] Publishing dist to ${WWW_ROOT}..."
install -d -m 0755 "${WWW_ROOT}"
rsync -a --delete "${DIST_DIR}/" "${WWW_ROOT}/"
chown -R www-data:www-data "${WWW_ROOT}"

echo "[5/7] Writing nginx config..."
cat > "${NGINX_AVAILABLE}" <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN};

    root ${WWW_ROOT};
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location ~* \.(?:css|js|mjs|map|jpg|jpeg|gif|png|svg|webp|ico|woff2?)$ {
        expires 7d;
        add_header Cache-Control "public, max-age=604800, immutable";
        try_files \$uri =404;
    }
}
EOF

ln -sfn "${NGINX_AVAILABLE}" "${NGINX_ENABLED}"
if [[ -L /etc/nginx/sites-enabled/default ]]; then
  rm -f /etc/nginx/sites-enabled/default
fi

echo "[6/7] Validating nginx and restarting service..."
nginx -t
systemctl enable nginx
systemctl restart nginx

echo "[7/7] Allowing HTTP in UFW (if enabled)..."
if ufw status | grep -iq "Status: active"; then
  ufw allow 'Nginx Full' >/dev/null 2>&1 || true
fi

echo
echo "Deploy complete."
echo "- Site name: ${SITE_NAME}"
echo "- Domain: ${DOMAIN}"
echo "- Web root: ${WWW_ROOT}"
echo
echo "To enable HTTPS with Let's Encrypt:"
echo "  sudo apt-get install -y certbot python3-certbot-nginx"
echo "  sudo certbot --nginx -d your.domain"
