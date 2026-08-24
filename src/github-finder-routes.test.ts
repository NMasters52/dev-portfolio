import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const buildRoot = fs.mkdtempSync(path.join(os.tmpdir(), "dev-portfolio-github-finder-"));
const html = (...parts: string[]) => fs.readFileSync(path.join(buildRoot, ...parts, "index.html"), "utf8");

describe("GitHub Finder routes", () => {
  beforeAll(() => {
    execFileSync("npm", ["run", "build", "--", "--outDir", buildRoot], {
      cwd: process.cwd(),
      env: { ...process.env, ASTRO_TELEMETRY_DISABLED: "1" },
      stdio: "pipe",
    });
  }, 60_000);

  afterAll(() => {
    fs.rmSync(buildRoot, { recursive: true, force: true });
  });

  it("builds Project Details from the complete GitHub Finder record", () => {
    const page = html("projects", "github-finder");

    expect(page).toContain("<h1>GitHub Finder</h1>");
    expect(page).toContain("A GitHub profile search interface with recent searches");
    expect(page).toContain("Shipped · Last updated October 22, 2025 · Frontend Developer");
    expect(page).toContain(
      '<div class="links"><a href="https://github.com/NMasters52/github-finder">Source Code</a><a href="https://github-finder-wf5f.vercel.app">Live Site</a></div>',
    );

    const builtWith = page.slice(page.indexOf('<section class="built-with"'), page.indexOf('<div class="prose"'));
    for (const technology of ["React", "TypeScript", "Vite", "TanStack Query", "Tailwind CSS", "React Icons", "use-debounce"]) {
      expect(builtWith).toContain(`<li>${technology}</li>`);
    }

    expect(page).toContain("What it does");
    expect(page).toContain("How it works");
    expect(page).toContain("Where it stands");
    expect(page).toContain('alt="GitHub Finder showing a populated ThePrimeagen profile result and recent search."');
    expect(page).toContain("srcset=");
    expect(page).not.toContain("Related writing");
  });

  it("orders the Connected Work card and exposes all three destinations", () => {
    const page = html();
    const githubFinder = page.indexOf("<h3><a href=\"/projects/github-finder/\">GitHub Finder</a></h3>");
    const billBuddy = page.indexOf("<h3><a href=\"/projects/bill-buddy/\">Bill Buddy</a></h3>");

    expect(githubFinder).toBeGreaterThan(billBuddy);
    expect(page).toContain('href="/projects/github-finder/"');
    expect(page).toContain('href="https://github.com/NMasters52/github-finder"');
    expect(page).toContain('href="https://github-finder-wf5f.vercel.app"');
    const workSurface = page.slice(page.indexOf('<section class="work"'), page.indexOf('<section class="about-section"'));
    expect(workSurface).not.toContain("<img");
  });
});
