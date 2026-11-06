#!/usr/bin/env bash
# Run the whole lab in order and capture a transcript for each step.
# Run:  bash run-all.sh            (all labs)
#       bash run-all.sh 04 07      (only selected lab numbers)
#       bash run-all.sh --quick    (skip the slow namespace labs)
set -u
cd "$(dirname "${BASH_SOURCE[0]}")"
source ./lab-common.sh

OUT="$LAB_WORK/transcripts"
mkdir -p "$OUT"

QUICK=0
WANT=()
for arg in "$@"; do
  case "$arg" in
    --quick) QUICK=1 ;;
    *) WANT+=("$arg") ;;
  esac
done

SLOW_LABS="04 06 09 12"

run_one() {
  local f=$1
  local num
  num="$(basename "$f" | cut -d- -f1)"
  local name; name="$(basename "$f" .sh)"
  local log="$OUT/$name.log"

  printf '\n%s##############################################################%s\n' "$C_BLUE" "$C_RESET"
  printf '%s# RUNNING: %s%s\n' "$C_BOLD$C_BLUE" "$name" "$C_RESET"
  printf '%s##############################################################%s\n' "$C_BLUE" "$C_RESET"
  local start=$SECONDS
  bash "$f" 2>&1 | tee "$log"
  local rc=${PIPESTATUS[0]}
  local dur=$((SECONDS - start))
  if [ "$rc" -eq 0 ]; then
    printf '%s[RESULT] %s PASSED in %ss (transcript: %s)%s\n' "$C_GREEN" "$name" "$dur" "$log" "$C_RESET"
  else
    printf '%s[RESULT] %s EXIT=%s in %ss (transcript: %s)%s\n' "$C_RED" "$name" "$rc" "$dur" "$log" "$C_RESET"
  fi
}

for f in labs/*.sh; do
  num="$(basename "$f" | cut -d- -f1)"
  if [ ${#WANT[@]} -gt 0 ]; then
    skip=1
    for w in "${WANT[@]}"; do [ "$w" = "$num" ] && skip=0; done
    [ "$skip" -eq 1 ] && continue
  fi
  if [ "$QUICK" -eq 1 ]; then
    for s in $SLOW_LABS; do [ "$s" = "$num" ] && { printf '%s[SKIP --quick] %s%s\n' "$C_YELLOW" "$f" "$C_RESET"; continue 2; }; done
  fi
  run_one "$f"
done

printf '\n%s==============================================================%s\n' "$C_BLUE" "$C_RESET"
printf '%s ALL DONE - transcripts: %s%s\n' "$C_BOLD" "$OUT" "$C_RESET"
printf '%s==============================================================%s\n' "$C_BLUE" "$C_RESET"
bash verify.sh
