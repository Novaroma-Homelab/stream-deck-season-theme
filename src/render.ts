import { GLYPHS } from "./glyphs";
import { T } from "./i18n";
import { Col } from "./palette";
import { DAYS, MONTHS, isoWeek, seasonProgress, SEASON_ORDER } from "./theme";
import { SEASON_LABEL, SeasonKey, PAL } from "./palette";

export const uri = (svg: string) => "data:image/svg+xml;charset=utf8," + encodeURIComponent(svg);
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const SERIF = "Georgia, 'Times New Roman', serif";

export function glyph(name: string, x: number, y: number, size: number, stroke: string, sw = 1.8, fill = "none") {
  const body = GLYPHS[name] ?? GLYPHS.star;
  return `<g transform="translate(${x} ${y}) scale(${size / 24})" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${body}</g>`;
}

/** Taste 144×144: Fläche in Grundfarbe, ein Symbol, optional Beschriftung unten und kleines Zeichen oben rechts. */
export function key(c: Col, g: string, label: string, badge = "", accent = c.main): string {
  const lab = label ? `<text x="72" y="130" font-family="${SERIF}" font-size="17" font-weight="bold" text-anchor="middle" fill="${c.muted}">${esc(label)}</text>` : "";
  const bad = badge ? `<g><rect x="88" y="10" width="48" height="22" rx="11" fill="${c.ink}"/><text x="112" y="26" font-family="${SERIF}" font-size="14" font-weight="bold" text-anchor="middle" fill="${c.bg}">${esc(badge)}</text></g>` : "";
  const gy = label ? 20 : 30, gs = label ? 78 : 84, gx = (144 - gs) / 2;
  return uri(`<svg xmlns="http://www.w3.org/2000/svg" width="144" height="144" viewBox="0 0 144 144"><rect width="144" height="144" fill="${c.bg}"/>${bgLayerKey(c, BG)}<rect x="0" y="0" width="144" height="6" fill="${accent}"/>${glyph(g, gx, gy + 6, gs, accent, 1.7)}${lab}${bad}</svg>`);
}

/** Infobar 232×50. */
/** Hintergrund für das ganze Deck, gilt für alle Tasten und Infobars (globale Einstellung). */
let BG = "plain";
let ANIM = 0;
/** Phase der langsamen Bewegung (0 bis 1, ein Durchlauf). 0 = Standbild. */
export const setAnim = (t: number) => { ANIM = t; };
export const deckCount = () => DECK.cols * DECK.rows + 1;
export const setBg = (style: string) => { BG = style || "plain"; };
export const getBg = () => BG;
let BARBG = "auto";
/** Eigener Hintergrund der Infobar. auto = folgt dem Deck-Look; ohne Hintergrund (clear) gibt es dort nur die Jahreszeitenfarbe, weil die Infobar nicht auf dem App-Bild liegt. */
export const setBarBg = (k: string) => { BARBG = k || "auto"; };
export const barKind = () => (BARBG !== "auto" ? (BARBG === "plain" ? "" : BARBG) : BG === "clear" ? "" : BG);
export function bar(c: Col, inner: string, under?: string): string {
  if (under === undefined) under = bgLayer(c, barKind());
  return uri(`<svg xmlns="http://www.w3.org/2000/svg" width="232" height="50" viewBox="0 0 232 50"><rect width="232" height="50" fill="${c.bg}"/>${under}<rect width="232" height="3" fill="${c.main}"/>${inner}</svg>`);
}
export const t = (x: number, y: number, s: number, fill: string, text: string, anchor = "middle", w = "bold", ls = 0) =>
  `<text x="${x}" y="${y}" font-family="${SERIF}" font-size="${s}" font-weight="${w}" text-anchor="${anchor}" letter-spacing="${ls}" fill="${fill}">${esc(text)}</text>`;

