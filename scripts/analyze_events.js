#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');

const dir = process.argv[2] || path.join(process.cwd(), 'analytics/events');
const records = [];
function walk(p) {
  if (!fs.existsSync(p)) return;
  const stat = fs.statSync(p);
  if (stat.isDirectory()) {
    for (const name of fs.readdirSync(p)) walk(path.join(p, name));
    return;
  }
  if (!p.endsWith('.json')) return;
  try { records.push(JSON.parse(fs.readFileSync(p, 'utf8'))); } catch (_) {}
}
walk(dir);

function countBy(fn) {
  const map = new Map();
  for (const row of records) {
    const key = fn(row) || '(unknown)';
    map.set(key, (map.get(key) || 0) + 1);
  }
  return [...map.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}
function print(title, rows, limit = 20) {
  console.log(`\n${title}`);
  console.log('-'.repeat(title.length));
  for (const [key, count] of rows.slice(0, limit)) console.log(`${String(count).padStart(5)}  ${key}`);
}

console.log(`Events: ${records.length}`);
print('By page', countBy((r) => r.page));
print('By event', countBy((r) => r.event));
print('By click target', countBy((r) => r.detail && r.detail.id));
print('By country', countBy((r) => r.cf_country));
print('By referrer', countBy((r) => r.referrer));
