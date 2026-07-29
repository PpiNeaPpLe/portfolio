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
| `favicon.ico` | Tab icon (16/32/48/64/128/256 in one file). |
| `favicon-32.png` | PNG tab icon for browsers that prefer it. |
| `apple-touch-icon.png` | 180x180 iOS home-screen icon. Square and full-bleed; iOS rounds it itself. |
| `icon-192.png` | Android home-screen icon, referenced by the manifest. |
| `site.webmanifest` | Name, theme colour, and icons for home-screen installs. |
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

The favicon was a serif "JH" monogram with arced "JUDE HORAK" text inside a black circle. It
turned to mush below about 64px and vanished against dark tab bars. Replaced with a brand-orange
squircle and a heavy condensed "JH", which still reads at 16px.

To regenerate the icons (needs Pillow, macOS for the Helvetica Neue path):

```
cd tools && python3 final.py
```

`mkfav.py` holds the drawing code and can emit a contact sheet of alternates at real tab sizes.
