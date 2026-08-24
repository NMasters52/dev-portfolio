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
    expect(page).toMatch(/August 14, 2026 · \d+ min read/);
    expect(page).toContain('href="/writings/small-models-strong-guardrails/"');
    expect(page).toContain('<a class="back" href="/">← Back to all work</a>');
    expect(page).not.toContain("Live Site");
    expect(page).not.toContain("<img");
    expect(page).toContain(
      "there are no outcome metrics to publish yet: no user counts, revenue, or launch",
    );
    expect(page).not.toMatch(/available now|launched successfully/i);
  });

  it("builds the thin Bill Buddy project route with live destinations and its detail image", () => {
    const page = html("projects", "bill-buddy");

    expect(page).toContain('<nav class="breadcrumb" aria-label="Breadcrumb">');
    expect(page).toContain("Shipped project");
    expect(page).toContain("Bill Buddy");
    expect(page).toContain("A recurring bill tracker with due-date previews");
    expect(page).toMatch(/Shipped · Last updated May 9, 2026 · Frontend Developer/);
    expect(page).toContain(
      '<div class="links"><a href="https://github.com/NMasters52/budget-app">Source Code</a><a href="https://budget-app-woad-one.vercel.app">Live Site</a></div>',
    );

    const builtWith = page.slice(page.indexOf('<section class="built-with"'), page.indexOf('<div class="prose"'));
    for (const technology of ["React", "Tailwind CSS", "localStorage", "UUID"]) {
      expect(builtWith).toContain(`<li>${technology}</li>`);
    }

    expect(page).toContain("What it does");
    expect(page).toContain("How it works");
    expect(page).toContain("Where it stands");
    expect(page).toContain('<img');
    expect(page).toContain('alt="Bill Buddy bills overview showing recurring bills, due dates, payment status, and bill actions."');
    expect(page).toContain('<a class="back" href="/">← Back to all work</a>');
    expect(page).not.toContain("Related writing");
  });

  it("builds the Writing header in the approved thesis-first hierarchy", () => {
    const page = html("writings", "small-models-strong-guardrails");

    const breadcrumb = page.indexOf('<nav class="breadcrumb" aria-label="Breadcrumb">');
    const kicker = page.indexOf('<p class="kicker">Engineering note</p>');
    const title = page.indexOf("<h1>Small Models, Strong Guardrails</h1>");
    const standfirst = page.indexOf(
      '<p class="standfirst">How repository constraints make smaller coding models useful without outsourcing engineering judgment.</p>',
    );
    const metadata = page.indexOf('<div class="writing-meta">');
    const body = page.indexOf('<div class="prose">');

    expect(breadcrumb).toBeGreaterThan(-1);
    expect(kicker).toBeGreaterThan(breadcrumb);
    expect(title).toBeGreaterThan(kicker);
    expect(standfirst).toBeGreaterThan(title);
    expect(metadata).toBeGreaterThan(standfirst);
    expect(body).toBeGreaterThan(metadata);
    expect(page).toContain('<time datetime="2026-08-14">August 14, 2026</time> · 4 min read');
    expect(page).toContain('<ul class="tags" aria-label="Topics"><li>AI</li><li>Agents</li><li>Workflow</li></ul>');
    expect(page).not.toContain("<img");
  });

  it("renders authored Writing semantics and the complete path back to related work", () => {
    const page = html("writings", "small-models-strong-guardrails");
    const prose = page.slice(page.indexOf('<div class="prose">'), page.indexOf('<section class="related-block"'));
    const related = page.slice(page.indexOf('<section class="related-block"'), page.indexOf('<a class="back"'));

    expect(prose).toContain("<h2>The claim</h2>");
    expect(prose).toContain("<ol>");
    expect(prose).toContain("<code>any</code>");
    expect(prose).toContain('<code class="language-yaml">');
    expect(prose).toContain('<figure aria-labelledby="guardrail-flow-caption">');
    expect(prose).toContain('<svg viewBox="0 0 640 150" role="img"');
    expect(prose).toContain('<figcaption id="guardrail-flow-caption">');
    expect(prose).toContain("<blockquote>");
    expect(prose).toContain("The model proposes; the repository disposes.");
    expect(related).toContain('<section class="related-block" aria-labelledby="related-projects-heading">');
    expect(related).toContain('<h2 id="related-projects-heading">Related projects</h2>');
    expect(related).toContain('<a href="/projects/disc-golf-labs/">Disc Golf Labs</a>');
    expect(related).toContain("In progress · Last updated August 10, 2026");
    expect(related).not.toContain("Founder");
    expect(page).toContain('<a class="back" href="/">← Back to all work</a>');
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
    expect(page).toContain("Bill Buddy");
    expect(page).toContain("In progress");
    expect(page).toContain("Shipped");
    expect(page).toMatch(/Last updated (?:<!-- -->)?August 10, 2026/);
    expect(page).toMatch(/\+(?:<!-- -->)?6/);
    expect(page).toContain('href="/projects/disc-golf-labs/"');
    expect(page).toContain('href="https://github.com/NMasters52/DiscGolfLabs-Frontend"');
    expect(page).toContain('href="/projects/bill-buddy/"');
    expect(page).toContain('href="https://github.com/NMasters52/budget-app"');
    expect(page).toContain('href="https://budget-app-woad-one.vercel.app"');
    expect(page).toContain('href="/writings/small-models-strong-guardrails/"');
    expect(page).not.toContain("<img");
    const discGolfCard = page.slice(
      page.indexOf('<article class="card">'),
      page.indexOf('<article class="card">', page.indexOf('<article class="card">') + 1),
    );
    expect(discGolfCard).not.toContain("Live Site");
  });

  it("publishes an explicit favicon without a missing browser request", () => {
    const page = html();

    expect(page).toContain('<link rel="icon" href="/favicon.svg" type="image/svg+xml">');
    expect(fs.existsSync(path.join(dist, "favicon.svg"))).toBe(true);
  });
});
