/* ReSpark agent test drives: shared shell.
 *
 * Usage (in each test drive page):
 *   <header class="demo-bar" id="demoBar"></header>
 *   const shell = DemoShell.create({ agent: 'dispatcher', agentName: 'Dispatch Agent',
 *     sample: '<b>Everything here is fictional.</b> …', onReset: () => { … } });
 *   shell.track('draft_approved', { … }); shell.toast('…'); shell.icon('check', 's16');
 *
 * Query params: ?embed=1 (inside an iframe), ?bg=dark (embedded on a dark host section: light top-bar
 *   text and the white ReSpark mark), ?theme=dark|light|auto, ?debug=1 (console + window.__demo),
 * ?motion=off (skip animations, for screenshots/tests).
 * Analytics: every event is { event: 'demo_<name>', demo_agent, demo_session, demo_embedded, ... }.
 * It is pushed to window.dataLayer when present and posted to the parent window when embedded;
 * the host page forwards it to GTM (see try-sparky/embed-example.html). Never includes visitor input.
 */
(function () {
  'use strict';
  var params = new URLSearchParams(location.search);
  var EMBED = params.get('embed') === '1';
  var DEBUG = params.get('debug') === '1';
  var REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches || params.get('motion') === 'off';
  var theme = params.get('theme');
  document.documentElement.dataset.theme = theme === 'dark' ? 'dark'
    : theme === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  if (EMBED) document.documentElement.classList.add('embed');
  var ON_DARK = params.get('bg') === 'dark';
  if (ON_DARK) document.documentElement.classList.add('on-dark');

  var SHELL_BASE = (document.currentScript && document.currentScript.src) ? document.currentScript.src.replace(/[^/]*$/, '') : '../demo-shell/';

  var ICONS = {
    trendDown: '<polyline points="3 7 9 13 13 9 21 17"/><polyline points="15 17 21 17 21 11"/>',
    trendUp: '<polyline points="3 17 9 11 13 15 21 7"/><polyline points="15 7 21 7 21 13"/>',
    briefcase: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/><path d="M3 13h18"/>',
    pie: '<path d="M12 3a9 9 0 1 0 9 9h-9z"/><path d="M15 3.5A9 9 0 0 1 20.5 9H15z"/>',
    heart: '<path d="M20.8 5.6a5 5 0 0 0-7.1 0L12 7.3l-1.7-1.7a5 5 0 0 0-7.1 7.1L12 21.5l8.8-8.8a5 5 0 0 0 0-7.1z"/><path d="M7 12h3l1.5-2.5 2 5 1.5-2.5h2"/>',
    bank: '<path d="M3 9.5 12 4l9 5.5z"/><path d="M5 10v7M9.5 10v7M14.5 10v7M19 10v7"/><path d="M3 20h18"/>',
    swap: '<path d="M4 8h15"/><path d="M15 4l4 4-4 4"/><path d="M20 16H5"/><path d="M9 12l-4 4 4 4"/>',
    receipt: '<path d="M6 2.5h12v19l-3-2-3 2-3-2-3 2z"/><path d="M9 7.5h6M9 11.5h6M9 15.5h4"/>',
    truck: '<path d="M1.5 5.5h12.5v11H1.5z"/><path d="M14 9.5h4l3 3v4h-7z"/><circle cx="6" cy="18" r="2"/><circle cx="17.5" cy="18" r="2"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
    history: '<path d="M3.5 12a8.5 8.5 0 1 0 2.5-6L3.5 8.5"/><path d="M3.5 3.5v5h5"/><path d="M12 7.5V12l3 2"/>',
    dollar: '<path d="M12 2v20"/><path d="M17 6H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
    cart: '<circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M2 3h3l2.7 12.4a2 2 0 0 0 2 1.6h8.6a2 2 0 0 0 2-1.6L22 7H6"/>',
    chevR: '<path d="M9 6l6 6-6 6"/>',
    chevL: '<path d="M15 6l-6 6 6 6"/>',
    chevD: '<path d="M6 9l6 6 6-6"/>',
    chevU: '<path d="M18 15l-6-6-6 6"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    checkCircle: '<circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/>',
    download: '<path d="M12 3v12M7 10l5 5 5-5M5 21h14"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 7.5h.01"/>',
    refresh: '<path d="M21 12a9 9 0 1 1-2.6-6.4L21 8"/><path d="M21 3v5h-5"/>',
    sync: '<path d="M20 11a8 8 0 0 0-14.3-4.9L4 8"/><path d="M4 3v5h5"/><path d="M4 13a8 8 0 0 0 14.3 4.9L20 16"/><path d="M20 21v-5h-5"/>',
    bulb: '<path d="M9 18h6"/><path d="M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2V16h5v-.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z"/>',
    reply: '<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>',
    warn: '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
    inbox: '<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.5 5.1 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.5-6.9A2 2 0 0 0 16.8 4H7.2a2 2 0 0 0-1.7 1.1z"/>',
    sparkle: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 3v3M17.5 4.5h3"/>',
    bot: '<rect x="4" y="8" width="16" height="12" rx="2"/><path d="M12 4v4M9 13v2M15 13v2"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
    undo: '<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>',
  };
  function icon(name, cls) { return '<svg class="i ' + (cls || '') + '" viewBox="0 0 24 24" aria-hidden="true">' + (ICONS[name] || '') + '</svg>'; }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  function create(opts) {
    var agent = opts.agent;
    var session = Math.random().toString(36).slice(2, 10);
    window.__demoEvents = [];
    var currentContext = {};
    function track(name, props) {
      var payload = Object.assign({ event: 'demo_' + name, demo_agent: agent, demo_session: session, demo_embedded: EMBED }, currentContext, props || {});
      window.__demoEvents.push(payload);
      try { if (Array.isArray(window.dataLayer)) window.dataLayer.push(payload); } catch (e) {}
      try { if (window.parent && window.parent !== window) window.parent.postMessage(Object.assign({ source: 'respark-demo' }, payload), '*'); } catch (e) {}
      if (DEBUG) console.debug('[demo]', payload);
    }

    var toastEl = document.createElement('div');
    toastEl.className = 'toast' + (opts.toastTop ? ' top' : '');
    toastEl.setAttribute('role', 'status'); toastEl.setAttribute('aria-live', 'polite');
    document.body.appendChild(toastEl);
    var toastTimer;
    function toast(msg) {
      toastEl.textContent = msg; toastEl.classList.add('show');
      clearTimeout(toastTimer); toastTimer = setTimeout(function () { toastEl.classList.remove('show'); }, 4200);
    }

    // Top bar: brand, sample-data badge, reset, CTA
    var bar = document.getElementById('demoBar');
    bar.innerHTML =
      '<div class="demo-brand"><img src="' + SHELL_BASE + (ON_DARK ? 'respark-mark-white.svg' : 'respark-mark.png') + '" alt="" width="28" height="28">' +
      '<div class="t">' + esc(opts.agentName) + ' <span>test drive</span></div>' +
      '<div class="badge-wrap"><button type="button" class="badge" id="badgeBtn" aria-expanded="false" aria-controls="badgePop"><span class="dot" aria-hidden="true"></span>Sample data</button>' +
      '<div class="pop" id="badgePop" hidden>' + opts.sample + '</div></div></div>' +
      '<div class="demo-actions"><button type="button" class="btn" id="resetBtn" aria-label="Reset demo">' + icon('refresh', 's16') + '<span class="reset-lbl">Reset demo</span></button>' +
      '<a class="btn cta" id="ctaBtn" href="' + (opts.ctaHref || 'https://respark.com/demo') + '" target="_top" rel="noopener">Get a demo</a></div>';
    var badgeBtn = document.getElementById('badgeBtn'), pop = document.getElementById('badgePop');
    function closePop() { pop.hidden = true; badgeBtn.setAttribute('aria-expanded', 'false'); }
    badgeBtn.addEventListener('click', function () { var open = pop.hidden; pop.hidden = !open; badgeBtn.setAttribute('aria-expanded', open); });
    document.addEventListener('click', function (e) { if (!e.target.closest('.badge-wrap')) closePop(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !pop.hidden) { closePop(); badgeBtn.focus(); } });
    document.getElementById('ctaBtn').addEventListener('click', function () { track('cta_clicked', { location: 'top_bar' }); });
    document.getElementById('resetBtn').addEventListener('click', function () {
      if (opts.onReset) opts.onReset();
      track('reset');
      toast(opts.resetMessage || 'Demo reset. Start again whenever you like.');
    });

    function sleep(ms) { return REDUCED ? Promise.resolve() : new Promise(function (r) { setTimeout(r, ms); }); }
    var referrer = ''; try { referrer = document.referrer ? new URL(document.referrer).host : ''; } catch (e) {}
    setTimeout(function () { track('opened', { referrer_host: referrer }); }, 0);

    return {
      track: track, toast: toast, icon: icon, esc: esc, sleep: sleep, params: params,
      EMBED: EMBED, DEBUG: DEBUG, REDUCED: REDUCED,
      setContext: function (ctx) { currentContext = ctx || {}; },
      callout: function (html) { return '<div class="callout">' + icon('info', 's18') + '<div><span class="lbl">Test drive</span>' + html + '</div></div>'; },
    };
  }

  window.DemoShell = { create: create, icon: icon, esc: esc };
  /* Embedded: ask the host page for a taller frame whenever the demo's panels
     would otherwise have to scroll, so a visitor sees everything without
     scrolling inside the iframe. The demo fills 100dvh and its panels scroll,
     so "needed" = current viewport + the largest overflow of any scroll panel.
     Posts { source: 'respark-demo', type: 'resize', height }; respark.com grows
     the iframe (grow-only, capped) and never forwards this to analytics. */
  if (EMBED && window.parent && window.parent !== window) {
    var lastAsked = 0;
    var pending = false;
    var measure = function () {
      pending = false;
      var over = document.documentElement.scrollHeight - innerHeight;
      var els = document.querySelectorAll('*');
      for (var i = 0; i < els.length; i++) {
        var el = els[i];
        if (!el.clientHeight) continue;
        var cs = getComputedStyle(el);
        if (!/(auto|scroll)/.test(cs.overflowY + cs.overflow)) continue;
        over = Math.max(over, el.scrollHeight - el.clientHeight);
      }
      if (over <= 1) return;
      var needed = Math.ceil(innerHeight + over);
      if (needed <= lastAsked) return;
      lastAsked = needed;
      try { window.parent.postMessage({ source: 'respark-demo', type: 'resize', height: needed }, '*'); } catch (e) {}
    };
    var schedule = function () { if (!pending) { pending = true; requestAnimationFrame(measure); } };
    new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true });
    addEventListener('resize', schedule);
    addEventListener('load', schedule);
    schedule();
  }
})();
