#!/usr/bin/env bash
# Shared helpers for the Linux Logging + Networking practice lab.
# Sourced by every script in labs/. Not meant to be executed directly.

LAB_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export LAB_DIR
export LAB_WORK="${LAB_WORK:-$LAB_DIR/work}"
export LOG_DIR="$LAB_WORK/logs"
export CENTRAL_DIR="$LAB_WORK/central"
export ROTATE_DIR="$LAB_WORK/logrotate"
export BIN_DIR="$LAB_DIR/bin"

if [ -t 1 ] && [ "${NO_COLOR:-}" = "" ]; then
  C_RESET=$'\033[0m'; C_BOLD=$'\033[1m'; C_BLUE=$'\033[1;34m'
  C_GREEN=$'\033[1;32m'; C_YELLOW=$'\033[1;33m'; C_RED=$'\033[1;31m'; C_DIM=$'\033[2m'
else
  C_RESET=""; C_BOLD=""; C_BLUE=""; C_GREEN=""; C_YELLOW=""; C_RED=""; C_DIM=""
fi

section() {
  printf '\n%s==============================================================%s\n' "$C_BLUE" "$C_RESET"
  printf '%s>>> %s%s\n' "$C_BOLD$C_BLUE" "$*" "$C_RESET"
  printf '%s==============================================================%s\n' "$C_BLUE" "$C_RESET"
}

step()  { printf '\n%s--- %s%s\n' "$C_BOLD" "$*" "$C_RESET"; }
note()  { printf '%s    %s%s\n' "$C_DIM" "$*" "$C_RESET"; }
ok()    { printf '%s    [OK] %s%s\n' "$C_GREEN" "$*" "$C_RESET"; }
warn()  { printf '%s    [WARN] %s%s\n' "$C_YELLOW" "$*" "$C_RESET"; }
fail()  { printf '%s    [FAIL] %s%s\n' "$C_RED" "$*" "$C_RESET"; }
tip()   { printf '\n%s    💡 TIP: %s%s\n' "$C_YELLOW" "$*" "$C_RESET"; }

# Run a command, echoing it first so the transcript is copy-pasteable.
cmd() {
  printf '\n%s$ %s%s\n' "$C_DIM" "$*" "$C_RESET"
  "$@"
}

# Run a shell snippet, echoing it first.
sh_cmd() {
  printf '\n%s$ %s%s\n' "$C_DIM" "$*" "$C_RESET"
  bash -c "$*"
}

need_root() {
  if [ "$(id -u)" -ne 0 ]; then
    warn "Ye step root chahiye (sudo). Skip karein, ya poori script ko 'sudo bash <script>' se chalayein."
    return 1
  fi
  return 0
}

need_cmd() {
  local missing=0
  for c in "$@"; do
    command -v "$c" >/dev/null 2>&1 || { warn "Missing command: $c"; missing=1; }
  done
  return $missing
}

ensure_dirs() {
  mkdir -p "$LOG_DIR" "$CENTRAL_DIR" "$ROTATE_DIR/logs" "$ROTATE_DIR/state"
}

# Print a free TCP port on 127.0.0.1 (busy machines par bhi lab chale).
pick_port() {
  python3 - <<'PY'
import socket
s = socket.socket()
s.bind(("127.0.0.1", 0))
print(s.getsockname()[1])
s.close()
PY
}

# Kill a pid and make sure it is really gone (lab apps cleanup).
kill_pid() {
  local pid=$1
  [ -z "$pid" ] && return 0
  kill "$pid" 2>/dev/null
  for _ in $(seq 1 20); do
    kill -0 "$pid" 2>/dev/null || return 0
    sleep 0.1
  done
  kill -9 "$pid" 2>/dev/null
  return 0
}

# Kill any leftover lab app processes (safe: only our own python apps).
kill_lab_apps() {
  pkill -f "$LAB_DIR/apps/httpapp.py" 2>/dev/null
  pkill -f "$LAB_DIR/apps/logapp.py" 2>/dev/null
  return 0
}

# Run a snippet inside a private (user-namespaced) network namespace.
# Usage: in_netns 'commands...'
# Gives a clean network stack + working iptables without root.
in_netns() {
  unshare --user --map-root-user --net --mount bash -c '
    mount --make-rprivate / 2>/dev/null
    mount -t tmpfs tmpfs /run 2>/dev/null
    ip link set lo up
    '"$1"
}

cleanup_bg() {
  [ -n "${1:-}" ] && kill "$1" 2>/dev/null
  return 0
}

banner_lab() {
  printf '%s\n' "$C_BOLD"
  printf '  Linux Logging + Networking Practice Lab\n'
  printf '  Repo: %s\n' "$LAB_DIR"
  printf '  Work: %s%s\n' "$LAB_WORK" "$C_RESET"
}
