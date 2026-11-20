# Label forceUpperCase Probe (non-device, brighttest local-only)

`Label.forceUpperCase` is NOT a field of a real Roku Label. This probe documents that: on a device
`hasField("forceUpperCase")` is `false` (Roku Ultra, firmware 16.0.4 build 853; the same statement ran inside
a larger probe). The brighttest engine build adds the field as a non-device convenience (patch BRS-02), so the
probe prints `true` there and `false` on stock brs-engine and on a device. This patch is never offered upstream.

| Key | Device | Stock engine | brighttest build |
|---|---|---|---|
| `hasField(forceUpperCase)` | `false` | `false` | `true` |

`device-trace.txt` holds the device value; `engine-trace.txt` is the output of the brighttest build.
