import fs from "node:fs";
import path from "node:path";

export const GITHUB_SNAPSHOT_SCHEMA_VERSION = 1 as const;
export const GITHUB_SNAPSHOT_MAX_AGE_DAYS = 2;

export type ContributionLevel = "none" | "low" | "medium" | "high" | "highest";
export type SnapshotSourceStatus = "success" | "fallback";

export interface GithubContributionDay {
  date: string;
  count: number;
  level: ContributionLevel;
}

export interface GithubContributionWeek {
  days: GithubContributionDay[];
}

export interface GithubSnapshotRepositoryDefinition {
  slug: string;
  title: string;
  fullName: string;
}

export interface GithubSnapshotRepository {
  slug: string;
  title: string;
  fullName: string;
  url: string;
  description: string;
  language?: string;
  stars: number;
  updatedAt?: string;
  recent: {
    commits: number;
    pullRequests: number;
    issues: number;
  };
}

export interface GithubSnapshot {
  schemaVersion: typeof GITHUB_SNAPSHOT_SCHEMA_VERSION;
  generatedAt: string;
  window: {
    from: string;
    to: string;
    days: number;
  };
  calendar: GithubContributionWeek[];
  totals: {
    commits: number;
    pullRequests: number;
    issues: number;
  };
  repositories: GithubSnapshotRepository[];
  sourceStatus: SnapshotSourceStatus;
}

export interface RawContributions {
  calendar: Array<{
    contributionDays: Array<{
      date: string;
      contributionCount: number;
      contributionLevel: string;
    }>;
  }>;
  totals: {
    commits: number;
    pullRequests: number;
    issues: number;
  };
}

export interface RawRepository {
  name: string;
  nameWithOwner: string;
  htmlUrl: string;
  description: string | null;
  stargazersCount: number;
  language: string | null;
  pushedAt: string | null;
  recentCommits: number;
  recentPullRequests: number;
  recentIssues: number;
}

export interface GithubSnapshotSource {
  getContributions(input: { from: string; to: string }): Promise<RawContributions>;
  getRepository(repository: GithubSnapshotRepositoryDefinition): Promise<RawRepository>;
}

export class GithubSnapshotValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GithubSnapshotValidationError";
  }
}

export class GithubApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GithubApiError";
  }
}

export class GithubRateLimitError extends GithubApiError {
  constructor(message = "GitHub API rate limit reached") {
    super(message);
    this.name = "GithubRateLimitError";
  }
}

export interface CollectGithubSnapshotOptions {
  now?: Date;
  from?: string;
  to?: string;
  repositories: GithubSnapshotRepositoryDefinition[];
  sourceStatus?: SnapshotSourceStatus;
}

const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;
const contributionLevels: Record<string, ContributionLevel> = {
  NONE: "none",
  FIRST_QUARTILE: "low",
  SECOND_QUARTILE: "medium",
  THIRD_QUARTILE: "high",
  FOURTH_QUARTILE: "highest",
};

function fail(message: string): never {
  throw new GithubSnapshotValidationError(message);
}

function requiredText(value: unknown, field: string): string {
  if (typeof value !== "string" || !value.trim()) fail(`${field} must be a non-empty string`);
  return value.trim();
}

function isoDate(value: unknown, field: string): string {
  const result = requiredText(value, field);
  if (!isoDatePattern.test(result) || Number.isNaN(Date.parse(`${result}T00:00:00Z`))) {
    fail(`${field} must be an ISO date`);
  }
  return result;
}

function isoDateTime(value: unknown, field: string): string {
  const result = requiredText(value, field);
  if (Number.isNaN(Date.parse(result))) fail(`${field} must be an ISO datetime`);
  return new Date(result).toISOString();
}

function nonNegativeInteger(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) {
    fail(`${field} must be a non-negative integer`);
  }
  return value;
}

function httpUrl(value: unknown, field: string): string {
  const result = requiredText(value, field);
  try {
    const parsed = new URL(result);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") throw new Error();
  } catch {
    fail(`${field} must be an http or https URL`);
  }
  return result;
}

