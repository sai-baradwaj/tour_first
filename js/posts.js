/* ==========================================================
   TravelConnect – Post rendering + composer
   ========================================================== */

function renderPost(post, opts = {}) {
  const author = API.getUser(post.userId);
  const me = API.currentUser();
  const liked = me && (post.likes || []).includes(me.id);
  const saved = me && (post.saves || []).includes(me.id);
  const cat = post.category ? catInfo(post.category) : null;
  const dest = post.destinationId ? API.getDestination(post.destinationId) : null;

  return `
    <article class="post" data-post-id="${post.id}">
      <header class="post-head">
        <a href="profile.html?u=${author?.username || ''}">${renderAvatar(author)}</a>
        <div class="post-meta">
          <strong><a href="profile.html?u=${author?.username || ''}">${escapeHtml(author?.name || 'Unknown')}</a></strong>
          <div>
            @${escapeHtml(author?.username || '')} · ${timeAgo(post.createdAt)}
            ${cat ? ` · <span class="chip" style="background:${cat.color}22;color:${cat.color}">${cat.emoji} ${cat.name}</span>` : ''}
            ${dest ? ` · 📍 ${escapeHtml(dest.name)}` : ''}
          </div>
        </div>
        <button class="post-menu-btn" data-post-menu="${post.id}" title="More">⋯</button>
      </header>

      ${post.image ? `
        <div class="post-image">
          <img src="${escapeHtml(post.image)}" alt="" loading="lazy" onerror="this.parentElement.classList.add('ph-img');this.remove()">
        </div>` : ''}

      <div class="post-body">
        <div class="post-caption">${linkify(post.caption)}</div>
      </div>

      <div class="post-actions">
        <button class="post-action ${liked ? 'liked' : ''}" data-act="like" data-post="${post.id}">
          <span class="icon">${liked ? '❤️' : '🤍'}</span>
          <span data-likes>${(post.likes || []).length}</span>
        </button>
        <button class="post-action" data-act="toggle-comments" data-post="${post.id}">
          <span class="icon">💬</span>
          <span data-comments>${(post.comments || []).length}</span>
        </button>
        <button class="post-action" data-act="share" data-post="${post.id}">
          <span class="icon">↗</span>
          <span data-shares>${(post.shares || []).length}</span>
        </button>
        <button class="post-action ${saved ? 'saved' : ''}" data-act="save" data-post="${post.id}" style="margin-left:auto">
          <span class="icon">${saved ? '🔖' : '📑'}</span>
        </button>
      </div>

      <div class="post-comments" data-comments-block hidden>
        <div data-comments-list></div>
        ${me ? `
          <form class="comment-form" data-comment-form="${post.id}">
            ${renderAvatar(me, 'avatar-sm')}
            <input name="text" type="text" placeholder="Add a comment…" required>
            <button class="btn btn-primary btn-sm">Post</button>
          </form>` : `
          <p class="muted text-sm center"><a href="login.html" style="color:var(--primary)">Log in</a> to comment</p>`}
      </div>
    </article>
  `;
}

function renderComment(c) {
  const u = API.getUser(c.userId);
  return `
    <div class="comment">
      ${renderAvatar(u, 'avatar-sm')}
      <div class="comment-body">
        <strong><a href="profile.html?u=${u?.username || ''}">${escapeHtml(u?.name || '?')}</a></strong>
        <span>${escapeHtml(c.text)}</span>
        <div><time>${timeAgo(c.createdAt)}</time></div>
      </div>
    </div>
  `;
}

