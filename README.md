# tinker log

Technical blog built with Jekyll, hosted on cPanel at tinkerlog.io.vn.

Live: https://tinkerlog.io.vn

## Writing

Add a post: create `_posts/YYYY-MM-DD-title.md`. Front matter needs `title` and a
`description` (used for the meta description and social cards); `layout: post` is
applied by default. Push to `main`. The `Deploy` GitHub Actions workflow builds the site and uploads `_site/` to the hosting over FTPS.

## Local build

The deploy workflow and local builds both use the `Gemfile` + committed
`Gemfile.lock`, so a local build matches production. The lockfile needs
Ruby 3.2 or newer; CI runs Ruby 3.3 with Bundler 2.5.11, so use those locally.

```bash
bundle install
bundle exec jekyll serve
```

Then open http://127.0.0.1:4000.

Docker alternative, no Ruby toolchain needed (same Ruby as CI, gems from the lockfile):

```bash
docker run --rm -it --user "$(id -u):$(id -g)" -e HOME=/tmp -e BUNDLE_PATH=/tmp/bundle \
  -v "$PWD":/srv -w /srv -p 4000:4000 ruby:3.3 \
  bash -c "bundle install && bundle exec jekyll serve --host 0.0.0.0"
```

## Generated files

- `/feed.xml` — Atom feed, from `jekyll-feed` (linked in the footer)
- `/sitemap.xml` — from `jekyll-sitemap`
- `/404.html` — custom not-found page, excluded from the sitemap
- Social/meta tags come from `jekyll-seo-tag` (`{% seo %}` in `_layouts/default.html`)
