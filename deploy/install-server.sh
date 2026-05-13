#!/usr/bin/env bash
# Bootstrap a fresh Debian/Ubuntu server with everything the Next.js
# app needs: Node 20 (via NodeSource), nginx, certbot (if you ever
# decide to use Let's Encrypt later), and pm2 globally.
#
# Run once on a fresh server as root or with sudo:
#   curl -fsSL https://raw.githubusercontent.com/james2kzzwils-jpg/Site-test/main/deploy/install-server.sh | sudo bash
# or scp it onto the box and execute:
#   sudo bash install-server.sh
#
# Idempotent — safe to rerun.

set -euo pipefail

if [[ $EUID -ne 0 ]]; then
  echo "Run as root or with sudo." >&2
  exit 1
fi

export DEBIAN_FRONTEND=noninteractive

echo "[1/5] apt update + base packages"
apt-get update
apt-get install -y curl ca-certificates gnupg lsb-release ufw git build-essential

echo "[2/5] Node 20 via NodeSource"
if ! command -v node >/dev/null || [[ "$(node -v | sed 's/v//' | cut -d. -f1)" -lt 20 ]]; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi
node -v
npm -v

echo "[3/5] pm2 (global)"
npm install -g pm2

echo "[4/5] nginx"
apt-get install -y nginx
systemctl enable nginx
systemctl start nginx

echo "[5/5] firewall (ufw) — allow ssh/http/https"
ufw allow OpenSSH || true
ufw allow 'Nginx Full' || true
if ufw status | grep -q inactive; then
  echo "y" | ufw enable
fi

mkdir -p /var/www/letsencrypt
mkdir -p /etc/ssl/aepovcg

echo
echo "Done."
echo "Next steps (manual, in repo's deploy/DEPLOY.md):"
echo " 1) Copy SSL files into /etc/ssl/aepovcg/ (fullchain.pem + privkey.pem)"
echo " 2) Copy nginx vhost configs from deploy/ into /etc/nginx/sites-available/"
echo " 3) Symlink them into /etc/nginx/sites-enabled/, run nginx -t && systemctl reload nginx"
echo " 4) Clone the repo into /opt/epov/site, set up .env.local, npm ci, npm run build, pm2 start"
