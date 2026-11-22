"""Petite boîte à outils géométrique : on modélise en repère SITE (Y-up,
mètres), puis `Part.finish()` convertit en repère Blender et crée l'objet."""
import math

import bmesh
import bpy
from mathutils import Matrix, Vector

# site(x, y, z) -> blender(x, -z, y)
SITE_TO_BL = Matrix(((1, 0, 0, 0), (0, 0, -1, 0), (0, 1, 0, 0), (0, 0, 0, 1)))


def _rot_y(deg):
    return Matrix.Rotation(math.radians(deg), 4, "Y")


class Part:
    """Accumule des primitives (repère site) dans un seul mesh multi-matériaux."""

    def __init__(self, name):
        self.name = name
        self.bm = bmesh.new()
        self.uv = self.bm.loops.layers.uv.new("UVMap")
        self.mats = []

    def _mi(self, mat):
        if mat not in self.mats:
            self.mats.append(mat)
        return self.mats.index(mat)

    def _absorb(self, tmp, mat, matrix):
        bmesh.ops.transform(tmp, matrix=matrix, verts=tmp.verts)
        mi = self._mi(mat)
        for f in tmp.faces:
            f.material_index = mi
        me = bpy.data.meshes.new("__tmp")
        tmp.to_mesh(me)
        tmp.free()
        self.bm.from_mesh(me)
        bpy.data.meshes.remove(me)

    def _new(self):
        tmp = bmesh.new()
        tmp.loops.layers.uv.new("UVMap")
        return tmp

    def box(self, center, size, mat, bevel=0.004, rot_y=0.0):
        tmp = self._new()
        bmesh.ops.create_cube(tmp, size=1.0, calc_uvs=True)
        bmesh.ops.scale(tmp, vec=Vector(size), verts=tmp.verts)
        b = min(bevel, min(size) * 0.45)
        if b > 0:
            bmesh.ops.bevel(tmp, geom=list(tmp.edges), offset=b, segments=2,
                            affect="EDGES", profile=0.5)
        m = Matrix.Translation(Vector(center)) @ _rot_y(rot_y)
        self._absorb(tmp, mat, m)
        return self

    def cyl(self, base, radius, height, mat, segs=24, r_top=None, cap=True, rot=None):
        """Cylindre (ou cône si r_top) vertical (axe Y site), posé sur `base`."""
        tmp = self._new()
        bmesh.ops.create_cone(tmp, cap_ends=cap, cap_tris=False, segments=segs,
                              radius1=radius, radius2=radius if r_top is None else r_top,
                              depth=height, calc_uvs=True)
        # create_cone est centré, axe Z local → axe Y site
        m = Matrix.Translation(Vector(base)) @ (rot or Matrix.Identity(4)) \
            @ Matrix.Translation((0, height / 2, 0)) @ Matrix.Rotation(-math.pi / 2, 4, "X")
        self._absorb(tmp, mat, m)
        return self

    def cyl_between(self, p0, p1, radius, mat, segs=12, r_end=None, cap=True):
        p0, p1 = Vector(p0), Vector(p1)
        d = p1 - p0
        rot = Vector((0, 1, 0)).rotation_difference(d.normalized()).to_matrix().to_4x4()
        return self.cyl(p0, radius, d.length, mat, segs=segs, r_top=r_end, cap=cap, rot=rot)

    def sphere(self, center, radius, mat, segs=16, scale=(1, 1, 1)):
        tmp = self._new()
        bmesh.ops.create_uvsphere(tmp, u_segments=segs, v_segments=max(6, segs // 2),
                                  radius=radius, calc_uvs=True)
        m = Matrix.Translation(Vector(center)) @ Matrix.Diagonal((*scale, 1))
        self._absorb(tmp, mat, m)
        return self

    def plane(self, center, w, h, mat, facing="+z"):
        """Rectangle w×h avec UV 0..1, face visible orientée vers `facing`."""
        tmp = self._new()
        bmesh.ops.create_grid(tmp, x_segments=1, y_segments=1, size=0.5, calc_uvs=True)
        bmesh.ops.scale(tmp, vec=Vector((w, h, 1)), verts=tmp.verts)   # grille dans XY, normale +Z
        rot = {"+z": Matrix.Identity(4),
               "-z": Matrix.Rotation(math.pi, 4, "Y"),
               "+x": Matrix.Rotation(math.pi / 2, 4, "Y"),
               "-x": Matrix.Rotation(-math.pi / 2, 4, "Y"),
               "+y": Matrix.Rotation(-math.pi / 2, 4, "X")}[facing]
        self._absorb(tmp, mat, Matrix.Translation(Vector(center)) @ rot)
        return self

    def finish(self, collection, rot_y=0.0, pivot=(0, 0, 0)):
        """Crée l'objet ; origine au centre-bas de sa boîte (repère site)."""
        if rot_y:
            p = Vector(pivot)
            m = Matrix.Translation(p) @ _rot_y(rot_y) @ Matrix.Translation(-p)
            bmesh.ops.transform(self.bm, matrix=m, verts=self.bm.verts)
        xs = [v.co.x for v in self.bm.verts]; ys = [v.co.y for v in self.bm.verts]
        zs = [v.co.z for v in self.bm.verts]
        origin = Vector(((min(xs) + max(xs)) / 2, min(ys), (min(zs) + max(zs)) / 2))
        bmesh.ops.translate(self.bm, vec=-origin, verts=self.bm.verts)
        bmesh.ops.transform(self.bm, matrix=SITE_TO_BL, verts=self.bm.verts)
        bmesh.ops.recalc_face_normals(self.bm, faces=self.bm.faces)
        me = bpy.data.meshes.new(self.name)
        self.bm.to_mesh(me)
        self.bm.free()
        for mt in self.mats:
            me.materials.append(mt)
        for poly in me.polygons:
            poly.use_smooth = False
        ob = bpy.data.objects.new(self.name, me)
        ob.location = SITE_TO_BL @ origin
        collection.objects.link(ob)
        return ob
