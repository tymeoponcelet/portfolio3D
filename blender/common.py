"""Constantes et utilitaires partagés du pipeline Blender (scène chambre rétro).

Repères : le site est Y-up, Blender Z-up. L'import/export glTF convertit :
    site(x, y, z)  <->  blender(x, -z, y)
"""
from pathlib import Path
import sys

import bpy

ROOT = Path(__file__).resolve().parents[1]
BLENDER_DIR = ROOT / "blender"
OUT = BLENDER_DIR / "out"
PREVIEWS = BLENDER_DIR / "previews"
IMPORTS = BLENDER_DIR / "imports"
MODELS_SRC = ROOT / "public" / "models"
MODELS_OUT = MODELS_SRC / "room"

SCENE_BLEND = OUT / "scene.blend"
BAKED_BLEND = OUT / "baked.blend"

# Collections = groupes cuits dans un même atlas
GROUPS = {"room": "Room", "props": "Props", "computer": "Computer"}

PC_MODEL_SCALE = 0.1          # échelle du <primitive> Commodore sur le site
SCREEN_MESH = "Object_19"     # mesh-écran utilisé par CSS3DScreen.jsx
PC_ROOT = "pc_root"           # parent d'échelle PC_MODEL_SCALE


# Pièce (repère site, mètres). Le bureau est collé au mur du fond ; le
# Commodore (fixe, ne bouge pas) repose sur le plateau à y = 0.
FLOOR_Y, CEIL_Y = -0.74, 1.90
LEFT_X, RIGHT_X = -2.40, 2.40
BACK_Z, FRONT_Z = -0.66, 2.60        # pas de mur avant (vue « diorama »)
WINDOW = {"cx": -1.25, "bottom": 0.55, "scale": 0.5}   # fenetre.glb sur le mur du fond

# Noms d'objets attendus (contrôlés par check_scene.py)
ROOM_OBJECTS = ["floor", "ceiling", "wall_back", "wall_left", "wall_right",
                "baseboard_back", "baseboard_left", "baseboard_right",
                "window_frame", "window_glass", "desk", "chair", "bed", "shelf",
                "wall_shelf", "trash_bin"]
PROP_OBJECTS = ["desk_lamp", "radio_clock", "floppy_stack", "cassette_stack",
                "cd_stack", "mug", "cat", "notebook", "cables", "books_shelf",
                "books_wall", "figurine_1", "figurine_2", "poster_1", "poster_2",
                "poster_3"]


def site_to_bl(x, y, z):
    """Coordonnées du site (Y-up) -> Blender (Z-up)."""
    return (x, -z, y)


def script_args():
    """Arguments passés après `--` sur la ligne de commande Blender."""
    return sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []


def reset_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)


def get_collection(name):
    col = bpy.data.collections.get(name)
    if col is None:
        col = bpy.data.collections.new(name)
        bpy.context.scene.collection.children.link(col)
    return col


def move_to_collection(obj, col):
    for c in list(obj.users_collection):
        c.objects.unlink(obj)
    col.objects.link(obj)


def import_glb(path, collection):
    """Importe un .glb et range tous les nouveaux objets dans `collection`."""
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=str(path))
    new = [o for o in bpy.data.objects if o not in before]
    for o in new:
        move_to_collection(o, collection)
    return new


def import_pc(collection):
    """Commodore importé tel quel sous un parent d'échelle PC_MODEL_SCALE
    (identique au <primitive scale={0.1}> du site). Retourne le parent."""
    new = import_glb(MODELS_SRC / "vintage_pc.glb", collection)
    root = bpy.data.objects.new(PC_ROOT, None)
    collection.objects.link(root)
    root.scale = (PC_MODEL_SCALE,) * 3
    for o in new:
        if o.parent is None:
            o.parent = root
    bpy.context.view_layer.update()
    return root


def reference_screen_matrix():
    """matrix_world de référence de l'écran : Commodore d'origine importé seul
    dans une scène temporaire, sous un parent d'échelle PC_MODEL_SCALE."""
    current = bpy.context.window.scene if bpy.context.window else bpy.context.scene
    tmp = bpy.data.scenes.new("__ref")
    bpy.context.window.scene = tmp
    col = bpy.data.collections.new("__ref_col")
    tmp.collection.children.link(col)
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=str(MODELS_SRC / "vintage_pc.glb"))
    new = [o for o in bpy.data.objects if o not in before]
    root = bpy.data.objects.new("__ref_root", None)
    tmp.collection.objects.link(root)
    root.scale = (PC_MODEL_SCALE,) * 3
    for o in new:
        if o.parent is None:
            o.parent = root
    bpy.context.view_layer.update()
    screen = next(o for o in new if o.name.startswith(SCREEN_MESH))
    m = screen.matrix_world.copy()
    for o in new + [root]:
        bpy.data.objects.remove(o, do_unlink=True)
    bpy.data.collections.remove(col)
    bpy.context.window.scene = current
    bpy.data.scenes.remove(tmp)
    return m


def matrices_close(a, b, tol=1e-5):
    return all(abs(a[i][j] - b[i][j]) <= tol for i in range(4) for j in range(4))
