{{- /*
Back-compat shim: the `server.*` value block was renamed to `api.*`. Existing installs that
still pass a legacy `server:` block keep working — this returns the effective API values with any
legacy `server.*` overrides merged on top of the `api.*` defaults (legacy wins where set).

New installs have no `server:` key, so this is a no-op deepCopy of `.Values.api`. Consume it as:
  {{- $api := include "checkmate.api" . | fromYaml -}}
then reference `$api.*` instead of `.Values.api.*`.
*/}}
{{- define "checkmate.api" -}}
{{- $api := deepCopy .Values.api -}}
{{- with .Values.server -}}
{{- $api = mergeOverwrite $api (deepCopy .) -}}
{{- end -}}
{{- $api | toYaml -}}
{{- end -}}

{{- /*
Resolve a full image reference from a repo + optional tag. For *application* images `appVersion`
is the single source of truth for tags: bumping Chart.appVersion moves the api and worker tiers
at once. MongoDB is upstream `mongo` with an explicit `mongodb.tag` (e.g. "8.2.12") — its tag is
independent of appVersion and the prechecks enforce that it is set. Call as:
  {{ include "checkmate.image" (dict "image" $repo "tag" $tag "root" $) }}

If `image` already carries a tag (a ":" in its final path segment) it is used verbatim — this keeps
legacy `server.image: repo:tag` overrides working and lets anyone pin a full ref (e.g. tag "latest").
A ":" only in the registry segment (a registry port like "reg:5000/x") is ignored, so a tag is still
appended. Otherwise the tag is `tag` if set, else the chart's appVersion.
*/}}
{{- define "checkmate.image" -}}
{{- $lastSegment := .image | splitList "/" | last -}}
{{- if contains ":" $lastSegment -}}
{{- .image -}}
{{- else -}}
{{- printf "%s:%s" .image (.tag | default .root.Chart.AppVersion) -}}
{{- end -}}
{{- end -}}

{{- /*
Effective public URL for the app (CLIENT_HOST), consumed by the api and worker Deployments.
Precedence:
1. An explicit secrets.CLIENT_HOST that is set, non-empty and not the legacy "change_me"
   placeholder (0.2.x values files carried CLIENT_HOST: change_me by default — treated as unset).
2. api.protocol://api.ingress.host — the all-in-one server serves the SPA from the API origin,
   so the public host IS the api ingress host.

The server validates CLIENT_HOST as a URL on startup, and worker mode runs that same env
validation before branching, so both deployments set it. Consume as:
  {{ include "checkmate.clientHost" . | trim | quote }}
*/}}
{{- define "checkmate.clientHost" -}}
{{- $api := include "checkmate.api" . | fromYaml -}}
{{- $explicit := (.Values.secrets | default dict).CLIENT_HOST | default "" -}}
{{- if and $explicit (ne $explicit "change_me") -}}
{{- $explicit -}}
{{- else -}}
{{- printf "%s://%s" $api.protocol $api.ingress.host -}}
{{- end -}}
{{- end -}}
