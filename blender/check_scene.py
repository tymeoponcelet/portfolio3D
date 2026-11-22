"""Contrôles du pipeline. Usage :
    blender -b <fichier.blend> --python-exit-code 1 --python blender/check_scene.py -- --stage build|bake|export
Affiche `CHECK FAIL: <raison>` par échec ; code de sortie 1 si au moins un échec.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import bpy  # noqa: E402
from common import (GROUPS, SCREEN_MESH, script_args, reference_screen_matrix,  # noqa: E402
                    matrices_close)

FAILS = []


def fail(msg):
    FAILS.append(msg)
    print("CHECK FAIL:", msg)


def find_screen():
    col = bpy.data.collections.get(GROUPS["computer"])
    if not col:
        return None
    return next((o for o in col.all_objects if o.name.startswith(SCREEN_MESH) and o.type == "MESH"), None)


def check_build():
    for key, name in GROUPS.items():
        col = bpy.data.collections.get(name)
        if col is None:
            fail(f"collection {name} absente")
        elif not any(o.type == "MESH" for o in col.all_objects):
            fail(f"collection {name} vide")
    screen = find_screen()
    if screen is None:
        fail(f"{SCREEN_MESH} absent de la collection {GROUPS['computer']}")
    elif not matrices_close(screen.matrix_world, reference_screen_matrix()):
        fail(f"{SCREEN_MESH} a bougé (matrix_world différente de la référence)")


def site_bbox(objs):
    """Boîte englobante (repère site) d'une liste d'objets mesh."""
    from mathutils import Vector
    pts = [o.matrix_world @ Vector(c) for o in objs if o.type == "MESH" for c in o.bound_box]
    if not pts:
        return None
    xs = [p.x for p in pts]; ys = [p.z for p in pts]; zs = [-p.y for p in pts]
    return (min(xs), max(xs)), (min(ys), max(ys)), (min(zs), max(zs))


def overlap(a, b, eps=0.002):
    return all(a[i][0] < b[i][1] - eps and b[i][0] < a[i][1] - eps for i in range(3))


def check_layout():
    from common import (ROOM_OBJECTS, PROP_OBJECTS, FLOOR_Y, CEIL_Y, LEFT_X,
                        RIGHT_X, BACK_Z, FRONT_Z)
    names = {o.name for o in bpy.data.objects}
    for n in ROOM_OBJECTS + PROP_OBJECTS:
        if n not in names:
            fail(f"objet « {n} » absent")
    tol = 0.12   # épaisseur des murs, débords de plinthes
    box = ((LEFT_X - tol, RIGHT_X + tol), (FLOOR_Y - tol, CEIL_Y + tol), (BACK_Z - tol, FRONT_Z + tol))
    for key in ("room", "props"):
        col = bpy.data.collections.get(GROUPS[key])
        for o in (col.all_objects if col else []):
            bb = site_bbox([o])
            if bb and not all(box[i][0] <= bb[i][0] and bb[i][1] <= box[i][1] for i in range(3)):
                fail(f"« {o.name} » sort de la pièce : {bb}")
    pc = site_bbox([o for o in bpy.data.collections[GROUPS['computer']].all_objects]) \
        if bpy.data.collections.get(GROUPS["computer"]) else None
    props = bpy.data.collections.get(GROUPS["props"])
    if pc and props:
        for o in props.all_objects:
            bb = site_bbox([o])
            if bb and overlap(bb, pc):
                fail(f"« {o.name} » chevauche le Commodore")


def _atlas_pixels(path):
    import numpy as np
    img = bpy.data.images.load(str(path), check_existing=True)
    w, h = img.size
    px = np.empty(w * h * 4, dtype=np.float32)
    img.pixels.foreach_get(px)
    return px.reshape(h, w, 4)[..., :3], w, h


def _lum(rgb):
    return 0.2126 * rgb[..., 0] + 0.7152 * rgb[..., 1] + 0.0722 * rgb[..., 2]


def _object_mean(obj, px, w, h, normal_z=None):
    """Luminance moyenne de l'atlas sur l'objet, pondérée par l'AIRE des faces
    (échantillon au centre UV de chaque face). Une moyenne par sommet serait
    dominée par les biseaux, très denses en sommets et souvent dans l'ombre."""
    import numpy as np
    me = obj.data
    me.calc_loop_triangles()
    uv = me.uv_layers.get("bake")
    co = np.empty(len(uv.data) * 2, dtype=np.float32)
    uv.data.foreach_get("uv", co)
    co = co.reshape(-1, 2)
    nt = len(me.loop_triangles)
    loops = np.empty(nt * 3, dtype=np.int64); area = np.empty(nt, dtype=np.float32)
    nrm = np.empty(nt * 3, dtype=np.float32)
    me.loop_triangles.foreach_get("loops", loops)
    me.loop_triangles.foreach_get("area", area)
    me.loop_triangles.foreach_get("normal", nrm)
    tri = co[loops.reshape(-1, 3)]                       # (nt, 3, 2) UV des sommets
    if normal_z is not None:
        # ne garder que les faces qui comptent (dessus du bureau, dessous du
        # plafond) : normale Blender Z = « haut » du site
        keep = (nrm.reshape(-1, 3)[:, 2] * np.sign(normal_z)) > abs(normal_z)
        tri, area = tri[keep], area[keep]
    if not len(area):
        return 0.0
    # 4000 points répartis selon l'aire (un seul point par face tomberait par
    # exemple pile dans l'ombre du Commodore, au centre du bureau)
    rng = np.random.default_rng(0)
    idx = rng.choice(len(area), size=4000, p=area / area.sum())
    r1, r2 = rng.random(4000), rng.random(4000)
    s = np.sqrt(r1)
    pts = ((1 - s)[:, None] * tri[idx, 0] + (s * (1 - r2))[:, None] * tri[idx, 1]
           + (s * r2)[:, None] * tri[idx, 2])
    xs = np.clip((pts[:, 0] * w).astype(int), 0, w - 1)
    ys = np.clip((pts[:, 1] * h).astype(int), 0, h - 1)   # pixels Blender : origine en bas
    return float(_lum(px[ys, xs]).mean())


