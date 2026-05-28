# Script Monitors

Script monitors are Checkmate's most flexible monitor type. They execute a
Bash, PowerShell, or Python script on a **Capture agent** and use the
script's output to decide whether the resource being checked is up, in a
warning state, or down. Anything you can express in a shell command can be
turned into a monitor: API contracts, certificate expiry checks, replication
lag, message-queue depth, custom business KPIs, on-prem services that have
no public health endpoint, etc.

This document covers the end-to-end flow, the output format the parser
understands, capture-agent registration, device authentication targets,
example scripts, and the most common troubleshooting questions.

---

## 1. Overview

```
Checkmate server  ──HTTP POST──▶  Capture agent  ──exec──▶  Bash | Python | PowerShell
       ▲                              │
       │                              │ JSON {exit_code, stdout, stderr, ...}
       └──────── parses ──────────────┘
```

* **Script** — encrypted blob of source code stored on the Checkmate
  server. A monitor references a script by `scriptId`.
* **Capture agent** — long-running HTTP service that knows how to spawn
  the requested runtime, enforce the timeout, and stream the result back.
  A single capture agent can serve many Checkmate monitors.
* **Device (optional)** — an SSH/WinRM endpoint registered against a
  capture agent. When a monitor references a device, the script body's
  `%%hostname%%`, `%%ip%%`, and `%%devicename%%` placeholders are filled
  in before the body is sent to the agent.

The agent **never sees plaintext scripts at rest**. The server decrypts
the body in memory, expands variables, sends it over TLS to the agent,
and the agent executes it and discards the body on completion.

## 2. Quick start (3 steps)

1. **Create the script** at `Scripts → New`. Choose a runtime, paste the
   body, set any default parameters. Use the help panel on the right for
   the output format reference and starter templates.
2. **Register the capture agent** at `Settings → Capture agents → Add
   agent`. Provide the URL the Checkmate server can reach (e.g.
   `https://capture.internal:59232`) and the shared bearer token the
   agent expects. Toggle the script capability on.
3. **Create the monitor** at `Uptime → New monitor → Script`. Pick the
   script, the capture agent, optionally a device, and a check
   interval. Save.

The first execution should appear within the configured interval. Open
the monitor detail page to see parsed status, datapoint charts, and the
execution history.

## 3. Script output format

Scripts communicate with Checkmate via stdout lines. Two patterns are
recognised, anything else is preserved as raw output for the operator to
read.

### 3.1 Status line

```
Success(<target>)=<message>
Info(<target>)=<message>
Warning(<target>)=<message>
Error(<target>)=<message>
Critical(<target>)=<message>
```

* `Success` / `Info` → monitor is **up**.
* `Warning` → up by default; toggle "Warning counts as down" in the
  monitor form to flip this to down.
* `Error` / `Critical` → monitor is **down**.

`<target>` is a free-form label (typically `%%devicename%%`). `<message>`
is the human-readable summary shown in the status banner, notifications,
and the execution history. The last status line in stdout wins so
multi-step scripts can summarise their final state on exit.

### 3.2 Datapoints

```
Datapoint(<name>)=<numeric value>[ <unit>]
```

Examples:

```
Datapoint(cpu_pct)=72.3
Datapoint(disk_free_gb)=120.4 GB
Datapoint(response_ms)=147
```

Datapoints are graphed automatically. One series per unique `<name>`.
Use them for any numeric value you want to see trended over time.

### 3.3 Variables

The server replaces these placeholders in the script body **before**
sending it to the capture agent:

| Variable             | Source                                  |
| -------------------- | --------------------------------------- |
| `%%devicename%%`     | Device name (falls back to monitor name) |
| `%%monitorname%%`    | Monitor name                            |
| `%%hostname%%`       | Device hostname (or monitor URL host)   |
| `%%ip%%`             | Device IP address                       |
| `%%captureagent%%`   | Capture agent URL                       |
| `%%runtime%%`        | `bash`, `python`, or `powershell`       |
| `%%datetime%%`       | ISO-8601 UTC timestamp                  |
| `%%teamname%%`       | Team name                               |
| `%%<paramKey>%%`     | Any key from the monitor's parameter overrides (case-insensitive) |

Unknown placeholders are left as-is so scripts can use literal `%%`
strings in regexes if needed.

### 3.4 Multi-line messages

Use `\n` (or, if your shell prevents that, `<br />`) inside the message
portion of a status line. The Checkmate UI renders both as line breaks.

```bash
echo "Error(%%devicename%%)=Service down<br />Last seen: $(date)"
```

## 4. Capture agent setup

The capture agent ships as a Docker image. A minimal `docker run`:

```bash
docker run -d \
  --name checkmate-capture \
  -p 59232:59232 \
  -e CAPTURE_BEARER_TOKEN="$(openssl rand -hex 32)" \
  -e CAPTURE_ENABLE_SCRIPTS=true \
  -e CAPTURE_ENABLE_METRICS=false \
  bluewavelabs/capture:latest
```

The relevant environment variables:

| Variable                     | Description                                                       |
| ---------------------------- | ----------------------------------------------------------------- |
| `CAPTURE_BEARER_TOKEN`       | Shared secret. Paste the same string in the Checkmate UI.         |
| `CAPTURE_ENABLE_SCRIPTS`     | `true` to allow script execution.                                 |
| `CAPTURE_ENABLE_METRICS`     | `true` to expose `/api/v1/metrics` for infrastructure monitors.   |
| `CAPTURE_SCRIPT_TIMEOUT_MS`  | Maximum script runtime in milliseconds. Default `300000`.         |
| `CAPTURE_LOG_LEVEL`          | `debug` / `info` / `warn` / `error`.                              |

