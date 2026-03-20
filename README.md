# Signal News — Real-Time Geopolitical Intelligence

> AI-powered news intelligence platform that scans 28+ RSS sources, detects signals in the noise, and compares predictions with real money markets.

**Live:** [signal-news on Vercel](https://signal-news-noam1316s-projects.vercel.app/dashboard)

---

## What it does

| Feature | Description |
|---------|-------------|
| **Daily Brief** | Auto-generated intelligence summary from clustered RSS articles |
| **Shock Detection** | Identifies likelihood shocks, narrative splits, and fragmentation between Israeli and international media |
| **Signal vs Market** | Compares our keyword-based likelihood scores with Polymarket prediction prices — surfaces alpha |
| **Media Bias Analysis** | Maps 35+ sources on a political spectrum (AllSides/MBFC methodology), detects coverage gaps and narrative divergence |
| **Geopolitical Map** | SVG world map colored by article density per country |
| **Entity Graph** | Named entity extraction (60+ Hebrew+English entities) with co-occurrence analysis |

## Architecture

```
RSS Sources (28+)
      │
      ▼
  article-cache.ts ──── In-memory shared cache
      │
      ├──▶ ai-analyzer.ts ──── Keyword-based: topics, sentiment, signal/noise, political leaning
      ├──▶ story-clusterer.ts ── Groups articles into stories, calculates likelihood
      ├──▶ shock-detector.ts ── Statistical anomaly detection (3 shock types)
      ├──▶ polymarket.ts ──── Fetches Polymarket API, matches with our stories
      └──▶ media-bias.ts ──── Source bias database + coverage gap + narrative divergence
```

**Key design decisions:**
- **No LLM API required** — all analysis is keyword-based, runs entirely on the edge
- **No database** — in-memory cache only (Vercel serverless constraint)
- **Bilingual** — Hebrew (RTL) + English, toggled via UI
- **4-section dashboard** — Brief, Shocks, Map+Entities, Intel Hub (with sub-tabs)

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **UI:** React 19, no component library
- **Deployment:** Vercel (serverless)
- **Data:** RSS feeds (public), Polymarket Gamma API (public, no key)

## Getting Started

```bash
# Install
npm install

# Dev
npm run dev
# → http://localhost:3000/dashboard

# Build (verify before pushing)
npm run build
```

No environment variables needed — everything runs on public APIs.

## Project Structure

```
src/
├── app/
│   ├── dashboard/page.tsx      # Main dashboard
│   └── api/                    # API routes
│       ├── analyze/            # Article analysis
│       ├── stories/            # Story clustering
│       ├── shocks/             # Dynamic shock detection
│       ├── polymarket/         # Signal vs Market
│       ├── bias/               # Media bias analysis
│       ├── entities/           # Entity extraction
│       └── rss/                # RSS ingestion
├── services/
│   ├── article-cache.ts        # Shared RSS cache (single source of truth)
│   ├── ai-analyzer.ts          # Keyword-based analysis engine
│   ├── story-clusterer.ts      # Story grouping + likelihood
│   ├── shock-detector.ts       # Statistical shock detection
│   ├── polymarket.ts           # Polymarket integration
│   ├── media-bias.ts           # Source bias database
│   └── rss-fetcher.ts          # RSS feed fetcher
├── components/
│   ├── brief/                  # BriefList, BriefCard, DateHeader
│   ├── shocks/                 # ShockFeed, ShockCard
│   ├── map/                    # GeoMap, MapEntities
│   ├── intel/                  # IntelHub, IntelDashboard, PolymarketComparison, MediaBiasPanel
│   ├── entities/               # EntityGraph
│   └── layout/                 # Navbar, SectionNav
└── i18n/                       # Language context (he/en)
```

## Part of Maof Project

Signal News is the intelligence demo for **Maof (Tech-Lead Israel)** — an AI decision-support system for matching IDF veterans with STEM teaching positions and tech careers via a 2+2 circular career model.

---

Built with Claude Code