def check_bake():
    import numpy as np
    from common import OUT
    for key, name in GROUPS.items():
        col = bpy.data.collections.get(name)
        for o in (col.all_objects if col else []):
            if o.type != "MESH" or o.name == "window_glass":
                continue
            uv = o.data.uv_layers.get("bake")
            if uv is None:
                fail(f"« {o.name} » sans UV « bake »")
                continue
            co = np.empty(len(uv.data) * 2, dtype=np.float32)
            uv.data.foreach_get("uv", co)
            if co.size and (co.min() < -1e-4 or co.max() > 1 + 1e-4):
                fail(f"« {o.name} » : UV « bake » hors [0,1]")
        path = OUT / f"{key}_2k.png"
        if not path.exists():
            fail(f"atlas {path.name} absent")
            continue
        px, w, h = _atlas_pixels(path)
        lum = _lum(px)
        used = lum > 0            # le fond inutilisé de l'atlas est noir pur
        mean = float(lum[used].mean()) if used.any() else 0.0
        if not 0.02 <= mean <= 0.55:
            fail(f"atlas {path.name} : luminance moyenne {mean:.3f} hors [0.02, 0.55]")
        else:
            print(f"CHECK info: {path.name} luminance {mean:.3f}")
        if key == "room":
            desk, ceil = bpy.data.objects.get("desk"), bpy.data.objects.get("ceiling")
            if desk and ceil and desk.data.uv_layers.get("bake") and ceil.data.uv_layers.get("bake"):
                d = _object_mean(desk, px, w, h, normal_z=0.9)     # dessus du bureau
                c = _object_mean(ceil, px, w, h, normal_z=-0.9)    # dessous du plafond
                print(f"CHECK info: dessus du bureau {d:.3f} / dessous du plafond {c:.3f}")
                # La pièce est ouverte à l'avant (diorama) : le ciel nocturne
                # éclaire le plafond, invisible des vues principales. Ce qui
                # compte : un bureau lisible.
                if d < 0.05:
                    fail(f"dessus du bureau trop sombre ({d:.3f} < 0.05)")


def check_export():
    from common import MODELS_OUT
    budget = 6 * 1024 * 1024
    total = 0
    for key in GROUPS:
        for f in (f"{key}.glb", f"{key}_2k.webp", f"{key}_1k.webp"):
            p = MODELS_OUT / f
            if not p.exists():
                fail(f"{p.name} absent")
            elif not f.endswith("_1k.webp"):
                total += p.stat().st_size
    print(f"CHECK info: scène (glb + atlas 2k) = {total / 1048576:.2f} Mo")
    if total > budget:
        fail(f"budget dépassé : {total / 1048576:.2f} Mo > 6 Mo")
    glb = MODELS_OUT / "computer.glb"
    if glb.exists():
        ref = reference_screen_matrix()
        tmp = bpy.data.scenes.new("__chk")
        bpy.context.window.scene = tmp
        before = set(bpy.data.objects)
        bpy.ops.import_scene.gltf(filepath=str(glb))
        new = [o for o in bpy.data.objects if o not in before]
        bpy.context.view_layer.update()
        scr = next((o for o in new if o.name.startswith(SCREEN_MESH) and o.type == "MESH"), None)
        if scr is None:
            fail(f"{SCREEN_MESH} absent de computer.glb")
        elif not matrices_close(scr.matrix_world, ref):
            fail(f"{SCREEN_MESH} déplacé dans computer.glb")


STAGES = {"build": [check_build, check_layout], "bake": [check_bake], "export": [check_export]}


def main():
    args = script_args()
    stage = args[args.index("--stage") + 1] if "--stage" in args else "build"
    if not bpy.data.filepath:
        fail("aucun fichier .blend chargé (étape précédente absente ?)")
    else:
        for fn in STAGES[stage]:
            fn()
    if FAILS:
        print(f"CHECK {stage}: {len(FAILS)} échec(s)")
        sys.exit(1)
    print(f"CHECK {stage}: OK")


main()
