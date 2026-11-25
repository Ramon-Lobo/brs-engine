// Child process for test/node/forceTerminate.test.js: starts an app whose render thread sits in one
// long statement (a 30,000 character label in a narrow box) and asks the host to terminate it with a
// short grace period. Prints RESULT <exitReason> when the host finishes it.
// Note: with the binary-search ellipsis (BRS-09) that statement finishes in milliseconds, so on a
// branch that has it this is only a smoke test of the host path; without BRS-09 (linear ellipsis)
// the render thread is still inside canvas when the terminate lands and the process aborts unless
// the exit guard is in place. The deterministic guard test is
// test/brsTypes/components/RoFontExitRequested.test.js.
const path = require("path");
const brs = require("../../../packages/node/bin/brs.node");

const deviceData = {
    developerId: "34c6fceca75e456f25e7e99531e2425c6c1de443",
    locale: "en_US",
    displayMode: "1080p",
    customFeatures: [],
    localIps: ["127.0.0.1,lo0"],
    entryPoint: true,
};

(async () => {
    const root = path.join(__dirname, "long-measure-app");
    const payload = await brs.createPayloadFromFiles([], deviceData, undefined, root);
    payload.extensions = [brs.SupportedExtension.SceneGraph];
    payload.device.extensions = new Map([[brs.SupportedExtension.SceneGraph, "brs-sg.node.js"]]);
    let started = false;
    brs.subscribeHost("repro", (event, data) => {
        if (!started && event === "message" && typeof data === "string" && data.startsWith("print,label set start")) {
            started = true;
            // Let the render thread get well into the long statement, then stop with a short grace
            setTimeout(() => brs.terminateApp(undefined, 500), 1500);
        }
    });
    const result = await brs.executeApp(payload);
    console.log(`RESULT ${result.exitReason}`);
    process.exit(0);
})();
