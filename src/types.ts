export interface StarredRepo {
  id: number;
  name: string;
  fullName: string;
  description: string | null;
  url: string;
  homepage: string | null;
  owner: {
    login: string;
    avatarUrl: string;
  };
  stars: number;
  language: string | null;
  topics: string[];
}

export interface PinnedProject {
  id: number;
  fullName: string;
}

export type GameScreen = "pat" | "lists" | "game" | "export";
