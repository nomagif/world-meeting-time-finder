# world-meeting-time-finder

Single-purpose static site for checking the same meeting time across major cities.

## Local preview

```bash
cd /Users/noma/.openclaw/workspace/projects/world-meeting-time-finder
python3 -m http.server 4190
```

## Files

- `index.html`
- `404.html`
- `robots.txt`
- `sitemap.xml`
- `assets/styles.css`

## Deploy

Cloudflare Pages:
- Framework preset: `None`
- Build command: empty
- Build output directory: `projects/world-meeting-time-finder`

## Lightweight click analytics

The site includes a tiny first-party event tracker:

- `assets/analytics.js` records clicks on elements with `data-track`.
- `functions/api/event.js` receives events on Cloudflare Pages at `/api/event`.
- If an R2 bucket binding named `ONE_PAGE_TOOLS_ANALYTICS_BUCKET` (or `ANALYTICS_BUCKET`) exists, events are stored as `analytics/events/YYYY-MM-DD/*.json`.
- Without a bucket binding, events are logged to the Pages Function console and the endpoint still returns OK.

Tracked events intentionally avoid ad-click tracking. They cover tool buttons, hub links, related-tool links, and official external links.

To analyze exported/downloaded event JSON locally:

```bash
node scripts/analyze_events.js analytics/events
```