// Delegated handler used by home, profile, explore etc.
// Guarded by a flag on the element so calling it multiple times on the same
// container (e.g. after refreshFeed) does NOT stack duplicate listeners.
function wirePostActions(container) {
  if (!container || container._tcPostWired) return;
  container._tcPostWired = true;

  container.addEventListener('click', e => {
    // 1) Post-menu button — handle first so we don't fall through to like/save
    const menuBtn = e.target.closest('[data-post-menu]');
    if (menuBtn) {
      const postId = menuBtn.dataset.postMenu;
      const post = API.getPost(postId);
      const me = API.currentUser();
      if (!post) return;
      if (!me) { window.location.href = 'login.html'; return; }
      if (post.userId === me.id || me.role === 'admin') {
        openDeletePostModal(postId, () => menuBtn.closest('.post').remove());
      } else {
        openReportModal('post', postId);
      }
      return;
    }

    // 2) Post action buttons (like / save / share / comments)
    const btn = e.target.closest('[data-act]');
    if (!btn) return;
    const postId = btn.dataset.post;
    const post = API.getPost(postId);
    if (!post) return;
    const me = API.currentUser();
    const act = btn.dataset.act;

    if (act === 'like') {
      if (!me) { window.location.href = 'login.html'; return; }
      const nowLiked = API.toggleLike(postId);
      btn.classList.toggle('liked', nowLiked);
      btn.querySelector('.icon').textContent = nowLiked ? '❤️' : '🤍';
      btn.querySelector('[data-likes]').textContent = API.getPost(postId).likes.length;
    }
    else if (act === 'save') {
      if (!me) { window.location.href = 'login.html'; return; }
      const nowSaved = API.toggleSave(postId);
      btn.classList.toggle('saved', nowSaved);
      btn.querySelector('.icon').textContent = nowSaved ? '🔖' : '📑';
      toast(nowSaved ? 'Saved' : 'Removed from saved');
    }
    else if (act === 'share') {
      if (!me) { window.location.href = 'login.html'; return; }
      API.sharePost(postId);
      btn.querySelector('[data-shares]').textContent = API.getPost(postId).shares.length;
      // Copy a share link (keep .html — matches vercel.json cleanUrls:false)
      const base = window.location.origin + window.location.pathname.replace(/[^/]*$/, '');
      const url = base + 'home.html?p=' + postId;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).catch(() => {});
      }
      toast('Shared · link copied');
    }
    else if (act === 'toggle-comments') {
      const article = btn.closest('.post');
      const block = article.querySelector('[data-comments-block]');
      const list = article.querySelector('[data-comments-list]');
      list.innerHTML = (post.comments || []).map(renderComment).join('') ||
        `<p class="muted text-sm mb-8">No comments yet — be the first.</p>`;
      block.hidden = !block.hidden;
    }
  });

  // Comment submit (delegated)
  container.addEventListener('submit', e => {
    const form = e.target.closest('[data-comment-form]');
    if (!form) return;
    e.preventDefault();
    const postId = form.dataset.commentForm;
    const input = form.querySelector('input[name="text"]');
    if (!input.value.trim()) return;
    API.addComment(postId, input.value);
    input.value = '';
    // Re-render comments in this post
    const article = form.closest('.post');
    const post = API.getPost(postId);
    article.querySelector('[data-comments-list]').innerHTML =
      (post.comments || []).map(renderComment).join('');
    article.querySelector('[data-comments]').textContent = post.comments.length;
    toast('Comment posted');
  });
}

function openDeletePostModal(postId, onDelete) {
  const m = openModal(`
    <div class="modal-header"><h3>Delete post?</h3><button class="modal-close" data-close>×</button></div>
    <div class="modal-body">
      <p>This will permanently remove the post, its likes, comments and shares.</p>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" data-close>Cancel</button>
      <button class="btn btn-danger" id="confirm-delete">Delete post</button>
    </div>
  `);
  m.root.querySelector('#confirm-delete').addEventListener('click', () => {
    API.deletePost(postId);
    onDelete && onDelete();
    m.close();
    toast('Post deleted', 'danger');
  });
}
function openReportModal(targetType, targetId) {
  const reasons = ['Spam', 'Inappropriate', 'Hate speech', 'Misinformation', 'Other'];
  const m = openModal(`
    <div class="modal-header"><h3>Report ${targetType}</h3><button class="modal-close" data-close>×</button></div>
    <div class="modal-body">
      <p class="muted text-sm mb-16">Tell us what's wrong. Our team will review it.</p>
      <div class="form-group">
        <label>Reason</label>
        <select id="report-reason">${reasons.map(r => `<option>${r}</option>`).join('')}</select>
      </div>
      <div class="form-group">
        <label>Details (optional)</label>
        <textarea id="report-note" placeholder="Anything else the reviewer should know"></textarea>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" data-close>Cancel</button>
      <button class="btn btn-primary" id="submit-report">Submit report</button>
    </div>
  `);
  m.root.querySelector('#submit-report').addEventListener('click', () => {
    const reason = m.root.querySelector('#report-reason').value;
    const note = m.root.querySelector('#report-note').value.trim();
    API.createReport({ targetType, targetId, reason: note ? reason + ': ' + note : reason });
    m.close();
    toast('Report submitted — thanks', 'success');
  });
}

