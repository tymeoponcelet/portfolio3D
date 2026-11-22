"""Visuels générés (numpy) : 3 posters rétro + l'afficheur du radio-réveil.
Aucune marque ni personnage existant."""
import bpy
import numpy as np

# Police pixel 5×7 (uniquement les caractères utilisés)
FONT = {
    "A": ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
    "C": ["01111", "10000", "10000", "10000", "10000", "10000", "01111"],
    "D": ["11110", "10001", "10001", "10001", "10001", "10001", "11110"],
    "E": ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
    "G": ["01111", "10000", "10000", "10111", "10001", "10001", "01111"],
    "H": ["10001", "10001", "10001", "11111", "10001", "10001", "10001"],
    "I": ["11111", "00100", "00100", "00100", "00100", "00100", "11111"],
    "L": ["10000", "10000", "10000", "10000", "10000", "10000", "11111"],
    "N": ["10001", "11001", "10101", "10011", "10001", "10001", "10001"],
    "O": ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
    "R": ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
    "S": ["01111", "10000", "10000", "01110", "00001", "00001", "11110"],
    "T": ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
    "W": ["10001", "10001", "10001", "10101", "10101", "10101", "01010"],
    "0": ["01110", "10011", "10101", "10101", "11001", "10001", "01110"],
    "1": ["00100", "01100", "00100", "00100", "00100", "00100", "01110"],
    "2": ["01110", "10001", "00001", "00110", "01000", "10000", "11111"],
    "4": ["00010", "00110", "01010", "10010", "11111", "00010", "00010"],
    "7": ["11111", "00001", "00010", "00100", "01000", "01000", "01000"],
    "8": ["01110", "10001", "10001", "01110", "10001", "10001", "01110"],
    "9": ["01110", "10001", "10001", "01111", "00001", "00010", "01100"],
    ":": ["00000", "00100", "00100", "00000", "00100", "00100", "00000"],
    ">": ["10000", "01000", "00100", "00010", "00100", "01000", "10000"],
    "_": ["00000", "00000", "00000", "00000", "00000", "00000", "11111"],
    " ": ["00000"] * 7,
}


def _rgb(h):
    h = h.lstrip("#")
    return np.array([int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)])


def text(img, s, x, y, px, color):
    """Écrit `s` (police 5×7) ; (x, y) = coin haut-gauche, y vers le bas."""
    c = _rgb(color)
    for k, ch in enumerate(s):
        g = FONT[ch]
        for r, row in enumerate(g):
            for col, bit in enumerate(row):
                if bit == "1":
                    x0 = x + (k * 6 + col) * px
                    y0 = y + r * px
                    img[y0:y0 + px, x0:x0 + px] = c


def _to_image(name, arr):
    h, w, _ = arr.shape
    img = bpy.data.images.new(name, w, h, alpha=False)
    rgba = np.concatenate([np.clip(arr, 0, 1), np.ones((h, w, 1))], axis=2)
    img.pixels.foreach_set(rgba[::-1].astype(np.float32).ravel())   # Blender : origine en bas
    img.pack()
    return img


def poster_synthwave(w=512, h=768):
    yy, xx = np.mgrid[0:h, 0:w]
    t = (yy / (h * 0.62))[..., None]
    img = (1 - t) * _rgb("#1a0b3d") + t * _rgb("#d6336c")
    horizon = int(h * 0.62)
    # soleil rayé
    cx, cy, r = w / 2, h * 0.47, w * 0.3
    sun = ((xx - cx) ** 2 + (yy - cy) ** 2 < r * r) & (yy < horizon)
    band = ((yy - (cy - r)) // 14) % 3 == 2
    sun &= ~(band & (yy > cy))
    g = ((yy - (cy - r)) / (2 * r))[..., None]
    img[sun] = ((1 - g) * _rgb("#ffd23f") + g * _rgb("#ff5e5b"))[sun]
    # sol en grille
    ground = yy >= horizon
    img[ground] = _rgb("#120624")
    depth = (yy - horizon + 1)
    hl = ground & (np.abs(np.log(depth + 1e-6) * 9 % 3) < 0.25)
    vl = ground & (np.abs(((xx - w / 2) / (depth + 8)) * 18 % 1) < 0.06)
    img[hl | vl] = _rgb("#ff4fd8")
    text(img, "NIGHT", 56, 60, 14, "#7ef9ff")
    text(img, "CODE", 90, 170, 14, "#7ef9ff")
    return _to_image("poster_synthwave", img)


def poster_space(w=512, h=768, seed=7):
    rng = np.random.default_rng(seed)
    yy, xx = np.mgrid[0:h, 0:w]
    t = (yy / h)[..., None]
    img = (1 - t) * _rgb("#050a24") + t * _rgb("#13306b")
    sx, sy = rng.integers(0, w, 260), rng.integers(0, h, 260)
    img[sy, sx] = 1.0
    # planète + anneau
    cx, cy, r = w * 0.55, h * 0.5, w * 0.22
    d = np.sqrt((xx - cx) ** 2 + (yy - cy) ** 2)
    planet = d < r
    shade = np.clip((xx - cx + r) / (2 * r), 0, 1)[..., None]
    img[planet] = ((1 - shade) * _rgb("#f2a65a") + shade * _rgb("#7a3b1d"))[planet]
    ring = np.abs(((xx - cx) / 1.9) ** 2 + ((yy - cy) * 2.4) ** 2 - (r * 0.95) ** 2) < r * 9
    ring &= ~(planet & (yy < cy))
    img[ring] = _rgb("#ffe3a3")
    text(img, "1989", 120, 640, 16, "#ffe3a3")
    return _to_image("poster_space", img)


def poster_terminal(w=512, h=768, seed=3):
    rng = np.random.default_rng(seed)
    img = np.zeros((h, w, 3)) + _rgb("#06130a")
    letters = "ACDEGHILNORSTW0124789:_"
    for row in range(14):
        n = int(rng.integers(4, 13))
        line = ">" + "".join(rng.choice(list(letters), n))
        text(img, line, 26, 150 + row * 32, 4, "#2fd36b" if row % 5 else "#b6ffcf")
    text(img, "HELLO", 60, 40, 14, "#b6ffcf")
    text(img, "WORLD", 60, 760 - 130, 14, "#2fd36b")
    return _to_image("poster_terminal", img)


def clock_display(w=256, h=96):
    img = np.zeros((h, w, 3)) + _rgb("#1a0505")
    text(img, "02:47", 23, 24, 7, "#ff2a1a")
    return _to_image("clock_display", img)
