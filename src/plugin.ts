import streamDeck from "@elgato/streamdeck";
import { loadPref, writeState, refreshAll } from "./core";
import "./actions";
import { setLang } from "./i18n";
import { SeasonKey_, ThemeKey, Launcher, TimerKey, IbPage, IbClock, IbSeason, IbText, IbBanner, IbCountdown, IbTimer, IbHomelab, IconKey, IbIcon, IbBackdrop, IbPages, HaToggle, HaService } from "./actions";
for (const A of [SeasonKey_, ThemeKey, Launcher, TimerKey, IbPage, IbClock, IbSeason, IbText, IbBanner, IbCountdown, IbTimer, IbHomelab, IconKey, IbIcon, IbBackdrop, IbPages, HaToggle, HaService]) streamDeck.actions.registerAction(new A());
streamDeck.connect().then(async () => { setLang(streamDeck.info.application.language); await loadPref(); writeState(); await refreshAll(); });