// Composer (shared between home & profile)
function renderComposer() {
  const me = API.currentUser();
  if (!me) return '';
  const cats = CATEGORIES.map(c => `<option value="${c.id}">${c.emoji} ${c.name}</option>`).join('');
  return `
    <form class="composer" id="composer">
      <div class="row" style="align-items:flex-start">
        ${renderAvatar(me)}
        <div style="flex:1">
          <textarea name="caption" required placeholder="Share a travel story… use #hashtags"></textarea>
        </div>
      </div>
      <div id="composer-image-row" class="mt-8" hidden>
        <input type="url" name="image" id="composer-image" placeholder="Paste an image URL (https://…)" oninput="composerPreview(this.value)">
      </div>
      <div id="composer-preview" class="composer-preview" hidden><img id="composer-preview-img" src="" alt=""></div>
      <div class="composer-actions">
        <div class="composer-tools">
          <button type="button" class="composer-tool" id="composer-toggle-image" title="Attach an image">
            🖼️ <span>Image</span>
          </button>
          <select name="category" class="composer-tool" style="border:none;padding:7px 12px;background:var(--surface-alt);color:var(--text-muted);font-size:13px;width:auto">
            <option value="">Category…</option>
            ${cats}
          </select>
        </div>
        <button type="submit" class="btn btn-primary btn-sm">Post</button>
      </div>
    </form>
  `;
}
function composerPreview(url) {
  const p = document.getElementById('composer-preview');
  const img = document.getElementById('composer-preview-img');
  if (url && /^https?:\/\//.test(url)) {
    img.src = url;
    img.onerror = () => { p.hidden = true; };
    img.onload  = () => { p.hidden = false; };
  } else {
    p.hidden = true;
  }
}
function wireComposer(onCreate) {
  const composerContainer = document.getElementById('composer-container');
  if (!composerContainer) return;
  composerContainer.innerHTML = renderComposer();
  const form = document.getElementById('composer');
  if (!form) return;

  const imgRow = form.querySelector('#composer-image-row');
  const imgInput = form.querySelector('#composer-image');
  const toggle = form.querySelector('#composer-toggle-image');

  toggle.addEventListener('click', () => {
    const opening = imgRow.hidden;
    imgRow.hidden = !opening;
    toggle.classList.toggle('active', opening);
    if (opening) setTimeout(() => imgInput.focus(), 30);
    else { imgInput.value = ''; composerPreview(''); }
  });

  form.addEventListener('submit', e => {
    e.preventDefault();
    const fd = new FormData(form);
    const caption = (fd.get('caption') || '').trim();
    if (!caption) { toast('Add a caption first', 'danger'); return; }
    try {
      const post = API.createPost({
        caption,
        image: fd.get('image') || null,
        category: fd.get('category') || null,
      });
      form.reset();
      imgRow.hidden = true;
      toggle.classList.remove('active');
      document.getElementById('composer-preview').hidden = true;
      toast('Posted', 'success');
      onCreate && onCreate(post);
    } catch (err) {
      toast(err.message, 'danger');
    }
  });
}
