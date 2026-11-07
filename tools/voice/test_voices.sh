#!/bin/bash
# Voice test for Betűkaland: every candidate voice reads the 18 test lines, then a page opens
# where you can listen to them side by side and score them.
#   cd ~/Documents/programming_projects/betukaland && bash tools/voice/test_voices.sh
# Optional: bash tools/voice/test_voices.sh f5 kokoro     (only these engines)
# The first run of f5 and kokoro downloads a few GB (PyTorch, the models, Whisper for F5).
# The old Intel setups in voice/env/<name> (without -arm64) are no longer used and can be deleted.
# Stop it any time with Ctrl+C and run it again: finished lines are kept.
cd "$(dirname "$0")/../.."
ROOT="$PWD"; V="$ROOT/voice"; mkdir -p "$V/test" "$V/env"
ENGINES="${*:-piper f5 kokoro}"   # also possible: apple xtts
LOG="$V/test/log.txt"; echo "== $(date)" >> "$LOG"

# A native Apple Silicon (arm64) Python 3.11 for the model engines. The Homebrew in /usr/local is
# an Intel one: its Python runs under Rosetta and only gets old PyTorch (2.2) and no ready-made
# numba, so f5 and kokoro fail there. uv downloads its own arm64 Python instead.
if ! command -v uv >/dev/null; then echo "uv is needed: brew install uv  (then run this again)"; exit 1; fi
PYREQ="cpython-3.11-macos-aarch64-none"
uv python install -q "$PYREQ" || { echo "!! could not get an arm64 Python"; exit 1; }
PY311="$(uv python find "$PYREQ")"
MKVENV() { uv venv -q --python "$PY311" "$1"; }
PIP() { VIRTUAL_ENV="$1" uv pip install -q --python "$1/bin/python" "${@:2}"; }

run() {   # run <engine> <packages...>
  local e=$1; shift
  if [ "$e" != apple ]; then
    local env="$V/env/$e-arm64"
    if [ ! -x "$env/bin/python" ]; then echo "== setting up $e"; MKVENV "$env" && PIP "$env" pip "$@" || { echo "!! $e setup failed, skipping"; return; }; fi
    if [ "$("$env/bin/python" -c 'import platform; print(platform.machine())')" != arm64 ]; then echo "!! $e: this Python is not arm64, skipping"; return; fi
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