function contributionLevel(value: unknown, field: string): ContributionLevel {
  if (typeof value === "string" && value in contributionLevels) return contributionLevels[value];
  if (typeof value === "string" && ["none", "low", "medium", "high", "highest"].includes(value)) {
    return value as ContributionLevel;
  }
  fail(`${field} must be a known contribution level`);
}

function normalizeCalendar(value: unknown): GithubContributionWeek[] {
  if (!Array.isArray(value)) fail("calendar must contain a complete year");
  const weeks = value.map((week, weekIndex) => {
    const weekRecord = week as Record<string, unknown>;
    const rawDays = weekRecord && (weekRecord.contributionDays ?? weekRecord.days);
    if (!week || typeof week !== "object" || !Array.isArray(rawDays)) {
      fail(`calendar week ${weekIndex + 1} must contain contribution days`);
    }
    const days = (rawDays as unknown[]).map((day, dayIndex) => {
      if (!day || typeof day !== "object") fail(`calendar day ${weekIndex + 1}-${dayIndex + 1} is invalid`);
      const candidate = day as Record<string, unknown>;
      return {
        date: isoDate(candidate.date, `calendar day ${weekIndex + 1}-${dayIndex + 1} date`),
        count: nonNegativeInteger(candidate.count ?? candidate.contributionCount, "contribution count"),
        level: contributionLevel(candidate.level ?? candidate.contributionLevel, "contribution level"),
      };
    });
    if (days.length < 1 || days.length > 7) fail(`calendar week ${weekIndex + 1} must contain one to seven days`);
    return { days };
  });

  const days = weeks.flatMap((week) => week.days);
  if (weeks.length < 52 || days.length < 365 || days.length > 371) fail("calendar must contain a complete year");
  for (let index = 1; index < days.length; index += 1) {
    const previous = new Date(`${days[index - 1].date}T00:00:00Z`);
    previous.setUTCDate(previous.getUTCDate() + 1);
    if (previous.toISOString().slice(0, 10) !== days[index].date) fail("calendar dates must be consecutive");
  }
  return weeks;
}

function normalizeTotals(value: unknown): GithubSnapshot["totals"] {
  if (!value || typeof value !== "object") fail("totals must be an object");
  const candidate = value as Record<string, unknown>;
  return {
    commits: nonNegativeInteger(candidate.commits ?? candidate.totalCommitContributions, "commits"),
    pullRequests: nonNegativeInteger(candidate.pullRequests ?? candidate.totalPullRequestContributions, "pull requests"),
    issues: nonNegativeInteger(candidate.issues ?? candidate.totalIssueContributions, "issues"),
  };
}

function normalizeRepository(value: unknown, index: number): GithubSnapshotRepository {
  if (!value || typeof value !== "object") fail(`repository ${index + 1} is invalid`);
  const candidate = value as Record<string, unknown>;
  const recent = candidate.recent;
  if (!recent || typeof recent !== "object") fail(`repository ${index + 1} recent activity is invalid`);
  const recentValues = recent as Record<string, unknown>;
  const updatedAt = candidate.updatedAt === undefined || candidate.updatedAt === null
    ? undefined
    : isoDateTime(candidate.updatedAt, `repository ${index + 1} updatedAt`);
  const language = candidate.language === undefined || candidate.language === null
    ? undefined
    : requiredText(candidate.language, `repository ${index + 1} language`);
  return {
    slug: requiredText(candidate.slug, `repository ${index + 1} slug`),
    title: requiredText(candidate.title, `repository ${index + 1} title`),
    fullName: requiredText(candidate.fullName, `repository ${index + 1} fullName`),
    url: httpUrl(candidate.url, `repository ${index + 1} url`),
    description: typeof candidate.description === "string" ? candidate.description.trim() : "",
    language,
    stars: nonNegativeInteger(candidate.stars, `repository ${index + 1} stars`),
    updatedAt,
    recent: {
      commits: nonNegativeInteger(recentValues.commits, "recent commits"),
      pullRequests: nonNegativeInteger(recentValues.pullRequests, "recent pull requests"),
      issues: nonNegativeInteger(recentValues.issues, "recent issues"),
    },
  };
}

