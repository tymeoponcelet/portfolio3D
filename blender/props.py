"""Mobilier et objets de la chambre. Tout est en repère SITE (Y-up, mètres).
Chaque `make_*` crée UN objet nommé (voir common.ROOM_OBJECTS / PROP_OBJECTS)."""
import math
import random

import bpy

from mathutils import Vector

import materials as M
import posters
from common import FLOOR_Y, CEIL_Y, LEFT_X, RIGHT_X, BACK_Z, FRONT_Z, WINDOW
from geo import Part

# ── Palette ──────────────────────────────────────────────────────────
WOOD      = lambda: M.wood("wood_desk", "#7d5232", "#66422a")            # noqa: E731
WOOD_DARK = lambda: M.wood("wood_dark", "#553724", "#452c1c")            # noqa: E731
WALL      = lambda: M.stripes("wallpaper", "#3b4a5c", "#34424f", 30.0)   # noqa: E731
CARPET    = lambda: M.noisy("carpet", "#5a4636", "#46362a", 160.0)       # noqa: E731
CEILING   = lambda: M.solid("ceiling", "#cfc8b8", 0.95)                  # noqa: E731
TRIM      = lambda: M.solid("trim", "#d8cfbd", 0.6)                      # noqa: E731
METAL     = lambda: M.solid("metal", "#9aa0a6", 0.35, 1.0)               # noqa: E731
BLACK     = lambda: M.solid("plastic_black", "#1c1c1e", 0.45)            # noqa: E731
BEIGE     = lambda: M.solid("plastic_beige", "#d9ceb2", 0.5)             # noqa: E731


# ── Structure ────────────────────────────────────────────────────────
def make_structure(col):
    T = 0.04
    depth = FRONT_Z - BACK_Z
    zc = (BACK_Z + FRONT_Z) / 2
    Part("floor").box((0, FLOOR_Y - 0.01, zc), (RIGHT_X - LEFT_X, 0.02, depth), CARPET(), 0).finish(col)
    Part("ceiling").box((0, CEIL_Y + 0.01, zc), (RIGHT_X - LEFT_X, 0.02, depth), CEILING(), 0).finish(col)
    h, yc = CEIL_Y - FLOOR_Y, (CEIL_Y + FLOOR_Y) / 2
    Part("wall_left").box((LEFT_X - T / 2, yc, zc), (T, h, depth), WALL(), 0).finish(col)
    Part("wall_right").box((RIGHT_X + T / 2, yc, zc), (T, h, depth), WALL(), 0).finish(col)

    # Mur du fond percé pour la fenêtre (4 panneaux autour du trou)
    hx0, hx1 = WINDOW["cx"] - 0.52, WINDOW["cx"] + 0.52
    hy0, hy1 = WINDOW["bottom"] + 0.06, WINDOW["bottom"] + 0.70
    z = BACK_Z - T / 2
    wb = Part("wall_back")
    wb.box(((LEFT_X + hx0) / 2, yc, z), (hx0 - LEFT_X, h, T), WALL(), 0)
    wb.box(((hx1 + RIGHT_X) / 2, yc, z), (RIGHT_X - hx1, h, T), WALL(), 0)
    wb.box(((hx0 + hx1) / 2, (FLOOR_Y + hy0) / 2, z), (hx1 - hx0, hy0 - FLOOR_Y, T), WALL(), 0)
    wb.box(((hx0 + hx1) / 2, (hy1 + CEIL_Y) / 2, z), (hx1 - hx0, CEIL_Y - hy1, T), WALL(), 0)
    wb.finish(col)

    bh, bd = 0.08, 0.015
    Part("baseboard_back").box((0, FLOOR_Y + bh / 2, BACK_Z + bd / 2), (RIGHT_X - LEFT_X, bh, bd), TRIM(), 0.003).finish(col)
    Part("baseboard_left").box((LEFT_X + bd / 2, FLOOR_Y + bh / 2, zc), (bd, bh, depth), TRIM(), 0.003).finish(col)
    Part("baseboard_right").box((RIGHT_X - bd / 2, FLOOR_Y + bh / 2, zc), (bd, bh, depth), TRIM(), 0.003).finish(col)


