#!/usr/bin/env bash
# Bootstrap an Ubuntu/Debian server with Node 20 and pm2.
# Nginx is assumed to be already installed (the existing aepovcg.ru
# box has it). Certbot is intentionally NOT installed — TLS is
# terminated at Cloudflare so the origin only needs port 80.
#
# Run once on a fresh server as root or with sudo:
#   sudo bash install-server.sh
#
# Idempotent — safe to rerun.

set -euo pipefail

if [[ $EUID -ne 0 ]]; then
  echo "Run as root or with sudo." >&2
  exit 1
fi

export DEBIAN_FRONTEND=noninteractive

echo "[1/4] apt update + base packages"
apt-get update
apt-get install -y curl ca-certificates gnupg lsb-release git build-essential

echo "[2/4] Node 20 via NodeSource"
if ! command -v node >/dev/null || [[ "$(node -v | sed 's/v//' | cut -d. -f1)" -lt 20 ]]; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi
node -v
npm -v

echo "[3/4] pm2 (global)"
npm install -g pm2

echo "[4/4] nginx (only if missing)"
if ! command -v nginx >/dev/null; then
  apt-get install -y nginx
  systemctl enable nginx
  systemctl start nginx
fi

echo
echo "Done."
echo "Next: follow deploy/DEPLOY.md — clone the repo, run the app, hook nginx into Cloudflare."
