import json, os, re
UUID_NAME = "season-themes"
P = f"uk.novaroma-homelab.{UUID_NAME}"; D = f"{P}.sdPlugin"
for d in ("bin", "ui", "layouts", "imgs/actions", "imgs/states"): os.makedirs(f"{D}/{d}", exist_ok=True)
PACK = sorted({f.split("-", 2)[2][:-4] for f in os.listdir(f"{D}/imgs/pack")})
SEASONS = [("standard","Default"),("fruehling","Spring"),("sommer","Summer"),("herbst","Autumn"),("winter","Winter")]
NAME_EN = {g: g.replace("-", " ").title() for g in PACK}
NAME_EN.update(gradcap="Graduation cap", pullrequest="Pull request", mic="Microphone", volume="Volume", home="Home", mute="Mute", eye="Eye", blank="Blank")

def PI(fields):
    return f'<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><script src="https://sdpi-components.dev/releases/v4/sdpi-components.js"></script></head><body>{fields}</body></html>'
def sel(setting, label, opts, required=True, default=None):
    o = "".join(f'<option value="{v}">{t}</option>' for v, t in opts)
    d = default if default is not None else opts[0][0]
    return f'<sdpi-item label="{label}"><sdpi-select setting="{setting}" default="{d}"{" required" if required else ""}>{o}</sdpi-select></sdpi-item>'
def txt(setting, label, ph="", rows=None, pattern=None, required=False):
    pat = f' pattern="{pattern}"' if pattern else ""
    req = " required" if required else ""
    if rows: return f'<sdpi-item label="{label}"><sdpi-textarea setting="{setting}" rows="{rows}" placeholder="{ph}"></sdpi-textarea></sdpi-item>'
    return f'<sdpi-item label="{label}"><sdpi-textfield setting="{setting}" placeholder="{ph}"{pat}{req}></sdpi-textfield></sdpi-item>'
def num(setting, label, default): return txt(setting, label, str(default), pattern="[0-9]+")
glyph_opts = [(g, NAME_EN[g]) for g in PACK]
season_opts = [(k, n) for k, n in SEASONS]
page_styles = [("pill","Pill"),("pill-clock-right","Pill with clock on the right"),("pill-clock-top","Pill with clock on top"),("tiles","Tiles"),("tiles-clock-right","Tiles with clock on the right"),("tiles-clock-top","Tiles with clock on top")]
HA_GLOBAL = ('<sdpi-item label="Home Assistant URL"><sdpi-textfield setting="haUrl" global placeholder="http://homeassistant.local:8123" pattern="https?://.+"></sdpi-textfield></sdpi-item>'
             '<sdpi-item label="Access token"><sdpi-password setting="haToken" global placeholder="Long-lived access token"></sdpi-password></sdpi-item>')
PIS = {
 "season": PI(sel("mode","Button",[("cycle","Cycle (Auto, Default, Spring ...)"),("set","Set a season"),("follow","Follow the calendar (Auto)")]) + sel("season","Season",season_opts)),
 "theme": PI(sel("mode","Button",[("cycle","Cycle (Auto, Light, Dark)"),("set","Set a theme"),("follow","Automatic")]) + sel("theme","Theme",[("hell","Light"),("dunkel","Dark")])),
 "launcher": PI(txt("title","Title","Mail") + sel("glyph","Icon",glyph_opts,default="star") + sel("type","Opens",[("url","Link (https, mailto)"),("app","App")]) + txt("target","Target","https://... or app name", required=True)),
 "timer": PI(num("work","Study minutes",25) + num("brk","Break minutes",5)),
 "icon": PI(txt("title","Title","") + sel("glyph","Icon",glyph_opts,default="star") + txt("target","Link (optional)","https://...")),
 "ib-icon": PI(sel("glyph","Icon",glyph_opts,default="star") + txt("line1","Line 1","Novaroma") + txt("line2","Line 2 (optional)","")),
 "ib-backdrop": PI(sel("style","Style",[("boegen","Aqueduct arches"),("flaeche","Plain")])),
 "ib-pages": PI(sel("style","Style",page_styles) + num("current","Current page number",1) + "".join(sel(f"g{i}",f"Page {i} icon",[("-","(none)")]+glyph_opts, required=False, default=["home","headphones","sun","gradcap","wrench","gear","plus"][i-1]) for i in range(1,8))),
 "ib-page": PI(txt("name","Page name","Home") + num("current","Current page",1) + num("count","Number of pages",3)),
 "ha-toggle": PI(HA_GLOBAL + txt("entity","Entity","light.living_room",pattern="[a-z_]+\\.[a-z0-9_]+",required=True) + txt("title","Title","Light") + sel("glyph","Icon",glyph_opts,default="bolt")),
 "ha-service": PI(HA_GLOBAL + txt("service","Service","scene.turn_on",pattern="[a-z_]+\\.[a-z_]+",required=True) + txt("entity","Entity (optional)","scene.movie") + txt("data","Extra data (JSON, optional)","{&quot;brightness&quot;: 120}",rows=3) + txt("title","Title","Scene") + sel("glyph","Icon",glyph_opts,default="bolt")),
 "ib-text": PI(txt("line1","Line 1","Novaroma") + txt("line2","Line 2 (optional)","")),
 "ib-banner": PI(txt("text","Text","Novaroma")),
 "ib-countdown": PI(txt("label","Title","Exam") + txt("date","Date","2027-06-30",pattern="\\d{4}-\\d{2}-\\d{2}")),
 "ib-homelab": PI(txt("targets","Targets","Name|URL, one per line",rows=5)),
}
for k, v in PIS.items(): open(f"{D}/ui/{k}.html", "w").write(v)