# ── Mobilier ─────────────────────────────────────────────────────────
def make_desk(col):
    p = Part("desk")
    x0, x1, z0, z1 = -1.0, 1.0, BACK_Z + 0.02, 0.50
    zc, d = (z0 + z1) / 2, z1 - z0
    p.box((0, -0.02, zc), (x1 - x0, 0.04, d), WOOD(), 0.006)                     # plateau (dessus à y = 0)
    leg_h = -0.04 - FLOOR_Y
    for x in (x0 + 0.02, x1 - 0.02):                                               # flancs
        p.box((x, FLOOR_Y + leg_h / 2, zc), (0.03, leg_h, d - 0.02), WOOD(), 0.004)
    p.box((0, -0.20, z0 + 0.02), (x1 - x0 - 0.06, 0.30, 0.02), WOOD(), 0.003)    # voile de fond
    # caisson à tiroirs (droite)
    cx0, cx1 = 0.45, 0.95
    p.box(((cx0 + cx1) / 2, (FLOOR_Y + -0.04) / 2, zc), (cx1 - cx0, leg_h, d - 0.06), WOOD(), 0.004)
    for i, (y0, y1) in enumerate([(-0.20, -0.06), (-0.36, -0.22), (-0.66, -0.38)]):
        yc = (y0 + y1) / 2
        p.box(((cx0 + cx1) / 2, yc, z1 - 0.025), (cx1 - cx0 - 0.04, y1 - y0 - 0.01, 0.012), WOOD_DARK(), 0.003)
        p.box(((cx0 + cx1) / 2, yc, z1 - 0.012), (0.10, 0.015, 0.015), METAL(), 0.003)
    p.finish(col)


def make_chair(col):
    """Chaise de bureau repoussée sur le côté (ne masque pas l'écran)."""
    p = Part("chair")
    fabric = M.noisy("chair_fabric", "#6b1f24", "#55171b", 300.0)
    seat_y = -0.30
    p.box((0, seat_y, 0), (0.46, 0.07, 0.44), fabric, 0.02)
    p.box((0, seat_y + 0.31, 0.23), (0.44, 0.48, 0.06), fabric, 0.02)
    p.box((0, seat_y + 0.06, 0.22), (0.05, 0.14, 0.03), BLACK(), 0.005)
    p.cyl((0, FLOOR_Y + 0.07, 0), 0.025, seat_y - 0.035 - (FLOOR_Y + 0.07), METAL())
    for k in range(5):
        a = k * 2 * math.pi / 5
        end = (math.cos(a) * 0.27, FLOOR_Y + 0.06, math.sin(a) * 0.27)
        p.cyl_between((0, FLOOR_Y + 0.07, 0), end, 0.018, BLACK(), segs=8)
        p.sphere((end[0], FLOOR_Y + 0.025, end[2]), 0.025, BLACK(), segs=10)
    ob = p.finish(col, rot_y=-35)
    ob.location = (ob.location.x - 0.62, ob.location.y - 0.88, ob.location.z)  # site x -0.62, z +0.88
    return ob


def make_bed(col):
    p = Part("bed")
    x0, x1, z0, z1 = 1.35, 2.35, BACK_Z + 0.03, BACK_Z + 2.03
    xc, zc = (x0 + x1) / 2, (z0 + z1) / 2
    p.box((xc, FLOOR_Y + 0.15, zc), (x1 - x0, 0.30, z1 - z0), WOOD_DARK(), 0.01)
    p.box((xc, FLOOR_Y + 0.39, zc), (x1 - x0 - 0.06, 0.18, z1 - z0 - 0.06), M.solid("mattress", "#e6e0d2", 0.9), 0.03)
    duvet = M.checker("duvet", "#2f5d8a", "#24476b", 14.0)
    p.box((xc, FLOOR_Y + 0.50, zc + 0.28), (x1 - x0 + 0.02, 0.09, z1 - z0 - 0.55), duvet, 0.04)
    p.box((xc + 0.05, FLOOR_Y + 0.52, zc + 0.05), (0.7, 0.05, 0.5), duvet, 0.04)       # pli défait
    p.box((xc, FLOOR_Y + 0.54, z0 + 0.22), (0.62, 0.10, 0.32), M.solid("pillow", "#ece7db", 0.9), 0.04)
    p.box((xc, FLOOR_Y + 0.45, z0 - 0.005), (x1 - x0, 0.90, 0.04), WOOD_DARK(), 0.01)  # tête de lit
    p.finish(col)


