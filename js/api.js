/* ==========================================================
   TravelConnect – Local API (replaces server REST endpoints)
   All functions read/write the localStorage DB via window.DB
   ========================================================== */

(function () {
  function db()  { return DB.load(); }
  function save(d) { DB.save(d); }
  const now = () => Date.now();

  // ---------- Auth ----------
  function register({ username, name, email, password }) {
    const d = db();
    if (!username || !email || !password) throw new Error('All fields required');
    username = username.toLowerCase().trim();
    if (d.users.some(u => u.username === username))
      throw new Error('Username already taken');
    if (d.users.some(u => u.email === email))
      throw new Error('Email already registered');
    const user = {
      id: DB.uid('u'),
      username,
      name: name || username,
      email,
      pw: password,
      bio: '',
      role: 'traveler',
      avatar: null,
      coverColor: '#0d5c63',
    };
    d.users.push(user);
    d.follows[user.id] = [];
    save(d);
    DB.setSession(user.id);
    return user;
  }
  function login({ emailOrUsername, password }) {
    const d = db();
    const q = (emailOrUsername || '').toLowerCase().trim();
    const u = d.users.find(u =>
      u.email.toLowerCase() === q || u.username.toLowerCase() === q
    );
    if (!u) throw new Error('Account not found');
    if (u.pw !== password) throw new Error('Wrong password');
    DB.setSession(u.id);
    return u;
  }
  function logout() { DB.setSession(null); }
  function currentUser() {
    const s = DB.getSession();
    if (!s) return null;
    return db().users.find(u => u.id === s.userId) || null;
  }
  function requireUser() {
    const u = currentUser();
    if (!u) { window.location.href = 'login.html'; throw new Error('Not signed in'); }
    return u;
  }

  // ---------- Users ----------
  function getUser(idOrUsername) {
    const d = db();
    return d.users.find(u => u.id === idOrUsername || u.username === idOrUsername) || null;
  }
  function updateUser(id, patch) {
    const d = db();
    const u = d.users.find(x => x.id === id);
    if (!u) throw new Error('User not found');
    Object.assign(u, patch);
    save(d);
    return u;
  }
  function deleteUser(id) {
    const d = db();
    d.users = d.users.filter(u => u.id !== id);
    d.posts = d.posts.filter(p => p.userId !== id);
    delete d.follows[id];
    for (const k in d.follows) d.follows[k] = d.follows[k].filter(x => x !== id);
    d.visited = d.visited.filter(v => v.userId !== id);
    d.bucket = d.bucket.filter(v => v.userId !== id);
    d.food = d.food.filter(v => v.userId !== id);
    d.adventures = d.adventures.filter(v => v.userId !== id);
    save(d);
  }
  function follow(targetId) {
    const me = requireUser();
    if (me.id === targetId) return;
    const d = db();
    d.follows[me.id] = d.follows[me.id] || [];
    if (!d.follows[me.id].includes(targetId)) d.follows[me.id].push(targetId);
    save(d);
  }
  function unfollow(targetId) {
    const me = requireUser();
    const d = db();
    d.follows[me.id] = (d.follows[me.id] || []).filter(id => id !== targetId);
    save(d);
  }
  function isFollowing(targetId) {
    const me = currentUser();
    if (!me) return false;
    return (db().follows[me.id] || []).includes(targetId);
  }
  function followerCount(userId) {
    const f = db().follows;
    let n = 0;
    for (const k in f) if (f[k].includes(userId)) n++;
    return n;
  }
  function followingCount(userId) {
    return (db().follows[userId] || []).length;
  }
  function whoToFollow(limit=4) {
    const me = currentUser();
    if (!me) return db().users.slice(0, limit);
    const following = db().follows[me.id] || [];
    return db().users
      .filter(u => u.id !== me.id && !following.includes(u.id))
      .sort((a,b) => followerCount(b.id) - followerCount(a.id))
      .slice(0, limit);
  }

  // ---------- Posts ----------
  function listPosts({ userId, hashtag, category, followingOnly } = {}) {
    const d = db();
    let posts = d.posts.slice();
    if (userId)   posts = posts.filter(p => p.userId === userId);
    if (hashtag)  posts = posts.filter(p => p.hashtags.includes(hashtag.toLowerCase().replace(/^#/, '')));
    if (category) posts = posts.filter(p => p.category === category);
    if (followingOnly) {
      const me = currentUser();
      if (me) {
        const fol = new Set([me.id, ...(d.follows[me.id] || [])]);
        posts = posts.filter(p => fol.has(p.userId));
      }
    }
    return posts.sort((a,b) => b.createdAt - a.createdAt);
  }
  function getPost(id) {
    return db().posts.find(p => p.id === id) || null;
  }
  function createPost({ image, caption, category, destinationId }) {
    const me = requireUser();
    if (!caption || !caption.trim()) throw new Error('Caption required');
    const d = db();
    const post = {
      id: DB.uid('p'),
      userId: me.id,
      image: image || null,
      caption: caption.trim(),
      category: category || null,
      destinationId: destinationId || null,
      hashtags: (caption.match(/#\w+/g) || []).map(h => h.slice(1).toLowerCase()),
      likes: [],
      saves: [],
      shares: [],
      comments: [],
      createdAt: now(),
    };
    d.posts.unshift(post);
    save(d);
    return post;
  }
  function deletePost(id) {
    const d = db();
    d.posts = d.posts.filter(p => p.id !== id);
    save(d);
  }
  function toggleLike(postId) {
    const me = requireUser();
    const d = db();
    const p = d.posts.find(x => x.id === postId);
    if (!p) return;
    p.likes = p.likes || [];
    if (p.likes.includes(me.id)) p.likes = p.likes.filter(id => id !== me.id);
    else p.likes.push(me.id);
    save(d);
    return p.likes.includes(me.id);
  }
  function toggleSave(postId) {
    const me = requireUser();
    const d = db();
    const p = d.posts.find(x => x.id === postId);
    if (!p) return;
    p.saves = p.saves || [];
    if (p.saves.includes(me.id)) p.saves = p.saves.filter(id => id !== me.id);
    else p.saves.push(me.id);
    save(d);
    return p.saves.includes(me.id);
  }
  function sharePost(postId) {
    const me = requireUser();
    const d = db();
    const p = d.posts.find(x => x.id === postId);
    if (!p) return;
    p.shares = p.shares || [];
    p.shares.push({ userId: me.id, at: now() });
    save(d);
  }
  function addComment(postId, text) {
    const me = requireUser();
    if (!text || !text.trim()) return;
    const d = db();
    const p = d.posts.find(x => x.id === postId);
    if (!p) return;
    p.comments.push({ id: DB.uid('cm'), userId: me.id, text: text.trim(), createdAt: now() });
    save(d);
  }
  function getSavedPosts(userId) {
    return db().posts.filter(p => (p.saves || []).includes(userId));
  }

  // ---------- Categories / Destinations ----------
  function listCategories() { return db().categories; }
  function listDestinations({ category, search } = {}) {
    let ds = db().destinations.slice();
    if (category) ds = ds.filter(d => d.category === category);
    if (search) {
      const q = search.toLowerCase();
      ds = ds.filter(d =>
        d.name.toLowerCase().includes(q) ||
        d.country.toLowerCase().includes(q) ||
        d.description.toLowerCase().includes(q)
      );
    }
    return ds;
  }
  function getDestination(id) {
    return db().destinations.find(d => d.id === id) || null;
  }
  function addDestination({ name, country, category, image, description }) {
    const me = requireUser();
    if (me.role !== 'admin') throw new Error('Admin only');
    const d = db();
    const dest = { id: DB.uid('d'), name, country, category, image, description };
    d.destinations.push(dest);
    save(d);
    return dest;
  }

  // ---------- Communities ----------
  function listCommunities() { return db().communities; }
  function getCommunity(id) { return db().communities.find(c => c.id === id) || null; }
  function joinCommunity(id) {
    const me = requireUser();
    const d = db();
    const c = d.communities.find(x => x.id === id);
    if (!c) return;
    if (!c.members.includes(me.id)) c.members.push(me.id);
    save(d);
  }
  function leaveCommunity(id) {
    const me = requireUser();
    const d = db();
    const c = d.communities.find(x => x.id === id);
    if (!c) return;
    c.members = c.members.filter(u => u !== me.id);
    save(d);
  }
  function createCommunity({ name, description, category }) {
    const me = requireUser();
    const d = db();
    const c = { id: DB.uid('c'), name, description, category, members: [me.id] };
    d.communities.push(c);
    save(d);
    return c;
  }

  // ---------- Profile collections (visited / bucket / food / adventures) ----------
  function listCollection(kind, userId) {
    return db()[kind].filter(e => e.userId === userId);
  }
  function addCollection(kind, entry) {
    const me = requireUser();
    const d = db();
    const e = { id: DB.uid(kind[0]), userId: me.id, ...entry };
    d[kind].push(e);
    save(d);
    return e;
  }
  function updateCollection(kind, id, patch) {
    const d = db();
    const e = d[kind].find(x => x.id === id);
    if (!e) return;
    Object.assign(e, patch);
    save(d);
    return e;
  }
  function removeCollection(kind, id) {
    const d = db();
    d[kind] = d[kind].filter(e => e.id !== id);
    save(d);
  }

  // ---------- Reports ----------
  function listReports(status) {
    const rs = db().reports.slice();
    return status ? rs.filter(r => r.status === status) : rs;
  }
  function createReport({ targetType, targetId, reason }) {
    const me = requireUser();
    const d = db();
    const r = {
      id: DB.uid('r'),
      reporterId: me.id,
      targetType, targetId, reason,
      status: 'pending',
      createdAt: now(),
    };
    d.reports.push(r);
    save(d);
    return r;
  }
  function updateReport(id, status) {
    const d = db();
    const r = d.reports.find(x => x.id === id);
    if (!r) return;
    r.status = status;
    save(d);
  }

  // ---------- Analytics ----------
  function influenceScore(userId) {
    const d = db();
    const followers   = followerCount(userId);
    const posts       = d.posts.filter(p => p.userId === userId);
    const likesRcvd   = posts.reduce((s,p) => s + (p.likes||[]).length, 0);
    const sharesRcvd  = posts.reduce((s,p) => s + (p.shares||[]).length, 0);
    const communities = d.communities.filter(c => c.members.includes(userId)).length;
    return followers * 3 + likesRcvd + 2*sharesRcvd + 5*communities;
  }
  function influencerRanking(limit=10) {
    return db().users
      .map(u => ({ ...u, score: influenceScore(u.id), followers: followerCount(u.id) }))
      .sort((a,b) => b.score - a.score)
      .slice(0, limit);
  }
  function trendScore(post) {
    const likes = (post.likes||[]).length;
    const comments = (post.comments||[]).length;
    const shares = (post.shares||[]).length;
    const saves = (post.saves||[]).length;
    const ageDays = (now() - post.createdAt) / (86400_000);
    const recency = 1 / (1 + ageDays * 0.15);
    return (likes + comments*2 + shares*3 + saves*2) * recency;
  }
  function trendingPosts(limit=8) {
    return db().posts
      .map(p => ({ ...p, score: trendScore(p) }))
      .sort((a,b) => b.score - a.score)
      .slice(0, limit);
  }
  function trendingHashtags(limit=10) {
    const counts = {};
    db().posts.forEach(p => (p.hashtags||[]).forEach(h => { counts[h] = (counts[h]||0)+1; }));
    return Object.entries(counts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a,b) => b.count - a.count)
      .slice(0, limit);
  }
  function trendingDestinations(limit=8) {
    const counts = {};
    db().posts.forEach(p => {
      if (!p.destinationId) return;
      counts[p.destinationId] = (counts[p.destinationId]||0)
        + 1
        + (p.likes||[]).length * 0.5
        + (p.saves||[]).length * 0.5;
    });
    const dests = db().destinations;
    return Object.entries(counts)
      .map(([id, score]) => ({ dest: dests.find(d=>d.id===id), score }))
      .filter(x => x.dest)
      .sort((a,b) => b.score - a.score)
      .slice(0, limit);
  }
  function socialGraph() {
    const d = db();
    const nodes = d.users.map(u => ({
      data: {
        id: u.id, label: u.username, name: u.name,
        score: influenceScore(u.id),
        role: u.role,
      }
    }));
    const edges = [];
    for (const from in d.follows) {
      for (const to of d.follows[from]) {
        edges.push({ data: { id: from+'->'+to, source: from, target: to } });
      }
    }
    return { nodes, edges };
  }
  function detectCommunities() {
    // Naive: group users by their most-followed cluster overlap.
    // Fallback — just use the seeded communities as detected clusters.
    return db().communities.map(c => ({
      id: c.id,
      name: c.name,
      size: c.members.length,
      density: Math.min(1, c.members.length / 20),
      members: c.members,
    }));
  }
  function platformStats() {
    const d = db();
    return {
      users: d.users.length,
      posts: d.posts.length,
      destinations: d.destinations.length,
      communities: d.communities.length,
      likes: d.posts.reduce((s,p) => s + (p.likes||[]).length, 0),
      comments: d.posts.reduce((s,p) => s + (p.comments||[]).length, 0),
    };
  }

  // ---------- Export the API ----------
  window.API = {
    // auth
    register, login, logout, currentUser, requireUser,
    // users
    getUser, updateUser, deleteUser,
    follow, unfollow, isFollowing, followerCount, followingCount, whoToFollow,
    // posts
    listPosts, getPost, createPost, deletePost, toggleLike, toggleSave, sharePost, addComment, getSavedPosts,
    // destinations
    listCategories, listDestinations, getDestination, addDestination,
    // communities
    listCommunities, getCommunity, joinCommunity, leaveCommunity, createCommunity,
    // profile collections
    listCollection, addCollection, updateCollection, removeCollection,
    // reports
    listReports, createReport, updateReport,
    // analytics
    influenceScore, influencerRanking, trendScore, trendingPosts, trendingHashtags, trendingDestinations,
    socialGraph, detectCommunities, platformStats,
  };
})();
