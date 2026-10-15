# Kubernetes Installation Guide for Checkmate

This guide walks you through deploying Checkmate on Kubernetes using Helm.

## Prerequisites

- A running Kubernetes cluster
- Helm CLI installed and configured
- `kubectl` configured to access your cluster

## Chart layout

The Checkmate chart is an umbrella chart:

- `client` and `server` use the `bjw-s-labs/app-template` chart.
- `mongodb` uses the Bitnami MongoDB chart.
- `redis` uses the Bitnami Redis chart and is disabled by default.
- The parent chart renders shared preflight checks and the `checkmate-secrets` Secret.

This keeps the chart customizable without copying Kubernetes primitives into local templates.

## Install

```bash
git clone https://github.com/bluewave-labs/checkmate.git
cd checkmate/charts/helm/checkmate
helm dependency update
helm install checkmate . -f values.yaml
```

Before installing, replace every `change_me` value in `values.yaml`.

At minimum, set:

- `client.ingress.main.hosts[0].host`
- `server.ingress.main.hosts[0].host`
- `client.controllers.main.containers.main.env.UPTIME_APP_API_BASE_URL`
- `client.controllers.main.containers.main.env.UPTIME_APP_CLIENT_HOST`
- `server.controllers.main.containers.main.env.CLIENT_HOST`
- `secrets.JWT_SECRET`

## External MongoDB or Redis

Disable bundled dependencies when you provide your own services:

```yaml
mongodb:
  enabled: false

redis:
  enabled: false

secrets:
  DB_CONNECTION_STRING: "mongodb://external-mongodb:27017/uptime_db"
  REDIS_HOST: "external-redis"
  REDIS_PORT: "6379"
```

When bundled MongoDB is enabled, the default `DB_CONNECTION_STRING` uses the Helm release name:

```yaml
secrets:
  DB_CONNECTION_STRING: "mongodb://{{ .Release.Name }}-mongodb:27017/uptime_db"
```

When bundled Redis is enabled, use the Bitnami Redis service name:

```yaml
redis:
  enabled: true

secrets:
  REDIS_HOST: "{{ .Release.Name }}-redis-master"
  REDIS_PORT: "6379"
```

## Persistence

MongoDB persistence is controlled through the Bitnami MongoDB chart values:

```yaml
mongodb:
  persistence:
    enabled: true
    size: 5Gi
    storageClass: ""
```

Redis persistence is controlled through the Bitnami Redis chart values:

```yaml
redis:
  master:
    persistence:
      enabled: true
      size: 1Gi
      storageClass: ""
```

Set `storageClass` to an empty string to use the cluster default.

## TLS/HTTPS

Ingress settings now follow the app-template value shape. A cert-manager example:

```yaml
client:
  global:
    nameOverride: client
  controllers:
    main:
      containers:
        main:
          env:
            UPTIME_APP_API_BASE_URL: "https://api.checkmate.example.com/api/v1"
            UPTIME_APP_CLIENT_HOST: "https://checkmate.example.com"
  ingress:
    main:
      className: nginx
      annotations:
        cert-manager.io/cluster-issuer: "letsencrypt-prod"
      hosts:
        - host: checkmate.example.com
          paths:
            - path: /
              pathType: Prefix
              service:
                identifier: main
                port: http
      tls:
        - secretName: checkmate-client-tls
          hosts:
            - checkmate.example.com

server:
  global:
    nameOverride: server
  controllers:
    main:
      containers:
        main:
          env:
            CLIENT_HOST: "https://checkmate.example.com"
  ingress:
    main:
      className: nginx
      annotations:
        cert-manager.io/cluster-issuer: "letsencrypt-prod"
      hosts:
        - host: api.checkmate.example.com
          paths:
            - path: /api/v1
              pathType: Prefix
              service:
                identifier: main
                port: http
      tls:
        - secretName: checkmate-server-tls
          hosts:
            - api.checkmate.example.com
```

After deployment, verify:

```bash
kubectl get pods
kubectl get svc
kubectl get ingress
```
