import type { PinnedProject } from "../types";

const USERNAME_KEY = "quiver_username";
const PINNED_KEY = "quiver_pinned";

export function storeUsername(username: string): void {
  localStorage.setItem(USERNAME_KEY, username);
}

export function getUsername(): string | null {
  return localStorage.getItem(USERNAME_KEY);
}

export function clearUsername(): void {
  localStorage.removeItem(USERNAME_KEY);
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
