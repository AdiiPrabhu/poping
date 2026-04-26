# Poping — Coming Soon page

Standalone, dependency-free landing page. Drop the folder onto GitHub Pages, Netlify, Cloudflare Pages, or any static host. Everything lives in three files: `index.html`, `styles.css`, `script.js`. Submissions write to a Google Sheet via a tiny Apps Script.

```
coming-soon/
├── index.html              ← the page
├── styles.css              ← brand tokens + animations
├── script.js               ← Marvel-intro flying text + signup handler
├── google-apps-script.gs   ← paste into Apps Script bound to a Sheet
└── README.md               ← you are here
```

## Run locally

No build, no toolchain. Open the file directly:

```bash
open coming-soon/index.html
# or, with live-reload via any static server:
npx serve coming-soon
```

## Hook up Google Sheets (5 min)

1. Create a Google Sheet called **Poping waitlist**.
2. In row 1, add headers (left → right): `timestamp · email · source · user_agent · referrer`.
3. Sheet → **Extensions** → **Apps Script**.
4. Paste the contents of [`google-apps-script.gs`](./google-apps-script.gs). Save.
5. **Deploy** → **New deployment** → Type **Web app**:
   - **Execute as:** Me
   - **Who has access:** Anyone
6. Authorize the access prompts (Drive + Sheets).
7. Copy the **Web app URL** (ends in `/exec`).
8. Open `script.js` and replace:
   ```js
   const SHEETS_ENDPOINT = 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE';
   ```
   with the URL you copied. Commit + redeploy.

> While `SHEETS_ENDPOINT` is unset, signups write to `localStorage` as a fallback so the form still feels alive in dev. Check `localStorage.getItem('poping_signups')` in the console.

## Deploy to GitHub Pages

```bash
# from a fresh repo (replace USER and REPO)
cd coming-soon
git init && git add . && git commit -m "init coming-soon"
git branch -M main
git remote add origin git@github.com:USER/REPO.git
git push -u origin main
```

Then in the GitHub repo: **Settings** → **Pages** → **Source: Deploy from branch** → **Branch: main / root**. Pages serves at `https://USER.github.io/REPO/`.

For a custom domain (`poping.app`), set the `CNAME` file inside `coming-soon/`:
```bash
echo "poping.app" > coming-soon/CNAME
```
…and point your DNS:
- `poping.app` → A records of `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
- `www.poping.app` → CNAME `USER.github.io`

## What it does visually

- **Marvel-intro flying text** — words like `BROOKLYN`, `TECHNO`, `B2B`, `AFTERS`, `IYKYK`, `OPEN LATE` zoom past the camera in 3D perspective with chromatic ghost-shadows. Triggered every ~480 ms via `requestAnimationFrame`. Pauses when the tab is hidden. Respects `prefers-reduced-motion`.
- **Glowing brand dot** — pulsing accent next to the wordmark.
- **Glassy email row** — `backdrop-filter: blur(16px)` with a focus ring in the brand lime.
- **Marquee ticker** — venue names + tags scrolling left, masked at the edges.
- **Three pillars** — venues post / artists run their own / fans tap-scan-in. Hover lifts.

## Editing copy

All copy lives in `index.html`. Update the headline, lede, pillars, etc. directly there. The flying-text words are the `FLYER_WORDS` array at the top of `script.js` — add venue names or genres as you sign deals.

## Brand tokens (CSS variables)

`styles.css` declares all colors at `:root`:
```css
--bg:        #080808;
--fg:        #F0EFE8;
--accent:    #D4FF3A;   /* lime */
--magenta:   #FF2EA6;
--electric:  #2E5BFF;
--ultraviolet: #6B2EFF;
```
Every other surface derives from these.
