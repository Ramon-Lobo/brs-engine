#!/usr/bin/env bash
# Packs the probe into a sideloadable zip (the zip is a build artifact, do not commit it).
set -euo pipefail
cd "$(dirname "$0")"
rm -f poster-load-display-mode-probe.zip
zip -r poster-load-display-mode-probe.zip manifest source components -x '*.DS_Store'
echo "Created $(pwd)/poster-load-display-mode-probe.zip"