export function infoPage(c: Col, name: string, count: number, cur: number) {
  const n = Math.max(1, Math.min(24, count)), i = Math.max(1, Math.min(n, cur)) - 1;
  const r = n > 12 ? 2 : 2.6, aw = n > 12 ? 14 : 20, gap = n > 16 ? 5 : n > 12 ? 7 : n > 8 ? 9 : 11;
  const total = (n - 1) * 2 * r + aw + (n - 1) * gap; let x = (232 - total) / 2; let dots = "";
  for (let k = 0; k < n; k++) {
    if (k === i) { dots += `<rect x="${x}" y="${40 - r}" width="${aw}" height="${2 * r}" rx="${r}" fill="${c.main}"/>`; x += aw + gap; }
    else { dots += `<circle cx="${x + r}" cy="40" r="${r}" fill="${c.muted}" opacity=".7"/>`; x += 2 * r + gap; }
  }
  return bar(c, t(116, 27, 19, c.text, name) + dots);
}
export function infoClock(c: Col, d: Date, seasonLabel: string) {
  const hh = String(d.getHours()).padStart(2, "0"), mm = String(d.getMinutes()).padStart(2, "0");
  return bar(c, t(14, 38, 32, c.text, `${hh}:${mm}`, "start") + t(222, 24, 14, c.main, `${DAYS[d.getDay()]} ${d.getDate()}. ${MONTHS[d.getMonth()]}`, "end") +
    t(222, 42, 12, c.muted, `${T("KW","Wk")} ${isoWeek(d)} · ${seasonLabel}`, "end", "normal"));
}
export const image = (u: string, x: number, y: number, size: number) => u ? `<image href="${u}" x="${x}" y="${y}" width="${size}" height="${size}"/>` : "";
export function infoSeason(c: Col, season: SeasonKey, d: Date, img = "") {
  const p = seasonProgress(d); const w = 200;
  const next = SEASON_LABEL[p.next];
  return bar(c, (img ? image(img, 8, 7, 30) : glyph(season, 10, 9, 22, c.main, 1.8)) + t(46, 26, 17, c.text, SEASON_LABEL[season], "start") + t(222, 24, 11, c.muted, T(`${p.daysLeft} Tage bis ${next}`, `${p.daysLeft} days to ${next}`), "end", "normal") +
    `<rect x="16" y="39" width="${w}" height="5" rx="2.5" fill="${c.tint}"/><rect x="16" y="39" width="${Math.max(5, w * p.fraction)}" height="5" rx="2.5" fill="${c.main}"/>`);
}
export function infoText(c: Col, l1: string, l2: string) {
  return bar(c, l2 ? t(116, 24, 17, c.text, l1) + t(116, 41, 12, c.muted, l2, "middle", "normal") : t(116, 32, 19, c.text, l1));
}
export function infoCountdown(c: Col, label: string, target: Date | null, d: Date) {
  if (!target) return infoText(c, label || "Countdown", T("Datum fehlt", "Date missing"));
  const days = Math.ceil((+target - +new Date(d.getFullYear(), d.getMonth(), d.getDate())) / 864e5);
  const big = days > 0 ? String(days) : days === 0 ? T("heute", "today") : T("vorbei", "over");
  const sub = days > 0 ? (days === 1 ? T("Tag", "day") : T("Tage", "days")) : "";
  return bar(c, t(14, 40, 34, c.main, big, "start") + (sub ? t(14 + 22 * big.length + 6, 40, 14, c.muted, sub, "start", "normal") : "") + t(222, 31, 16, c.text, label || "Countdown", "end"));
}
export function infoBanner(c: Col, season: SeasonKey, word = "Novaroma") {
  let arches = ""; for (let k = 0; k < 5; k++) { const x = 118 + k * 22; arches += `<path d="M${x} 44V32a7 7 0 0 1 14 0v12" fill="none" stroke="${c.main}" stroke-width="1.6"/>`; }
  return bar(c, t(14, 32, 20, c.text, word, "start", "bold", 0.5) + t(14, 44, 9, c.muted, SEASON_LABEL[season].toUpperCase(), "start", "normal", 2) + arches + `<path d="M112 44h120" stroke="${c.main}" stroke-width="1.6"/>`);
}
export function infoHomelab(c: Col, rows: { label: string; ok: boolean | null }[]) {
  if (!rows.length) return infoText(c, T("Homelab", "Server status"), T("Prüfziele im Inspektor eintragen", "Add targets in the inspector"));
  const n = rows.length, w = 232 / n; let o = "";
  rows.forEach((r, i) => {
    const cx = w * i + w / 2;
    // Zustand nie nur über Farbe: gefüllt mit Haken = erreichbar, Ring mit Kreuz = nicht erreichbar, Ring offen = unbekannt
    const sym = r.ok === null ? `<circle cx="${cx}" cy="20" r="6" fill="none" stroke="${c.muted}" stroke-width="2" stroke-dasharray="3 2"/>`
      : r.ok ? `<circle cx="${cx}" cy="20" r="7" fill="${c.main}"/><path d="m${cx - 3.2} 20.2 2.4 2.6 4.4-5" fill="none" stroke="${c.bg}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`
      : `<circle cx="${cx}" cy="20" r="7" fill="none" stroke="#c0392b" stroke-width="2.2"/><path d="m${cx - 3} 17 6 6M${cx + 3} 17l-6 6" stroke="#c0392b" stroke-width="2.2" stroke-linecap="round"/>`;
    o += sym + t(cx, 42, n > 3 ? 10 : 12, c.text, r.label.slice(0, n > 3 ? 8 : 11), "middle", "normal");
  });
  return bar(c, o);
}
export function infoTimer(c: Col, phase: string, left: number, total: number) {
  const mm = String(Math.floor(left / 60)).padStart(2, "0"), ss = String(left % 60).padStart(2, "0");
  const f = total > 0 ? Math.min(1, Math.max(0, 1 - left / total)) : 0;
  const lab = phase === "work" ? T("Lernzeit", "Study") : phase === "break" ? T("Pause", "Break") : T("Bereit", "Ready");
  return bar(c, t(14, 36, 30, c.text, phase === "idle" ? "--:--" : `${mm}:${ss}`, "start") + t(222, 26, 16, c.main, lab, "end") +
    `<rect x="118" y="36" width="104" height="5" rx="2.5" fill="${c.tint}"/><rect x="118" y="36" width="${Math.max(0, 104 * f)}" height="5" rx="2.5" fill="${c.main}"/>`);
}
export const SEASON_KEYS = SEASON_ORDER;

