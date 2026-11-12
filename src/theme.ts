import { PAL, SEASON_LABEL, Col, Mode, SeasonKey } from "./palette";
export type Pref = { season: "auto" | SeasonKey; theme: "auto" | Mode };
export const SEASON_ORDER: SeasonKey[] = ["standard", "fruehling", "sommer", "herbst", "winter"];

export function seasonOf(d: Date): SeasonKey {
  const m = d.getMonth() + 1; // meteorologisch: März bis Mai Frühling usw.
  return m >= 3 && m <= 5 ? "fruehling" : m >= 6 && m <= 8 ? "sommer" : m >= 9 && m <= 11 ? "herbst" : "winter";
}
export function modeOf(d: Date): Mode { const h = d.getHours(); return h >= 7 && h < 19 ? "hell" : "dunkel"; }
export function effective(pref: Pref, d = new Date()) {
  const season = pref.season === "auto" ? seasonOf(d) : pref.season;
  const mode = pref.theme === "auto" ? modeOf(d) : pref.theme;
  return { season, mode, label: SEASON_LABEL[season], c: PAL[season][mode] as Col, autoSeason: pref.season === "auto", autoMode: pref.theme === "auto" };
}
/** Nächster Jahreszeitenbeginn (1. März, 1. Juni, 1. September, 1. Dezember) und Anteil der laufenden Jahreszeit. */
export function seasonProgress(d: Date) {
  const y = d.getFullYear();
  const starts = [new Date(y - 1, 11, 1), new Date(y, 2, 1), new Date(y, 5, 1), new Date(y, 8, 1), new Date(y, 11, 1), new Date(y + 1, 2, 1)];
  let i = 0; while (i < starts.length - 2 && d >= starts[i + 1]) i++;
  const a = starts[i], b = starts[i + 1];
  const total = (+b - +a) / 864e5, left = Math.max(0, Math.ceil((+b - +d) / 864e5));
  return { next: seasonOf(b), daysLeft: left, fraction: Math.min(1, Math.max(0, 1 - left / total)) };
}
export function isoWeek(d: Date) {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())); const n = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - n); const y0 = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  return Math.ceil(((+t - +y0) / 864e5 + 1) / 7);
}
export const DAYS = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
export const MONTHS = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];
