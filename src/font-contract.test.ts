import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const root = process.cwd();
const sourceCssPath = path.join(root, "src/styles/global.css");
const sourceFonts = {
  necto: path.join(root, "public/fonts/necto-mono/NectoMono-Regular.woff2"),
  geist: path.join(root, "public/fonts/geist-sans/Geist-Variable.woff2"),
};
const sourceLicenses = {
  necto: path.join(root, "public/fonts/necto-mono/LICENSE.txt"),
  geist: path.join(root, "public/fonts/geist-sans/OFL.txt"),
};

let buildRoot = "";

const sha256 = (filePath: string) =>
  createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");

const hasWoff2Signature = (filePath: string) =>
  fs.readFileSync(filePath).subarray(0, 4).equals(Buffer.from("wOF2"));

const allFiles = (directory: string): string[] =>
  fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const filePath = path.join(directory, entry.name);
    return entry.isDirectory() ? allFiles(filePath) : [filePath];
  });

const cssFontFaceBlocks = (css: string) =>
  [...css.matchAll(/@font-face\s*\{([^}]+)\}/g)].map((match) => match[1]);

beforeAll(() => {
  buildRoot = fs.mkdtempSync(path.join(os.tmpdir(), "dev-portfolio-font-build-"));
  execFileSync("npm", ["run", "build", "--", "--outDir", buildRoot], {
    cwd: root,
    env: { ...process.env, ASTRO_TELEMETRY_DISABLED: "1" },
    stdio: "pipe",
  });
}, 60_000);

afterAll(() => {
  if (buildRoot) fs.rmSync(buildRoot, { recursive: true, force: true });
});

describe("self-hosted font contract", () => {
  it("keeps the official source files and licenses", () => {
    for (const filePath of Object.values(sourceFonts)) {
      expect(fs.existsSync(filePath)).toBe(true);
      expect(hasWoff2Signature(filePath)).toBe(true);
    }

    for (const filePath of Object.values(sourceLicenses)) {
      expect(fs.existsSync(filePath)).toBe(true);
      expect(fs.readFileSync(filePath, "utf8")).toContain("SIL Open Font License");
    }
  });

  it("declares only the approved local faces", () => {
    const css = fs.readFileSync(sourceCssPath, "utf8");
    const blocks = cssFontFaceBlocks(css);

    expect(blocks).toHaveLength(2);
    expect(blocks[0]).toContain('font-family: "Necto Mono";');
    expect(blocks[0]).toContain('url("/fonts/necto-mono/NectoMono-Regular.woff2") format("woff2")');
    expect(blocks[0]).toContain("font-weight: 400;");
    expect(blocks[0]).toContain("font-style: normal;");
    expect(blocks[0]).toContain("font-display: swap;");
    expect(blocks[1]).toContain('font-family: "Geist Sans";');
    expect(blocks[1]).toContain('url("/fonts/geist-sans/Geist-Variable.woff2") format("woff2")');
    expect(blocks[1]).toContain("font-weight: 100 900;");
    expect(blocks[1]).toContain("font-style: normal;");
    expect(blocks[1]).toContain("font-display: swap;");
    expect(css).toContain("html { font-synthesis: none; }");

    for (const block of blocks) {
      expect(block).not.toMatch(/(?:https?:)?\/\//);
    }
  });

  it("copies fonts and licenses into the production build without changing them", () => {
    const builtFonts = {
      necto: path.join(buildRoot, "fonts/necto-mono/NectoMono-Regular.woff2"),
      geist: path.join(buildRoot, "fonts/geist-sans/Geist-Variable.woff2"),
    };
    const builtLicenses = {
      necto: path.join(buildRoot, "fonts/necto-mono/LICENSE.txt"),
      geist: path.join(buildRoot, "fonts/geist-sans/OFL.txt"),
    };

    expect(fs.existsSync(builtFonts.necto)).toBe(true);
    expect(fs.existsSync(builtFonts.geist)).toBe(true);
    expect(fs.existsSync(builtLicenses.necto)).toBe(true);
    expect(fs.existsSync(builtLicenses.geist)).toBe(true);
    expect(hasWoff2Signature(builtFonts.necto)).toBe(true);
    expect(hasWoff2Signature(builtFonts.geist)).toBe(true);
    expect(sha256(builtFonts.necto)).toBe(sha256(sourceFonts.necto));
    expect(sha256(builtFonts.geist)).toBe(sha256(sourceFonts.geist));
    expect(fs.readFileSync(builtLicenses.necto, "utf8")).toBe(
      fs.readFileSync(sourceLicenses.necto, "utf8"),
    );
    expect(fs.readFileSync(builtLicenses.geist, "utf8")).toBe(
      fs.readFileSync(sourceLicenses.geist, "utf8"),
    );

    const builtCss = allFiles(buildRoot)
      .filter((filePath) => filePath.endsWith(".css"))
      .map((filePath) => fs.readFileSync(filePath, "utf8"))
      .join("\n");
    expect(builtCss).toContain("/fonts/necto-mono/NectoMono-Regular.woff2");
    expect(builtCss).toContain("/fonts/geist-sans/Geist-Variable.woff2");
    expect(builtCss).not.toMatch(/(?:https?:)?\/\/[^)]*\.woff2/);
  });
});
