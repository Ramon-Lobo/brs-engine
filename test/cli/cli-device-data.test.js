const path = require("path");
const fs = require("fs");
const os = require("os");
const { exec, brsCliPath, zipFolder } = require("./cli-test-utils");

const appDir = path.join(__dirname, "resources", "device-data-app");
const override = JSON.stringify({ friendlyName: "Lab Roku", countryCode: "CA" });
const q = (s) => `'${s}'`;

describe.concurrent("cli --device-data", () => {
    const zipPath = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "brs-devdata-")), "device-data-app.zip");
    beforeAll(() => fs.writeFileSync(zipPath, zipFolder(appDir)));
    afterAll(() => fs.rmSync(path.dirname(zipPath), { recursive: true, force: true }));

    it("keeps engine defaults without the flag (zip)", async () => {
        const { stdout } = await exec(["node", brsCliPath, zipPath, "-c 0"].join(" "));
        expect(stdout).toMatch(/friendly=BrightScript Engine Library/);
        expect(stdout).toMatch(/country=US/);
    }, 30000);

    it("applies the override on the zip path", async () => {
        const { stdout } = await exec(["node", brsCliPath, zipPath, "-c 0", "--device-data", q(override)].join(" "));
        expect(stdout).toMatch(/friendly=Lab Roku/);
        expect(stdout).toMatch(/country=CA/);
        expect(stdout).toMatch(/model=8000X/); // untouched fields keep their defaults
    }, 30000);

    it("applies the override on the folder (--root) path", async () => {
        const { stdout } = await exec(
            ["node", brsCliPath, "-r", q(appDir), "-c 0", "--device-data", q(override)].join(" ")
        );
        expect(stdout).toMatch(/friendly=Lab Roku/);
        expect(stdout).toMatch(/country=CA/);
    }, 30000);

    it("applies the override on the files path", async () => {
        const { stdout } = await exec(
            ["node", brsCliPath, "-r", q(appDir), "source/main.brs", "-c 0", "--device-data", q(override)].join(" ")
        );
        expect(stdout).toMatch(/friendly=Lab Roku/);
        expect(stdout).toMatch(/country=CA/);
    }, 30000);

    it("rejects invalid JSON with a non-zero exit and a clear message", async () => {
        await expect(
            exec(["node", brsCliPath, zipPath, "-c 0", "--device-data", q("{nope")].join(" "))
        ).rejects.toMatchObject({ code: 1, stderr: expect.stringMatching(/Invalid --device-data JSON/) });
    }, 30000);

    it.each(["[1]", "null", '"text"', "5"])(
        "rejects a non-object (%s) with a non-zero exit",
        async (text) => {
            await expect(
                exec(["node", brsCliPath, zipPath, "-c 0", "--device-data", q(text)].join(" "))
            ).rejects.toMatchObject({ code: 1, stderr: expect.stringMatching(/expected a JSON object/) });
        },
        30000
    );

    it("ignores __proto__, constructor and prototype keys", async () => {
        const text = '{"__proto__":{"friendlyName":"Polluted"},"constructor":"x","prototype":"y","countryCode":"CA"}';
        const { stdout } = await exec(["node", brsCliPath, zipPath, "-c 0", "--device-data", q(text)].join(" "));
        expect(stdout).toMatch(/friendly=BrightScript Engine Library/);
        expect(stdout).toMatch(/country=CA/);
    }, 30000);
});
