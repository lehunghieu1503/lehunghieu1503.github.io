---
title: "Review fixes"
description: "Ship the Jekyll Pages review findings: discoverability, listing/post UX, then assets and local build."
status: completed
priority: P1
effort: 4h
branch: main
tags: [bugfix, frontend, tech-debt]
blockedBy: []
blocks: []
created: 2026-09-21
---

# Review fixes

## Overview

Implement the 2026-09-21 codebase review on this Jekyll GitHub Pages blog. Native Pages stays on Jekyll 3.10 / `github-pages` 232. Stay on the plugin whitelist. No Jekyll 4, no Actions, no new JS.

Mode: **fast**. Scope challenge skipped: task was the already-ranked review list. Research from that review is reused.

## Cross-Plan Dependencies

None. No other unfinished plans in `./plans/`.

## Goals

| # | Goal | Priority |
|---|------|----------|
| 1 | Home title, canonical, OG image, sitemap, 404, post/about descriptions | P1 |
| 2 | One link per card, Older/Newer pager, uncapped archive, heading/tags | P1 |
| 3 | Cut unused font weights, gate decorative images, Gemfile pin | P2 |

## Out of scope

- Jekyll 4 / GitHub Actions / custom plugins
- Self-hosting font files
- Tag taxonomy pages
- Pagination (`jekyll-paginate`) until 60+ posts
- Analytics, light mode, JSON-LD hand-roll
- Full WebP/AVIF pipeline if `cwebp`/`magick` is missing (recompress JPEG/PNG anyway)

## Decisions

| Topic | Choice | Why |
|---|---|---|
| SEO | `jekyll-seo-tag` + `jekyll-sitemap` in `_config.yml`; `{% seo %}` replaces hand-rolled title/description/OG | Whitelisted; `{% seo %}` + manual tags duplicate |
| Feed | Keep `{% feed_meta %}` + add footer link to `/feed.xml` | seo-tag does not emit Atom |
| Social image | Default `image: /assets/img/hero.jpg`; About keeps portrait | Absolute URL via `site.url`; SVG covers cannot be OG images |
| Home title | Remove `title` from `index.md` | Live title is `Posts · notes from the loop` |
| Covers | `<div>` with existing cover classes | `aria-hidden` on `<a>` is invalid |
| Pager | Label Older=`page.next`, Newer=`page.previous`; Older left, Newer right | `site.posts` is newest-first |
| Tags | Keep in front matter; stop rendering in UI | No tag pages |
| Fonts | Trim unused Google Fonts weights | Self-host deferred |
| Motifs | Move markup to home layout | Hidden below 1499px still paid by every page |
| Robot mark | CSS `background-image` inside `min-width: 1025px` | `display:none` does not cancel eager `<img>` |
| CSS cache | Drop `?v={{ site.time }}` | Busts CSS on every post |
| Local build | `Gemfile` `github-pages ~> 232` + `webrick`; commit `Gemfile.lock` | Pages ignores Gemfile; lock is for local parity |

## Phases

| # | Phase | Status |
|---|-------|--------|
| 1 | [Discoverability](./phase-01-start.md) | Done |
| 2 | [Listing and post UX](./phase-02-listing-and-post-ux.md) | Done |
| 3 | [Assets and local build](./phase-03-assets-and-local-build.md) | Done (2 optional items skipped) |

Sequential. `default.html` is edited in phase 1 (head/footer) and phase 3 (fonts, deco removal). Do not parallelize.

## File map

| File | Phases |
|---|---|
| `_config.yml` | 1, 3 |
| `_layouts/default.html` | 1, 3 |
| `index.md` | 1 |
| `about.md` | 1 |
| `_posts/2026-09-20-starting-this-blog.md` | 1, 2 |
| `404.html` | 1 (create) |
| `README.md` | 1, 3 |
| `_layouts/home.html` | 2, 3 |
| `_layouts/post.html` | 2 |
| `_layouts/page.html` | 3 |
| `assets/style.css` | 2, 3 |
| `assets/img/*` | 3 |
| `Gemfile`, `Gemfile.lock`, `.gitignore` | 3 (create/modify) |

## Verification (all phases)

Live today: Jekyll 3.10.0, `/feed.xml` 200, `/sitemap.xml` 404, `/404.html` 404, home `<title>` is `Posts · notes from the loop`.

After cook, before claiming done:

```bash
# local, after phase 3 Gemfile
bundle exec jekyll build
# inspect _site/index.html title, canonical, og:image, no Google Font extra weights
# inspect _site/404.html, _site/sitemap.xml, _site/feed.xml
```

After push to `main`, curl production:

- `/` title is `notes from the loop` (or site title only)
- `<link rel="canonical">` present
- `og:image` absolute HTTPS
- `/sitemap.xml` 200
- unknown URL uses site 404 chrome
- `/feed.xml` still 200

## Success Criteria

- [x] Home document title no longer starts with `Posts ·`
- [x] Canonical, OG image, sitemap, custom 404 exist
- [x] Featured/archive: one focusable link per post; covers are not links
- [x] Pager says Older/Newer in chronological meaning
- [x] Decorative images do not load on mobile / non-home
- [x] `bundle exec jekyll serve` matches Pages plugin set
- [x] No new JS, no non-whitelist plugins

## Deviations from plan

| What | Why |
|---|---|
| Removed the `twitter:` config block | seo-tag 2.8.0 emitted bogus `twitter:site content="@"` / `creator="@Hieu Hung Lee"`; its default card is already `summary_large_image` |
| Removed `.btn` CSS + `--accent-hover` | CTA was deleted in phase 2, leaving dead rules |
| Added `plans/`, `Gemfile`, `Gemfile.lock` to `_config.yml` `exclude` | plan phase 2/3 Liquid in the plan file broke the build, and `Gemfile*` would be copied into `_site` |
| Added `scroll-margin-top: 5rem→7rem` on `h2` (not only phase 2) | matches the wrapped mobile header height |
| First-post code fence lost its `yaml` info string | the raw Liquid tags inside `_layouts/home.html` are not valid Liquid; `yaml` highlighting is irrelevant on Pages and the fence must stay raw |
| Hero recompress skipped | no `magick`/`jpegoptim`/`oxipng`/`cwebp` on the host; plan says recompress only if tools exist |
| `Gemfile.lock` resolved on Ruby 3.3.4 | Pages' Ruby pin; local bundler must match |

## Cook

Done 2026-09-21. Built and verified with `docker run --rm -v "$PWD":/srv/jekyll -w /srv/jekyll jekyll/jekyll:pages bundle exec jekyll build` (exit 0). Archive/pager verified with a 4-post synthetic tree; temp tree removed.

<!-- slug: review-fixes -->
