import type { PinnedProject } from "../types";

const PAT_KEY = "quiver_pat";
const PINNED_KEY = "quiver_pinned";

export function storePat(pat: string): void {
  sessionStorage.setItem(PAT_KEY, pat);
}

export function getPat(): string | null {
  return sessionStorage.getItem(PAT_KEY);
}

export function clearPat(): void {
  sessionStorage.removeItem(PAT_KEY);
}

export function storePinned(projects: PinnedProject[]): void {
  localStorage.setItem(PINNED_KEY, JSON.stringify(projects));
}

export function getPinned(): PinnedProject[] {
  try {
    const raw = localStorage.getItem(PINNED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function clearPinned(): void {
  localStorage.removeItem(PINNED_KEY);
}
