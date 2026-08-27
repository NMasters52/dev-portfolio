import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  ContentValidationError,
  getProject,
  getWriting,
  loadContent,
} from "./content";

const fixtureRoot = (name: string) =>
  path.join(process.cwd(), "src", "test-fixtures", "content", name);

describe("portfolio content", () => {
  it("loads and derives the canonical records", () => {
    const project = getProject("disc-golf-labs");
    const billBuddy = getProject("bill-buddy");
    const githubFinder = getProject("github-finder");
    const writing = getWriting("small-models-strong-guardrails");
    const graphEngineering = getWriting("graph-engineering-dependencies");

    expect(project).toMatchObject({
      slug: "disc-golf-labs",
      title: "Disc Golf Labs",
      status: "in-progress",
      statusLabel: "In progress",
      role: "Founder",
      repositoryUrl: "https://github.com/NMasters52/DiscGolfLabs-Frontend",
      liveUrl: undefined,
      isLive: false,
      formattedUpdatedAt: "August 10, 2026",
    });
    expect(project.bodyHtml).toContain("<h2>The problem</h2>");
    expect(billBuddy).toMatchObject({
      slug: "bill-buddy",
      title: "Bill Buddy",
      status: "shipped",
      statusLabel: "Shipped",
      role: "Frontend Developer",
      repositoryUrl: "https://github.com/NMasters52/budget-app",
      liveUrl: "https://budget-app-woad-one.vercel.app",
      isLive: true,
      updatedAt: "2026-05-09",
      formattedUpdatedAt: "May 9, 2026",
      image: {
        src: "../images/bill-buddy-home.jpg",
        alt: "Bill Buddy Add New Bill form showing bill title, amount, dates, frequency, and auto-calculation controls.",
      },
      relatedWritings: [],
    });
    expect(billBuddy.bodyHtml).toContain("<h2>What it does</h2>");
    expect(githubFinder).toMatchObject({
      slug: "github-finder",
      title: "GitHub Finder",
      status: "shipped",
      statusLabel: "Shipped",
      role: "Frontend Developer",
      tags: ["React", "TypeScript", "Vite", "TanStack Query", "Tailwind CSS", "React Icons", "use-debounce"],
      repositoryUrl: "https://github.com/NMasters52/github-finder",
      liveUrl: "https://github-finder-wf5f.vercel.app",
      isLive: true,
      updatedAt: "2025-10-22",
      formattedUpdatedAt: "October 22, 2025",
      image: {
        src: "../images/github-finder-populated.jpg",
        alt: "GitHub Finder showing a populated ThePrimeagen profile result and recent search.",
      },
      relatedWritings: [],
    });
    expect(githubFinder.bodyHtml).toContain("<h2>What it does</h2>");
    expect(writing).toMatchObject({
      slug: "small-models-strong-guardrails",
      publishedAt: "2026-08-14",
      formattedPublishedAt: "August 14, 2026",
      relatedProjects: ["disc-golf-labs"],
    });
    expect(writing.readingTimeMinutes).toBeGreaterThan(0);
    expect(writing.bodyHtml).toContain("<h2>");
    expect(graphEngineering).toMatchObject({
      slug: "graph-engineering-dependencies",
      publishedAt: "2026-08-10",
      formattedPublishedAt: "August 10, 2026",
      relatedProjects: ["disc-golf-labs"],
    });
    expect(graphEngineering.bodyHtml).toContain("https://dev.to/discgolfdev/graph-engineering-stop-thinking-in-steps-start-mapping-dependencies-bm2");
  });

  it("orders records and derives reverse relationships", () => {
    const ordered = loadContent(fixtureRoot("ordering"));
    expect(ordered.projects.map(({ slug }) => slug)).toEqual([
      "active-project",
      "alpha-shipped-project",
      "newer-shipped-project",
      "older-shipped-project",
    ]);
    expect(ordered.writings.map(({ slug }) => slug)).toEqual([
      "alpha-writing",
      "newer-writing",
      "older-writing",
    ]);
    expect(getProject("disc-golf-labs").relatedWritings.map(({ slug }) => slug)).toEqual([
      "small-models-strong-guardrails",
      "graph-engineering-dependencies",
    ]);
    expect(loadContent().projects.map(({ slug }) => slug)).toEqual([
      "disc-golf-labs",
      "rascofx",
      "bill-buddy",
      "github-finder",
    ]);
  });

  it("reports unknown canonical identities", () => {
    expect(() => getProject("missing-project")).toThrow(
      'Unknown project "missing-project"',
    );
    expect(() => getWriting("missing-writing")).toThrow(
      'Unknown writing "missing-writing"',
    );
  });

  it.each([
    ["missing-required", "title must be a non-empty string"],
    ["empty-body", "body must not be empty"],
    ["invalid-status", "status must be in-progress or shipped"],
    ["invalid-date", "updatedAt must be an ISO date"],
    ["impossible-date", "updatedAt must be an ISO date"],
    ["invalid-url", "repositoryUrl must be an http or https URL"],
    ["invalid-tags", "tags must contain unique, non-empty labels"],
    ["invalid-filename", "filename must be lowercase kebab-case"],
    ["invalid-image", "image src must point to Content/images"],
    ["missing-image", "image src must reference an existing Content/images asset"],
    ["unresolved-relationship", 'relatedProjects references unknown project "ghost"'],
    ["duplicate-relationship", "relatedProjects must contain unique project identities"],
  ])("rejects %s records at the content boundary", (fixture, message) => {
    expect(() => loadContent(fixtureRoot(fixture))).toThrow(
      expect.objectContaining<Partial<ContentValidationError>>({ message }),
    );
  });
});
