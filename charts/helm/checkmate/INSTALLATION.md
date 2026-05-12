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
- `client.ingress.host` and `server.ingress.host` with your domain names
- `server.protocol` (usually http or https)
- Secrets under the `secrets` section (`JWT_SECRET`, email credentials, API keys, etc.) — replace all `change_me` values
- **For TLS/HTTPS**: Configure ingress TLS settings (see section below)
- **For external databases**: Set `mongodb.enabled: false` and provide `secrets.DB_CONNECTION_STRING`, or set `redis.enabled: true` to use the bundled Redis
- **To use a pre-existing Kubernetes Secret**: Set `secrets.existingSecret: "your-secret-name"` instead of inline values

### 3. Deploy the Helm chart
```bash
helm install checkmate ./charts/helm/checkmate --namespace checkmate --create-namespace
```
This will deploy the client, server, and MongoDB. Redis is disabled by default — set `redis.enabled: true` in `values.yaml` to include it.

### 4. Verify the deployment
Check pods and services:
```bash
kubectl get pods -n checkmate
kubectl get svc -n checkmate
```

Once all pods are `Running` and `Ready`, you can access Checkmate via the configured ingress hosts.

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

server:
  protocol: https
  ingress:
    enabled: true
    host: api.checkmate.example.com
    className: nginx
    annotations:
      cert-manager.io/cluster-issuer: "letsencrypt-prod"
    tls:
      enabled: true
      secretName: checkmate-server-tls
```

### Alternative: Using --set flags

You can also enable TLS during installation using Helm's `--set` flags:

```bash
helm install checkmate ./charts/helm/checkmate \
  --set client.protocol=https \
  --set server.protocol=https \
  --set client.ingress.annotations."cert-manager\.io/cluster-issuer"="letsencrypt-prod" \
  --set client.ingress.tls.enabled=true \
  --set client.ingress.tls.secretName=checkmate-client-tls \
  --set server.ingress.annotations."cert-manager\.io/cluster-issuer"="letsencrypt-prod" \
  --set server.ingress.tls.enabled=true \
  --set server.ingress.tls.secretName=checkmate-server-tls
```

### Verification

After deployment, cert-manager will automatically create the TLS secrets. You can verify the certificate status:

```bash
# Check certificates
kubectl get certificates -n checkmate

# Check certificate details
kubectl describe certificate checkmate-client-tls -n checkmate
kubectl describe certificate checkmate-server-tls -n checkmate

# Verify the secrets were created
kubectl get secrets -n checkmate | grep tls
```

The ingress will automatically use these secrets to enable HTTPS access to your Checkmate instance.

## Upgrading from v0.1.x

Persistence keys moved to component-scoped locations. The old keys are still accepted for backward compatibility, but new installations should use the new paths:

| Old (v0.1.x)                    | New (v0.2.0+)                      |
|---------------------------------|------------------------------------|
| `persistence.mongo.size`        | `mongodb.persistence.size`         |
| `persistence.redis.size`        | `redis.persistence.size`           |
| `persistence.mongo.storageClass`| `mongodb.persistence.storageClass` |
| `persistence.redis.storageClass`| `redis.persistence.storageClass`   |

Redis is now disabled by default. If you were using the bundled Redis, add `redis.enabled: true` to your values.
