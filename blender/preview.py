"""Rendu de prévisualisation depuis les caméras du site.
    blender -b <fichier.blend> --python blender/preview.py -- --out <dossier> [--prefix build] [--layout-light] [--engine eevee|cycles]
--layout-light : éclairage neutre temporaire (contrôle de la mise en place).
"""
import math
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import bpy  # noqa: E402
from mathutils import Vector  # noqa: E402

from common import script_args, site_to_bl  # noqa: E402

# Caméras de src/components/Scene/Scene.jsx (fov vertical 50°) + une vue de la pièce
CAMERAS = {
    "overview": ((0.0, 0.35, 1.50), (0.0, 0.15, 0.05)),
    "hover":    ((0.0, 0.27, 0.55), (0.0, 0.22, -0.04)),
    "room":     ((0.9, 0.75, 2.30), (-0.6, 0.20, -0.40)),
}


def add_camera(name, pos, target):
    cam = bpy.data.cameras.new(name)
    cam.sensor_fit = "VERTICAL"
    cam.angle_y = math.radians(50)
    cam.clip_start = 0.01
    ob = bpy.data.objects.new(name, cam)
    bpy.context.scene.collection.objects.link(ob)
    p, t = Vector(site_to_bl(*pos)), Vector(site_to_bl(*target))
    ob.location = p
    ob.rotation_euler = (t - p).to_track_quat("-Z", "Y").to_euler()
    return ob


def main():
    args = script_args()
    out = Path(args[args.index("--out") + 1]).resolve()
    prefix = args[args.index("--prefix") + 1] if "--prefix" in args else "preview"
    engine = args[args.index("--engine") + 1] if "--engine" in args else "eevee"
    out.mkdir(parents=True, exist_ok=True)
    sc = bpy.context.scene
    sc.render.engine = "CYCLES" if engine == "cycles" else "BLENDER_EEVEE"
    if engine == "cycles":
        sc.cycles.samples = 64
        sc.cycles.use_denoising = True
    sc.render.resolution_x, sc.render.resolution_y = 1400, 900
    sc.render.resolution_percentage = 60
    sc.view_settings.view_transform = "Standard"
    if "--layout-light" in args:
        world = sc.world or bpy.data.worlds.new("w")
        sc.world = world
        world.use_nodes = True
        world.node_tree.nodes["Background"].inputs[1].default_value = 0.6
        sun = bpy.data.lights.new("sun", "SUN"); sun.energy = 2.5
        so = bpy.data.objects.new("sun", sun); sc.collection.objects.link(so)
        so.rotation_euler = (math.radians(50), 0, math.radians(30))
    for name, (pos, tgt) in CAMERAS.items():
        sc.camera = add_camera(name, pos, tgt)
        sc.render.filepath = str(out / f"{prefix}_{name}.png")
        bpy.ops.render.render(write_still=True)
        print("[preview]", sc.render.filepath)


main()
