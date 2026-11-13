"""Convierte los textos del guion en subtítulos ASS nítidos (estilo TikTok) para quemarlos con ffmpeg."""
import json, re

caps = json.load(open("frames/captions.json"))
end_t = next(t for n, t in json.load(open("frames/events.json")) if n == "end")

def ass_color(hexrgb):
    h = hexrgb.lstrip("#")
    if len(h) == 3: h = "".join(c * 2 for c in h)
    r, g, b = h[0:2], h[2:4], h[4:6]
    return f"&H00{b}{g}{r}&".upper()

EMOJI = re.compile("[\U0001F000-\U0001FAFF☀-➿⭐⬆↔-⇿️‍✅✔✨]")

def to_ass(html):
    t = EMOJI.sub("", html)
    t = re.sub(r"<small>(.*?)</small>", lambda m: "{\\fs54\\c" + ass_color("#c6ff3d") + "}" + m.group(1).strip() + "{\\r}\\N", t)
    t = re.sub(r"<br\s*/?>", r"\\N", t)
    t = re.sub(r"<b>(.*?)</b>", r"\1", t)
    def span(m):
        style, inner = m.group(1), m.group(2)
        col = re.search(r"color:\s*(#[0-9a-fA-F]{3,6})", style)
        size = re.search(r"font-size:\s*(\d+)px", style)
        pre = ""
        if col: pre += "\\c" + ass_color(col.group(1))
        if size: pre += "\\fs58"
        return ("{" + pre + "}" if pre else "") + inner + ("{\\c&H00FFFFFF&\\fs78}" if pre else "")
    for _ in range(3):
        t = re.sub(r"<span style=['\"]([^'\"]*)['\"]>(.*?)</span>", span, t)
    t = re.sub(r"<[^>]+>", "", t)
    t = EMOJI.sub("", t)
    t = re.sub(r"[ \t]{2,}", " ", t)
    t = re.sub(r"\s*\\N\s*", r"\\N", t).strip()
    t = re.sub(r"(\\N)+$", "", t)
    return t

def ts(x):
    x = max(0, x); h = int(x // 3600); m = int(x % 3600 // 60); s = x % 60
    return f"{h}:{m:02d}:{s:05.2f}"

header = """[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 0
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Abajo,Inter,78,&H00FFFFFF,&H00FFFFFF,&H00120A0B,&H64000000,-1,0,0,0,100,100,0,0,3,24,0,2,70,70,250,1
Style: Arriba,Inter,78,&H00FFFFFF,&H00FFFFFF,&H00120A0B,&H64000000,-1,0,0,0,100,100,0,0,3,24,0,8,70,70,290,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
lines = []
for i, (html, pos, t) in enumerate(caps):
    if not html: continue
    start = t + 0.12
    nxt = next((c[2] for c in caps[i + 1:]), end_t)
    stop = min(nxt, end_t) + 0.05
    if stop - start < 0.4: continue
    style = "Abajo" if pos == "bottom" else "Arriba"
    lines.append(f"Dialogue: 0,{ts(start)},{ts(stop)},{style},,0,0,0,,{{\\fad(120,90)}}{to_ass(html)}")
open("subs.ass", "w", encoding="utf8").write(header + "\n".join(lines) + "\n")
print(len(lines), "subtítulos")
for l in lines[:6] + lines[-3:]: print(l[:150])