Register the agent in the Checkmate UI under `Settings → Capture
agents`. Once the health probe succeeds (visible as a tick on the list
page) the agent is ready to dispatch scripts.

## 5. Device authentication targets

A capture agent can run scripts locally or, when configured, target a
remote host via SSH or WinRM. Devices live under the agent so a single
agent can fan out to many hosts without managing credentials in
Checkmate itself.

* **Purpose** — populate `%%hostname%%`, `%%ip%%`, and `%%devicename%%`
  before the body is shipped. Per-device credentials are encrypted at
  rest using AES-256-GCM and decrypted only at execution time.
* **Adding a device** — open `Settings → Capture agents → Devices →
  Add device`. Pick the auth type (`SSH`, `WinRM`, or `None`), supply
  username/password (and optionally an SSH key fingerprint and port).
* **Per-monitor variable injection** — once the monitor's `deviceId` is
  set, `%%hostname%%` etc. resolve from the device instead of the
  monitor URL.

## 6. Example scripts

### Bash — disk usage

```bash
#!/bin/bash
USAGE=$(df -h / | awk 'NR==2{print $5}' | tr -d '%')
if [ "$USAGE" -gt 90 ]; then
  echo "Critical(%%devicename%%)=Disk usage is ${USAGE}%"
elif [ "$USAGE" -gt 80 ]; then
  echo "Warning(%%devicename%%)=Disk usage is ${USAGE}%"
else
  echo "Success(%%devicename%%)=Disk usage is ${USAGE}%"
fi
echo "Datapoint(disk_pct)=${USAGE}"
```

### Bash — systemd service

```bash
#!/bin/bash
SERVICE="nginx"
if systemctl is-active --quiet "$SERVICE"; then
  echo "Success(%%devicename%%)=$SERVICE is active"
else
  echo "Error(%%devicename%%)=$SERVICE is not active"
  exit 1
fi
```

### Python — HTTP latency

```python
import sys, time, urllib.request
url = "https://%%hostname%%"
try:
    start = time.monotonic()
    r = urllib.request.urlopen(url, timeout=5)
    ms = int((time.monotonic() - start) * 1000)
    print(f"Success(%%devicename%%)=HTTP {r.status} in {ms}ms")
    print(f"Datapoint(response_ms)={ms}")
except Exception as e:
    print(f"Error(%%devicename%%)=Request failed: {e}")
    sys.exit(1)
```

### PowerShell — Windows service

```powershell
$service = "wuauserv"
$svc = Get-Service -Name $service -ErrorAction SilentlyContinue
if ($svc -and $svc.Status -eq "Running") {
    Write-Output "Success(%%devicename%%)=Service $service is running"
} else {
    Write-Output "Error(%%devicename%%)=Service $service is not running"
    exit 1
}
```

## 7. Troubleshooting FAQ

1. **The monitor stays in `initializing`.** Open the agent and check
   it can be reached from the Checkmate server with `curl
   $AGENT_URL/health`. If the health probe returns 401, the bearer
   token in the agent and in the Checkmate UI do not match.
2. **The monitor shows the right exit code but the wrong status.** The
   parser prefers status lines over exit codes. Make sure your status
   line matches `Success|Info|Warning|Error|Critical(<target>)=<msg>`
   exactly — no leading whitespace, no extra spaces inside the
   parentheses.
3. **Variables stay as `%%name%%` in the executed script.** Variable
   names are case-insensitive; the lookup is lower-cased. Custom
   parameter keys must be lower-case alphanumeric/underscore — the
   parser only consumes `[a-z0-9_]+`.
4. **Datapoints do not appear.** The right-hand side must be numeric.
   `Datapoint(rate)=N/A` is silently ignored. Units may follow a single
   space and use letters / `%` / `/` / `_` / `-`.
5. **`Script integrity check failed`.** The hash stored alongside the
   encrypted body did not match. Re-save the script — this rotates the
   ciphertext and the hash atomically.
6. **`Capture agent is not active`.** Toggle the agent back on in
   `Settings → Capture agents`. Inactive agents are excluded from
   dispatch so you can drain traffic without deleting the registration.
7. **`Capture agent ... has no stored token`.** The encrypted bearer
   token is missing. Update the agent and re-enter the secret so the
   server re-encrypts it.
8. **Scripts time out at exactly 30 seconds.** The default
   per-execution timeout is 30s. Increase it in the monitor's
   configuration up to 300s; anything longer should be redesigned as a
   background job that reports state via webhook.
9. **`captureAgentId is required for script monitors`.** Either pick a
   capture agent from the dropdown or, for legacy probe-based monitors,
   continue to supply `probeId` with execution target `probe`.
10. **Pre-existing probe-based monitors stopped working.** Migration
    `0009_migrateProbesToCaptureAgents` converts probe registrations to
    capture agents and rewrites `probeId` → `captureAgentId`. If you
    rolled back the migration manually, re-run the migrator or restore
    the old probe registration via Mongo.

## 8. Security notes

* Script bodies are encrypted at rest with AES-256-GCM using a
  team-wide key derived from `SCRIPT_ENCRYPTION_KEY`.
* The shared secret between Checkmate and a capture agent is stored as
  a bcrypt hash for inbound auth and as AES-256-GCM ciphertext for
  outbound dispatch, so a database dump never exposes the plaintext.
* Audit log entries (`script.execute`, `captureAgent.register`,
  `captureAgentDevice.add`, etc.) live for 90 days via a Mongo TTL
  index. They never include script bodies or stdout content.
* The `verifyScriptBodyHash` check in the script service tolerates no
  silent drift between the encrypted blob and the SHA-256 hash; a
  mismatch aborts execution.
* Capture agent endpoints must be served over HTTPS in production.
  Health checks honour the configured TLS chain.
