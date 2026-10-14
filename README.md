# aishwary03.dev

Personal site: plain HTML and CSS, no build step.

| File | What it is |
|---|---|
| `index.html` | The whole page. All content lives here. |
| `styles.css` | Colours, type and layout. The palette is at the top. |
| `script.js` | All the motion and interaction (listed below). The page still reads fine without it. |
| `favicon.svg` | Browser-tab icon. |
| `assets/` | Put your photo, screenshots and thumbnails here. |

## Preview it

Open `index.html` in a browser, or run a local server from this folder:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

## What moves

- **Header:** your name types itself out on the first load of a visit, then the caret blinks and disappears.
- **Name:** letters get heavier and wider near the cursor (Martian Mono's weight and width axes). On phones, a slow wave runs through them instead.
- **Role line:** the phrase in `data-words` cycles every few seconds with a scramble. Edit the phrases there, separated by `|`.
- **Oscilloscope band:** two live traces under the hero; the amber one reacts to the cursor. It shows your local time.
- **Project cards:** stick and stack as you scroll on wider screens, with a soft spotlight that follows the cursor.
- **Section headings:** stretch from narrow to wide as they scroll into view.
- **Writing and videos:** shows "Coming soon" for Medium, YouTube and Instagram. The finished tabbed version (Writing, Shorts, Reels) is saved in `<template id="media-tabs">` in `index.html`; swap it in when you have content.
- **Testimonials:** crossfade every 10 seconds, pausing on hover; the arrows take over.
- **Contact:** the email reacts to the cursor like the name; the clock shows the time in India.
- Header progress bar, active-section dot, magnetic buttons and a tilting photo.

Everything respects the "reduce motion" setting in the visitor's OS: animation stops and the page shows its final state.

## Fill in the placeholders

Every placeholder is in square brackets, like `[Project title]`, and each block has a
`<!-- REPLACE: ... -->` comment above it saying what goes there. Search `index.html` for `[`
and `REPLACE` to find them all.

Your profile already fills the hero, projects, services, experience, About and toolbox.
Still to fill in:

- [ ] When ready: Medium posts, Shorts and Reels (swap in the `media-tabs` template), plus their profile links in Contact
- [ ] A larger photo when you have one (about 1000 px wide): replace `assets/photo.jpg`

### Adding images

Save images in `assets/`, then replace a placeholder box with an `<img>`:

```html
<!-- Project screenshot: replace the whole <div class="card-shot placeholder">…</div> -->
<img class="card-shot" src="assets/project-1.png" alt="What the screenshot shows">

<!-- Short or Reel thumbnail: replace the play button inside .reel-thumb, and remove "placeholder" from its class -->
<span class="reel-thumb"><img src="assets/short-1.jpg" alt=""></span>

<!-- About photo -->
<img class="about-photo tilt" src="assets/photo.jpg" alt="Aishwary Agrawal">
```

Keep images small: export screenshots at about 1600 px wide and thumbnails at about 600 px
tall, as JPG or WebP.

## Deploy

Pick one; both are free and serve HTTPS, which `.dev` domains require.

**GitHub Pages**
1. Push this folder to a GitHub repository.
2. In the repository, open Settings → Pages, set Source to "Deploy from a branch", branch `main`, folder `/ (root)`.
3. The site goes live at `https://<username>.github.io/<repo>/` within a minute or two.

**Cloudflare Pages**
1. Push this folder to GitHub.
2. In the Cloudflare dashboard, create a Pages project and connect the repository.
3. Leave the build command empty and set the output directory to `/`.

### Custom domain

After buying `aishwary03.dev`, add it in your host's custom-domain settings and create the
DNS records the host shows you at your registrar. Then turn on "Enforce HTTPS" (GitHub
Pages) or wait for the certificate (Cloudflare, automatic).

## Link previews

`assets/og-image.png` (1200 × 630) is the image LinkedIn, WhatsApp, Slack and X show when someone shares the site. The `og:image`, `twitter:image` and `og:url` tags in `<head>` point to `https://infinite-loop03.github.io/`; switch them to `https://aishwary03.dev/` once the domain is connected. After going live, check how a link looks with LinkedIn's Post Inspector (linkedin.com/post-inspector), which also refreshes LinkedIn's cached preview.
