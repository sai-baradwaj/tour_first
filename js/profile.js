/* ==========================================================
   TravelConnect – Profile page logic
   ========================================================== */

// Tab definitions
const PROFILE_TABS = [
  { key: 'posts',      label: 'Posts',       icon: '📸' },
  { key: 'visited',    label: 'Visited',     icon: '✓',  kind: 'visited' },
  { key: 'bucket',     label: 'Bucket List', icon: '⭐', kind: 'bucket' },
  { key: 'food',       label: 'Food Diary',  icon: '🍜', kind: 'food' },
  { key: 'adventures', label: 'Adventures',  icon: '🎒', kind: 'adventures' },
  { key: 'saved',      label: 'Saved',       icon: '🔖' },
];

// ---------- Entry card rendering ----------
function renderEntryCard(entry, kind, isMe) {
  const badgeMap = {
    visited:    e => `<span class="entry-badge">${e.date || ''} · <span class="stars">${'★'.repeat(Math.max(0, Math.min(5, e.rating||0)))}</span></span>`,
    bucket:     e => `<span class="entry-badge">${e.priority || 'medium'} priority</span>`,
    food:       e => `<span class="entry-badge"><span class="stars">${'★'.repeat(Math.max(0, Math.min(5, e.rating||0)))}</span></span>`,
    adventures: e => `<span class="entry-badge">${e.difficulty || 'medium'}</span>`,
  };
  const img = entry.image;
  return `
    <article class="entry-card" data-entry-id="${entry.id}" data-entry-kind="${kind}">
      <div class="entry-card-image">
        ${img
          ? `<img src="${escapeHtml(img)}" alt="" loading="lazy" onerror="this.style.display='none';this.parentElement.classList.add('ph-img');this.parentElement.innerHTML='📍'">`
          : `<div class="ph-img" style="height:100%">📍</div>`}
        ${badgeMap[kind] ? badgeMap[kind](entry) : ''}
      </div>
      <div class="entry-card-body">
        <h4>${escapeHtml(entry.title || 'Untitled')}</h4>
        <div class="place">📍 ${escapeHtml(entry.place || '')}</div>
        ${entry.notes ? `<p class="notes">${escapeHtml(entry.notes)}</p>` : ''}
      </div>
      ${isMe ? `
      <div class="entry-card-actions">
        <button class="btn-sm" data-edit-entry>✎ Edit</button>
        <button class="btn-sm danger-btn" data-remove-entry>🗑 Remove</button>
      </div>` : ''}
    </article>
  `;
}

// ---------- Entry form (modal) ----------
function openEntryForm(kind, existing = null) {
  const isEdit = !!existing;
  const isFood = kind === 'food';
  const isVisited = kind === 'visited';
  const isBucket = kind === 'bucket';
  const isAdv = kind === 'adventures';
  const title = { visited:'Visited place', bucket:'Bucket list item', food:'Food diary entry', adventures:'Adventure' }[kind];

  const cats = CATEGORIES.map(c => `<option value="${c.id}" ${existing?.category===c.id?'selected':''}>${c.emoji} ${c.name}</option>`).join('');

  const m = openModal(`
    <div class="modal-header">
      <h3>${isEdit ? 'Edit' : 'Add'} ${title}</h3>
      <button class="modal-close" data-close>×</button>
    </div>
    <form id="entry-form" class="modal-body">
      <div class="form-group">
        <label>Title</label>
        <input name="title" required value="${escapeHtml(existing?.title || '')}" placeholder="Torres del Paine">
      </div>
      <div class="form-group">
        <label>Place / country</label>
        <input name="place" value="${escapeHtml(existing?.place || '')}" placeholder="Chile">
      </div>
      <div class="form-group">
        <label>Image URL (optional)</label>
        <input name="image" type="url" value="${escapeHtml(existing?.image || '')}" placeholder="https://…">
      </div>
      <div class="form-group">
        <label>Notes</label>
        <textarea name="notes">${escapeHtml(existing?.notes || '')}</textarea>
      </div>
      <div class="form-row">
        ${(isVisited || isFood) ? `
          <div class="form-group">
            <label>Rating</label>
            <select name="rating">
              ${[5,4,3,2,1].map(n => `<option value="${n}" ${existing?.rating==n?'selected':''}>${'★'.repeat(n)} (${n})</option>`).join('')}
            </select>
          </div>` : ''}
        ${isVisited ? `
          <div class="form-group">
            <label>Date visited</label>
            <input name="date" type="month" value="${escapeHtml(existing?.date || '')}">
          </div>` : ''}
        ${isBucket ? `
          <div class="form-group">
            <label>Priority</label>
            <select name="priority">
              ${['high','medium','low'].map(p => `<option value="${p}" ${existing?.priority===p?'selected':''}>${p}</option>`).join('')}
            </select>
          </div>` : ''}
        ${isAdv ? `
          <div class="form-group">
            <label>Difficulty</label>
            <select name="difficulty">
              ${['easy','medium','hard','expert'].map(p => `<option value="${p}" ${existing?.difficulty===p?'selected':''}>${p}</option>`).join('')}
            </select>
          </div>` : ''}
      </div>
    </form>
    <div class="modal-footer">
      <button class="btn btn-secondary" data-close>Cancel</button>
      <button class="btn btn-primary" id="entry-save">${isEdit ? 'Save changes' : 'Add'}</button>
    </div>
  `);
  m.root.querySelector('#entry-save').addEventListener('click', () => {
    const fd = new FormData(m.root.querySelector('#entry-form'));
    const patch = {};
    for (const [k,v] of fd.entries()) {
      if (k === 'rating') patch[k] = parseInt(v, 10);
      else patch[k] = v;
    }
    if (!patch.title) { toast('Title required', 'danger'); return; }
    if (isEdit) {
      API.updateCollection(kind, existing.id, patch);
      toast('Updated', 'success');
    } else {
      API.addCollection(kind, patch);
      toast('Added', 'success');
    }
    m.close();
    renderCurrentTab();
  });
}

