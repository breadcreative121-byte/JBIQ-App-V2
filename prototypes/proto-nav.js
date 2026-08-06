/* proto-nav.js — shared side navigation for the JBIQ home-exploration prototypes.
   Drop-in: add `<script defer src="proto-nav.js"></script>` to any page in this
   folder. Self-contained (own styles, own JioType inheritance from the host body),
   so it works when served over http and when opened via file://.
   Matches the components-overview.html `.toc` rail: 280px fixed left rail on
   desktop, slide-over drawer with a burger under 720px. The current page is
   expanded into its own sections with a scroll-spy highlight; the others are
   single links that navigate across pages. */
(function () {
  var PAGES = [
    { file: 'home-spaces-v1.html', label: 'Home + Spaces', eyebrow: 'Prototype', sub: [
      ['states', 'Four Home states'],
      ['spaces', 'Spaces navigation']
    ]},
    { file: 'pending-tasks-compare-v1.html', label: 'Pending tasks · 1 vs many', eyebrow: 'Study', sub: [
      ['pt-carousel', '1 · Carousel'],
      ['pt-urgent', '2 · Most-urgent + N more'],
      ['pt-summary', '3 · Count summary'],
      ['pt-grouped', '4 · Grouped'],
      ['pt-research', 'Research']
    ]},
    { file: 'moment-led-compare-v1.html', label: 'Moment-led · 1 vs many', eyebrow: 'Study', sub: [
      ['ml-hero', '1 · Single hero'],
      ['ml-also', '2 · Hero + also happening'],
      ['ml-rail', '3 · Happening-now rail'],
      ['ml-strip', '4 · Live-count strip'],
      ['ml-research', 'Research']
    ]}
  ];

  var current = (location.pathname.split('/').pop() || '').toLowerCase();
  // file:// with no filename, or an unknown page → default to the first entry
  if (!PAGES.some(function (p) { return p.file === current; })) current = PAGES[0].file;

  var chevron = "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'><path d='M4 6l4 4 4-4' stroke='black' stroke-width='1.6' fill='none' stroke-linecap='round' stroke-linejoin='round'/></svg>\")";

  var css = ''
    + '.pnav-vars{--pn-primary:#6d17ce;--pn-primary-sf:#ede7ff;--pn-ink:#0c0d10;'
    +   '--pn-ink-65:rgba(12,13,16,.65);--pn-ink-45:rgba(12,13,16,.45);'
    +   '--pn-surface:#fff;--pn-surface-2:#f4f2f8;--pn-line:rgba(12,13,16,.09);'
    +   '--pn-pill:999px;--pn-w:280px;}'
    + 'body{padding-left:var(--pn-w)}'
    + '.pnav{position:fixed;top:0;left:0;bottom:0;width:var(--pn-w);background:var(--pn-surface);'
    +   'border-right:.5px solid var(--pn-line);padding:22px 12px;display:flex;flex-direction:column;'
    +   'gap:2px;z-index:1000;overflow-y:auto;scrollbar-width:none;font-family:inherit;color:var(--pn-ink);'
    +   'box-sizing:border-box}'
    + '.pnav::-webkit-scrollbar{display:none}'
    + '.pnav *{box-sizing:border-box}'
    + '.pnav-brand{display:flex;align-items:center;gap:10px;padding:6px 10px 2px}'
    + '.pnav-brand__home{display:flex;align-items:center;gap:10px;text-decoration:none;color:inherit;flex:1;min-width:0}'
    + '.pnav-brand__mark{width:28px;height:28px;flex:0 0 auto;display:flex;align-items:center;justify-content:center;'
    +   'border-radius:8px;background:var(--pn-primary);color:#fff;font-weight:800;font-size:13px}'
    + '.pnav-brand__name{font-size:16px;font-weight:800;letter-spacing:-.01em}'
    + '.pnav-eyebrow{font-size:10px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;'
    +   'color:var(--pn-ink-45);padding:14px 12px 6px}'
    + '.pnav-item{display:flex;align-items:center;gap:10px;padding:10px 12px;font-size:14px;font-weight:600;'
    +   'color:var(--pn-ink-65);text-decoration:none;border-radius:var(--pn-pill);transition:background .14s,color .14s;'
    +   'cursor:pointer;border:0;background:transparent;font-family:inherit;width:100%;text-align:left}'
    + '.pnav-item:hover{background:var(--pn-surface-2);color:var(--pn-ink)}'
    + '.pnav-item.is-active{background:var(--pn-primary-sf);color:var(--pn-primary);font-weight:800}'
    + '.pnav-group{width:100%}'
    + '.pnav-group>summary{list-style:none;cursor:pointer}'
    + '.pnav-group>summary::-webkit-details-marker{display:none}'
    + '.pnav-group[open]>summary.pnav-item{color:var(--pn-ink)}'
    + '.pnav-chev{margin-left:auto;width:16px;height:16px;background:currentColor;'
    +   '-webkit-mask:' + chevron + ' no-repeat center;mask:' + chevron + ' no-repeat center;'
    +   'transition:transform .18s ease}'
    + '.pnav-group[open]>summary .pnav-chev{transform:rotate(180deg)}'
    + '.pnav-sub{display:flex;flex-direction:column;padding-left:18px;margin:2px 0 6px}'
    + '.pnav-sub a{display:flex;align-items:center;padding:8px 12px;font-size:12.5px;font-weight:600;'
    +   'color:var(--pn-ink-65);text-decoration:none;border-radius:var(--pn-pill);transition:background .14s,color .14s}'
    + '.pnav-sub a:hover{background:var(--pn-surface-2);color:var(--pn-ink)}'
    + '.pnav-sub a.is-active{background:var(--pn-primary-sf);color:var(--pn-primary);font-weight:800}'
    + '.pnav-foot{margin-top:auto;padding:14px 12px 4px;font-size:11px;color:var(--pn-ink-45);line-height:1.5}'
    + '.pnav-burger{position:fixed;top:12px;left:12px;z-index:1002;display:none;align-items:center;justify-content:center;'
    +   'width:42px;height:42px;border-radius:12px;border:1px solid var(--pn-line);background:var(--pn-surface);'
    +   'color:var(--pn-ink);cursor:pointer;box-shadow:0 6px 18px rgba(12,13,16,.12)}'
    + '.pnav-burger svg{width:20px;height:20px}'
    + '.pnav-close{display:none;margin-left:auto;width:32px;height:32px;border:0;background:transparent;'
    +   'font-size:22px;line-height:1;color:var(--pn-ink-65);cursor:pointer;border-radius:8px}'
    + '.pnav-close:hover{background:var(--pn-surface-2)}'
    + '.pnav-backdrop{position:fixed;inset:0;background:rgba(12,13,16,.4);z-index:999;opacity:0;pointer-events:none;'
    +   'transition:opacity .24s ease}'
    + '.pnav-backdrop.is-open{opacity:1;pointer-events:auto}'
    + '@media (max-width:720px){'
    +   'body{padding-left:0}'
    +   '.pnav-burger{display:flex}'
    +   '.pnav{transform:translateX(-100%);transition:transform .24s ease;z-index:1001}'
    +   '.pnav.is-open{transform:translateX(0)}'
    +   '.pnav-close{display:flex}'
    + '}'
    + '@media (prefers-reduced-motion:reduce){.pnav,.pnav-chev,.pnav-backdrop{transition:none!important}}';

  var style = document.createElement('style');
  style.setAttribute('data-proto-nav', '');
  style.textContent = css;
  document.head.appendChild(style);
  document.documentElement.classList.add('pnav-vars');

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  // Build the rail
  var aside = document.createElement('aside');
  aside.className = 'pnav';
  aside.setAttribute('role', 'navigation');
  aside.setAttribute('aria-label', 'JBIQ home explorations');

  var html = ''
    + '<div class="pnav-brand">'
    +   '<a class="pnav-brand__home" href="' + PAGES[0].file + '">'
    +     '<span class="pnav-brand__mark">Jio</span>'
    +     '<span class="pnav-brand__name">JBIQ</span>'
    +   '</a>'
    +   '<button class="pnav-close" aria-label="Close navigation">&times;</button>'
    + '</div>'
    + '<div class="pnav-eyebrow">Home explorations</div>';

  PAGES.forEach(function (p) {
    var active = p.file === current;
    if (active) {
      html += '<details class="pnav-group" open>'
        + '<summary class="pnav-item is-active">' + esc(p.label) + '<span class="pnav-chev"></span></summary>'
        + '<div class="pnav-sub">'
        + p.sub.map(function (s) { return '<a href="#' + s[0] + '" data-spy="' + s[0] + '">' + esc(s[1]) + '</a>'; }).join('')
        + '</div></details>';
    } else {
      html += '<a class="pnav-item" href="' + p.file + '">' + esc(p.label) + '</a>';
    }
  });

  html += '<div class="pnav-foot">JBIQ · AI Saathi<br>Scratch explorations · mock data</div>';
  aside.innerHTML = html;

  var burger = document.createElement('button');
  burger.className = 'pnav-burger';
  burger.setAttribute('aria-label', 'Open navigation');
  burger.setAttribute('aria-controls', 'pnav');
  burger.setAttribute('aria-expanded', 'false');
  burger.innerHTML = "<svg viewBox='0 0 20 20' fill='none' aria-hidden='true'><path d='M3 5h14M3 10h14M3 15h14' stroke='currentColor' stroke-width='2' stroke-linecap='round'/></svg>";

  var backdrop = document.createElement('div');
  backdrop.className = 'pnav-backdrop';

  aside.id = 'pnav';
  document.body.appendChild(burger);
  document.body.appendChild(backdrop);
  document.body.appendChild(aside);

  // Drawer behaviour (mobile)
  function open() { aside.classList.add('is-open'); backdrop.classList.add('is-open'); burger.setAttribute('aria-expanded', 'true'); }
  function close() { aside.classList.remove('is-open'); backdrop.classList.remove('is-open'); burger.setAttribute('aria-expanded', 'false'); }
  burger.addEventListener('click', open);
  backdrop.addEventListener('click', close);
  aside.querySelector('.pnav-close').addEventListener('click', close);
  aside.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', close); });

  // Scroll-spy for the active page's sections
  var subLinks = aside.querySelectorAll('.pnav-sub a[data-spy]');
  if (subLinks.length && 'IntersectionObserver' in window) {
    var byId = {};
    subLinks.forEach(function (a) { byId[a.getAttribute('data-spy')] = a; });
    var visible = {};
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { visible[e.target.id] = e.isIntersecting ? e.intersectionRatio : 0; });
      var bestId = null, best = 0;
      Object.keys(visible).forEach(function (id) { if (visible[id] > best) { best = visible[id]; bestId = id; } });
      subLinks.forEach(function (a) { a.classList.toggle('is-active', a.getAttribute('data-spy') === bestId); });
    }, { rootMargin: '-45% 0px -45% 0px', threshold: [0, 0.25, 0.5, 1] });
    subLinks.forEach(function (a) {
      var el = document.getElementById(a.getAttribute('data-spy'));
      if (el) io.observe(el);
    });
  }
})();
