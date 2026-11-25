const path = require("path");
const { spawnSync } = require("node:child_process");

// A host stop (`terminateApp`) that finds the render thread inside one long node-canvas operation
// used to abort the whole process with "FATAL ERROR: Error::ThrowAsJavaScriptException napi_throw"
// when its forced `worker.terminate()` landed in a native call (see src/node/workerLoad.ts). Runs
// in a child process because the failure kills the process. Requires `npm run build:cli`.
// With BRS-09's binary-search ellipsis the long label no longer stalls the render thread, so on a
// branch that has it this is a smoke test of the host path; the deterministic guard test is
// test/brsTypes/components/RoFontExitRequested.test.js.
describe("terminating an app stuck in a long canvas operation", { timeout: 60000 }, () => {
    it("lets the render thread unwind and finish instead of aborting the process", () => {
        const script = path.join(__dirname, "resources", "force-terminate-repro.js");
        const child = spawnSync(process.execPath, [script], { encoding: "utf8", timeout: 45000 });
        const output = `${child.stdout}${child.stderr}`;
        expect(output).not.toContain("FATAL ERROR");
        expect(child.signal).toBeNull();
        expect(child.status).toBe(0);
        expect(output).toContain("RESULT EXIT_USER_NAV");
    });
});
