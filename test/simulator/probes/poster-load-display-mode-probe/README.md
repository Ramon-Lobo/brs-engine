# Poster loadDisplayMode Probe

Checks how `Poster.loadDisplayMode` reads back after being set with mixed-case values.

## Why

A device normalizes the enum to lowercase on read: `"ScaleToFit"` reads back as `"scaletofit"`. The engine
returned the assigned string verbatim, so code comparing the read-back value behaved differently.

## Expected

| Key | Device | Engine before the fix | Engine after the fix |
|---|---|---|---|
| `loadDisplayMode` | `scaletofit` | `ScaleToFit` | `scaletofit` |
| `loadDisplayMode_limitSize` | `limitsize` | `limitSize` | `limitsize` |

`device-trace.txt` holds the device values (Roku Ultra, firmware 16.0.4 build 853; the same statements were
run inside a larger probe). `engine-trace.txt` is the engine output after the fix.

Run: `npm run build`, then `node packages/node/bin/brs.cli.js -c 0 -r test/simulator/probes/poster-load-display-mode-probe source/main.brs`.
