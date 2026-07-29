# 🌏 TravelConnect (v2 — Fixed & Deployable)

**Social Media Trend Propagation and Community Detection Using Graph Analytics**

A fully-working travel social network you can **open in any browser** or **deploy anywhere** with zero backend setup.

---

## ✨ What's inside

| Page | What it does |
|---|---|
| `index.html`        | Landing page with sample accounts |
| `login.html` / `register.html` | Auth (localStorage session) |
| `home.html`         | Feed: composer + posts + like/save/share/comment · following & saved filters · left/right sidebars |
| `explore.html`      | 24 destinations across 8 categories (adventures, nature, food, culture, photography, beaches, wildlife, mountains) with search + one-click "Visited" / "Bucket list" |
| `profile.html`      | 6 tabs: **Posts · Visited · Bucket List · Food Diary · Adventures · Saved** — full add/edit/remove |
| `communities.html`  | Browse, join, create communities |
| `trends.html`       | Trending posts · hashtags · destinations · click any hashtag to filter |
| `analytics.html`    | **Cytoscape** graph of the follow-network · influencer ranking · detected communities |
| `admin.html`        | Reports queue · user list · add destinations (login as `admin`) |

## 🚀 Run it

### Option 1 — Just double-click
Open `index.html` in any modern browser. That's it. Everything works.

### Option 2 — Local static server (better; needed if you want share links)
```bash
cd travelconnect
# Any of these work — no install needed:
npx serve .                    # Node
python3 -m http.server 8080    # Python
php -S localhost:8080          # PHP
```

### Option 3 — Deploy live (free)

Because it's just static HTML/CSS/JS you can drop the folder on:

- **Vercel** — `vercel` in this folder — recommended. Ships with a preconfigured `vercel.json` (clean URLs + security headers + cache rules)
- **Netlify** — drag & drop the folder on <https://app.netlify.com/drop>
- **GitHub Pages** — push to `main`, enable Pages in Settings → Pages → `/root`
- **Cloudflare Pages** — connect the repo, build command blank, output dir = `/`
- **Render (Static Site)** — new Static Site, build command blank, publish dir = `.`

No env vars. No database. No secrets. It just works.

**Full step-by-step Vercel guide → see [`DEPLOY.md`](./DEPLOY.md).**

## 🔐 Sample accounts

| Username | Password | Role |
|---|---|---|
| `wanderer_sai`  | `password123` | Travel influencer |
| `nina.frames`   | `password123` | Photographer |
| `foodie_arjun`  | `password123` | Food explorer |
| `admin`         | `password123` | Admin |

Or register your own from `register.html`.

## 🗄️ Data & reset

- Everything lives in `localStorage` under `travelconnect_db`.
- The app seeds itself the first time it loads (8 users, 24 destinations, 24 posts, 6 communities, sample entries in each profile section, 1 report).
- **Reset button** in the top-right avatar dropdown → *Reset demo data* wipes everything and reseeds.

## 🧮 Analytics formulas (in `js/api.js`)

| Metric | Formula |
|---|---|
| **Trend score** | `(likes + comments×2 + shares×3 + saves×2) × recency` |
| **Influence score** | `followers×3 + likes_received + 2×shares_received + 5×communities` |
| **Community density** | `min(1, size / 20)` |
| **Trending destination** | `posts + likes×0.5 + saves×0.5` |

Drop in real graph algorithms (Degree Centrality, PageRank, Louvain) inside `js/api.js` to swap the placeholders.

## 📂 Structure

```
travelconnect/
├── index.html         landing
├── login.html
├── register.html
├── home.html          feed
├── explore.html       destinations + 8 categories
├── profile.html       6 tabs
├── communities.html
├── trends.html
├── analytics.html
├── admin.html
├── css/
│   ├── style.css      · global tokens & components
│   ├── home.css       · feed + composer + landing
│   ├── profile.css    · profile header + tabs + entries
│   └── analytics.css  · stats + graph + tables
├── js/
│   ├── db.js          localStorage database + seed data
│   ├── api.js         all "server" functions
│   ├── main.js        navbar + toast + modal + helpers
│   ├── posts.js       post rendering + composer + wiring
│   └── profile.js     profile page + entry forms
├── vercel.json        · Vercel deploy config (headers + caching)
├── .gitignore
├── .nojekyll          · lets GitHub Pages serve _-prefixed files
├── favicon.svg
├── robots.txt
├── README.md
└── DEPLOY.md          · step-by-step Vercel / Netlify / Pages guide
```
> No `package.json` — TravelConnect is pure static HTML/CSS/JS. Vercel auto-detects it as a static site.

## 🐞 Troubleshooting

| Problem | Fix |
|---|---|
| Weird state, want to start over | Click your avatar → **Reset demo data** |
| Images look broken | Images come from Unsplash (needs internet); placeholder tiles will show if offline |
| Analytics graph is empty | Reset demo data — the graph reads the seeded follow-network |
| Deploy shows blank page | Make sure `index.html` is at the deploy root (not inside another folder) |

## 📄 License

MIT.
