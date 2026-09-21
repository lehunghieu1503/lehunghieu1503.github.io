# 2026-09-21 — Review fixes for the Jekyll Pages blog

Plan: `plans/260921-0952-review-fixes/` (3 phases, all done)

## Why

A codebase review ranked concrete defects on the live GitHub Pages blog
(`lehunghieu1503.github.io`): the home `<title>` read `Posts · notes from the
loop`, there was no canonical URL, no OG image, no sitemap, no custom 404, and
no post descriptions. The listing had three links per featured card with
`aria-hidden` on an `<a>`, an archive silently capped at 60 posts, a
Previous/Next pager that read backwards in time, decorative motifs downloaded
on every page, and an eager 142 KB `robot.png` hidden by CSS on phones.

## What changed

**Discoverability** — `jekyll-seo-tag` + `jekyll-sitemap` added to the native
Pages whitelist plugin set; every hand-rolled `<title>`/`og:*`/`description`
tag removed from `_layouts/default.html` in favour of `{% seo %}`. Added
`lang`, `timezone: Asia/Ho_Chi_Minh`, a default `image` and a default
`layout: post` for posts. Explicit front-matter `description` on About and the
first post. New `404.html` with `sitemap: false`. Footer gains a Feed link.

**Listing and post UX** — covers became non-interactive `<div aria-hidden>`
carrying the same class names, so the CSS grid rules keep working while each
post card exposes exactly one link (its title). The featured `Read the post`
button and its `.btn` CSS were deleted. The archive loop moved from
`slice: 1, 60` to `offset: 1` with an honest `posts.size - 1` count. The pager
now says Older (`page.next`, `rel=prev`, left) and Newer (`page.previous`,
`rel=next`, right) with `grid-column: 2` pinning a lone Newer to the right.
Tags stay in front matter but are no longer rendered. First post heading
`###` → `##`.

**Assets and local build** — Google Fonts trimmed to the weights actually used
(Geist 400/600/700, Source Serif 4 roman+italic 400, JetBrains Mono 400/700).
Motifs gated to `page.layout == 'home'`. `robot.png` converted from an eager
`<img>` to a CSS background inside `@media (min-width: 1025px)`, with an
explicit `width` so `background-size: contain` cannot collapse it. Dropped the
CSS cache-bust query. A `Gemfile` (`github-pages ~> 232`, `webrick`) plus a
committed `Gemfile.lock` now pin local builds; `Gemfile.lock` left `.gitignore`.

## Decisions worth remembering

- **seo-tag owns the head.** Duplicating `og:title` by hand was the old bug;
  do not reintroduce manual social tags.
- **`twitter:` block was removed, not fixed.** seo-tag 2.8.0 gates
  `twitter:site` on the presence of `site.twitter`, so a card-only block
  emitted `content="@"`. Its default card is already `summary_large_image`.
- **`plans/` must stay excluded in `_config.yml`.** The plan markdown contains
  raw Liquid examples with unbalanced `{% for %}` and broke `jekyll build`.
- **The archive offset loop is intentionally uncapped.** Pagination is out of
  scope until 60+ posts, but hiding posts is not acceptable.
- **Recompress skipped.** No `magick`/`jpegoptim`/`oxipng`/`cwebp` on the host;
  hero stays 285 KB for now.

## Evidence

`docker run --rm -v "$PWD":/srv/jekyll -w /srv/jekyll jekyll/jekyll:pages
bundle exec jekyll build` exits 0 on Jekyll 3.10.0. Built output checked for:
single `<title>`/`og:title`, canonical, absolute `og:image`, `/sitemap.xml`
without 404, `/404.html`, `/feed.xml`, no motif tags off-home, no
`robot.png` `<img>`, no `?v=` on the stylesheet. Archive/pager verified against
a throwaway 4-post tree (3 entries listed, 1 link per card, oldest post shows
only Newer).

## Left over

- Visual pass at ≥1500px / ≤1024px / ≤1499px still wants a human eye.
- Hero recompress once an encoder is available.
- Self-hosted WOFF2 and WebP hero are the next asset wins.