def make_shelf(col):
    """Bibliothèque contre le mur gauche."""
    p = Part("shelf")
    x0, x1, z0, z1, top = LEFT_X + 0.01, LEFT_X + 0.31, -0.25, 0.55, 1.10
    xc, zc, h = (x0 + x1) / 2, (z0 + z1) / 2, top - FLOOR_Y
    for z in (z0 + 0.01, z1 - 0.01):
        p.box((xc, FLOOR_Y + h / 2, z), (x1 - x0, h, 0.02), WOOD_DARK(), 0.003)
    for k in range(5):
        y = FLOOR_Y + 0.02 + k * (h - 0.04) / 4
        p.box((xc, y, zc), (x1 - x0, 0.02, z1 - z0), WOOD_DARK(), 0.003)
    p.box((x0 + 0.005, FLOOR_Y + h / 2, zc), (0.01, h, z1 - z0), WOOD_DARK(), 0)
    p.finish(col)
    return [(FLOOR_Y + 0.03 + k * (h - 0.04) / 4) for k in range(4)], (x0, x1, z0, z1)


def make_wall_shelf(col):
    p = Part("wall_shelf")
    p.box((0.75, 0.93, BACK_Z + 0.11), (0.62, 0.02, 0.20), WOOD(), 0.004)
    for x in (0.52, 0.98):
        p.box((x, 0.88, BACK_Z + 0.06), (0.02, 0.09, 0.10), METAL(), 0.002)
    p.finish(col)


def make_trash_bin(col):
    p = Part("trash_bin")
    p.cyl((1.17, FLOOR_Y, 0.30), 0.12, 0.30, M.solid("bin", "#3d5a3a", 0.5), segs=20, r_top=0.14)
    paper = M.solid("paper", "#efeae0", 0.9)
    for dx, dz in ((0.02, 0.03), (-0.04, -0.02), (0.05, -0.05)):
        p.sphere((1.17 + dx, FLOOR_Y + 0.27, 0.30 + dz), 0.045, paper, segs=8, scale=(1, 0.8, 1.1))
    p.finish(col)


# ── Objets du bureau ─────────────────────────────────────────────────
def make_desk_lamp(col):
    p = Part("desk_lamp")
    red = M.solid("lamp_red", "#b8322a", 0.35, 0.3)
    base = Vector((-0.78, 0.0, -0.42))
    j1 = base + Vector((0.0, 0.30, 0.10))
    j2 = j1 + Vector((0.06, 0.06, 0.20))
    p.cyl(base, 0.075, 0.02, red, segs=28)
    p.cyl_between(base + Vector((0, 0.02, 0)), j1, 0.008, METAL())
    p.sphere(j1, 0.014, red, segs=10)
    p.cyl_between(j1, j2, 0.008, METAL())
    # abat-jour conique orienté vers le bureau
    tip = j2 + Vector((0.02, -0.09, 0.06))
    p.cyl_between(j2, tip, 0.03, red, segs=24, r_end=0.075, cap=False)
    p.sphere(j2 + (tip - j2) * 0.65, 0.022, M.emissive("bulb", "#fff1d0", 6.0), segs=12)
    p.finish(col)


def make_radio_clock(col):
    p = Part("radio_clock")
    p.box((0, 0.045, 0), (0.20, 0.09, 0.09), M.solid("radio_body", "#2a211c", 0.4), 0.008)
    p.box((0, 0.045, 0.046), (0.18, 0.07, 0.004), BLACK(), 0.001)
    p.plane((0.03, 0.05, 0.049), 0.10, 0.038, M.emissive("clock_digits", "#ff2a1a", 2.0, posters.clock_display()))
    for k in range(4):
        p.cyl((-0.06 + k * 0.006, 0.09, 0), 0.002, 0.01, METAL(), segs=6)
    ob = p.finish(col, rot_y=-20)
    ob.location = (ob.location.x + 0.80, ob.location.y + 0.36, ob.location.z)  # site (0.80, 0, -0.36)
    return ob


