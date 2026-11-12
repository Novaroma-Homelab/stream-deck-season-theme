import streamDeck from "@elgato/streamdeck";
import { mkdirSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { Pref, effective } from "./theme";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { PACK_GLYPHS } from "./packglyphs";
import { setBg, getBg, bgKey, setWall, getWallTo, setDeck } from "./render";
import type { WallSig } from "./render";

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
const runAll = () => Promise.all([...registry.values()].map(async (fn) => { try { await fn(); } catch (e) { streamDeck.logger.warn(String(e)); } }));
let wallKey = "", animating = false;
const nap = (ms: number) => new Promise((r) => setTimeout(r, ms));
/** Beim Deck-Hintergrund: ändert sich Jahreszeit, Tageszeit oder Stil, gleitet das ganze Bild über alle Tasten in das neue. */
async function wallCheck() {
  if (getBg() !== "wallpaper") { wallKey = ""; return; }
  const e = eff(), sig: WallSig = { season: e.season, mode: e.mode === "hell" ? "hell" : "dunkel", style: String(globals.wallStyle ?? "scene") }, key = JSON.stringify(sig);
  if (key === wallKey) return;
  const prev = wallKey ? getWallTo() : null, mode = String(globals.wallTransition ?? "slide"); wallKey = key;
  if (!prev || mode === "none") { setWall({ from: null, to: sig, p: 1, mode }); return; }
  animating = true;
  try { for (let f = 1; f <= 6; f++) { setWall({ from: prev, to: sig, p: f / 6, mode }); await runAll(); await nap(120); } setWall({ from: null, to: sig, p: 1, mode }); }
  finally { animating = false; }
}
export async function refreshAll() { if (animating) return; await wallCheck(); await runAll(); }
/** Größe des Geräts merken, damit das Gesamtbild zur Tastenanordnung passt. */
export function watchDevices() {
  const upd = (d: any) => { if (d?.size) { setDeck(d.size.columns, d.size.rows); wallKey = ""; } };
  try { streamDeck.devices.forEach(upd); streamDeck.devices.onDeviceDidConnect((ev: any) => { upd(ev.device); void refreshAll(); }); } catch (e) { streamDeck.logger.warn(String(e)); }
}

/** Optional feste Symbolfarbe (Jahreszeit und Hell/Dunkel); alles andere folgt weiter der Automatik. */
export function iconEff(e: ReturnType<typeof eff>) {
  const gs = String(globals.iconSeason ?? "auto"), gm = String(globals.iconMode ?? "auto");
  if (gs === "auto" && gm === "auto") return e;
  return effective({ season: gs === "auto" ? e.season : (gs as Pref["season"]), theme: gm === "auto" ? e.mode : (gm as Pref["theme"]) });
}
let pref: Pref = { season: "auto", theme: "auto" };
export const getPref = () => pref;
export const eff = () => effective(pref);

/** Alle globalen Einstellungen (Jahreszeit, Thema, Home Assistant). Wird immer zusammengeführt, nie überschrieben. */
export let globals: Record<string, any> = {};
function applyGlobals(g: Record<string, any>) {
  globals = { ...g }; setBg(String(g.background ?? "plain"));
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

/** Bild für eine Taste mit Pack-Symbol: die Kachel des Icon-Pakets, oder bei gewähltem Deck-Hintergrund eine Taste mit Hintergrund. */
export function tileImg(glyph: string, e = eff(), a?: any): string {
  e = iconEff(e);
  const co = a?.coordinates ?? { column: 0, row: 0 };
  return getBg() === "plain" ? packFile(glyph, e) : bgKey(e.c, packMask(PACK_GLYPHS.includes(glyph) ? glyph : "star"), co.column ?? 0, co.row ?? 0);
}
