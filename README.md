# Useful One-Page Tools

A low-cost static hub for small, single-purpose browser tools under one domain: `usefulonepagetools.com`.

## Strategy

Build one strong domain with many focused internal tool pages instead of splitting tools across many domains. The goal is a low-running-cost asset: Cloudflare Pages, static HTML/CSS/JS, no login, no database, and minimal external API dependency.

## Current tools

- World Meeting Time Finder
- US, Europe & Asia Time Overlap Tool
- AI Tools Pricing Comparison
- Website Response Time Checker
- USD ⇄ JPY Inflation Adjusted Calculator
- Unix Timestamp Converter
- Percentage Change Calculator
- Compound Interest Calculator
- Loan Payment Calculator
- Sales Tax Calculator
- Password Generator
- Word & Character Counter
- JSON Formatter & Validator
- List Sorter & Deduper
- UTM URL Builder
- UTC to Local Time Converter
- Time Zone Abbreviation Lookup
- Date Difference Calculator
- Business Days Calculator
- Add Days to Date Calculator
- Markdown Table Generator
- Base64 Encoder Decoder
- URL Encoder Decoder
- Regex Tester
- Text Case Converter
- Time Zone Meeting Planner by Cities
- Work Hours Overlap Calculator
- ISO 8601 Date Converter
- Cron Expression Explainer
- Countdown Timer

## Local preview

```bash
cd /Users/noma/.openclaw/workspace/projects/one-page-tools
python3 -m http.server 4190
```

Then open `http://localhost:4190/`.

## Deploy

Cloudflare Pages:

- Framework preset: `None`
- Build command: empty
- Build output directory: repository root / static output directory used by the Pages project

## Lightweight click analytics

The site includes a tiny first-party event tracker:

- `assets/analytics.js` records clicks on elements with `data-track`.
- `functions/api/event.js` receives events on Cloudflare Pages at `/api/event`.
- If an R2 bucket binding named `ONE_PAGE_TOOLS_ANALYTICS_BUCKET` or `ANALYTICS_BUCKET` exists, events are stored as `analytics/events/YYYY-MM-DD/*.json`.
- Without a bucket binding, events are logged to the Pages Function console and the endpoint still returns OK.

Tracked events intentionally avoid ad-click tracking.

To analyze exported/downloaded event JSON locally:

```bash
node scripts/analyze_events.js analytics/events
```
