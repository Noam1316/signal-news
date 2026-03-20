# Signal News — Intelligence Platform

## What this is
Real-time geopolitical news intelligence platform. Ingests RSS from 28+ sources, runs keyword-based analysis (no LLM API needed), and surfaces signals, shocks, bias, and prediction market comparisons.

## Tech stack
- Next.js 16 (App Router) + TypeScript + Tailwind CSS v4 + React 19
- Deployed on Vercel (serverless) — no SQLite, no native modules
- RTL-first (Hebrew), bilingual UI (he/en toggle)

## Build / Run / Verify
```bash
npm run dev          # dev server on :3000
npm run build        # production build (MUST pass before push)
npx tsc --noEmit     # type-check without emitting
```

## Architecture — critical rules
- **No localhost fetch in API routes.** Import `getCachedArticles()` from `@/services/article-cache` directly. Vercel serverless cannot call itself.
- **No `better-sqlite3` or native modules.** Vercel doesn't support them. Use in-memory cache or Vercel KV.
- **All analysis is keyword-based.** User has no Anthropic API key. Never add code that requires ANTHROPIC_API_KEY.
- **Shared article cache:** `src/services/article-cache.ts` is the single source of truth for RSS data. All API routes use it.

## Project structure
```
src/
  app/dashboard/page.tsx    — Main dashboard (4 sections: Brief, Shocks, Map, Intel)
  app/api/                  — API routes (analyze, stories, shocks, entities, polymarket, bias)
  services/                 — Core engines (ai-analyzer, story-clusterer, shock-detector, polymarket, media-bias)
  components/               — UI (brief/, shocks/, map/, intel/, entities/, layout/)
  i18n/                     — Language context (he/en)
```

## Key conventions
- Dashboard sections are lazy-loaded with `dynamic()` — keep this pattern
- IntelHub uses tabs (Overview, Signal vs Market, Media Bias, Feed) — add new intel features as tabs, not new sections
- MapEntities also uses tabs (Map, Entities) — same pattern
- SectionNav has exactly 4 items — do not add more without explicit request
- Components return `null` gracefully when data fetch fails — never crash the dashboard

## Gotchas
- `headline` in BriefStory is `LocalizedText` ({ en, he }), not a string — always handle both
- RSS feeds may fail silently in dev — this is expected, not a bug
- Date hydration mismatch (SSR vs client timezone) is a known pre-existing issue
- Hebrew text needs `dir={dir}` from `useLanguage()` on container elements