def make_floppy_stack(col):
    p = Part("floppy_stack")
    rnd = random.Random(4)
    colors = ["#1d1d1f", "#2a52be", "#b03a2e", "#d9ceb2", "#1d1d1f", "#3f7d4e"]
    label = M.solid("label_white", "#f2efe6", 0.8)
    for k, c in enumerate(colors):
        y = 0.0017 + k * 0.0034
        a = rnd.uniform(-12, 12)
        p.box((0, y, 0), (0.09, 0.0033, 0.094), M.solid(f"floppy_{c}", c, 0.4), 0.0008, rot_y=a)
        p.box((0, y + 0.0018, -0.028), (0.05, 0.0008, 0.035), METAL(), 0.0, rot_y=a)
        p.box((0, y + 0.0018, 0.022), (0.07, 0.0008, 0.045), label, 0.0, rot_y=a)
    # disquettes 5¼" à côté
    for k in range(3):
        p.box((0.13, 0.0008 + k * 0.0016, 0.02), (0.133, 0.0015, 0.133), M.solid("floppy525", "#121214", 0.6), 0.0005, rot_y=8 * k)
    ob = p.finish(col, rot_y=10)
    ob.location = (ob.location.x + 0.72, ob.location.y - 0.12, ob.location.z)  # site (0.72, 0, 0.12)
    return ob


def make_cassette_stack(col):
    p = Part("cassette_stack")
    case = M.solid("cassette_case", "#c9c4bd", 0.25)
    inserts = ["#e2b33c", "#d0442f", "#3466a8"]
    for k, c in enumerate(inserts):
        y = 0.009 + k * 0.0175
        p.box((0, y, 0), (0.11, 0.017, 0.07), case, 0.002, rot_y=k * 7 - 7)
        p.box((0, y, 0.0352), (0.10, 0.012, 0.001), M.solid(f"insert_{c}", c, 0.7), 0.0, rot_y=k * 7 - 7)
    ob = p.finish(col)
    ob.location = (ob.location.x + 0.93, ob.location.y - 0.02, ob.location.z)  # site (0.93, 0, 0.02)
    return ob


def make_cat(col):
    """Chat gris tigré roulé en boule, endormi sous la lampe (côté gauche).
    Origine au centre-bas : le site anime sa respiration (échelle Y)."""
    p = Part("cat")
    fur = M.tabby("cat_fur")
    pale = M.solid("cat_pale", "#c9c6bf", 0.9)
    pink = M.solid("cat_nose", "#c98a8a", 0.6)
    p.sphere((0.0, 0.060, 0.0), 1.0, fur, segs=28, scale=(0.165, 0.062, 0.12))      # corps
    p.sphere((0.06, 0.070, -0.02), 1.0, fur, segs=24, scale=(0.09, 0.06, 0.085))    # arrière-train
    head = Vector((-0.115, 0.062, 0.055))
    p.sphere(head, 1.0, fur, segs=24, scale=(0.06, 0.05, 0.055))                    # tête posée
    p.sphere(head + Vector((-0.035, -0.015, 0.03)), 1.0, pale, segs=12, scale=(0.028, 0.02, 0.022))  # museau
    p.sphere(head + Vector((-0.05, -0.006, 0.042)), 0.006, pink, segs=8)            # nez
    for dz in (-0.028, 0.022):                                                      # oreilles
        base = head + Vector((0.005, 0.035, dz))
        p.cyl_between(base, base + Vector((-0.004, 0.035, dz * 0.25)), 0.017, fur, segs=4, r_end=0.002)
    # queue qui fait le tour par l'avant
    pts = [Vector((0.15 * math.cos(a), 0.022, 0.115 * math.sin(a) + 0.005))
           for a in [math.radians(d) for d in range(-20, 150, 17)]]
    for a, b in zip(pts, pts[1:]):
        p.cyl_between(a, b, 0.019, fur, segs=10)
        p.sphere(b, 0.019, fur, segs=10)
    ob = p.finish(col, rot_y=150)     # tête tournée vers l'ordinateur et la caméra
    ob.location = (ob.location.x - 0.76, ob.location.y - 0.12, ob.location.z)   # site (-0.76, 0, 0.12)
    return ob


