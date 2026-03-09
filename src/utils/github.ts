import { Octokit } from "octokit";
import type { StarredRepo } from "../types";

export function createOctokit(pat?: string): Octokit {
  return pat ? new Octokit({ auth: pat }) : new Octokit();
}

export class RateLimitError extends Error {
  constructor() {
    super("GitHub API rate limit exceeded. Provide a PAT to continue.");
    this.name = "RateLimitError";
  }
}

export async function validateUsername(
  octokit: Octokit,
  username: string
): Promise<boolean> {
  try {
    await octokit.rest.users.getByUsername({ username });
    return true;
  } catch {
    return false;
  }
}

interface RawRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  homepage: string | null;
  owner: { login: string; avatar_url: string };
  stargazers_count: number;
  language: string | null;
  topics?: string[];
}

function mapRepos(data: RawRepo[]): StarredRepo[] {
  return data.map((r) => ({
    id: r.id,
    name: r.name,
    fullName: r.full_name,
    description: r.description,
    url: r.html_url,
    homepage: r.homepage,
    owner: {
      login: r.owner.login,
      avatarUrl: r.owner.avatar_url,
    },
    stars: r.stargazers_count,
    language: r.language,
    topics: r.topics || [],
  }));
}

export async function fetchStarredRepos(
  octokit: Octokit,
  username: string,
  page: number = 1,
  perPage: number = 30
): Promise<{ repos: StarredRepo[]; hasMore: boolean }> {
  try {
    const { data } = await octokit.rest.activity.listReposStarredByUser({
      username,
      per_page: perPage,
      page,
      sort: "created",
      direction: "desc",
    });

    const repos = mapRepos(data as RawRepo[]);
    return { repos, hasMore: repos.length === perPage };
  } catch (err: unknown) {
    if (
      err &&
      typeof err === "object" &&
      "status" in err &&
      (err as { status: number }).status === 403
    ) {
      throw new RateLimitError();
    }
    throw err;
  }
}

/** Fetch multiple pages to build a language/topic index */
export async function fetchStarSample(
  octokit: Octokit,
  username: string,
  pages: number = 3
): Promise<StarredRepo[]> {
  const all: StarredRepo[] = [];
  for (let p = 1; p <= pages; p++) {
    const { repos, hasMore } = await fetchStarredRepos(octokit, username, p, 100);
    all.push(...repos);
    if (!hasMore) break;
  }
  return all;
}

/** Extract language counts from a list of repos */
export function extractLanguages(repos: StarredRepo[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const r of repos) {
    const lang = r.language || "Unknown";
    counts.set(lang, (counts.get(lang) || 0) + 1);
  }
  return new Map([...counts.entries()].sort((a, b) => b[1] - a[1]));
}

/** Extract top topics from a list of repos */
export function extractTopics(repos: StarredRepo[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const r of repos) {
    for (const t of r.topics) {
      counts.set(t, (counts.get(t) || 0) + 1);
    }
  }
  return new Map([...counts.entries()].sort((a, b) => b[1] - a[1]));
}

/** Fisher-Yates shuffle */
export function shuffleRepos(repos: StarredRepo[]): StarredRepo[] {
  const arr = [...repos];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
