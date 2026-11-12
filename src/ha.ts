import streamDeck from "@elgato/streamdeck";
import { globals } from "./core";

const base = () => String(globals.haUrl ?? "").trim().replace(/\/+$/, "");
export const haReady = () => /^https?:\/\//i.test(base()) && !!String(globals.haToken ?? "").trim();
const headers = () => ({ Authorization: "Bearer " + String(globals.haToken).trim(), "Content-Type": "application/json" });

const cache = new Map<string, { t: number; v: string }>();
/** Zustand einer Entität ("on", "off", "unavailable" ...), 2 Sekunden zwischengespeichert. */
export async function haState(entity: string): Promise<string> {
  if (!haReady() || !entity) return "unknown";
  const c = cache.get(entity); if (c && Date.now() - c.t < 2000) return c.v;
  try {
    const r = await fetch(`${base()}/api/states/${encodeURIComponent(entity)}`, { headers: headers(), signal: AbortSignal.timeout(4000) });
    const v = r.ok ? String((await r.json()).state ?? "unknown") : "unknown";
    cache.set(entity, { t: Date.now(), v }); return v;
  } catch (e) { streamDeck.logger.warn("Home Assistant state: " + String((e as Error).message)); return "unknown"; }
}
/** Dienst aufrufen, zum Beispiel haService("light.turn_on", {entity_id: "light.wohnzimmer"}). Gibt true bei Erfolg zurück. */
export async function haCall(service: string, data: Record<string, unknown>): Promise<boolean> {
  const m = /^([a-z_]+)\.([a-z_]+)$/.exec(service.trim());
  if (!haReady() || !m) return false;
  try {
    const r = await fetch(`${base()}/api/services/${m[1]}/${m[2]}`, { method: "POST", headers: headers(), body: JSON.stringify(data), signal: AbortSignal.timeout(5000) });
    cache.clear(); return r.ok;
  } catch (e) { streamDeck.logger.warn("Home Assistant service: " + String((e as Error).message)); return false; }
}
