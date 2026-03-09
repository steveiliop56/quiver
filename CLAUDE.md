# Quiver

We are building a new self-hosted application called Quiver.

### Idea

Usually, we star different self-hosted applications in a "Should Try" list that we never actually look at again. What if we could game-ify this experience? Quiver will be a mini-game based around this idea. Projects are playing cards that are presented to the user and if the project is interesting, you throw a dart and "pin" it to your wall of interesting projects. Later, you can export your self-hosted projects in a Markdown list to browse later. The game should be retro-style (think solitaire).

### Game Flow

The user lands on the page. They are presented with an input for a GitHub PAT (since we will need to fetch a lot of stuff from the GitHub API). After they input their PAT they select their list and we start fetching and presenting projects. A project appears as a playing card in the middle of the screen containing the project information. This included but not limited to app name, icon (if found), website and description. All of these can be fetched from the GitHub description and/or website. If the user likes the project they throw a dart and pin the card to the wall behind. If they do not like the project, the card falls off the screen. Once the user decides they have enough projects (or we can no longer fetch other projects), he can export the list in Markdown or JSON format for later viewing.

### Implementation Details

The application should run client-side, this means no backend.

We are going to utilize Vite for the renderer and React for the framework. For styling utilize Tailwind CSS. Octokit can be used to make GitHub API usage easier. We are going to need animations and in that case, pick Framer. For any other libraries for icons, sounds, textures notify the user of your choice. Since the app is going to be single page we are not going to need any routing but in case we do, pick Tanstack Router. Finally, for package manager choose Bun.

For the game itself, until the user exports the project list we store the PAT and project list in the browser local-storage emphasizing on a small efficient format that can be used later to retrieve projects. Once the user exports the PAT gets immediately deleted. It's important we minimize the API usage even with the PAT to avoid getting rate limited.

License the project as MIT.

### Constraints

We never use the PAT to fetch anything else other than projects. We treat is as readonly and never expose it everywhere. Additionally we store the PAT in session storage instead of local storage and we re-prompt the user for the PAT to continue the project or offer to export it in case we loose the PAT. The game needs to be fully responsive and work both on desktop and mobile.

### Development Details

While developing, never run potentially destructive commands (like installing packages, or removing/moving files) without asking the user for explicit permission. The directory in which you are on is your workspace and you cannot exit out of it. Everything you do stays there.

I have setup an empty GitHub repository for you, let's get started.
