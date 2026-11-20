const scenegraph = require("../../../packages/scenegraph/lib/brs-sg.node.js");
const core = require("../../../packages/node/bin/brs.node.js");

const { SGNodeFactory } = scenegraph;
const { BrsString, Int32, RoArray, RoAssociativeArray, ValueKind } = core;

/**
 * On a device the components of rect2d and vector2d fields (translation included) and the
 * elements of floatarray fields are always Float, whatever numeric type the app assigned.
 * Integer-valued input must not leak through as Int32, or type-strict comparisons and
 * `type(x) = "roFloat"` checks diverge from the device.
 */
describe("rect2d, vector2d and floatarray elements are stored as Float", () => {
    const kindOf = (value) => (typeof value.unbox === "function" ? value.unbox() : value).kind;
    const ints = (...values) => new RoArray(values.map((v) => new Int32(v)));

    function nodeWith(name, type, value) {
        const node = SGNodeFactory.createNode("Node");
        node.addNodeField(name, type, false);
        node.setValue(name, value);
        return node;
    }

    test("rect2d assigned from an integer array reads back as Float components", () => {
        const node = nodeWith("r", "rect2d", ints(1, 2, 3, 4));
        const rect = node.getValue("r");
        expect(rect).toBeInstanceOf(RoAssociativeArray);
        for (const key of ["x", "y", "width", "height"]) {
            expect(kindOf(rect.get(new BrsString(key)))).toBe(ValueKind.Float);
        }
        expect(node.getValueJS("r")).toEqual({ x: 1, y: 2, width: 3, height: 4 });
    });

    test("vector2d assigned from an integer array reads back as Float components", () => {
        const node = nodeWith("v", "vector2d", ints(1, 2));
        const vector = node.getValue("v");
        expect(vector.elements.map(kindOf)).toEqual([ValueKind.Float, ValueKind.Float]);
        expect(node.getValueJS("v")).toEqual([1, 2]);
    });

    test("translation (a vector2d field) reads back as Float components", () => {
        const group = SGNodeFactory.createNode("Group");
        group.setValue("translation", ints(80, 0));
        const translation = group.getValue("translation");
        expect(translation.elements.map(kindOf)).toEqual([ValueKind.Float, ValueKind.Float]);
    });

    test("floatarray assigned from an integer array reads back as Float elements", () => {
        const node = nodeWith("fa", "floatarray", ints(1, 2, -16));
        const elements = node.getValue("fa").elements;
        expect(elements.map(kindOf)).toEqual([ValueKind.Float, ValueKind.Float, ValueKind.Float]);
        expect(node.getValueJS("fa")).toEqual([1, 2, -16]);
    });

    test("timearray elements are Double and intarray elements stay Int32", () => {
        const times = nodeWith("ta", "timearray", ints(1, 2)).getValue("ta").elements;
        expect(times.map(kindOf)).toEqual([ValueKind.Double, ValueKind.Double]);
        const integers = nodeWith("ia", "intarray", ints(1, 2)).getValue("ia").elements;
        expect(integers.map(kindOf)).toEqual([ValueKind.Int32, ValueKind.Int32]);
    });

    test("colorarray elements stay packed Int32 (hex strings are still normalized)", () => {
        const colors = new RoArray([new BrsString("0x0D1117"), new Int32(0xff0000ff | 0)]);
        const stored = nodeWith("ca", "colorarray", colors).getValue("ca").elements;
        expect(stored.map(kindOf)).toEqual([ValueKind.Int32, ValueKind.Int32]);
        expect(stored[0].unbox().getValue()).toBe(0x0d1117ff | 0);
    });
});
