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


STAGES = {"build": [check_build]}


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