export function validateGithubSnapshot(value: unknown): GithubSnapshot {
  if (!value || typeof value !== "object") fail("snapshot must be an object");
  const candidate = value as Record<string, unknown>;
  if (candidate.schemaVersion !== GITHUB_SNAPSHOT_SCHEMA_VERSION) fail("schemaVersion is unsupported");
  const generatedAt = isoDateTime(candidate.generatedAt, "generatedAt");
  if (!candidate.window || typeof candidate.window !== "object") fail("window must be an object");
  const window = candidate.window as Record<string, unknown>;
  const from = isoDate(window.from, "window from");
  const to = isoDate(window.to, "window to");
  const expectedDays = Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000) + 1;
  if (expectedDays !== 90 || window.days !== expectedDays) fail("window must cover exactly 90 days");
  const calendar = normalizeCalendar(candidate.calendar);
  const totals = normalizeTotals(candidate.totals);
  if (!Array.isArray(candidate.repositories)) fail("repositories must be an array");
  const repositories = candidate.repositories.map((repository, index) => normalizeRepository(repository, index));
  if (candidate.sourceStatus !== "success" && candidate.sourceStatus !== "fallback") fail("sourceStatus is unsupported");
  return {
    schemaVersion: GITHUB_SNAPSHOT_SCHEMA_VERSION,
    generatedAt,
    window: { from, to, days: expectedDays },
    calendar,
    totals,
    repositories,
    sourceStatus: candidate.sourceStatus,
  };
}

export function isGithubSnapshotStale(snapshot: GithubSnapshot, now = new Date()): boolean {
  return snapshot.sourceStatus === "fallback"
    || now.getTime() - Date.parse(snapshot.generatedAt) > GITHUB_SNAPSHOT_MAX_AGE_DAYS * 86_400_000;
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function daysBetweenInclusive(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000) + 1;
}

function defaultWindow(now: Date): { from: string; to: string } {
  const to = formatDate(now);
  const fromDate = new Date(`${to}T00:00:00Z`);
  fromDate.setUTCDate(fromDate.getUTCDate() - 89);
  return { from: formatDate(fromDate), to };
}

export async function collectGithubSnapshot(
  source: GithubSnapshotSource,
  options: CollectGithubSnapshotOptions,
): Promise<GithubSnapshot> {
  const now = options.now ?? new Date();
  const defaults = defaultWindow(now);
  const from = options.from ?? defaults.from;
  const to = options.to ?? defaults.to;
  const rawContributions = await source.getContributions({ from, to });
  const calendar = normalizeCalendar(rawContributions.calendar);
  const totals = normalizeTotals(rawContributions.totals);
  const repositories: GithubSnapshotRepository[] = [];
  for (const definition of options.repositories) {
    const raw = await source.getRepository(definition);
    repositories.push(normalizeRepository({
      slug: definition.slug,
      title: definition.title,
      fullName: raw.nameWithOwner,
      url: raw.htmlUrl,
      description: raw.description ?? "",
      language: raw.language ?? undefined,
      stars: raw.stargazersCount,
      updatedAt: raw.pushedAt ?? undefined,
      recent: {
        commits: raw.recentCommits,
        pullRequests: raw.recentPullRequests,
        issues: raw.recentIssues,
      },
    }, repositories.length));
  }
  return validateGithubSnapshot({
    schemaVersion: GITHUB_SNAPSHOT_SCHEMA_VERSION,
    generatedAt: now.toISOString(),
    window: { from, to, days: daysBetweenInclusive(from, to) },
    calendar,
    totals,
    repositories,
    sourceStatus: options.sourceStatus ?? "success",
  });
}

