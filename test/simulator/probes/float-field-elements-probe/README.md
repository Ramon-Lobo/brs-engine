# Float Field Elements Probe

Checks the BrightScript type of the components of `rect2d` and `vector2d` fields and of the elements of
`floatarray` fields after assigning integer-valued input.

## Why

On a device these are always `roFloat`. The engine kept integer-valued input as `roInt`, so
`type(node.translation[0]) = "roFloat"` style checks, and any type-strict comparison, behaved differently
in the simulator.

## Expected

| Key | Device | Engine before the fix | Engine after the fix |
|---|---|---|---|
| `elements` | `rect2d.x=roFloat floatarray[0]=roFloat vector2d[0]=roFloat` | `roInt` for each | `roFloat` for each |
| `translation` | not captured separately (`translation` is a `vector2d` field) | `roInt` | `roFloat` |

`device-trace.txt` holds the device values (Roku Ultra, firmware 16.0.4 build 853; the same statements were
run inside a larger probe). `engine-trace.txt` is the engine output after the fix.

Run: `npm run build`, then `node packages/node/bin/brs.cli.js -c 0 -r test/simulator/probes/float-field-elements-probe source/main.brs`.
