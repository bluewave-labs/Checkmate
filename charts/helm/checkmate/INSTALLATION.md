# Kubernetes Installation Guide for Checkmate

This guide walks you through deploying Checkmate on your Kubernetes cluster using Helm.

## Prerequisites

- A running Kubernetes cluster
- Helm CLI installed and configured (CI-tested with Helm v4.2.2)
- `kubectl` configured to access your cluster

## What the chart deploys (chart 0.3.x)

Since Checkmate consolidated into an all-in-one image, this chart runs **one application
workload** (plus MongoDB):

| Component | Kind | Image | Notes |
| --- | --- | --- | --- |
| `checkmate-api` | Deployment | `ghcr.io/bluewave-labs/checkmate` | Serves the SPA, `/api/v1`, `/api-docs` and `/config.js` from one process; schedules **and** processes monitoring jobs unless the worker tier is enabled |
| `checkmate-worker` | Deployment (optional) | `ghcr.io/bluewave-labs/checkmate` | Same image with `QUEUE_MODE=worker`; enable with `worker.enabled: true` |
| `checkmate-api-ingress` | Ingress | — | Routes `/` to the API service (single public host) |
| `checkmate-mongodb` | StatefulSet + Service | `mongo:8.2.12` (upstream) | StatefulSet with one PVC (`checkmate-mongo-persistent-storage-checkmate-mongodb-0`) |
| `checkmate-secrets` | Secret | — | `DB_CONNECTION_STRING`, `JWT_SECRET`, `NODE_ENV`, `LOG_LEVEL`, `TOKEN_TTL` (+ optional `CLIENT_HOST`) |

The client tier that used to run as a separate nginx Deployment (images
`checkmate-client` / `checkmate-backend` / `checkmate-mongo`) is gone — those images stopped
being published at v3.9.2, and the all-in-one image serves the built frontend from the API
process.

## Steps

### 1. Clone the repo and navigate to the Helm chart

```bash
git clone https://github.com/bluewave-labs/checkmate.git
cd checkmate/charts/helm/checkmate
```

### 2. Customize values.yaml

Edit `values.yaml`:

- `api.ingress.host` — **the** public hostname. The all-in-one server serves the UI and the
  API from this single host, so there is no separate `client.ingress.host` anymore.
- `api.protocol` — `http` or `https` (set `https` when TLS is enabled; see the TLS section).
- Secrets under the `secrets` section — replace all `change_me` values (`JWT_SECRET` and any
  email/API keys). `CLIENT_HOST` is derived from `api.protocol` + `api.ingress.host`; set it
  explicitly only when the app is reachable at a different URL than the ingress host (e.g. an
  external TLS proxy).
