# Repository Guidelines

## Project Structure & Module Organization
- `src/index.tsx` boots the Bun server and wires routes defined in `api`.
- `src/App.tsx` and `src/components/*` hold UI for service listings; shared utilities live in `src/lib` and `src/hooks`.
- Static assets and entry HTML sit in `src/index.html`, `src/index.css`, and `src/logo.svg`; Tailwind tokens live in `styles/`.
- `api/bazaar/list.ts` is the proxy to the Coinbase discovery endpoint; keep response shims colocated under `api/`.
- Build artifacts land in `dist/`; never edit them directly.

## Build, Test, and Development Commands
- `bun install` installs dependencies; rerun after updating `package.json`.
- `bun dev` runs the development server with HMR at the logged URL.
- `bun start` serves the production bundle; use before delivery to confirm static behaviour.
- `bun run build.ts --outdir=dist` compiles HTML/TSX and Tailwind, cleaning the target folder first. Add flags (`--minify`, `--sourcemap`) as needed.

## Coding Style & Naming Conventions
- Use TypeScript with ESNext modules; prefer functional React components in `PascalCase` files.
- Keep two-space indentation, double quotes for strings, and trailing commas where Bun formatters add them.
- Compose styles with Tailwind utility classes; share variants via `class-variance-authority` helpers in `src/lib`.
- Favor `camelCase` for variables/functions and reserve `CONSTANT_CASE` for true immutables. Import local modules via the `@/` alias when crossing folders.

## Testing Guidelines
- No automated suite exists yet; introduce `bun test` specs under `src/__tests__/` or alongside components as `Component.test.tsx`.
- Use React Testing Library for UI and mock network calls hitting `/api/bazaar/list` so tests stay deterministic.
- Add smoke checks for the Bun proxy handler to cover error paths (timeouts, upstream 5xx). Treat new features as unshippable without matching tests.

## Commit & Pull Request Guidelines
- Commit summaries should stay in the present tense, ideally following Conventional Commits (`feat: add services carousel`). Avoid bare verbs like `cleanup` without context.
- Keep commits focused; run the relevant build/test command before pushing.
- PRs need a short context paragraph, screenshots or terminal output for UI/CLI changes, and linked issues if available. Mention follow-up tasks explicitly so reviewers can track them.

## Security & Configuration Tips
- Never hardcode API keys; if secrets are required, surface them via environment variables and document usage in `README.md`.
- The Bun proxy already adds `cache-control: no-store`; maintain those safeguards when expanding API handlers.
