import streamDeck, { action, SingletonAction, WillAppearEvent, WillDisappearEvent, KeyDownEvent, KeyUpEvent, DidReceiveSettingsEvent,  } from "@elgato/streamdeck";
import { execFile } from "node:child_process";
import http from "node:http";
import https from "node:https";
import { eff, getPref, packFile, packUri, packMask, register, unregister, setPref, refreshAll } from "./core";
import { SEASON_ORDER, DAYS } from "./theme";
import { SEASON_LABEL, SeasonKey } from "./palette";
import * as R from "./render";
import { T } from "./i18n";
import { haState, haCall, haReady } from "./ha";
import { PACK_GLYPHS as PACK } from "./packglyphs";

const P = "uk.novaroma-homelab.season-themes";
type S = Record<string, any>;

/** Gemeinsame Basis: merkt sich sichtbare Instanzen und zeichnet sie bei jeder Änderung neu. */
abstract class Base extends SingletonAction<S> {
  protected inst = new Map<string, any>();
  abstract draw(a: any, s: S): Promise<void> | void;
  override async onWillAppear(ev: WillAppearEvent<S>) {
    const a = ev.action; layoutSet.delete(a.id); this.inst.set(a.id, { a, s: ev.payload.settings });
    register(this.kind + a.id, async () => { const i = this.inst.get(a.id); if (i) await this.draw(i.a, i.s); });
    await this.draw(a, ev.payload.settings);
  }
  override onWillDisappear(ev: WillDisappearEvent<S>) { layoutSet.delete(ev.action.id); this.inst.delete(ev.action.id); unregister(this.kind + ev.action.id); }
  override async onDidReceiveSettings(ev: DidReceiveSettingsEvent<S>) { const i = this.inst.get(ev.action.id); if (i) i.s = ev.payload.settings; await this.draw(ev.action, ev.payload.settings); }
  protected abstract kind: string;
  protected cfg(a: any) { return this.inst.get(a.id)?.s ?? {}; }
}
const setKey = (a: any, img: string) => (a.isKey?.() ? a.setImage(img) : undefined);
const setBar = (a: any, img: string) => a.setFeedback({ image: img });
/** Infobar-Aktion: nur auf dem Neo-Infobar-Feld verfügbar. */
const layoutSet = new Set<string>();
async function paintBar(a: any, img: string) {
  if (!a.isNeoInfobar?.()) return;
  try {
    // Das Layout wird bei jedem Erscheinen neu gesetzt (Seiten- oder Profilwechsel setzt es zurück).
    if (!layoutSet.has(a.id)) { await a.setFeedbackLayout("layouts/neo.json"); layoutSet.add(a.id); }
    await setBar(a, img);
  } catch (e) { layoutSet.delete(a.id); streamDeck.logger.error("Infobar konnte nicht gezeichnet werden: " + String(e)); }
}

// ---------- Tasten ----------
@action({ UUID: `${P}.season` })
export class SeasonKey_ extends Base {
  protected kind = "season";
  async draw(a: any, s: S) {
    const e = eff(), p = getPref(), g = { standard: "arch", fruehling: "flower", sommer: "sun", herbst: "leaf", winter: "snowflake" }[e.season];
    await a.setImage(packFile(g, e)); await a.setTitle(e.label + (p.season === "auto" ? "\n" + T("Auto", "Auto") : ""));
  }
  override async onKeyDown(ev: KeyDownEvent<S>) {
    const s = ev.payload.settings, mode = s.mode ?? "cycle", p = getPref();
    if (mode === "set") await setPref({ season: (s.season ?? "standard") as any });
    else if (mode === "follow") await setPref({ season: "auto" });
    else { const order: any[] = ["auto", ...SEASON_ORDER]; await setPref({ season: order[(order.indexOf(p.season) + 1) % order.length] }); }
  }
}

