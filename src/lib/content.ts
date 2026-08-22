import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { marked } from "marked";

type Status = "in-progress" | "shipped";
type Image = { src: string; alt: string };

export interface Writing {
  slug: string;
  title: string;
  summary: string;
  publishedAt: string;
  formattedPublishedAt: string;
  tags: string[];
  relatedProjects: string[];
  image?: Image;
  bodyHtml: string;
  readingTimeMinutes: number;
}

export interface Project {
  slug: string;
  title: string;
  summary: string;
  status: Status;
  statusLabel: string;
  role: string;
  tags: string[];
  repositoryUrl: string;
  liveUrl?: string;
  isLive: boolean;
  updatedAt: string;
  formattedUpdatedAt: string;
  image?: Image;
  bodyHtml: string;
  relatedWritings: Writing[];
}

export class ContentValidationError extends Error {}

const defaultRoot = path.join(process.cwd(), "Content");
const filenamePattern = /^[a-z0-9]+(?:-[a-z0-9]+)*\.md$/;
const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;

function fail(message: string): never {
  throw new ContentValidationError(message);
}

function parseRequiredText(value: unknown, field: string): string {
  if (typeof value !== "string" || !value.trim()) fail(`${field} must be a non-empty string`);
  return value.trim();
}

function parseTags(value: unknown): string[] {
  if (!Array.isArray(value) || value.some((tag) => typeof tag !== "string" || !tag.trim())) {
    fail("tags must contain unique, non-empty labels");
  }
  const result = value.map((tag) => tag.trim());
  if (!result.length || new Set(result.map((tag) => tag.toLowerCase())).size !== result.length) {
    fail("tags must contain unique, non-empty labels");
  }
  return result;
}

function parseIsoDate(value: unknown, field: string): string {
  const result = value instanceof Date
    ? value.toISOString().slice(0, 10)
    : parseRequiredText(value, field);
  if (!isoDatePattern.test(result) || Number.isNaN(Date.parse(`${result}T00:00:00Z`))) {
    fail(`${field} must be an ISO date`);
  }
  if (new Date(`${result}T00:00:00Z`).toISOString().slice(0, 10) !== result) {
    fail(`${field} must be an ISO date`);
  }
  return result;
}

function parseWebUrl(value: unknown, field: string): string {
  const result = parseRequiredText(value, field);
  try {
    const parsed = new URL(result);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") throw new Error();
  } catch {
    fail(`${field} must be an http or https URL`);
  }
  return result;
}

function parseImage(value: unknown, root: string, collection: string): Image | undefined {
  if (value === undefined) return undefined;
  if (!value || typeof value !== "object") fail("image must contain src and alt");
  const candidate = value as Record<string, unknown>;
  const src = parseRequiredText(candidate.src, "image src");
  const alt = parseRequiredText(candidate.alt, "image alt");
  if (!/^\.\.\/images\/.+\.(png|jpe?g|webp)$/i.test(src)) {
    fail("image src must point to Content/images");
  }
  const imagePath = path.resolve(root, collection, src);
  const imageRoot = `${path.resolve(root, "images")}${path.sep}`;
  if (!imagePath.startsWith(imageRoot) || !fs.existsSync(imagePath) || !fs.statSync(imagePath).isFile()) {
    fail("image src must reference an existing Content/images asset");
  }
  return { src, alt };
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}

function readMarkdownRecords(root: string, collection: string) {
  const directory = path.join(root, collection);
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory).filter((name) => name.endsWith(".md")).map((filename) => {
    if (!filenamePattern.test(filename)) fail("filename must be lowercase kebab-case");
    const source = fs.readFileSync(path.join(directory, filename), "utf8");
    const parsed = matter(source);
    if (!parsed.content.trim()) fail("body must not be empty");
    return { slug: filename.slice(0, -3), data: parsed.data, body: parsed.content };
  });
}

export function loadContent(root = defaultRoot): { projects: Project[]; writings: Writing[] } {
  const projects: Project[] = readMarkdownRecords(root, "projects").map(({ slug, data, body }) => {
    const status = data.status;
    if (status !== "in-progress" && status !== "shipped") fail("status must be in-progress or shipped");
    const updatedAt = parseIsoDate(data.updatedAt, "updatedAt");
    const liveUrl = data.liveUrl === undefined ? undefined : parseWebUrl(data.liveUrl, "liveUrl");
    return {
      slug,
      title: parseRequiredText(data.title, "title"),
      summary: parseRequiredText(data.summary, "summary"),
      status,
      statusLabel: status === "in-progress" ? "In progress" : "Shipped",
      role: parseRequiredText(data.role, "role"),
      tags: parseTags(data.tags),
      repositoryUrl: parseWebUrl(data.repositoryUrl, "repositoryUrl"),
      liveUrl,
      isLive: Boolean(liveUrl),
      updatedAt,
      formattedUpdatedAt: formatDate(updatedAt),
      image: parseImage(data.image, root, "projects"),
      bodyHtml: marked.parse(body) as string,
      relatedWritings: [],
    };
  });

  const projectIds = new Set(projects.map(({ slug }) => slug));
  const writings: Writing[] = readMarkdownRecords(root, "writings").map(({ slug, data, body }) => {
    const relatedProjects = data.relatedProjects;
    if (!Array.isArray(relatedProjects) || !relatedProjects.length || relatedProjects.some((id) => typeof id !== "string")) {
      fail("relatedProjects must contain at least one project identity");
    }
    if (new Set(relatedProjects).size !== relatedProjects.length) {
      fail("relatedProjects must contain unique project identities");
    }
    for (const id of relatedProjects) {
      if (!projectIds.has(id)) fail(`relatedProjects references unknown project "${id}"`);
    }
    const publishedAt = parseIsoDate(data.publishedAt, "publishedAt");
    const words = body.trim().split(/\s+/).length;
    return {
      slug,
      title: parseRequiredText(data.title, "title"),
      summary: parseRequiredText(data.summary, "summary"),
      publishedAt,
      formattedPublishedAt: formatDate(publishedAt),
      tags: parseTags(data.tags),
      relatedProjects,
      image: parseImage(data.image, root, "writings"),
      bodyHtml: marked.parse(body) as string,
      readingTimeMinutes: Math.max(1, Math.ceil(words / 200)),
    };
  });

  writings.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt) || a.title.localeCompare(b.title));
  projects.sort((a, b) => {
    if (a.status !== b.status) return a.status === "in-progress" ? -1 : 1;
    return b.updatedAt.localeCompare(a.updatedAt) || a.title.localeCompare(b.title);
  });
  for (const project of projects) {
    project.relatedWritings = writings.filter((writing) => writing.relatedProjects.includes(project.slug));
  }
  return { projects, writings };
}

const canonical = loadContent();

export const getProjects = () => canonical.projects;
export const getWritings = () => canonical.writings;
export function getProject(slug: string): Project {
  return canonical.projects.find((project) => project.slug === slug) ?? fail(`Unknown project "${slug}"`);
}
export function getWriting(slug: string): Writing {
  return canonical.writings.find((writing) => writing.slug === slug) ?? fail(`Unknown writing "${slug}"`);
}
