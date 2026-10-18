#!/bin/bash
# Double-click: sends the latest version of the game to GitHub (GitHub Pages updates in a few minutes).
cd "$(dirname "$0")" || exit 1
git push origin main
echo
echo "Kész / Done. Ezt az ablakot bezárhatod / You can close this window."