def make_cd_stack(col):
    p = Part("cd_stack")
    case = M.solid("cd_case", "#2c2c30", 0.2)
    for k, c in enumerate(["#7b2d8b", "#1e88a8", "#e0b03a", "#cc3d3d"]):
        y = 0.005 + k * 0.0102
        a = (k % 2) * 6 - 3
        p.box((0, y, 0), (0.142, 0.010, 0.125), case, 0.0015, rot_y=a)
        p.box((0.005, y + 0.0052, 0), (0.12, 0.0005, 0.118), M.solid(f"cd_art_{c}", c, 0.5), 0.0, rot_y=a)
    ob = p.finish(col, rot_y=-15)
    ob.location = (ob.location.x + 0.65, ob.location.y + 0.13, ob.location.z)  # site (0.65, 0, -0.13) : à droite (le chat dort à gauche)
    return ob


def make_mug(col):
    p = Part("mug")
    mug = M.solid("mug", "#c8a23a", 0.3)
    p.cyl((0, 0, 0), 0.04, 0.095, mug, segs=28)
    p.cyl((0, 0.08, 0), 0.036, 0.002, M.solid("coffee", "#2b170c", 0.1), segs=24)
    pts = [Vector((0.04 + 0.028 * math.sin(t), 0.048 + 0.028 * math.cos(t), 0)) for t in
           [k * math.pi / 6 for k in range(7)]]
    for a, b in zip(pts, pts[1:]):
        p.cyl_between(a, b, 0.006, mug, segs=8)
    ob = p.finish(col, rot_y=40)
    ob.location = (ob.location.x + 0.66, ob.location.y - 0.38, ob.location.z)  # site (0.66, 0, 0.38)
    return ob


def make_notebook(col):
    p = Part("notebook")
    p.box((0, 0.006, 0), (0.15, 0.012, 0.21), M.solid("notebook_cover", "#2f4f3a", 0.7), 0.002)
    p.box((0.002, 0.006, 0), (0.146, 0.009, 0.206), M.solid("pages", "#efe9da", 0.9), 0.001)
    p.cyl_between((-0.05, 0.016, -0.06), (0.06, 0.016, 0.05), 0.004, M.solid("pen", "#1f3e8a", 0.3), segs=8)
    ob = p.finish(col, rot_y=12)
    ob.location = (ob.location.x - 0.76, ob.location.y - 0.40, ob.location.z)  # site (-0.76, 0, 0.40)
    return ob


def make_cables(col):
    """Câbles qui pendent du bureau jusqu'à une multiprise au sol."""
    p = Part("cables")
    cable = M.solid("cable_black", "#151515", 0.5)
    strip = (0.62, FLOOR_Y + 0.02, BACK_Z + 0.16)
    p.box(strip, (0.30, 0.04, 0.06), BEIGE(), 0.006)
    for x0, sway in ((0.18, 0.05), (-0.22, 0.12), (0.34, -0.03)):
        pts = [Vector((x0, -0.04, BACK_Z + 0.035)),
               Vector((x0 + sway * 0.3, -0.30, BACK_Z + 0.05)),
               Vector((x0 + sway, FLOOR_Y + 0.12, BACK_Z + 0.09)),
               Vector((strip[0] - 0.08 + 0.05 * (x0 > 0), FLOOR_Y + 0.025, strip[2]))]
        for a, b in zip(pts, pts[1:]):
            p.cyl_between(a, b, 0.004, cable, segs=8)
    p.finish(col)


def _books(name, col, x0, x1, y, z_back, depth, seed, axis="x"):
    rnd = random.Random(seed)
    palette = ["#7a1f1f", "#1f3d7a", "#2e5e3a", "#c49a2c", "#5b3a6e", "#2a2a2a", "#b35a1f", "#d8d0bc"]
    p = Part(name)
    pos = x0
    while pos < x1 - 0.03:
        t = rnd.uniform(0.018, 0.045)
        hgt = rnd.uniform(0.16, 0.26)
        dep = depth * rnd.uniform(0.75, 0.95)
        mat = M.solid(f"book_{rnd.choice(palette)}", rnd.choice(palette), 0.7)
        if axis == "x":
            p.box((pos + t / 2, y + hgt / 2, z_back + dep / 2), (t, hgt, dep), mat, 0.002)
        else:  # rangée le long de Z (bibliothèque du mur gauche)
            p.box((z_back + dep / 2, y + hgt / 2, pos + t / 2), (dep, hgt, t), mat, 0.002)
        pos += t + 0.002
        if rnd.random() < 0.08:
            pos += 0.05
    return p


