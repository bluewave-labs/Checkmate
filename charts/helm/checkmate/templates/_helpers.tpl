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
