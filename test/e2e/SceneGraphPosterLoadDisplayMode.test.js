const { execute, createMockStreams, resourceFile, allArgs } = require("./E2ETests");

describe("SceneGraph Poster loadDisplayMode", () => {
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

    test("poster-load-display-mode.brs", async () => {
        await execute([resourceFile("scenegraph", "poster-load-display-mode.brs")], outputStreams);

        expect(allArgs(outputStreams.stdout.write).map((arg) => arg.trimEnd())).toEqual([
            "scaletofit",
            "limitsize",
            "noscale",
        ]);
    });
});
