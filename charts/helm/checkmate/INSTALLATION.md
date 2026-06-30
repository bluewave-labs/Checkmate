# Kubernetes Installation Guide for Checkmate

This guide walks you through deploying Checkmate on your Kubernetes cluster using Helm.

## Prerequisites

- A running Kubernetes cluster
- Helm CLI installed and configured
- `kubectl` configured to access your cluster

## Steps

### 1. Clone the repo and navigate to the Helm chart

```bash
git clone https://github.com/bluewave-labs/checkmate.git
cd checkmate/charts/helm/checkmate
```

### 2. Customize values.yaml
Edit `values.yaml` to update:
- `client.ingress.host` and `api.ingress.host` with your domain names
- `api.protocol` (usually http or https)
- **If upgrading**: Migrate persistence settings from flat structure to nested:
  - Old: `persistence.mongodbSize` → New: `persistence.mongo.size`
  - Add: `persistence.mongo.storageClass` (leave empty for default)
- Secrets under the `secrets` section (`JWT_SECRET`, email credentials, API keys, etc.) — replace all change_me values
- **For TLS/HTTPS**: Configure ingress TLS settings (see section below)

### 3. Deploy the Helm chart
```bash
helm install checkmate ./charts/helm/checkmate
```
This will deploy the client, api, and MongoDB components.

### 4. Verify the deployment
Check pods and services:
```bash
kubectl get pods
kubectl get svc
```

Once all pods are `Running` and `Ready`, you can access Checkmate via the configured ingress hosts.

## Upgrading from a previous release

This release renames the `server.*` value block to `api.*` and drops the (unused) bundled Redis.
Read this before running `helm upgrade` on an existing install.

### `server.*` → `api.*` (values rename)

The value block formerly named `server` is now `api` (`server.image` → `api.image`,
`server.ingress.host` → `api.ingress.host`, `server.protocol` → `api.protocol`, `server.resources`,
`server.affinity`, `server.tolerations`, `server.ingress.*`, etc.).

**Your existing `server.*` overrides keep working** — the chart merges any legacy `server.*` values on
top of the `api.*` defaults (legacy wins where set), so an unchanged values file upgrades cleanly. The
shim is transitional; migrate your overrides to `api.*` at your convenience and drop the `server:`
block. If you set **both** `server.*` and `api.*` for the same field, the legacy `server.*` value wins —
don't mix them.

### Resource renames cause a replace, not a rename

The Kubernetes objects are renamed alongside the values:

| Old object | New object |
| --- | --- |
| Deployment/Service `checkmate-server` | `checkmate-api` |
| Ingress `checkmate-server-ingress` | `checkmate-api-ingress` |
| ConfigMap `checkmate-server-nginx-cm` | `checkmate-client-nginx-cm` |

Helm deletes the old objects and creates the new ones on upgrade. Expect a brief API restart and a
**new ClusterIP** for the API Service — update anything outside the chart that referenced the
`checkmate-server` Service by name. MongoDB data (its PVC) is untouched.

### Redis removed

The bundled Redis StatefulSet/Service and the `redis.*` / `persistence.redis.*` values are gone — the
scheduler runs in-process and never used them. Default installs (`redis.enabled: false`) are
unaffected. If you had explicitly set `redis.enabled: true`, **the Redis StatefulSet and its PVC are
deleted on upgrade** — back up anything you stored there first. Leftover `redis:` / `persistence.redis:`
keys in your values file are harmless (ignored).

### New secret defaults

`NODE_ENV: production`, `LOG_LEVEL: info`, and `TOKEN_TTL: 99d` are now part of the default `secrets`
block and merge into your install unless you override them. Set them explicitly if you relied on
different values (e.g. a non-production `NODE_ENV`).

## Scaling: the worker tier & autoscaling

By default the chart runs a single all-in-one API pod that both schedules **and** processes monitoring
jobs (`worker.enabled: false`). For larger deployments you can split processing onto a dedicated,
horizontally-scalable worker tier.

### Topology

