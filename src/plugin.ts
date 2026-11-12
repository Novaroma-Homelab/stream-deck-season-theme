import streamDeck from "@elgato/streamdeck";
import { loadPref, writeState, refreshAll, watchDevices } from "./core";
import "./actions";
import { setLang } from "./i18n";
import { SeasonKey_, ThemeKey, Launcher, TimerKey, IbPage, IbClock, IbSeason, IbText, IbBanner, IbCountdown, IbTimer, IbHomelab, IconKey, IbIcon, IbBackdrop, IbPages, IbScenes, HaToggle, HaService } from "./actions";
for (const A of [SeasonKey_, ThemeKey, Launcher, TimerKey, IbPage, IbClock, IbSeason, IbText, IbBanner, IbCountdown, IbTimer, IbHomelab, IconKey, IbIcon, IbBackdrop, IbPages, IbScenes, HaToggle, HaService]) streamDeck.actions.registerAction(new A());
streamDeck.connect().then(async () => { setLang(streamDeck.info.application.language); watchDevices(); await loadPref(); writeState(); await refreshAll(); });
