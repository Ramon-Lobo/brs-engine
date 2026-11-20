const fs = require("fs");
const path = require("path");
const scenegraph = require("../../../packages/scenegraph/lib/brs-sg.node.js");
const core = require("../../../packages/node/bin/brs.node.js");

const { SGNodeFactory } = scenegraph;
const { BrsDevice, BrsString, BrsBoolean } = core;

/** Mounts the common: volume (fonts) that Label measures its text with. */
function mountCommonVolume() {
    const commonZip = fs.readFileSync(path.join(__dirname, "../../../packages/scenegraph/assets/common.zip"));
    BrsDevice.fileSystem.setup(commonZip.buffer, new ArrayBuffer(1024 * 1024), new ArrayBuffer(1024 * 1024));
}

/**
 * brighttest local-only patch (BRS-02). `Label.forceUpperCase` is NOT a field on a real Roku
 * (`hasField("forceUpperCase")` is false on a device): it is a non-device convenience of the
 * brighttest engine build and is never offered upstream.
 */
describe("Label.forceUpperCase (non-device, brighttest convenience)", () => {
    beforeAll(mountCommonVolume);

    test("the field exists and defaults to false", () => {
        const label = SGNodeFactory.createNode("Label");
        expect(label.hasNodeField("forceUpperCase")).toBe(true);
        expect(label.getValueJS("forceUpperCase")).toBe(false);
    });

    test("text assigned while the flag is on is stored uppercased", () => {
        const label = SGNodeFactory.createNode("Label");
        label.setValue("forceUpperCase", BrsBoolean.True);
        label.setValue("text", new BrsString("Hello World"));
        expect(label.getValueJS("text")).toBe("HELLO WORLD");
    });

    test("turning the flag on uppercases the existing text", () => {
        const label = SGNodeFactory.createNode("Label");
        label.setValue("text", new BrsString("Hello World"));
        label.setValue("forceUpperCase", BrsBoolean.True);
        expect(label.getValueJS("text")).toBe("HELLO WORLD");
    });

    test("text is untouched while the flag is off", () => {
        const label = SGNodeFactory.createNode("Label");
        label.setValue("text", new BrsString("Hello World"));
        expect(label.getValueJS("text")).toBe("Hello World");
    });
});
