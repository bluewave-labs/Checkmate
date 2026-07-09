# checkmate.so hosting (demo + staging)

Config for BlueWave's hosted instances at `demo.checkmate.so` and
`staging.checkmate.so`: one host, one nginx gateway terminating TLS, two
independent Checkmate stacks running the mono image
(`ghcr.io/bluewave-labs/checkmate`), plus a shared
[Capture](https://github.com/bluewave-labs/capture) agent. It replaces the old
`docker/unified/` setup (nginx client images + separate backend images + a
republished Mongo image) and doubles as a worked example of running the mono
image behind a TLS reverse proxy.

## How deploys work

`.github/workflows/build-image.yml` builds and pushes the image, then SSHes in
and runs `docker compose pull && docker compose up -d` in this directory:

- push to `develop` → image tagged `:develop` → `checkmate-staging` recreated
- push to `demo` → image tagged `:demo` → `checkmate-demo` recreated

The host keeps a git checkout of this repo; the deploy does `git pull` first so
compose/gateway changes land with the code.

## Host-local files (not committed)

Kept next to this compose file on the host:

- `server-prod.env` / `server-staging.env` — Checkmate server env
  (`DB_CONNECTION_STRING`, `JWT_SECRET`, `CLIENT_HOST=https://demo.checkmate.so`
  etc.). The old `UPTIME_APP_*` client vars are no-ops now and can be removed.
- `mongo-prod.env` / `mongo-staging.env` — Mongo credentials.
- `mongo/data-prod` / `mongo/data-staging` — Mongo data directories.

TLS certs live in `/etc/letsencrypt` (see `certbot-compose.yaml`; certbot
answers ACME challenges on port 8080 behind the gateway).

## One-time migration from docker/unified

1. `cd ~/checkmate && git pull` (must be on a branch containing this directory).
2. Stop the old stack: `cd docker/unified && docker compose down`.
3. Move host-local files here:
   `mv docker/unified/{server-prod.env,server-staging.env,mongo-prod.env,mongo-staging.env} docs/hosting/checkmate-so/`
   `mv docker/unified/mongo docs/hosting/checkmate-so/mongo`
4. **Check the Mongo data version before first start.** The old
   `checkmate:mongo-*` images were built `FROM mongo` (floating latest), so the
   data files follow whatever version was current at their last image build. Run
   `db.adminCommand({ getParameter: 1, featureCompatibilityVersion: 1 })`
   against the old container first and make the compose's `mongo:` tag match
   (checked 2026-07-09: both stacks report FCV 8.2, hence the `mongo:8.2` pin
   here). A lower pin than the data's FCV will refuse to start; a higher one
   should step up one release at a time.
5. `cd docs/hosting/checkmate-so && docker compose up -d`.
