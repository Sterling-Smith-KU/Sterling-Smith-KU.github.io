# Sterling Smith — Personal Site

A fast, static, dependency-free personal site. Built from your LinkedIn, styled
in the spirit of [lusion.co](https://lusion.co/) and [matthewbisbee.com](https://matthewbisbee.com/).

---

## Files

| File | What it is |
| --- | --- |
| `index.html` | The home page. All content lives here. |
| `styles.css` | All styling. Colors and spacing at the top as CSS variables. |
| `script.js` | Custom cursor, scroll reveals, magnetic buttons, scroll progress. |
| `page-template.html` | Boilerplate to duplicate when adding a new page. |

No build step, no framework. Open `index.html` in any browser and it works.

---

## Previewing locally

Just double-click `index.html`. That's it.

For a cleaner experience (so relative paths and fonts load exactly as they will in production), run a one-line local server from this folder:

```bash
# any of these work — pick whichever you have installed
python -m http.server 8000
npx serve .
php -S localhost:8000
```

Then open <http://localhost:8000>.

---

## Editing content

Every editable part of `index.html` has an `EDIT:` comment above it. Use your
browser's **Ctrl+F** inside the HTML to find them fast.

### Add a new job/role

1. Open `index.html`
2. Find `EXPERIENCE`
3. Copy one `<li class="exp__item">...</li>` block and paste it where you want
   it in the timeline (newest first)
4. Change the date, title, org, and description

### Add a new school

Same idea — find `EDUCATION` and duplicate an `<article class="edu__item">` block.

### Edit skills / languages / certifications

Find `<div class="edu__strips">` near the end of the Education section. Add or
remove `<li>` items inside any of the three `<ul>`s.

### Change your name, headline, or bio

- Hero name: look for `<h1 class="hero__title">`
- Headline/subtitle: look for `<div class="hero__sub">`
- About paragraphs: look for `<section id="about">`

### Change contact info

Look for `<section id="contact">`. Update `href="mailto:..."`, `href="tel:..."`,
and the LinkedIn URL. The visible text lives inside `<span class="contact__value">`.

---

## Adding a new page

1. Duplicate `page-template.html` and rename the copy (e.g. `projects.html`)
2. Edit the `<title>`, the hero heading, and the body sections inside `<main>`
3. Add a link to it in **both**:
   - `index.html` → inside `<nav class="nav__links">`, add
     `<a href="projects.html" data-cursor="link">Projects</a>`
   - `page-template.html` (and any existing pages) → same thing, so the nav
     stays consistent across pages

The template already pulls in `styles.css` and `script.js`, so cursor, reveals,
and magnetic hover will work automatically.

---

## Tweaking the design

Open `styles.css`. Everything visual is driven by the CSS variables at the top:

```css
:root {
  --bg: #0b0b0c;          /* page background */
  --fg: #ededea;          /* main text color */
  --accent: #ff5a1f;      /* the orange — change this to re-theme */
  --f-serif: "Fraunces"…  /* display font */
  --f-sans: "Inter"…      /* body font */
}
```

Change `--accent` to anything (`#4f46e5`, `#22c55e`, etc.) and the whole site
re-skins.

To swap fonts, change the `<link href="https://fonts.googleapis.com/css2?…">`
in `index.html` and update the two `--f-*` variables.

---

## Deploying — pick one

All three of these host static sites **free, forever**, with HTTPS included.

### Option A — GitHub Pages (permanent `sterlingku.github.io`)

1. Create a free GitHub account
2. Create a new **public** repo named exactly `<your-username>.github.io`
3. Drop these files in the repo root (via the website — no Git required)
4. Your site is live at `https://<your-username>.github.io` within a minute

### Option B — Netlify (drag-and-drop, no account quirks)

1. Sign up free at [netlify.com](https://app.netlify.com/drop)
2. Drag this whole `Website` folder onto the drop zone
3. Live at `https://<random-name>.netlify.app` instantly — rename in site settings

### Option C — Vercel

1. Sign up free at [vercel.com](https://vercel.com/)
2. Click **Add New → Project → Import** and point it at a GitHub repo, **or**
   run `npx vercel` in this folder
3. Live at `https://<name>.vercel.app`

### Free custom domains (if you don't want the default subdomain)

Subdomain hosts give you a free URL like `sterlingku.github.io`. If you want
something shorter and unique:

- **[is-a.dev](https://www.is-a.dev/)** — free `sterling.is-a.dev` for developers/students. Requires a GitHub PR (5 min).
- **[js.org](https://js.org/)** — free `sterling.js.org` for JS-related projects.
- **Cloudflare Pages** — same as Vercel/Netlify, with optional free custom domain if you already own one.

True top-level domains (`.com`, `.me`, `.dev`) all cost money (~$10/yr). Namecheap
and Cloudflare Registrar sell them near cost if you decide to upgrade later.

---

## Accessibility + performance notes

- Respects `prefers-reduced-motion` — animations disable if you've turned them off.
- Custom cursor auto-disables on touch devices and small screens.
- No external JS dependencies. Two Google Fonts only.
- Semantic HTML, skip-to-content link, keyboard navigable.

---

## When you come back to this later

Everything is plain HTML/CSS/JS. There is no build, no install, no package
manager. Edit, save, refresh the browser. That's the whole loop.

If you want help adding a blog, a project detail page, or a resume PDF download,
just ask — the scaffolding is ready for it.
