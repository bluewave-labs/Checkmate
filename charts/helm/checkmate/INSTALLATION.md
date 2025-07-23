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
- Secrets under the `secrets` section (`JWT_SECRET`, email credentials, API keys, etc.) — replace all change_me values

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
