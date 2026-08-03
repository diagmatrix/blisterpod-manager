# Changelog

## v1.0.5

### New Features
- **Sort by several columns at once** — Card lists can now be sorted by more than one column. Click a column to add it to the sort, click it again to flip its direction, and the badge shows its position in the order. Remove a column with its badge, then press **Sort** to apply the whole chain.
- **Manabox import and export** — Manabox joins Blisterpod, Moxfield and Google Drive as an import format, and Blisterpod and Moxfield as an export format.
- **Reset filters on Add Cards** — A reset button clears the search, filters and sorting in one go, matching the one already on the Collection page.
- **Database location in Settings** — **Settings/Diagnostics** now shows where the collection database lives, next to the log file path.
- **Rebuilt About page** — Attributions and disclaimers are easier to read, the full changelog is now visible inside the app, and there is a direct link to the project on GitHub.

### Bug Fixes
- **Card names with quotation marks import correctly** — Names such as `Kongming, "Sleeping Dragon"` lost their quotes when a CSV was read back in. Doubled quotes are now decoded the same way they are written out, so a card exported from the app re-imports unchanged.
- **Imported cards keep their original dates** — The `created_at` and `updated_at` values in a Blisterpod CSV were parsed and then discarded, so every imported card was stamped with the time of the import. They are now stored as given, and only fall back to the current time when the file does not supply them.
- **Imports no longer fail silently** — A file that could not be read, or a card that could not be inserted, produced no visible result. Both now report how many cards landed and list the reasons behind a **show import issues** dialog.

### Improvements
- **Clearer import and export feedback** — Both show a running state while they work, report the number of rows handled, and put any problems behind a dialog rather than discarding them. A failure no longer leaves the button stuck mid-transfer, and the same file can be retried straight away.
- **Consistent import and export controls** — Picking a format now works the same way on both sides, from a single provider selector.
- **No menu bar in packaged builds** — The developer menu bar is no longer shown in released versions of the app.

### Development
These changes do not affect how the app behaves, but they are groundwork for keeping it stable.
- **Separate development database** — Running in development mode now automatically uses `test_collection.db`, so day-to-day work can never touch a real collection.
- **Wider test coverage** — Added tests for the three export handlers against the real schema and real files on disk, for CSV parsing across all four import formats, and for the sorting, import, export and About page components.
- **Shared types renamed** — `src/shared` is now `src/models`, which better describes what it holds.
- **Enforced code style** — Indentation and trailing whitespace are now checked by ESLint and described in an `.editorconfig`, so formatting stays consistent instead of drifting per file.

## v1.0.4

### New Features
- **Hover to preview card images** — On the Collection and Add Cards pages, hovering over a card row now in the table view shows a large image of the card near the cursor after a short pause.
- **Sort by mana value** — Card lists can now be sorted by mana value, in addition to name, set code, and collector number.
- **More page size choices** — Page sizes now come in two families, 25/50/100 and 30/60/120. Picking a default in **Settings → Appearance** switches the whole family, so the per-page buttons on the Collection and Add Cards pages stay consistent with your choice.

### Bug Fixes
- **Mana symbols download again** — Scryfall rejects requests that don't send a custom User-Agent, which made the mana symbol download fail. The symbology request now sends one, the same fix applied to card images in v1.0.3.
- **More accurate statistics** — Fixed casing issues that could cause colors and other stats to be miscounted.
- **More reliable searching** — Fixed several database querying issues, including a bug where a card's file ending was mishandled during search.

### Improvements
- **Faster, more maintainable database layer** — The card database has been reorganized into modular queries and rewired for more reliable data management, laying the groundwork for future features.

### Development
These changes do not affect how the app behaves; they are groundwork for keeping it stable.
- **Automated test suite** — Added Vitest with separate main-process and renderer setups, covering pure logic, database queries against the real schema, and React hooks and components. Playwright drives the built app end to end against a throwaway profile. Run with `npm test` and `npm run test:e2e`.
- **One-command production build** — `npm run release` builds, packages the installers, and restores the correct native-module build so development still works afterwards. Pass `--check` to gate the build on lint, type-checks, and the full test suite.
- **Shared pagination types** — Page size definitions moved into `src/shared` so the main and renderer processes agree on them.

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
