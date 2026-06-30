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
