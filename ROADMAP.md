# 100-tool roadmap

Direction: keep `usefulonepagetools.com` as the main domain and add focused internal tools under `/tools/`. Avoid new domains unless a page proves it deserves a standalone brand.

## Operating rules

- One URL = one clear job.
- Prefer static HTML/CSS/JS and browser-only calculations.
- Avoid paid APIs, databases, logins, comments, and support-heavy workflows.
- Each page needs title, meta description, canonical, WebApplication schema, FAQ, example use case, related links, and analytics events.
- Each page should answer one exact search intent in the H1, intro, example, and FAQ without becoming a thin auto-generated page.
- Expand in batches of 10, then check Search Console and click analytics before the next batch.
- Use `TOOL_BACKLOG_100.md` as the source of truth for candidate order.

## Current status

- Internal tools: 30
- Next milestone: Search Console review, then 40 internal tools
- Long-term target: 100 internal tools on one domain

## Best next categories

1. Time/date converters and schedulers
2. Money and business calculators
3. Text, JSON, CSV, and developer utilities
4. Marketing URL, copy, and campaign helpers
5. AI/SaaS comparison and checklist pages

## Search Console review loop

Run this after each 10-tool release, ideally after 7, 14, and 30 days:

1. Check indexed/not-indexed status for the new URLs.
2. Record impressions, clicks, CTR, and average position by page.
3. Pull top queries for each URL and compare them with the intended search phrase.
4. Improve pages with impressions but low CTR: title, meta description, intro, FAQ wording.
5. Improve pages with position 8-30: add examples, related links, and clearer answer blocks.
6. Keep pages with zero impressions for later pruning or internal-link support.

## Extra growth levers

- Add category hub pages once a cluster has 5+ tools, e.g. `/time-tools/`, `/developer-tools/`, `/marketing-tools/`.
- Add FAQPage schema in addition to WebApplication schema for pages with real FAQs.
- Add copy/share buttons and URL parameters where useful, so users can share an already-filled tool state.
- Create a small page generator script so every new tool has consistent metadata, schema, FAQ, related links, and analytics events.
- Keep external API tools rare; if a tool needs server-side checks, make it clearly worth the maintenance cost.
- Build internal links by cluster, not randomly: each tool should link to its closest 2-4 siblings.
- Track simple conversion events: tool action clicks, copy clicks, outbound affiliate clicks, and related-tool clicks.