@action({ UUID: `${P}.theme` })
export class ThemeKey extends Base {
  protected kind = "theme";
  async draw(a: any, s: S) {
    const e = eff(), p = getPref();
    await a.setImage(packFile(e.mode === "hell" ? "sun" : "moon", e)); await a.setTitle((e.mode === "hell" ? T("Hell", "Light") : T("Dunkel", "Dark")) + (p.theme === "auto" ? "\n" + T("Auto", "Auto") : ""));
  }
  override async onKeyDown(ev: KeyDownEvent<S>) {
    const s = ev.payload.settings, mode = s.mode ?? "cycle", p = getPref();
    if (mode === "set") await setPref({ theme: (s.theme ?? "hell") as any });
    else if (mode === "follow") await setPref({ theme: "auto" });
    else { const o: any[] = ["auto", "hell", "dunkel"]; await setPref({ theme: o[(o.indexOf(p.theme) + 1) % o.length] }); }
  }
}

@action({ UUID: `${P}.launcher` })
export class Launcher extends Base {
  protected kind = "launcher";
  async draw(a: any, s: S) {
    const e = eff(), g = s.glyph || "star";
    // Bild aus dem Novaroma-Icon-Paket passend zu Jahreszeit und Thema, sonst eigenes Linien-Symbol
    if (PACK.includes(g) && a.isKey?.()) { await a.setImage(`imgs/pack/${e.season}-${e.mode === "hell" ? "light" : "dark"}-${g}.png`); await a.setTitle(s.title ?? ""); }
    else { await a.setTitle(""); setKey(a, R.key(e.c, g, s.title ?? "")); }
  }
  override async onKeyDown(ev: KeyDownEvent<S>) {
    const s = ev.payload.settings, t = (s.target ?? "").trim(); if (!t) return ev.action.showAlert();
    try {
      if (s.type === "app") {
        // Ohne Shell gestartet, damit der Name nicht als Befehl ausgewertet wird.
        const [cmd, args] = process.platform === "darwin" ? ["open", ["-a", t]] : process.platform === "win32" ? ["cmd", ["/c", "start", "", t]] : [t, []];
        await new Promise<void>((res, rej) => execFile(cmd as string, args as string[], (err) => (err ? rej(err) : res())));
      } else {
        if (!/^(https?|mailto|obsidian|vscode):/i.test(t)) return ev.action.showAlert();
        await streamDeck.system.openUrl(t);
      }
    } catch { await ev.action.showAlert(); }
  }
}

// ---------- Lernzeit (Timer) ----------
const timer = { phase: "idle" as "idle" | "work" | "break", end: 0, total: 0, paused: 0, work: 25, brk: 5 };
const timerLeft = () => timer.phase === "idle" ? 0 : timer.paused ? timer.paused : Math.max(0, Math.round((timer.end - Date.now()) / 1000));
setInterval(() => {
  if (timer.phase !== "idle" && !timer.paused && timerLeft() === 0) {
    const next = timer.phase === "work" ? "break" : "work"; timer.phase = next;
    timer.total = (next === "work" ? timer.work : timer.brk) * 60; timer.end = Date.now() + timer.total * 1000;
    for (const a of timerKeys) void a.showAlert();
  }
  if (timer.phase !== "idle") void refreshAll();
}, 1000);
const timerKeys = new Set<any>();

@action({ UUID: `${P}.timer` })
export class TimerKey extends Base {
  protected kind = "timer";
  private down = 0;
  async draw(a: any, s: S) {
    timer.work = Number(s.work) || 25; timer.brk = Number(s.brk) || 5;
    const e = eff(), l = timerLeft(), mm = String(Math.floor(l / 60)).padStart(2, "0"), ss = String(l % 60).padStart(2, "0");
    const g = timer.phase === "idle" ? "stopwatch" : timer.paused ? "pause" : timer.phase === "break" ? "coffee" : "hourglass";
    await a.setImage(packFile(g, e)); await a.setTitle(timer.phase === "idle" ? T("Lernzeit", "Study") : `${mm}:${ss}`);
  }
  override async onWillAppear(ev: WillAppearEvent<S>) { timerKeys.add(ev.action); await super.onWillAppear(ev); }
  override onWillDisappear(ev: WillDisappearEvent<S>) { timerKeys.delete(ev.action); super.onWillDisappear(ev); }
  override onKeyDown() { this.down = Date.now(); }
  override async onKeyUp() {
    if (Date.now() - this.down > 800) { timer.phase = "idle"; timer.paused = 0; }                  // lang drücken: zurücksetzen
    else if (timer.phase === "idle") { timer.phase = "work"; timer.total = timer.work * 60; timer.end = Date.now() + timer.total * 1000; }
    else if (timer.paused) { timer.end = Date.now() + timer.paused * 1000; timer.paused = 0; }      // weiter
    else { timer.paused = timerLeft(); }                                                            // pausieren
    await refreshAll();
  }
}

