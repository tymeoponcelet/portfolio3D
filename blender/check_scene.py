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


STAGES = {"build": [check_build, check_layout]}


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
