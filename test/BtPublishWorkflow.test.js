const fs = require("fs");
const path = require("path");

const text = fs.readFileSync(path.join(__dirname, "..", ".github", "workflows", "publish.yml"), "utf8");
const code = text
    .split("\n")
    .filter((l) => !/^\s*#/.test(l))
    .join("\n");

describe("publish.yml (stage-only bt release)", () => {
    it("is workflow_dispatch only", () => {
        const on = code.slice(code.indexOf("\non:"), code.indexOf("\npermissions:"));
        expect(on).toMatch(/workflow_dispatch:/);
        expect(on).not.toMatch(/push:|schedule:|pull_request/);
    });

    it("has empty top-level permissions and only the npm-release environment", () => {
        expect(code).toMatch(/^permissions: \{\}$/m);
        expect(code.match(/^\s+environment: .*$/gm)).toEqual(["    environment: npm-release"]);
    });

    it("never runs npm publish and always stages under next", () => {
        expect(code).not.toMatch(/npm\s+(-\S+\s+)*publish/);
        expect(code).toMatch(/npm stage publish .* --tag next /);
        expect(code).not.toMatch(/--tag latest|--tag "\$/);
    });

    it("accepts only bt/* branches and refuses versions without -bt.", () => {
        expect(code).toMatch(/^\s+bt\/\*\) ;;$/m);
        expect(code).not.toMatch(/\|master|master\)/);
        expect(code).toMatch(/\[ "\$REF_NAME" != "bt\/\$\{UPSTREAM\}" \]/);
        expect(code).toMatch(/merge-base --is-ancestor "v\$\{UPSTREAM\}" "\$SHA"/);
        expect(code).toMatch(/\*-bt\.\*\) ;;/);
    });

    it("checks tarball integrity and name before staging, and fails closed on npm view", () => {
        expect(code).toMatch(/"\$ACTUAL" != "\$EXPECTED"/);
        expect(code).toMatch(/ramonlobo-brs-node-\$\{VERSION\}\.tgz/);
        expect(code).toMatch(/grep -q 'E404'/);
    });

    it("pins every action by SHA and disables checkout credential persistence", () => {
        for (const m of code.matchAll(/uses: (\S+)/g)) expect(m[1]).toMatch(/@[0-9a-f]{40}$/);
        for (const step of code.split(/\n {6}- /).filter((x) => x.startsWith("uses: actions/checkout"))) {
            expect(step).toMatch(/persist-credentials: false/);
        }
    });

    it("never interpolates expressions inside run blocks", () => {
        const lines = code.split("\n");
        let inRun = false;
        let runIndent = 0;
        for (const line of lines) {
            const indent = line.length - line.trimStart().length;
            if (/^\s*run: \|/.test(line)) {
                inRun = true;
                runIndent = indent;
                continue;
            }
            if (inRun && line.trim() && indent <= runIndent) inRun = false;
            if (inRun) expect(line).not.toMatch(/\$\{\{/);
        }
    });

    it("the stage job runs no repository code", () => {
        const stage = code.slice(code.indexOf("\n  stage:"), code.indexOf("\n  tag:"));
        expect(stage).not.toMatch(/actions\/checkout|npm ci|bt-pack|scripts\//);
    });
});
