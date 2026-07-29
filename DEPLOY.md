# 🚀 Deploy TravelConnect

TravelConnect is a **static site** — pure HTML/CSS/JS. There is **no backend**, no database, no environment variables. It runs anywhere that serves static files.

## 🟣 Vercel (recommended — takes 2 minutes)

### Option A — Vercel CLI (fastest)

1. Install once:
   ```bash
   npm install -g vercel
   ```
2. From inside the `travelconnect/` folder:
   ```bash
   cd travelconnect
   vercel
   ```
3. Answer the prompts:
   - *Set up and deploy?* → **Y**
   - *Which scope?* → your account
   - *Link to existing project?* → **N**
   - *What's your project's name?* → `travelconnect` (or anything)
   - *In which directory is your code located?* → **./** (just press Enter)
   - *Want to modify settings?* → **N**
4. Vercel prints a preview URL. To promote it to production:
   ```bash
   vercel --prod
   ```

Done. Your site is live at `https://travelconnect-<something>.vercel.app`.

### Option B — Vercel dashboard (no CLI)

1. Push this folder to GitHub (public or private repo).
2. Go to <https://vercel.com/new>.
3. **Import** your repo.
4. When it asks for framework preset, choose **Other** — everything else can stay at defaults. **Do not** set a build command or output directory; leave them blank. Vercel will pick up `vercel.json` automatically.
5. Click **Deploy**.

### What `vercel.json` does

The included `vercel.json` gives you:

- Explicit `.html` URLs (matches every `href` in the code — no redirect surprises)
- Security headers (X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy)
- Aggressive caching for CSS/JS/images, no caching for HTML (so updates go live instantly)

Vercel auto-detects this as a **static site** — no framework, no build step, no environment variables.

You can commit and forget.

## 🔵 Netlify

Drag & drop the `travelconnect/` folder onto <https://app.netlify.com/drop>. That's it.

For continuous deploy from git, the settings are:

- **Build command**: *(leave blank)*
- **Publish directory**: `./` (or `travelconnect/` if the folder is nested)

## 🟠 Cloudflare Pages

<https://dash.cloudflare.com/?to=/:account/pages> → *Create project* → connect repo → framework preset **None** → build command blank → output dir `/`.

## 🟢 GitHub Pages

1. Push to a repo, e.g. `github.com/YOU/travelconnect`.
2. Repo → **Settings** → **Pages**.
3. Source = **Deploy from a branch** → branch `main` → folder `/root`.
4. Save. Site is at `https://YOU.github.io/travelconnect/`.

The included `.nojekyll` file is what lets GitHub Pages serve `_`-prefixed files correctly.

## 🟤 Render (Static Site)

<https://dashboard.render.com> → **New +** → **Static Site** → connect repo → build command blank → publish dir `.`.

## 🖥️ Run locally

TravelConnect is a pure static site — there is **no `package.json`**, no build step, no dependencies to install. Pick whichever is easiest:

```bash
cd travelconnect
npx serve .                   # Node
python3 -m http.server 8080   # Python 3
php -S localhost:8080         # PHP
```

Or just double-click `index.html`.

## 🧪 First-load checklist after deploy

Visit your deployed URL and:

1. Click **Log in** → use `wanderer_sai` / `password123`. You should land on `/home`.
2. Open **Explore** → click a category → destinations filter.
3. Open **Profile** → click through the 5 tabs → add a Bucket List entry.
4. Open **Analytics** → the Cytoscape graph should render with 8 nodes.
5. Log out, register a new account, verify you can post from the Feed.

If any of these fails, open the browser DevTools **Console** and read the error — the site does not need any environment configuration to work.

## 🐞 Troubleshooting deploys

| Problem | Fix |
|---|---|
| 404 on every page | You deployed the wrong folder — make sure `index.html` is at the deploy root, not inside a nested `travelconnect/` subfolder. Try `vercel --cwd travelconnect` or unzip the folder contents at the repo root. |
| Blank white page, console error `DB is not defined` | The `<script>` order is wrong — this shouldn't happen with the shipped code. Re-download the zip. |
| Cytoscape graph empty on Analytics | Click your avatar → **Reset demo data**, then refresh. |
| Images don't load | The seed images are from Unsplash. Check your network — if you're behind a corporate proxy that blocks `images.unsplash.com`, the placeholder tiles will render instead. This is expected offline. |
| Login page redirects to home instantly on Vercel | You already have a session in localStorage from a previous visit. Log out from the avatar menu, or open in an incognito window. |
