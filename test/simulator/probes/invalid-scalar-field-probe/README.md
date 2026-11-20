# Invalid Scalar Field Probe

Checks what a scalar SceneGraph field (`integer`, `float`, `string`, `boolean`) holds after `invalid`
is assigned to it.

## Why

On a device the assignment succeeds and the field becomes the type's default (`0`, `0`, `""`,
`false`). The engine rejected the assignment, so the field kept its previous value
(`5`, `2.5`, `"abc"`, `true`). An app doing `m.top.title = json.title` with an absent key therefore
showed stale text in the simulator and an empty string on a device.

## Expected

| Key | Device | Engine before the fix | Engine after the fix |
|---|---|---|---|
| `integer_after_invalid` | `0` | `5` | `0` |
| `float_after_invalid` | `0` | `2.5` | `0` |
| `string_after_invalid` | `""` | `"abc"` | `""` |
| `bool_after_invalid` | `false` | `true` | `false` |

`device-trace.txt` holds the device values (Roku Ultra, firmware 16.0.4 build 853; the same
statements were run inside a larger probe). `engine-trace.txt` is the engine output after the fix.

Run: `npm run build`, then `node packages/node/bin/brs.cli.js -c 0 -r test/simulator/probes/invalid-scalar-field-probe source/main.brs`.
`pack.sh` builds a sideloadable zip for a device.