// ---------- Post grid (for user's posts) ----------
function renderPostsGrid(userId) {
  const posts = API.listPosts({ userId });
  if (!posts.length) {
    return `<div class="empty">
      <div class="empty-icon">📸</div>
      <h3>No posts yet</h3>
      <p>Share your first travel story from the feed.</p>
    </div>`;
  }
  return `<div class="posts-grid">
    ${posts.map(p => `
      <div class="posts-grid-cell" data-post-open="${p.id}">
        ${p.image
          ? `<img src="${escapeHtml(p.image)}" alt="" loading="lazy" onerror="this.parentElement.classList.add('ph-img');this.remove()">`
          : `<div class="ph-img" style="height:100%">${escapeHtml((p.caption||'').slice(0,80))}</div>`}
      </div>
    `).join('')}
  </div>`;
}

// ---------- Main page renderer ----------
let profileUser = null;
let currentTab = 'posts';

function renderProfile() {
  const me = API.currentUser();
  const isMe = me && me.id === profileUser.id;
  const following = me && API.isFollowing(profileUser.id);
  const posts = API.listPosts({ userId: profileUser.id });

  document.getElementById('profile-header').innerHTML = `
    ${renderAvatar(profileUser, 'avatar-lg')}
    <div class="profile-info">
      <h1>${escapeHtml(profileUser.name)}</h1>
      <div class="username">@${escapeHtml(profileUser.username)} · <span class="chip">${escapeHtml(profileUser.role)}</span></div>
      <div class="bio">${escapeHtml(profileUser.bio || 'Traveler on TravelConnect.')}</div>
      <div class="profile-stats">
        <div class="profile-stat"><strong>${posts.length}</strong><span>Posts</span></div>
        <div class="profile-stat"><strong>${API.followerCount(profileUser.id)}</strong><span>Followers</span></div>
        <div class="profile-stat"><strong>${API.followingCount(profileUser.id)}</strong><span>Following</span></div>
        <div class="profile-stat"><strong>${API.influenceScore(profileUser.id)}</strong><span>Influence</span></div>
      </div>
    </div>
    <div>
      ${isMe ? `
        <button class="btn btn-secondary" id="btn-edit-profile">✎ Edit profile</button>
      ` : me ? `
        <button class="btn ${following ? 'btn-secondary' : 'btn-primary'}" id="btn-follow">
          ${following ? '✓ Following' : '+ Follow'}
        </button>
      ` : `
        <a href="login.html" class="btn btn-primary">Log in to follow</a>
      `}
    </div>
  `;

  // Tabs
  document.getElementById('profile-tabs').innerHTML = PROFILE_TABS.map(t => `
    <div class="profile-tab ${t.key === currentTab ? 'active' : ''}" data-tab="${t.key}">
      <span>${t.icon}</span><span>${t.label}</span>
    </div>
  `).join('');

  document.querySelectorAll('.profile-tab').forEach(el => {
    el.addEventListener('click', () => {
      currentTab = el.dataset.tab;
      const q = new URLSearchParams(window.location.search);
      q.set('tab', currentTab);
      history.replaceState({}, '', 'profile.html?' + q);
      document.querySelectorAll('.profile-tab').forEach(t => t.classList.toggle('active', t === el));
      renderCurrentTab();
    });
  });

  // Follow button
  document.getElementById('btn-follow')?.addEventListener('click', () => {
    if (API.isFollowing(profileUser.id)) API.unfollow(profileUser.id);
    else API.follow(profileUser.id);
    renderProfile();
    renderCurrentTab();
  });

  // Edit profile
  document.getElementById('btn-edit-profile')?.addEventListener('click', () => {
    const m = openModal(`
      <div class="modal-header"><h3>Edit profile</h3><button class="modal-close" data-close>×</button></div>
      <form id="ep-form" class="modal-body">
        <div class="form-group"><label>Name</label><input name="name" value="${escapeHtml(me.name)}" required></div>
        <div class="form-group"><label>Bio</label><textarea name="bio">${escapeHtml(me.bio || '')}</textarea></div>
        <div class="form-group"><label>Avatar URL (optional)</label><input name="avatar" type="url" value="${escapeHtml(me.avatar || '')}"></div>
      </form>
      <div class="modal-footer">
        <button class="btn btn-secondary" data-close>Cancel</button>
        <button class="btn btn-primary" id="ep-save">Save</button>
      </div>
    `);
    m.root.querySelector('#ep-save').addEventListener('click', () => {
      const fd = new FormData(m.root.querySelector('#ep-form'));
      API.updateUser(me.id, {
        name: fd.get('name'),
        bio: fd.get('bio'),
        avatar: fd.get('avatar') || null,
      });
      m.close();
      profileUser = API.getUser(me.id);
      renderProfile();
      renderNavbar('profile');
      toast('Profile updated', 'success');
    });
  });

  renderCurrentTab();
}

