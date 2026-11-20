const { execute, createMockStreams, resourceFile, allArgs } = require("./E2ETests");

describe("SceneGraph float element types", () => {
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

    test("float-field-elements.brs", async () => {
        await execute([resourceFile("scenegraph", "float-field-elements.brs")], outputStreams);

        expect(allArgs(outputStreams.stdout.write).map((arg) => arg.trimEnd())).toEqual([
            "roFloat roFloat", // rect2d
            "roFloat roFloat", // floatarray
            "roFloat roFloat", // vector2d
            "roFloat roFloat", // translation
            " 5", // 1 + 4, value unchanged
        ]);
    });
});