| `worker.enabled` | API (`checkmate-api`) | Worker (`checkmate-worker`) |
| --- | --- | --- |
| `false` (default) | schedules **and** processes jobs (`QUEUE_PRIMARY_PROCESSES=true`) | not deployed |
| `true` | schedules + serves the API only (`QUEUE_PRIMARY_PROCESSES=false`, derived) | processes all jobs |

`QUEUE_PRIMARY_PROCESSES` is **derived** from `worker.enabled` — you never set it directly, so the API
and worker tier can never both process (or both ignore) the queue.

### Enabling the worker tier

```yaml
worker:
  enabled: true
  replicas: 2   # used only when autoscaling.enabled = false
```

The worker takes **no inbound traffic** (no Service): the kubelet probes pod IPs directly on
`HEALTH_PORT` (`/livez`, `/readyz`), and graceful shutdown drains in-flight jobs before exit.

> **Invariant:** `worker.terminationGracePeriodSeconds` (default `30`) **must stay greater than the
> server drain timeout (25s)**. Lower it and Kubernetes SIGKILLs workers mid-drain, losing in-flight
> checks.

> **Caveat:** with the worker tier enabled the API no longer processes jobs, so if **all** workers are
> down nothing processes. The `autoscaling.minReplicaCount: 1` floor plus liveness restarts mitigate
> this; full failover to the API would need leader election (not supported).

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
Deployment between `minReplicaCount` and `maxReplicaCount`. When autoscaling is on, the Deployment
omits `replicas` so it doesn't fight the HPA KEDA creates. Make sure `autoscaling.mongo.dbName`
matches the database name in your `DB_CONNECTION_STRING`, or the scaler counts the wrong DB (always 0
backlog → never scales up).

#### Fallback: Prometheus-adapter HPA (not shipped)

If your KEDA/Mongo versions reject the `$$NOW`/`$toLong` query, or you already run Prometheus, scrape
the worker's `/metrics` (`checkmate_worker_due_backlog`), expose it via prometheus-adapter, and target
it with a standard `HorizontalPodAutoscaler`. The manifest is left to the operator; the app computes
`now` in code on this path, so the query coercion is unnecessary.

## Enabling TLS/HTTPS with cert-manager

If you have [cert-manager](https://cert-manager.io/) installed in your cluster, you can enable automatic TLS certificate provisioning using Let's Encrypt or other certificate issuers.

### Prerequisites
- cert-manager installed in your cluster
- A ClusterIssuer or Issuer configured (e.g., `letsencrypt-prod`)

### Configuration

Edit `values.yaml` to enable TLS (and update protocols to https):

```yaml
client:
  protocol: https
  ingress:
    enabled: true
    host: checkmate.example.com
    className: nginx
    annotations:
      cert-manager.io/cluster-issuer: "letsencrypt-prod"
    tls:
      enabled: true
      secretName: checkmate-client-tls

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
      secretName: checkmate-api-tls
```

### Alternative: Using --set flags

You can also enable TLS during installation using Helm's `--set` flags:

```bash
helm install checkmate ./charts/helm/checkmate \
  --set client.protocol=https \
  --set api.protocol=https \
  --set client.ingress.annotations."cert-manager\.io/cluster-issuer"="letsencrypt-prod" \
  --set client.ingress.tls.enabled=true \
  --set client.ingress.tls.secretName=checkmate-client-tls \
  --set api.ingress.annotations."cert-manager\.io/cluster-issuer"="letsencrypt-prod" \
  --set api.ingress.tls.enabled=true \
  --set api.ingress.tls.secretName=checkmate-api-tls
```

### Verification

After deployment, cert-manager will automatically create the TLS secrets. You can verify the certificate status:

```bash
# Check certificates
kubectl get certificates

# Check certificate details
kubectl describe certificate checkmate-client-tls
kubectl describe certificate checkmate-api-tls

# Verify the secrets were created
kubectl get secrets | grep checkmate-tls
```

The ingress will automatically use these secrets to enable HTTPS access to your Checkmate instance.
