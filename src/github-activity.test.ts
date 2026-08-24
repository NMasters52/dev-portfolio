import { describe, expect, it } from "vitest";
import snapshot from "./data/github-snapshot.json";
import { isGithubSnapshotStale, validateGithubSnapshot } from "./lib/github-snapshot";

const validSnapshot = validateGithubSnapshot(snapshot);

describe("GitHub activity presentation contract", () => {
  it("treats a recent successful artifact as current", () => {
    expect(isGithubSnapshotStale(validSnapshot, new Date("2026-08-24T23:59:59Z"))).toBe(false);
  });

  it("discloses an old artifact as stale without discarding retained data", () => {
    const retained = validateGithubSnapshot({ ...validSnapshot, generatedAt: "2026-08-20T00:00:00Z" });
    expect(isGithubSnapshotStale(retained, new Date("2026-08-24T00:00:00Z"))).toBe(true);
    expect(retained.repositories.length).toBeGreaterThan(0);
  });

  it("treats an explicit fallback artifact as stale even when recently generated", () => {
    expect(isGithubSnapshotStale({ ...validSnapshot, sourceStatus: "fallback" }, new Date("2026-08-24T00:00:00Z"))).toBe(true);
  });

  it("allows an empty retained repository list without making a runtime request necessary", () => {
    const empty = validateGithubSnapshot({ ...validSnapshot, repositories: [] });
    expect(empty.repositories).toEqual([]);
    expect(isGithubSnapshotStale(empty, new Date("2026-08-24T00:00:00Z"))).toBe(false);
  });
});