export function infoIcon(c: Col, img: string, l1: string, l2: string) {
  return bar(c, image(img, 10, 9, 34) + (l2 ? t(56, 24, 17, c.text, l1, "start") + t(56, 41, 12, c.muted, l2, "start", "normal") : t(56, 32, 19, c.text, l1, "start")));
}

/** Hintergründe: Aquädukt-Bögen am unteren Rand, ph (0..1) lässt ein Licht über die Bögen wandern (Animation). */
function arches(c: Col, w: number, h: number, n: number, rise: number, ph: number) {
  const pw = w / n, r = pw * 0.36, base = h, top = h - rise; let o = `<path d="M0 ${top - r - 6}H${w}" stroke="${c.muted}" stroke-opacity=".45" stroke-width="${w > 200 ? 1.2 : 2}"/>`;
  for (let k = 0; k < n; k++) {
    const cx = pw * k + pw / 2; const d = ph < 0 ? 9 : Math.min(Math.abs(k - ph * n), n - Math.abs(k - ph * n));
    const glow = ph < 0 ? 0 : Math.max(0, 1 - d / 1.8);
    o += `<path d="M${cx - r} ${base}V${top}a${r} ${r} 0 0 1 ${2 * r} 0V${base}Z" fill="${c.main}" fill-opacity="${(0.04 + glow * 0.3).toFixed(3)}" stroke="${c.muted}" stroke-opacity="${(0.45 + glow * 0.5).toFixed(3)}" stroke-width="${w > 200 ? 1.2 : 2}"/>`;
  }
  return o;
}
export function backdropBar(c: Col, style: string, ph = -1) {
  return bar(c, style === "flaeche" ? "" : arches(c, 232, 50, 10, 14, ph), "");
}
export function backdropKey(c: Col, style = "boegen", ph = -1) {
  return uri(`<svg xmlns="http://www.w3.org/2000/svg" width="144" height="144" viewBox="0 0 144 144"><rect width="144" height="144" fill="${c.bg}"/><rect width="144" height="6" fill="${c.main}"/>${style === "flaeche" ? "" : arches(c, 144, 144, 4, 38, ph)}</svg>`);
}

/** Bei vielen Seiten wird es eng: erst schrumpfen die Symbole, dann zeigt nur noch die aktuelle Seite ihr Symbol und die anderen werden zu Punkten. */
function fitMarks(n: number, W: number, size: number, gap: number) {
  for (const sz of [size, 26, 22, 18]) {
    if (sz > size) continue;
    if (n === 1 || n * sz + (n - 1) * 4 <= W) return { sz, g: n === 1 ? 0 : Math.min(gap, (W - n * sz) / (n - 1)), compact: false, slot: 0 };
  }
  return { sz: size, g: 0, compact: true, slot: Math.max(4, Math.min(14, (W - size - 8) / (n - 1))) };
}
const dotAt = (c: Col, cx: number, cy: number, r = 2.6) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${c.muted}" opacity=".7"/>`;
/** Eine Reihe Seitenmarken: Bild pro Seite, die aktuelle voll sichtbar mit Balken, die anderen gedämpft. Leere Bilder werden zu Punkten. */
function pageMarks(c: Col, imgs: string[], cur: number, x0: number, W: number, size: number, gap: number, y: number, yb: number, centre: boolean) {
  const n = imgs.length, f = fitMarks(n, W, size, gap); let o = "";
  const total = f.compact ? (n - 1) * f.slot + size + 8 : n * f.sz + (n - 1) * f.g;
  let x = centre ? x0 + (W - total) / 2 : x0;
  imgs.forEach((u, k) => {
    const on = k === cur - 1, sz = f.sz;
    if (f.compact && !on) { o += dotAt(c, x + f.slot / 2, y + size / 2, Math.min(2.6, f.slot / 2 - 0.5)); x += f.slot; return; }
    if (!u) o += on ? "" : dotAt(c, x + sz / 2, y + sz / 2);
    else o += `<g opacity="${on ? 1 : 0.4}">${image(u, x, y, sz)}</g>`;
    o += on ? `<rect x="${x + sz * 0.15}" y="${yb}" width="${sz * 0.7}" height="3.5" rx="1.75" fill="${c.main}"/>` : `<circle cx="${x + sz / 2}" cy="${yb + 1.75}" r="1.8" fill="${c.muted}" opacity=".7"/>`;
    x += sz + (f.compact ? 8 : f.g);
  });
  return o;
}
export function infoPageIcons(c: Col, imgs: string[], cur: number) {
  return bar(c, pageMarks(c, imgs, cur, 8, 216, 30, 18, 6, 41, true));
}

