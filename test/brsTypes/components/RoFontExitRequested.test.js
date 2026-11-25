const fs = require("fs");
const path = require("path");
const core = require("../../../packages/node/bin/brs.node.js");

const { BrsDevice, BrsString, BrsBoolean, Int32, DataType, DebugCommand, getFontRegistry } = core;

// Once the host asks the app to exit (EXIT in the shared array), the measuring canvas answers
// width 0 so a long measure loop ends at once and the thread can unwind before the host's forced
// `worker.terminate()` lands inside a node-canvas call (see src/node/workerLoad.ts). Deterministic
// guard for that; the process-level repro in test/node/forceTerminate.test.js only exercises it
// when the render thread is still stuck in a long statement at the time of the terminate.
describe("RoFont measuring after an exit request", () => {
    const originalShared = BrsDevice.sharedArray;
    let shared;
    let font;

    beforeAll(() => {
        const commonZip = fs.readFileSync(path.join(__dirname, "../../../packages/scenegraph/assets/common.zip"));
        BrsDevice.fileSystem.setup(commonZip.buffer, new ArrayBuffer(1024 * 1024), new ArrayBuffer(1024 * 1024));
        const registry = getFontRegistry();
        const family = new BrsString(registry.getDefaultFontFamily(false, false));
        font = registry.createFont(family, new Int32(24), BrsBoolean.False, BrsBoolean.False);
    });

    beforeEach(() => {
        shared = new Int32Array(DataType.DBG + 8).fill(-1);
        BrsDevice.setSharedArray(shared);
    });

    afterAll(() => {
        BrsDevice.setSharedArray(originalShared);
    });

    const text = "The quick brown fox jumps over the lazy dog";

    test("measures for real while no exit is requested", () => {
        expect(font.measureTextWidth(text).width).toBeGreaterThan(100);
    });

    test("answers width 0, uncached, once EXIT is set; real and cached again after it is cleared", () => {
        // a text no other test measures, so the cache state is known
        const probe = `${text} (exit probe)`;
        Atomics.store(shared, DataType.DBG, DebugCommand.EXIT);
        expect(font.measureTextWidth(probe).width).toBe(0);
        expect(font.measureTextWidth(probe, 100, "...").width).toBe(0);

        Atomics.store(shared, DataType.DBG, -1);
        const real = font.measureTextWidth(probe);
        expect(real.width).toBeGreaterThan(100);
        // cached: the very same object comes back
        expect(font.measureTextWidth(probe)).toBe(real);
        // and a cached entry is still returned while EXIT is set (nothing is measured)
        Atomics.store(shared, DataType.DBG, DebugCommand.EXIT);
        expect(font.measureTextWidth(probe)).toBe(real);
    });

    test("other debug commands do not stop measuring and are not consumed", () => {
        Atomics.store(shared, DataType.DBG, DebugCommand.BREAK);
        expect(font.measureTextWidth(`${text} (break probe)`).width).toBeGreaterThan(100);
        expect(Atomics.load(shared, DataType.DBG)).toBe(DebugCommand.BREAK);
        Atomics.store(shared, DataType.DBG, DebugCommand.EXIT);
        BrsDevice.isExitRequested();
        expect(Atomics.load(shared, DataType.DBG)).toBe(DebugCommand.EXIT);
    });
});
