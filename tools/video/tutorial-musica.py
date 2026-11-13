"""Música original para el vídeo-tutorial de FirstOne (sintetizada, sin derechos)."""
import json, wave
import numpy as np
from scipy.signal import butter, sosfilt
SR = 44100
ev = json.load(open("frames/events.json"))
E = lambda name: [t for n, t in ev if n == name]
WIN, END = E("win")[0], E("end")[0]
DUR = END + 4.4
N = int(DUR * SR)
L = np.zeros(N); R = np.zeros(N)
rng = np.random.default_rng(11)
def t_(d): return np.arange(int(d * SR)) / SR
def env(n, a=0.002, d=0.2, curve=6):
    t = np.arange(n) / SR
    e = np.minimum(1, t / max(a, 1e-4)) * np.exp(-curve * t / max(d, 1e-4))
    return e
def bp(x, lo, hi): return sosfilt(butter(2, [lo, hi], btype="band", fs=SR, output="sos"), x)
def hp(x, f): return sosfilt(butter(2, f, btype="high", fs=SR, output="sos"), x)
def lp(x, f): return sosfilt(butter(2, f, btype="low", fs=SR, output="sos"), x)
def add(sig, at, gain=1.0, pan=0.0):
    i = int(at * SR)
    if i >= N or i + len(sig) <= 0: return
    j0 = max(0, -i); i = max(0, i); s = sig[j0:j0 + N - i] * gain
    L[i:i + len(s)] += s * np.sqrt(0.5 * (1 - pan)) * 1.414
    R[i:i + len(s)] += s * np.sqrt(0.5 * (1 + pan)) * 1.414
def saw(f, d):
    t = t_(d); return 2 * ((t * f) % 1) - 1
def sq(f, d):
    t = t_(d); return np.sign(np.sin(2 * np.pi * f * t))
def nf(note):  # 'A4' → Hz
    names = {"C": -9, "C#": -8, "D": -7, "D#": -6, "E": -5, "F": -4, "F#": -3, "G": -2, "G#": -1, "A": 0, "A#": 1, "B": 2}
    n, o = note[:-1], int(note[-1]); return 440 * 2 ** ((names[n] + 12 * (o - 4)) / 12)

# ── Instrumentos ──
def kick():
    d = 0.35; t = t_(d); f = 45 + 110 * np.exp(-t * 28)
    ph = 2 * np.pi * np.cumsum(f) / SR
    return np.tanh(2.2 * np.sin(ph) * env(len(t), 0.001, 0.32, 5)) * 0.9
def clap():
    n = rng.standard_normal(int(0.22 * SR)); x = bp(n, 900, 3500)
    e = env(len(x), 0.001, 0.18, 7)
    for k in (0.008, 0.017):  # "flam" de palmas
        i = int(k * SR); e[i:] += 0.6 * env(len(x) - i, 0.001, 0.16, 8)
    return x * e * 0.55
def hat(open_=False):
    d = 0.18 if open_ else 0.05; x = hp(rng.standard_normal(int(d * SR)), 7000)
    return x * env(len(x), 0.001, d, 5) * (0.22 if open_ else 0.16)
def crash():
    x = hp(rng.standard_normal(int(1.8 * SR)), 4000); return x * env(len(x), 0.002, 1.8, 3.2) * 0.35
def bass(f, d):
    x = lp(saw(f, d) + 0.5 * sq(f / 2, d), 600); return np.tanh(1.8 * x) * env(len(x), 0.004, d * 1.4, 2.5) * 0.32
def supersaw(freqs, d, cutoff=3500):
    out = np.zeros(int(d * SR))
    for f in freqs:
        for det in (-0.012, -0.005, 0, 0.005, 0.012):
            out += saw(f * (1 + det), d)
    out = lp(out / (len(freqs) * 5), cutoff)
    a = np.minimum(1, t_(d) / 0.01); r = np.minimum(1, (d - t_(d)) / 0.06)
    return out * a * r * 0.5
def blip(f, d=0.09):
    t = t_(d); x = 0.6 * np.sin(2 * np.pi * f * t) + 0.25 * sq(f * 2, d)
    click = hp(rng.standard_normal(len(t)), 3000) * env(len(t), 0.0005, 0.004, 1) * 0.5
    return (x * env(len(t), 0.001, 0.06, 4) + click) * 0.32
def whoosh(d=0.45, up=True):
    n = rng.standard_normal(int(d * SR)); t = t_(d)
    out = np.zeros_like(n); seg = 512
    for i in range(0, len(n), seg):  # barrido de filtro
        frac = i / len(n); fc = (600 + 7000 * frac) if up else (7600 - 7000 * frac)
        out[i:i + seg] = bp(n[i:i + seg], max(200, fc * 0.6), min(18000, fc * 1.4))
    shape = np.sin(np.pi * np.clip(t / d, 0, 1)) ** 2
    return out * shape * 0.35
def riser(d):
    t = t_(d); f = 220 * (2 ** (4 * t / d))
    tone = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.25
    noise = hp(rng.standard_normal(len(t)), 2000) * 0.25
    return (tone + noise) * (t / d) ** 2
def impact():
    d = 1.4; t = t_(d); f = 38 + 60 * np.exp(-t * 9)
    boom = np.tanh(3 * np.sin(2 * np.pi * np.cumsum(f) / SR)) * env(len(t), 0.001, 1.3, 3.5)
    noise = lp(rng.standard_normal(len(t)), 1500) * env(len(t), 0.001, 0.25, 6)
    return (boom * 0.9 + noise * 0.5)
