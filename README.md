# notes from the loop

Technical blog on GitHub Pages (Jekyll).

Live: https://lehunghieu1503.github.io

## Writing

Add a post: create `_posts/YYYY-MM-DD-title.md`. Front matter needs `title` and a
`description` (used for the meta description and social cards); `layout: post` is
applied by default. Push to `main`. GitHub Pages rebuilds the site.

## Local build

GitHub Pages ignores the `Gemfile` and uses its own pinned plugin set; the
`Gemfile` + committed `Gemfile.lock` are only here so a local build matches
production closely.

```bash
bundle install
bundle exec jekyll serve
```

Then open http://127.0.0.1:4000.

Docker alternative, no Ruby toolchain needed:

```bash
docker run --rm -it -v "$PWD":/srv/jekyll -p 4000:4000 \
  jekyll/jekyll:pages jekyll serve --host 0.0.0.0
```

## Generated files

- `/feed.xml` — Atom feed, from `jekyll-feed` (linked in the footer)
- `/sitemap.xml` — from `jekyll-sitemap`
- `/404.html` — custom not-found page, excluded from the sitemap
- Social/meta tags come from `jekyll-seo-tag` (`{% seo %}` in `_layouts/default.html`)
