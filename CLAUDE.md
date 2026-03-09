# Quiver

A retro-styled mini-game for discovering self-hosted projects from your GitHub stars. Projects appear as playing cards — pin the ones you like to your wall with a dart, dismiss the rest. Export your curated list when you're done.

### Game Flow

The user lands on the page and enters their GitHub username (no token required). They select a deck filter (all stars, by language, or by topic) and we start fetching and presenting projects via the public GitHub API. A project appears as a playing card in the middle of the screen containing the project information (name, avatar, description, website, stars, language, topics). If the user likes the project they pin it to the cork board wall behind. If not, the card falls off the screen. Once done, they export as Markdown or JSON.

If the GitHub API rate limit is hit (60 req/hour unauthenticated), an inline prompt asks for a PAT to continue (5,000 req/hour). The PAT is held only in memory (never stored to disk/storage) and is discarded when the page closes.

### Tech Stack

- **Renderer**: Vite
- **Framework**: React 19 + TypeScript
- **Styling**: Tailwind CSS 4
- **Animations**: Framer Motion
- **GitHub API**: Octokit
- **Audio**: Web Audio API (chiptune, no external files)
- **Package manager**: Bun

### File Structure

```
src/
├── main.tsx                          Entry point
├── App.tsx                           Root component, screen state machine
├── types.ts                          Shared TypeScript interfaces
├── index.css                         Global styles, CRT effects, color vars
├── utils/
│   ├── github.ts                     Octokit wrapper, fetch stars, rate limit handling
│   ├── storage.ts                    localStorage for username + pinned projects
│   ├── export.ts                     Markdown/JSON export + file download
│   └── sound.ts                      Web Audio API chiptune engine
└── components/
    ├── PatScreen.tsx                  Username input (entry screen)
    ├── ListSelector.tsx              Deck filter selection (language/topic)
    ├── GameBoard.tsx                 Main game loop, card display, pin/dismiss
    ├── ProjectCard.tsx               Individual project card UI
    ├── RateLimitPrompt.tsx           Inline PAT prompt shown on 403
    └── ExportScreen.tsx              Export preview + download
```

### Color Palette (CSS custom properties in index.css)

- `--color-retro-green` (#00ff41) — primary text, CRT phosphor glow
- `--color-retro-dark` (#0a0a0a) — dark backgrounds
- `--color-retro-card` (#1a1a2e) — card backgrounds
- `--color-retro-accent` (#e94560) — errors, pass button, accents
- `--color-retro-gold` (#f5c518) — titles, highlights, export button
- `--color-retro-blue` (#16213e) — input containers, pause menu
- `--color-cork` (#c4956a) / `--color-cork-dark` (#a67b5b) — cork board wall

### Screen Flow

```
PatScreen (username input)
  → ListSelector (deck filter, fetches 3 pages sample)
    → GameBoard (play: pin/dismiss cards, paginated fetch)
      → ExportScreen (preview + download MD/JSON)
```

### Constraints

- **No backend** — fully client-side
- **PAT is optional** — only needed if rate limited, never stored to disk
- **Username** stored in localStorage for convenience
- **Pinned projects** stored in localStorage as compact `{id, fullName}[]`
- **Responsive** — works on desktop and mobile
- **Licensed MIT**

### Development Details

While developing, never run potentially destructive commands (like installing packages, or removing/moving files) without asking the user for explicit permission. The directory in which you are on is your workspace and you cannot exit out of it. Everything you do stays there.
