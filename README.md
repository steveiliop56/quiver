# Quiver

A retro-styled mini-game for discovering self-hosted projects from your GitHub stars. Projects appear as playing cards — pin the ones you like to your wall with a dart, dismiss the rest. Export your curated list when you're done.

> [!WARNING]
> This is a vibe-coded project. I created it for fun to test out Claude. Use at your own risk.

## Features

- **Card-based browsing** — Starred repos presented one at a time as playing cards
- **Pin or pass** — Pin interesting projects to your cork board wall, or dismiss them
- **Filter by language/topic** — Choose a deck based on programming language or topic
- **Retro CRT aesthetic** — Scanlines, phosphor glow, refresh band, pixel font
- **Chiptune audio** — Background music and sound effects (Web Audio API, no external files)
- **Export** — Download your pinned projects as Markdown or JSON
- **Privacy-first** — PAT stored in session storage only, deleted on export
- **Fully client-side** — No backend, runs entirely in the browser

## Quick Start

```bash
bun install
bun dev
```

## Docker

```bash
docker build -t quiver .
docker run -p 8080:80 quiver
```

Then open [http://localhost:8080](http://localhost:8080).

## Usage

1. Enter a GitHub Personal Access Token (needs read access to starred repos)
2. Choose a deck — all stars, or filter by language/topic
3. Pin projects you like (Arrow Right / D), pass on the rest (Arrow Left / A)
4. Press M for music, ESC for pause menu
5. Export your pinned projects as `.md` or `.json`

## Tech Stack

- [Vite](https://vite.dev) + [React](https://react.dev) + TypeScript
- [Tailwind CSS](https://tailwindcss.com)
- [Framer Motion](https://motion.dev)
- [Octokit](https://github.com/octokit/octokit.js)
- Web Audio API (chiptune sounds)

## License

[MIT](LICENSE)
