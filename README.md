# Sport Spectrum — Hugo multilingual website

Marketing site for **Sport Spectrum**, an AI engine for team sports (football
and volleyball today, more sports planned): computer vision, match analytics
and predictions, presented from the client's point of view.

English, Polish and French live under `/en/`, `/pl/` and `/fr/`; the site root
redirects to `/en/`. No theme and no build tooling beyond Hugo — the same
approach as the other Spectrum Group sites (Aurelian, Basilisk, Poseidon).

## Structure

```text
hugo.toml                     Languages and site config
content/en/_index.md          English copy (all text lives in front matter)
content/pl/_index.md          Polish copy
content/fr/_index.md          French copy
data/win_probability.yaml     Illustrative series for the Predictions chart
layouts/index.html            The page template
layouts/partials/icon.html    Inline line icons
static/css/main.css           Design tokens (light + dark) and layout
static/js/main.js             Theme toggle, mobile menu, reveal, chart
static/favicon.svg            Brand mark
```

Editing names, copy, FAQ entries, sports or roles only needs the three
`_index.md` files — the template reads everything from front matter. Keep the
three files in the same shape (same keys, same list lengths).

## Run locally

```bash
hugo server
```

## Build

```bash
hugo --gc --minify
```

The generated site is written to `public/`. Tested with Hugo 0.118.2 and
0.151.1; when deploying (Cloudflare Pages: build command `hugo --gc --minify`,
output directory `public`) set `HUGO_VERSION=0.151.1` so the build image uses
a known version.

## Screenshots ("In action" section)

The "In action" section shows stills taken from product videos. It stays
hidden until at least one listed image exists, so the page never shows an
empty gallery.

1. Put the images in `static/img/screens/` (16:9 JPG, about 1600 px wide).
2. List them under `gallery.items` in each language file:

```yaml
gallery:
  items:
  - image: img/screens/tracking.jpg
    width: 1600
    height: 900
    alt: Players tracked on a football pitch
    title: Every player, tracked
    text: One short line on what the club gets from this view.
```

The first image is shown full width; the rest sit two per row.

## Notes

- The hero court view and the Predictions chart are labelled as illustrative
  examples; the chart's numbers come from `data/win_probability.yaml`.
- Contact address: `technolog@spectrumai.pl` (in each language file under
  `contact.email`).
