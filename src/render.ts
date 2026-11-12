import { GLYPHS } from "./glyphs";
import { T } from "./i18n";
import { Col } from "./palette";
import { DAYS, MONTHS, isoWeek, seasonProgress, SEASON_ORDER } from "./theme";
import { SEASON_LABEL, SeasonKey } from "./palette";

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
  return uri(`<svg xmlns="http://www.w3.org/2000/svg" width="144" height="144" viewBox="0 0 144 144"><rect width="144" height="144" fill="${c.bg}"/><rect x="0" y="0" width="144" height="6" fill="${accent}"/>${glyph(g, gx, gy + 6, gs, accent, 1.7)}${lab}${bad}</svg>`);
}

/** Infobar 232×50. */
export function bar(c: Col, inner: string): string {
  return uri(`<svg xmlns="http://www.w3.org/2000/svg" width="232" height="50" viewBox="0 0 232 50"><rect width="232" height="50" fill="${c.bg}"/><rect width="232" height="3" fill="${c.main}"/>${inner}</svg>`);
}
const t = (x: number, y: number, s: number, fill: string, text: string, anchor = "middle", w = "bold", ls = 0) =>
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
  return bar(c, style === "flaeche" ? "" : arches(c, 232, 50, 10, 14, ph));
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