const hm = (d: Date) => String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
/** Variante 1: Symbole links, große Uhr rechts mit Datum. */
export function infoPagesClockSide(c: Col, imgs: string[], cur: number, d: Date) {
  const n = imgs.length, size = n > 3 ? 24 : 28, gap = n > 3 ? 7 : 10;
  return bar(c, pageMarks(c, imgs, cur, 10, 134, size, gap, 8, 40, false) + t(222, 31, 26, c.text, hm(d), "end") + t(222, 45, 10, c.muted, `${DAYS[d.getDay()]} ${d.getDate()}. ${MONTHS[d.getMonth()]}`, "end", "normal"));
}
/** Variante 2: kleine Uhr oben mittig, Symbole darunter. */
export function infoPagesClockTop(c: Col, imgs: string[], cur: number, d: Date) {
  return bar(c, t(116, 17, 13, c.text, `${hm(d)} · ${DAYS[d.getDay()]} ${d.getDate()}. ${MONTHS[d.getMonth()]}`) + pageMarks(c, imgs, cur, 8, 216, 22, 16, 21, 45, true));
}

/** Symbol in beliebiger Farbe über seine Maske zeichnen. */
let maskId = 0;
const tinted = (mask: string, x: number, y: number, size: number, fill: string) => {
  if (!mask) return ""; const id = "mk" + maskId++;
  return `<mask id="${id}" x="${x}" y="${y}" width="${size}" height="${size}" maskUnits="userSpaceOnUse"><image href="${mask}" x="${x}" y="${y}" width="${size}" height="${size}"/></mask><rect x="${x}" y="${y}" width="${size}" height="${size}" fill="${fill}" mask="url(#${id})"/>`;
};
/** Pille wie in der App: abgerundete Leiste, aktive Seite als helle Pille mit Symbol in Gegenfarbe. */
function pill(c: Col, masks: string[], cur: number, x0: number, y0: number, cell: number, h: number, icon: number, W: number, centre: boolean) {
  const n = masks.length; let cl = cell, ic = icon, compact = false, slot = 0;
  if (n * cl + 8 > W) { cl = Math.floor((W - 8) / n); if (cl >= 20) ic = Math.max(12, cl - 8); else { compact = true; cl = cell; slot = Math.max(4.5, Math.min(12, (W - 8 - cell) / Math.max(1, n - 1))); } }
  const w = (compact ? (n - 1) * slot + cl : n * cl) + 8, xs = centre ? x0 + (W - w) / 2 : x0;
  let o = `<rect x="${xs}" y="${y0}" width="${w}" height="${h}" rx="${h / 2}" fill="${c.muted}" fill-opacity=".16"/>`, cx = xs + 4;
  masks.forEach((m, k) => {
    const on = k === cur - 1, wd = compact && !on ? slot : cl;
    if (on) o += `<rect x="${cx + 1}" y="${y0 + 3}" width="${wd - 2}" height="${h - 6}" rx="${(h - 6) / 2}" fill="${c.main}"/>`;
    if (compact && !on) o += dotAt(c, cx + wd / 2, y0 + h / 2, Math.min(2.2, wd / 2 - 0.5));
    else if (!m) o += dotAt(c, cx + wd / 2, y0 + h / 2, 3).replace(c.muted, on ? c.bg : c.muted);
    else o += tinted(m, cx + (wd - ic) / 2, y0 + (h - ic) / 2, ic, on ? c.bg : c.muted);
    cx += wd;
  });
  return { svg: o, w };
}
export function infoPagesStyled(c: Col, masks: string[], imgs: string[], cur: number, d: Date, style: string) {
  const clock = style.endsWith("clock-right") ? "rechts" : style.endsWith("clock-top") ? "oben" : "";
  if (style.startsWith("tiles")) {
    return clock === "rechts" ? infoPagesClockSide(c, imgs, cur, d) : clock === "oben" ? infoPagesClockTop(c, imgs, cur, d) : infoPageIcons(c, imgs, cur);
  }
  if (clock === "rechts") { const p = pill(c, masks, cur, 8, 9, 28, 32, 18, 142, false); return bar(c, p.svg + t(222, 31, 26, c.text, hm(d), "end") + t(222, 45, 10, c.muted, `${DAYS[d.getDay()]} ${d.getDate()}. ${MONTHS[d.getMonth()]}`, "end", "normal")); }
  if (clock === "oben") { const p = pill(c, masks, cur, 8, 22, 26, 24, 15, 216, true); return bar(c, t(116, 17, 13, c.text, `${hm(d)} · ${DAYS[d.getDay()]} ${d.getDate()}. ${MONTHS[d.getMonth()]}`) + p.svg); }
  const p = pill(c, masks, cur, 8, 10, 30, 34, 20, 216, true); return bar(c, p.svg);
}

