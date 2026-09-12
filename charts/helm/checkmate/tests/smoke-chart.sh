#!/usr/bin/env bash
# Smoke tests for the Checkmate Helm chart (chart 0.3.x — all-in-one image migration).
#
# Runs `helm lint` (strict, with valid values) plus positive/negative `helm template`
# assertions. Negative fixtures assert that rendering FAILS (non-zero exit) with the expected
# migration guidance: precheck `fail`s abort template rendering, which is also how
# helm install / helm upgrade abort before touching any cluster resources.
#
# Note: plain `helm lint` tolerates template `fail`s (logs them as INFO and exits 0 even with
# --strict on Helm v4.2.x), so migration errors are asserted through `helm template`, not lint.
#
# Usage: bash tests/smoke-chart.sh   (chart dir is resolved relative to this script)
set -euo pipefail

CHART_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${CHART_DIR}"

HOST="checkmate.example.test"
JWT="test-secret"
APP_VERSION="$(sed -n 's/^appVersion: "\([^"]*\)".*/\1/p' Chart.yaml)"
[ -n "${APP_VERSION}" ] || { echo "FAIL: could not parse appVersion from Chart.yaml" >&2; exit 1; }
APP_IMAGE="ghcr.io/bluewave-labs/checkmate:${APP_VERSION}"
MONGO_IMAGE="mongo:8.2.12"
HOST_URL="http://${HOST}"

PASS=0
FAIL=0
ok()  { PASS=$((PASS + 1)); echo "  ok: $1"; }
bad() { FAIL=$((FAIL + 1)); echo "FAIL: $1" >&2; }

# render <helm args...> — helm template with a fixed release name
render() { helm template checkmate-test . "$@"; }

# assert_fail <expected-substring> <helm args...> — render must exit non-zero and mention it
assert_fail() {
  local expected="$1"
  shift
  local out
  if out="$(helm template checkmate-test . "$@" 2>&1)"; then
    bad "expected render to FAIL mentioning '${expected}' but it succeeded"
    return
  fi
  if ! grep -q "${expected}" <<<"${out}"; then
    bad "render failed, but without the expected message '${expected}'."
    echo "--- actual output ---" >&2
    echo "${out}" >&2
    return
  fi
  ok "fails with '${expected}'"
}

# count <regex> <input> — occurrences of a line matching regex
count() { grep -c "^${1}" <<<"${2}" || true; }

echo "== lint =="
helm lint . --strict \
  --set-string "secrets.JWT_SECRET=${JWT}" \
  --set-string "api.ingress.host=${HOST}" >/dev/null
ok "helm lint --strict passes with valid values"

echo "== positive: default render (ingress enabled, no worker) =="
BASE=(--set-string "secrets.JWT_SECRET=${JWT}" --set-string "api.ingress.host=${HOST}")
OUT="$(render "${BASE[@]}")"

if grep -q "image: ${APP_IMAGE}" <<<"${OUT}"; then ok "api image is ${APP_IMAGE}"; else bad "api image != ${APP_IMAGE}"; fi
if grep -q "image: ${MONGO_IMAGE}" <<<"${OUT}"; then ok "mongo image is ${MONGO_IMAGE}"; else bad "mongo image != ${MONGO_IMAGE}"; fi
if ! grep -qE "bluewave-labs/checkmate-(client|backend|mongo)" <<<"${OUT}"; then ok "no retired image references"; else bad "retired image reference present"; fi
if ! grep -q "checkmate-client" <<<"${OUT}"; then ok "no client workload objects"; else bad "client workload object present"; fi
if ! grep -q "UPTIME_APP" <<<"${OUT}"; then ok "no UPTIME_APP_* env vars"; else bad "UPTIME_APP env var present"; fi
if [ "$(count 'kind: Deployment' "${OUT}")" = "1" ]; then ok "exactly one Deployment (api)"; else bad "expected exactly one Deployment, got: $(count 'kind: Deployment' "${OUT}")"; fi
if [ "$(count 'kind: StatefulSet' "${OUT}")" = "1" ]; then ok "exactly one StatefulSet (mongodb)"; else bad "expected exactly one StatefulSet"; fi
if [ "$(count 'kind: ConfigMap' "${OUT}")" = "0" ]; then ok "no ConfigMaps (nginx client ConfigMap removed)"; else bad "unexpected ConfigMap"; fi
if [ "$(count 'kind: Ingress' "${OUT}")" = "1" ]; then ok "exactly one Ingress"; else bad "expected exactly one Ingress"; fi

INGRESS="$(sed -n '/^kind: Ingress/,/^---$/p' <<<"${OUT}")"
if grep -q "path: /" <<<"${INGRESS}"; then ok "ingress routes '/'"; else bad "ingress missing '/' path"; fi
if grep -q "name: checkmate-api" <<<"${INGRESS}"; then ok "ingress backends to checkmate-api"; else bad "ingress backend != checkmate-api"; fi
if grep -q "number: 52345" <<<"${INGRESS}"; then ok "ingress targets port 52345"; else bad "ingress port != 52345"; fi

CH_COUNT="$(grep -Fc "value: \"${HOST_URL}\"" <<<"${OUT}" || true)"
if [ "${CH_COUNT}" = "1" ]; then ok "CLIENT_HOST derived as ${HOST_URL} (api pod)"; else bad "expected CLIENT_HOST ${HOST_URL} once, got ${CH_COUNT}"; fi

echo "== positive: worker enabled =="
OUT2="$(render "${BASE[@]}" --set worker.enabled=true)"
if [ "$(grep -c "image: ${APP_IMAGE}" <<<"${OUT2}")" = "2" ]; then ok "api + worker both use ${APP_IMAGE}"; else bad "worker image != api image"; fi
if [ "$(grep -Fc "value: \"${HOST_URL}\"" <<<"${OUT2}")" = "2" ]; then ok "CLIENT_HOST present on api + worker"; else bad "CLIENT_HOST missing on worker"; fi

echo "== positive: ingress disabled with explicit CLIENT_HOST =="
OUT3="$(render "${BASE[@]}" --set api.ingress.enabled=false \
  --set-string "secrets.CLIENT_HOST=https://ext.example.test")"
if grep -q 'value: "https://ext.example.test"' <<<"${OUT3}"; then ok "explicit secrets.CLIENT_HOST used"; else bad "explicit CLIENT_HOST not rendered"; fi
if [ "$(count 'kind: Ingress' "${OUT3}")" = "0" ]; then ok "no Ingress when disabled"; else bad "Ingress rendered while disabled"; fi

echo "== negative: legacy/misconfigured values fail with guidance =="
FIXTURES=tests/fixtures
assert_fail "removed the client tier" "${BASE[@]}" -f "${FIXTURES}/legacy-client.yaml"
assert_fail "is retired" "${BASE[@]}" -f "${FIXTURES}/legacy-api-image.yaml"
assert_fail "is retired" "${BASE[@]}" -f "${FIXTURES}/legacy-server-image.yaml"
assert_fail "is retired" "${BASE[@]}" -f "${FIXTURES}/legacy-worker-image.yaml"
assert_fail "retired checkmate-mongo" "${BASE[@]}" -f "${FIXTURES}/legacy-mongo-image.yaml"
assert_fail "mongodb.tag must be an explicit" "${BASE[@]}" -f "${FIXTURES}/mongo-missing-tag.yaml"
assert_fail "no ingress host to derive CLIENT_HOST" "${BASE[@]}" -f "${FIXTURES}/ingress-disabled-no-client-host.yaml"
assert_fail "must be a full http(s):// URL" "${BASE[@]}" -f "${FIXTURES}/client-host-not-url.yaml"

echo
echo "smoke-chart: ${PASS} passed, ${FAIL} failed"
[ "${FAIL}" = "0" ]
