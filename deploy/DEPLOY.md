# Production deploy — Cloudflare in front, origin on port 80

Target architecture:

```
   user
    │ HTTPS
    ▼
Cloudflare edge (terminates TLS, "Flexible" SSL mode)
    │ HTTP  (X-Forwarded-Proto: https)
    ▼
194.31.173.119:80  ← nginx
    │ HTTP
    ▼
127.0.0.1:3000     ← Next.js (pm2)
```

Port 443 on this host is owned by xray (VPN). We do not touch it.
Cloudflare gives us valid HTTPS on the public side without any cert
work on the origin.

Server context (from the diagnostic dump):
- Ubuntu 22.04 at `194.31.173.119`, user `igor` (sudo + www-data).
- nginx already running and serving an old `aepovcg.ru` vhost.
- xray on `*:443`, `*:8443`. Untouched.
- No Node / pm2 yet.

## 0. Prep — Cloudflare account + Supabase

### 0.1 Cloudflare site

1. Register at https://dash.cloudflare.com/sign-up (free plan).
2. Click **Add a site** → enter `aepovcg.online` → Free plan.
3. Cloudflare scans existing DNS records. Confirm.
4. CF shows two nameservers (e.g. `something.ns.cloudflare.com`).
   Copy both — you'll paste them at Reg.ru in step 0.3.
5. Inside the site dashboard → **SSL/TLS** → **Overview** →
   set encryption mode to **Flexible**.
6. **SSL/TLS** → **Edge Certificates** → enable
   **Always Use HTTPS**, **Automatic HTTPS Rewrites**.

### 0.2 Cloudflare DNS records

In the site dashboard → **DNS** → **Records** → **Add record**:

| Type | Name   | Content         | Proxy status |
|------|--------|-----------------|--------------|
| A    | @      | 194.31.173.119  | Proxied (orange cloud) |
| A    | www    | 194.31.173.119  | Proxied (orange cloud) |
| A    | portal | 194.31.173.119  | Proxied (orange cloud) |

### 0.3 Reg.ru nameserver swap

In Reg.ru → Услуги → `aepovcg.online` → **DNS-серверы и управление
зоной** → переключи режим на «использовать внешние NS» (formulation
varies) → paste the two Cloudflare NS values from 0.1 → save.

Propagation: typically 30 min – 4 hours. CF emails you when the
domain becomes active on its side. You can keep working on the server
while you wait.

### 0.4 Supabase: rotate keys + URL config

Old keys leaked in chat; rotate before going live.

1. https://supabase.com/dashboard/project/awrnfgaqclfgrunetuhq/settings/api
2. **Generate new publishable key** → copy `sb_publishable_…`.
3. **Generate new secret key** → copy `sb_secret_…`.

Then **Authentication → URL Configuration**:
- **Site URL**: your real live portal origin
  - example: `https://portal.aepovcg.pro`
- **Additional Redirect URLs** (one per line):
  - your real live portal callback URL
    - example: `https://portal.aepovcg.pro/auth/callback`
  - `http://localhost:3000/auth/callback` *(keep for local dev)*

Save.

## 1. Server bootstrap

SSH in as `igor`.

### 1.1 Install Node + pm2

```bash
cd ~
curl -fsSL https://raw.githubusercontent.com/james2kzzwils-jpg/Site-test/devin/portal-phase-a/deploy/install-server.sh -o install-server.sh
sudo bash install-server.sh
```

Expected output: Node 20, pm2 installed, no errors.

### 1.2 Create app directory

```bash
sudo mkdir -p /opt/epov
sudo chown -R igor:igor /opt/epov
```

### 1.3 Clone the repo

```bash
cd /opt/epov
git clone https://github.com/james2kzzwils-jpg/Site-test.git site
cd site
git checkout devin/portal-phase-a
```

If the repo asks for credentials (it is currently private):
1. Generate a PAT at https://github.com/settings/tokens (classic, scope
   `repo`). Set a 30-day expiry.
2. Clone with `git clone https://USERNAME:TOKEN@github.com/james2kzzwils-jpg/Site-test.git site`.
3. Immediately scrub the token from the remote URL:
   `git remote set-url origin https://github.com/james2kzzwils-jpg/Site-test.git`.

### 1.4 Environment

```bash
cp deploy/env.example .env.local
nano .env.local
# Paste the rotated Supabase keys from step 0.4.
# IMPORTANT: set PORTAL_PUBLIC_URL to the exact live portal origin,
# for example https://portal.aepovcg.pro . Save.
chmod 600 .env.local
```

### 1.5 Build & run

```bash
cd /opt/epov/site
npm ci
npm run build
pm2 start deploy/ecosystem.config.js
pm2 save
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u igor --hp /home/igor
# pm2 prints a sudo command — run it to register the systemd unit.
```

Sanity check (still on the box):

```bash
curl -sI http://127.0.0.1:3000              # 200
curl -sI http://127.0.0.1:3000/portal/login # 200
pm2 status                                  # epov-web online
```

## 2. nginx — replace old aepovcg.ru config

### 2.1 Disable the old site

