{{- /*
Back-compat shim for the all-in-one image migration.

Chart 0.2.x deployed a separate client and API, configured through `client.*` and
`api.*` (and, before that, `server.*`). Checkmate now ships one image that serves
both, so those collapse into a single `app.*` block.

Existing installs keep working: any legacy block is merged over the `app.*`
defaults, in the order client -> api -> server, so a value set in an older block
still wins. Only `image`/`tag` are deliberately NOT inherited from `client.*` —
that repo (checkmate-client) is no longer published, so honouring it would pin an
install to an image that cannot be pulled.

New installs have no legacy keys and this is a no-op deepCopy of `.Values.app`.
Consume it as:
  {{- $app := include "checkmate.app" . | fromYaml -}}
*/}}
{{- define "checkmate.app" -}}
{{- $app := deepCopy .Values.app -}}
{{- with .Values.client -}}
{{- $legacy := omit (deepCopy .) "image" "tag" "port" -}}
{{- $app = mergeOverwrite $app $legacy -}}
{{- end -}}
{{- with .Values.api -}}
{{- $app = mergeOverwrite $app (deepCopy .) -}}
{{- end -}}
{{- with .Values.server -}}
{{- $app = mergeOverwrite $app (deepCopy .) -}}
{{- end -}}
{{- $app | toYaml -}}
{{- end -}}

{{- /*
Deprecated alias kept so any out-of-tree template referencing `checkmate.api`
still resolves. Prefer `checkmate.app`.
*/}}
{{- define "checkmate.api" -}}
{{- include "checkmate.app" . -}}
{{- end -}}

{{- /*
Resolve a full image reference from a repo + optional tag. `appVersion` is the single source of
truth for tags: bumping Chart.appVersion moves every tier at once. Call as:
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
