---
title: "Phase 1: Discoverability"
status: done
phase: 1
priority: P1
effort: 1.5h
dependencies: []
---

# Phase 1: Discoverability

## Overview

Fix live SEO/share bugs: home title, missing canonical/OG image/sitemap/404, weak descriptions. Switch head metadata to `jekyll-seo-tag` while keeping Atom autodiscovery.

## Context

- Review: live `/` title is `Posts · notes from the loop`
- `jekyll-seo-tag` 2.8.0 and `jekyll-sitemap` 1.4.0 are GH Pages whitelist
- `{% feed_meta %}` already emits `/feed.xml` (200)
- Docs: https://pages.github.com/versions/ · https://github.com/jekyll/jekyll-seo-tag · https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-custom-404-page-for-your-github-pages-site

## Requirements

- Functional: crawlers and social cards get site title, canonical URL, absolute OG image, sitemap, custom 404
- Functional: About and the first post have explicit `description` (not a truncated first paragraph with stray newlines)
- Non-functional: no duplicate `<title>` / `og:*` tags; stay on native Pages plugins

## Architecture

`_config.yml` `plugins:` is the only list Pages honors. `{% seo %}` owns `<title>`, description, canonical, Open Graph, Twitter, JSON-LD. Delete the hand-rolled tags in `_layouts/default.html` that overlap. Keep charset, viewport, color-scheme, theme-color, favicon, fonts, stylesheet, `{% feed_meta %}`.

Default social image is `hero.jpg` via `defaults` (wide, already used on home). About already has `image:` in front matter; seo-tag will prefer that.

## Related Code Files

- Modify: `_config.yml`
- Modify: `_layouts/default.html`
- Modify: `index.md`
- Modify: `about.md`
- Modify: `_posts/2026-09-20-starting-this-blog.md`
- Modify: `README.md` (mention 404 / feed if needed)
- Create: `404.html`

## Implementation Steps

1. `_config.yml` plugins become:

    ```yaml
    plugins:
      - jekyll-feed
      - jekyll-seo-tag
      - jekyll-sitemap
    ```

    Add:

    ```yaml
    lang: en
    timezone: Asia/Ho_Chi_Minh
    twitter:
      card: summary_large_image
    defaults:
      - scope:
          path: ""
        values:
          image: /assets/img/hero.jpg
      - scope:
          path: ""
          type: posts
        values:
          layout: post
    ```

    Keep existing `url`, `title`, `description`, `author`.

2. `index.md`: remove `title: Posts`. Leave `layout: home`.

3. `about.md`: add `description:` equal to `lead` (or a 1-sentence variant ≤160 chars). Keep `image` / `image_alt`.

4. First post: add `description:` of the opening sentence. Do not change body yet (heading fix is phase 2).

5. `_layouts/default.html` `<head>`:
   - Keep charset, viewport, color-scheme, theme-color, favicon, font links, stylesheet, home hero preload, `{% feed_meta %}`
   - Insert `{% seo %}`
   - Delete the Liquid `<title>`, `meta name="description"`, and all `og:` / `twitter:` tags

6. Footer: add a text link `Feed` → `{{ '/feed.xml' | relative_url }}` next to author. Reuse `.site-footer__meta a` styles (already in CSS).

7. Create `404.html`:

    ```yaml
    ---
    layout: default
    permalink: /404.html
    title: Page not found
    sitemap: false
    ---
    ```

    Short prose + link back to `/`. `sitemap: false` keeps it out of `jekyll-sitemap`.

## Todo

- [x] Enable seo-tag + sitemap + defaults image + post layout default + timezone
- [x] Drop home `title: Posts`
- [x] Explicit descriptions on About and first post
- [x] Replace hand-rolled head tags with `{% seo %}`; keep `{% feed_meta %}`
- [x] Footer Atom link
- [x] Custom `404.html` excluded from sitemap

## Success Criteria

- [x] Built `/index.html` `<title>` is site title only (no `Posts ·`)
- [x] `<link rel="canonical">` and absolute `og:image` on home, about, post
- [x] About/post meta description is the front-matter `description`, not a leftover newline excerpt
- [x] `_site/sitemap.xml` lists `/`, `/about/`, the post; omits 404
- [x] `_site/404.html` uses site chrome
- [x] One `<title>` and one `og:title` per page
- [x] `/feed.xml` still generated

## Risk Assessment

- `{% seo %}` + leftover manual tags → duplicate meta. Mitigation: delete overlapping tags in the same edit.
- `jekyll-titles-from-headings` (always-on on Pages) filling a title on empty `index.md`. Mitigation: page has no markdown heading; verify built title.
- `defaults` image on About overridden by page `image` (desired).

## Security Considerations

Public email/GitHub/LinkedIn stay as they are. No new third parties beyond existing Google Fonts (phase 3 trims them).

## Next Steps

Phase 2: listing/post UX. Head is frozen except phase 3 font/deco/cache-bust edits.
