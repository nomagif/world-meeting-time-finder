#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const root = process.cwd();
const toolsDir = path.join(root, 'tools');
const base = 'https://usefulonepagetools.com';
const today = new Date().toISOString().slice(0, 10);
function esc(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
function text(s){return String(s||'').replace(/<[^>]+>/g,'').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'").trim()}
function slugTitle(slug){return slug.split('-').map(w=>['and','to','by','of'].includes(w)?w:w.charAt(0).toUpperCase()+w.slice(1)).join(' ')}
function track(s){return s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')}
const categoryMap = [
  ['time-tools', /time|date|day|week|utc|zone|meeting|hours|minutes|duration|age|countdown|cron|iso/i],
  ['money-calculators', /price|tax|loan|interest|discount|invoice|profit|margin|tip|percentage|usd|jpy|calculator/i],
  ['text-tools', /text|word|character|markdown|case|headline|line|reading|list|sorter|deduper/i],
  ['developer-tools', /json|base64|url|regex|html|jwt|uuid|robots|timestamp|encoder|decoder|query/i],
  ['marketing-tools', /utm|slug|meta|open-graph|email|ai-tools|pricing|headline/i],
  ['web-tools', /website|response|checker|status/i]
];
function inferCat(slug, html){
  const badge = html.match(/<span class="badge">([^<]+)<\/span>/i)?.[1];
  if (badge) return text(badge);
  for (const [cat,re] of categoryMap) if (re.test(slug)) return slugTitle(cat);
  return 'Web tools';
}
const files = fs.readdirSync(toolsDir).filter(f=>f.endsWith('.html')).sort();
const meta = files.map(file=>{
  const slug=file.replace(/\.html$/,'');
  const html=fs.readFileSync(path.join(toolsDir,file),'utf8');
  const h1=text(html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1]) || slugTitle(slug);
  const name=h1.replace(/^Free\s+/i,'');
  const desc=text(html.match(/<meta name="description" content="([^"]*)"/i)?.[1]) || `Free ${name.toLowerCase()} for quick browser-based work.`;
  const cat=inferCat(slug, html);
  return {file,slug,name,desc,cat};
});
const bySlug = Object.fromEntries(meta.map(m=>[m.slug,m]));
function relatedFor(m){
  const same = meta.filter(x=>x.slug!==m.slug && x.cat===m.cat);
  const fallback = meta.filter(x=>x.slug!==m.slug && x.cat!==m.cat);
  return [...same, ...fallback].slice(0,4);
}
let changed = 0;
for (const m of meta) {
  const p = path.join(toolsDir, m.file);
  let html = fs.readFileSync(p,'utf8');
  const canonical = `${base}/tools/${m.slug}`;
  const title = `${m.name} | Free ${m.cat.replace(/ tools| calculators/i,'')} Tool`;
  const cleanDesc = `${m.desc.replace(/\s*Free, fast, and browser-based\.?\s*$/i,'').slice(0,130)} Free, browser-based, and built for one quick task.`;
  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${esc(title)}</title>`);
  html = html.replace(/<meta name="description" content="[^"]*"\s*\/?\s*>/i, `<meta name="description" content="${esc(cleanDesc)}" />`);
  html = html.replace(/<link rel="canonical" href="[^"]*"\s*\/?\s*>/i, `<link rel="canonical" href="${canonical}" />`);
  html = html.replace(/<meta property="og:url" content="[^"]*"\s*\/?\s*>/i, `<meta property="og:url" content="${canonical}" />`);
  html = html.replace(/<meta property="og:title" content="[^"]*"\s*\/?\s*>/i, `<meta property="og:title" content="${esc(m.name)}" />`);
  html = html.replace(/<meta property="og:description" content="[^"]*"\s*\/?\s*>/i, `<meta property="og:description" content="${esc(cleanDesc)}" />`);
  // Fix extensionless internal hrefs for static hosting consistency.
  html = html.replace(/href="\.\/([a-z0-9-]+)"/g, (all, s)=> bySlug[s] ? `href="./${s}.html"` : all);
  html = html.replace(/href="\.\.\/tools\/([a-z0-9-]+)"/g, (all, s)=> bySlug[s] ? `href="../tools/${s}.html"` : all);
  // Add category breadcrumb link near nav if missing.
  const catSlug = track(m.cat);
  if (!html.includes(`${catSlug}-category-breadcrumb`) && html.includes('<div class="nav">')) {
    html = html.replace(/<div class="nav">([\s\S]*?)<\/div>/i, `<div class="nav">$1 · <a data-track="${m.slug}-${catSlug}-category-breadcrumb" href="../${catSlug}/">${esc(m.cat)}</a></div>`);
  }
  // Replace/insert related tools with category-focused links.
  const rel = relatedFor(m).map(r=>`<a data-track="${m.slug}-related-${r.slug}" href="./${r.slug}.html">${esc(r.name)}</a>`).join(' · ');
  const relatedBlock = `<div class="card small"><h2>Related ${esc(m.cat.toLowerCase())}</h2><p>${rel} · <a data-track="${m.slug}-related-all-tools" href="../index.html">All tools</a></p></div>`;
  if (/<div class="card small"><h2>Related tools<\/h2>[\s\S]*?<\/div>/i.test(html)) {
    html = html.replace(/<div class="card small"><h2>Related tools<\/h2>[\s\S]*?<\/div>/i, relatedBlock);
  } else if (!html.includes(`Related ${esc(m.cat.toLowerCase())}`)) {
    html = html.replace(/<\/div>\s*<script src="\.\.\/assets\/analytics\.js" defer><\/script>/i, `${relatedBlock}</div><script src="../assets/analytics.js" defer></script>`);
  }
  // Add compact search-intent answer block if absent.
  if (!html.includes('Quick answer')) {
    const qa = `<div class="card small"><h2>Quick answer</h2><p class="muted">Use this ${esc(m.name.toLowerCase())} to finish the task in one browser page. It is designed for fast checks, copyable results, and no account signup.</p></div>`;
    html = html.replace(/(<div class="card">[\s\S]*?<\/div>)/i, `$1${qa}`);
  }
  if (html !== fs.readFileSync(p,'utf8')) { fs.writeFileSync(p, html); changed++; }
}
// category pages: ensure all categories exist and link canonical .html URLs.
const cats=[...new Set(meta.map(m=>m.cat))].sort();
for (const cat of cats){
 const dir=path.join(root, track(cat)); fs.mkdirSync(dir,{recursive:true}); const list=meta.filter(m=>m.cat===cat);
 const body=list.map(m=>`<li><h3><a data-track="category-${track(cat)}-${m.slug}" href="../tools/${m.slug}.html">${esc(m.name)}</a></h3><p class="muted">${esc(m.desc)}</p></li>`).join('\n');
 fs.writeFileSync(path.join(dir,'index.html'),`<!doctype html>\n<html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><title>${esc(cat)} | Useful One-Page Tools</title><meta name="description" content="Free ${esc(cat.toLowerCase())} for quick browser-based tasks, with no login or setup."/><link rel="canonical" href="${base}/${track(cat)}/"/><link rel="stylesheet" href="../assets/styles.css"/></head><body><div class="wrap"><div class="nav"><a data-track="${track(cat)}-all-tools" href="../index.html">← All tools</a></div><div class="hero"><span class="badge">${esc(cat)}</span><h1>${esc(cat)}</h1><p class="muted">Free one-page ${esc(cat.toLowerCase())} for focused tasks. Pick a tool, use it in the browser, and move on.</p></div><div class="card small"><ul class="tool-list">${body}</ul></div></div><script src="../assets/analytics.js" defer></script></body></html>\n`);
}
// sitemap
const urls=[`${base}/`, ...cats.map(c=>`${base}/${track(c)}/`), ...meta.map(m=>`${base}/tools/${m.slug}.html`)];
fs.writeFileSync(path.join(root,'sitemap.xml'),`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u=>`  <url><loc>${u}</loc><lastmod>${today}</lastmod></url>`).join('\n')}\n</urlset>\n`);
console.log(JSON.stringify({ok:true,toolPages:meta.length,changed,categories:cats},null,2));
