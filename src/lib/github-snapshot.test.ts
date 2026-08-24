import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  GithubRateLimitError,
  collectGithubSnapshot,
  createGithubApiSource,
  refreshGithubSnapshot,
  validateGithubSnapshot,
  writeGithubSnapshot,
  type GithubSnapshotRepositoryDefinition,
  type RawContributions,
  type RawRepository,
} from "./github-snapshot";

const temporaryDirectories: string[] = [];

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) fs.rmSync(directory, { recursive: true, force: true });
});

function makeCalendar(start = "2025-08-24"): RawContributions["calendar"] {
  const firstDay = new Date(`${start}T00:00:00Z`);
  return Array.from({ length: 53 }, (_, weekIndex) => ({
    contributionDays: Array.from({ length: 7 }, (_, dayIndex) => {
      const date = new Date(firstDay);
      date.setUTCDate(firstDay.getUTCDate() + weekIndex * 7 + dayIndex);
      return {
        date: date.toISOString().slice(0, 10),
        contributionCount: (weekIndex + dayIndex) % 4,
        contributionLevel: (weekIndex + dayIndex) % 4 === 0 ? "NONE" : "FIRST_QUARTILE",
      };
    }),
  }));
}

function makeRepository(name: string): RawRepository {
  return {
    name,
    nameWithOwner: `NMasters52/${name}`,
    htmlUrl: `https://github.com/NMasters52/${name}`,
    description: `${name} description`,
    stargazersCount: 3,
    language: "TypeScript",
    pushedAt: "2026-08-23T12:00:00Z",
    recentCommits: 4,
    recentPullRequests: 2,
    recentIssues: 1,
  };
}

function makeSource(overrides: Partial<{
  contributions: RawContributions;
  repositories: Record<string, RawRepository>;
  getRepository: (repository: GithubSnapshotRepositoryDefinition) => Promise<RawRepository>;
}> = {}) {
  const repositories = overrides.repositories ?? { "sample-repo": makeRepository("sample-repo") };
  return {
    getContributions: vi.fn(async () => overrides.contributions ?? {
      calendar: makeCalendar(),
      totals: { commits: 18, pullRequests: 4, issues: 2 },
    }),
    getRepository: overrides.getRepository ?? vi.fn(async (repository: GithubSnapshotRepositoryDefinition) => {
      const result = repositories[repository.slug];
      if (!result) throw new Error(`Missing fixture for ${repository.slug}`);
      return result;
    }),
  };
}

const repositories: GithubSnapshotRepositoryDefinition[] = [
  { slug: "sample-repo", title: "Sample Repo", fullName: "NMasters52/sample-repo" },
];

describe("GitHub snapshot collection", () => {
  it("normalizes a complete account response and curated repository records", async () => {
    const snapshot = await collectGithubSnapshot(makeSource(), {
      now: new Date("2026-08-24T15:30:00Z"),
      from: "2026-05-27",
      to: "2026-08-24",
      repositories,
    });

    expect(snapshot).toMatchObject({
      schemaVersion: 1,
      generatedAt: "2026-08-24T15:30:00.000Z",
      window: { from: "2026-05-27", to: "2026-08-24", days: 90 },
      totals: { commits: 18, pullRequests: 4, issues: 2 },
      repositories: [{
        slug: "sample-repo",
        title: "Sample Repo",
        fullName: "NMasters52/sample-repo",
        recent: { commits: 4, pullRequests: 2, issues: 1 },
      }],
      sourceStatus: "success",
    });
    expect(snapshot.calendar.flatMap((week) => week.days)).toHaveLength(371);
    expect(validateGithubSnapshot(snapshot)).toEqual(snapshot);
  });

  it("rejects incomplete contribution data before a candidate can be written", async () => {
    await expect(collectGithubSnapshot(makeSource({
      contributions: { calendar: [], totals: { commits: 1, pullRequests: 0, issues: 0 } },
    }), { repositories })).rejects.toThrow("calendar must contain a complete year");
  });

  it("requires the rolling totals window to cover exactly 90 days", async () => {
    const snapshot = await collectGithubSnapshot(makeSource(), { repositories });
    expect(() => validateGithubSnapshot({
      ...snapshot,
      window: { from: "2026-06-01", to: "2026-08-24", days: 85 },
    })).toThrow("window must cover exactly 90 days");
  });

  it("rejects malformed contribution and repository values", async () => {
    await expect(collectGithubSnapshot(makeSource({
      contributions: {
        calendar: makeCalendar(),
        totals: { commits: -1, pullRequests: 0, issues: 0 },
      },
    }), { repositories })).rejects.toThrow("commits must be a non-negative integer");

    await expect(collectGithubSnapshot(makeSource({
      getRepository: vi.fn(async () => ({ ...makeRepository("sample-repo"), recentIssues: -1 })),
    }), { repositories })).rejects.toThrow("recent issues must be a non-negative integer");
  });

  it("stops on partial repository failure so the caller can retain the prior snapshot", async () => {
    const getRepository = vi.fn()
      .mockResolvedValueOnce(makeRepository("sample-repo"))
      .mockRejectedValueOnce(new Error("temporary GitHub failure"));

    await expect(collectGithubSnapshot(makeSource({ getRepository }), {
      repositories: [
        ...repositories,
        { slug: "second-repo", title: "Second Repo", fullName: "NMasters52/second-repo" },
      ],
    })).rejects.toThrow("temporary GitHub failure");
    expect(getRepository).toHaveBeenCalledTimes(2);
  });
});

