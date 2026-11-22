"""Construit la chambre rétro et l'enregistre dans blender/out/scene.blend.
    blender -b --factory-startup --python-exit-code 1 --python blender/build_scene.py
"""
import json
import math
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import bpy  # noqa: E402
from mathutils import Euler, Vector  # noqa: E402

import props  # noqa: E402
from common import (GROUPS, IMPORTS, MODELS_SRC, OUT, SCENE_BLEND, WINDOW, BACK_Z,  # noqa: E402
                    get_collection, import_glb, import_pc, reset_scene, site_to_bl)


def select_only(objs, active=None):
    bpy.ops.object.select_all(action="DESELECT")
    for o in objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = active or objs[0]


def join(objs, name):
    """Applique les transformations, puis fusionne `objs` en un objet `name`."""
    meshes = [o for o in objs if o.type == "MESH"]
    others = [o.name for o in objs if o.type != "MESH"]   # noms : les objets fusionnés disparaissent
    select_only(meshes)
    # fenetre.glb utilise l'instanciation (meshes partagés) : on les rend uniques
    bpy.ops.object.make_single_user(type="SELECTED_OBJECTS", object=True, obdata=True)
    bpy.ops.object.parent_clear(type="CLEAR_KEEP_TRANSFORM")
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    if len(meshes) > 1:
        bpy.ops.object.join()
    ob = bpy.context.view_layer.objects.active
    ob.name = name
    ob.data.name = name
    for n in others:
        if n in bpy.data.objects:
            bpy.data.objects.remove(bpy.data.objects[n], do_unlink=True)
    return ob


def build_window(col):
    """fenetre.glb sur le mur du fond : cadre fusionné + vitre séparée."""
    new = import_glb(MODELS_SRC / "fenetre.glb", col)
    root = bpy.data.objects.new("__win_root", None)
    col.objects.link(root)
    root.scale = (WINDOW["scale"],) * 3
    for o in new:
        if o.parent is None:
            o.parent = root
    root.location = site_to_bl(WINDOW["cx"], WINDOW["bottom"], BACK_Z - 0.02)
    bpy.context.view_layer.update()
    glass = [o for o in new if o.type == "MESH" and o.name.lower().startswith("glass")]
    frame = [o for o in new if o.type == "MESH" and o not in glass]
    empties = [o.name for o in new if o.type != "MESH"]
    join(glass, "window_glass")
    join(frame, "window_frame")
    for n in empties + ["__win_root"]:
        if n in bpy.data.objects:
            bpy.data.objects.remove(bpy.data.objects[n], do_unlink=True)


MAX_IMPORT_TRIS = 15000   # au-delà, le modèle importé est simplifié (Decimate)


def _tris(ob):
    return sum(len(p.vertices) - 2 for p in ob.data.polygons)


def _decimate(ob, max_tris):
    before = _tris(ob)
    if before > max_tris:
        select_only([ob])
        mod = ob.modifiers.new("decimate", "DECIMATE")
        mod.ratio = max_tris / before
        bpy.ops.object.modifier_apply(modifier=mod.name)
    return before, _tris(ob)


def _origin_bottom_center(ob):
    """Fige les transformations puis place l'origine au centre-bas du modèle
    (comme les objets générés : posé « au sol » de son emplacement)."""
    from mathutils import Matrix
    select_only([ob])
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    xs = [v.co.x for v in ob.data.vertices]; ys = [v.co.y for v in ob.data.vertices]
    zs = [v.co.z for v in ob.data.vertices]
    c = Vector(((min(xs) + max(xs)) / 2, (min(ys) + max(ys)) / 2, min(zs)))
    ob.data.transform(Matrix.Translation(-c))
    ob.location = (0, 0, 0)
    return Vector((max(xs) - min(xs), max(ys) - min(ys), max(zs) - min(zs)))


def apply_imports(props_col):
    """blender/imports/*.glb : remplace l'objet du même nom ou s'ajoute.
    Simplifié si trop lourd ; remis à l'échelle de l'objet remplacé (sauf
    `scale` dans placements.json) ; origine au centre-bas."""
    from mathutils import Matrix
    placements = {}
    pfile = IMPORTS / "placements.json"
    if pfile.exists():
        placements = json.loads(pfile.read_text(encoding="utf-8") or "{}")
    for glb in sorted(IMPORTS.glob("*.glb")):
        name = glb.stem
        old = bpy.data.objects.get(name)
        loc = old.location.copy() if old else Vector()
        old_dims = old.dimensions.copy() if old else None
        if old:
            bpy.data.objects.remove(old, do_unlink=True)
        new = import_glb(glb, props_col)
        ob = join(new, name)
        before, after = _decimate(ob, MAX_IMPORT_TRIS)
        dims = _origin_bottom_center(ob)
        p = placements.get(name, {})
        if "scale" in p:
            f = p["scale"]
        elif old_dims is not None:
            f = max(old_dims.x, old_dims.y) / max(dims.x, dims.y, 1e-6)   # même emprise au sol
        else:
            f = 1.0
        ob.data.transform(Matrix.Scale(f, 4))
        ob.location = Vector(site_to_bl(*p["position"])) if "position" in p else loc
        if "rotation_deg" in p:
            rx, ry, rz = (math.radians(a) for a in p["rotation_deg"])
            ob.rotation_euler = Euler((rx, -rz, ry))
            select_only([ob])
            bpy.ops.object.transform_apply(location=False, rotation=True, scale=False)
        print(f"[import] {glb.name} -> {name} ({'remplace' if old else 'ajout'}) "
              f"{before} -> {after} triangles, échelle x{f:.3f}")


def main():
    reset_scene()
    room = get_collection(GROUPS["room"])
    prps = get_collection(GROUPS["props"])
    comp = get_collection(GROUPS["computer"])

    import_pc(comp)

    props.make_structure(room)
    build_window(room)
    props.make_desk(room)
    props.make_chair(room)
    props.make_bed(room)
    levels, shelf_box = props.make_shelf(room)
    props.make_wall_shelf(room)
    props.make_trash_bin(room)

    props.make_desk_lamp(prps)
    props.make_radio_clock(prps)
    props.make_floppy_stack(prps)
    props.make_cassette_stack(prps)
    props.make_cd_stack(prps)
    props.make_cat(prps)
    props.make_mug(prps)
    props.make_notebook(prps)
    props.make_cables(prps)
    props.make_books(prps, levels, shelf_box)
    props.make_figurines(prps, shelf_top=1.10)
    props.make_posters(prps)

    apply_imports(prps)

    OUT.mkdir(parents=True, exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=str(SCENE_BLEND))
    print("[build] objets :", len(bpy.data.objects), "->", SCENE_BLEND)


main()
