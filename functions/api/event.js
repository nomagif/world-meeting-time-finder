function json(body, status = 200) {
  return new Response(JSON.stringify(body) + '\n', {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'POST,OPTIONS',
      'access-control-allow-headers': 'content-type'
    }
  });
}

function tokyoDay(value = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(value);
}

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === 'OPTIONS') return json({ ok: true });
  if (request.method !== 'POST') return json({ ok: false, error: 'method not allowed' }, 405);

  const payload = await request.json().catch(() => ({}));
  const event = String(payload.event || '').slice(0, 80);
  if (!event) return json({ ok: false, error: 'event is required' }, 400);

  const now = new Date();
  const record = {
    type: 'one_page_tools_event',
    event,
    detail: payload.detail || {},
    page: String(payload.page || '').slice(0, 180),
    title: String(payload.title || '').slice(0, 180),
    referrer: payload.referrer ? String(payload.referrer).slice(0, 300) : null,
    client_id: payload.client_id ? String(payload.client_id).slice(0, 80) : null,
    ts: payload.ts ? String(payload.ts).slice(0, 40) : null,
    received_at: now.toISOString(),
    user_agent: request.headers.get('user-agent') || null,
    cf_country: request.cf?.country || null
  };

  const bucket = env.ONE_PAGE_TOOLS_ANALYTICS_BUCKET || env.ANALYTICS_BUCKET;
  if (bucket) {
    const key = `analytics/events/${tokyoDay(now)}/${Date.now()}-${crypto.randomUUID()}.json`;
    await bucket.put(key, JSON.stringify(record));
    return json({ ok: true, stored: true });
  }

  console.log(JSON.stringify(record));
  return json({ ok: true, stored: false });
}
