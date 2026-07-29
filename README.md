# portfolio

Jude Horak's portfolio site, live at **https://ppineapple.github.io/portfolio/**

## How it works

Plain static HTML. No build step, no framework, no dependencies. `.github/workflows/static.yml`
publishes the whole repo to GitHub Pages on every push to `main`.

To change the site, edit `index.html` and push. That's it.

Everything (CSS, the handful of lines of JS, the SVG icons) is inline in `index.html` so there
is nothing to install and nothing to break.

## Files

| File | What it is |
| --- | --- |
| `index.html` | The site. Edit this. |
| `favicon.ico` | Tab icon. |
| `fensteruk.html` | Full-screen wrapper for the Fenster UK voice agent demo. |
| `helpstar.html` | Full-screen wrapper for the Helpstar admin dashboard demo. |
| `script.js` | **Do not delete.** A Voiceflow extension imports this at runtime from the Pages URL (`https://ppineapple.github.io/portfolio/script.js`). Gemini Live screen-share + audio assistant. |
| `local_script.js` | The Voiceflow extension source that loads `script.js`. Paste-in reference, not used by the site. |

## History

Until July 2026 `index.html` was a full-page iframe pointing at a Next.js app on Cloud Run
(`portfolio-6698076432.us-central1.run.app`), whose source was never committed anywhere. That
content was stale (2024 projects, generic bio) and unmaintainable. The site was rebuilt as
self-contained static HTML in this repo so it can actually be kept current. The old Cloud Run
service is no longer referenced.
