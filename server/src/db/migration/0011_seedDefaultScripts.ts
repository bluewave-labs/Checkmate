import ScriptModel from "../models/Script.js";
import TeamModel from "../models/Team.js";
import UserModel from "../models/User.js";
import { encryptScriptBody, hashScriptBody } from "@/utils/scriptCrypto.js";
import { logger } from "@/utils/logger.js";

// Seed a curated library of default monitoring scripts for every existing team.
// Idempotent: scripts are skipped when a script with the same name already exists
// in the team's library.  New teams created after this migration runs will not
// automatically receive these scripts — a separate team-creation hook handles that.

const SERVICE_NAME = "Migration:SeedDefaultScripts";

// ---------------------------------------------------------------------------
// Script definitions
// ---------------------------------------------------------------------------

interface ScriptDef {
	name: string;
	description: string;
	runtime: "bash" | "python" | "powershell";
	parameters: Record<string, string>;
	body: string;
}

const DEFAULT_SCRIPTS: ScriptDef[] = [
	// ── Disk & Storage ──────────────────────────────────────────────────────
	{
		name: "Disk Usage",
		description: "Checks that no mounted filesystem exceeds a configurable usage percentage. Skips pseudo-filesystems and reports the worst offender.",
		runtime: "bash",
		parameters: { WARN_PCT: "80", CRIT_PCT: "90", EXCLUDE_FS: "tmpfs|devtmpfs|squashfs|overlay|aufs", INCLUDE_MOUNTS: "" },
		body: `#!/usr/bin/env bash
# disk_usage.sh — Disk Usage Threshold
# Exit 0=ok, 1=warning, 2=critical
# Env: WARN_PCT, CRIT_PCT, EXCLUDE_FS, INCLUDE_MOUNTS

WARN_PCT="\${WARN_PCT:-80}"
CRIT_PCT="\${CRIT_PCT:-90}"
EXCLUDE_FS="\${EXCLUDE_FS:-tmpfs|devtmpfs|squashfs|overlay|aufs}"
INCLUDE_MOUNTS="\${INCLUDE_MOUNTS:-}"

if ! command -v df &>/dev/null; then
    echo '{"status":"error","message":"df command not found","value":null}'
    exit 2
fi

worst_pct=0
worst_mount=""
worst_fs=""
mounts_json=""
overall_status="ok"

while IFS= read -r line; do
    fstype=$(echo "$line" | awk '{print $2}')
    mount=$(echo "$line" | awk '{print $7}')
    use_raw=$(echo "$line" | awk '{print $6}')
    use_pct="\${use_raw//%/}"
    filesystem=$(echo "$line" | awk '{print $1}')

    if ! [[ "$use_pct" =~ ^[0-9]+$ ]]; then
        continue
    fi

    if echo "$fstype" | grep -qE "^(\${EXCLUDE_FS})$"; then
        continue
    fi

    if [[ -n "$INCLUDE_MOUNTS" ]]; then
        match=0
        IFS=',' read -ra wanted <<< "$INCLUDE_MOUNTS"
        for w in "\${wanted[@]}"; do
            if [[ "$mount" == "$w" ]]; then
                match=1
                break
            fi
        done
        [[ "$match" -eq 0 ]] && continue
    fi

    mount_status="ok"
    if [[ "$use_pct" -ge "$CRIT_PCT" ]]; then
        mount_status="critical"
        overall_status="critical"
    elif [[ "$use_pct" -ge "$WARN_PCT" ]]; then
        mount_status="warning"
        [[ "$overall_status" != "critical" ]] && overall_status="warning"
    fi

    if [[ "$use_pct" -ge "$worst_pct" ]]; then
        worst_pct="$use_pct"
        worst_mount="$mount"
        worst_fs="$filesystem"
    fi

    entry="{\\"mount\\":\\"$\{mount}\\",\\"filesystem\\":\\"$\{filesystem}\\",\\"type\\":\\"$\{fstype}\\",\\"used_pct\\":$\{use_pct},\\"status\\":\\"$\{mount_status}\\"}"
    if [[ -n "$mounts_json" ]]; then
        mounts_json="$\{mounts_json},$\{entry}"
    else
        mounts_json="$\{entry}"
    fi
done < <(df -PT 2>/dev/null | tail -n +2)

if [[ -z "$mounts_json" ]]; then
    echo '{"status":"error","message":"No mountpoints matched criteria","value":null}'
    exit 2
fi

case "$overall_status" in
    critical)
        msg="CRITICAL: \${worst_mount} (\${worst_fs}) at \${worst_pct}% used"
        exit_code=2
        ;;
    warning)
        msg="WARNING: \${worst_mount} (\${worst_fs}) at \${worst_pct}% used"
        exit_code=1
        ;;
    *)
        msg="All disks OK — highest usage \${worst_pct}% on \${worst_mount}"
        exit_code=0
        ;;
esac

echo "{\\"status\\":\\"$\{overall_status}\\",\\"message\\":\\"$\{msg}\\",\\"value\\":{\\"max_used_pct\\":$\{worst_pct},\\"worst_mount\\":\\"$\{worst_mount}\\",\\"mounts\\":[$\{mounts_json}]}}"
exit "$exit_code"`,
	},
	{
		name: "Inode Exhaustion",
		description: "Detects filesystems approaching inode exhaustion — a failure mode invisible to df -h that kills writes even when disk space is available.",
		runtime: "bash",
		parameters: { WARN_PCT: "85", CRIT_PCT: "95", EXCLUDE_FS: "tmpfs|devtmpfs|squashfs|overlay" },
		body: `#!/usr/bin/env bash
# inode_usage.sh — Inode Exhaustion Check
# Exit 0=ok, 1=warning, 2=critical
# Env: WARN_PCT, CRIT_PCT, EXCLUDE_FS

WARN_PCT="\${WARN_PCT:-85}"
CRIT_PCT="\${CRIT_PCT:-95}"
EXCLUDE_FS="\${EXCLUDE_FS:-tmpfs|devtmpfs|squashfs|overlay}"

if ! command -v df &>/dev/null; then
    echo '{"status":"error","message":"df command not found","value":null}'
    exit 2
fi

worst_pct=0
worst_mount=""
worst_fs=""
mounts_json=""
overall_status="ok"

while IFS= read -r line; do
    fstype=$(echo "$line" | awk '{print $2}')
    mount=$(echo "$line" | awk '{print $7}')
    iuse_raw=$(echo "$line" | awk '{print $6}')
    iuse_pct="\${iuse_raw//%/}"
    filesystem=$(echo "$line" | awk '{print $1}')
    iused=$(echo "$line" | awk '{print $4}')
    ifree=$(echo "$line" | awk '{print $5}')
    inodes=$(echo "$line" | awk '{print $3}')

    if ! [[ "$iuse_pct" =~ ^[0-9]+$ ]]; then
        continue
    fi

    if echo "$fstype" | grep -qE "^(\${EXCLUDE_FS})$"; then
        continue
    fi

    if [[ "$inodes" == "0" || "$inodes" == "-" ]]; then
        continue
    fi

    mount_status="ok"
    if [[ "$iuse_pct" -ge "$CRIT_PCT" ]]; then
        mount_status="critical"
        overall_status="critical"
    elif [[ "$iuse_pct" -ge "$WARN_PCT" ]]; then
        mount_status="warning"
        [[ "$overall_status" != "critical" ]] && overall_status="warning"
    fi

    if [[ "$iuse_pct" -ge "$worst_pct" ]]; then
        worst_pct="$iuse_pct"
        worst_mount="$mount"
        worst_fs="$filesystem"
    fi

    entry="{\\"mount\\":\\"$\{mount}\\",\\"filesystem\\":\\"$\{filesystem}\\",\\"type\\":\\"$\{fstype}\\",\\"inodes\\":\\"$\{inodes}\\",\\"iused\\":\\"$\{iused}\\",\\"ifree\\":\\"$\{ifree}\\",\\"iuse_pct\\":$\{iuse_pct},\\"status\\":\\"$\{mount_status}\\"}"
    if [[ -n "$mounts_json" ]]; then
        mounts_json="$\{mounts_json},$\{entry}"
    else
        mounts_json="$\{entry}"
    fi
done < <(df -PTi 2>/dev/null | tail -n +2)

if [[ -z "$mounts_json" ]]; then
    echo '{"status":"error","message":"No mountpoints matched criteria or inodes not supported","value":null}'
    exit 2
fi

case "$overall_status" in
    critical)
        msg="CRITICAL: \${worst_mount} (\${worst_fs}) inode usage at \${worst_pct}%"
        exit_code=2
        ;;
    warning)
        msg="WARNING: \${worst_mount} (\${worst_fs}) inode usage at \${worst_pct}%"
        exit_code=1
        ;;
    *)
        msg="All inodes OK — highest usage \${worst_pct}% on \${worst_mount}"
        exit_code=0
        ;;
esac

echo "{\\"status\\":\\"$\{overall_status}\\",\\"message\\":\\"$\{msg}\\",\\"value\\":{\\"max_iuse_pct\\":$\{worst_pct},\\"worst_mount\\":\\"$\{worst_mount}\\",\\"mounts\\":[$\{mounts_json}]}}"
exit "$exit_code"`,
	},

	// ── Services ─────────────────────────────────────────────────────────────
	{
		name: "Systemd Service Status",
		description: "Asserts that one or more systemd units are active and not in a failed state. Optionally requires units to be enabled at boot.",
		runtime: "bash",
		parameters: { SERVICES: "ssh.service", REQUIRE_ENABLED: "0" },
		body: `#!/usr/bin/env bash
# systemd_service.sh — Systemd Service Status
# Exit 0=ok, 1=warning (degraded/inactive), 2=critical (failed)
# Env: SERVICES, REQUIRE_ENABLED

SERVICES="\${SERVICES:-ssh.service}"
REQUIRE_ENABLED="\${REQUIRE_ENABLED:-0}"

if ! command -v systemctl &>/dev/null; then
    echo '{"status":"error","message":"systemctl not found — not a systemd system","value":null}'
    exit 2
fi

services_json=""
overall_status="ok"
failed_names=""
inactive_names=""

IFS=',' read -ra svc_list <<< "$SERVICES"

for svc in "\${svc_list[@]}"; do
    svc="\${svc// /}"
    [[ -z "$svc" ]] && continue

    active_state=$(systemctl is-active "$svc" 2>/dev/null || true)
    failed_state=$(systemctl is-failed "$svc" 2>/dev/null || true)

    enabled_state="n/a"
    if [[ "$REQUIRE_ENABLED" == "1" ]]; then
        enabled_state=$(systemctl is-enabled "$svc" 2>/dev/null || echo "unknown")
    fi

    svc_status="ok"
    svc_msg=""

    if [[ "$failed_state" == "failed" ]]; then
        svc_status="critical"
        svc_msg="Service is in failed state"
        overall_status="critical"
        failed_names="\${failed_names:+\${failed_names}, }\${svc}"
    elif [[ "$active_state" != "active" ]]; then
        svc_status="warning"
        svc_msg="Service is \${active_state}"
        [[ "$overall_status" != "critical" ]] && overall_status="warning"
        inactive_names="\${inactive_names:+\${inactive_names}, }\${svc}"
    elif [[ "$REQUIRE_ENABLED" == "1" && "$enabled_state" != "enabled" ]]; then
        svc_status="warning"
        svc_msg="Service is active but not enabled (\${enabled_state})"
        [[ "$overall_status" != "critical" ]] && overall_status="warning"
        inactive_names="\${inactive_names:+\${inactive_names}, }\${svc}"
    else
        svc_msg="Service is running"
    fi

    entry="{\\"service\\":\\"$\{svc}\\",\\"active\\":\\"$\{active_state}\\",\\"failed\\":\\"$\{failed_state}\\",\\"enabled\\":\\"$\{enabled_state}\\",\\"status\\":\\"$\{svc_status}\\",\\"message\\":\\"$\{svc_msg}\\"}"
    if [[ -n "$services_json" ]]; then
        services_json="$\{services_json},$\{entry}"
    else
        services_json="$\{entry}"
    fi
done

if [[ -z "$services_json" ]]; then
    echo '{"status":"error","message":"No services specified","value":null}'
    exit 2
fi

case "$overall_status" in
    critical)
        msg="CRITICAL: Failed services — \${failed_names}"
        exit_code=2
        ;;
    warning)
        msg="WARNING: Inactive/not-enabled services — \${inactive_names}"
        exit_code=1
        ;;
    *)
        msg="All services running OK"
        exit_code=0
        ;;
esac

echo "{\\"status\\":\\"$\{overall_status}\\",\\"message\\":\\"$\{msg}\\",\\"value\\":{\\"services\\":[$\{services_json}]}}"
exit "$exit_code"`,
	},
	{
		name: "Process Running",
		description: "Confirms that a named process is running with at least a minimum instance count. Supports full command-line matching.",
		runtime: "bash",
		parameters: { PROCESS_NAME: "sshd", MIN_COUNT: "1", MATCH_FULL: "0" },
		body: `#!/usr/bin/env bash
# process_running.sh — Process Running Check
# Exit 0=ok, 2=critical (below MIN_COUNT)
# Env: PROCESS_NAME, MIN_COUNT, MATCH_FULL

PROCESS_NAME="\${PROCESS_NAME:-sshd}"
MIN_COUNT="\${MIN_COUNT:-1}"
MATCH_FULL="\${MATCH_FULL:-0}"

if ! command -v pgrep &>/dev/null; then
    echo '{"status":"error","message":"pgrep not found","value":null}'
    exit 2
fi

if [[ "$MATCH_FULL" == "1" ]]; then
    count=$(pgrep -cf "$PROCESS_NAME" 2>/dev/null || echo "0")
else
    count=$(pgrep -c "$PROCESS_NAME" 2>/dev/null || echo "0")
fi

if ! [[ "$count" =~ ^[0-9]+$ ]]; then
    count=0
fi

if [[ "$count" -ge "$MIN_COUNT" ]]; then
    status="ok"
    msg="Process '\${PROCESS_NAME}' running (\${count} instance(s))"
    exit_code=0
else
    status="critical"
    msg="CRITICAL: Process '\${PROCESS_NAME}' not running — found \${count}, need \${MIN_COUNT}"
    exit_code=2
fi

echo "{\\"status\\":\\"$\{status}\\",\\"message\\":\\"$\{msg}\\",\\"value\\":{\\"process\\":\\"$\{PROCESS_NAME}\\",\\"count\\":$\{count},\\"min_count\\":$\{MIN_COUNT},\\"match_full\\":$\{MATCH_FULL}}}"
exit "$exit_code"`,
	},
	{
		name: "TCP Port Listening",
		description: "Verifies that one or more local TCP ports are bound and accepting connections. Optionally checks the bind address.",
		runtime: "bash",
		parameters: { PORTS: "22", BIND_ADDR: "" },
		body: `#!/usr/bin/env bash
# tcp_port_listening.sh — TCP Port Listening Check
# Exit 0=ok, 2=critical (any port not listening)
# Env: PORTS, BIND_ADDR

PORTS="\${PORTS:-22}"
BIND_ADDR="\${BIND_ADDR:-}"

if command -v ss &>/dev/null; then
    use_ss=1
elif command -v netstat &>/dev/null; then
    use_ss=0
else
    echo '{"status":"error","message":"Neither ss nor netstat found","value":null}'
    exit 2
fi

get_listening_addrs() {
    local port="$1"
    if [[ "$use_ss" -eq 1 ]]; then
        ss -ltnH "sport = :\${port}" 2>/dev/null | awk '{print $4}'
    else
        netstat -ltn 2>/dev/null | awk -v p=":\${port}" '$4 ~ p"$" {print $4}'
    fi
}

ports_json=""
overall_status="ok"
not_listening=""

IFS=',' read -ra port_list <<< "$PORTS"

for port in "\${port_list[@]}"; do
    port="\${port// /}"
    [[ -z "$port" ]] && continue

    if ! [[ "$port" =~ ^[0-9]+$ ]] || [[ "$port" -lt 1 || "$port" -gt 65535 ]]; then
        entry="{\\"port\\":\\"$\{port}\\",\\"listening\\":false,\\"bind\\":null,\\"status\\":\\"error\\",\\"message\\":\\"Invalid port number\\"}"
        if [[ -n "$ports_json" ]]; then ports_json="$\{ports_json},$\{entry}"; else ports_json="$\{entry}"; fi
        overall_status="critical"
        continue
    fi

    listening_addrs=$(get_listening_addrs "$port")
    is_listening=false
    matched_bind=""

    if [[ -n "$listening_addrs" ]]; then
        if [[ -z "$BIND_ADDR" ]]; then
            is_listening=true
            matched_bind=$(echo "$listening_addrs" | head -1)
        else
            while IFS= read -r addr; do
                addr_host="\${addr%:*}"
                if [[ "$addr_host" == "$BIND_ADDR" || "$addr_host" == "0.0.0.0" || "$addr_host" == "::" || "$addr_host" == "*" ]]; then
                    is_listening=true
                    matched_bind="$addr"
                    break
                fi
            done <<< "$listening_addrs"
        fi
    fi

    if [[ "$is_listening" == "true" ]]; then
        port_status="ok"
        port_msg="Port \${port} is listening on \${matched_bind}"
    else
        port_status="critical"
        port_msg="Port \${port} is NOT listening"
        overall_status="critical"
        not_listening="\${not_listening:+\${not_listening}, }\${port}"
    fi

    bind_val="null"
    [[ -n "$matched_bind" ]] && bind_val="\\"$\{matched_bind}\\""

    entry="{\\"port\\":$\{port},\\"listening\\":$\{is_listening},\\"bind\\":$\{bind_val},\\"status\\":\\"$\{port_status}\\",\\"message\\":\\"$\{port_msg}\\"}"
    if [[ -n "$ports_json" ]]; then ports_json="$\{ports_json},$\{entry}"; else ports_json="$\{entry}"; fi
done

if [[ -z "$ports_json" ]]; then
    echo '{"status":"error","message":"No valid ports specified","value":null}'
    exit 2
fi

if [[ "$overall_status" == "critical" ]]; then
    msg="CRITICAL: Ports not listening — \${not_listening}"
    exit_code=2
else
    msg="All ports listening OK"
    exit_code=0
fi

echo "{\\"status\\":\\"$\{overall_status}\\",\\"message\\":\\"$\{msg}\\",\\"value\\":{\\"ports\\":[$\{ports_json}]}}"
exit "$exit_code"`,
	},

	// ── Network ──────────────────────────────────────────────────────────────
	{
		name: "DNS Resolution",
		description: "Resolves a hostname and optionally validates the result against an expected IP list. Supports A and AAAA records with a configurable timeout.",
		runtime: "python",
		parameters: { HOSTNAME: "www.google.com", RECORD_TYPE: "A", EXPECTED_IPS: "", TIMEOUT_MS: "3000" },
		body: `#!/usr/bin/env python3
# dns_check.py — DNS Resolution Check
# Exit 0=ok, 1=warning, 2=error
# Env: HOSTNAME, RECORD_TYPE, EXPECTED_IPS, TIMEOUT_MS

import json
import os
import socket
import sys
import threading
import time


def _out(status, message, value=None):
    print(json.dumps({"status": status, "message": message, "value": value}))


def resolve(hostname, family, result_box, error_box):
    try:
        infos = socket.getaddrinfo(hostname, None, family)
        ips = list(dict.fromkeys(info[4][0] for info in infos))
        result_box.append(ips)
    except socket.gaierror as exc:
        error_box.append(exc)
    except OSError as exc:
        error_box.append(exc)


def main():
    hostname = os.environ.get("HOSTNAME", "www.google.com")
    record_type = os.environ.get("RECORD_TYPE", "A").upper()
    expected_raw = os.environ.get("EXPECTED_IPS", "").strip()
    timeout_ms = int(os.environ.get("TIMEOUT_MS", "3000"))

    if record_type not in ("A", "AAAA"):
        _out("error", f"Unsupported RECORD_TYPE '{record_type}'; use A or AAAA")
        sys.exit(2)

    family = socket.AF_INET if record_type == "A" else socket.AF_INET6
    expected_ips = [ip.strip() for ip in expected_raw.split(",") if ip.strip()] if expected_raw else []

    result_box = []
    error_box = []
    t = threading.Thread(target=resolve, args=(hostname, family, result_box, error_box), daemon=True)
    t0 = time.monotonic()
    t.start()
    t.join(timeout=timeout_ms / 1000.0)
    elapsed_ms = round((time.monotonic() - t0) * 1000)

    if t.is_alive():
        _out("error", f"DNS timeout after {elapsed_ms}ms resolving {hostname} ({record_type})",
             {"elapsed_ms": elapsed_ms, "hostname": hostname, "record_type": record_type})
        sys.exit(2)

    if error_box:
        exc = error_box[0]
        msg = str(exc)
        if isinstance(exc, socket.gaierror):
            code = exc.args[0] if exc.args else None
            if code == socket.EAI_NONAME or code == -2:
                msg = f"Name '{hostname}' does not exist"
            elif code == socket.EAI_AGAIN:
                msg = f"Temporary DNS failure resolving '{hostname}'"
        _out("error", f"DNS resolution failed for {hostname} ({record_type}): {msg}",
             {"elapsed_ms": elapsed_ms, "hostname": hostname, "record_type": record_type})
        sys.exit(2)

    resolved_ips = result_box[0]
    value = {"hostname": hostname, "record_type": record_type, "resolved_ips": resolved_ips, "elapsed_ms": elapsed_ms}

    if expected_ips:
        missing = [ip for ip in expected_ips if ip not in resolved_ips]
        value["expected_ips"] = expected_ips
        value["missing_ips"] = missing
        if missing:
            _out("error", f"{hostname} ({record_type}): expected IPs missing: {', '.join(missing)}", value)
            sys.exit(2)
        _out("ok", f"{hostname} ({record_type}) resolved in {elapsed_ms}ms — all expected IPs present", value)
        sys.exit(0)

    _out("ok", f"{hostname} ({record_type}) resolved to {', '.join(resolved_ips)} in {elapsed_ms}ms", value)
    sys.exit(0)


if __name__ == "__main__":
    main()`,
	},
	{
		name: "HTTP Endpoint Health",
		description: "Fetches an HTTP(S) URL and asserts status code, optional body regex, and latency thresholds. Reports warning on slow responses, error on failure.",
		runtime: "python",
		parameters: {
			URL: "https://example.com/health",
			METHOD: "GET",
			EXPECT_STATUS: "200-299",
			EXPECT_BODY_REGEX: "",
			LATENCY_WARN_MS: "1000",
			LATENCY_CRIT_MS: "3000",
			TIMEOUT_MS: "5000",
			VERIFY_TLS: "1",
		},
		body: `#!/usr/bin/env python3
# http_health.py — HTTP Endpoint Health
# Exit 0=ok, 1=warning, 2=error
# Env: URL, METHOD, EXPECT_STATUS, EXPECT_BODY_REGEX, LATENCY_WARN_MS, LATENCY_CRIT_MS, TIMEOUT_MS, VERIFY_TLS

import json
import os
import re
import ssl
import sys
import time
import urllib.error
import urllib.request


def _out(status, message, value=None):
    print(json.dumps({"status": status, "message": message, "value": value}))


def parse_status_ranges(spec):
    ranges = []
    for part in spec.split(","):
        part = part.strip()
        if not part:
            continue
        if "-" in part:
            lo_s, hi_s = part.split("-", 1)
            ranges.append((int(lo_s), int(hi_s)))
        else:
            code = int(part)
            ranges.append((code, code))
    return ranges


def status_matches(code, ranges):
    return any(lo <= code <= hi for lo, hi in ranges)


def main():
    url = os.environ.get("URL", "https://example.com/health")
    method = os.environ.get("METHOD", "GET").upper()
    expect_status_spec = os.environ.get("EXPECT_STATUS", "200-299")
    expect_body_regex = os.environ.get("EXPECT_BODY_REGEX", "").strip()
    latency_warn_ms = int(os.environ.get("LATENCY_WARN_MS", "1000"))
    latency_crit_ms = int(os.environ.get("LATENCY_CRIT_MS", "3000"))
    timeout_ms = int(os.environ.get("TIMEOUT_MS", "5000"))
    verify_tls_str = os.environ.get("VERIFY_TLS", "1").strip()
    verify_tls = verify_tls_str not in ("0", "false", "no")

    try:
        expected_ranges = parse_status_ranges(expect_status_spec)
    except ValueError as exc:
        _out("error", f"Invalid EXPECT_STATUS '{expect_status_spec}': {exc}")
        sys.exit(2)

    body_re = None
    if expect_body_regex:
        try:
            body_re = re.compile(expect_body_regex)
        except re.error as exc:
            _out("error", f"Invalid EXPECT_BODY_REGEX: {exc}")
            sys.exit(2)

    ssl_ctx = ssl.create_default_context()
    if not verify_tls:
        ssl_ctx.check_hostname = False
        ssl_ctx.verify_mode = ssl.CERT_NONE

    req = urllib.request.Request(url=url, method=method)
    req.add_header("User-Agent", "Checkmate-Monitor/1.0")

    t0 = time.monotonic()
    status_code = -1
    body_bytes = b""

    try:
        with urllib.request.urlopen(req, timeout=timeout_ms / 1000.0, context=ssl_ctx) as resp:
            elapsed_ms = round((time.monotonic() - t0) * 1000)
            status_code = resp.status
            body_bytes = resp.read(65536)
    except urllib.error.HTTPError as exc:
        elapsed_ms = round((time.monotonic() - t0) * 1000)
        status_code = exc.code
        try:
            body_bytes = exc.read(65536)
        except OSError:
            body_bytes = b""
    except urllib.error.URLError as exc:
        elapsed_ms = round((time.monotonic() - t0) * 1000)
        reason = str(exc.reason)
        if "timed out" in reason.lower():
            _out("error", f"Connection timed out after {elapsed_ms}ms reaching {url}", {"url": url, "elapsed_ms": elapsed_ms})
        elif "certificate" in reason.lower() or "ssl" in reason.lower():
            _out("error", f"TLS/SSL error connecting to {url}: {reason}", {"url": url, "elapsed_ms": elapsed_ms})
        elif "connection refused" in reason.lower():
            _out("error", f"Connection refused by {url}", {"url": url, "elapsed_ms": elapsed_ms})
        else:
            _out("error", f"Request to {url} failed: {reason}", {"url": url, "elapsed_ms": elapsed_ms})
        sys.exit(2)
    except (TimeoutError, OSError) as exc:
        elapsed_ms = round((time.monotonic() - t0) * 1000)
        _out("error", f"Network error reaching {url}: {exc}", {"url": url, "elapsed_ms": elapsed_ms})
        sys.exit(2)

    value = {"url": url, "method": method, "status_code": status_code, "elapsed_ms": elapsed_ms, "bytes": len(body_bytes)}

    if elapsed_ms >= latency_crit_ms:
        _out("error", f"Critical latency: {url} responded in {elapsed_ms}ms (threshold {latency_crit_ms}ms)", value)
        sys.exit(2)
    if elapsed_ms >= latency_warn_ms:
        _out("warning", f"High latency: {url} responded in {elapsed_ms}ms (threshold {latency_warn_ms}ms)", value)
        sys.exit(1)
    if not status_matches(status_code, expected_ranges):
        _out("error", f"Unexpected HTTP {status_code} from {url} (expected {expect_status_spec})", value)
        sys.exit(2)
    if body_re and not body_re.search(body_bytes.decode("utf-8", errors="replace")):
        _out("error", f"Body regex '{expect_body_regex}' not found in response from {url}", value)
        sys.exit(2)

    _out("ok", f"HTTP {status_code} from {url} in {elapsed_ms}ms ({len(body_bytes)} bytes)", value)
    sys.exit(0)


if __name__ == "__main__":
    main()`,
	},
	{
		name: "TCP Port Reachability",
		description: "Opens a TCP connection to a remote host:port to verify reachability and measure connect latency. Distinguishes refused, timeout, and DNS errors.",
		runtime: "python",
		parameters: { HOST: "1.1.1.1", PORT: "443", TIMEOUT_MS: "3000", LATENCY_WARN_MS: "500" },
		body: `#!/usr/bin/env python3
# tcp_reachability.py — TCP Port Reachability
# Exit 0=ok, 1=warning, 2=error
# Env: HOST, PORT, TIMEOUT_MS, LATENCY_WARN_MS

import errno
import json
import os
import socket
import sys
import time


def _out(status, message, value=None):
    print(json.dumps({"status": status, "message": message, "value": value}))


def main():
    host = os.environ.get("HOST", "1.1.1.1")
    port_str = os.environ.get("PORT", "443")
    timeout_ms = int(os.environ.get("TIMEOUT_MS", "3000"))
    latency_warn_ms = int(os.environ.get("LATENCY_WARN_MS", "500"))

    try:
        port = int(port_str)
        if not (1 <= port <= 65535):
            raise ValueError("out of range")
    except ValueError:
        _out("error", f"Invalid PORT value '{port_str}'; must be 1-65535")
        sys.exit(2)

    t0 = time.monotonic()
    try:
        with socket.create_connection((host, port), timeout=timeout_ms / 1000.0):
            pass
        elapsed_ms = round((time.monotonic() - t0) * 1000)
    except (socket.timeout, TimeoutError):
        elapsed_ms = round((time.monotonic() - t0) * 1000)
        _out("error", f"TCP timeout after {elapsed_ms}ms connecting to {host}:{port}",
             {"host": host, "port": port, "elapsed_ms": elapsed_ms})
        sys.exit(2)
    except ConnectionRefusedError:
        elapsed_ms = round((time.monotonic() - t0) * 1000)
        _out("error", f"Connection refused by {host}:{port}",
             {"host": host, "port": port, "elapsed_ms": elapsed_ms})
        sys.exit(2)
    except socket.gaierror as exc:
        elapsed_ms = round((time.monotonic() - t0) * 1000)
        _out("error", f"DNS resolution failed for '{host}': {exc.strerror}",
             {"host": host, "port": port, "elapsed_ms": elapsed_ms})
        sys.exit(2)
    except OSError as exc:
        elapsed_ms = round((time.monotonic() - t0) * 1000)
        if exc.errno in (errno.ENETUNREACH, errno.EHOSTUNREACH):
            msg = f"Host {host}:{port} is unreachable (network/routing error)"
        elif exc.errno == errno.ECONNRESET:
            msg = f"Connection reset by {host}:{port}"
        else:
            msg = f"TCP connect to {host}:{port} failed: {exc.strerror or exc}"
        _out("error", msg, {"host": host, "port": port, "elapsed_ms": elapsed_ms})
        sys.exit(2)

    value = {"host": host, "port": port, "elapsed_ms": elapsed_ms}
    if elapsed_ms >= latency_warn_ms:
        _out("warning", f"TCP {host}:{port} reachable but slow: {elapsed_ms}ms (threshold {latency_warn_ms}ms)", value)
        sys.exit(1)

    _out("ok", f"TCP {host}:{port} reachable in {elapsed_ms}ms", value)
    sys.exit(0)


if __name__ == "__main__":
    main()`,
	},

	// ── Certificates ─────────────────────────────────────────────────────────
	{
		name: "SSL Certificate Expiry",
		description: "Connects to a TLS endpoint with openssl s_client and reports days until certificate expiry. Supports STARTTLS for SMTP/IMAP/POP3.",
		runtime: "bash",
		parameters: { HOST: "example.com", PORT: "443", WARN_DAYS: "30", CRIT_DAYS: "7", STARTTLS: "" },
		body: `#!/usr/bin/env bash
# ssl_cert_expiry.sh — SSL Certificate Expiry via openssl s_client
# Exit 0=ok, 1=warning, 2=critical
# Env: HOST, PORT, WARN_DAYS, CRIT_DAYS, STARTTLS

HOST="\${HOST:-example.com}"
PORT="\${PORT:-443}"
WARN_DAYS="\${WARN_DAYS:-30}"
CRIT_DAYS="\${CRIT_DAYS:-7}"
STARTTLS="\${STARTTLS:-}"

if ! command -v openssl &>/dev/null; then
    echo '{"status":"error","message":"openssl not found","value":null}'
    exit 2
fi

starttls_args=()
if [[ -n "$STARTTLS" ]]; then
    starttls_args=(-starttls "$STARTTLS")
fi

cert_output=$(echo "" | timeout 10 openssl s_client \
    -connect "\${HOST}:\${PORT}" \
    -servername "$HOST" \
    "\${starttls_args[@]}" \
    2>/dev/null) || true

if [[ -z "$cert_output" ]]; then
    echo "{\\"status\\":\\"error\\",\\"message\\":\\"Could not connect to \${HOST}:\${PORT}\\",\\"value\\":null}"
    exit 2
fi

not_after=$(echo "$cert_output" | openssl x509 -noout -enddate 2>/dev/null | cut -d= -f2)

if [[ -z "$not_after" ]]; then
    echo "{\\"status\\":\\"error\\",\\"message\\":\\"Could not parse certificate from \${HOST}:\${PORT}\\",\\"value\\":null}"
    exit 2
fi

expiry_epoch=$(date -d "$not_after" +%s 2>/dev/null) || expiry_epoch=$(date -j -f "%b %d %T %Y %Z" "$not_after" +%s 2>/dev/null) || true

if [[ -z "$expiry_epoch" ]]; then
    echo "{\\"status\\":\\"error\\",\\"message\\":\\"Could not parse certificate expiry date: \${not_after}\\",\\"value\\":null}"
    exit 2
fi

now_epoch=$(date +%s)
days_remaining=$(( (expiry_epoch - now_epoch) / 86400 ))
not_after_clean="\${not_after//\\"/}"

if [[ "$days_remaining" -le "$CRIT_DAYS" ]]; then
    status="critical"
    msg="CRITICAL: SSL certificate for \${HOST} expires in \${days_remaining} day(s) (\${not_after_clean})"
    exit_code=2
elif [[ "$days_remaining" -le "$WARN_DAYS" ]]; then
    status="warning"
    msg="WARNING: SSL certificate for \${HOST} expires in \${days_remaining} day(s) (\${not_after_clean})"
    exit_code=1
else
    status="ok"
    msg="SSL certificate for \${HOST} OK — expires in \${days_remaining} day(s)"
    exit_code=0
fi

echo "{\\"status\\":\\"$\{status}\\",\\"message\\":\\"$\{msg}\\",\\"value\\":{\\"host\\":\\"$\{HOST}\\",\\"port\\":$\{PORT},\\"days_remaining\\":$\{days_remaining},\\"not_after\\":\\"$\{not_after_clean}\\"}}"
exit "$exit_code"`,
	},
	{
		name: "Let's Encrypt Certificate Expiry",
		description: "Checks every Let's Encrypt certificate on disk for upcoming expiry, catching certbot renewal failures before the certificate actually dies.",
		runtime: "bash",
		parameters: { LE_LIVE_DIR: "/etc/letsencrypt/live", WARN_DAYS: "20", CRIT_DAYS: "7", INCLUDE_DOMAINS: "" },
		body: `#!/usr/bin/env bash
# lets_encrypt_expiry.sh — Let's Encrypt Certificate Expiry
# Exit 0=ok, 1=warning, 2=critical
# Env: LE_LIVE_DIR, WARN_DAYS, CRIT_DAYS, INCLUDE_DOMAINS

LE_LIVE_DIR="\${LE_LIVE_DIR:-/etc/letsencrypt/live}"
WARN_DAYS="\${WARN_DAYS:-20}"
CRIT_DAYS="\${CRIT_DAYS:-7}"
INCLUDE_DOMAINS="\${INCLUDE_DOMAINS:-}"

if ! command -v openssl &>/dev/null; then
    echo '{"status":"error","message":"openssl not found","value":null}'
    exit 2
fi

if [[ ! -d "$LE_LIVE_DIR" ]]; then
    echo "{\\"status\\":\\"error\\",\\"message\\":\\"Let's Encrypt live directory not found: \${LE_LIVE_DIR}\\",\\"value\\":null}"
    exit 2
fi

now_epoch=$(date +%s)
certs_json=""
overall_status="ok"
worst_days=999999
worst_domain=""

declare -A include_set
if [[ -n "$INCLUDE_DOMAINS" ]]; then
    IFS=',' read -ra dom_list <<< "$INCLUDE_DOMAINS"
    for d in "\${dom_list[@]}"; do
        d="\${d// /}"
        include_set["$d"]=1
    done
fi

while IFS= read -r pem; do
    domain=$(basename "$(dirname "$pem")")

    if [[ -n "$INCLUDE_DOMAINS" ]] && [[ -z "\${include_set[$domain]+x}" ]]; then
        continue
    fi

    if [[ ! -r "$pem" ]]; then
        entry="{\\"domain\\":\\"$\{domain}\\",\\"days_remaining\\":null,\\"not_after\\":null,\\"status\\":\\"error\\",\\"message\\":\\"Certificate file not readable\\"}"
        if [[ -n "$certs_json" ]]; then certs_json="$\{certs_json},$\{entry}"; else certs_json="$\{entry}"; fi
        overall_status="critical"
        continue
    fi

    not_after=$(openssl x509 -noout -enddate -in "$pem" 2>/dev/null | cut -d= -f2)
    if [[ -z "$not_after" ]]; then
        entry="{\\"domain\\":\\"$\{domain}\\",\\"days_remaining\\":null,\\"not_after\\":null,\\"status\\":\\"error\\",\\"message\\":\\"Could not parse certificate\\"}"
        if [[ -n "$certs_json" ]]; then certs_json="$\{certs_json},$\{entry}"; else certs_json="$\{entry}"; fi
        overall_status="critical"
        continue
    fi

    expiry_epoch=$(date -d "$not_after" +%s 2>/dev/null) || expiry_epoch=$(date -j -f "%b %d %T %Y %Z" "$not_after" +%s 2>/dev/null) || true

    if [[ -z "$expiry_epoch" ]]; then
        entry="{\\"domain\\":\\"$\{domain}\\",\\"days_remaining\\":null,\\"not_after\\":\\"$\{not_after}\\",\\"status\\":\\"error\\",\\"message\\":\\"Could not parse expiry date\\"}"
        if [[ -n "$certs_json" ]]; then certs_json="$\{certs_json},$\{entry}"; else certs_json="$\{entry}"; fi
        overall_status="critical"
        continue
    fi

    days_remaining=$(( (expiry_epoch - now_epoch) / 86400 ))
    not_after_clean="\${not_after//\\"/}"

    cert_status="ok"
    if [[ "$days_remaining" -le "$CRIT_DAYS" ]]; then
        cert_status="critical"
        overall_status="critical"
    elif [[ "$days_remaining" -le "$WARN_DAYS" ]]; then
        cert_status="warning"
        [[ "$overall_status" != "critical" ]] && overall_status="warning"
    fi

    if [[ "$days_remaining" -lt "$worst_days" ]]; then
        worst_days="$days_remaining"
        worst_domain="$domain"
    fi

    entry="{\\"domain\\":\\"$\{domain}\\",\\"days_remaining\\":$\{days_remaining},\\"not_after\\":\\"$\{not_after_clean}\\",\\"status\\":\\"$\{cert_status}\\"}"
    if [[ -n "$certs_json" ]]; then certs_json="$\{certs_json},$\{entry}"; else certs_json="$\{entry}"; fi

done < <(find "$LE_LIVE_DIR" -name "fullchain.pem" 2>/dev/null | sort)

if [[ -z "$certs_json" ]]; then
    echo "{\\"status\\":\\"error\\",\\"message\\":\\"No Let's Encrypt certificates found in \${LE_LIVE_DIR}\\",\\"value\\":null}"
    exit 2
fi

case "$overall_status" in
    critical)
        msg="CRITICAL: Certificate for \${worst_domain} expires in \${worst_days} day(s)"
        exit_code=2
        ;;
    warning)
        msg="WARNING: Certificate for \${worst_domain} expires in \${worst_days} day(s)"
        exit_code=1
        ;;
    *)
        msg="All Let's Encrypt certificates OK — soonest expiry in \${worst_days} day(s) (\${worst_domain})"
        exit_code=0
        ;;
esac

echo "{\\"status\\":\\"$\{overall_status}\\",\\"message\\":\\"$\{msg}\\",\\"value\\":{\\"certs\\":[$\{certs_json}]}}"
exit "$exit_code"`,
	},
	{
		name: "Entra ID App Credential Expiry",
		description: "Audits Azure AD / Entra ID app registrations via Microsoft Graph for expiring client secrets and certificates. Requires Application.Read.All permission on a service principal.",
		runtime: "python",
		parameters: {
			AZURE_TENANT_ID: "",
			AZURE_CLIENT_ID: "",
			AZURE_CLIENT_SECRET: "",
			WARN_DAYS: "30",
			CRIT_DAYS: "7",
			APP_FILTER: "",
			INCLUDE_EXPIRED: "1",
			GRAPH_BASE: "https://graph.microsoft.com",
			LOGIN_BASE: "https://login.microsoftonline.com",
		},
		body: `#!/usr/bin/env python3
# entra_cert_expiry.py — Entra ID App Registration Secret & Certificate Expiry
# Exit 0=ok, 1=warning, 2=error
# Env: AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET,
#      WARN_DAYS, CRIT_DAYS, APP_FILTER, INCLUDE_EXPIRED, GRAPH_BASE, LOGIN_BASE

import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone


def _out(status, message, value=None):
    print(json.dumps({"status": status, "message": message, "value": value}))


def _die(message, value=None):
    _out("error", message, value)
    sys.exit(2)


def _http_json(url, *, method="GET", headers=None, data=None, timeout=30.0):
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header("Accept", "application/json")
    if headers:
        for k, v in headers.items():
            req.add_header(k, v)
    if data is not None and not (headers and "Content-Type" in headers):
        req.add_header("Content-Type", "application/x-www-form-urlencoded")
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return resp.status, json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        raw = b""
        try:
            raw = exc.read()
        except OSError:
            pass
        try:
            body = json.loads(raw.decode("utf-8"))
        except (json.JSONDecodeError, UnicodeDecodeError):
            body = {"raw": raw.decode("utf-8", errors="replace")}
        return exc.code, body


def get_access_token(tenant_id, client_id, client_secret, login_base):
    token_url = f"{login_base.rstrip('/')}/{tenant_id}/oauth2/v2.0/token"
    payload = urllib.parse.urlencode({
        "grant_type": "client_credentials",
        "client_id": client_id,
        "client_secret": client_secret,
        "scope": "https://graph.microsoft.com/.default",
    }).encode()
    status, body = _http_json(token_url, method="POST", data=payload)
    if status != 200:
        error_desc = body.get("error_description", body.get("error", "unknown"))
        error_desc = error_desc.replace(client_secret, "***") if client_secret in str(error_desc) else error_desc
        _die(f"Failed to acquire access token (HTTP {status}): {error_desc}")
    token = body.get("access_token", "")
    if not token:
        _die("Token response did not contain access_token")
    return token


def graph_get_all(url, token, max_retries=5):
    results = []
    current_url = url
    while current_url:
        retries = 0
        while True:
            status, body = _http_json(current_url, headers={"Authorization": f"Bearer {token}"})
            if status == 429:
                retry_after = max(1, int(body.get("error", {}).get("retryAfter", 10)) if isinstance(body.get("error"), dict) else 10)
                retries += 1
                if retries > max_retries:
                    _die(f"Graph API rate-limit (429) persisted after {max_retries} retries")
                time.sleep(retry_after)
                continue
            if status == 401:
                _die("Graph API returned 401 Unauthorized — check Application.Read.All permission")
            if status == 403:
                _die("Graph API returned 403 Forbidden — ensure service principal has Application.Read.All")
            if status != 200:
                err = body.get("error", {}).get("message", "") if isinstance(body.get("error"), dict) else ""
                _die(f"Graph API error (HTTP {status}): {err or json.dumps(body)}")
            break
        results.extend(body.get("value", []))
        current_url = body.get("@odata.nextLink")
    return results


def parse_iso8601(s):
    if not s:
        return None
    s_clean = s.rstrip("Z").split(".")[0]
    try:
        return datetime.strptime(s_clean, "%Y-%m-%dT%H:%M:%S").replace(tzinfo=timezone.utc)
    except ValueError:
        try:
            return datetime.strptime(s_clean, "%Y-%m-%d").replace(tzinfo=timezone.utc)
        except ValueError:
            return None


def main():
    tenant_id = os.environ.get("AZURE_TENANT_ID", "").strip()
    client_id = os.environ.get("AZURE_CLIENT_ID", "").strip()
    client_secret = os.environ.get("AZURE_CLIENT_SECRET", "").strip()

    missing = [k for k, v in [("AZURE_TENANT_ID", tenant_id), ("AZURE_CLIENT_ID", client_id), ("AZURE_CLIENT_SECRET", client_secret)] if not v]
    if missing:
        _die(f"Missing required environment variables: {', '.join(missing)}")

    warn_days = int(os.environ.get("WARN_DAYS", "30"))
    crit_days = int(os.environ.get("CRIT_DAYS", "7"))
    app_filter_raw = os.environ.get("APP_FILTER", "").strip()
    include_expired = os.environ.get("INCLUDE_EXPIRED", "1").strip() not in ("0", "false", "no")
    graph_base = os.environ.get("GRAPH_BASE", "https://graph.microsoft.com").rstrip("/")
    login_base = os.environ.get("LOGIN_BASE", "https://login.microsoftonline.com").rstrip("/")
    app_filter = [f.strip() for f in app_filter_raw.split(",") if f.strip()] if app_filter_raw else []

    token = get_access_token(tenant_id, client_id, client_secret, login_base)
    apps_url = f"{graph_base}/v1.0/applications?$select=id,appId,displayName,passwordCredentials,keyCredentials&$top=999"
    apps = graph_get_all(apps_url, token)

    if app_filter:
        apps = [a for a in apps if any((a.get("displayName") or "").startswith(p) for p in app_filter)]

    now = datetime.now(tz=timezone.utc)
    expiring = []
    apps_checked = 0
    creds_total = 0

    for app in apps:
        app_name = app.get("displayName") or app.get("appId", "unknown")
        app_id = app.get("appId", "")
        object_id = app.get("id", "")
        apps_checked += 1

        for cred_type, creds in [("secret", app.get("passwordCredentials") or []), ("certificate", app.get("keyCredentials") or [])]:
            for cred in creds:
                creds_total += 1
                end_dt = parse_iso8601(cred.get("endDateTime", ""))
                if end_dt is None:
                    continue
                days_remaining = (end_dt - now).days
                if not include_expired and days_remaining < 0:
                    continue
                if days_remaining <= warn_days:
                    expiring.append({
                        "app_name": app_name, "app_id": app_id, "object_id": object_id,
                        "credential_type": cred_type,
                        "credential_name": cred.get("displayName") or cred.get("keyId", ""),
                        "credential_id": cred.get("keyId", ""),
                        "expires_utc": end_dt.strftime("%Y-%m-%dT%H:%M:%SZ"),
                        "days_remaining": days_remaining,
                    })

    expiring.sort(key=lambda c: c["days_remaining"])
    crit_items = [c for c in expiring if c["days_remaining"] <= crit_days]
    warn_items = [c for c in expiring if crit_days < c["days_remaining"] <= warn_days]
    expired_items = [c for c in expiring if c["days_remaining"] < 0]

    value = {"apps_checked": apps_checked, "credentials_checked": creds_total, "expiring": expiring,
             "crit_count": len(crit_items), "warn_count": len(warn_items), "expired_count": len(expired_items)}

    if crit_items:
        w = crit_items[0]
        _out("error", f"CRITICAL: {len(crit_items)} credential(s) expire within {crit_days}d — worst: '{w['app_name']}' ({w['credential_type']}) in {w['days_remaining']}d", value)
        sys.exit(2)
    if expired_items and include_expired:
        w = expired_items[0]
        _out("error", f"CRITICAL: {len(expired_items)} credential(s) already expired — oldest: '{w['app_name']}' ({w['credential_type']}) {abs(w['days_remaining'])}d ago", value)
        sys.exit(2)
    if warn_items:
        w = warn_items[0]
        _out("warning", f"WARNING: {len(warn_items)} credential(s) expire within {warn_days}d — soonest: '{w['app_name']}' ({w['credential_type']}) in {w['days_remaining']}d", value)
        sys.exit(1)

    _out("ok", f"All credentials OK — checked {apps_checked} apps, {creds_total} credentials, none expiring within {warn_days}d", value)
    sys.exit(0)


if __name__ == "__main__":
    main()`,
	},
	{
		name: "Windows Certificate Store Expiry",
		description: "Scans Windows certificate store(s) for certificates expiring soon. Supports subject filter, multiple stores, and expired certificate detection.",
		runtime: "powershell",
		parameters: { STORE_PATHS: "Cert:\\LocalMachine\\My", WARN_DAYS: "30", CRIT_DAYS: "7", SUBJECT_FILTER: "", EXCLUDE_EXPIRED: "0" },
		body: `#Requires -Version 5.1
# windows_cert_store.ps1 — Windows Certificate Store Expiry
# Exit 0=ok, 1=warning, 2=critical
# Env: STORE_PATHS, WARN_DAYS, CRIT_DAYS, SUBJECT_FILTER, EXCLUDE_EXPIRED

$StorePaths     = if ($Env:STORE_PATHS)     { $Env:STORE_PATHS }     else { 'Cert:\\LocalMachine\\My' }
$WarnDays       = if ($Env:WARN_DAYS)       { [int]$Env:WARN_DAYS }  else { 30 }
$CritDays       = if ($Env:CRIT_DAYS)       { [int]$Env:CRIT_DAYS }  else { 7 }
$SubjectFilter  = if ($Env:SUBJECT_FILTER)  { $Env:SUBJECT_FILTER }  else { '' }
$ExcludeExpired = if ($Env:EXCLUDE_EXPIRED) { $Env:EXCLUDE_EXPIRED } else { '0' }

$now   = Get-Date
$paths = $StorePaths -split ',' | ForEach-Object { $_.Trim() } | Where-Object { $_ -ne '' }

$allCerts   = [System.Collections.Generic.List[object]]::new()
$scanErrors = [System.Collections.Generic.List[string]]::new()

foreach ($path in $paths) {
    try {
        $ErrorActionPreference = 'Stop'
        $items = Get-ChildItem -Path $path -Recurse -ErrorAction Stop
        foreach ($cert in $items) {
            if ($cert -isnot [System.Security.Cryptography.X509Certificates.X509Certificate2]) { continue }
            if ($SubjectFilter -ne '' -and $cert.Subject -notmatch $SubjectFilter) { continue }
            $daysRemaining = ($cert.NotAfter - $now).TotalDays
            if ($ExcludeExpired -eq '1' -and $daysRemaining -lt 0) { continue }
            $allCerts.Add([PSCustomObject]@{
                Subject       = $cert.Subject
                Thumbprint    = $cert.Thumbprint
                Store         = $path
                NotAfter      = $cert.NotAfter.ToString('yyyy-MM-ddTHH:mm:ssZ')
                DaysRemaining = [math]::Round($daysRemaining, 2)
            })
        }
    }
    catch [System.UnauthorizedAccessException] { $scanErrors.Add("Access denied to store: $path") }
    catch { $scanErrors.Add("Error reading store '$($path)': $($_.Exception.Message)") }
    finally { $ErrorActionPreference = 'Continue' }
}

$sorted    = $allCerts | Sort-Object DaysRemaining
$critCerts = @($sorted | Where-Object { $_.DaysRemaining -lt $CritDays })
$warnCerts = @($sorted | Where-Object { $_.DaysRemaining -ge $CritDays -and $_.DaysRemaining -lt $WarnDays })

if ($critCerts.Count -gt 0) {
    $worst = $critCerts[0]; $status = 'critical'; $exitCode = 2
    if ($worst.DaysRemaining -lt 0) {
        $msg = "CRITICAL: $($critCerts.Count) cert(s) already expired — '$($worst.Subject)' expired $([math]::Abs([math]::Round($worst.DaysRemaining)))d ago"
    } else {
        $msg = "CRITICAL: $($critCerts.Count) cert(s) expiring within $($CritDays)d — '$($worst.Subject)' in $([math]::Round($worst.DaysRemaining))d"
    }
} elseif ($warnCerts.Count -gt 0) {
    $worst = $warnCerts[0]; $status = 'warning'; $exitCode = 1
    $msg = "WARNING: $($warnCerts.Count) cert(s) expiring within $($WarnDays)d — '$($worst.Subject)' in $([math]::Round($worst.DaysRemaining))d"
} else {
    $status = 'ok'; $exitCode = 0
    $nextExpiry = if ($sorted.Count -gt 0) { $sorted[0].DaysRemaining } else { $null }
    $msg = if ($null -ne $nextExpiry) { "All $($allCerts.Count) cert(s) OK — next expiry in $([math]::Round($nextExpiry))d" } else { 'No certificates found matching criteria' }
}

$result = [ordered]@{
    status  = $status
    message = $msg
    value   = [ordered]@{
        scanned_stores = $paths
        total_certs    = $allCerts.Count
        critical_count = $critCerts.Count
        warning_count  = $warnCerts.Count
        expiring_certs = @($sorted | Where-Object { $_.DaysRemaining -lt $WarnDays })
        scan_errors    = @($scanErrors)
    }
}
Write-Output ($result | ConvertTo-Json -Compress -Depth 4)
exit $exitCode`,
	},

	// ── Database ─────────────────────────────────────────────────────────────
	{
		name: "MongoDB Ping",
		description: "Verifies a MongoDB instance is reachable and responsive using the OP_MSG wire protocol directly — no pymongo required.",
		runtime: "python",
		parameters: { MONGO_HOST: "127.0.0.1", MONGO_PORT: "27017", TIMEOUT_MS: "3000", LATENCY_WARN_MS: "200" },
		body: `#!/usr/bin/env python3
# mongodb_ping.py — MongoDB Ping (wire protocol, stdlib only)
# Exit 0=ok, 1=warning, 2=error
# Env: MONGO_HOST, MONGO_PORT, TIMEOUT_MS, LATENCY_WARN_MS

import json
import os
import socket
import struct
import sys
import time


def _out(status, message, value=None):
    print(json.dumps({"status": status, "message": message, "value": value}))


def _bson_int32_field(key, val):
    return b"\\x10" + key.encode() + b"\\x00" + struct.pack("<i", val)


def _bson_string_field(key, val):
    encoded = val.encode("utf-8") + b"\\x00"
    return b"\\x02" + key.encode() + b"\\x00" + struct.pack("<i", len(encoded)) + encoded


def bson_encode_ping():
    body = _bson_int32_field("ping", 1) + _bson_string_field("$db", "admin") + b"\\x00"
    return struct.pack("<i", 4 + len(body)) + body


def bson_decode(data):
    result = {}
    doc_size = struct.unpack_from("<i", data, 0)[0]
    offset = 4
    end = doc_size - 1
    while offset < end:
        type_byte = data[offset]; offset += 1
        if type_byte == 0x00:
            break
        key_end = data.index(b"\\x00", offset)
        key = data[offset:key_end].decode(errors="replace"); offset = key_end + 1
        if type_byte == 0x10:
            val = struct.unpack_from("<i", data, offset)[0]; offset += 4
        elif type_byte == 0x01:
            val = struct.unpack_from("<d", data, offset)[0]; offset += 8
        elif type_byte == 0x08:
            val = bool(data[offset]); offset += 1
        elif type_byte == 0x02:
            str_len = struct.unpack_from("<i", data, offset)[0]; offset += 4
            val = data[offset:offset + str_len - 1].decode(errors="replace"); offset += str_len
        elif type_byte == 0x12:
            val = struct.unpack_from("<q", data, offset)[0]; offset += 8
        elif type_byte == 0x03:
            sub_size = struct.unpack_from("<i", data, offset)[0]
            val = bson_decode(data[offset:offset + sub_size]); offset += sub_size
        else:
            break
        result[key] = val
    return result


OP_MSG = 2013


def build_op_msg(bson_body, request_id=1):
    payload = struct.pack("<I", 0) + b"\\x00" + bson_body
    header = struct.pack("<iiii", 16 + len(payload), request_id, 0, OP_MSG)
    return header + payload


def recv_exact(sock, n):
    buf = bytearray()
    while len(buf) < n:
        chunk = sock.recv(n - len(buf))
        if not chunk:
            raise ConnectionError(f"Socket closed after {len(buf)}/{n} bytes")
        buf.extend(chunk)
    return bytes(buf)


def read_op_msg_response(sock):
    header = recv_exact(sock, 16)
    msg_len, _, _, op_code = struct.unpack_from("<iiii", header)
    if op_code != OP_MSG:
        raise ValueError(f"Unexpected opCode {op_code}")
    payload = recv_exact(sock, msg_len - 16)
    if payload[4] != 0:
        raise ValueError(f"Unexpected section kind {payload[4]}")
    return bson_decode(payload[5:])


def main():
    host = os.environ.get("MONGO_HOST", "127.0.0.1")
    port = int(os.environ.get("MONGO_PORT", "27017"))
    timeout_ms = int(os.environ.get("TIMEOUT_MS", "3000"))
    latency_warn_ms = int(os.environ.get("LATENCY_WARN_MS", "200"))
    timeout_sec = timeout_ms / 1000.0
    value_base = {"host": host, "port": port}
    t0 = time.monotonic()
    try:
        with socket.create_connection((host, port), timeout=timeout_sec) as sock:
            sock.settimeout(timeout_sec)
            sock.sendall(build_op_msg(bson_encode_ping()))
            response = read_op_msg_response(sock)
        elapsed_ms = round((time.monotonic() - t0) * 1000)
        if response.get("ok") not in (1, 1.0):
            _out("error", f"MongoDB ping returned ok={response.get('ok')!r} from {host}:{port}",
                 {**value_base, "elapsed_ms": elapsed_ms})
            sys.exit(2)
    except (socket.timeout, TimeoutError):
        elapsed_ms = round((time.monotonic() - t0) * 1000)
        _out("error", f"MongoDB timeout after {elapsed_ms}ms connecting to {host}:{port}", {**value_base, "elapsed_ms": elapsed_ms})
        sys.exit(2)
    except ConnectionRefusedError:
        elapsed_ms = round((time.monotonic() - t0) * 1000)
        _out("error", f"MongoDB connection refused by {host}:{port}", {**value_base, "elapsed_ms": elapsed_ms})
        sys.exit(2)
    except socket.gaierror as exc:
        elapsed_ms = round((time.monotonic() - t0) * 1000)
        _out("error", f"DNS resolution failed for '{host}': {exc.strerror}", {**value_base, "elapsed_ms": elapsed_ms})
        sys.exit(2)
    except (ConnectionError, ValueError, struct.error) as exc:
        elapsed_ms = round((time.monotonic() - t0) * 1000)
        _out("error", f"MongoDB protocol error from {host}:{port}: {exc}", {**value_base, "elapsed_ms": elapsed_ms})
        sys.exit(2)
    except OSError as exc:
        elapsed_ms = round((time.monotonic() - t0) * 1000)
        _out("error", f"Network error reaching {host}:{port}: {exc}", {**value_base, "elapsed_ms": elapsed_ms})
        sys.exit(2)

    value = {**value_base, "elapsed_ms": elapsed_ms}
    if elapsed_ms >= latency_warn_ms:
        _out("warning", f"MongoDB {host}:{port} ping OK but slow: {elapsed_ms}ms (threshold {latency_warn_ms}ms)", value)
        sys.exit(1)
    _out("ok", f"MongoDB PONG received from {host}:{port} in {elapsed_ms}ms", value)
    sys.exit(0)


if __name__ == "__main__":
    main()`,
	},
	{
		name: "Redis Ping",
		description: "Sends a RESP PING to Redis to verify reachability and authentication. Supports TLS, ACL username, and distinguishes WRONGPASS from connection failures.",
		runtime: "python",
		parameters: { REDIS_HOST: "127.0.0.1", REDIS_PORT: "6379", REDIS_PASSWORD: "", REDIS_USERNAME: "", USE_TLS: "0", TIMEOUT_MS: "2000", LATENCY_WARN_MS: "100" },
		body: `#!/usr/bin/env python3
# redis_ping.py — Redis Ping (raw RESP protocol, stdlib only)
# Exit 0=ok, 1=warning, 2=error
# Env: REDIS_HOST, REDIS_PORT, REDIS_PASSWORD, REDIS_USERNAME, USE_TLS, TIMEOUT_MS, LATENCY_WARN_MS

import json
import os
import socket
import ssl
import sys
import time


def _out(status, message, value=None):
    print(json.dumps({"status": status, "message": message, "value": value}))


def resp_inline(command):
    return (command + "\\r\\n").encode()


def resp_array(*args):
    parts = [f"*{len(args)}\\r\\n"]
    for arg in args:
        encoded = arg.encode("utf-8")
        parts.append(f"\${len(encoded)}\\r\\n")
        parts.append(arg + "\\r\\n")
    return "".join(parts).encode("utf-8")


def recv_line(sock):
    buf = bytearray()
    while True:
        b = sock.recv(1)
        if not b:
            raise ConnectionError("Socket closed while reading RESP line")
        buf.extend(b)
        if buf[-2:] == b"\\r\\n":
            return buf[:-2].decode("utf-8", errors="replace")


def recv_exact(sock, n):
    buf = bytearray()
    while len(buf) < n:
        chunk = sock.recv(n - len(buf))
        if not chunk:
            raise ConnectionError(f"Socket closed after {len(buf)}/{n} bytes")
        buf.extend(chunk)
    return bytes(buf)


def read_resp(sock):
    line = recv_line(sock)
    if not line:
        raise ConnectionError("Empty RESP line")
    prefix, rest = line[0], line[1:]
    if prefix == "+":
        return rest
    elif prefix == "-":
        raise RuntimeError(f"Redis error: {rest}")
    elif prefix == ":":
        return int(rest)
    elif prefix == "$":
        length = int(rest)
        if length == -1:
            return None
        data = recv_exact(sock, length)
        recv_exact(sock, 2)
        return data.decode("utf-8", errors="replace")
    elif prefix == "*":
        count = int(rest)
        return [read_resp(sock) for _ in range(count)] if count != -1 else None
    raise ValueError(f"Unknown RESP prefix: {prefix!r}")


def main():
    host = os.environ.get("REDIS_HOST", "127.0.0.1")
    port = int(os.environ.get("REDIS_PORT", "6379"))
    password = os.environ.get("REDIS_PASSWORD", "").strip()
    username = os.environ.get("REDIS_USERNAME", "").strip()
    use_tls = os.environ.get("USE_TLS", "0").strip() not in ("0", "false", "no")
    timeout_ms = int(os.environ.get("TIMEOUT_MS", "2000"))
    latency_warn_ms = int(os.environ.get("LATENCY_WARN_MS", "100"))
    timeout_sec = timeout_ms / 1000.0
    value_base = {"host": host, "port": port, "tls": use_tls}
    t0 = time.monotonic()
    try:
        raw_sock = socket.create_connection((host, port), timeout=timeout_sec)
        sock = ssl.create_default_context().wrap_socket(raw_sock, server_hostname=host) if use_tls else raw_sock
        sock.settimeout(timeout_sec)
        with sock:
            if password:
                sock.sendall(resp_array("AUTH", username, password) if username else resp_array("AUTH", password))
                auth_resp = read_resp(sock)
                if isinstance(auth_resp, str) and auth_resp.upper() != "OK":
                    elapsed_ms = round((time.monotonic() - t0) * 1000)
                    _out("error", f"Redis AUTH failed: unexpected response '{auth_resp}'",
                         {**value_base, "elapsed_ms": elapsed_ms})
                    sys.exit(2)
            t_ping = time.monotonic()
            sock.sendall(resp_inline("PING"))
            pong = read_resp(sock)
            elapsed_ms = round((time.monotonic() - t0) * 1000)
            ping_ms = round((time.monotonic() - t_ping) * 1000)
        if not (isinstance(pong, str) and pong.upper() == "PONG"):
            _out("error", f"Redis PING returned unexpected response: {pong!r}",
                 {**value_base, "elapsed_ms": elapsed_ms})
            sys.exit(2)
    except RuntimeError as exc:
        elapsed_ms = round((time.monotonic() - t0) * 1000)
        msg = str(exc)
        if "WRONGPASS" in msg or "NOAUTH" in msg:
            _out("error", f"Redis authentication failed: {msg}", {**value_base, "elapsed_ms": elapsed_ms})
        else:
            _out("error", f"Redis error: {msg}", {**value_base, "elapsed_ms": elapsed_ms})
        sys.exit(2)
    except (socket.timeout, TimeoutError):
        elapsed_ms = round((time.monotonic() - t0) * 1000)
        _out("error", f"Redis timeout after {elapsed_ms}ms ({host}:{port})", {**value_base, "elapsed_ms": elapsed_ms})
        sys.exit(2)
    except ConnectionRefusedError:
        elapsed_ms = round((time.monotonic() - t0) * 1000)
        _out("error", f"Redis connection refused by {host}:{port}", {**value_base, "elapsed_ms": elapsed_ms})
        sys.exit(2)
    except socket.gaierror as exc:
        elapsed_ms = round((time.monotonic() - t0) * 1000)
        _out("error", f"DNS resolution failed for '{host}': {exc.strerror}", {**value_base, "elapsed_ms": elapsed_ms})
        sys.exit(2)
    except ssl.SSLError as exc:
        elapsed_ms = round((time.monotonic() - t0) * 1000)
        _out("error", f"TLS error connecting to {host}:{port}: {exc}", {**value_base, "elapsed_ms": elapsed_ms})
        sys.exit(2)
    except (ConnectionError, ValueError, OSError) as exc:
        elapsed_ms = round((time.monotonic() - t0) * 1000)
        _out("error", f"Redis error from {host}:{port}: {exc}", {**value_base, "elapsed_ms": elapsed_ms})
        sys.exit(2)

    value = {**value_base, "elapsed_ms": elapsed_ms, "ping_ms": ping_ms}
    if elapsed_ms >= latency_warn_ms:
        _out("warning", f"Redis {host}:{port} PONG received but slow: {elapsed_ms}ms (threshold {latency_warn_ms}ms)", value)
        sys.exit(1)
    _out("ok", f"Redis PONG received from {host}:{port} in {elapsed_ms}ms", value)
    sys.exit(0)


if __name__ == "__main__":
    main()`,
	},

	// ── Performance ──────────────────────────────────────────────────────────
	{
		name: "CPU Load Average",
		description: "Compares the 1/5/15-minute load average against per-core thresholds. Reports warning before saturation hits.",
		runtime: "bash",
		parameters: { WINDOW: "5", WARN_PER_CORE: "0.8", CRIT_PER_CORE: "1.5" },
		body: `#!/usr/bin/env bash
# cpu_load.sh — CPU Load Average
# Exit 0=ok, 1=warning, 2=critical
# Env: WINDOW (1|5|15), WARN_PER_CORE, CRIT_PER_CORE

WINDOW="\${WINDOW:-5}"
WARN_PER_CORE="\${WARN_PER_CORE:-0.8}"
CRIT_PER_CORE="\${CRIT_PER_CORE:-1.5}"

if [[ ! -r /proc/loadavg ]]; then
    echo '{"status":"error","message":"/proc/loadavg not readable","value":null}'
    exit 2
fi
if ! command -v nproc &>/dev/null; then
    echo '{"status":"error","message":"nproc not found","value":null}'
    exit 2
fi

read -r load_1 load_5 load_15 _ < /proc/loadavg
cores=$(nproc)

case "$WINDOW" in
    1)  load_val="$load_1" ;;
    15) load_val="$load_15" ;;
    *)  load_val="$load_5" ;;
esac

result=$(awk -v load="$load_val" -v cores="$cores" -v warn="$WARN_PER_CORE" -v crit="$CRIT_PER_CORE" '
BEGIN {
    per_core = load / cores
    if (per_core >= crit) { print "critical " per_core }
    else if (per_core >= warn) { print "warning " per_core }
    else { print "ok " per_core }
}')

status=$(echo "$result" | awk '{print $1}')
load_per_core=$(echo "$result" | awk '{printf "%.4f", $2}')

case "$status" in
    critical)
        msg="CRITICAL: Load per core \${load_per_core} (\${load_val} over \${cores} core(s), window \${WINDOW}m)"
        exit_code=2 ;;
    warning)
        msg="WARNING: Load per core \${load_per_core} (\${load_val} over \${cores} core(s), window \${WINDOW}m)"
        exit_code=1 ;;
    *)
        msg="CPU load OK — \${load_val} over \${cores} core(s) (\${load_per_core} per core, window \${WINDOW}m)"
        exit_code=0 ;;
esac

echo "{\\"status\\":\\"$\{status}\\",\\"message\\":\\"$\{msg}\\",\\"value\\":{\\"load_1\\":$\{load_1},\\"load_5\\":$\{load_5},\\"load_15\\":$\{load_15},\\"cores\\":$\{cores},\\"window\\":$\{WINDOW},\\"load_per_core\\":$\{load_per_core}}}"
exit "$exit_code"`,
	},
	{
		name: "Memory & Swap Pressure",
		description: "Reports available memory and swap usage with separate thresholds. Uses MemAvailable to account for reclaimable cache.",
		runtime: "bash",
		parameters: { MEM_WARN_PCT: "85", MEM_CRIT_PCT: "95", SWAP_WARN_PCT: "50", SWAP_CRIT_PCT: "80" },
		body: `#!/usr/bin/env bash
# memory_swap.sh — Memory & Swap Pressure
# Exit 0=ok, 1=warning, 2=critical
# Env: MEM_WARN_PCT, MEM_CRIT_PCT, SWAP_WARN_PCT, SWAP_CRIT_PCT

MEM_WARN_PCT="\${MEM_WARN_PCT:-85}"
MEM_CRIT_PCT="\${MEM_CRIT_PCT:-95}"
SWAP_WARN_PCT="\${SWAP_WARN_PCT:-50}"
SWAP_CRIT_PCT="\${SWAP_CRIT_PCT:-80}"

if [[ ! -r /proc/meminfo ]]; then
    echo '{"status":"error","message":"/proc/meminfo not readable","value":null}'
    exit 2
fi

mem_total=$(awk '/^MemTotal:/{print $2}' /proc/meminfo)
mem_available=$(awk '/^MemAvailable:/{print $2}' /proc/meminfo)
swap_total=$(awk '/^SwapTotal:/{print $2}' /proc/meminfo)
swap_free=$(awk '/^SwapFree:/{print $2}' /proc/meminfo)

if [[ -z "$mem_total" || "$mem_total" -eq 0 ]]; then
    echo '{"status":"error","message":"Could not read MemTotal from /proc/meminfo","value":null}'
    exit 2
fi

mem_used=$(( mem_total - mem_available ))
mem_used_pct=$(( mem_used * 100 / mem_total ))
swap_used=0; swap_used_pct=0; swap_status="ok"
if [[ -n "$swap_total" && "$swap_total" -gt 0 ]]; then
    swap_used=$(( swap_total - swap_free ))
    swap_used_pct=$(( swap_used * 100 / swap_total ))
fi

mem_total_mb=$(( mem_total / 1024 ))
mem_used_mb=$(( mem_used / 1024 ))
swap_total_mb=$(( swap_total / 1024 ))
swap_used_mb=$(( swap_used / 1024 ))

mem_status="ok"
if [[ "$mem_used_pct" -ge "$MEM_CRIT_PCT" ]]; then mem_status="critical"
elif [[ "$mem_used_pct" -ge "$MEM_WARN_PCT" ]]; then mem_status="warning"; fi

if [[ "$swap_total" -gt 0 ]]; then
    if [[ "$swap_used_pct" -ge "$SWAP_CRIT_PCT" ]]; then swap_status="critical"
    elif [[ "$swap_used_pct" -ge "$SWAP_WARN_PCT" ]]; then swap_status="warning"; fi
fi

overall_status="ok"
for s in "$mem_status" "$swap_status"; do
    if [[ "$s" == "critical" ]]; then overall_status="critical"
    elif [[ "$s" == "warning" && "$overall_status" != "critical" ]]; then overall_status="warning"; fi
done

case "$overall_status" in
    critical)
        if [[ "$mem_status" == "critical" ]]; then
            msg="CRITICAL: Memory usage at \${mem_used_pct}% (\${mem_used_mb}MB / \${mem_total_mb}MB)"
        else
            msg="CRITICAL: Swap usage at \${swap_used_pct}% (\${swap_used_mb}MB / \${swap_total_mb}MB)"
        fi; exit_code=2 ;;
    warning)
        if [[ "$mem_status" == "warning" ]]; then
            msg="WARNING: Memory usage at \${mem_used_pct}% (\${mem_used_mb}MB / \${mem_total_mb}MB)"
        else
            msg="WARNING: Swap usage at \${swap_used_pct}% (\${swap_used_mb}MB / \${swap_total_mb}MB)"
        fi; exit_code=1 ;;
    *)
        msg="Memory OK (\${mem_used_pct}% used), Swap OK (\${swap_used_pct}% used)"
        exit_code=0 ;;
esac

echo "{\\"status\\":\\"$\{overall_status}\\",\\"message\\":\\"$\{msg}\\",\\"value\\":{\\"mem_total_mb\\":$\{mem_total_mb},\\"mem_used_mb\\":$\{mem_used_mb},\\"mem_used_pct\\":$\{mem_used_pct},\\"mem_status\\":\\"$\{mem_status}\\",\\"swap_total_mb\\":$\{swap_total_mb},\\"swap_used_mb\\":$\{swap_used_mb},\\"swap_used_pct\\":$\{swap_used_pct},\\"swap_status\\":\\"$\{swap_status}\\"}}"
exit "$exit_code"`,
	},
	{
		name: "OOM Killer Activity",
		description: "Detects recent kernel OOM-killer events that often go unnoticed. Prefers journalctl for time-bounded search, falls back to dmesg.",
		runtime: "bash",
		parameters: { LOOKBACK_MINUTES: "60", WARN_COUNT: "1", CRIT_COUNT: "3" },
		body: `#!/usr/bin/env bash
# oom_killer.sh — OOM Killer Activity
# Exit 0=ok, 1=warning, 2=critical
# Env: LOOKBACK_MINUTES, WARN_COUNT, CRIT_COUNT

LOOKBACK_MINUTES="\${LOOKBACK_MINUTES:-60}"
WARN_COUNT="\${WARN_COUNT:-1}"
CRIT_COUNT="\${CRIT_COUNT:-3}"

oom_lines=""
if command -v journalctl &>/dev/null; then
    oom_lines=$(journalctl -k --since "\${LOOKBACK_MINUTES} minutes ago" 2>/dev/null \
        | grep -iE "oom.kill|killed process|out of memory" || true)
fi

if [[ -z "$oom_lines" ]] && command -v dmesg &>/dev/null; then
    raw_dmesg=$(dmesg -T 2>/dev/null || dmesg 2>/dev/null || true)
    if [[ -n "$raw_dmesg" ]]; then
        oom_lines=$(echo "$raw_dmesg" | grep -iE "oom.kill|killed process|out of memory" || true)
    fi
fi

oom_count=0
last_victim=""

if [[ -n "$oom_lines" ]]; then
    oom_count=$(echo "$oom_lines" | grep -ic "killed process" || true)
    if ! [[ "$oom_count" =~ ^[0-9]+$ ]]; then oom_count=0; fi
    last_line=$(echo "$oom_lines" | grep -i "killed process" | tail -1 || true)
    if [[ -n "$last_line" ]]; then
        victim=$(echo "$last_line" | grep -oP 'Killed process \\d+ \\(\\K[^)]+' 2>/dev/null || \
                 echo "$last_line" | sed 's/.*Killed process [0-9]* (\\([^)]*\\)).*/\\1/' 2>/dev/null || true)
        last_victim="\${victim:-unknown}"
    fi
fi

if [[ "$oom_count" -ge "$CRIT_COUNT" ]]; then
    status="critical"
    msg="CRITICAL: \${oom_count} OOM kill event(s) in last \${LOOKBACK_MINUTES} minute(s) — last victim: \${last_victim:-none}"
    exit_code=2
elif [[ "$oom_count" -ge "$WARN_COUNT" ]]; then
    status="warning"
    msg="WARNING: \${oom_count} OOM kill event(s) in last \${LOOKBACK_MINUTES} minute(s) — last victim: \${last_victim:-none}"
    exit_code=1
else
    status="ok"
    msg="No OOM kill events in last \${LOOKBACK_MINUTES} minute(s)"
    exit_code=0
fi

last_victim_json="null"
[[ -n "$last_victim" ]] && last_victim_json="\\"$\{last_victim}\\""

echo "{\\"status\\":\\"$\{status}\\",\\"message\\":\\"$\{msg}\\",\\"value\\":{\\"oom_count\\":$\{oom_count},\\"lookback_minutes\\":$\{LOOKBACK_MINUTES},\\"last_victim\\":$\{last_victim_json}}}"
exit "$exit_code"`,
	},

	// ── Logs & Events ────────────────────────────────────────────────────────
	{
		name: "Log File Error Pattern",
		description: "Tails the last N lines of a log file (supports globs) and counts matches of an error regex. Returns the first 3 matching lines for context.",
		runtime: "python",
		parameters: {
			LOG_PATH: "/var/log/syslog",
			TAIL_LINES: "500",
			ERROR_REGEX: "(?i)\\b(error|fatal|panic|traceback)\\b",
			IGNORE_REGEX: "",
			WARN_COUNT: "1",
			CRIT_COUNT: "10",
		},
		body: `#!/usr/bin/env python3
# log_error_pattern.py — Log File Error Pattern
# Exit 0=ok, 1=warning, 2=error
# Env: LOG_PATH, TAIL_LINES, ERROR_REGEX, IGNORE_REGEX, WARN_COUNT, CRIT_COUNT

import glob
import json
import os
import re
import sys


def _out(status, message, value=None):
    print(json.dumps({"status": status, "message": message, "value": value}))


CHUNK_SIZE = 8192


def tail_lines(path, n):
    with open(path, "rb") as fh:
        fh.seek(0, 2)
        file_size = fh.tell()
        if file_size == 0:
            return []
        buf = bytearray()
        pos = file_size
        lines_found = 0
        while pos > 0 and lines_found <= n:
            read_size = min(CHUNK_SIZE, pos)
            pos -= read_size
            fh.seek(pos)
            chunk = fh.read(read_size)
            buf = bytearray(chunk) + buf
            lines_found = buf.count(b"\\n")
        text = buf.decode("utf-8", errors="replace")
        all_lines = text.splitlines()
        if pos > 0:
            all_lines = all_lines[1:]
        return all_lines[-n:] if len(all_lines) > n else all_lines


def main():
    log_path_pattern = os.environ.get("LOG_PATH", "/var/log/syslog")
    tail_n = int(os.environ.get("TAIL_LINES", "500"))
    error_pattern = os.environ.get("ERROR_REGEX", r"(?i)\\b(error|fatal|panic|traceback)\\b")
    ignore_pattern = os.environ.get("IGNORE_REGEX", "").strip()
    warn_count = int(os.environ.get("WARN_COUNT", "1"))
    crit_count = int(os.environ.get("CRIT_COUNT", "10"))

    try:
        error_re = re.compile(error_pattern)
    except re.error as exc:
        _out("error", f"Invalid ERROR_REGEX: {exc}")
        sys.exit(2)

    ignore_re = None
    if ignore_pattern:
        try:
            ignore_re = re.compile(ignore_pattern)
        except re.error as exc:
            _out("error", f"Invalid IGNORE_REGEX: {exc}")
            sys.exit(2)

    matched_paths = sorted(glob.glob(log_path_pattern))
    if not matched_paths:
        _out("error", f"No files found matching '{log_path_pattern}'", {"path_pattern": log_path_pattern})
        sys.exit(2)

    if len(matched_paths) > 1:
        matched_paths = sorted(matched_paths, key=lambda p: os.path.getmtime(p), reverse=True)

    log_file = matched_paths[0]

    try:
        lines = tail_lines(log_file, tail_n)
    except FileNotFoundError:
        _out("error", f"Log file not found: {log_file}", {"path": log_file})
        sys.exit(2)
    except PermissionError:
        _out("error", f"Permission denied reading: {log_file}", {"path": log_file})
        sys.exit(2)
    except OSError as exc:
        _out("error", f"Cannot read '{log_file}': {exc}", {"path": log_file})
        sys.exit(2)

    match_lines = []
    for line in lines:
        if error_re.search(line):
            if ignore_re and ignore_re.search(line):
                continue
            match_lines.append(line)

    count = len(match_lines)
    sample = [ln[:300] for ln in match_lines[:3]]

    value = {
        "log_file": log_file, "lines_checked": len(lines), "match_count": count,
        "sample_lines": sample, "error_regex": error_pattern,
        "ignore_regex": ignore_pattern or None,
    }

    if count >= crit_count:
        _out("error", f"CRITICAL: {count} error pattern matches in last {len(lines)} lines of {log_file}", value)
        sys.exit(2)
    if count >= warn_count:
        _out("warning", f"WARNING: {count} error pattern matches in last {len(lines)} lines of {log_file}", value)
        sys.exit(1)

    _out("ok", f"No error patterns found in last {len(lines)} lines of {log_file}", value)
    sys.exit(0)


if __name__ == "__main__":
    main()`,
	},
	{
		name: "Windows Event Log Errors",
		description: "Counts recent error/critical events in selected Windows event logs using FilterHashtable for performance. Reports the 3 most recent events for context.",
		runtime: "powershell",
		parameters: { LOG_NAMES: "System,Application", LOOKBACK_MINUTES: "30", LEVELS: "1,2", PROVIDER_INCLUDE: "", PROVIDER_EXCLUDE: "", WARN_COUNT: "1", CRIT_COUNT: "10" },
		body: `#Requires -Version 5.1
# windows_event_log.ps1 — Windows Event Log Errors
# Exit 0=ok, 1=warning, 2=critical
# Env: LOG_NAMES, LOOKBACK_MINUTES, LEVELS, PROVIDER_INCLUDE, PROVIDER_EXCLUDE, WARN_COUNT, CRIT_COUNT

$LogNames        = if ($Env:LOG_NAMES)        { $Env:LOG_NAMES }        else { 'System,Application' }
$LookbackMinutes = if ($Env:LOOKBACK_MINUTES) { [int]$Env:LOOKBACK_MINUTES } else { 30 }
$LevelsRaw       = if ($Env:LEVELS)           { $Env:LEVELS }           else { '1,2' }
$ProviderInclude = if ($Env:PROVIDER_INCLUDE) { $Env:PROVIDER_INCLUDE } else { '' }
$ProviderExclude = if ($Env:PROVIDER_EXCLUDE) { $Env:PROVIDER_EXCLUDE } else { '' }
$WarnCount       = if ($Env:WARN_COUNT)       { [int]$Env:WARN_COUNT }  else { 1 }
$CritCount       = if ($Env:CRIT_COUNT)       { [int]$Env:CRIT_COUNT }  else { 10 }

$levels    = $LevelsRaw -split ',' | ForEach-Object { [int]$_.Trim() }
$logList   = $LogNames  -split ',' | ForEach-Object { $_.Trim() } | Where-Object { $_ -ne '' }
$startTime = (Get-Date).AddMinutes(-$LookbackMinutes)

$includeProviders = @()
if ($ProviderInclude -ne '') { $includeProviders = $ProviderInclude -split ',' | ForEach-Object { $_.Trim() } | Where-Object { $_ -ne '' } }
$excludeProviders = @()
if ($ProviderExclude -ne '') { $excludeProviders = $ProviderExclude -split ',' | ForEach-Object { $_.Trim() } | Where-Object { $_ -ne '' } }

$allEvents  = [System.Collections.Generic.List[object]]::new()
$scanErrors = [System.Collections.Generic.List[string]]::new()

foreach ($logName in $logList) {
    try {
        $ErrorActionPreference = 'Stop'
        $events = Get-WinEvent -FilterHashtable @{ LogName=$logName; Level=$levels; StartTime=$startTime } -ErrorAction Stop
        foreach ($evt in $events) {
            if ($includeProviders.Count -gt 0 -and $includeProviders -notcontains $evt.ProviderName) { continue }
            if ($excludeProviders.Count -gt 0 -and $excludeProviders -contains  $evt.ProviderName) { continue }
            $allEvents.Add($evt)
        }
    }
    catch [System.Exception] {
        if     ($_.Exception.Message -match 'No events were found') { }
        elseif ($_.Exception.Message -match 'does not exist')       { $scanErrors.Add("Log not found: $logName") }
        elseif ($_ -is [System.UnauthorizedAccessException])        { $scanErrors.Add("Access denied reading log: $logName") }
        else   { $scanErrors.Add("Error reading log '$($logName)': $($_.Exception.Message)") }
    }
    finally { $ErrorActionPreference = 'Continue' }
}

$totalCount   = $allEvents.Count
$sampleEvents = [System.Collections.Generic.List[object]]::new()
$taken = 0
foreach ($evt in $allEvents) {
    if ($taken -ge 3) { break }
    $rawMsg = if ($null -eq $evt.Message) { '' } else { $evt.Message }
    $truncMsg = if ($rawMsg.Length -gt 300) { $rawMsg.Substring(0, 300) + '...' } else { $rawMsg }
    $sampleEvents.Add([PSCustomObject]@{
        TimeCreated = $evt.TimeCreated.ToString('yyyy-MM-ddTHH:mm:ssZ')
        ProviderName = $evt.ProviderName; Id = $evt.Id
        Level = $evt.LevelDisplayName; LogName = $evt.LogName; Message = $truncMsg
    })
    $taken++
}

if    ($totalCount -ge $CritCount) { $status='critical'; $msg="CRITICAL: $totalCount event(s) in last $($LookbackMinutes)m across [$($logList -join ', ')] (threshold: $CritCount)"; $exitCode=2 }
elseif($totalCount -ge $WarnCount) { $status='warning';  $msg="WARNING: $totalCount event(s) in last $($LookbackMinutes)m across [$($logList -join ', ')] (threshold: $WarnCount)";  $exitCode=1 }
else                               { $status='ok';       $msg="OK: $totalCount event(s) in last $($LookbackMinutes)m across [$($logList -join ', ')]";                                $exitCode=0 }

$result = [ordered]@{
    status = $status; message = $msg
    value  = [ordered]@{
        total_events = $totalCount; lookback_minutes = $LookbackMinutes
        logs_checked = $logList; levels_checked = $levels
        sample_events = @($sampleEvents); scan_errors = @($scanErrors)
    }
}
Write-Output ($result | ConvertTo-Json -Compress -Depth 4)
exit $exitCode`,
	},

	// ── Backup ───────────────────────────────────────────────────────────────
	{
		name: "Backup File Age",
		description: "Asserts a backup file (or newest file matching a glob) was modified within an acceptable window and is non-empty. Guards against silent backup job failures.",
		runtime: "python",
		parameters: { BACKUP_PATH: "/var/backups/latest.tar.gz", WARN_HOURS: "26", CRIT_HOURS: "48", MIN_SIZE_BYTES: "1024" },
		body: `#!/usr/bin/env python3
# backup_age.py — Backup File Age
# Exit 0=ok, 1=warning, 2=error
# Env: BACKUP_PATH, WARN_HOURS, CRIT_HOURS, MIN_SIZE_BYTES

import glob
import json
import os
import sys
import time


def _out(status, message, value=None):
    print(json.dumps({"status": status, "message": message, "value": value}))


def main():
    backup_pattern = os.environ.get("BACKUP_PATH", "/var/backups/latest.tar.gz")
    warn_hours = float(os.environ.get("WARN_HOURS", "26"))
    crit_hours = float(os.environ.get("CRIT_HOURS", "48"))
    min_size_bytes = int(os.environ.get("MIN_SIZE_BYTES", "1024"))

    candidates = glob.glob(backup_pattern)
    if not candidates:
        _out("error", f"No backup files found matching '{backup_pattern}'", {"path_pattern": backup_pattern})
        sys.exit(2)

    newest_path = None
    newest_mtime = -1.0
    newest_size = 0

    for path in candidates:
        try:
            st = os.stat(path)
        except FileNotFoundError:
            continue
        except PermissionError:
            _out("error", f"Permission denied accessing: {path}", {"path": path})
            sys.exit(2)
        except OSError as exc:
            _out("error", f"Cannot stat '{path}': {exc}", {"path": path})
            sys.exit(2)
        if st.st_mtime > newest_mtime:
            newest_mtime = st.st_mtime
            newest_path = path
            newest_size = st.st_size

    if newest_path is None:
        _out("error", f"Could not stat any backup files matching '{backup_pattern}'", {"path_pattern": backup_pattern})
        sys.exit(2)

    age_hours = round((time.time() - newest_mtime) / 3600.0, 2)
    value = {"file_path": newest_path, "age_hours": age_hours, "size_bytes": newest_size,
             "mtime_epoch": int(newest_mtime), "files_found": len(candidates)}

    if newest_size < min_size_bytes:
        _out("error", f"Backup file too small: {newest_path} is {newest_size} bytes (minimum {min_size_bytes} bytes)", value)
        sys.exit(2)
    if age_hours >= crit_hours:
        _out("error", f"Backup critically old: {newest_path} is {age_hours}h old (threshold {crit_hours}h)", value)
        sys.exit(2)
    if age_hours >= warn_hours:
        _out("warning", f"Backup may be stale: {newest_path} is {age_hours}h old (threshold {warn_hours}h)", value)
        sys.exit(1)

    _out("ok", f"Backup OK: {newest_path} is {age_hours}h old, {newest_size} bytes", value)
    sys.exit(0)


if __name__ == "__main__":
    main()`,
	},
];