```bash
sudo rm -f /etc/nginx/sites-enabled/aepovcg.ru
# Keep the file in sites-available in case we need it later:
ls /etc/nginx/sites-available/aepovcg.ru   # should still exist
```

### 2.2 Install the new vhosts

```bash
sudo cp /opt/epov/site/deploy/nginx-aepovcg.conf  /etc/nginx/sites-available/aepovcg.online
sudo cp /opt/epov/site/deploy/nginx-portal.conf   /etc/nginx/sites-available/portal.aepovcg.online
sudo ln -sf /etc/nginx/sites-available/aepovcg.online        /etc/nginx/sites-enabled/
sudo ln -sf /etc/nginx/sites-available/portal.aepovcg.online /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

If `nginx -t` complains, paste the error and we'll fix it together
before reloading.

### 2.3 Optional: real client IP from Cloudflare

When Cloudflare proxies, the request reaches us from a CF edge IP.
To make the `$remote_addr` variable hold the real visitor IP, drop the
official CF IP ranges into nginx:

```bash
sudo tee /etc/nginx/conf.d/cloudflare-realip.conf >/dev/null <<'EOF'
# Trust Cloudflare edge IPs for X-Forwarded-For / CF-Connecting-IP.
set_real_ip_from 173.245.48.0/20;
set_real_ip_from 103.21.244.0/22;
set_real_ip_from 103.22.200.0/22;
set_real_ip_from 103.31.4.0/22;
set_real_ip_from 141.101.64.0/18;
set_real_ip_from 108.162.192.0/18;
set_real_ip_from 190.93.240.0/20;
set_real_ip_from 188.114.96.0/20;
set_real_ip_from 197.234.240.0/22;
set_real_ip_from 198.41.128.0/17;
set_real_ip_from 162.158.0.0/15;
set_real_ip_from 104.16.0.0/13;
set_real_ip_from 104.24.0.0/14;
set_real_ip_from 172.64.0.0/13;
set_real_ip_from 131.0.72.0/22;
set_real_ip_from 2400:cb00::/32;
set_real_ip_from 2606:4700::/32;
set_real_ip_from 2803:f800::/32;
set_real_ip_from 2405:b500::/32;
set_real_ip_from 2405:8100::/32;
set_real_ip_from 2a06:98c0::/29;
set_real_ip_from 2c0f:f248::/32;
real_ip_header CF-Connecting-IP;
EOF
sudo nginx -t && sudo systemctl reload nginx
```

(Source: https://www.cloudflare.com/ips/)

## 3. Smoke test

Once Cloudflare reports the domain active (you can check anytime with
`dig +short NS aepovcg.online` — it should return cloudflare.com NS).

From your laptop:

```bash
curl -sI https://aepovcg.online              # 200 from Cloudflare
curl -sI https://portal.aepovcg.online       # 302 → /portal
curl -sI https://portal.aepovcg.online/portal/login
```

In a browser:

1. Open your live portal origin → should land on `/portal/login`.
2. Enter your admin email → magic link arrives.
3. Click the link → land on `/portal/admin`. Header shows your email.
4. Verify clients list, project page, stage stepper, NDA controls.
5. Toggle EN/RU in the header.

## 4. Updates after first deploy

Push to `devin/portal-phase-a` (or `main` once merged). On the server:

```bash
cd /opt/epov/site
git pull
npm ci             # only when package-lock.json changed
npm run build
pm2 reload epov-web
```

Cloudflare aggressively caches static assets. After a deploy you may
want to purge the cache:
**Cloudflare dashboard → Caching → Configuration → Purge Everything**
(rare nuke) or **Custom Purge** by URL.

## 5. Rollback

```bash
cd /opt/epov/site
git log --oneline -n 10        # find target SHA
git checkout <sha>
npm ci
npm run build
pm2 reload epov-web
```

## 6. Useful pm2 commands

- `pm2 status` — running processes.
- `pm2 logs epov-web` — tail logs (Ctrl+C to stop tailing).
- `pm2 logs epov-web --err --lines 200` — last 200 error lines.
- `pm2 restart epov-web` — restart.
- `pm2 reload epov-web` — zero-downtime reload.
- `pm2 monit` — top-style monitor.

## 7. Security note — origin IP exposure

Right now the origin will still accept HTTP-80 requests from anyone,
not just Cloudflare. After deploy works, lock the origin to CF only:

```bash
# /etc/nginx/conf.d/cloudflare-only.conf
sudo tee /etc/nginx/conf.d/cloudflare-only.conf >/dev/null <<'EOF'
geo $is_cloudflare {
    default 0;
    173.245.48.0/20 1;
    103.21.244.0/22 1;
    103.22.200.0/22 1;
    103.31.4.0/22 1;
    141.101.64.0/18 1;
    108.162.192.0/18 1;
    190.93.240.0/20 1;
    188.114.96.0/20 1;
    197.234.240.0/22 1;
    198.41.128.0/17 1;
    162.158.0.0/15 1;
    104.16.0.0/13 1;
    104.24.0.0/14 1;
    172.64.0.0/13 1;
    131.0.72.0/22 1;
}
EOF
```

Then in each server block add: `if ($is_cloudflare = 0) { return 403; }`.

This is optional — start without it, add later if you care.
