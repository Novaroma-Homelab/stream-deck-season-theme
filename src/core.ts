import streamDeck from "@elgato/streamdeck";
import { mkdirSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { Pref, effective } from "./theme";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { PACK_GLYPHS } from "./packglyphs";

const uriCache = new Map<string, string>();
/** Name der Pack-Datei zu Jahreszeit, Thema und Symbol (relativ zum Plugin). */
export function packFile(glyph: string, e = eff()) { return `imgs/pack/${e.season}-${e.mode === "hell" ? "light" : "dark"}-${PACK_GLYPHS.includes(glyph) ? glyph : "star"}.png`; }
/** Dasselbe Bild als Data-URI, damit es in die Infobar-SVGs eingebettet werden kann. */
export function packUri(glyph: string, e = eff()): string {
  const f = packFile(glyph, e); let u = uriCache.get(f);
  if (!u) { try { u = "data:image/png;base64," + readFileSync(fileURLToPath(new URL("../" + f, import.meta.url))).toString("base64"); } catch { u = ""; } uriCache.set(f, u); }
  return u;
}

export type Refresher = () => void | Promise<void>;
const registry = new Map<string, Refresher>();
export const register = (id: string, fn: Refresher) => { registry.set(id, fn); };
export const unregister = (id: string) => { registry.delete(id); };
export async function refreshAll() { for (const fn of [...registry.values()]) { try { await fn(); } catch (e) { streamDeck.logger.warn(String(e)); } } }

let pref: Pref = { season: "auto", theme: "auto" };
export const getPref = () => pref;
export const eff = () => effective(pref);

/** Alle globalen Einstellungen (Jahreszeit, Thema, Home Assistant). Wird immer zusammengeführt, nie überschrieben. */
export let globals: Record<string, any> = {};
function applyGlobals(g: Record<string, any>) {
  globals = { ...g };
  pref = { season: (g.season as Pref["season"]) ?? "auto", theme: (g.theme as Pref["theme"]) ?? "auto" };
}
export async function loadPref() {
  applyGlobals((await streamDeck.settings.getGlobalSettings()) as Record<string, any>);
  streamDeck.settings.onDidReceiveGlobalSettings((ev) => { applyGlobals(ev.settings as Record<string, any>); void refreshAll(); });
}
export async function setPref(p: Partial<Pref>) {
  pref = { ...pref, ...p };
  globals = { ...globals, ...pref }; await streamDeck.settings.setGlobalSettings(globals as any);
  writeState();
  await refreshAll();
}
/** Andere Werkzeuge (Skripte, Home Assistant, Obsidian) können ~/.novaroma/state.json lesen. */
export function writeState() {
  try {
    const e = eff(); const dir = join(homedir(), ".novaroma"); mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "state.json"), JSON.stringify({ season: e.season, mode: e.mode, main: e.c.main, bg: e.c.bg, text: e.c.text, auto_season: e.autoSeason, auto_mode: e.autoMode, updated: new Date().toISOString() }, null, 2));
  } catch (e) { streamDeck.logger.warn("state.json: " + e); }
}
setInterval(() => { writeState(); void refreshAll(); }, 5000);

const maskCache = new Map<string, string>();
/** Schwarz-Weiß-Maske eines Paket-Symbols (Symbol weiß), damit es in jeder Farbe gezeichnet werden kann. */
export function packMask(glyph: string): string {
  const g = PACK_GLYPHS.includes(glyph) ? glyph : "star"; let u = maskCache.get(g);
  if (!u) { try { u = "data:image/png;base64," + readFileSync(fileURLToPath(new URL(`../imgs/mask/${g}.png`, import.meta.url))).toString("base64"); } catch { u = ""; } maskCache.set(g, u); }
  return u;
}
