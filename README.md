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
0.151.1.

## Deploy (Netlify)

`netlify.toml` holds the whole setup, so a new Netlify site only needs this
repository connected; the build command, publish directory and Hugo version
come from the file.

- **Build:** `hugo --gc --minify --cleanDestinationDir -b $URL` with
  `HUGO_VERSION = 0.151.1`. Netlify builds from source, so edits made
  straight on GitHub go live without rebuilding `public/` by hand.
  `--cleanDestinationDir` clears the committed `public/` first, so files
  deleted from the source never linger on the live site.
- **Addresses:** `$URL` is the site's primary address (the custom domain once
  one is set in Netlify), so canonical links, hreflang and the sitemap always
  point at the live domain. Deploy previews and branch deploys use their own
  address. `baseURL` in `hugo.toml` is only used for local builds.
- **Language redirect:** `/` sends Polish browsers to `/pl/`, French browsers
  to `/fr/` and everyone else to `/en/` (302, based on the browser's first
  preferred language).
- **Headers:** `nosniff`, a strict referrer policy and `SAMEORIGIN` framing on
  every page.

If Netlify's Hugo download fails during a build, switch temporarily to
publishing the committed build, as the Basilisk site does: rebuild `public/`
locally with `hugo --gc --minify -b https://<your-domain>/`, commit it, and
set `command = "echo 'Publishing prebuilt public/'"` in `netlify.toml`.

## Screenshots ("In action" section)

The "In action" section shows stills from Sport Spectrum's annotated match
videos. It stays hidden until at least one listed image exists, so the page
never shows an empty gallery.

1. Put the images in `static/img/screens/` (2:1 JPG, at least ~800 px wide,
   with any player UI such as Vimeo controls cropped out and sponsor logos
   removed).
2. List them under `gallery.items` in each language file:

```yaml
gallery:
  items:
  - image: img/screens/tracking.jpg
    width: 960
    height: 480
    alt: Players tracked on a football pitch
    title: Every player, tracked
    text: One short line on what the club gets from this view.
```

Add `wide: true` to an item to show it full width above the grid, at its
own aspect ratio (used for the top-down map frame). The rest sit three per
row on desktop (a last row of two shares the width), two per row on tablets
(an odd last one is centred) and one per row on phones. They are not linked to a full-size
view, so keep each file at the size it should be seen at — crop, don't upscale.

## Notes

- The hero court view and the Predictions chart are labelled as illustrative
  examples; the chart's numbers come from `data/win_probability.yaml`.
- Contact address: `technolog@spectrumai.pl` (in each language file under
  `contact.email`).
