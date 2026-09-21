---
title: "Phase 2: Listing and post UX"
status: done
phase: 2
priority: P1
effort: 1h
dependencies: [1]
---

# Phase 2: Listing and post UX

## Overview

Fix listing accessibility and chronology: covers are not links, one URL per card, archive is not silently capped at 60, pager means Older/Newer, tags are not fake nav, first post heading level is `##`.

## Context

- `_layouts/home.html`: featured cover + title + “Read the post” = 3 links; archive cover + title = 2
- Cover links use `aria-hidden="true"` and `tabindex="-1"`
- `slice: 1, 60` hides posts from #62 and under-counts
- Jekyll `page.previous` = newer, `page.next` = older (`site.posts` newest-first)
- Tags render as uppercase meta with no destinations

## Requirements

- Functional: keyboard and SR users get one link per listed post
- Functional: every post after the featured one appears in Archive
- Functional: pager labels match time
- Non-functional: keep current visual layout (cover still shows)

## Architecture

Keep CSS class names `.featured__cover` and `.feed__cover` on **non-interactive** wrappers so `assets/style.css` grid/aspect rules still apply. Title remains the sole link on archive rows. Featured: title is the link; keep the button **or** drop it — keep the button only if the title is **not** a link. Chosen: **title is the only text link; remove “Read the post”** to avoid duplicates. Cover is `<div>`.

Pager: two cells. Left = Older (`page.next`), class `pager__link--prev`. Right = Newer (`page.previous`), class `pager__link--next` (already `text-align: right`). When only one side exists, pin columns:

```css
.pager__link--next { grid-column: 2; }
```

(Already `text-align: right`; add `grid-column: 2` if missing.)

Tags: delete the tag span from `post.html` and `home.html` meta rows. Keep `tags:` in front matter for later.

Archive loop:

```liquid
{% for post in posts offset:1 %}
```

Drop `slice: 1, 60`. Count = `posts.size | minus: 1`. Empty archive section still hidden when only one post.

## Related Code Files

- Modify: `_layouts/home.html`
- Modify: `_layouts/post.html`
- Modify: `_posts/2026-09-20-starting-this-blog.md` (`###` → `##`)
- Modify: `assets/style.css` (pager column pin; optional `scroll-margin-top: 7rem` on `.prose h2`)

## Implementation Steps

1. Featured block: change cover `<a>` to `<div class="featured__cover" aria-hidden="true">`. Remove `tabindex`. Keep `{% include cover.html %}`. Remove the `.btn` “Read the post”. Title `<a>` stays.

2. Archive items: same for `.feed__cover`. Title `<a>` stays.

3. Replace `assign rest = posts | slice: 1, 60` with `offset:1` loop. Count uses `posts.size | minus: 1`. Guard `if posts.size > 1`.

4. `post.html` pager:

    ```liquid
    {% if page.next %}
    <a class="pager__link pager__link--prev" rel="prev" href="{{ page.next.url | relative_url }}">
      <span class="pager__label">Older</span>
      <span class="pager__title">{{ page.next.title }}</span>
    </a>
    {% endif %}
    {% if page.previous %}
    <a class="pager__link pager__link--next" rel="next" href="{{ page.previous.url | relative_url }}">
      <span class="pager__label">Newer</span>
      <span class="pager__title">{{ page.previous.title }}</span>
    </a>
    {% endif %}
    ```

    `rel="prev"` on Older (previous in reading-back time). `rel="next"` on Newer.

5. Remove tag rendering from home featured, home archive, and post header. Leave date + read time.

6. First post: change `### How a new post gets here` to `## How a new post gets here`.

7. CSS: `.pager__link--next { grid-column: 2; }`. Bump `.prose h2 { scroll-margin-top: 7rem; }` for wrapped mobile header.

## Todo

- [x] Covers are non-interactive; one link per card
- [x] Remove featured CTA button
- [x] Uncapped archive with honest count
- [x] Older/Newer pager with column pin
- [x] Hide tags in UI
- [x] Heading `##` on first post
- [x] Pager/scroll-margin CSS

## Success Criteria

- [x] Home HTML: no `aria-hidden` on an `<a>`; featured has a single post URL in the body (title)
- [x] With 1 post: no Archive section (same as now)
- [x] Loop would include post 62 if it existed (no `slice`)
- [x] Pager copy is Older/Newer; lone Newer sits in the right column
- [x] First post outline is `h1` then `h2`
- [x] `prefers-reduced-motion` still kills cover animation (unchanged)

## Risk Assessment

- Removing the button reduces a large hit target. Title is still a full heading link; featured body padding is large. Acceptable.
- `rel="prev/next"` vs time labels: implement exactly as specified; do not also swap Jekyll’s `previous`/`next` objects.

## Security Considerations

None. Static links only.

## Next Steps

Phase 3: fonts, images, Gemfile. May move `.deco` out of `default.html` into `home.html`.
