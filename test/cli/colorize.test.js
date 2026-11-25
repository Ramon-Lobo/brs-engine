const fs = require("fs");
const path = require("path");
const ts = require("typescript");
const chalk = require("chalk");
const { exec, brsCliPath } = require("./cli-test-utils");

// Loads the real colorize() (and COLORIZE_MAX) from src/cli/index.ts without importing the whole CLI.
function loadColorize() {
    const source = fs.readFileSync(path.join(__dirname, "../../src/cli/index.ts"), "utf8");
    const start = source.indexOf("const COLORIZE_MAX");
    const end = source.indexOf("/**\n * Display the help message");
    const { outputText } = ts.transpileModule(
        source.slice(start, end) + "\nmodule.exports = { colorize, COLORIZE_MAX };",
        {
            compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2021 },
        }
    );
    const stripAnsi = (s) => s.replace(/\u001b\[[0-9;]*m/g, "");
    const mod = { exports: {} };
    new Function("module", "chalk", "stripAnsi", outputText)(mod, chalk, stripAnsi);
    return mod.exports;
}

const { colorize, COLORIZE_MAX } = loadColorize();

// Verbatim stock colorize() from v2.7.1 (99569469), used as the parity oracle.
function stockColorize(log) {
    return log
        .replaceAll(/\b(down|error|errors|failure|fail|fatal|false)(:|\b)/gi, chalk.red("$1$2"))
        .replaceAll(/\b(warning|warn|test|null|undefined|invalid)(:|\b)/gi, chalk.yellow("$1$2"))
        .replaceAll(/\b(help|hint|info|information|true|log)(:|\b)/gi, chalk.cyan("$1$2"))
        .replaceAll(/\b(running|success|successfully|valid)(:|\b)/gi, chalk.green("$1$2"))
        .replaceAll(/\b(debug|roku|brs|brightscript)(:|\b)/gi, chalk.magenta("$1$2"))
        .replaceAll(/(\b\d+\.?\d*?\b)/g, chalk.ansi256(122)(`$1`))
        .replaceAll(/\S+@\S+\.\S+/g, (match) => chalk.blueBright(stripAnsi(match)))
        .replaceAll(/\b([a-z]+):\/{1,2}[^\/].*/gi, (match) => chalk.blue.underline(stripAnsi(match)))
        .replaceAll(/<(.*?)>/g, (match) => chalk.greenBright(stripAnsi(match)))
        .replaceAll(/"(.*?)"/g, (match) => chalk.ansi256(222)(stripAnsi(match)));
}
const stripAnsi = (s) => s.replace(/\u001b\[[0-9;]*m/g, "");

// Small seeded PRNG (mulberry32) so failures are reproducible.
function rng(seed) {
    return () => {
        seed = (seed + 0x6d2b79f5) | 0;
        let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

// Golden outputs captured from the stock colorize() at tag v2.7.1 (commit 99569469), chalk level 2.
const golden = [
    ["pkg:/source/main.brs(3)", "\u001b[34m\u001b[4mpkg:/source/main.brs(3)\u001b[24m\u001b[39m"],
    [
        "error in pkg:/components/Foo.brs(12): crash",
        "\u001b[31merror\u001b[39m in \u001b[34m\u001b[4mpkg:/components/Foo.brs(12): crash\u001b[24m\u001b[39m",
    ],
    ["file at C:/Users/x ok", "file at \u001b[34m\u001b[4mC:/Users/x ok\u001b[24m\u001b[39m"],
    ["tmp:/a/b.txt", "\u001b[34m\u001b[4mtmp:/a/b.txt\u001b[24m\u001b[39m"],
    ["contact me at jane.doe@example.com now", "contact me at \u001b[94mjane.doe@example.com\u001b[39m now"],
    [
        "fetch https://example.com/path?q=1 ok",
        "fetch \u001b[34m\u001b[4mhttps://example.com/path?q=1 ok\u001b[24m\u001b[39m",
    ],
    ['say "hello world" twice', 'say \u001b[38;5;222m"hello world"\u001b[39m twice'],
    [
        "count is 42 and 3.14",
        "count is \u001b[38;5;122m42\u001b[39m and \u001b[38;5;122m3.\u001b[39m\u001b[38;5;122m14\u001b[39m",
    ],
    ["just plain text", "just plain text"],
    [
        'error: failed to load <Node> at http://host/x "q"',
        '\u001b[31merror:\u001b[39m failed to load \u001b[92m<Node>\u001b[39m at \u001b[34m\u001b[4mhttp://host/x \u001b[38;5;222m"q"\u001b[39m\u001b[24m\u001b[39m',
    ],
    ["", ""],
    ['a "unterminated @ x', 'a "unterminated @ x'],
];

describe("colorize", () => {
    let level;
    beforeAll(() => {
        level = chalk.level;
        chalk.level = 2;
    });
    afterAll(() => {
        chalk.level = level;
    });

    it.each(golden)("matches stock output for %j", (input, expected) => {
        expect(colorize(input)).toBe(expected);
    });

    it("matches stock on seeded random strings", () => {
        const rand = rng(20261125);
        const atoms = [
            "a",
            "b",
            "Z",
            "1",
            "2",
            ".",
            "@",
            "@",
            ":",
            "/",
            "//",
            " ",
            " ",
            "\n",
            "\u001b",
            "[",
            ";",
            "m",
            '"',
            "<",
            ">",
            "\\",
            "error",
            "pkg",
            "http",
            "x.y",
            "a@b.c",
        ];
        for (let i = 0; i < 4000; i++) {
            const len = 1 + Math.floor(rand() * 24);
            let s = "";
            for (let j = 0; j < len; j++) s += atoms[Math.floor(rand() * atoms.length)];
            expect(colorize(s), JSON.stringify(s)).toBe(stockColorize(s));
        }
    });

    it("matches stock around e-mail boundary conditions", () => {
        const parts = [
            "",
            "a",
            "@",
            ".",
            "a@",
            "@a",
            "a@b",
            "a@.",
            "a@b.",
            "a@b.c",
            "a@.b",
            "a.@b",
            "a@b@c.d",
            "@@.a",
            "a@@.b",
            "x.y@z",
        ];
        for (const x of parts) {
            for (const y of parts) {
                for (const sep of ["", " ", "\n"]) {
                    const s = x + sep + y;
                    expect(colorize(s), JSON.stringify(s)).toBe(stockColorize(s));
                }
            }
        }
    });

    it("stays linear on '@' heavy lines under the cap", () => {
        for (const line of ["@".repeat(8192), "a@".repeat(4096)]) {
            const t0 = performance.now();
            colorize(line);
            expect(performance.now() - t0).toBeLessThan(200);
        }
    });

    it("returns lines over the cap unchanged", () => {
        expect(COLORIZE_MAX).toBe(8192);
        const line = "error " + "a".repeat(9 * 1024);
        expect(colorize(line)).toBe(line);
    });

    it.each([
        ["space-free line", "a".repeat(65536)],
        ["line with one @", "a".repeat(32768) + "@" + "a".repeat(32767)],
    ])("is fast on a 65 KB %s", (_name, line) => {
        const t0 = performance.now();
        colorize(line);
        expect(performance.now() - t0).toBeLessThan(200);
    });
});

describe("colorize through the CLI", () => {
    it("prints a 65536 character line completely and quickly", async () => {
        const t0 = Date.now();
        const { stdout } = await exec(["node", brsCliPath, "longPrint.brs", "-c 0"].join(" "), {
            cwd: path.join(__dirname, "resources"),
        });
        expect(Date.now() - t0).toBeLessThan(20000);
        expect(stdout).toContain("a".repeat(65536));
    }, 30000);
});