# (id, Name EN, Tooltip EN, Name DE, Tooltip DE, Controller, PI)
ACT = [
 ("season","Season","Cycle, set or follow the season","Jahreszeit","Jahreszeit weiterschalten, festlegen oder dem Kalender folgen","Keypad",True),
 ("theme","Theme","Switch between light, dark and automatic","Thema","Hell, Dunkel oder automatisch","Keypad",True),
 ("launcher","Launcher","Open a link or app in the season colours","Starter","Adresse oder App in den Farben der Jahreszeit","Keypad",True),
 ("timer","Study Timer","Study and break timer","Lernzeit","Lernzeit und Pause","Keypad",True),
 ("icon","Icon","Show an icon in the season colours","Symbol","Ein Symbol in den Farben der Jahreszeit","Keypad",True),
 ("ha-toggle","Home Assistant: Toggle","Toggle an entity and show its state","Home Assistant: Schalten","Entität schalten und Zustand anzeigen","Keypad",True),
 ("ha-service","Home Assistant: Service","Call a service, scene or script","Home Assistant: Dienst","Dienst, Szene oder Skript ausführen","Keypad",True),
 ("ib-pages","Infobar: Pages & Clock","Page icons with optional clock","Infobar: Seiten und Uhr","Seitensymbole, optional mit Uhr","Neo",True),
 ("ib-page","Infobar: Page Name","Page name with dots","Infobar: Seitenname","Seitenname mit Punkten","Neo",True),
 ("ib-icon","Infobar: Icon & Text","Icon with one or two lines","Infobar: Symbol und Text","Symbol mit ein oder zwei Zeilen","Neo",True),
 ("ib-clock","Infobar: Clock","Time, date and week","Infobar: Uhr","Uhrzeit, Datum und Kalenderwoche","Neo",False),
 ("ib-season","Infobar: Season","Season with progress","Infobar: Jahreszeit","Jahreszeit mit Fortschritt","Neo",False),
 ("ib-homelab","Infobar: Server Status","Reachability of your services","Infobar: Dienste","Erreichbarkeit der Dienste","Neo",True),
 ("ib-countdown","Infobar: Countdown","Days until a date","Infobar: Countdown","Tage bis zu einem Datum","Neo",True),
 ("ib-timer","Infobar: Study Timer","Progress of the study timer","Infobar: Lernzeit","Fortschritt der Lernzeit","Neo",False),
 ("ib-backdrop","Infobar: Backdrop","Aqueduct backdrop in the season colours","Infobar: Hintergrund","Aquädukt-Hintergrund","Neo",True),
 ("ib-text","Infobar: Text","Custom text","Infobar: Text","Eigener Text","Neo",True),
 ("ib-banner","Infobar: Banner","Text with arches","Infobar: Banner","Text mit Bögen","Neo",True),
]
STATE_GLYPH = {"ha-toggle":"bolt","ha-service":"bolt","season":"arch","theme":"sun","launcher":"star","timer":"stopwatch","icon":"star"}
actions = []
for id, n, tip, nd, tipd, ctrl, pi in ACT:
    assert len(n) <= 30, n
    img = f"imgs/states/{id}" if id in STATE_GLYPH else f"imgs/actions/{id}"
    a = {"UUID": f"{P}.{id}", "Name": n, "Tooltip": tip, "Icon": f"imgs/actions/{id}", "Controllers": [ctrl], "States": [{"Image": img}]}
    if pi: a["PropertyInspectorPath"] = f"ui/{id}.html"
    actions.append(a)
