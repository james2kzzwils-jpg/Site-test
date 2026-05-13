# Production deploy guide

End-to-end walkthrough to host the marketing site + client portal on
your own VPS behind nginx with the existing SSL certificate.

Architecture:
- One Next.js process listens on `127.0.0.1:3000` (PM2 keeps it alive).
- `aepovcg.online` → marketing portfolio (everything served from `/`,
  `/works/*`, etc.).
- `portal.aepovcg.online` → client portal. The root path `/` redirects
  to `/portal` so a client just types the host name.
- nginx terminates TLS, proxies to Next.js, and redirects any `/portal`
  or `/auth` traffic from the apex domain onto the portal subdomain so
  Supabase callbacks always land on one canonical origin.

## 0. Before you SSH in

### 0.1 Rotate Supabase keys

The previous publishable/secret keys leaked in chat. Replace them
before deploying.

1. Open https://supabase.com/dashboard/project/awrnfgaqclfgrunetuhq/settings/api
2. Click **Generate new publishable key** → copy the new `sb_publishable_…`.
3. Click **Generate new secret key** → copy the new `sb_secret_…`.
4. The old keys are auto-invalidated once new ones are generated.

Keep both new values in a password manager — you will paste them into
`/opt/epov/site/.env.local` on the server in step 4.

### 0.2 Configure Supabase auth URLs

Same dashboard, **Authentication → URL Configuration**:

- **Site URL**: `https://portal.aepovcg.online`
- **Additional Redirect URLs** (one per line):
  - `https://portal.aepovcg.online/auth/callback`
  - `http://localhost:3000/auth/callback` *(keep for local dev)*

Hit **Save**. Without this, magic links from production will redirect
to the wrong place.

### 0.3 DNS

At your domain registrar, add the following records on `aepovcg.online`:

- `A` `@`     → SERVER_IPV4  (TTL 300)
- `A` `www`   → SERVER_IPV4  (TTL 300)
- `A` `portal` → SERVER_IPV4  (TTL 300)

If you have IPv6, add matching `AAAA` records too. Propagation usually
takes a few minutes. Check with `dig +short portal.aepovcg.online`.

## 1. Provision the server

SSH into the box as root or a sudo user.

### 1.1 Bootstrap

Copy `deploy/install-server.sh` from the repo to the server (or
download it directly), then:

```bash
sudo bash install-server.sh
```

This installs Node 20, nginx, PM2, git, and opens 80/443 in ufw. It
also creates `/etc/ssl/aepovcg/` and `/var/www/letsencrypt/`.

### 1.2 Create the deploy user (recommended)

```bash
sudo adduser --disabled-password --gecos "" epov
sudo usermod -aG sudo epov   # optional, only if epov needs sudo
sudo mkdir -p /opt/epov
sudo chown -R epov:epov /opt/epov
sudo -iu epov                # become the deploy user
```

The remaining steps assume you are logged in as `epov` (or root + a
matching `cd /opt/epov`).

## 2. SSL certificate

Put your existing cert files at:

- `/etc/ssl/aepovcg/fullchain.pem` — cert + chain (server cert first,
  then intermediates). If you only have separate `cert.pem` and
  `chain.pem`, concatenate them: `cat cert.pem chain.pem > fullchain.pem`.
- `/etc/ssl/aepovcg/privkey.pem` — private key.

Lock down permissions:

```bash
sudo chmod 600 /etc/ssl/aepovcg/privkey.pem
sudo chmod 644 /etc/ssl/aepovcg/fullchain.pem
sudo chown root:root /etc/ssl/aepovcg/*
```

Important: the certificate must cover **both** `aepovcg.online` and
`portal.aepovcg.online`. Acceptable forms:
- A single cert with both names as SAN.
- A wildcard `*.aepovcg.online` + the apex name as SAN. Plain wildcard
  alone does NOT cover the apex.

## 3. Clone & build the app

As `epov` (or whoever owns `/opt/epov`):

```bash
cd /opt/epov
git clone https://github.com/james2kzzwils-jpg/Site-test.git site
cd site
git checkout main   # or devin/portal-phase-a if not yet merged
```

If the repo is private, generate a personal access token at
https://github.com/settings/tokens (classic, scope `repo`) and use:

```bash
git clone https://USERNAME:TOKEN@github.com/james2kzzwils-jpg/Site-test.git site
```

Then immediately scrub the token from history:

```bash
cd site
git remote set-url origin https://github.com/james2kzzwils-jpg/Site-test.git
```

## 4. Environment

```bash
cd /opt/epov/site
cp deploy/env.example .env.local
nano .env.local   # paste the rotated Supabase keys from step 0.1
chmod 600 .env.local
```

## 5. Build + run

```bash
cd /opt/epov/site
npm ci
npm run build
pm2 start deploy/ecosystem.config.js
pm2 save                    # persist process list
sudo pm2 startup systemd -u epov --hp /home/epov   # auto-start on reboot
# pm2 prints a command that registers the systemd unit — run it.
```

Verify locally:

```bash
curl -I http://127.0.0.1:3000               # should return 200
curl -I http://127.0.0.1:3000/portal/login  # should return 200
```

Useful pm2 commands later:
- `pm2 status` — see process state.
- `pm2 logs epov-web` — tail logs.
- `pm2 restart epov-web` — after a code update.
- `pm2 reload epov-web` — zero-downtime restart.

## 6. nginx

Copy the vhost configs from the repo into nginx and enable them:

```bash
sudo cp /opt/epov/site/deploy/nginx-aepovcg.conf /etc/nginx/sites-available/aepovcg.online
sudo cp /opt/epov/site/deploy/nginx-portal.conf  /etc/nginx/sites-available/portal.aepovcg.online
sudo ln -sf /etc/nginx/sites-available/aepovcg.online        /etc/nginx/sites-enabled/
sudo ln -sf /etc/nginx/sites-available/portal.aepovcg.online /etc/nginx/sites-enabled/

# If a default site is enabled and would conflict on port 80/443:
sudo rm -f /etc/nginx/sites-enabled/default

sudo nginx -t
sudo systemctl reload nginx
```

## 7. Smoke test

From your laptop:

```bash
curl -I https://aepovcg.online
curl -I https://portal.aepovcg.online             # should 302 → /portal
curl -I https://portal.aepovcg.online/portal/login
```

Then in a browser:

1. Open `https://portal.aepovcg.online`. Should land on `/portal/login`.
2. Enter your admin email. A magic link email arrives.
3. Click the link → land on `/portal/admin`. Confirm the email/role
   shown in the header is correct.
4. Open a client (or create one). Verify projects render, the stage
   stepper appears, breadcrumbs work.
5. From a client account (or `/portal/client` directly), confirm the
   read-only view works.

## 8. Updates after first deploy

Push changes to `main`. On the server:

```bash
cd /opt/epov/site
git pull
npm ci             # only when package-lock changes
npm run build
pm2 reload epov-web
```

If you ever change nginx configs in `deploy/*.conf`, repeat step 6 to
re-copy them.

## 9. Rollback

Each deploy is the contents of `.next/`. To roll back to a previous
commit:

```bash
cd /opt/epov/site
git log --oneline -n 10        # find target SHA
git checkout <sha>
npm ci
npm run build
pm2 reload epov-web
```

## 10. What's NOT included yet

These will be deployed automatically by re-running step 8 once Phase B
ships:

- Round comments (admin + client thread per stage).
- File uploads via Supabase Storage + paste-from-clipboard for
  screenshots.
- Auto-sync of `is_public_portfolio` projects to the marketing
  `/works` section.