export async function refreshGithubSnapshot(
  filePath: string,
  source: GithubSnapshotSource,
  options: CollectGithubSnapshotOptions,
): Promise<boolean> {
  const candidate = await collectGithubSnapshot(source, options);
  return writeGithubSnapshot(filePath, candidate);
}

export async function writeGithubSnapshot(filePath: string, value: unknown): Promise<boolean> {
  const snapshot = validateGithubSnapshot(value);
  const serialized = `${JSON.stringify(snapshot, null, 2)}\n`;
  try {
    const previous = JSON.parse(await fs.promises.readFile(filePath, "utf8"));
    const previousSnapshot = validateGithubSnapshot(previous);
    const materiallyChanged = (candidate: GithubSnapshot) => {
      const { generatedAt: _generatedAt, ...material } = candidate;
      return JSON.stringify(material);
    };
    if (materiallyChanged(previousSnapshot) === materiallyChanged(snapshot)) return false;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT" && !(error instanceof GithubSnapshotValidationError)) throw error;
  }
  await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
  const temporaryPath = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  try {
    await fs.promises.writeFile(temporaryPath, serialized, "utf8");
    await fs.promises.rename(temporaryPath, filePath);
  } catch (error) {
    await fs.promises.rm(temporaryPath, { force: true });
    throw error;
  }
  return true;
}

interface GithubApiSourceOptions {
  token: string;
  username: string;
  fetchImpl?: typeof fetch;
  sleep?: (milliseconds: number) => Promise<void>;
  maxAttempts?: number;
  timeoutMs?: number;
}

interface GithubResponse {
  [key: string]: unknown;
}

const graphqlQuery = `
  query PortfolioContributions($login: String!, $calendarFrom: DateTime!, $from: DateTime!, $to: DateTime!) {
    user(login: $login) {
      calendarCollection: contributionsCollection(from: $calendarFrom, to: $to) {
        contributionCalendar {
          weeks { contributionDays { date contributionCount contributionLevel } }
        }
      }
      rollingCollection: contributionsCollection(from: $from, to: $to) {
        totalCommitContributions
        totalPullRequestContributions
        totalIssueContributions
      }
    }
  }
`;

function transientStatus(status: number): boolean {
  return status === 408 || status === 425 || status === 500 || status === 502 || status === 503 || status === 504;
}

function recordArray(value: unknown, field: string): Record<string, unknown>[] {
  if (!Array.isArray(value) || value.some((entry) => !entry || typeof entry !== "object" || Array.isArray(entry))) {
    throw new GithubApiError(`GitHub returned malformed ${field} data`);
  }
  return value as Record<string, unknown>[];
}