describe("GitHub snapshot persistence", () => {
  it("validates before atomically replacing the previous artifact", async () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), "dev-portfolio-github-snapshot-"));
    temporaryDirectories.push(directory);
    const target = path.join(directory, "github-snapshot.json");
    const snapshot = await collectGithubSnapshot(makeSource(), { repositories });
    fs.writeFileSync(target, JSON.stringify({ retained: true }));

    await expect(writeGithubSnapshot(target, { ...snapshot, totals: { commits: -1, pullRequests: 0, issues: 0 } })).rejects
      .toThrow("commits must be a non-negative integer");
    expect(fs.readFileSync(target, "utf8")).toBe(JSON.stringify({ retained: true }));

    await expect(writeGithubSnapshot(target, snapshot)).resolves.toBe(true);
    expect(JSON.parse(fs.readFileSync(target, "utf8"))).toEqual(snapshot);
  });

  it("does not replace the artifact when only generation time changed", async () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), "dev-portfolio-github-material-"));
    temporaryDirectories.push(directory);
    const target = path.join(directory, "github-snapshot.json");
    const snapshot = await collectGithubSnapshot(makeSource(), { repositories });
    await writeGithubSnapshot(target, snapshot);

    await expect(writeGithubSnapshot(target, { ...snapshot, generatedAt: "2026-08-25T15:30:00Z" })).resolves.toBe(false);
    expect(JSON.parse(fs.readFileSync(target, "utf8")).generatedAt).toBe(snapshot.generatedAt);
  });

  it("retains the last valid artifact when refresh collection fails", async () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), "dev-portfolio-github-retained-"));
    temporaryDirectories.push(directory);
    const target = path.join(directory, "github-snapshot.json");
    const previous = await collectGithubSnapshot(makeSource(), { repositories });
    await writeGithubSnapshot(target, previous);

    for (const failure of ["API failed", "request timed out", "rate limited", "partial result"]) {
      const source = makeSource({
        getRepository: vi.fn(async () => { throw new Error(failure); }),
      });
      await expect(refreshGithubSnapshot(target, source, { repositories })).rejects.toThrow(failure);
      expect(JSON.parse(fs.readFileSync(target, "utf8"))).toEqual(previous);
    }
  });
});

describe("GitHub API boundary", () => {
  it("does not retry rate-limited responses", async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({ message: "rate limited" }), {
      status: 429,
      headers: { "retry-after": "60" },
    }));
    const source = createGithubApiSource({
      token: "test-token",
      username: "NMasters52",
      fetchImpl,
      sleep: vi.fn(async () => undefined),
    });

    const error = await source.getContributions({ from: "2026-05-27", to: "2026-08-24" }).catch((value: unknown) => value);
    expect(error).toBeInstanceOf(GithubRateLimitError);
    expect(error).toMatchObject({ message: expect.stringContaining("retry after 60 seconds") });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("retries a bounded number of transient failures before succeeding", async () => {
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(new Response("upstream unavailable", { status: 503 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: {
        user: { contributionsCollection: {
          contributionCalendar: { weeks: [{ contributionDays: [] }] },
          totalCommitContributions: 0,
          totalPullRequestContributions: 0,
          totalIssueContributions: 0,
        } },
      } }), { status: 200, headers: { "content-type": "application/json" } }));
    const sleep = vi.fn(async () => undefined);
    const source = createGithubApiSource({ token: "test-token", username: "NMasters52", fetchImpl, sleep, maxAttempts: 2 });

    await expect(source.getContributions({ from: "2026-05-27", to: "2026-08-24" })).resolves.toMatchObject({
      totals: { commits: 0, pullRequests: 0, issues: 0 },
    });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(sleep).toHaveBeenCalledTimes(1);
  });

  it("turns an aborted request into a bounded failure", async () => {
    const fetchImpl = vi.fn(async (_url: URL | RequestInfo, init?: RequestInit) => new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")));
    }));
    const source = createGithubApiSource({ token: "test-token", username: "NMasters52", fetchImpl, maxAttempts: 1, timeoutMs: 1 });

    await expect(source.getContributions({ from: "2026-05-27", to: "2026-08-24" })).rejects
      .toThrow("timed out after 1ms");
  });

  it("rejects malformed REST records instead of counting them", async () => {
    const response = (value: unknown) => new Response(JSON.stringify(value), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(response({ name: "sample-repo", full_name: "NMasters52/sample-repo", html_url: "https://github.com/NMasters52/sample-repo", stargazers_count: 0, language: "TypeScript", pushed_at: null, description: null }))
      .mockResolvedValueOnce(response([null]))
      .mockResolvedValueOnce(response([]))
      .mockResolvedValueOnce(response([]));
    const source = createGithubApiSource({ token: "test-token", username: "NMasters52", fetchImpl });

    await expect(source.getRepository(repositories[0])).rejects.toThrow("malformed NMasters52/sample-repo commits data");
  });
});
