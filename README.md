# Novaroma Season Themes

Stream Deck plugin with seasonal colour themes for keys and the Stream Deck Neo infobar.

- Follows the season (spring, summer, autumn, winter) and light or dark mode automatically, or set both by hand.
- Neo infobar: page indicators in six styles, clock, season, text, banner, countdown, timer, homelab status, icon, backdrop.
- Keys: season and theme switch, launcher (links and apps), study timer, icon key, Home Assistant toggle and service call.
- Works with the companion icon pack, see `stream-deck-icon-pack`.

Needs Stream Deck 7.6 or newer, macOS 13+ or Windows 10+.

## Build

```
npm install
npm run build
npm run check
npm run validate
npm run pack
```

`npm run pack` writes the installable `.streamDeckPlugin` to `dist/`.

## Home Assistant

Enter the server address and a long-lived access token in the Property Inspector of a Home Assistant key. The token stays in the Stream Deck global settings on your computer. A key shows a warning if the entity is missing or unavailable.

## Privacy

The plugin sends nothing anywhere except to the Home Assistant address you enter. Launcher keys start only the link or app you configure, without a shell.

## Licence

Code: MIT, see `LICENSE`. Colours and icons follow the Novaroma design system (CC BY-NC-SA 4.0).

Made by JestingDart4369. Parts of this plugin were written with the help of an AI assistant.
