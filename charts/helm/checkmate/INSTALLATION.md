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
- **If upgrading**: Migrate persistence settings from flat structure to nested:
  - Old: `persistence.mongodbSize` → New: `persistence.mongo.size`
  - Old: `persistence.redisSize` → New: `persistence.redis.size`
  - Add: `persistence.mongo.storageClass` and `persistence.redis.storageClass` (leave empty for default)
- Secrets under the `secrets` section (`JWT_SECRET`, email credentials, API keys, etc.) — replace all change_me values
- **For TLS/HTTPS**: Configure ingress TLS settings (see section below)

### 3. Deploy the Helm chart
```bash
helm install checkmate ./charts/helm/checkmate
```
This will deploy the client, server, MongoDB, and Redis components.

### 4. Verify the deployment
Check pods and services:
```bash
kubectl get pods
kubectl get svc
```

Once all pods are `Running` and `Ready`, you can access Checkmate via the configured ingress hosts.

## Enabling TLS/HTTPS with cert-manager

If you have [cert-manager](https://cert-manager.io/) installed in your cluster, you can enable automatic TLS certificate provisioning using Let's Encrypt or other certificate issuers.

### Prerequisites
- cert-manager installed in your cluster
- A ClusterIssuer or Issuer configured (e.g., `letsencrypt-prod`)

### Configuration

Edit `values.yaml` to enable TLS:

```yaml
client:
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
  ingress:
    enabled: true
    host: checkmate.example.com
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
kubectl get certificates

# Check certificate details
kubectl describe certificate checkmate-client-tls
kubectl describe certificate checkmate-server-tls

# Verify the secrets were created
kubectl get secrets | grep checkmate-tls
```

The ingress will automatically use these secrets to enable HTTPS access to your Checkmate instance.
