import fs from "node:fs/promises";
import path from "node:path";
import { getProjects } from "../src/lib/content.ts";
import {
  createGithubApiSource,
  refreshGithubSnapshot,
  validateGithubSnapshot,
} from "../src/lib/github-snapshot.ts";

const token = process.env.GH_TOKEN ?? process.env.GITHUB_TOKEN;
if (!token) throw new Error("GH_TOKEN or GITHUB_TOKEN is required to refresh the GitHub snapshot");

const username = process.env.GITHUB_USERNAME ?? "NMasters52";
const repositories = getProjects().map((project) => ({
  slug: project.slug,
  title: project.title,
  fullName: new URL(project.repositoryUrl).pathname.slice(1),
}));
const source = createGithubApiSource({ token, username });
const snapshotPath = path.join(process.cwd(), "src/data/github-snapshot.json");

try {
  const changed = await refreshGithubSnapshot(snapshotPath, source, { repositories });
  const persistedSnapshot = validateGithubSnapshot(JSON.parse(await fs.readFile(snapshotPath, "utf8")));
  console.log(JSON.stringify({
    event: "github_snapshot_refresh",
    status: "success",
    checkedAt: new Date().toISOString(),
    persistedGeneratedAt: persistedSnapshot.generatedAt,
    changed,
    window: persistedSnapshot.window,
    totals: persistedSnapshot.totals,
    repositories: persistedSnapshot.repositories.length,
  }));
} catch (error) {
  console.error(error instanceof Error ? error.message : "GitHub activity snapshot refresh failed");
  process.exitCode = 1;
}
