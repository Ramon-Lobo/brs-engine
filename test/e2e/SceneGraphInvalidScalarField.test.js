const { execute, createMockStreams, resourceFile, allArgs } = require("./E2ETests");

describe("SceneGraph invalid assigned to a scalar field", () => {
    let outputStreams;

    beforeAll(() => {
        outputStreams = createMockStreams();
        outputStreams.root = __dirname + "/resources";
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    afterAll(() => {
        vi.restoreAllMocks();
    });

    test("invalid-scalar-field.brs", async () => {
        await execute([resourceFile("scenegraph", "invalid-scalar-field.brs")], outputStreams);

        expect(allArgs(outputStreams.stdout.write).map((arg) => arg.trimEnd())).toEqual([
            " 0", // integer
            " 0", // float
            "[]", // string
            "false", // boolean
            "true", // assocarray field: still invalid
        ]);
    });
});
