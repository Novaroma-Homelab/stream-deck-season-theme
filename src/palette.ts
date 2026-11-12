// erzeugt aus den Novaroma-Tokens (design-system/tokens), nicht von Hand ändern
export const SEASON_LABEL: Record<string,string> = {"standard": "Standard", "fruehling": "Frühling", "sommer": "Sommer", "herbst": "Herbst", "winter": "Winter"};
export type SeasonKey = "standard"|"fruehling"|"sommer"|"herbst"|"winter";
export type Mode = "hell"|"dunkel";
export interface Col { bg:string; text:string; muted:string; main:string; ink:string; tint:string; pressed:string }
export const PAL: Record<SeasonKey, Record<Mode, Col>> = {
 "standard": {
  "hell": {
   "bg": "#f6f7fb",
   "text": "#190607",
   "muted": "#7e6e56",
   "main": "#5e282c",
   "ink": "#886c2b",
   "tint": "#eee3c9",
   "pressed": "#451d20"
  },
  "dunkel": {
   "bg": "#1b0e0f",
   "text": "#fff8ea",
   "muted": "#b7a68b",
   "main": "#eee3c9",
   "ink": "#eee3c9",
   "tint": "#6e3338",
   "pressed": "#cfc2a3"
  }
 },
 "fruehling": {
  "hell": {
   "bg": "#fbf3f6",
   "text": "#190607",
   "muted": "#8e6271",
   "main": "#5e282c",
   "ink": "#d02267",
   "tint": "#f5c2d6",
   "pressed": "#451d20"
  },
  "dunkel": {
   "bg": "#1f0f14",
   "text": "#fff8ea",
   "muted": "#cfa6b6",
   "main": "#f29bbb",
   "ink": "#f29bbb",
   "tint": "#6b2c43",
   "pressed": "#cfc2a3"
  }
 },
 "sommer": {
  "hell": {
   "bg": "#fdf8ea",
   "text": "#190607",
   "muted": "#836e42",
   "main": "#5e282c",
   "ink": "#916900",
   "tint": "#ffd66b",
   "pressed": "#451d20"
  },
  "dunkel": {
   "bg": "#1d1608",
   "text": "#fff8ea",
   "muted": "#cdb67e",
   "main": "#f5cf5f",
   "ink": "#f5cf5f",
   "tint": "#5a4510",
   "pressed": "#cfc2a3"
  }
 },
 "herbst": {
  "hell": {
   "bg": "#f8f0e6",
   "text": "#190607",
   "muted": "#85664c",
   "main": "#5e282c",
   "ink": "#946212",
   "tint": "#e8a63d",
   "pressed": "#451d20"
  },
  "dunkel": {
   "bg": "#1d1109",
   "text": "#fff8ea",
   "muted": "#cfa883",
   "main": "#eeb25a",
   "ink": "#eeb25a",
   "tint": "#6a4513",
   "pressed": "#cfc2a3"
  }
 },
 "winter": {
  "hell": {
   "bg": "#f1f5fa",
   "text": "#190607",
   "muted": "#5c7084",
   "main": "#5e282c",
   "ink": "#1d71b9",
   "tint": "#bfdcf5",
   "pressed": "#451d20"
  },
  "dunkel": {
   "bg": "#0e1620",
   "text": "#fff8ea",
   "muted": "#9db6cc",
   "main": "#8dc2ee",
   "ink": "#8dc2ee",
   "tint": "#25405c",
   "pressed": "#cfc2a3"
  }
 }
};