/** Taste für Home Assistant: an = gefüllte Fläche mit Symbol in Gegenfarbe, aus = ruhige Fläche, unbekannt = gestrichelter Rand. Der Zustand steht immer auch als Text. */
export function haKey(c: Col, mask: string, label: string, state: "on" | "off" | "unknown") {
  const on = state === "on", unk = state === "unknown";
  const fill = on ? c.main : c.bg, ic = on ? c.bg : c.muted, tx = on ? c.bg : c.text;
  const word = on ? T("AN", "ON") : unk ? "?" : T("AUS", "OFF");
  const body = `<rect x="3" y="3" width="138" height="138" rx="26" fill="${fill}" stroke="${c.main}" stroke-width="${on ? 0 : 3}"${unk ? ' stroke-dasharray="8 6"' : ""}/>` +
    tinted(mask, 34, 14, 76, ic) + `<text x="72" y="128" font-family="${SERIF}" font-size="20" font-weight="bold" text-anchor="middle" fill="${tx}">${esc(word)}</text>`;
  return uri(`<svg xmlns="http://www.w3.org/2000/svg" width="144" height="144" viewBox="0 0 144 144"><rect width="144" height="144" fill="${c.bg}"/>${body}</svg>`);
}

// ---------- Auto-Szenen: ausführliche Infoseiten und Übergänge ----------
const pad2 = (n: number) => String(n).padStart(2, "0");
const barLine = (c: Col, x: number, y: number, w: number, h: number, f: number) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}" fill="${c.tint}"/><rect x="${x}" y="${y}" width="${Math.max(h, w * Math.min(1, Math.max(0, f)))}" height="${h}" rx="${h / 2}" fill="${c.main}"/>`;
const dayOfYear = (d: Date) => Math.floor((+new Date(d.getFullYear(), d.getMonth(), d.getDate()) - +new Date(d.getFullYear(), 0, 0)) / 864e5);
const daysInYear = (y: number) => ((y % 4 === 0 && y % 100 !== 0) || y % 400 === 0 ? 366 : 365);

/** Mondphase als Anteil 0..1 (0 Neumond, 0.5 Vollmond), aus der mittleren synodischen Periode. */
export function moonAge(d: Date) { const days = (+d / 864e5) - 10962.7597; const syn = 29.530588853; return (((days % syn) + syn) % syn) / syn; }
function moonShape(c: Col, f: number, cx: number, cy: number, r: number) {
  const th = 2 * Math.PI * f, k = Math.cos(th), rx = Math.abs(k) * r, waxing = f < 0.5;
  let o = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${c.tint}" stroke="${c.muted}" stroke-opacity=".5" stroke-width="1"/>`;
  const lit = `M${cx} ${cy - r}A${r} ${r} 0 0 1 ${cx} ${cy + r}A${rx.toFixed(2)} ${r} 0 0 ${k < 0 ? 1 : 0} ${cx} ${cy - r}Z`;
  if (Math.min(f, 1 - f) > 0.01) o += `<path d="${lit}" fill="${c.main}"${waxing ? "" : ` transform="translate(${2 * cx} 0) scale(-1 1)"`}/>`;
  return o;
}
function moonName(f: number) {
  const n = [T("Neumond", "New moon"), T("Zunehmende Sichel", "Waxing crescent"), T("Erstes Viertel", "First quarter"), T("Zunehmender Mond", "Waxing gibbous"), T("Vollmond", "Full moon"), T("Abnehmender Mond", "Waning gibbous"), T("Letztes Viertel", "Last quarter"), T("Abnehmende Sichel", "Waning crescent")];
  return n[Math.floor(f * 8 + 0.5) % 8];
}

