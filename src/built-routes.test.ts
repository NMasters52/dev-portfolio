import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { beforeAll, describe, expect, it } from "vitest";

const dist = path.join(process.cwd(), "dist");
const html = (...parts: string[]) =>
  fs.readFileSync(path.join(dist, ...parts, "index.html"), "utf8");

describe("built portfolio routes", () => {
  beforeAll(() => {
    fs.rmSync(dist, { recursive: true, force: true });
    execFileSync("npm", ["run", "build"], {
      cwd: process.cwd(),
      env: { ...process.env, ASTRO_TELEMETRY_DISABLED: "1" },
      stdio: "pipe",
    });
  }, 60_000);

  it("builds the complete Disc Golf Labs project details route", () => {
    const page = html("projects", "disc-golf-labs");

    expect(page).toContain('<nav class="breadcrumb" aria-label="Breadcrumb">');
    expect(page).toContain("In-progress project");
    expect(page).toContain("Disc Golf Labs");
    expect(page).toContain("A training platform for disc golfers");
    expect(page).toMatch(/In progress · Last updated August 10, 2026 · Founder/);
    expect(page).toContain(
      '<div class="links"><a href="https://github.com/NMasters52/DiscGolfLabs-Frontend">Source Code</a></div>',
    );

    const builtWith = page.slice(page.indexOf('<section class="built-with"'), page.indexOf('<div class="prose"'));
    for (const technology of [
      "React",
      "TypeScript",
      "Clerk",
      "TanStack Query",
      "Stripe",
      "Tailwind CSS",
      "shadcn/ui",
      "MongoDB",
      "Express.js",
    ]) {
      expect(builtWith).toContain(`<li>${technology}</li>`);
    }

    expect(page).toContain("The problem");
    expect(page).toContain("What it is");
    expect(page).toContain("How it&#39;s built");
    expect(page).toContain("Where it stands");
    expect(page).toContain("Related writing");
    expect(page).toContain("August 14, 2026 · 3 min read");
    expect(page).toContain('href="/writings/small-models-strong-guardrails/"');
    expect(page).toContain('<a class="back" href="/">← Back to all work</a>');
    expect(page).not.toContain("Live Site");
    expect(page).not.toContain("<img");
    expect(page).toContain(
      "there are no outcome metrics to publish yet: no user counts, revenue, or launch",
    );
    expect(page).not.toMatch(/available now|launched successfully/i);
  });

  it("builds the writing route with derived metadata and its project link", () => {
    const page = html("writings", "small-models-strong-guardrails");
    expect(page).toContain("Small Models, Strong Guardrails");
    expect(page).toContain("August 14, 2026");
    expect(page).toMatch(/\d+ min read/);
    expect(page).toContain('href="/projects/disc-golf-labs/"');
    expect(page).not.toContain("<img");
  });

  it("builds a useful not-found page for unknown identities", () => {
    const page = fs.readFileSync(path.join(dist, "404.html"), "utf8");
    expect(page).toContain("That work record does not exist");
    expect(page).toContain('href="/"');
  });

  it("builds Connected Work with Projects selected and canonical destinations", () => {
    const page = html();

    expect(page).toContain("Connected Work");
    expect(page).toContain('role="tablist"');
    expect(page).toContain('role="tab"');
    expect(page).toContain('aria-selected="true"');
    expect(page).toContain("Projects");
    expect(page).toContain("Writings");
    expect(page).toContain("Disc Golf Labs");
    expect(page).toContain("In progress");
    expect(page).toMatch(/Last updated (?:<!-- -->)?August 10, 2026/);
    expect(page).toMatch(/\+(?:<!-- -->)?6/);
    expect(page).toContain('href="/projects/disc-golf-labs/"');
    expect(page).toContain('href="https://github.com/NMasters52/DiscGolfLabs-Frontend"');
    expect(page).toContain('href="/writings/small-models-strong-guardrails/"');
    expect(page).not.toContain("Live Site");
  });
});
