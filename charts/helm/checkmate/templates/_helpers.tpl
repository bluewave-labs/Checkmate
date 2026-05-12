{{/*
Expand the name of the chart.
*/}}
{{- define "checkmate.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully-qualified app name, truncated at 63 chars.
If the release name already contains the chart name, the chart name is omitted.
*/}}
{{- define "checkmate.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Chart name + version as a label value.
*/}}
{{- define "checkmate.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Namespace — honours namespaceOverride when set.
*/}}
{{- define "checkmate.namespace" -}}
{{- default .Release.Namespace .Values.namespaceOverride }}
{{- end }}

{{/*
Common labels applied to every resource (includes chart version — do not use in selectors).
*/}}
{{- define "checkmate.labels" -}}
helm.sh/chart: {{ include "checkmate.chart" . }}
{{ include "checkmate.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- with .Values.global.labels }}
{{ toYaml . }}
{{- end }}
{{- end }}

{{/*
Selector labels — immutable after first deploy, must NOT include chart version.
*/}}
{{- define "checkmate.selectorLabels" -}}
app.kubernetes.io/name: {{ include "checkmate.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Component-specific selector labels (used in Deployment.spec.selector and Service.spec.selector).
Usage: {{ include "checkmate.componentSelectorLabels" (dict "root" . "component" "client") }}
*/}}
{{- define "checkmate.componentSelectorLabels" -}}
{{ include "checkmate.selectorLabels" .root }}
app.kubernetes.io/component: {{ .component }}
{{- end }}

{{/*
Full label set for a specific component (common labels + component selector).
Usage: {{ include "checkmate.componentLabels" (dict "root" . "component" "client") }}
*/}}
{{- define "checkmate.componentLabels" -}}
{{ include "checkmate.labels" .root }}
app.kubernetes.io/component: {{ .component }}
{{- end }}

{{/*
Name of the Secret resource holding server environment variables.
Returns the existingSecret name when provided, otherwise the chart-generated name.
*/}}
{{- define "checkmate.secretName" -}}
{{- if .Values.secrets.existingSecret }}
{{- .Values.secrets.existingSecret }}
{{- else }}
{{- printf "%s-secrets" (include "checkmate.fullname" .) }}
{{- end }}
{{- end }}

{{/*
Derive the MongoDB connection string.
Priority: explicit secrets.DB_CONNECTION_STRING > auto-generated (when mongodb.enabled) > fail.
*/}}
{{- define "checkmate.mongodbConnectionString" -}}
{{- if .Values.secrets.DB_CONNECTION_STRING }}
{{- .Values.secrets.DB_CONNECTION_STRING }}
{{- else if .Values.mongodb.enabled }}
{{- printf "mongodb://%s-mongodb.%s.svc:%d/uptime_db"
    (include "checkmate.fullname" .)
    (include "checkmate.namespace" .)
    (int .Values.mongodb.port) }}
{{- else }}
{{- fail "secrets.DB_CONNECTION_STRING must be set when mongodb.enabled is false (external MongoDB)" }}
{{- end }}
{{- end }}

{{/*
Derive CLIENT_HOST (base URL of the frontend, used by the server for CORS).
Priority: explicit secrets.CLIENT_HOST > Ingress host > first HTTPRoute hostname > fail.
"change_me" is treated as unset so the auto-derivation still applies.
*/}}
{{- define "checkmate.clientHost" -}}
{{- if and .Values.secrets.CLIENT_HOST (ne .Values.secrets.CLIENT_HOST "change_me") (ne .Values.secrets.CLIENT_HOST "") }}
{{- .Values.secrets.CLIENT_HOST }}
{{- else if .Values.client.ingress.enabled }}
{{- printf "%s://%s" .Values.client.protocol .Values.client.ingress.host }}
{{- else if and .Values.client.httproute.enabled .Values.client.httproute.hostnames }}
{{- printf "%s://%s" .Values.client.protocol (first .Values.client.httproute.hostnames) }}
{{- else }}
{{- fail "secrets.CLIENT_HOST must be set when it cannot be auto-derived from client.ingress.host or client.httproute.hostnames" }}
{{- end }}
{{- end }}

{{/*
Derive the server API base URL injected into the client container at runtime.
Priority:
  1. server.apiBaseURL explicit override (useful for local/port-forward access)
  2. server Ingress host
  3. first server HTTPRoute hostname
  4. empty string — set server.apiBaseURL when no routing is configured
*/}}
{{- define "checkmate.serverAPIBaseURL" -}}
{{- if and .Values.server.apiBaseURL (ne .Values.server.apiBaseURL "") }}
{{- .Values.server.apiBaseURL }}
{{- else if .Values.server.ingress.enabled }}
{{- printf "%s://%s/api/v1" .Values.server.protocol .Values.server.ingress.host }}
{{- else if and .Values.server.httproute.enabled .Values.server.httproute.hostnames }}
{{- printf "%s://%s/api/v1" .Values.server.protocol (first .Values.server.httproute.hostnames) }}
{{- else }}
{{- "" }}
{{- end }}
{{- end }}

{{/*
TLS Secret name for the client Ingress.
Defaults to "<release>-client-tls" when tls.secretName is not specified.
*/}}
{{- define "checkmate.clientIngressTLSSecretName" -}}
{{- default (printf "%s-client-tls" .Release.Name) .Values.client.ingress.tls.secretName }}
{{- end }}

{{/*
TLS Secret name for the server Ingress.
Defaults to "<release>-server-tls" when tls.secretName is not specified.
*/}}
{{- define "checkmate.serverIngressTLSSecretName" -}}
{{- default (printf "%s-server-tls" .Release.Name) .Values.server.ingress.tls.secretName }}
{{- end }}

{{/*
MongoDB PVC size — new mongodb.persistence.size location wins; legacy persistence.mongo.size
overrides it when non-empty (backward compatibility with chart v0.1.x).
*/}}
{{- define "checkmate.mongodbPVCSize" -}}
{{- if .Values.persistence.mongo.size }}
{{- .Values.persistence.mongo.size }}
{{- else }}
{{- .Values.mongodb.persistence.size }}
{{- end }}
{{- end }}

{{/*
MongoDB PVC storageClass — legacy persistence.mongo.storageClass overrides when non-empty.
*/}}
{{- define "checkmate.mongodbStorageClass" -}}
{{- if .Values.persistence.mongo.storageClass }}
{{- .Values.persistence.mongo.storageClass }}
{{- else }}
{{- .Values.mongodb.persistence.storageClass }}
{{- end }}
{{- end }}

{{/*
Redis PVC size — legacy persistence.redis.size overrides when non-empty.
*/}}
{{- define "checkmate.redisPVCSize" -}}
{{- if .Values.persistence.redis.size }}
{{- .Values.persistence.redis.size }}
{{- else }}
{{- .Values.redis.persistence.size }}
{{- end }}
{{- end }}

{{/*
Redis PVC storageClass — legacy persistence.redis.storageClass overrides when non-empty.
*/}}
{{- define "checkmate.redisStorageClass" -}}
{{- if .Values.persistence.redis.storageClass }}
{{- .Values.persistence.redis.storageClass }}
{{- else }}
{{- .Values.redis.persistence.storageClass }}
{{- end }}
{{- end }}