function renderCurrentTab() {
  const container = document.getElementById('profile-content');
  const me = API.currentUser();
  const isMe = me && me.id === profileUser.id;

  if (currentTab === 'posts') {
    container.innerHTML = renderPostsGrid(profileUser.id);
    container.querySelectorAll('[data-post-open]').forEach(el => {
      el.addEventListener('click', () => {
        const p = API.getPost(el.dataset.postOpen);
        openPostModal(p);
      });
    });
    return;
  }

  if (currentTab === 'saved') {
    if (!isMe) {
      container.innerHTML = `<div class="empty"><div class="empty-icon">🔒</div><h3>Private</h3><p>Only ${escapeHtml(profileUser.name)} can see their saved posts.</p></div>`;
      return;
    }
    const saved = API.getSavedPosts(me.id);
    if (!saved.length) {
      container.innerHTML = `<div class="empty"><div class="empty-icon">🔖</div><h3>No saved posts</h3><p>Tap the bookmark icon on any post to save it here.</p></div>`;
      return;
    }
    container.innerHTML = saved.map(renderPost).join('');
    wirePostActions(container);
    return;
  }

  // Collection tabs
  const tabDef = PROFILE_TABS.find(t => t.key === currentTab);
  const kind = tabDef.kind;
  const entries = API.listCollection(kind, profileUser.id);

  const addBtn = isMe ? `
    <div class="row-between mb-16">
      <div class="muted text-sm">${entries.length} ${tabDef.label.toLowerCase()}</div>
      <button class="btn btn-primary btn-sm" id="btn-add-entry">+ Add ${escapeHtml(tabDef.label)}</button>
    </div>
  ` : '';

  if (!entries.length) {
    container.innerHTML = addBtn + `
      <div class="empty">
        <div class="empty-icon">${tabDef.icon}</div>
        <h3>No ${tabDef.label.toLowerCase()} yet</h3>
        <p>${isMe ? 'Add your first entry with the button above.' : 'Nothing to show here.'}</p>
      </div>
    `;
  } else {
    container.innerHTML = addBtn + `
      <div class="entry-grid">
        ${entries.map(e => renderEntryCard(e, kind, isMe)).join('')}
      </div>
    `;
  }

  document.getElementById('btn-add-entry')?.addEventListener('click', () => openEntryForm(kind));

  container.querySelectorAll('.entry-card').forEach(card => {
    card.querySelector('[data-remove-entry]')?.addEventListener('click', () => {
      const m = openModal(`
        <div class="modal-header"><h3>Remove entry?</h3><button class="modal-close" data-close>×</button></div>
        <div class="modal-body"><p>This entry will be permanently removed from your ${escapeHtml(tabDef.label.toLowerCase())}.</p></div>
        <div class="modal-footer">
          <button class="btn btn-secondary" data-close>Cancel</button>
          <button class="btn btn-danger" id="confirm-rm">Remove</button>
        </div>
      `);
      m.root.querySelector('#confirm-rm').addEventListener('click', () => {
        API.removeCollection(kind, card.dataset.entryId);
        m.close();
        renderCurrentTab();
        toast('Removed', 'danger');
      });
    });
    card.querySelector('[data-edit-entry]')?.addEventListener('click', () => {
      const entries = API.listCollection(kind, profileUser.id);
      const entry = entries.find(x => x.id === card.dataset.entryId);
      if (entry) openEntryForm(kind, entry);
    });
  });
}

// ---------- Post modal (viewing a specific post) ----------
function openPostModal(post) {
  const m = openModal(`
    <div class="modal-body" style="padding:0" id="post-modal-body"></div>
  `);
  m.root.querySelector('.modal').style.maxWidth = '600px';
  m.root.querySelector('#post-modal-body').innerHTML = renderPost(post);
  wirePostActions(m.root.querySelector('#post-modal-body'));
}
