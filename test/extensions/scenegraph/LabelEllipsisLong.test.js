const fs = require("fs");
const path = require("path");
const scenegraph = require("../../../packages/scenegraph/lib/brs-sg.node.js");
const core = require("../../../packages/node/bin/brs.node.js");

const { SGNodeFactory } = scenegraph;
const { BrsDevice, BrsString, Int32 } = core;

/** Mounts the common: volume (fonts) that Label measures its text with. */
function mountCommonVolume() {
    const commonZip = fs.readFileSync(path.join(__dirname, "../../../packages/scenegraph/assets/common.zip"));
    BrsDevice.fileSystem.setup(commonZip.buffer, new ArrayBuffer(1024 * 1024), new ArrayBuffer(1024 * 1024));
}

/**
 * A narrow Label holding a very long text must ellipsize in a handful of measurements. The cut used
 * to drop one character at a time and re-measure the whole remainder each pass, which on a long
 * text kept the render thread inside one statement for tens of seconds.
 */
describe("Label ellipsis on a very long text", () => {
    beforeAll(mountCommonVolume);

    function narrowLabel(text) {
        const label = SGNodeFactory.createNode("Label");
        label.setValue("width", new Int32(100));
        label.setValue("height", new Int32(20));
        label.setValue("text", new BrsString(text));
        return label;
    }

    test("a 20,000 character text is ellipsized in under two seconds", () => {
        const text = "x".repeat(20000);
        const start = Date.now();
        const label = narrowLabel(text);
        const measured = label.getMeasured();
        expect(Date.now() - start).toBeLessThan(2000);
        expect(measured.ellipsized).toBe(true);
        expect(measured.width).toBeLessThanOrEqual(100);
    });

    test("the cut is the longest prefix that still fits with the ellipsis", () => {
        const text = "The quick brown fox jumps over the lazy dog ".repeat(40);
        const cut = narrowLabel(text).getMeasured();
        expect(cut.ellipsized).toBe(true);
        expect(cut.text.endsWith("...")).toBe(true);
        const prefix = cut.text.slice(0, -3);
        expect(text.startsWith(prefix)).toBe(true);
        // measure a prefix plus the ellipsis on an unconstrained label
        const widthOf = (t) => {
            const wide = SGNodeFactory.createNode("Label");
            wide.setValue("text", new BrsString(t));
            return wide.getMeasured().width;
        };
        expect(widthOf(prefix + "...")).toBeLessThanOrEqual(100);
        expect(widthOf(text.slice(0, prefix.length + 1) + "...")).toBeGreaterThan(100);
    });

    test("with emoji the cut is never wider than the box and never longer than a linear scan's", () => {
        const text = "Flags \u{1F1E7}\u{1F1F7} \u{1F468}\u200D\u{1F469}\u200D\u{1F467} family and more words after ".repeat(4);
        const widthOf = (t) => {
            const wide = SGNodeFactory.createNode("Label");
            wide.setValue("text", new BrsString(t));
            return wide.getMeasured().width;
        };
        const cut = narrowLabel(text).getMeasured();
        expect(cut.ellipsized).toBe(true);
        const prefix = cut.text.slice(0, -3);
        expect(widthOf(prefix + "...")).toBeLessThanOrEqual(100);
        // the old linear scan: the longest prefix that fits, found from the full length downward
        let linear = text.length - 1;
        while (linear > 0 && widthOf(text.slice(0, linear) + "...") > 100) linear--;
        expect(prefix.length).toBeLessThanOrEqual(linear);
    });

    test("a text that fits is not ellipsized", () => {
        const measured = narrowLabel("Hi").getMeasured();
        expect(measured.ellipsized).toBe(false);
        expect(measured.text).toBe("Hi");
    });
});
