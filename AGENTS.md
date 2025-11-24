# Repository Guidelines

## Project Structure & Module Organization
- `src/app`: Next.js App Router routes, server actions, and auth callbacks (`app/login`, `app/plays`, `app/syncing`, `app/auth/callback`).
- `src/components`, `src/hooks`, `src/utils`: Shared UI, custom hooks, Supabase helpers, and Tailwind-friendly utilities.
- `src/server` and `supabase`: Server-side Spotify sync + Supabase data access plus SQL migrations/config.
- `public`: Static assets (favicons, images) served directly by Next.js.
- `eslint.config.mjs`, `tailwind.config`, `tsconfig.json`: Centralized linting, styling, and TypeScript settings every change should respect.

## Build, Test, and Development Commands
- `npm run dev` – start the local Next.js dev server at `http://localhost:3000` with hot reload.
- `npm run build` – compile the production bundle; required before deploying to Vercel.
- `npm run start` – serve the production build locally for smoke testing.
- `npm run lint` – run ESLint with the Next.js config; fix warnings before committing.

## Coding Style & Naming Conventions
- TypeScript + React 19 with functional components; prefer server components except when hooks or browser APIs are required.
- Stick to the default ESLint + `eslint-config-next` rules and Tailwind CSS v4 utility-first styling.
- Use PascalCase for components (`ArtistBarChart.tsx`), camelCase for functions/variables, and kebab-case for route folders.
- Keep modules colocated with their feature (e.g., new dashboard view in `src/app/dashboard` with supporting server/utils files nearby).

## Testing Guidelines
- No dedicated test suite yet; add lightweight Jest/React Testing Library specs in `src/__tests__` when touching complex logic.
- For data pipelines, validate manually via `npm run dev` plus Supabase dashboard; document scenarios in PRs until automated coverage is in place.

## Commit & Pull Request Guidelines
- Follow conventional, action-oriented commit messages (`feat: add artist payout chart`, `fix: handle missing plays`).
- Each PR should include: purpose summary, screenshots for UI changes, Supabase/Spotify config notes if relevant, and references to linked issues.
- Ensure lint passes locally and note any manual verification steps (e.g., "Synced 3 Spotify accounts, verified payouts table").
