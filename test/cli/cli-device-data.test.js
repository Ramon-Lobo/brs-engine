const path = require("path");
const fs = require("fs");
const os = require("os");
const ts = require("typescript");
const { promisify } = require("util");
const execFile = promisify(require("child_process").execFile);
const { brsCliPath, zipFolder } = require("./cli-test-utils");

// Runs the CLI with an args array (no shell quoting, so it works on Windows too).
const run = (args, opts) => execFile("node", [brsCliPath, ...args], opts);

// Loads the real applyDeviceDataOverride() against a stub deviceData object.
function loadOverride(deviceData) {
    const source = fs.readFileSync(path.join(__dirname, "../../src/cli/index.ts"), "utf8");
    const start = source.indexOf("function applyDeviceDataOverride");
    const end = source.indexOf("/**\n * Executes BrightScript files", start);
    const { outputText } = ts.transpileModule(
        source.slice(start, end) + "\nmodule.exports = applyDeviceDataOverride;",
        {
            compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2021 },
        }
    );
    const mod = { exports: {} };
    const chalk = { red: (t) => t };
    new Function("module", "deviceData", "chalk", "console", outputText)(mod, deviceData, chalk, { error() {} });
    return mod.exports;
}

const appDir = path.join(__dirname, "resources", "device-data-app");
const override = JSON.stringify({ friendlyName: "Lab Roku", countryCode: "CA" });

describe.concurrent("cli --device-data", () => {
    const zipPath = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "brs-devdata-")), "device-data-app.zip");
    beforeAll(() => fs.writeFileSync(zipPath, zipFolder(appDir)));
    afterAll(() => fs.rmSync(path.dirname(zipPath), { recursive: true, force: true }));

    it("keeps engine defaults without the flag (zip)", async () => {
        const { stdout } = await run([zipPath, "-c", "0"]);
        expect(stdout).toMatch(/friendly=BrightScript Engine Library/);
        expect(stdout).toMatch(/country=US/);
    }, 30000);

    it("applies the override on the zip path", async () => {
        const { stdout } = await run([zipPath, "-c", "0", "--device-data", override]);
        expect(stdout).toMatch(/friendly=Lab Roku/);
        expect(stdout).toMatch(/country=CA/);
        expect(stdout).toMatch(/model=8000X/); // untouched fields keep their defaults
    }, 30000);

    it("applies the override on the folder (--root) path", async () => {
        const { stdout } = await run(["-r", appDir, "-c", "0", "--device-data", override]);
        expect(stdout).toMatch(/friendly=Lab Roku/);
        expect(stdout).toMatch(/country=CA/);
    }, 30000);

    it("applies the override on the files path", async () => {
        const { stdout } = await run(["-r", appDir, "source/main.brs", "-c", "0", "--device-data", override]);
        expect(stdout).toMatch(/friendly=Lab Roku/);
        expect(stdout).toMatch(/country=CA/);
    }, 30000);

    it("rejects invalid JSON with a non-zero exit and a clear message", async () => {
        await expect(run([zipPath, "-c", "0", "--device-data", "{nope"])).rejects.toMatchObject({
            code: 1,
            stderr: expect.stringMatching(/Invalid --device-data JSON/),
        });
    }, 30000);

    it.each(["[1]", "null", '"text"', "5"])(
        "rejects a non-object (%s) with a non-zero exit",
        async (text) => {
            await expect(run([zipPath, "-c", "0", "--device-data", text])).rejects.toMatchObject({
                code: 1,
                stderr: expect.stringMatching(/expected a JSON object/),
            });
        },
        30000
    );

    it("ignores __proto__, constructor and prototype keys", async () => {
        const text = '{"__proto__":{"friendlyName":"Polluted"},"constructor":"x","prototype":"y","countryCode":"CA"}';
        const { stdout } = await run([zipPath, "-c", "0", "--device-data", text]);
        expect(stdout).toMatch(/friendly=BrightScript Engine Library/);
        expect(stdout).toMatch(/country=CA/);
    }, 30000);

    it("ignores __proto__, constructor and prototype keys end to end", async () => {
        const text = '{"__proto__":{"friendlyName":"Polluted"},"constructor":"x","prototype":"y","countryCode":"CA"}';
        const { stdout } = await run([zipPath, "-c", "0", "--device-data", text]);
        expect(stdout).toMatch(/friendly=BrightScript Engine Library/);
        expect(stdout).toMatch(/country=CA/);
    }, 30000);
});

describe("applyDeviceDataOverride", () => {
    const fresh = () => ({
        friendlyName: "Default",
        connectionInfo: { gateway: "10.0.0.1", dns: ["1.1.1.1"], name: "eth1" },
    });

    it("does not copy unsafe top-level keys (fails without the filter)", () => {
        const dd = fresh();
        const apply = loadOverride(dd);
        expect(apply('{"__proto__":{"polluted":"yes"},"constructor":"x","prototype":"y","friendlyName":"Lab"}')).toBe(
            true
        );
        expect(dd.polluted).toBeUndefined();
        expect(Object.getPrototypeOf(dd)).toBe(Object.prototype);
        expect(Object.prototype.hasOwnProperty.call(dd, "constructor")).toBe(false);
        expect(Object.prototype.hasOwnProperty.call(dd, "prototype")).toBe(false);
        expect(dd.friendlyName).toBe("Lab");
    });

    it("does not copy unsafe keys inside connectionInfo", () => {
        const dd = fresh();
        loadOverride(dd)(
            '{"connectionInfo":{"__proto__":{"polluted":"yes"},"constructor":"x","prototype":"y","name":"wlan0"}}'
        );
        expect(dd.connectionInfo.polluted).toBeUndefined();
        expect(Object.getPrototypeOf(dd.connectionInfo)).toBe(Object.prototype);
        expect(Object.prototype.hasOwnProperty.call(dd.connectionInfo, "constructor")).toBe(false);
        expect(Object.prototype.hasOwnProperty.call(dd.connectionInfo, "prototype")).toBe(false);
        expect(dd.connectionInfo.name).toBe("wlan0");
    });

    it.each(['"text"', "null", "[1,2]", "5"])("ignores a non-object connectionInfo (%s)", (value) => {
        const dd = fresh();
        expect(loadOverride(dd)(`{"connectionInfo":${value},"friendlyName":"Lab"}`)).toBe(true);
        expect(dd.connectionInfo).toEqual(fresh().connectionInfo);
        expect(dd.friendlyName).toBe("Lab");
    });

    it("merges connectionInfo one level deep (gateway and dns stay)", () => {
        const dd = fresh();
        loadOverride(dd)('{"connectionInfo":{"name":"wlan0"}}');
        expect(dd.connectionInfo).toEqual({ gateway: "10.0.0.1", dns: ["1.1.1.1"], name: "wlan0" });
    });
});
