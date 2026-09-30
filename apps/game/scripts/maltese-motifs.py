"""Generates src/ui/maltese.css: the Maltese theme's SVG motifs as data URIs plus their rules.

Run: python3 apps/game/scripts/maltese-motifs.py (from the repo root). The motifs are original
drawings in the manner of Maltese madum floor tiles, bizzilla bobbin lace, gallarija balconies
and luzzu boat paint.
"""
from urllib.parse import quote

C = {
    'cream': '#efe3c6', 'lime': '#d9c08a', 'limeDark': '#b99a5c', 'green': '#1f5040',
    'greenDark': '#123328', 'red': '#b02e2a', 'blue': '#1d5fa8', 'yellow': '#f2c230',
    'ink': '#1a1512',
}


def uri(svg: str) -> str:
    return 'url("data:image/svg+xml,' + quote(' '.join(svg.split()), safe=' =:/,.\'-()') + '")'


# Madum: a 19th-century style cement tile in its usual chalky colours. Each tile carries a quarter
# of a large medallion in every corner, so four tiles meet around one full rosette straddling the
# grout, with a small star at each tile's centre.
M = {'ground': '#e8dcc3', 'terra': '#9c4a32', 'slate': '#4a5560', 'ochre': '#c9a24a', 'sage': '#6f8466'}
corner_petals = ''.join(
    f"<ellipse cx='0' cy='-26' rx='7' ry='15' transform='rotate({a})'/>" for a in range(0, 360, 45)
)
madum = f"""<svg xmlns='http://www.w3.org/2000/svg' width='144' height='144' viewBox='0 0 144 144'>
<rect width='144' height='144' fill='{M['ground']}'/>
<g id='c'>
<g fill='{M['sage']}'>{corner_petals}</g>
<circle r='22' fill='{M['terra']}'/><circle r='15' fill='{M['ground']}'/>
<g fill='{M['slate']}'><path d='M0-14 4 0 0 14-4 0z'/><path d='M-14 0 0-4 14 0 0 4z'/></g>
<circle r='4' fill='{M['ochre']}'/>
<circle r='44' fill='none' stroke='{M['terra']}' stroke-width='3'/>
</g>
<use href='#c' x='144'/><use href='#c' y='144'/><use href='#c' x='144' y='144'/>
<g transform='translate(72 72)'>
<g fill='{M['ochre']}'><path d='M0-18 5-5 18 0 5 5 0 18-5 5-18 0-5-5z'/></g>
<circle r='5' fill='{M['terra']}'/>
<g fill='{M['slate']}'><circle cx='0' cy='-30' r='3'/><circle cx='0' cy='30' r='3'/><circle cx='-30' cy='0' r='3'/><circle cx='30' cy='0' r='3'/></g>
</g>
<rect x='.5' y='.5' width='143' height='143' fill='none' stroke='#b7a582' stroke-opacity='.6'/>
</svg>"""

# Bizzilla: a scalloped lace edge with pierced eyelets and a picot row; every third scallop carries
# a tiny eight-pointed cross, as Maltese lace does.
lace = """<svg xmlns='http://www.w3.org/2000/svg' width='72' height='16' viewBox='0 0 72 16'>
<path fill='#fbf5e6' fill-rule='evenodd' d='M0 0H72V4Q66 16 60 4Q54 16 48 4Q42 16 36 4Q30 16 24 4Q18 16 12 4Q6 16 0 4Z
M18 7.4a2 2 0 1 0 .01 0Z M30 7.4a2 2 0 1 0 .01 0Z M42 7.4a2 2 0 1 0 .01 0Z M54 7.4a2 2 0 1 0 .01 0Z M66 7.4a2 2 0 1 0 .01 0Z
M3 2a.8 .8 0 1 0 .01 0Z M9 2a.8 .8 0 1 0 .01 0Z M15 2a.8 .8 0 1 0 .01 0Z M21 2a.8 .8 0 1 0 .01 0Z M27 2a.8 .8 0 1 0 .01 0Z M33 2a.8 .8 0 1 0 .01 0Z
M39 2a.8 .8 0 1 0 .01 0Z M45 2a.8 .8 0 1 0 .01 0Z M51 2a.8 .8 0 1 0 .01 0Z M57 2a.8 .8 0 1 0 .01 0Z M63 2a.8 .8 0 1 0 .01 0Z M69 2a.8 .8 0 1 0 .01 0Z'/>
<g transform='translate(6 7.6) scale(.3)' fill='#1a1512'><path d='M0 0L-7-15 0-10 7-15Z'/><path d='M0 0L-7 15 0 10 7 15Z'/><path d='M0 0L-15-7-10 0-15 7Z'/><path d='M0 0L15-7 10 0 15 7Z'/></g>
</svg>"""

