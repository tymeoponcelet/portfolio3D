"""Export pour le site : 3 glb (Draco, sans matériaux, UV « bake » seule) +
atlas WebP 2k/1k dans public/models/room/, puis prévisualisations rendues À
PARTIR DES ATLAS (= exactement ce que le site affichera).
    blender -b blender/out/baked.blend --factory-startup --python-exit-code 1 --python blender/export.py
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import bpy  # noqa: E402

from common import GROUPS, MODELS_OUT, OUT, PREVIEWS, PC_ROOT  # noqa: E402

WEBP_QUALITY = 85


def save_webp(src_png, dst, size):
    img = bpy.data.images.load(str(src_png))
    if img.size[0] != size:
        img.scale(size, size)
    sc = bpy.context.scene
    st = sc.render.image_settings
    st.file_format = "WEBP"
    st.quality = WEBP_QUALITY
    st.color_mode = "RGB"
    img.save_render(str(dst), scene=sc)
    bpy.data.images.remove(img)


def only_bake_uv(objs):
    for o in objs:
        uvs = o.data.uv_layers
        for u in [u for u in uvs if u.name != "bake"]:
            uvs.remove(u)
        if uvs.get("bake"):
            uvs["bake"].active = uvs["bake"].active_render = True


def export_group(key, name):
    col = bpy.data.collections[name]
    objs = [o for o in col.all_objects]
    only_bake_uv([o for o in objs if o.type == "MESH"])
    bpy.ops.object.select_all(action="DESELECT")
    for o in objs:
        o.select_set(True)
    path = MODELS_OUT / f"{key}.glb"
    bpy.ops.export_scene.gltf(
        filepath=str(path), export_format="GLB", use_selection=True,
        export_materials="NONE", export_normals=False, export_texcoords=True,
        export_apply=True, export_yup=True,
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_draco_position_quantization=14,
        export_draco_texcoord_quantization=12,
    )
    print(f"[export] {path.name} : {path.stat().st_size / 1024:.0f} Ko")


def previews_from_atlases():
    """Matériaux temporaires Emission = atlas (via UV bake), puis rendu Eevee."""
    import preview
    for key, name in GROUPS.items():
        img = bpy.data.images.load(str(MODELS_OUT / f"{key}_2k.webp"))
        mat = bpy.data.materials.new(f"__prev_{key}")
        mat.use_nodes = True
        nt = mat.node_tree
        for n in list(nt.nodes):
            nt.nodes.remove(n)
        tex = nt.nodes.new("ShaderNodeTexImage"); tex.image = img
        em = nt.nodes.new("ShaderNodeEmission")
        out = nt.nodes.new("ShaderNodeOutputMaterial")
        nt.links.new(tex.outputs["Color"], em.inputs["Color"])
        nt.links.new(em.outputs["Emission"], out.inputs["Surface"])
        for o in bpy.data.collections[name].all_objects:
            if o.type != "MESH":
                continue
            if o.name == "window_glass":
                glass = bpy.data.materials.new("__prev_glass")
                glass.use_nodes = True
                b = glass.node_tree.nodes["Principled BSDF"]
                b.inputs["Base Color"].default_value = (0.56, 0.66, 0.78, 1)
                b.inputs["Alpha"].default_value = 0.18
                o.data.materials.clear(); o.data.materials.append(glass)
                continue
            o.data.materials.clear()
            o.data.materials.append(mat)
    for ob in [o for o in bpy.data.objects if o.type == "LIGHT"]:
        bpy.data.objects.remove(ob, do_unlink=True)
    sc = bpy.context.scene
    if sc.world:
        sc.world.node_tree.nodes["Background"].inputs[1].default_value = 0.0
    preview.render_all(PREVIEWS, "baked", engine="eevee")


def main():
    MODELS_OUT.mkdir(parents=True, exist_ok=True)
    for key in GROUPS:
        png = OUT / f"{key}_2k.png"
        save_webp(png, MODELS_OUT / f"{key}_2k.webp", 2048)
        save_webp(png, MODELS_OUT / f"{key}_1k.webp", 1024)
    for key, name in GROUPS.items():
        export_group(key, name)
    assert bpy.data.objects.get(PC_ROOT), "pc_root manquant"
    previews_from_atlases()


main()
