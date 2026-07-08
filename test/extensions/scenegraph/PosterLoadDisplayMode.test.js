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
});
