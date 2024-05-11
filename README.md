# Snazzy's Twitch Tools (twitch-tools)

A random collection of tools for Twitch streamers and mods

If you want to access the tools, [go here](https://snazzyfox.github.io/twitch-tools)

## Notes for developers

This is a completely in-browser tool. There are no servers. The main site serves as a configuration tool, and generates URLs where all settings are encoded. Moderation tools run in the browser directly.

## npm scripts

## Build and dev scripts

- `dev` – start development server
- `build` – build production version of the app
- `preview` – locally preview production build

### Testing scripts

- `typecheck` – checks TypeScript types
- `lint` – runs ESLint
- `prettier:check` – checks files with Prettier
- `vitest` – runs vitest tests
- `vitest:watch` – starts vitest watch
- `test` – runs `vitest`, `prettier:check`, `lint` and `typecheck` scripts

### Other scripts

- `storybook` – starts storybook dev server
- `storybook:build` – build production storybook bundle to `storybook-static`
- `prettier:write` – formats all files with Prettier
