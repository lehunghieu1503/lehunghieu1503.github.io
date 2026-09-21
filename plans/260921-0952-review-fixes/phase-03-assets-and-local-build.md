---
title: "Phase 3: Assets and local build"
status: done
phase: 3
priority: P2
effort: 1.5h
dependencies: [2]
---

# Phase 3: Assets and local build

## Overview

Cut wasted bytes (fonts, decorative images), stop cache-busting CSS on every post, pin local Jekyll to GitHub Pages 232, and fix leftover dimension/CSS nits.

## Context

Live weights: `hero.jpg` 285KB (2400×1000), `robot.png` 142KB eager then hidden ≤1024px, motifs ~246KB in `default.html` hidden ≤1499px. Google Fonts requests unused weights. `?v={{ site.time }}` on CSS. No Gemfile. `.gitignore` drops `Gemfile.lock`. `page.html` claims portrait 860×1146; file is 860×1075.

## Requirements

- Functional: home still looks the same on a wide desktop (hero, robot mark, motifs)
- Functional: `bundle exec jekyll serve` builds with the same plugin set as Pages
- Non-functional: phones do not download robot/motifs; non-home pages do not download motifs
- Non-functional: no self-hosted font files in this phase

## Architecture

**Fonts.** Keep Google CSS2 + preconnect. Trim the family URL to weights actually used in `assets/style.css`:

- Geist: 400, 600, 700 (drop 500)
- Source Serif 4: 400 italic+roman (drop 600)
- JetBrains Mono: 400, 700 (highlight uses 600 → 700 is close enough; drop 500)

**Robot mark.** Remove `<img class="hero__mark">`. Set `.hero__mark` as an empty absolutely positioned element with `background-image: url("img/robot.png")` inside `@media (min-width: 1025px)` only. Keep mask/size/position rules.

**Motifs.** Cut `.deco` block from `_layouts/default.html`. Paste it into `_layouts/home.html` as the first child of the home output (it already sits inside `main.wrap` via `{{ content }}`). Because home content is injected into `.content` (z-index 1), motifs must remain a sibling of `.content` to sit in the margin.

If putting deco inside `{{ content }}` stacks it under `.content` and clips the right margin, **do not** leave it there. Preferred structure in `default.html`:

```liquid
<main>
  {% if page.layout == 'home' %}
    <div class="deco" aria-hidden="true">…</div>
  {% endif %}
  <div class="content">{{ content }}</div>
</main>
```

That keeps positioning (`main.wrap { position: relative }`) and skips the three `<img>` on About/posts. `loading="lazy"` stays. CSS `display:none` below 1499px remains as a second gate.

**Images.** Recompress JPEG/PNG in place with `magick` or `jpegoptim`/`oxipng` if present. Do not add WebP unless `cwebp` or `magick` exists; if it does, add `hero.webp` and point CSS `background-image` at it with JPEG still in repo as fallback only if CSS can pick one file — **CSS cannot negotiate**. Decision: **recompress JPEG/PNG only**; skip WebP unless a `<picture>` is introduced. Hero is CSS background → no `<picture>`. Recompress `hero.jpg` toward ~120KB if visual quality holds.

**CSS cache.** Stylesheet href becomes `{{ '/assets/style.css' | relative_url }}` with no query.

**Gemfile** (create):

```ruby
source "https://rubygems.org"
gem "github-pages", "~> 232", group: :jekyll_plugins
gem "webrick", "~> 1.8"
```

Remove `Gemfile.lock` from `.gitignore`. Run `bundle lock` / `bundle install` and **commit the lockfile**.

**Nits.** `page.html` width/height 860×1075. Delete unused rules only if footer links from phase 1 did not start using `.site-footer__meta a` — phase 1 **does** use them for Feed; keep those rules. Remove any remaining unused selectors.

## Related Code Files

- Modify: `_layouts/default.html` (fonts URL, deco gate, CSS href)
- Modify: `_layouts/home.html` (remove robot `<img>`)
- Modify: `assets/style.css` (`.hero__mark` as CSS image; dead CSS only if truly unused)
- Modify: `_layouts/page.html` (intrinsic size)
- Modify: `_config.yml` only if a comment is needed (timezone already phase 1)
- Modify: `.gitignore`
- Modify: `README.md` (`bundle exec jekyll serve`)
- Create: `Gemfile`
- Create: `Gemfile.lock` (generated)
- Modify: `assets/img/hero.jpg` (recompress if tools exist)

## Implementation Steps

1. Trim Google Fonts `href` to used weights.
2. Gate `.deco` with `page.layout == 'home'` in `default.html`.
3. Replace robot `<img>` with CSS background under `min-width: 1025px`.
4. Drop CSS cache-bust query.
5. Fix portrait `width`/`height`.
6. Add Gemfile + webrick; stop ignoring lockfile; `bundle install`.
7. Recompress hero (and motifs/robot if easy) without changing filenames.
8. README: local serve command.

## Todo

- [x] Trim font weights
- [x] Motifs only on home
- [x] Robot mark CSS + min-width media
- [x] No `?v=` on CSS
- [x] Portrait intrinsic size matches file
- [x] Gemfile `github-pages ~> 232` + committed lock
- [x] README local build
- [ ] Recompress hero if encoder available (skipped: no `magick`/`jpegoptim`/`oxipng`/`cwebp` on host)

## Success Criteria

- [x] About and post HTML contain zero motif `img` tags
- [x] Home HTML contains no `robot.png` `<img>`; CSS references it only in the wide breakpoint file (or a min-width block)
- [x] Google Fonts URL has no Geist 500 / serif 600 / mono 500
- [x] `bundle exec jekyll build` exit 0
- [x] Built CSS link has no `?v=`
- [ ] Visual check desktop ≥1500px: motifs + robot still visible; ≤1024px: no robot; ≤1499px: no motifs (static checks pass; needs a human eye)

## Risk Assessment

- CSS-only robot may lose `width`/`height` aspect; set `height` + `aspect-ratio` or `background-size: contain`.
- `github-pages` 232 may move; `~>` is enough. If bundle fails on Ruby version, document the Pages Ruby 3.3.4 pin in README.
- Aggressive JPEG recompress banding on hero gradient. Compare before/after; keep original if quality drops.

## Security Considerations

Gemfile from rubygems.org only. No new third-party runtime origins. Fonts still Google (accepted for this phase).

## Next Steps

None in this plan. Optional later: self-host WOFF2, WebP hero via `<img>` instead of CSS background, GH Actions only if a non-whitelist plugin is required.
