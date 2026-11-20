const scenegraph = require("../../../packages/scenegraph/lib/brs-sg.node.js");
const core = require("../../../packages/node/bin/brs.node.js");

const { SGNodeFactory } = scenegraph;
const { BrsString, BrsInvalid, BrsBoolean, Int32, Float, Double, isInvalid } = core;

/**
 * On a device, assigning `invalid` to a scalar SceneGraph field (string, integer, float, double,
 * boolean) succeeds and resets the field to the type's default; it does not leave the previous
 * value in place. Fields that can legitimately hold `invalid` (node, assocarray, array) are
 * unchanged.
 */
describe("invalid assigned to a scalar field resets it to the type default", () => {
    function nodeWith(name, type, initial) {
        const node = SGNodeFactory.createNode("Node");
        node.addNodeField(name, type, false);
        node.setValue(name, initial);
        return node;
    }

    test("string -> empty string", () => {
        const node = nodeWith("s", "string", new BrsString("abc"));
        node.setValue("s", BrsInvalid.Instance);
        expect(node.getValueJS("s")).toBe("");
    });

    test("integer -> 0", () => {
        const node = nodeWith("i", "integer", new Int32(5));
        node.setValue("i", BrsInvalid.Instance);
        expect(node.getValueJS("i")).toBe(0);
    });

    test("float -> 0", () => {
        const node = nodeWith("f", "float", new Float(2.5));
        node.setValue("f", BrsInvalid.Instance);
        expect(node.getValueJS("f")).toBe(0);
    });

    test("double -> 0", () => {
        const node = nodeWith("d", "double", new Double(2.5));
        node.setValue("d", BrsInvalid.Instance);
        expect(node.getValueJS("d")).toBe(0);
    });

    test("boolean -> false", () => {
        const node = nodeWith("b", "boolean", BrsBoolean.True);
        node.setValue("b", BrsInvalid.Instance);
        expect(node.getValueJS("b")).toBe(false);
    });

    test("fields that hold objects still accept invalid", () => {
        const node = SGNodeFactory.createNode("Node");
        node.addNodeField("n", "node", false);
        node.setValue("n", SGNodeFactory.createNode("Group"));
        node.setValue("n", BrsInvalid.Instance);
        expect(isInvalid(node.getValue("n"))).toBe(true);
    });

    test("assigning a value of another scalar type is still coerced as before", () => {
        const node = nodeWith("s", "string", new BrsString("abc"));
        node.setValue("s", new Int32(7));
        expect(node.getValueJS("s")).toBe("7");
    });
});
