# Changelog

## v1.0.4

### New Features
- **Hover to preview card images** — On the Collection and Add Cards pages, hovering over a card row now in the table view shows a large image of the card near the cursor after a short pause.
- **Sort by mana value** — Card lists can now be sorted by mana value, in addition to name, set code, and collector number.

### Bug Fixes
- **More accurate statistics** — Fixed casing issues that could cause colors and other stats to be miscounted.
- **More reliable searching** — Fixed several database querying issues, including a bug where a card's file ending was mishandled during search.

### Improvements
- **Faster, more maintainable database layer** — The card database has been reorganized into modular queries and rewired for more reliable data management, laying the groundwork for future features.

## v1.0.3

### Bug Fixes
- **Card images now load again** — Scryfall began rejecting requests that didn't send a custom User-Agent, which caused card images to fail with a 400 error and show as blank. All requests now send a proper User-Agent.

### Improvements
- **More reliable image downloads** — Card image fetches now have a timeout and write to the cache without blocking, so a slow or stalled download no longer hangs image loading.
- **Added new distribution targets** — Now windowsx64 and windowsx32 can be chosen for install. 

## v1.0.2

### New Features
- **Configurable default page size** — You can now set the default number of cards shown per page (30, 60, or 120) from **Settings → Appearance**. This applies to both the Collection and Add Cards pages.

### Improvements
- **Better filtering on Add Cards** — Rarity, color, color-mode, and token filters now only trigger a search once the card name or set code reaches its minimum length, avoiding premature/empty searches. Filters selected before a valid search are applied as soon as the search becomes valid.
- **Token filter now searches** — Changing the token (cards/tokens) filter correctly triggers a new search.
- **Reworked Add Cards batch panel** — The batch panel is no longer collapsible, stays pinned in view as you scroll, and its counter now shows the **total number of cards** to add rather than the number of distinct printings.
- **Whole-page scrolling** — The Add Cards and Collection pages now scroll as a single page instead of having a separate inner scrollbar on the card results.
- **"Statistics" renamed to "Home"** — Updated the sidebar label, icon, and page heading.
- **Set symbol rendering for promos** — Improved how set symbols render for promo cards.