manifest = {"$schema":"https://schemas.elgato.com/streamdeck/plugins/manifest.json","UUID":P,"Name":"Novaroma Season Themes","Version":"1.0.0.0",
 "Author":"JestingDart4369",
 "Description":"Seasonal colour themes for your keys and the Stream Deck Neo infobar: follow or set the season, switch light and dark, launcher keys, study timer, clock, countdown, server status and page indicators.",
 "Category":"Novaroma Season Themes","CategoryIcon":"imgs/category","Icon":"imgs/plugin","CodePath":"bin/plugin.js","SDKVersion":3,
 "Nodejs":{"Version":"20"},"Software":{"MinimumVersion":"7.6"},
 "OS":[{"Platform":"mac","MinimumVersion":"13"},{"Platform":"windows","MinimumVersion":"10"}],"Actions":actions}
json.dump(manifest, open(f"{D}/manifest.json","w"), ensure_ascii=False, indent=2)
de = {"Name":"Novaroma Jahreszeiten-Themen","Description":"Jahreszeitliche Farbthemen für Tasten und die Infobar des Stream Deck Neo: Jahreszeit folgen oder festlegen, Hell und Dunkel, Starter, Lernzeit, Uhr, Countdown, Dienststatus und Seitenanzeiger.","Category":"Novaroma Jahreszeiten-Themen"}
for id, n, tip, nd, tipd, ctrl, pi in ACT: de[f"{P}.{id}"] = {"Name": nd, "Tooltip": tipd}
json.dump(de, open(f"{D}/de.json","w"), ensure_ascii=False, indent=2)
json.dump({"$schema":"https://schemas.elgato.com/streamdeck/plugins/layout.json","id":"neo","controller":"Neo","items":[{"key":"image","type":"pixmap","rect":[0,0,232,50]}]}, open(f"{D}/layouts/neo.json","w"), indent=2)

# Symbole: weiße Linien auf transparentem Grund (Vorgabe für Aktions- und Kategoriesymbole)
g = open("src/glyphs.ts").read()
def gl(name): return re.search(r"\b%s: '(.*?)',\n" % name, g, re.S).group(1)
def icon(body): return f'<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">{body}</svg>'
clock = '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'
body = {"season":gl("fruehling"),"theme":gl("sun"),"launcher":gl("star"),"timer":gl("gradcap"),"icon":gl("star"),"ha-toggle":gl("bolt"),"ha-service":gl("bolt"),"ib-icon":gl("star"),"ib-backdrop":gl("standard"),
 "ib-pages":'<circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/>',"ib-page":'<circle cx="6" cy="12" r="1.8"/><rect x="10" y="10.2" width="6" height="3.6" rx="1.8"/><circle cx="20" cy="12" r="1.8"/>',
 "ib-clock":clock,"ib-season":gl("standard"),"ib-homelab":gl("server"),"ib-countdown":gl("calendar"),"ib-timer":gl("play"),"ib-text":'<path d="M5 7h14M12 7v12M9 19h6"/>',"ib-banner":gl("standard")}
for k, b in body.items(): open(f"{D}/imgs/actions/{k}.svg","w").write(icon(b))
open(f"{D}/imgs/category.svg","w").write(icon(gl("standard")))
big = '<svg xmlns="http://www.w3.org/2000/svg" width="288" height="288" viewBox="0 0 288 288"><rect width="288" height="288" rx="44" fill="#5e282c"/><g transform="translate(54 54) scale(7.5)" fill="none" stroke="#F6EFE3" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">%s</g></svg>' % gl("standard")
open("imgs_plugin.svg","w").write(big)
# Tastenbilder für die Aktionsliste (72 px, @2x 144 px)
from PIL import Image
for id, gname in STATE_GLYPH.items():
    im = Image.open(f"{D}/imgs/pack/standard-light-{gname}.png").convert("RGBA")
    im.save(f"{D}/imgs/states/{id}@2x.png"); im.resize((72,72), Image.LANCZOS).save(f"{D}/imgs/states/{id}.png")