// ---------------------------------------------------------------------------
// Migration entry point
// ---------------------------------------------------------------------------

export async function seedDefaultScripts(): Promise<void> {
	// If the encryption key is not configured, skip seeding rather than crash.
	// The admin can re-run by deleting the migration record once the key is set.
	if (!process.env.SCRIPT_ENCRYPTION_KEY) {
		logger.warn({
			service: SERVICE_NAME,
			message: "SCRIPT_ENCRYPTION_KEY not set — skipping default script seeding. Delete this migration record and restart once the key is configured.",
		});
		return;
	}

	const teams = await TeamModel.find({}).lean();
	if (teams.length === 0) {
		logger.info({ service: SERVICE_NAME, message: "No teams found — skipping default script seeding." });
		return;
	}

	let totalCreated = 0;
	let totalSkipped = 0;

	for (const team of teams) {
		const teamId = team._id;

		// Find any user in this team to use as createdBy
		const user = await UserModel.findOne({ teamId }).lean();
		if (!user) {
			logger.warn({ service: SERVICE_NAME, message: `No users found for team ${String(teamId)} — skipping.` });
			continue;
		}
		const createdBy = user._id;

		for (const def of DEFAULT_SCRIPTS) {
			const exists = await ScriptModel.exists({ teamId, name: def.name });
			if (exists) {
				totalSkipped++;
				continue;
			}

			try {
				const bodyHash = hashScriptBody(def.body);
				const encryptedBody = encryptScriptBody(def.body);

				await ScriptModel.create({
					teamId,
					createdBy,
					name: def.name,
					description: def.description,
					runtime: def.runtime,
					bodyHash,
					encryptedBody,
					parameters: def.parameters,
				});
				totalCreated++;
			} catch (err) {
				const message = err instanceof Error ? err.message : String(err);
				logger.error({ service: SERVICE_NAME, message: `Failed to create script '${def.name}' for team ${String(teamId)}: ${message}` });
				throw err;
			}
		}
	}

	logger.info({
		service: SERVICE_NAME,
		message: `Default script seeding complete — created ${totalCreated}, skipped ${totalSkipped} (already existed).`,
	});
}