export const scene = {
  clock(c: Col, d: Date, seasonLabel: string) {
    const f = (d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds()) / 86400;
    return t(12, 34, 30, c.text, `${pad2(d.getHours())}:${pad2(d.getMinutes())}`, "start") + t(98, 34, 13, c.muted, pad2(d.getSeconds()), "start", "normal") +
      t(220, 21, 13, c.main, `${DAYS[d.getDay()]} ${d.getDate()}. ${MONTHS[d.getMonth()]}`, "end") + t(220, 35, 10.5, c.muted, `${T("KW", "Wk")} ${isoWeek(d)} · ${seasonLabel}`, "end", "normal") +
      barLine(c, 12, 42, 208, 3, f);
  },
  season(c: Col, season: SeasonKey, d: Date, img: string) {
    const p = seasonProgress(d), next = SEASON_LABEL[p.next];
    return (img ? image(img, 8, 7, 32) : glyph(season, 10, 9, 24, c.main, 1.8)) + t(48, 21, 16, c.text, SEASON_LABEL[season], "start") + t(222, 21, 13, c.main, `${Math.round(p.fraction * 100)} %`, "end") +
      t(48, 35, 10.5, c.muted, T(`noch ${p.daysLeft} Tage bis ${next}`, `${p.daysLeft} days to ${next}`), "start", "normal") + barLine(c, 48, 42, 174, 4, p.fraction);
  },
  year(c: Col, d: Date) {
    const f = moonAge(d), ill = Math.round(((1 - Math.cos(2 * Math.PI * f)) / 2) * 100), n = daysInYear(d.getFullYear()), doy = dayOfYear(d);
    return moonShape(c, f, 24, 24, 14) + t(48, 21, 14, c.text, moonName(f), "start") + t(222, 21, 12, c.main, `${d.getFullYear()} · ${Math.round((doy / n) * 100)} %`, "end") +
      t(48, 35, 10.5, c.muted, T(`${ill} % beleuchtet · Tag ${doy}/${n}`, `${ill} % lit · day ${doy}/${n}`), "start", "normal") + barLine(c, 48, 42, 174, 4, doy / n);
  },
  countdown(c: Col, label: string, target: Date, d: Date) {
    const days = Math.ceil((+target - +new Date(d.getFullYear(), d.getMonth(), d.getDate())) / 864e5);
    const big = days > 0 ? String(days) : days === 0 ? T("heute", "today") : T("vorbei", "over");
    const sub = days > 0 ? (days === 1 ? T("Tag", "day") : T("Tage", "days")) : "";
    return t(14, 36, 32, c.main, big, "start") + (sub ? t(14 + 17 * big.length + 8, 36, 13, c.muted, sub, "start", "normal") : "") + t(222, 24, 15, c.text, label || "Countdown", "end") +
      t(222, 38, 10.5, c.muted, `${target.getDate()}. ${MONTHS[target.getMonth()]} ${target.getFullYear()}`, "end", "normal");
  },
  timer(c: Col, phase: string, left: number, total: number) {
    const f = total > 0 ? Math.min(1, Math.max(0, 1 - left / total)) : 0, lab = phase === "work" ? T("Lernzeit", "Study") : phase === "break" ? T("Pause", "Break") : T("Bereit", "Ready");
    return t(14, 35, 30, c.text, phase === "idle" ? "--:--" : `${pad2(Math.floor(left / 60))}:${pad2(left % 60)}`, "start") + t(222, 24, 15, c.main, lab, "end") + barLine(c, 118, 33, 104, 5, f);
  },
  value(c: Col, label: string, value: string, unit: string) {
    const v = value.length > 9 ? value.slice(0, 9) : value;
    return t(14, 36, v.length > 6 ? 24 : 32, c.main, v, "start") + (unit ? t(14 + (v.length > 6 ? 12 : 16) * v.length + 6, 36, 13, c.muted, unit, "start", "normal") : "") + t(222, 31, 14, c.text, label, "end");
  },
};

/** Ein Übergangsbild aus zwei Szenen. p läuft von 0 bis 1. */
export function transition(c: Col, a: string, b: string, p: number, mode: string): string {
  const u = bgLayer(c, barKind());
  const e = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
  if (mode === "fade") return bar(c, `<g opacity="${(1 - e).toFixed(3)}">${a}</g><g opacity="${e.toFixed(3)}">${b}</g>`, u);
  if (mode === "rise") return bar(c, `<g transform="translate(0 ${(-47 * e).toFixed(2)})" opacity="${(1 - e).toFixed(3)}">${a}</g><g transform="translate(0 ${(47 * (1 - e)).toFixed(2)})" opacity="${e.toFixed(3)}">${b}</g>`, u);
  return bar(c, `<g transform="translate(${(-232 * e).toFixed(2)} 0)">${a}</g><g transform="translate(${(232 * (1 - e)).toFixed(2)} 0)">${b}</g>`, u);
}
/** Hintergrund hinter den Auto-Szenen: schlicht, Bögen, Lichtschein, feine Linien oder Punkte. */
export function bgLayer(c: Col, style: string): string {
  switch (style) {
    case "wallpaper": return wallBarSvg();
    case "arches": return `<g opacity=".3">${arches(c, 232, 50, 12, 9, -1)}</g>`;
    case "glow": return `<defs><radialGradient id="gA" cx="1" cy="0" r="1"><stop offset="0" stop-color="${c.main}" stop-opacity=".26"/><stop offset="1" stop-color="${c.main}" stop-opacity="0"/></radialGradient><radialGradient id="gB" cx="0" cy="1" r="0.8"><stop offset="0" stop-color="${c.main}" stop-opacity=".14"/><stop offset="1" stop-color="${c.main}" stop-opacity="0"/></radialGradient></defs><rect width="232" height="50" fill="url(#gA)"/><rect width="232" height="50" fill="url(#gB)"/>`;
    case "lines": return `<defs><pattern id="gL" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><rect width="1.3" height="9" fill="${c.muted}" opacity=".13"/></pattern></defs><rect width="232" height="50" fill="url(#gL)"/>`;
    case "dots": return `<defs><pattern id="gD" width="10" height="10" patternUnits="userSpaceOnUse"><circle cx="5" cy="5" r="1" fill="${c.muted}" opacity=".2"/></pattern></defs><rect width="232" height="50" fill="url(#gD)"/>`;
  }
  return "";
}
export const sceneBar = (c: Col, inner: string) => bar(c, inner);