def make_books(col, shelf_levels, shelf_box):
    x0, x1, z0, z1 = shelf_box
    p = _books("books_shelf", col, z0 + 0.03, z1 - 0.03, shelf_levels[0], x0 + 0.02, x1 - x0 - 0.04, 11, axis="z")
    for k, lvl in enumerate(shelf_levels[1:3], start=1):
        q = _books("tmp", col, z0 + 0.03, z1 - 0.10 * k, lvl, x0 + 0.02, x1 - x0 - 0.04, 11 + k, axis="z")
        me = _bm_to_mesh(q, p)
        p.bm.from_mesh(me)
        bpy.data.meshes.remove(me)
    p.finish(col)
    _books("books_wall", col, 0.47, 0.82, 0.94, BACK_Z + 0.03, 0.15, 5).finish(col)


def _bm_to_mesh(src, dst):
    """Fusionne la géométrie de `src` dans `dst` (en conservant les matériaux)."""
    import bpy
    for f in src.bm.faces:
        mat = src.mats[f.material_index]
        f.material_index = dst._mi(mat)
    me = bpy.data.meshes.new("__merge")
    src.bm.to_mesh(me)
    src.bm.free()
    return me


def make_figurines(col, shelf_top):
    robot = Part("figurine_1")
    tin = M.solid("tin_robot", "#9fb3c8", 0.3, 0.8)
    accent = M.solid("robot_red", "#c0392b", 0.4)
    bx, by, bz = 0.92, 0.94, BACK_Z + 0.11
    robot.box((bx, by + 0.035, bz), (0.05, 0.07, 0.035), tin, 0.004)
    robot.box((bx, by + 0.09, bz), (0.04, 0.035, 0.03), tin, 0.004)
    robot.box((bx, by + 0.09, bz + 0.016), (0.03, 0.008, 0.002), accent, 0)
    robot.cyl((bx, by + 0.107, bz), 0.002, 0.02, METAL(), segs=6)
    for dx in (-0.032, 0.032):
        robot.box((bx + dx, by + 0.045, bz), (0.012, 0.045, 0.012), tin, 0.002)
    robot.finish(col)

    rocket = Part("figurine_2")
    x, y, z = LEFT_X + 0.16, shelf_top, 0.25
    rocket.cyl((x, y, z), 0.03, 0.14, M.solid("rocket_white", "#e9e4d8", 0.4), segs=16)
    rocket.cyl((x, y + 0.14, z), 0.03, 0.06, accent, segs=16, r_top=0.0)
    for k in range(3):
        a = k * 2 * math.pi / 3
        rocket.box((x + math.cos(a) * 0.035, y + 0.03, z + math.sin(a) * 0.035), (0.03, 0.05, 0.006), accent, 0.001,
                   rot_y=-math.degrees(a))
    rocket.finish(col)


def make_posters(col):
    frame = M.solid("poster_frame", "#1b1b1b", 0.5)
    specs = [("poster_1", posters.poster_synthwave(), (0.74, 0.50, BACK_Z + 0.006), 0.28, 0.42, "+z"),
             ("poster_2", posters.poster_terminal(), (1.85, 0.95, BACK_Z + 0.006), 0.48, 0.72, "+z"),
             ("poster_3", posters.poster_space(), (LEFT_X + 0.006, 0.80, 1.15), 0.48, 0.72, "+x")]
    for name, img, c, w, h, facing in specs:
        p = Part(name)
        p.plane(c, w, h, M.image(f"{name}_art", img), facing)
        off = {"+z": Vector((0, 0, -0.003)), "+x": Vector((-0.003, 0, 0))}[facing]
        p.plane(Vector(c) + off, w + 0.02, h + 0.02, frame, facing)
        p.finish(col)
