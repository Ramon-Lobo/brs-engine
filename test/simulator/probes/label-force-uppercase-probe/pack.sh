#!/usr/bin/env bash
# Packs the probe into a sideloadable zip (the zip is a build artifact, do not commit it).
set -euo pipefail
cd "$(dirname "$0")"
rm -f label-force-uppercase-probe.zip
zip -r label-force-uppercase-probe.zip manifest source components -x '*.DS_Store'
echo "Created $(pwd)/label-force-uppercase-probe.zip"
