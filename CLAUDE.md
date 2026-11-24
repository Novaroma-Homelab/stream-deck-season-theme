# CLAUDE.md

Guidance for Claude Code when working in this repository.

## What this is

Novaroma Season Themes: a Stream Deck plugin (`uk.novaroma-homelab.season-themes`, SDK 3, Node 20, needs Stream Deck 7.6+, macOS 13+ or Windows 10+). It colours keys and the Stream Deck Neo infobar by season and light or dark, and adds launcher, study timer, Home Assistant keys, page indicators, auto scenes and a deck wallpaper. The companion pack with the icons lives in `stream-deck-icon-pack`.

## Layout

- `src/`: TypeScript source. `plugin.ts` is the entry, `actions.ts` the action classes, `render.ts` draws keys, infobar and wallpaper, `palette.ts` and `theme.ts` hold colours and season logic, `core.ts` shared helpers and settings, `ha.ts` Home Assistant calls, `glyphs.ts` and `packglyphs.ts` symbols, `i18n.ts` texts.
- `scripts/make.py`: generates `manifest.json` actions, property inspector HTML (`ui/`), `layouts/`, key images and `de.json` into the `.sdPlugin` folder. The manifest, `ui/`, `layouts/` and `de.json` are generated, so change `scripts/make.py` and rebuild instead of editing them.
- `uk.novaroma-homelab.season-themes.sdPlugin/`: the plugin folder (`bin/plugin.js` is build output, `imgs/pack` holds the pack glyphs used by `make.py`).
- `marketplace/`: description, checklist (Elgato guidelines), thumbnail, gallery, app icon.

## Commands

- `npm install`
- `npm run build`: runs `scripts/make.py`, then bundles `src/plugin.ts` with esbuild to `bin/plugin.js`.
- `npm run check`: `tsc --noEmit`.
- `npm run validate`: `streamdeck validate` on the plugin folder. It must pass before a release.
- `npm run pack`: writes the `.streamDeckPlugin` to `dist/` (not committed).

Run build, check and validate after every change. There is no test suite, so verify rendering by looking at the generated images.

## Working rules

- Every new action: add it in `scripts/make.py` (UUID must start with `uk.novaroma-homelab.season-themes.`, name 30 characters or fewer, tooltip, white SVG icon on transparent background, 72 and 144 px key images) and in `src/actions.ts`. Between 2 and 30 actions are allowed.
- Add texts to `i18n.ts` and German to `de.json` via `make.py`. English is the default.
- Image updates stay at or below 10 per second (animations about 6 to 8). Failed actions call `showAlert`, successful launches `showOk`.
- Launcher opens only https, mailto, obsidian and vscode links and apps, never a shell or free command.
- Home Assistant: the plugin calls only the URL the user enters. The token stays in the Stream Deck global settings. No secrets in code, logs or the repository.
- Update `CHANGELOG.md` (under Unreleased) and keep `marketplace/checklist.md` and the descriptions true. The Marketplace description must stay between 250 and 1500 characters, the first 250 plain text, and keep the AI-use statement.
- Do not change the UUID, the plugin name or the category name.

## Conventions

- Language: English for code, docs, commits and the interface, German only in `de.json`.
- Commits and PR titles use Conventional Commits (`feat:`, `fix:`, `docs:`), branches `type/short-name`.
- Never put a real name anywhere (manifest, package.json, commits, licence, metadata). The author is the alias JestingDart4369. Check `git config user.name` and `user.email` before committing.
- Licences: code MIT (`LICENSE`), colours and icons follow the Novaroma design system (CC BY-NC-SA 4.0).
- The brand is written "Novaroma" (one word).
