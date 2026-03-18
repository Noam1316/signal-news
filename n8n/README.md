# n8n Article Scraper — Signal News

## Overview
This n8n workflow scrapes full article text from RSS sources and sends it to Signal News for enhanced political leaning classification.

**Without this workflow:** Political leaning is determined by source only (e.g., Ynet = center).
**With this workflow:** Political leaning is analyzed per-article using keyword analysis on the full text.

## Setup

### 1. Install n8n
```bash
# Docker (recommended)
docker run -it --rm -p 5678:5678 n8nio/n8n

# Or npm
npm install -g n8n && n8n start
```

### 2. Import Workflow
1. Open n8n at `http://localhost:5678`
2. Click **Workflows** → **Import from File**
3. Select `article-scraper-workflow.json`

### 3. Configure Environment Variables
In n8n Settings → Variables, add:

| Variable | Value | Required |
|----------|-------|----------|
| `SIGNAL_NEWS_URL` | `http://localhost:3000` | Yes |
| `WEBHOOK_SECRET` | (same as server's `WEBHOOK_SECRET`) | If configured |

### 4. Optional: Configure WEBHOOK_SECRET on Signal News
```bash
# In signal-news-demo/.env.local
WEBHOOK_SECRET=your-secret-key-here
```

### 5. Activate & Run
- Click **Activate** to enable the 15-minute schedule
- Or click **Execute Workflow** to run once manually

## Workflow Steps

```
1. Schedule Trigger (every 15 min)
      ↓
2. GET /api/rss/latest?limit=50
      ↓
3. Split articles into individual items
      ↓
4. Fetch full HTML page for each article
      ↓
5. Extract text (strip HTML, scripts, nav, footer)
      ↓
6. Filter: only articles with 100+ chars of text
      ↓
7. POST to /api/webhooks/enrich with { articleId, sourceId, fullText }
```

## API Endpoints

### POST `/api/webhooks/enrich`
Send enrichment data:
```json
{
  "articleId": "a1b2c3d4e5f67890",
  "sourceId": "ynet",
  "fullText": "Full article body text..."
}
```

Batch mode (array):
```json
[
  { "articleId": "...", "sourceId": "ynet", "fullText": "..." },
  { "articleId": "...", "sourceId": "haaretz", "fullText": "..." }
]
```

### GET `/api/webhooks/enrich`
Check enrichment stats:
```json
{
  "status": "ok",
  "stats": {
    "totalEnriched": 42,
    "maxCapacity": 500,
    "oldestEntry": "2026-03-18T08:00:00Z",
    "newestEntry": "2026-03-18T10:30:00Z"
  }
}
```

## Notes
- Cache holds max 500 articles (LRU eviction)
- Full text is capped at 50KB per article
- Cache is in-memory — resets on server restart
- Workflow runs every 15 minutes by default (configurable)