export function createGithubApiSource(options: GithubApiSourceOptions): GithubSnapshotSource {
  const fetchImpl = options.fetchImpl ?? fetch;
  const sleep = options.sleep ?? ((milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds)));
  const maxAttempts = options.maxAttempts ?? 3;
  const timeoutMs = options.timeoutMs ?? 15_000;
  const headers = {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${options.token}`,
    "X-GitHub-Api-Version": "2022-11-28",
  };

  async function requestJson(url: string, init?: RequestInit): Promise<GithubResponse> {
    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      let response: Response;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);
      try {
        response = await fetchImpl(url, { ...init, signal: controller.signal });
      } catch (error) {
        if (attempt === maxAttempts) {
          const reason = error instanceof DOMException && error.name === "AbortError" ? `timed out after ${timeoutMs}ms` : (error as Error).message;
          throw new GithubApiError(`GitHub request failed: ${reason}`);
        }
        await sleep(2 ** (attempt - 1) * 250);
        continue;
      } finally {
        clearTimeout(timeout);
      }
      if (response.status === 403 || response.status === 429 || response.headers.get("x-ratelimit-remaining") === "0") {
        const retryAfter = response.headers.get("retry-after");
        const reset = response.headers.get("x-ratelimit-reset");
        const guidance = retryAfter
          ? `; retry after ${retryAfter} seconds`
          : reset
            ? `; rate limit resets at ${new Date(Number(reset) * 1000).toISOString()}`
            : "";
        throw new GithubRateLimitError(`GitHub rate limit reached while requesting ${url}${guidance}`);
      }
      if (response.ok) {
        try {
          return await response.json() as GithubResponse;
        } catch {
          throw new GithubApiError(`GitHub returned malformed JSON for ${url}`);
        }
      }
      if (!transientStatus(response.status) || attempt === maxAttempts) {
        throw new GithubApiError(`GitHub request returned HTTP ${response.status} for ${url}`);
      }
      await sleep(2 ** (attempt - 1) * 250);
    }
    throw new GithubApiError(`GitHub request failed for ${url}`);
  }

  return {
    async getContributions({ from, to }) {
      const calendarFromDate = new Date(`${to}T00:00:00Z`);
      calendarFromDate.setUTCDate(calendarFromDate.getUTCDate() - 364);
      const calendarFrom = calendarFromDate.toISOString().slice(0, 10);
      const response = await requestJson("https://api.github.com/graphql", {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({
          query: graphqlQuery,
          variables: {
            login: options.username,
            calendarFrom: `${calendarFrom}T00:00:00Z`,
            from: `${from}T00:00:00Z`,
            to: `${to}T23:59:59Z`,
          },
        }),
      });
      if (Array.isArray(response.errors) && response.errors.length > 0) {
        throw new GithubApiError("GitHub GraphQL returned errors");
      }
      const user = (response.data as {
        user?: {
          calendarCollection?: Record<string, unknown>;
          rollingCollection?: Record<string, unknown>;
          contributionsCollection?: Record<string, unknown>;
        };
      } | undefined)?.user;
      const calendarCollection = user?.calendarCollection ?? user?.contributionsCollection;
      const rollingCollection = user?.rollingCollection ?? user?.contributionsCollection;
      if (!calendarCollection || !rollingCollection) throw new GithubApiError("GitHub GraphQL returned no contribution collection");
      return {
        calendar: ((calendarCollection.contributionCalendar as { weeks?: RawContributions["calendar"] } | undefined)?.weeks ?? []).map((week) => ({
          contributionDays: week.contributionDays,
        })),
        totals: {
          commits: rollingCollection.totalCommitContributions as number,
          pullRequests: rollingCollection.totalPullRequestContributions as number,
          issues: rollingCollection.totalIssueContributions as number,
        },
      };
    },

    async getRepository(repository) {
      const [owner, name] = repository.fullName.split("/");
      if (!owner || !name) throw new GithubApiError(`Invalid repository identity ${repository.fullName}`);
      const base = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}`;
      const metadata = await requestJson(base, { headers });
      const commits = await requestJson(`${base}/commits?per_page=10`, { headers });
      const pullRequests = await requestJson(`${base}/pulls?state=all&per_page=10`, { headers });
      const issues = await requestJson(`${base}/issues?state=all&per_page=10`, { headers });
      const commitRecords = recordArray(commits, `${repository.fullName} commits`);
      const pullRequestRecords = recordArray(pullRequests, `${repository.fullName} pull requests`);
      const issueRecords = recordArray(issues, `${repository.fullName} issues`);
      const record = metadata as Record<string, unknown>;
      return {
        name: requiredText(record.name, `${repository.fullName} name`),
        nameWithOwner: requiredText(record.full_name, `${repository.fullName} full_name`),
        htmlUrl: httpUrl(record.html_url, `${repository.fullName} html_url`),
        description: typeof record.description === "string" ? record.description : null,
        stargazersCount: record.stargazers_count as number,
        language: typeof record.language === "string" ? record.language : null,
        pushedAt: typeof record.pushed_at === "string" ? record.pushed_at : null,
        recentCommits: commitRecords.length,
        recentPullRequests: pullRequestRecords.length,
        recentIssues: issueRecords.filter((issue) => !("pull_request" in issue)).length,
      };
    },
  };
}