/** Hintergrund für 144×144-Tasten, etwas größer gemustert als in der Infobar. */
export function bgLayerKey(c: Col, style: string): string {
  switch (style) {
    case "arches": return `<g opacity=".3">${arches(c, 144, 144, 4, 22, -1)}</g>`;
    case "glow": return `<defs><radialGradient id="kA" cx="1" cy="0" r="1"><stop offset="0" stop-color="${c.main}" stop-opacity=".3"/><stop offset="1" stop-color="${c.main}" stop-opacity="0"/></radialGradient><radialGradient id="kB" cx="0" cy="1" r="0.9"><stop offset="0" stop-color="${c.main}" stop-opacity=".16"/><stop offset="1" stop-color="${c.main}" stop-opacity="0"/></radialGradient></defs><rect width="144" height="144" fill="url(#kA)"/><rect width="144" height="144" fill="url(#kB)"/>`;
    case "lines": return `<defs><pattern id="kL" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><rect width="1.8" height="12" fill="${c.muted}" opacity=".13"/></pattern></defs><rect width="144" height="144" fill="url(#kL)"/>`;
    case "dots": return `<defs><pattern id="kD" width="14" height="14" patternUnits="userSpaceOnUse"><circle cx="7" cy="7" r="1.4" fill="${c.muted}" opacity=".2"/></pattern></defs><rect width="144" height="144" fill="url(#kD)"/>`;
  }
  return "";
}
/** Taste mit gewähltem Deck-Hintergrund: Symbol aus der Maske in Textfarbe, Akzentstrich unten (wie die Kacheln des Icon-Pakets). */
export function bgKey(c: Col, mask: string, col = 0, row = 0) {
  const wall = BG === "wallpaper", clear = BG === "clear";
  const glyphSvg = tinted(mask, 30, 22, 84, c.text);
  const shadow = wall || clear ? `<defs><filter id="sh" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="${c.bg}" flood-opacity=".75"/></filter></defs><g filter="url(#sh)">${glyphSvg}</g>` : glyphSvg;
  return uri(`<svg xmlns="http://www.w3.org/2000/svg" width="144" height="144" viewBox="0 0 144 144">${clear ? "" : `<rect width="144" height="144" fill="${c.bg}"/>`}${clear ? "" : wall ? wallKeySvg(col, row) : bgLayerKey(c, BG)}${wall || clear ? "" : `<rect width="144" height="6" fill="${c.main}"/>`}${shadow}<rect x="52" y="124" width="40" height="5" rx="2.5" fill="${c.main}"/></svg>`);
}

