# Marketplace checklist (Elgato guidelines)

Done in the plugin
- UUID `uk.novaroma-homelab.season-themes`, every action UUID starts with it
- Plugin name `Novaroma Season Themes` (no "Plugin" or "Stream Deck"; Elgato recommends leaving out the organisation name, kept on purpose), category with the same name
- Author is the alias JestingDart4369, no real name
- 19 actions (allowed 2 to 30), every name 30 characters or fewer, tooltips set
- Action and category icons are white SVG on transparent background
- Plugin icon PNG 288x288 and 576x576, key images 72 and 144 px
- Failed actions call showAlert, successful launches call showOk
- Updates stay far below 10 per second
- Property inspector: select controls, validation patterns, short labels, no support links
- Home Assistant keys call only the URL you enter, token stays in the app settings, no secrets in the plugin
- Deck wallpaper, auto scenes and page indicators stay within 10 image updates per second (transitions are 5 to 6 frames, about 8 per second)
- Launcher opens only links (https, mailto, obsidian, vscode) and apps, no free commands and no shell
- English default texts, German in de.json and following the app language
- Passes `streamdeck validate`

Still to do in the Maker Console
- Create the Maker organisation, name it so it matches the author
- Upload the .streamDeckPlugin, thumbnail (1920x960), 3 to 10 gallery images, app icon (288x288), the description
- Description minimum 250 and maximum 1500 characters, first 250 characters plain text (done)
- State the AI use (already in the description, keep it)
- Add the repository and licence in Additional Links, plus a donation link only if you want one
- Check that the name `Novaroma Season Themes` is free on the Marketplace
- Test on a real Stream Deck Neo before submitting