# A round bizzilla rosette (eight petals around pierced rings) for corners and dividers.
rosette_petals = ''.join(
    f"<ellipse cx='20' cy='8' rx='4' ry='7' transform='rotate({a} 20 20)'/>" for a in range(0, 360, 45)
)
rosette = f"""<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'>
<g fill='none' stroke='#fbf5e6' stroke-width='1.3'>{rosette_petals}<circle cx='20' cy='20' r='5'/><circle cx='20' cy='20' r='17.5' stroke-dasharray='2 2'/></g>
<circle cx='20' cy='20' r='1.8' fill='#fbf5e6'/>
</svg>"""

# The eight-pointed Maltese cross, for selection markers and emblems.
def cross(fill: str) -> str:
    return f"""<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='-16 -16 32 32'>
<g fill='{fill}'><path d='M0 0L-7-15 0-10 7-15Z'/><path d='M0 0L-7 15 0 10 7 15Z'/><path d='M0 0L-15-7-10 0-15 7Z'/><path d='M0 0L15-7 10 0 15 7Z'/></g>
</svg>"""

def badge() -> str:
    return f"""<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='-20 -20 40 40'>
<path d='M-17-17H17V4C17 13 8 18 0 20C-8 18-17 13-17 4Z' fill='{C['red']}' stroke='{C['cream']}' stroke-width='1.5'/>
<g fill='#fff' transform='translate(0 -1) scale(.9)'><path d='M0 0L-7-15 0-10 7-15Z'/><path d='M0 0L-7 15 0 10 7 15Z'/><path d='M0 0L-15-7-10 0-15 7Z'/><path d='M0 0L15-7 10 0 15 7Z'/></g>
</svg>"""


# Gallarija cornice: the stepped moulding on top of an enclosed balcony, and the carved
# limestone corbels that hold it up.
cornice = f"""<svg xmlns='http://www.w3.org/2000/svg' width='40' height='14' viewBox='0 0 40 14'>
<rect width='40' height='4' fill='{C['cream']}'/><rect y='4' width='40' height='3' fill='{C['green']}'/>
<rect y='7' width='40' height='2' fill='{C['cream']}'/><rect y='9' width='40' height='5' fill='{C['greenDark']}'/>
<g fill='{C['cream']}'><rect x='4' y='10' width='4' height='3'/><rect x='14' y='10' width='4' height='3'/><rect x='24' y='10' width='4' height='3'/><rect x='34' y='10' width='4' height='3'/></g>
</svg>"""
corbels = f"""<svg xmlns='http://www.w3.org/2000/svg' width='120' height='24' viewBox='0 0 120 24'>
<rect width='120' height='6' fill='#d4b27a'/><rect y='5' width='120' height='1.5' fill='{C['limeDark']}'/>
<path d='M44 6h32v3c0 4-3 5-7 6c-3 1-5 3-5 6c0 2-1 3-4 3s-4-1-4-3c0-3-2-5-5-6c-4-1-7-2-7-6z' fill='#d4b27a' stroke='{C['limeDark']}' stroke-width='1.2'/>
<path d='M53 10c3 0 4 2 3 4M67 10c-3 0-4 2-3 4' fill='none' stroke='{C['limeDark']}' stroke-width='1.2'/>
</svg>"""
# Luzzu: the fishing boat's painted bands, used as a divider.
luzzu_band = (
    f"linear-gradient(180deg, {C['yellow']} 0 25%, {C['red']} 25% 50%, {C['green']} 50% 75%, {C['blue']} 75% 100%)"
)

css = f"""/*
 * Maltese theme (generated by scripts/maltese-motifs.py, do not edit by hand).
 * Madum cement tiles, bizzilla lace, gallarija balconies, the Maltese cross and luzzu paint.
 * These are later Maltese traditions than 1565: an artistic frame around the story.
 */
:root {{
  --mt-cream: {C['cream']};
  --mt-lime: {C['lime']};
  --mt-lime-dark: {C['limeDark']};
  --mt-green: {C['green']};
  --mt-green-dark: {C['greenDark']};
  --mt-red: {C['red']};
  --mt-blue: {C['blue']};
  --mt-yellow: {C['yellow']};
  --mt-madum: {uri(madum)};
  --mt-lace: {uri(lace)};
  --mt-rosette: {uri(rosette)};
  --mt-cross: {uri(cross(C['cream']))};
  --mt-cross-gold: {uri(cross('#ffd76a'))};
  --mt-cross-red: {uri(cross(C['red']))};
  --mt-badge: {uri(badge())};
  --mt-cornice: {uri(cornice)};
  --mt-corbels: {uri(corbels)};
  --mt-luzzu: {luzzu_band};
  --gold: #d9b56a;
  --blood: {C['red']};
}}
"""

import pathlib
out = pathlib.Path(__file__).resolve().parent.parent / 'src' / 'ui' / 'maltese.generated.css'
out.write_text(css)
print('wrote', out)
