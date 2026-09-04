# wannita901.github.io

Personal site. Astro, plain CSS, GitHub Pages. Push to `main` deploys.

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

**Event / news / talk** → new file `src/content/events/<yyyy-mm-dd>-<slug>.md`

```md
---
date: 2026-10-01
type: talk           # talk | panel | meetup | news | service | hackathon
title: "Talk: ... at ..."
link: https://...
---
```

**Bio, CV rows, socials** → `src/pages/about.astro`, `src/data/cv.ts`, `src/site.ts`.
**CV PDF** → replace `public/cv.pdf`. **Avatar** → replace `public/avatar.svg` (or `.png`, then update `<img src>` in `src/pages/index.astro` and `about.astro`).

## Run locally (optional)

```sh
npm install
npm run dev      # http://localhost:4321
npm run build    # output in dist/
```
