#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');

const dir = process.argv[2] || path.join(process.cwd(), 'analytics/r2-events');
const records = [];
function walk(p) {
  if (!fs.existsSync(p)) return;
  const stat = fs.statSync(p);
  if (stat.isDirectory()) for (const name of fs.readdirSync(p)) walk(path.join(p, name));
  else if (p.endsWith('.json')) {
    try { records.push(JSON.parse(fs.readFileSync(p, 'utf8'))); } catch (_) {}
  }
}
walk(dir);
function isBotLike(row) {
  return /Headless|bot|crawler|spider|curl|wget|preview|monitor/i.test(row.user_agent || '');
}
function day(row) {
  return String(row.received_at || row.ts || '').slice(0, 10) || '(unknown)';
}
function countBy(rows, fn) {
  const map = new Map();
  for (const row of rows) {
    const key = fn(row) || '(unknown)';
    map.set(key, (map.get(key) || 0) + 1);
  }
  return [...map.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}
function top(rows, fn, n = 10) { return countBy(rows, fn).slice(0, n).map(([key, count]) => ({ key, count })); }

const humans = records.filter(r => !isBotLike(r));
const report = {
  generated_at: new Date().toISOString(),
  totals: {
    events: records.length,
    human_like_events: humans.length,
    bot_like_events: records.length - humans.length,
    page_views: records.filter(r => r.event === 'page_view').length,
    tool_actions: records.filter(r => r.event === 'tool_action' || r.event === 'tool_run').length,
    clicks: records.filter(r => r.event === 'click').length
  },
  by_day: Object.fromEntries(countBy(records, day)),
  top_pages_all: top(records.filter(r => r.event === 'page_view'), r => r.page, 20),
  top_pages_human_like: top(humans.filter(r => r.event === 'page_view'), r => r.page, 20),
  top_tool_actions: top(records.filter(r => r.event === 'tool_action' || r.event === 'tool_run'), r => r.detail && r.detail.id, 20),
  top_clicks: top(records.filter(r => r.event === 'click'), r => r.detail && r.detail.id, 20),
  countries: top(records, r => r.cf_country, 20),
  referrers: top(records, r => r.referrer, 20)
};
console.log(JSON.stringify(report, null, 2));
