/* ═══════════════════════════════════════════════════════════════════
   script.js  —  paste this entire file (it extends the JS in index.html)
   ═══════════════════════════════════════════════════════════════════ */

/* ─────────────────────────────────────────────────────────────────
   1.  BOTTOM NAV BAR  (phone ≤ 767px)
   Injects a fixed bottom bar with 5 slots:
   Home · Music · Events · Gallery · More (→ sheet with the rest)
   ───────────────────────────────────────────────────────────────── */
(function buildBottomNav() {

  /* The HTML to inject before </body> */
  const navHTML = `
    <nav id="bottom-nav" role="navigation" aria-label="Mobile navigation">
      <div class="bn-inner">

        <a href="index.html"   class="bn-item active" aria-label="Home">
          <svg viewBox="0 0 24 24"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9.5z"/><polyline points="9 21 9 12 15 12 15 21"/></svg>
          Home
        </a>

        <a href="music.html"   class="bn-item" aria-label="Music">
          <svg viewBox="0 0 24 24"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
          Music
        </a>

        <a href="events.html"  class="bn-item" aria-label="Events">
          <svg viewBox="0 0 24 24"><path d="M2 9a1 1 0 0 1 1-1h18a1 1 0 0 1 1 1v2a2 2 0 0 0 0 4v2a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-2a2 2 0 0 0 0-4V9z"/><line x1="9" y1="9" x2="9" y2="15"/></svg>
          Events
        </a>

        <a href="gallery.html" class="bn-item" aria-label="Gallery">
          <svg viewBox="0 0 24 24"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
          Gallery
        </a>

        <button class="bn-item" aria-label="More pages" onclick="openMoreSheet()" style="background:none;border:none;font-family:inherit;color:inherit;cursor:pointer">
          <svg viewBox="0 0 24 24"><circle cx="12" cy="5"  r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></svg>
          More
        </button>

      </div>
    </nav>

    <!-- "More" slide-up sheet -->
    <div id="bn-more-sheet" role="dialog" aria-modal="true" aria-label="More pages">
      <div class="bn-sheet-bg" onclick="closeMoreSheet()"></div>
      <div class="bn-sheet-panel">
        <div class="bn-sheet-handle"></div>
        <div class="bn-sheet-grid">

          <a href="merch.html"    class="bn-sheet-item" onclick="closeMoreSheet()">
            <svg viewBox="0 0 24 24"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
            <span>Merch</span>
          </a>

          <a href="sponsors.html" class="bn-sheet-item cr-item" onclick="closeMoreSheet()">
            <svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            <span>Donate</span>
          </a>

          <a href="ministry.html" class="bn-sheet-item cr-item" onclick="closeMoreSheet()">
            <svg viewBox="0 0 24 24"><line x1="12" y1="2" x2="12" y2="22"/><line x1="2" y1="9" x2="22" y2="9"/></svg>
            <span>Ministry</span>
          </a>

          <a href="blog.html"     class="bn-sheet-item" onclick="closeMoreSheet()">
            <svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
            <span>Blog</span>
          </a>

          <a href="about.html"    class="bn-sheet-item" onclick="closeMoreSheet()">
            <svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            <span>About</span>
          </a>

          <a href="partner.html"  class="bn-sheet-item" onclick="closeMoreSheet()">
            <svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            <span>Partner</span>
          </a>

        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', navHTML);

  /* Mark the active item based on current page filename */
  const page = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.bn-item').forEach(item => {
    item.classList.remove('active');
    const href = item.getAttribute('href');
    if (href && href === page) item.classList.add('active');
    if (page === '' || page === 'index.html') {
      const homeItem = document.querySelector('.bn-item[href="index.html"]');
      if (homeItem) homeItem.classList.add('active');
    }
  });
})();


/* ─────────────────────────────────────────────────────────────────
   2.  MORE SHEET  open / close
   ───────────────────────────────────────────────────────────────── */
function openMoreSheet() {
  const sheet = document.getElementById('bn-more-sheet');
  if (sheet) sheet.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeMoreSheet() {
  const sheet = document.getElementById('bn-more-sheet');
  if (sheet) sheet.classList.remove('open');
  document.body.style.overflow = '';
}

/* Close sheet on Escape */
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeMoreSheet();
});


/* ─────────────────────────────────────────────────────────────────
   3.  NAV ICON SHORTCUTS  (tablet 481–1024px)
   Injects compact icon + label links into the right side of the nav.
   ───────────────────────────────────────────────────────────────── */
(function buildNavIcons() {

  const icons = [
    { href: 'music.html',   label: 'Music',  icon: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',                          cls: '' },
    { href: 'events.html',  label: 'Events', icon: '<path d="M2 9a1 1 0 0 1 1-1h18a1 1 0 0 1 1 1v2a2 2 0 0 0 0 4v2a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-2a2 2 0 0 0 0-4V9z"/><line x1="9" y1="9" x2="9" y2="15"/>', cls: 'tkt-icon' },
    { href: 'gallery.html', label: 'Gallery',icon: '<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>',cls: '' },
    { href: 'merch.html',   label: 'Merch',  icon: '<path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>',cls: '' },
    {
      href: null,
      label: '&#xBB;', /* » glyph = "more" hint */
      icon: '<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
      cls: '',
      isMore: true
    }
  ];

  /* Build the container */
  const wrap = document.createElement('div');
  wrap.className = 'n-nav-icons';
  wrap.setAttribute('aria-label', 'Quick navigation');

  icons.forEach(({ href, label, icon, cls, isMore }) => {
    let el;
    if (isMore) {
      el = document.createElement('button');
      el.setAttribute('aria-label', 'More pages');
      el.style.cssText = 'background:none;border:none;font-family:inherit;cursor:pointer;';
      el.onclick = openMoreSheet;
    } else {
      el = document.createElement('a');
      el.href = href;
    }
    el.className = `n-nav-icon ${cls}`;
    el.innerHTML = `<svg viewBox="0 0 24 24">${icon}</svg>${label}`;
    wrap.appendChild(el);
  });

  /* Insert just before the burger (or at the end of nav) */
  const nav = document.getElementById('mainNav');
  const burger = nav ? nav.querySelector('.burger') : null;
  if (nav) {
    if (burger) nav.insertBefore(wrap, burger);
    else nav.appendChild(wrap);
  }
})();


/* ─────────────────────────────────────────────────────────────────
   4.  SWIPE-DOWN TO CLOSE more sheet (touch UX polish)
   ───────────────────────────────────────────────────────────────── */
(function swipeDownToClose() {
  let startY = 0;

  document.addEventListener('touchstart', e => {
    startY = e.touches[0].clientY;
  }, { passive: true });

  document.addEventListener('touchend', e => {
    const endY    = e.changedTouches[0].clientY;
    const delta   = endY - startY;
    const sheet   = document.getElementById('bn-more-sheet');
    const isOpen  = sheet && sheet.classList.contains('open');

    /* swipe down ≥ 60px closes the sheet */
    if (isOpen && delta > 60) closeMoreSheet();
  }, { passive: true });
})();


/* ─────────────────────────────────────────────────────────────────
   5.  SCROLL-LINKED NAV HIGHLIGHT  (bottom nav)
   As the user scrolls, highlight the closest section's nav item.
   ───────────────────────────────────────────────────────────────── */
(function sectionTracker() {

  const sectionMap = {
    'hero':    'index.html',
    'events':  'events.html',
    'music':   'music.html',
    'gallery': 'gallery.html',
  };

  const sections = Object.keys(sectionMap).map(id => document.getElementById(id)).filter(Boolean);
  if (!sections.length) return;

  const update = () => {
    let active = null;
    sections.forEach(sec => {
      const top = sec.getBoundingClientRect().top;
      if (top <= window.innerHeight * 0.45) active = sec.id;
    });

    const targetPage = sectionMap[active] || 'index.html';
    document.querySelectorAll('.bn-item').forEach(item => {
      item.classList.toggle('active', item.getAttribute('href') === targetPage);
    });
  };

  window.addEventListener('scroll', update, { passive: true });
})();