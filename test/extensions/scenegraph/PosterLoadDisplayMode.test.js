const scenegraph = require("../../../packages/scenegraph/lib/brs-sg.node.js");
const core = require("../../../packages/node/bin/brs.node.js");

const { SGNodeFactory } = scenegraph;
const { BrsString } = core;

/**
 * A device normalizes the Poster `loadDisplayMode` enum to lowercase: a value set as "ScaleToFit"
 * reads back as "scaletofit". The engine used to store the value verbatim.
 */
describe("Poster.loadDisplayMode is normalized to lowercase", () => {
    test.each([
        ["ScaleToFit", "scaletofit"],
        ["limitSize", "limitsize"],
        ["LIMITSIZE", "limitsize"],
        ["noScale", "noscale"],
        ["scaletofit", "scaletofit"],
    ])("%s reads back as %s", (assigned, expected) => {
        const poster = SGNodeFactory.createNode("Poster");
        poster.setValue("loadDisplayMode", new BrsString(assigned));
        expect(poster.getValueJS("loadDisplayMode")).toBe(expected);
    });

    test("the field name is matched case-insensitively", () => {
        const poster = SGNodeFactory.createNode("Poster");
        poster.setValue("loaddisplaymode", new BrsString("ScaleToFit"));
        expect(poster.getValueJS("loadDisplayMode")).toBe("scaletofit");
    });

    test("the mode can be changed again after normalization", () => {
        const poster = SGNodeFactory.createNode("Poster");
        poster.setValue("loadDisplayMode", new BrsString("ScaleToFit"));
        poster.setValue("loadDisplayMode", new BrsString("NoScale"));
        expect(poster.getValueJS("loadDisplayMode")).toBe("noscale");
    });

    test("other Poster string fields are not lowercased", () => {
        const poster = SGNodeFactory.createNode("Poster");
        poster.setValue("uri", new BrsString("pkg:/Images/Hero.PNG"));
        expect(poster.getValueJS("uri")).toBe("pkg:/Images/Hero.PNG");
    });
});