// ---------- Deck-Hintergrund: ein Bild über alle Tasten und die Infobar ----------
export type WallSig = { season: SeasonKey; mode: "hell" | "dunkel"; style: string };
let DECK = { cols: 4, rows: 2 };
export const setDeck = (cols: number, rows: number) => { if (cols > 0 && rows > 0) DECK = { cols, rows }; };
const WG = 40; // Abstand zwischen den Tasten im Gesamtbild
function paneSize() { const W = DECK.cols * 144 + (DECK.cols - 1) * WG, Hk = DECK.rows * 144 + (DECK.rows - 1) * WG, Hb = Math.round((W * 50) / 232); return { W, Hk, Hb, H: Hk + WG + Hb }; }
let WALL: { from: WallSig | null; to: WallSig; p: number; mode: string } = { from: null, to: { season: "standard", mode: "hell", style: "scene" }, p: 1, mode: "slide" };
export const setWall = (w: typeof WALL) => { WALL = w; };
export const getWallTo = () => WALL.to;
const rng = (seed: number) => () => { seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
let wallId = 0;
/** Das Gesamtbild für eine Jahreszeit, Tageszeit und einen Stil, in den Maßen des ganzen Decks. */
function wallGroup(sig: WallSig): string {
  const c = (PAL as any)[sig.season][sig.mode] as Col, { W, H, Hk } = paneSize(), id = "w" + wallId++, night = sig.mode === "dunkel";
  const r = rng(sig.season.length * 977 + (night ? 7 : 3));
  let o = `<defs><linearGradient id="${id}b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c.bg}"/><stop offset="1" stop-color="${c.tint}"/></linearGradient><radialGradient id="${id}s"><stop offset="0" stop-color="${night ? c.text : c.muted}" stop-opacity="${night ? 0.55 : 0.3}"/><stop offset="1" stop-color="${night ? c.text : c.muted}" stop-opacity="0"/></radialGradient></defs><rect width="${W}" height="${H}" fill="url(#${id}b)"/>`;
  if (sig.style === "waves") {
    for (let k = 0; k < 4; k++) {
      const y0 = H * (0.35 + k * 0.17), amp = 26 + k * 8, ph = r() * 6; let d = `M0 ${H}V${y0}`;
      for (let x = 0; x <= W + 20; x += 20) d += `L${x} ${(y0 + Math.sin(x / (110 + k * 30) + ph) * amp).toFixed(1)}`;
      o += `<path d="${d}V${H}Z" fill="${c.main}" fill-opacity="${(0.07 + k * 0.06).toFixed(2)}"/>`;
    }
    return o;
  }
  const TT0 = 2 * Math.PI * ANIM, sx = W * 0.74, sy = Hk * 0.3;
  o += `<circle cx="${sx}" cy="${sy}" r="${night ? 130 : 170}" fill="url(#${id}s)"/><circle cx="${sx}" cy="${sy}" r="${night ? 46 : 60}" fill="${night ? c.text : c.muted}" fill-opacity="${night ? 0.9 : 0.4}"/>`;
  if (night) for (let k = 0; k < 40; k++) { const sx2 = r() * W, sy2 = r() * Hk * 0.8, sr = 0.8 + r() * 1.4, so = 0.3 + r() * 0.5, tw = ANIM ? 0.6 + 0.4 * Math.sin(TT0 * (1 + (k % 2)) + k) : 1; o += `<circle cx="${sx2.toFixed(0)}" cy="${sy2.toFixed(0)}" r="${sr.toFixed(1)}" fill="${c.text}" fill-opacity="${(so * tw).toFixed(2)}"/>`; }
  const n = sig.season === "winter" ? 46 : sig.season === "standard" ? 0 : 28;
  const TT = 2 * Math.PI * ANIM;
  for (let k = 0; k < n; k++) {
    let x = r() * W, y = r() * H; const a = r() * 180, z = 0.6 + r() * 0.9;
    if (sig.season === "winter") { const rr = 1.5 + r() * 2.6, op = 0.35 + r() * 0.4; y = (y + ANIM * H) % H; x += 22 * Math.sin(TT + k); o += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${rr.toFixed(1)}" fill="${c.text}" fill-opacity="${op.toFixed(2)}"/>`; }
    else if (sig.season === "sommer") { const rr = 2 + r() * 3, op = 0.25 + r() * 0.3; y = ((y - ANIM * H * 0.6) % H + H) % H; x += 26 * Math.sin(TT + k); const tw = ANIM ? 0.55 + 0.45 * Math.sin(TT * 2 + k) : 1; o += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${rr.toFixed(1)}" fill="${c.main}" fill-opacity="${(op * tw).toFixed(2)}"/>`; }
    else { const op = 0.3 + r() * 0.35; y = (y + ANIM * H) % H; x += 40 * Math.sin(TT + k); const rot = a + ANIM * 360 * (k % 2 ? 1 : -1); o += `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="${(7 * z).toFixed(1)}" ry="${(3.4 * z).toFixed(1)}" transform="rotate(${rot.toFixed(0)} ${x.toFixed(1)} ${y.toFixed(1)})" fill="${c.main}" fill-opacity="${op.toFixed(2)}"/>`; }
  }
  o += `<g transform="translate(0 ${H - 230})" opacity=".4">${arches(c, W, 230, 9, 120, -1)}</g><g transform="translate(0 ${H - 120})" opacity=".55">${arches(c, W, 120, 14, 56, -1)}</g>`;
  return o;
}
/** Das Bild im Übergang: alt und neu zusammen, oder nur das neue. */
function wallPane(): string {
  const { W, H } = paneSize(), to = wallGroup(WALL.to);
  if (!WALL.from || WALL.p >= 1 || WALL.mode === "none") return to;
  const from = wallGroup(WALL.from), e = WALL.p < 0.5 ? 4 * WALL.p ** 3 : 1 - Math.pow(-2 * WALL.p + 2, 3) / 2;
  if (WALL.mode === "fade") return `<g opacity="${(1 - e).toFixed(3)}">${from}</g><g opacity="${e.toFixed(3)}">${to}</g>`;
  if (WALL.mode === "rise") return `<g transform="translate(0 ${(-H * e).toFixed(1)})">${from}</g><g transform="translate(0 ${(H * (1 - e)).toFixed(1)})">${to}</g>`;
  return `<g transform="translate(${(-W * e).toFixed(1)} 0)">${from}</g><g transform="translate(${(W * (1 - e)).toFixed(1)} 0)">${to}</g>`;
}
function wallKeySvg(col: number, row: number) {
  return `<svg x="0" y="0" width="144" height="144" viewBox="${col * (144 + WG)} ${row * (144 + WG)} 144 144">${wallPane()}</svg>`;
}
function wallBarSvg() {
  const { W, Hk, Hb } = paneSize();
  return `<svg x="0" y="0" width="232" height="50" viewBox="0 ${Hk + WG} ${W} ${Hb}">${wallPane()}</svg>`;
}
