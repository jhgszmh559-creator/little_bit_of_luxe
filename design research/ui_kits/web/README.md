# Little Bit of Luxe — Web UI Kit

A high-fidelity, click-through recreation of the blog website. Three core surfaces:

1. **Home** — masthead, featured story (full-bleed), latest grid, The Edit rail, newsletter.
2. **Article** — hero, dek, prose body, pull-quote, at-a-glance "Verdict" box, related.
3. **Search / Index** — filtered list with category chips, editorial search input.

## Files

| File | What it is |
| --- | --- |
| `index.html` | Entry — boots React + Babel, mounts the app, handles page routing |
| `components.jsx` | Shared chrome: `Nav`, `Footer`, `Logo`, `Eyebrow`, `Tag`, `Rating`, `ArticleCard`, `Verdict` |
| `HomePage.jsx` | Home page |
| `ArticlePage.jsx` | Single article |
| `SearchPage.jsx` | Search / category index |
| `data.js` | Demo content — articles, destinations, category list |

## Imagery

Demo hero/article photography is loaded from Unsplash CDN URLs for realism. Swap to client assets by replacing the `cover` fields in `data.js`.

## Click-through

- Top-nav links between pages.
- Home → click any article card → Article page.
- Nav `Search` icon → Search page.
- Articles all open the same demo article body (single template demonstrates fidelity).
