#!/bin/bash
# Voice test for Betűkaland: every candidate voice reads the 18 test lines, then a page opens
# where you can listen to them side by side and score them.
#   cd ~/Documents/programming_projects/betukaland && bash tools/voice/test_voices.sh
# Optional: bash tools/voice/test_voices.sh apple piper     (only these engines)
# It takes about an hour the first time (downloads ~6 GB: models and three Python setups).
# Stop it any time with Ctrl+C and run it again: finished lines are kept.
cd "$(dirname "$0")/../.."
ROOT="$PWD"; V="$ROOT/voice"; mkdir -p "$V/test" "$V/env"
ENGINES="${*:-apple piper f5 kokoro xtts}"
LOG="$V/test/log.txt"; echo "== $(date)" >> "$LOG"

# a Python 3.11 for the model engines: uv brings its own, otherwise an installed one
if command -v uv >/dev/null; then MKVENV() { uv venv -q --python 3.11 "$1"; }; PIP() { VIRTUAL_ENV="$1" uv pip install -q "${@:2}"; }
else
  PY=""; for p in python3.11 python3.12 python3.10; do command -v $p >/dev/null && PY=$p && break; done
  if [ -z "$PY" ]; then echo "Python 3.10-3.12 is needed. Easiest: brew install uv  (then run this again)"; exit 1; fi
  MKVENV() { $PY -m venv "$1"; }; PIP() { "$1/bin/pip" install -q --upgrade "${@:2}"; }
fi

run() {   # run <engine> <packages...>
  local e=$1; shift
  if [ "$e" != apple ]; then
    local env="$V/env/$e"
    if [ ! -x "$env/bin/python" ]; then echo "== setting up $e"; MKVENV "$env" && PIP "$env" pip "$@" || { echo "!! $e setup failed, skipping"; return; }; fi
    echo "== $e"; PYTORCH_ENABLE_MPS_FALLBACK=1 "$env/bin/python" tools/voice/render_test.py $e 2>&1 | tee -a "$LOG"
  else
    echo "== apple"; python3 tools/voice/render_test.py apple 2>&1 | tee -a "$LOG"
  fi
}
for e in $ENGINES; do
  case $e in
    apple)  run apple ;;
    piper)  run piper piper-tts ;;
    f5)     run f5 f5-tts soundfile huggingface_hub ;;
    kokoro) run kokoro "kokoro>=0.9" soundfile numpy ;;
    xtts)   run xtts coqui-tts huggingface_hub soundfile ;;
  esac
done
python3 tools/voice/make_test_page.py && open "$V/test/index.html"
