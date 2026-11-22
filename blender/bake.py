"""Éclairage nocturne + cuisson Cycles dans 3 atlas (room / props / computer).
    blender -b blender/out/scene.blend --factory-startup --python-exit-code 1 --python blender/bake.py
Sortie : blender/out/baked.blend + blender/out/{room,props,computer}_2k.png
"""
import math
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import bpy  # noqa: E402
from mathutils import Vector  # noqa: E402

import materials as M  # noqa: E402
from common import BAKED_BLEND, GROUPS, OUT, PREVIEWS, SCREEN_MESH, script_args, site_to_bl  # noqa: E402

ATLAS = 2048
SAMPLES = 384

# ── Réglages de l'ambiance (énergies en W, couleurs sRGB) ────────────
MOON = {"pos": (-1.25, 1.15, -1.60), "target": (0.1, -0.3, 0.2), "size": 1.4,
        "color": "#9db8ff", "energy": 600.0}
LAMP = {"color": "#ffb36b", "energy": 40.0, "spot_deg": 95}
CRT = {"color": "#3fd0c9", "strength": 40.0}
WORLD = {"color": "#1a2238", "strength": 0.35}


def setup_device():
    sc = bpy.context.scene
    sc.render.engine = "CYCLES"
    prefs = bpy.context.preferences.addons["cycles"].preferences
    for backend in ("OPTIX", "CUDA", "HIP", "ONEAPI"):
        try:
            prefs.compute_device_type = backend
            prefs.get_devices()
            gpus = [d for d in prefs.devices if d.type == backend]
            if gpus:
                for d in prefs.devices:
                    d.use = d.type == backend
                sc.cycles.device = "GPU"
                print(f"[bake] GPU {backend} : {[d.name for d in gpus]}")
                return
        except Exception:   # backend indisponible sur cette machine
            continue
    sc.cycles.device = "CPU"
    print("[bake] CPU")


def look_at(ob, target_site):
    t = Vector(site_to_bl(*target_site))
    ob.rotation_euler = (t - ob.location).to_track_quat("-Z", "Y").to_euler()


def add_lights():
    sc = bpy.context.scene
    world = sc.world or bpy.data.worlds.new("night")
    sc.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes["Background"]
    bg.inputs[0].default_value = M._hex(WORLD["color"])
    bg.inputs[1].default_value = WORLD["strength"]

    moon = bpy.data.lights.new("moonlight", "AREA")
    moon.shape = "SQUARE"; moon.size = MOON["size"]
    moon.color = M._hex(MOON["color"])[:3]; moon.energy = MOON["energy"]
    mo = bpy.data.objects.new("moonlight", moon)
    sc.collection.objects.link(mo)
    mo.location = site_to_bl(*MOON["pos"])
    look_at(mo, MOON["target"])

    # Lampe de bureau : spot placé sur l'ampoule de l'objet desk_lamp
    lamp = bpy.data.objects["desk_lamp"]
    bulb_mat = bpy.data.materials["bulb"]
    me = lamp.data
    idx = list(me.materials).index(bulb_mat)
    pts = [lamp.matrix_world @ me.vertices[v].co for p in me.polygons if p.material_index == idx for v in p.vertices]
    bulb = sum(pts, Vector()) / len(pts)
    spot = bpy.data.lights.new("desk_lamp_light", "SPOT")
    spot.color = M._hex(LAMP["color"])[:3]; spot.energy = LAMP["energy"]
    spot.spot_size = math.radians(LAMP["spot_deg"]); spot.shadow_soft_size = 0.03
    so = bpy.data.objects.new("desk_lamp_light", spot)
    sc.collection.objects.link(so)
    so.location = bulb
    look_at(so, (-0.55, 0.0, 0.05))

    # Écran CRT : surface émissive (le site le recouvre par l'OS en CSS3D)
    screen = next(o for o in bpy.data.collections[GROUPS["computer"]].all_objects
                  if o.name.startswith(SCREEN_MESH) and o.type == "MESH")
    crt = M.emissive("crt_glow", CRT["color"], CRT["strength"])
    screen.data.materials.clear()
    screen.data.materials.append(crt)


def make_bake_uvs(objs):
    """UV « bake » partagées par tout le groupe (dépliage + empaquetage commun)."""
    for o in objs:
        uvs = o.data.uv_layers
        if not uvs:
            uvs.new(name="UVMap")
        render_uv = next((u for u in uvs if u.active_render), uvs[0])
        bake = uvs.get("bake") or uvs.new(name="bake")
        uvs.active = bake
        render_uv.active_render = True     # les textures existantes gardent leurs UV
    bpy.ops.object.select_all(action="DESELECT")
    for o in objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.uv.smart_project(angle_limit=math.radians(66), island_margin=0.002, scale_to_bounds=False)
    bpy.ops.uv.pack_islands(rotate=True, margin=0.003)
    bpy.ops.object.mode_set(mode="OBJECT")


def bake_group(key, objs):
    img = bpy.data.images.new(f"{key}_2k", ATLAS, ATLAS, alpha=False)
    mats = {m for o in objs for m in o.data.materials if m}
    for m in mats:
        nt = m.node_tree
        node = nt.nodes.get("__bake_target") or nt.nodes.new("ShaderNodeTexImage")
        node.name = "__bake_target"
        node.image = img
        for n in nt.nodes:
            n.select = False
        node.select = True
        nt.nodes.active = node
    bpy.ops.object.select_all(action="DESELECT")
    for o in objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    sc = bpy.context.scene
    sc.cycles.samples = SAMPLES
    bk = sc.render.bake
    bk.use_pass_direct = bk.use_pass_indirect = True
    bk.use_pass_diffuse = bk.use_pass_emit = bk.use_pass_transmission = True
    bk.use_pass_glossy = False          # le brillant dépend du point de vue : non cuit
    bk.margin = 16
    bk.use_clear = True
    t0 = time.time()
    bpy.ops.object.bake(type="COMBINED")
    img.filepath_raw = str(OUT / f"{key}_2k.png")
    img.file_format = "PNG"
    img.save()
    print(f"[bake] {key} : {len(objs)} objets, {time.time() - t0:.0f} s -> {img.filepath_raw}")


def main():
    setup_device()
    add_lights()
    glass = bpy.data.objects.get("window_glass")
    if glass:
        glass.hide_render = True            # la lune traverse la fenêtre
    if "--lights-preview" in script_args():
        # Réglage rapide des lumières : rendu Cycles direct, sans cuisson
        import preview
        preview.render_all(PREVIEWS, "lights", engine="cycles")
        return
    for key, name in GROUPS.items():
        objs = [o for o in bpy.data.collections[name].all_objects
                if o.type == "MESH" and o.name != "window_glass"]
        make_bake_uvs(objs)
        bake_group(key, objs)
    if glass:
        glass.hide_render = False
    bpy.ops.wm.save_as_mainfile(filepath=str(BAKED_BLEND))


main()