- **If upgrading from 0.2.x**: read the [Upgrading from chart 0.2.x](#upgrading-from-chart-02x)
  section first — several keys moved or were removed.
- `mongodb.tag` — upstream Mongo version, independent of the Checkmate version. The default
  (`8.2.12`) matches the data files chart-era installs already have. Keep it at or above the
  featureCompatibilityVersion of your Mongo data (see the Mongo section below).

### 3. Deploy the Helm chart

```bash
helm install checkmate .
```

This deploys the API (all-in-one), its ingress, the optional worker (off by default) and MongoDB.

### 4. Verify the deployment

Check pods and services:

```bash
kubectl get pods
kubectl get svc
```

Once all pods are `Running` and `Ready`, Checkmate is served at your `api.ingress.host`. Without
an ingress controller you can verify locally with a port-forward:

```bash
kubectl port-forward svc/checkmate-api 52345:52345
curl http://localhost:52345/api/v1/health   # {"status":"OK"}
curl http://localhost:52345/                # SPA index.html
curl http://localhost:52345/config.js       # window.__CHECKMATE_CONFIG__ = ...
```

## Upgrading from chart 0.2.x

Chart 0.3.0 migrates the chart to the all-in-one image. It is a **breaking** chart version: the
client tier is removed and some values keys moved. Read this before running `helm upgrade` on an
existing install.

### Why this is a breaking change

The old chart referenced three images the CI no longer publishes:

| 0.2.x image | Status |
| --- | --- |
| `ghcr.io/bluewave-labs/checkmate-client` | frozen at v3.9.2, not built anymore |
| `ghcr.io/bluewave-labs/checkmate-backend` | frozen at v3.9.2, not built anymore |
| `ghcr.io/bluewave-labs/checkmate-mongo` | frozen at v3.9.2, not built anymore |

Only `ghcr.io/bluewave-labs/checkmate` (all-in-one) and the transitional
`checkmate-backend-mono` alias are published. The chart was pinned to `appVersion: v3.8.1`
because nothing newer existed for the old images. 0.3.0 moves everything onto the image that
actually gets published, and `appVersion` tracks releases again.

### Object changes on upgrade

| 0.2.x object | 0.3.0 |
| --- | --- |
| Deployment/Service `checkmate-client` | **removed** (UI is served by the API pod) |
| ConfigMap `checkmate-client-nginx-cm` | **removed** |
| Ingress `checkmate-client-ingress` | **removed** (its `/` route moves onto the API ingress) |
| Deployment/Service `checkmate-api` | unchanged names; pod image becomes `checkmate` |
| Ingress `checkmate-api-ingress` | unchanged name; now routes `/` (SPA + API + `/api-docs`) |
| StatefulSet/Service `checkmate-mongodb` | unchanged names; container image becomes upstream `mongo:8.2.12` |
| PVC | **untouched** — same names, same data |

### Upgrade procedure

1. Dump your current values (keep a backup):

```bash
helm get values checkmate -n <namespace> -o yaml > values-0.2.yaml
cp values-0.2.yaml values-0.3.yaml
```

2. Edit `values-0.3.yaml`:

- **Delete the whole `client:` block.** The chart refuses to install while it is present (the
  precheck error tells you this). The all-in-one image serves the UI from the API host.
- **Move `client.protocol` to `api.protocol`, and move the old `client.ingress.*` settings
  onto `api.ingress.*`** — host, class name, annotations and TLS settings. Prefer the **old
  client hostname** so the public URL of your UI does not change (the old API hostname is
  replaced by it). This matters for HTTPS upgrades: `api.protocol` must become `https` when
  TLS is enabled.
- **If TLS was enabled**: set `api.ingress.tls.enabled: true` and point
  `api.ingress.tls.secretName` at your existing certificate secret (the 0.2.x default was
  `<release>-client-tls`) so the same certificate keeps serving the same hostname; set
  `api.protocol: https`.
- Remove legacy image pins: any `api.image`/`server.image`/`worker.image` pointing at
  `checkmate-client`/`checkmate-backend`/`checkmate-backend-mono`, and any `mongodb.image`
  pointing at `checkmate-mongo`. The prechecks reject them with guidance if you miss one.
- Set `mongodb.tag` to an upstream Mongo version (default `"8.2.12"`) — it no longer defaults
  to the chart's `appVersion`.
- Remove `secrets.CLIENT_HOST` unless you deliberately serve the UI from a different URL than
  the ingress host; a leftover `change_me` value is ignored (treated as unset).
- Keep everything else (custom secrets such as notification/API keys, resources, persistence,
  worker settings).

3. Upgrade — **use `--reset-values` with your migrated file**. Do **not** use `--reuse-values`
   for this migration: it would retain the deleted `client:` key (and other removed defaults)
   from the old release, tripping the migration precheck forever.

```bash
helm upgrade checkmate . \
  --namespace <namespace> \
  --reset-values \
  --values values-0.3.yaml \
  --wait \
  --timeout 10m
```

4. Verify: `kubectl get pods` — the API pod restarts on the all-in-one image and MongoDB rolls
   to `mongo:8.2.12` on the **same PVC**. Your data is untouched. The client Deployment,
   Service, Ingress and ConfigMap are deleted.

### MongoDB: version compatibility (read before upgrading)

Chart-era installs used the custom `checkmate-mongo` image, which was built `FROM mongo`
(floating), so existing PVCs hold data files written by MongoDB **8.2** (FCV 8.2). mongod
refuses to start on data files newer than itself, which is why the chart defaults to the exact
upstream patch `mongo:8.2.12`:

- Keep `mongodb.tag` **at or above** the FCV of your data. The default covers every
  chart-created PVC. Going *lower* (e.g. `mongo:8.0`) will make mongod refuse to start on the
  existing PVC — that would require a `mongodump`/`mongorestore` migration, not an in-place
  upgrade.
- Going *higher* than the data's FCV should step up one release at a time.
- **Take a snapshot/backup before changing database images.**

Check your current FCV before changing the tag:

```bash
kubectl exec checkmate-mongodb-0 -- mongosh --quiet \
  --eval "db.adminCommand({getParameter:1, featureCompatibilityVersion:1}).featureCompatibilityVersion.version"
```

Mongo version changes are independent of the Checkmate `appVersion`: bumping the chart to a
newer Checkmate release never moves Mongo's tag.

### `server.*` → `api.*` compatibility (from 0.1.x)

The `server.*` value block was renamed to `api.*` in an earlier release; 0.3.0 still merges any
legacy `server.*` overrides on top of the `api.*` defaults (legacy wins where set), so
`server.ingress.host` and `server.image` keep working — but note the migration prechecks run
against the merged result, so a legacy `server.image` pin on a retired image is still rejected.
Migrate any remaining `server.*` overrides to `api.*` and drop the block.

## Enabling TLS/HTTPS with cert-manager

With a single ingress, TLS is configured on `api.ingress.*`:

```yaml
api:
  protocol: https
  ingress:
    enabled: true
    host: checkmate.example.com
    className: nginx
    annotations:
      cert-manager.io/cluster-issuer: "letsencrypt-prod"
    tls:
      enabled: true
      # secretName: checkmate-api-tls   # Optional; defaults to <release>-api-tls
```

Provide **either** a cert-manager issuer annotation (`cert-manager.io/cluster-issuer` or
`cert-manager.io/issuer`, letting cert-manager create the secret) **or** an explicit
`tls.secretName` pointing at an existing certificate secret (e.g. your old `<release>-client-tls`
when upgrading from 0.2.x). The chart's prechecks reject TLS with neither.

### Alternative: Using --set flags

```bash
helm install checkmate . \
  --set api.protocol=https \
  --set api.ingress.annotations."cert-manager\.io/cluster-issuer"="letsencrypt-prod" \
  --set api.ingress.tls.enabled=true
```

### Verification

```bash
kubectl get certificates
kubectl describe certificate checkmate-api-tls
```

## Scaling: the worker tier & autoscaling

By default the chart runs a single all-in-one API pod that serves the UI/API **and** schedules
**and** processes monitoring jobs (`worker.enabled: false`). For larger deployments you can
split processing onto a dedicated, horizontally-scalable worker tier running the same
all-in-one image with `QUEUE_MODE=worker`.

### Topology

| `worker.enabled` | API (`checkmate-api`) | Worker (`checkmate-worker`) |
| --- | --- | --- |
| `false` (default) | serves UI/API; schedules **and** processes jobs (`QUEUE_PRIMARY_PROCESSES=true`) | not deployed |
| `true` | serves UI/API; schedules only (`QUEUE_PRIMARY_PROCESSES=false`, derived) | processes all jobs |

`QUEUE_PRIMARY_PROCESSES` is **derived** from `worker.enabled` — you never set it directly, so
the API and worker tier can never both process (or both ignore) the queue.

### Enabling the worker tier

```yaml
worker:
  enabled: true
  replicas: 2   # used only when autoscaling.enabled = false
```

The worker takes **no inbound traffic** (no Service): the kubelet probes pod IPs directly on
`HEALTH_PORT` (`/livez`, `/readyz`), and graceful shutdown drains in-flight jobs before exit.

> **Invariant:** `worker.terminationGracePeriodSeconds` (default `30`) **must stay greater than
> the server drain timeout (25s)**. Lower it and Kubernetes SIGKILLs workers mid-drain, losing
> in-flight checks.

> **Caveat:** with the worker tier enabled the API no longer processes jobs, so if **all**
> workers are down nothing processes. The `autoscaling.minReplicaCount: 1` floor plus liveness
> restarts mitigate this; full failover to the API would need leader election (not supported).

### Autoscaling with KEDA

Backlog-driven autoscaling is **off by default** and requires the
[KEDA operator](https://keda.sh/) installed in-cluster. Enable it with:

```yaml
worker:
  enabled: true
  autoscaling:
    enabled: true
    minReplicaCount: 1     # processing floor — never 0, or checks silently stall
    maxReplicaCount: 10
    backlogPerReplica: 50  # target due-job backlog per worker
    mongo:
      dbName: uptime_db    # MUST match the database in DB_CONNECTION_STRING
```

A KEDA `ScaledObject` queries MongoDB directly for the due-check backlog and scales the worker
Deployment between `minReplicaCount` and `maxReplicaCount`. When autoscaling is on, the
Deployment omits `replicas` so it doesn't fight the HPA KEDA creates. Make sure
`autoscaling.mongo.dbName` matches the database name in your `DB_CONNECTION_STRING`, or the
scaler counts the wrong DB (always 0 backlog → never scales up).

## Image tags follow the chart's `appVersion`

The api and worker tiers default to the chart's `appVersion`, so they move together when you
upgrade the chart:

```yaml
api:
  image: ghcr.io/bluewave-labs/checkmate   # repo only
  tag: ""            # empty → Chart.appVersion; set e.g. "v3.11.0" to pin, or "latest" for a dev tag
```

- `api.tag` overrides the version for the api tier; the `worker` tier inherits `api.image` and
  `api.tag` unless you set `worker.image` / `worker.tag`.
- If you put a **full `repo:tag`** in `image`, it is used verbatim and the `tag` field is ignored.
- **`mongodb.tag` is the exception**: it names an upstream Mongo version (`"8.2.12"`) and never
  defaults to `appVersion` — the chart's prechecks enforce this.

**Prefer a pinned tag over `latest`.** With the default `imagePullPolicy: IfNotPresent`,
`latest` is cached per node and never refreshed, and `helm rollback` can't move a floating
tag — pin a version (or let it default to `appVersion`) for reproducible, rollback-able deploys.