// ---------- Infobar ----------
@action({ UUID: `${P}.ib-page` })
export class IbPage extends Base { protected kind = "ib-page";
  async draw(a: any, s: S) { const e = eff(); await paintBar(a, R.infoPage(e.c, s.name || T("Hauptseite", "Home"), Number(s.count) || 3, Number(s.current) || 1)); } }

@action({ UUID: `${P}.ib-clock` })
export class IbClock extends Base { protected kind = "ib-clock";
  async draw(a: any) { const e = eff(); await paintBar(a, R.infoClock(e.c, new Date(), e.label)); } }

@action({ UUID: `${P}.ib-season` })
export class IbSeason extends Base { protected kind = "ib-season";
  async draw(a: any) { const e = eff(); await paintBar(a, R.infoSeason(e.c, e.season, new Date(), packUri({ standard: "arch", fruehling: "flower", sommer: "sun", herbst: "leaf", winter: "snowflake" }[e.season]))); } }

@action({ UUID: `${P}.ib-text` })
export class IbText extends Base { protected kind = "ib-text";
  async draw(a: any, s: S) { const e = eff(); await paintBar(a, R.infoText(e.c, s.line1 || "Novaroma", s.line2 || "")); } }

@action({ UUID: `${P}.ib-banner` })
export class IbBanner extends Base { protected kind = "ib-banner";
  async draw(a: any, s: S) { const e = eff(); await paintBar(a, R.infoBanner(e.c, e.season, s.text || "Novaroma")); } }

@action({ UUID: `${P}.ib-countdown` })
export class IbCountdown extends Base { protected kind = "ib-countdown";
  async draw(a: any, s: S) {
    const e = eff(); const d = s.date ? new Date(s.date + "T00:00:00") : null;
    await paintBar(a, R.infoCountdown(e.c, s.label ?? "", d && !isNaN(+d) ? d : null, new Date()));
  } }

@action({ UUID: `${P}.ib-timer` })
export class IbTimer extends Base { protected kind = "ib-timer";
  async draw(a: any) { const e = eff(); await paintBar(a, R.infoTimer(e.c, timer.phase, timerLeft(), timer.total)); } }

// Homelab-Status: Prüfziele "Name|URL" pro Zeile, Ergebnis 30 s zwischengespeichert
const cache = new Map<string, { t: number; ok: boolean }>();
function probe(url: string): Promise<boolean> {
  return new Promise((res) => {
    try {
      const u = new URL(url), lib = u.protocol === "https:" ? https : http;
      const r = lib.request(u, { method: "GET", timeout: 3000, rejectUnauthorized: false } as any, (x) => { x.resume(); res((x.statusCode ?? 500) < 500); });
      r.on("timeout", () => { r.destroy(); res(false); }); r.on("error", () => res(false)); r.end();
    } catch { res(false); }
  });
}
async function status(url: string) {
  const c = cache.get(url); if (c && Date.now() - c.t < 30000) return c.ok;
  const ok = await probe(url); cache.set(url, { t: Date.now(), ok }); return ok;
}
@action({ UUID: `${P}.ib-homelab` })
export class IbHomelab extends Base { protected kind = "ib-homelab";
  async draw(a: any, s: S) {
    const e = eff();
    const targets = String(s.targets ?? "Home Assistant|http://10.10.1.40:8123\nProxmox|https://10.10.1.20:8006\nNAS|http://10.10.1.30").split("\n").map((l) => l.trim()).filter(Boolean).slice(0, 5)
      .map((l) => { const [label, ...u] = l.split("|"); return { label: label.trim(), url: u.join("|").trim() }; }).filter((t) => t.url);
    const rows = targets.map((t) => ({ label: t.label, ok: (cache.get(t.url)?.ok ?? null) as boolean | null }));
    await paintBar(a, R.infoHomelab(e.c, rows));
    for (const t of targets) void status(t.url);   // Ergebnis erscheint beim nächsten Zeichnen
  } }

