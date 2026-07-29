/* ==========================================================
   TravelConnect – Shared helpers (toast, modal, nav, format)
   ========================================================== */

// -------- Toast --------
function toast(msg, kind='') {
  let el = document.getElementById('toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'toast';
    el.className = 'toast';
    document.body.appendChild(el);
  }
  el.className = 'toast ' + (kind ? 'toast-' + kind : '');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('show'), 2200);
}

// -------- Modal helper --------
function openModal(html, opts={}) {
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop show';
  backdrop.innerHTML = `<div class="modal">${html}</div>`;
  document.body.appendChild(backdrop);
  const close = () => backdrop.remove();
  backdrop.addEventListener('click', e => { if (e.target === backdrop) close(); });
  backdrop.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', close));
  return { root: backdrop, close };
}

// -------- Format --------
function timeAgo(ts) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return m + 'm ago';
  const h = Math.floor(m / 60);
  if (h < 24) return h + 'h ago';
  const d = Math.floor(h / 24);
  if (d < 7) return d + 'd ago';
  const w = Math.floor(d / 7);
  if (w < 5) return w + 'w ago';
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
}
function escapeHtml(s) {
  return String(s || '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}
function linkify(text) {
  const esc = escapeHtml(text);
  return esc
    .replace(/#(\w+)/g, '<a class="hashtag" href="trends.html?tag=$1">#$1</a>')
    .replace(/@(\w+)/g, '<a class="hashtag" href="profile.html?u=$1">@$1</a>')
    .replace(/\n/g, '<br>');
}
function initials(name) {
  return (name || '?').trim().split(/\s+/).slice(0,2).map(w => w[0]?.toUpperCase() || '').join('') || '?';
}
function catInfo(id) {
  return (CATEGORIES.find(c => c.id === id)) || { id, name: id, emoji: '📍', color: '#0d5c63' };
}

// -------- Avatar rendering (returns HTML string) --------
function renderAvatar(user, extraClass='') {
  if (!user) return `<div class="avatar ${extraClass}">?</div>`;
  if (user.avatar) {
    return `<div class="avatar ${extraClass}"><img src="${escapeHtml(user.avatar)}" alt=""></div>`;
  }
  return `<div class="avatar ${extraClass}" style="background: linear-gradient(135deg, ${user.coverColor || '#0d5c63'}, #c68b59)">${escapeHtml(initials(user.name))}</div>`;
}

// -------- Navbar rendering (called on every page) --------
function renderNavbar(activePage) {
  const nav = document.getElementById('navbar');
  if (!nav) return;
  const me = API.currentUser();
  const links = [
    { key:'home',        href:'home.html',        label:'Feed' },
    { key:'explore',     href:'explore.html',     label:'Explore' },
    { key:'communities', href:'communities.html', label:'Communities' },
    { key:'trends',      href:'trends.html',      label:'Trends' },
    { key:'analytics',   href:'analytics.html',   label:'Analytics' },
  ];
  if (me && me.role === 'admin') links.push({ key:'admin', href:'admin.html', label:'Admin' });

  nav.innerHTML = `
    <div class="nav-inner">
      <a href="${me ? 'home.html' : 'index.html'}" class="brand">
        <span class="brand-mark">🌏</span> TravelConnect
      </a>
      <ul class="nav-links">
        ${links.map(l => `
          <li><a href="${l.href}" class="${activePage === l.key ? 'active' : ''}">${l.label}</a></li>
        `).join('')}
      </ul>
      <div class="nav-right">
        <div class="search-box">
          <input id="nav-search" type="text" placeholder="Search destinations…">
        </div>
        ${me ? `
          <div class="dropdown" id="nav-dropdown">
            ${renderAvatar(me)}
            <div class="dropdown-menu">
              <a href="profile.html?u=${me.username}">👤 My profile</a>
              <a href="profile.html?u=${me.username}&tab=saved">🔖 Saved</a>
              <hr>
              <button id="btn-reset-data">↺ Reset demo data</button>
              <button id="btn-logout">↪ Log out</button>
            </div>
          </div>
        ` : `
          <a href="login.html" class="btn btn-secondary btn-sm">Log in</a>
          <a href="register.html" class="btn btn-primary btn-sm">Join</a>
        `}
      </div>
    </div>
  `;

  // Dropdown toggle. Register the "click-outside-closes" handler only ONCE
  // per page (guarded by window._tcDocClickBound) to avoid stacking listeners
  // on subsequent renderNavbar() calls.
  const dd = nav.querySelector('#nav-dropdown');
  if (dd) {
    dd.addEventListener('click', e => {
      if (e.target.closest('.dropdown-menu')) return;
      dd.classList.toggle('open');
    });
    if (!window._tcDocClickBound) {
      window._tcDocClickBound = true;
      document.addEventListener('click', e => {
        const openDd = document.getElementById('nav-dropdown');
        if (openDd && !openDd.contains(e.target)) openDd.classList.remove('open');
      });
    }
  }
  nav.querySelector('#btn-logout')?.addEventListener('click', () => {
    API.logout();
    window.location.href = 'index.html';
  });
  nav.querySelector('#btn-reset-data')?.addEventListener('click', () => {
    const m = openModal(`
      <div class="modal-header"><h3>Reset demo data?</h3><button class="modal-close" data-close>×</button></div>
      <div class="modal-body">
        <p>This will erase every post, like, follow and entry you've made, log you out, and re-seed the sample data.</p>
        <p class="muted text-sm mt-8">Useful if the app gets into a weird state.</p>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" data-close>Cancel</button>
        <button class="btn btn-danger" id="confirm-reset">Reset everything</button>
      </div>
    `);
    m.root.querySelector('#confirm-reset').addEventListener('click', () => {
      DB.reset(); DB.setSession(null);
      window.location.href = 'index.html';
    });
  });
  // Nav search — Enter jumps to explore
  const search = nav.querySelector('#nav-search');
  search?.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      window.location.href = 'explore.html?q=' + encodeURIComponent(e.target.value);
    }
  });
}

// -------- Read query string --------
function qs(name) {
  return new URLSearchParams(window.location.search).get(name);
}

// Ensure DB is initialized as soon as page loads
if (typeof DB !== 'undefined') DB.load();

// Global runtime-error handler — shows a discreet toast so users know
// something went wrong instead of the app going silently blank.
// (Ignores third-party errors from browser extensions.)
window.addEventListener('error', e => {
  if (!e || !e.message) return;
  if (/Script error\.?$/i.test(e.message)) return; // cross-origin — no useful info
  try { toast(e.message.slice(0, 120), 'danger'); } catch { /* noop */ }
});
window.addEventListener('unhandledrejection', e => {
  const msg = (e && e.reason && (e.reason.message || String(e.reason))) || 'Something went wrong';
  try { toast(String(msg).slice(0, 120), 'danger'); } catch { /* noop */ }
});
