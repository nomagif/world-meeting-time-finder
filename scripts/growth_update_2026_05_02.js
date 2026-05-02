#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const root = process.cwd();
const toolsDir = path.join(root, 'tools');
const base = 'https://usefulonepagetools.com';
const today = '2026-05-02';

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function titleFromSlug(slug) {
  const small = new Set(['to', 'and', 'by', 'for', 'of']);
  return slug.split('-').map((w, i) => small.has(w) && i ? w : w.toUpperCase() === w ? w : w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}
function cleanHref(slug) { return `./${slug}`; }
function adScript() { return '<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7137707592053151" crossorigin="anonymous"></script>'; }
function pageShell({ slug, title, description, badge = 'Time Tools', body, js = '', related = [] }) {
  const rel = related.map(r => `<a data-track="${slug}-related-${r}" href="./${r}">${esc(titleFromSlug(r))}</a>`).join(' · ');
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${esc(title)} | Useful One-Page Tools</title>
  <meta name="description" content="${esc(description)}" />
  <link rel="canonical" href="${base}/tools/${slug}" />
  <meta property="og:title" content="${esc(title)}" />
  <meta property="og:description" content="${esc(description)}" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${base}/tools/${slug}" />
  <meta name="twitter:card" content="summary" />
  ${adScript()}
  <link rel="stylesheet" href="../assets/styles.css" />
  <script type="application/ld+json">{"@context":"https://schema.org","@graph":[{"@type":"WebApplication","name":"${esc(title)}","url":"${base}/tools/${slug}","applicationCategory":"${esc(badge)}","operatingSystem":"Any","description":"${esc(description)}","isAccessibleForFree":true,"publisher":{"@type":"Organization","name":"Useful One-Page Tools","url":"${base}/"}},{"@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"All tools","item":"${base}/"},{"@type":"ListItem","position":2,"name":"${esc(title)}","item":"${base}/tools/${slug}"}]}]}</script>
</head>
<body>
  <div class="wrap">
    <div class="nav"><a data-track="${slug}-nav-all-tools" href="../index.html">← All tools</a> · <a data-track="${slug}-time-tools-category-breadcrumb" href="../time-tools/">Time Tools</a></div>
    <div class="hero"><span class="badge">${esc(badge)}</span><h1>${esc(title)}</h1><p class="muted">${esc(description)}</p></div>
${body}
    <div class="card small"><h2>Related time tools</h2><p>${rel} · <a data-track="${slug}-related-all-tools" href="../index.html">All tools</a></p></div>
  </div>
  ${js ? `<script>\n${js}\n  </script>` : ''}
  <script src="../assets/analytics.js" defer></script>
</body>
</html>
`;
}

const zones = {
  Tokyo: 'Asia/Tokyo',
  'New York': 'America/New_York',
  London: 'Europe/London',
  Berlin: 'Europe/Berlin',
  Singapore: 'Asia/Singapore',
  Sydney: 'Australia/Sydney',
  'Los Angeles': 'America/Los_Angeles',
  'San Francisco': 'America/Los_Angeles',
  Chicago: 'America/Chicago',
  Paris: 'Europe/Paris',
  Dubai: 'Asia/Dubai',
  Seoul: 'Asia/Seoul'
};
const timeJs = `
const zoneMap = ${JSON.stringify(zones, null, 2)};
function getTimeZoneOffset(date, timeZone) {
  const dtf = new Intl.DateTimeFormat('en-US', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  const parts = Object.fromEntries(dtf.formatToParts(date).filter(p => p.type !== 'literal').map(p => [p.type, p.value]));
  const asUTC = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
  return (asUTC - date.getTime()) / 60000;
}
function zonedDateTimeToUtc(dateStr, timeStr, timeZone) {
  const [y,m,d] = dateStr.split('-').map(Number);
  const [hh,mm] = timeStr.split(':').map(Number);
  const guess = new Date(Date.UTC(y, m - 1, d, hh, mm));
  const offset = getTimeZoneOffset(guess, timeZone);
  return new Date(Date.UTC(y, m - 1, d, hh, mm) - offset * 60000);
}
function formatInZone(date, timeZone) {
  return new Intl.DateTimeFormat('en-US', { timeZone, weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false, timeZoneName: 'short' }).format(date);
}
function hourInZone(date, timeZone) {
  return Number(new Intl.DateTimeFormat('en-US', { timeZone, hour: '2-digit', hour12: false }).format(date).replace('24','0'));
}
function scoreHour(h) { if (h >= 9 && h < 17) return 3; if (h >= 7 && h < 9) return 2; if (h >= 17 && h < 21) return 2; if (h >= 6 && h < 22) return 1; return 0; }
function labelHour(h) { if (h >= 9 && h < 17) return 'work hours'; if (h >= 7 && h < 9) return 'early'; if (h >= 17 && h < 21) return 'evening'; if (h >= 6 && h < 22) return 'possible'; return 'bad'; }
function todayISO(){ return new Date().toISOString().slice(0,10); }
`;

function meetingPairPage({ slug, title, description, cityA, cityB, extraCities = [] }) {
  const cities = [cityA, cityB, ...extraCities];
  const body = `    <div class="card">
      <div class="row two"><div><label for="date">Meeting date</label><input id="date" type="date" /></div><div><label for="baseTime">${esc(cityA)} time</label><input id="baseTime" type="time" value="09:00" /></div></div>
      <button id="run" data-track="${slug}-find-times">Compare local times</button>
      <div id="summary" class="result"></div>
    </div>
    <div class="card small"><h2>Best quick answer</h2><p class="muted">For ${esc(cityA)} and ${esc(cityB)}, try a few candidate times and look for rows where both cities are marked as work hours, early, or evening. This avoids accidentally scheduling a meeting in the middle of the night.</p></div>
    <div class="card small"><h2>FAQ</h2><h3>Does this handle daylight saving time?</h3><p class="muted">Yes. It uses your browser's time zone database, so DST is reflected for the selected date.</p><h3>Can I use it for client calls?</h3><p class="muted">Yes. Use it for quick planning, then confirm the final invitation in your calendar app.</p></div>`;
  const js = `${timeJs}
const cities = ${JSON.stringify(cities)};
const date = document.getElementById('date');
const baseTime = document.getElementById('baseTime');
const summary = document.getElementById('summary');
date.value = todayISO();
function render(){
  const utc = zonedDateTimeToUtc(date.value, baseTime.value, zoneMap['${cityA}']);
  const rows = cities.map(city => { const h = hourInZone(utc, zoneMap[city]); return { city, time: formatInZone(utc, zoneMap[city]), fit: labelHour(h), score: scoreHour(h) }; });
  const total = rows.reduce((s,r)=>s+r.score,0);
  summary.innerHTML = '<p><strong>Fit score:</strong> '+total+' / '+(cities.length*3)+' — higher is better.</p><table><thead><tr><th>City</th><th>Local time</th><th>Fit</th></tr></thead><tbody>'+rows.map(r=>'<tr><td>'+r.city+'</td><td>'+r.time+'</td><td>'+r.fit+'</td></tr>').join('')+'</tbody></table>';
  if (window.opTrack) window.opTrack('tool_run', { id: '${slug}-compare', city_a: '${cityA}', city_b: '${cityB}', score: total });
}
document.getElementById('run').addEventListener('click', render); render();`;
  fs.writeFileSync(path.join(toolsDir, slug + '.html'), pageShell({ slug, title, description, body, js, related: ['best-world-meeting-time-finder','time-zone-meeting-planner-by-cities','work-hours-overlap-calculator','utc-to-local-time-converter','us-europe-asia-time-overlap-tool'] }));
}

function converterPage() {
  const slug = 'pst-est-cet-time-converter';
  const body = `    <div class="card"><div class="row two"><div><label for="zone">Input time zone</label><select id="zone"><option value="America/Los_Angeles">PST/PDT</option><option value="America/New_York">EST/EDT</option><option value="Europe/Paris">CET/CEST</option></select></div><div><label for="date">Date</label><input id="date" type="date" /></div><div><label for="time">Time</label><input id="time" type="time" value="09:00" /></div></div><button id="run" data-track="${slug}-convert">Convert time</button><div id="result" class="result"></div></div><div class="card small"><h2>What this converts</h2><p class="muted">PST/PDT is Pacific time, EST/EDT is Eastern time, and CET/CEST is Central European time. The label changes with daylight saving time automatically for the selected date.</p></div>`;
  const js = `${timeJs}
const date=document.getElementById('date'), time=document.getElementById('time'), zone=document.getElementById('zone'), result=document.getElementById('result'); date.value=todayISO();
const targets=[['PST/PDT','America/Los_Angeles'],['EST/EDT','America/New_York'],['CET/CEST','Europe/Paris'],['London','Europe/London'],['Tokyo','Asia/Tokyo']];
function render(){const utc=zonedDateTimeToUtc(date.value,time.value,zone.value); result.innerHTML='<table><thead><tr><th>Zone</th><th>Local time</th></tr></thead><tbody>'+targets.map(([label,z])=>'<tr><td>'+label+'</td><td>'+formatInZone(utc,z)+'</td></tr>').join('')+'</tbody></table>'; if(window.opTrack) window.opTrack('tool_run',{id:'${slug}-convert', input_zone:zone.value});}
document.getElementById('run').addEventListener('click',render); render();`;
  fs.writeFileSync(path.join(toolsDir, slug + '.html'), pageShell({ slug, title: 'PST EST CET Time Converter', description: 'Convert between PST/PDT, EST/EDT, and CET/CEST for a selected date and time, with daylight saving time handled automatically.', body, js, related: ['utc-to-local-time-converter','time-zone-abbreviation-lookup','best-world-meeting-time-finder','work-hours-overlap-calculator'] }));
}

function remoteTeamPage() {
  const slug = 'remote-team-meeting-planner';
  const body = `    <div class="card"><label for="cities">Team cities</label><select id="cities" multiple size="8"><option selected>Tokyo</option><option selected>New York</option><option selected>London</option><option>Berlin</option><option>Singapore</option><option>Sydney</option><option>Los Angeles</option><option>Chicago</option><option>Dubai</option></select><label for="date">Date</label><input id="date" type="date" /><button id="run" data-track="${slug}-find-best-slots">Find best slots</button><div id="result" class="result"></div></div><div class="card small"><h2>How to read the score</h2><p class="muted">Each candidate hour is scored by how reasonable it is for every selected city. Work hours score highest, early mornings and evenings are still possible, and night hours score poorly.</p></div>`;
  const js = `${timeJs}
const select=document.getElementById('cities'), date=document.getElementById('date'), result=document.getElementById('result'); date.value=todayISO();
function selected(){return Array.from(select.selectedOptions).map(o=>o.value)}
function render(){const cities=selected(); const candidates=[]; for(let h=0;h<24;h++){const utc=zonedDateTimeToUtc(date.value,String(h).padStart(2,'0')+':00','UTC'); const details=cities.map(c=>{const hour=hourInZone(utc,zoneMap[c]); return {city:c,time:formatInZone(utc,zoneMap[c]),fit:labelHour(hour),score:scoreHour(hour)}}); candidates.push({utc,score:details.reduce((s,d)=>s+d.score,0),details});} candidates.sort((a,b)=>b.score-a.score); const top=candidates.slice(0,5); result.innerHTML=top.map((c,i)=>'<h3>#'+(i+1)+' score '+c.score+' / '+(cities.length*3)+'</h3><table><tbody>'+c.details.map(d=>'<tr><td>'+d.city+'</td><td>'+d.time+'</td><td>'+d.fit+'</td></tr>').join('')+'</tbody></table>').join(''); if(window.opTrack) window.opTrack('tool_run',{id:'${slug}-find-best-slots', cities:cities, top_score:top[0]?.score});}
document.getElementById('run').addEventListener('click',render); render();`;
  fs.writeFileSync(path.join(toolsDir, slug + '.html'), pageShell({ slug, title: 'Remote Team Meeting Planner', description: 'Find the best meeting slots for remote teams across multiple cities by comparing reasonable work-hour overlap.', body, js, related: ['best-world-meeting-time-finder','time-zone-meeting-planner-by-cities','work-hours-overlap-calculator','us-europe-asia-time-overlap-tool'] }));
}

function countryOverlapPage() {
  const slug = 'work-hours-overlap-by-country';
  const body = `    <div class="card"><div class="row two"><div><label for="a">Country or region A</label><select id="a"><option value="United States|America/New_York">United States Eastern</option><option value="United States Pacific|America/Los_Angeles">United States Pacific</option><option value="United Kingdom|Europe/London">United Kingdom</option><option value="Germany|Europe/Berlin">Germany</option><option value="Japan|Asia/Tokyo">Japan</option><option value="Singapore|Asia/Singapore">Singapore</option><option value="Australia Eastern|Australia/Sydney">Australia Eastern</option></select></div><div><label for="b">Country or region B</label><select id="b"><option value="Japan|Asia/Tokyo">Japan</option><option value="United States Eastern|America/New_York">United States Eastern</option><option value="United Kingdom|Europe/London">United Kingdom</option><option value="Germany|Europe/Berlin">Germany</option><option value="Singapore|Asia/Singapore">Singapore</option><option value="Australia Eastern|Australia/Sydney">Australia Eastern</option></select></div><div><label for="date">Date</label><input id="date" type="date" /></div></div><button id="run" data-track="${slug}-calculate-overlap">Calculate overlap</button><div id="result" class="result"></div></div>`;
  const js = `${timeJs}
const a=document.getElementById('a'),b=document.getElementById('b'),date=document.getElementById('date'),result=document.getElementById('result'); date.value=todayISO();
function split(v){const [name,zone]=v.split('|'); return {name,zone};}
function render(){const A=split(a.value),B=split(b.value); const slots=[]; for(let h=0;h<24;h++){const utc=zonedDateTimeToUtc(date.value,String(h).padStart(2,'0')+':00','UTC'); const ah=hourInZone(utc,A.zone), bh=hourInZone(utc,B.zone); if(ah>=9&&ah<17&&bh>=9&&bh<17) slots.push([formatInZone(utc,A.zone),formatInZone(utc,B.zone)]);} result.innerHTML=slots.length?'<p><strong>'+slots.length+' overlapping UTC-hour slots found.</strong></p><table><thead><tr><th>'+A.name+'</th><th>'+B.name+'</th></tr></thead><tbody>'+slots.map(s=>'<tr><td>'+s[0]+'</td><td>'+s[1]+'</td></tr>').join('')+'</tbody></table>':'<p>No strict 9:00-17:00 overlap found. Try early/evening flexibility or another date.</p>'; if(window.opTrack) window.opTrack('tool_run',{id:'${slug}-calculate-overlap', a:A.name, b:B.name, slots:slots.length});}
document.getElementById('run').addEventListener('click',render); render();`;
  fs.writeFileSync(path.join(toolsDir, slug + '.html'), pageShell({ slug, title: 'Work Hours Overlap by Country', description: 'Find overlapping 9-to-5 work hours between country or region time zones for remote meetings and global teams.', body, js, related: ['work-hours-overlap-calculator','remote-team-meeting-planner','best-world-meeting-time-finder','utc-to-local-time-converter'] }));
}

function updateBestWorldMeeting() {
  const slug = 'best-world-meeting-time-finder';
  const description = 'Find the best meeting time across Tokyo, New York, London, Europe, Singapore, and Sydney with fit scores, local times, and related time-zone tools.';
  const body = `    <div class="card">
      <div class="row two"><div><label for="date">Meeting date</label><input id="date" type="date" /></div><div><label for="cities">Cities to compare</label><select id="cities" multiple size="8"><option selected>Tokyo</option><option selected>New York</option><option selected>London</option><option>Berlin</option><option>Singapore</option><option>Sydney</option><option>Los Angeles</option><option>Dubai</option></select></div></div>
      <button id="run" data-track="${slug}-find-best-times">Find best meeting times</button>
      <div id="answer" class="result"></div>
    </div>
    <div class="card small"><h2>Quick answer</h2><p class="muted">The best world meeting time is usually the highest-scoring slot where most cities land in normal work hours, early morning, or early evening. This page ranks candidate hours automatically so you can choose a practical time before sending a calendar invite.</p></div>
    <div class="card small"><h2>Popular meeting time searches</h2><ul><li>Best time for a Tokyo and New York meeting</li><li>Best time for London and New York calls</li><li>Best time for US, Europe, and Asia remote teams</li><li>Work-hour overlap across global cities</li></ul></div>
    <div class="card small"><h2>FAQ</h2><h3>What counts as a good meeting time?</h3><p class="muted">Normal work hours score highest. Early morning and evening slots are marked as possible but less ideal.</p><h3>Does this handle daylight saving time?</h3><p class="muted">Yes. Local times use the browser time zone database for the selected date.</p><h3>Should I still confirm in my calendar?</h3><p class="muted">Yes. Use this as a fast planning layer, then confirm the final invite in your calendar app.</p></div>`;
  const js = `${timeJs}
const select=document.getElementById('cities'), date=document.getElementById('date'), answer=document.getElementById('answer'); date.value=todayISO();
function selected(){return Array.from(select.selectedOptions).map(o=>o.value)}
function render(){const cities=selected(); const candidates=[]; for(let h=0;h<24;h++){const utc=zonedDateTimeToUtc(date.value,String(h).padStart(2,'0')+':00','UTC'); const details=cities.map(c=>{const hour=hourInZone(utc,zoneMap[c]); return {city:c,time:formatInZone(utc,zoneMap[c]),fit:labelHour(hour),score:scoreHour(hour)}}); candidates.push({score:details.reduce((s,d)=>s+d.score,0),details});} candidates.sort((a,b)=>b.score-a.score); const top=candidates.slice(0,6); answer.innerHTML='<p><strong>Best candidate:</strong> score '+top[0].score+' / '+(cities.length*3)+'</p>'+top.map((c,i)=>'<h3>#'+(i+1)+' — score '+c.score+'</h3><table><thead><tr><th>City</th><th>Local time</th><th>Fit</th></tr></thead><tbody>'+c.details.map(d=>'<tr><td>'+d.city+'</td><td>'+d.time+'</td><td>'+d.fit+'</td></tr>').join('')+'</tbody></table>').join(''); if(window.opTrack) window.opTrack('tool_run',{id:'${slug}-find-best-times', cities:cities, top_score:top[0]?.score});}
document.getElementById('run').addEventListener('click', render); render();`;
  fs.writeFileSync(path.join(toolsDir, slug + '.html'), pageShell({ slug, title: 'Best World Meeting Time Finder', description, body, js, related: ['remote-team-meeting-planner','tokyo-new-york-meeting-time','london-new-york-meeting-time','pst-est-cet-time-converter','work-hours-overlap-by-country','us-europe-asia-time-overlap-tool'] }));
}

function updateAiPricing() {
  const slug = 'ai-tools-pricing-comparison-table';
  const rows = [
    ['ChatGPT', 'Yes', 'Plus about $20/mo; Team plan available', 'General chat, writing, coding, image/audio workflows', 'https://chatgpt.com/'],
    ['Claude', 'Yes', 'Pro about $20/mo; Team plan available', 'Long documents, reasoning, writing, coding assistance', 'https://claude.ai/'],
    ['Gemini', 'Yes', 'Varies by Google AI plan', 'Google ecosystem, multimodal search, workspace workflows', 'https://gemini.google.com/'],
    ['Perplexity', 'Yes', 'Pro about $20/mo', 'Research and cited answer workflows', 'https://www.perplexity.ai/'],
    ['Midjourney', 'No regular free plan', 'Basic about $10/mo', 'Image generation and visual ideation', 'https://www.midjourney.com/'],
    ['Cursor', 'Limited/free tier varies', 'Pro about $20/mo', 'AI coding inside an editor', 'https://cursor.com/'],
    ['Windsurf', 'Free/limited tier varies', 'Pro plan varies', 'AI coding agent and editor workflows', 'https://windsurf.com/'],
    ['GitHub Copilot', 'Limited free eligibility; paid plans', 'Individual about $10/mo; Business about $19/user/mo', 'Code completion and GitHub-native coding assistance', 'https://github.com/features/copilot'],
    ['ChatGPT Team', 'No', 'Team pricing varies by billing term', 'Small teams needing shared workspace and admin controls', 'https://openai.com/chatgpt/pricing/'],
    ['Claude Team', 'No', 'Team pricing varies by billing term', 'Teams using Claude for docs, analysis, and coding', 'https://www.anthropic.com/pricing']
  ];
  const body = `    <div class="card small"><p><strong>Last updated:</strong> ${today}. Prices change often, so use this as a fast shortlist and confirm on official pricing pages before buying.</p></div>
    <div class="card table-wrap"><table><thead><tr><th>Tool</th><th>Free plan</th><th>Paid entry</th><th>Best for</th><th>Official site</th></tr></thead><tbody>${rows.map(([tool, free, paid, best, url]) => `<tr><td>${esc(tool)}</td><td>${esc(free)}</td><td>${esc(paid)}</td><td>${esc(best)}</td><td><a data-track="ai-pricing-external-${tool.toLowerCase().replace(/[^a-z0-9]+/g,'-')}" href="${url}" target="_blank" rel="noopener">Open</a></td></tr>`).join('')}</tbody></table></div>
    <div class="card small"><h2>How to compare quickly</h2><p class="muted">Start with your main workflow: writing, research, coding, image generation, or team administration. Then compare free limits, entry price, team controls, and whether the tool fits your existing workspace.</p></div>
    <div class="card small"><h2>FAQ</h2><h3>Are these prices exact?</h3><p class="muted">No. This is a fast comparison table. Official pricing pages are the final source.</p><h3>Why include coding tools?</h3><p class="muted">Cursor, Windsurf, and GitHub Copilot are common subscription decisions for people comparing AI tools.</p><h3>What should teams check first?</h3><p class="muted">Check admin controls, data settings, seat minimums, billing terms, and whether team features differ from personal plans.</p></div>`;
  fs.writeFileSync(path.join(toolsDir, slug + '.html'), pageShell({ slug, title: 'AI Tools Pricing Comparison Table', description: 'Compare pricing and use cases for ChatGPT, Claude, Gemini, Perplexity, Midjourney, Cursor, Windsurf, GitHub Copilot, and team AI plans.', badge: 'Marketing Tools', body, related: ['utm-url-builder','meta-title-description-preview','open-graph-preview-checker','best-world-meeting-time-finder'] }));
}

function readToolMeta() {
  return fs.readdirSync(toolsDir).filter(f => f.endsWith('.html')).sort().map(file => {
    const html = fs.readFileSync(path.join(toolsDir, file), 'utf8');
    const h1 = (html.match(/<h1>(.*?)<\/h1>/s) || [])[1]?.replace(/<[^>]+>/g, '').replace(/^Free /, '').trim() || titleFromSlug(file.replace('.html',''));
    const desc = (html.match(/<meta name="description" content="([^"]+)"/) || [])[1] || '';
    const badge = (html.match(/<span class="badge">(.*?)<\/span>/) || [])[1] || (file.includes('pricing') ? 'Marketing Tools' : 'Time Tools');
    return { slug: file.replace('.html',''), file, name: h1, desc, cat: badge };
  });
}
function slugTrack(s){return s.toLowerCase().replace(/&amp;/g,'and').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')}
function rebuildHub() {
  const meta = readToolMeta();
  const cats = [...new Set(meta.map(t => t.cat))].sort();
  const catLinks = cats.map(c => `<a data-track="home-category-${slugTrack(c)}" href="./${slugTrack(c)}/">${esc(c)}</a>`).join(' · ');
  const sections = cats.map(cat => `    <section class="card small"><h2>${esc(cat)}</h2><ul class="tool-list">\n${meta.filter(t=>t.cat===cat).map(t => `      <li><h3><a data-track="hub-tool-${t.slug}" href="./tools/${t.slug}">${esc(t.name)}</a></h3><p class="muted">${esc(t.desc)}</p></li>`).join('\n')}\n      </ul></section>`).join('\n');
  const index = `<!doctype html><html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><title>Useful One-Page Tools Hub | ${meta.length} Fast Browser Tools</title><meta name="description" content="Browse ${meta.length} free one-page tools for time, calculators, text cleanup, developer utilities, marketing links, AI comparisons, and web checks."/><link rel="canonical" href="${base}/"/>${adScript()}<link rel="stylesheet" href="./assets/styles.css"/></head><body><div class="wrap"><div class="hero"><span class="badge">Hub for one-page tools</span><h1>Useful one-page tools</h1><p class="muted">Small single-purpose tools built to solve one practical task quickly, without login, setup, or unnecessary screens.</p></div><div class="card small"><h2>100-tool roadmap</h2><p class="muted">This hub is being built as one strong domain with many focused internal tools. Current count: ${meta.length} internal tools.</p></div><div class="card small"><h2>Browse by category</h2><p>${catLinks}</p></div>\n${sections}\n</div><script src="./assets/analytics.js" defer></script></body></html>\n`;
  fs.writeFileSync(path.join(root, 'index.html'), index);
  for (const cat of cats) {
    const dir = path.join(root, slugTrack(cat)); fs.mkdirSync(dir, { recursive: true });
    const list = meta.filter(t => t.cat === cat);
    fs.writeFileSync(path.join(dir, 'index.html'), `<!doctype html><html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><title>${esc(cat)} | Useful One-Page Tools</title><meta name="description" content="Free ${esc(cat.toLowerCase())} you can use in one page without login."/><link rel="canonical" href="${base}/${slugTrack(cat)}/"/><link rel="stylesheet" href="../assets/styles.css"/></head><body><div class="wrap"><div class="nav"><a href="../index.html">← All tools</a></div><div class="hero"><span class="badge">${esc(cat)}</span><h1>${esc(cat)}</h1><p class="muted">Free browser-based ${esc(cat.toLowerCase())} for quick practical tasks.</p></div><div class="card small"><ul class="tool-list">${list.map(t=>`<li><h3><a data-track="category-${slugTrack(cat)}-${t.slug}" href="../tools/${t.slug}">${esc(t.name)}</a></h3><p class="muted">${esc(t.desc)}</p></li>`).join('')}</ul></div></div><script src="../assets/analytics.js" defer></script></body></html>\n`);
  }
  const urls = [`${base}/`, ...cats.map(c => `${base}/${slugTrack(c)}/`), ...meta.map(t => `${base}/tools/${t.slug}`)];
  fs.writeFileSync(path.join(root, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u => `  <url><loc>${u}</loc><lastmod>${today}</lastmod></url>`).join('\n')}\n</urlset>\n`);
  fs.writeFileSync(path.join(root, 'README.md'), `# Useful One-Page Tools\n\nA static hub for small, single-purpose browser tools under one domain: \`usefulonepagetools.com\`.\n\n## Current count\n\n${meta.length} internal tools.\n\n## Recent focus\n\n- Strengthened world meeting/time-zone tools based on early analytics.\n- Added more time-zone long-tail pages.\n- Updated AI pricing comparison.\n- Improved first-party analytics events and reports.\n\n## Local preview\n\n\`\`\`bash\npython3 -m http.server 4190\n\`\`\`\n`);
  return meta.length;
}

updateBestWorldMeeting();
meetingPairPage({ slug: 'tokyo-new-york-meeting-time', title: 'Tokyo New York Meeting Time', description: 'Compare Tokyo and New York local times for meetings, including daylight saving time and quick fit labels.', cityA: 'Tokyo', cityB: 'New York', extraCities: ['London'] });
meetingPairPage({ slug: 'london-new-york-meeting-time', title: 'London New York Meeting Time', description: 'Find practical meeting times between London and New York with local time conversion and work-hour fit labels.', cityA: 'London', cityB: 'New York', extraCities: ['Tokyo'] });
converterPage();
remoteTeamPage();
countryOverlapPage();
updateAiPricing();
const count = rebuildHub();
console.log(JSON.stringify({ ok: true, totalTools: count, added: 5, updated: ['best-world-meeting-time-finder','ai-tools-pricing-comparison-table'] }, null, 2));