// ---------- neu: Symbol-Taste und Infobar mit Symbol ----------
@action({ UUID: `${P}.icon` })
export class IconKey extends Base { protected kind = "icon";
  async draw(a: any, s: S) { await a.setImage(packFile(s.glyph || "star")); await a.setTitle(s.title ?? ""); }
  override async onKeyDown(ev: KeyDownEvent<S>) { const t = (ev.payload.settings.target ?? "").trim(); if (t) { try { await streamDeck.system.openUrl(t); } catch { await ev.action.showAlert(); } } } }

@action({ UUID: `${P}.ib-icon` })
export class IbIcon extends Base { protected kind = "ib-icon";
  async draw(a: any, s: S) { const e = eff(); await paintBar(a, R.infoIcon(e.c, packUri(s.glyph || "star", e), s.line1 || "Novaroma", s.line2 || "")); } }

@action({ UUID: `${P}.ib-backdrop` })
export class IbBackdrop extends Base { protected kind = "ib-backdrop";
  async draw(a: any, s: S) { const e = eff(); await paintBar(a, R.backdropBar(e.c, s.style || "boegen")); } }

@action({ UUID: `${P}.ib-pages` })
export class IbPages extends Base { protected kind = "ib-pages";
  async draw(a: any, s: S) {
    const e = eff(); const gl = [s.g1, s.g2, s.g3, s.g4, s.g5, s.g6, s.g7].filter((g) => g && g !== "-");
    const list: string[] = gl.length ? gl : ["home", "headphones", "sun", "gradcap", "wrench", "gear", "plus"];
    await paintBar(a, R.infoPagesStyled(e.c, list.map((g) => packMask(g)), list.slice(0, 5).map((g) => packUri(g, e)), Number(s.current) || 1, new Date(), s.style || "pill"));
  } }

// ---------- Home Assistant ----------
@action({ UUID: `${P}.ha-toggle` })
export class HaToggle extends Base { protected kind = "ha-toggle";
  async draw(a: any, s: S) {
    const e = eff(); const entity = String(s.entity ?? "").trim();
    const st = !entity || !haReady() ? "unknown" : await haState(entity);
    await a.setTitle(""); await a.setImage(R.haKey(e.c, packMask(s.glyph || "bolt"), s.title ?? "", st === "on" ? "on" : st === "off" ? "off" : "unknown"));
  }
  override async onKeyDown(ev: KeyDownEvent<S>) {
    const s = ev.payload.settings, entity = String(s.entity ?? "").trim();
    if (!entity || !haReady()) return ev.action.showAlert();
    const ok = await haCall("homeassistant.toggle", { entity_id: entity });
    if (!ok) return ev.action.showAlert();
    await this.draw(ev.action, s); setTimeout(() => void this.draw(ev.action, s), 700);   // Zustand gleich neu anzeigen
  }
}

@action({ UUID: `${P}.ha-service` })
export class HaService extends Base { protected kind = "ha-service";
  async draw(a: any, s: S) { const e = eff(); await a.setImage(packFile(s.glyph || "bolt", e)); await a.setTitle(s.title ?? ""); }
  override async onKeyDown(ev: KeyDownEvent<S>) {
    const s = ev.payload.settings; let data: Record<string, unknown> = {};
    if (String(s.entity ?? "").trim()) data.entity_id = String(s.entity).trim();
    if (String(s.data ?? "").trim()) { try { data = { ...data, ...JSON.parse(s.data) }; } catch { return ev.action.showAlert(); } }
    if (!(await haCall(String(s.service ?? ""), data))) await ev.action.showAlert();
  }
}
