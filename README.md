# wannita901.github.io

Personal site, live at https://wannita901.github.io. Astro, plain CSS, GitHub Pages. Push to `main` deploys (~1 min).

To take the site down temporarily: make the repo private (Settings → Danger zone → Change visibility); Pages stops serving within a few minutes. To bring it back: make it public again and rerun the deploy workflow from the Actions tab.

## Add things

**Blog post** → new file `src/content/blog/<slug>.md`

```md
---
title: "Post title"
date: 2026-09-10
description: "One sentence shown in the list and RSS."
tags: [agents]
---
Body in Markdown.
```
Add `draft: true` to hide it. The URL is `/blog/<slug>/`.

**Project** → new file `src/content/projects/<slug>.md`

```md
---
name: "Tool name"
emoji: "🔧"
group: research      # research | side | hackathon
order: 6             # lower = higher on the page
home: true           # show on the home page
links:
  github: https://github.com/...
  paper: https://arxiv.org/abs/...
---
One sentence about it.
```

**Paper** → append a BibTeX entry to `src/data/publications.bib`. Extra fields the site understands: `venue` (display string), `selected = {true}` (home page), and link fields `pdf, arxiv, doi, code, models, blog, slides`.

**Service / "Latest" item** → new file `src/content/events/<yyyy-mm-dd>-<slug>.md`

```md
---
date: 2026-10-01
position: "Program Committee"
track: "Mining Challenge"     # optional, leave "" if none
venue: "MSR 2027"
link: https://...
---
```

**Bio, "outside work" line, supervision text, social links** → `src/site.ts`. To re-enable X, uncomment its line there.
**Avatar** → `public/avatar.svg` (32×32 pixel art; generator kept at `public/avatar-source.mjs.txt`, variant Y1). Replace the file to change it.

## Run locally (optional)

```sh
npm install
npm run dev      # http://localhost:4321
npm run build    # output in dist/
```
