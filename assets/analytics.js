(function () {
  const endpoint = window.OP_ANALYTICS_ENDPOINT || '/api/event';
  const storageKey = 'op_tools_client_id';

  function clientId() {
    try {
      let id = localStorage.getItem(storageKey);
      if (!id) {
        id = (crypto && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now()) + '-' + Math.random().toString(16).slice(2);
        localStorage.setItem(storageKey, id);
      }
      return id;
    } catch (_) {
      return null;
    }
  }

  function send(event, detail) {
    const payload = JSON.stringify({
      event,
      detail: detail || {},
      page: location.pathname,
      title: document.title,
      referrer: document.referrer || null,
      client_id: clientId(),
      ts: new Date().toISOString()
    });

    if (navigator.sendBeacon) {
      const ok = navigator.sendBeacon(endpoint, new Blob([payload], { type: 'application/json' }));
      if (ok) return;
    }

    fetch(endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: payload,
      keepalive: true
    }).catch(function () {});
  }

  window.opTrack = send;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { send('page_view'); }, { once: true });
  } else {
    send('page_view');
  }

  document.addEventListener('click', function (event) {
    const target = event.target.closest('[data-track]');
    if (!target) return;
    send('click', {
      id: target.getAttribute('data-track'),
      text: (target.textContent || '').trim().slice(0, 120),
      href: target.href || null
    });
  });
})();