def bell(f, d=1.6):
    t = t_(d); x = sum(a * np.sin(2 * np.pi * f * m * t) * np.exp(-t * k) for a, m, k in
                     [(1, 1, 3), (0.6, 2.76, 4.5), (0.4, 5.4, 6), (0.25, 8.93, 8)])
    return x * 0.28 * np.minimum(1, t / 0.002)
def coin():
    a = sq(nf("B5"), 0.07) * 0.18; b = sq(nf("E6"), 0.35) * env(int(0.35 * SR), 0.001, 0.35, 4) * 0.18
    return np.concatenate([a, b])
def pop():
    t = t_(0.08); f = 900 * np.exp(-t * 30) + 200
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(len(t), 0.001, 0.07, 5) * 0.4
def scratch():
    d = 0.5; t = t_(d); n = rng.standard_normal(len(t)); out = np.zeros_like(n); seg = 256
    for i in range(0, len(n), seg):
        fc = 600 + 2400 * abs(np.sin(2 * np.pi * 7 * i / SR))
        out[i:i + seg] = bp(n[i:i + seg], fc * 0.7, fc * 1.3)
    return out * env(len(t), 0.002, 0.5, 2.5) * 0.7
def trombone(notes):
    out = []
    for note, d in notes:
        t = t_(d); f = nf(note) * (1 + 0.012 * np.sin(2 * np.pi * 5.5 * t) * (t / d))
        x = lp(saw(1, d) * 0 + (2 * ((np.cumsum(f) / SR) % 1) - 1), 1400)
        a = np.minimum(1, t / 0.05) * np.minimum(1, (d - t) / 0.08)
        out.append(np.tanh(1.5 * x) * a * 0.3)
    return np.concatenate(out)


# ── Base: 112 BPM, ambiente alegre y suave (no tapa los textos) ──
BPM = 112; B = 60 / BPM
prog = [["F3","A3","C4","E4"], ["G3","B3","D4","G4"], ["E3","G3","B3","D4"], ["A3","C4","E4","G4"]]  # Fmaj7 G Em7 Am7
bassn = ["F1","G1","E1","A1"]
for i, b in enumerate(np.arange(0.0, DUR - 0.8, B)):
    k = i % 4; bar = (i // 4) % 4; chord = prog[bar]
    intensity = 1.0 if b > 2.6 else 0.55
    add(kick(), b, 0.55 * intensity)
    if k in (1, 3): add(clap(), b, 0.35 * intensity)
    add(hat(), b + B / 2, 0.75, 0.3); add(hat(), b + B / 4, 0.35, -0.3); add(hat(), b + 3 * B / 4, 0.35, -0.3)
    add(bass(__import__("__main__").nf(bassn[bar]) if False else nf(bassn[bar]), B * 0.85), b, 0.7 * intensity)
    if k == 0: add(supersaw([nf(n) for n in chord], 4 * B * 0.98, 2200), b, 0.32)
    # arpegio suave
    for j, n in enumerate(chord):
        add(np.sin(2*np.pi*nf(n)*2*t_(0.18)) * env(int(0.18*SR), 0.002, 0.16, 4) * 0.06, b + j * B / 4, 1.0, -0.5 + j * 0.33)

# ── Efectos sincronizados ──
penta = ["C5","D5","E5","G5","A5","C6","D6","E6","G6","A6"]
keys = E("key"); prev = -9; idx = 0
for tk in keys:
    idx = 0 if tk - prev > 0.6 else idx + 1; prev = tk
    add(blip(nf(penta[min(idx, 9)])), tk, 0.8, -0.2 + 0.05 * idx)
for tc in E("caption"): add(whoosh(0.35), max(0, tc - 0.12), 0.55)
for tt in E("tap") + E("nav"): add(pop(), tt, 0.8)
for to in E("ok"):
    add(bell(nf("C6"), 1.2), to + 0.1, 0.55); add(bell(nf("G6"), 1.0), to + 0.22, 0.35)
for tl in E("live"): add(bell(nf("A5"), 0.9), tl + 0.25, 0.45); add(coin(), tl + 0.25, 0.35)
add(impact(), WIN, 0.75); add(crash(), WIN, 0.7); add(bell(nf("E6")), WIN + 0.02, 0.8); add(coin(), WIN + 0.05, 0.9)
for k, n in enumerate(["C5","E5","G5","C6","E6","G6"]):
    add(sq(nf(n), 0.11) * env(int(0.11*SR), 0.002, 0.1, 3) * 0.12, WIN + 0.12 + k * 0.07, 1.0, -0.4 + 0.16 * k)
for tj in E("joined"):
    add(scratch(), tj - 0.05, 0.5)
    for k, n in enumerate(["E5", "D#5", "D5"]):
        add(sq(nf(n), 0.16) * env(int(0.16*SR), 0.003, 0.15, 2.5) * 0.12, tj + 0.15 + k * 0.17, 1.0)
add(whoosh(0.6), END - 0.55, 0.9); add(impact(), END, 0.9); add(crash(), END, 0.6); add(bell(nf("C6"), 2.2), END + 0.03, 0.7)

mix = np.stack([L, R], 1)
fade = int(0.9 * SR); mix[-fade:] *= np.linspace(1, 0, fade)[:, None]
mix = np.tanh(mix / np.max(np.abs(mix)) * 1.5) / np.tanh(1.5) * 0.9
with wave.open("tour2-soundtrack.wav", "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((mix * 32767).astype("<i2").tobytes())
print(f"✔ tour2-soundtrack.wav {DUR:.1f}s")
