import { SEASON_LABEL } from "./palette";
import { DAYS, MONTHS } from "./theme";
export let lang: "de" | "en" = "en";
/** Text in der Sprache der Stream Deck App (Deutsch, sonst Englisch). */
export const T = (de: string, en: string) => (lang === "de" ? de : en);
const NAMES = { de: { standard: "Standard", fruehling: "Frühling", sommer: "Sommer", herbst: "Herbst", winter: "Winter" }, en: { standard: "Default", fruehling: "Spring", sommer: "Summer", herbst: "Autumn", winter: "Winter" } };
const D = { de: ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"], en: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] };
const M = { de: ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"], en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] };
export function setLang(code: string) {
  lang = String(code).toLowerCase().startsWith("de") ? "de" : "en";
  Object.assign(SEASON_LABEL, NAMES[lang]); DAYS.splice(0, 7, ...D[lang]); MONTHS.splice(0, 12, ...M[lang]);
}
setLang("en");
