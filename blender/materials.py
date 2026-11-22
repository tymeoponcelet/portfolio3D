"""Matériaux Principled (couleurs « fin 80s / début 90s ») ; les motifs
procéduraux sont cuits dans les atlas, ils ne coûtent rien sur le site."""
import bpy

_CACHE = {}


def _hex(h):
    h = h.lstrip("#")
    srgb = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    lin = [c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4 for c in srgb]
    return (*lin, 1.0)


def _base(name):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    bsdf = nt.nodes["Principled BSDF"]
    return m, nt, bsdf


def solid(name, color, rough=0.6, metal=0.0):
    if name in _CACHE:
        return _CACHE[name]
    m, nt, bsdf = _base(name)
    bsdf.inputs["Base Color"].default_value = _hex(color)
    bsdf.inputs["Roughness"].default_value = rough
    bsdf.inputs["Metallic"].default_value = metal
    _CACHE[name] = m
    return m


def _two_tone(name, c1, c2, rough, factor_node_builder):
    if name in _CACHE:
        return _CACHE[name]
    m, nt, bsdf = _base(name)
    mix = nt.nodes.new("ShaderNodeMix")
    mix.data_type = "RGBA"
    mix.inputs[6].default_value = _hex(c1)
    mix.inputs[7].default_value = _hex(c2)
    fac = factor_node_builder(nt)
    nt.links.new(fac, mix.inputs[0])
    nt.links.new(mix.outputs[2], bsdf.inputs["Base Color"])
    bsdf.inputs["Roughness"].default_value = rough
    _CACHE[name] = m
    return m


def _coords(nt):
    return nt.nodes.new("ShaderNodeTexCoord").outputs["Object"]


def wood(name, light="#7a4a2a", dark="#4a2a16"):
    def fac(nt):
        w = nt.nodes.new("ShaderNodeTexWave")
        w.wave_type = "BANDS"; w.bands_direction = "X"
        w.inputs["Scale"].default_value = 18.0
        w.inputs["Distortion"].default_value = 9.0
        w.inputs["Detail"].default_value = 3.0
        nt.links.new(_coords(nt), w.inputs["Vector"])
        return w.outputs["Fac"]
    return _two_tone(name, light, dark, 0.55, fac)


def stripes(name, c1, c2, scale=40.0):
    """Papier peint à rayures verticales."""
    def fac(nt):
        w = nt.nodes.new("ShaderNodeTexWave")
        w.wave_type = "BANDS"; w.bands_direction = "X"
        w.inputs["Scale"].default_value = scale
        w.inputs["Distortion"].default_value = 0.0
        ramp = nt.nodes.new("ShaderNodeValToRGB")
        ramp.color_ramp.interpolation = "CONSTANT"
        ramp.color_ramp.elements[1].position = 0.5
        nt.links.new(_coords(nt), w.inputs["Vector"])
        nt.links.new(w.outputs["Fac"], ramp.inputs["Fac"])
        return ramp.outputs["Color"]
    return _two_tone(name, c1, c2, 0.85, fac)


def noisy(name, c1, c2, scale=120.0, rough=0.95):
    """Moquette / tissu : bruit fin."""
    def fac(nt):
        n = nt.nodes.new("ShaderNodeTexNoise")
        n.inputs["Scale"].default_value = scale
        n.inputs["Detail"].default_value = 8.0
        nt.links.new(_coords(nt), n.inputs["Vector"])
        return n.outputs["Fac"]
    return _two_tone(name, c1, c2, rough, fac)


def checker(name, c1, c2, scale=12.0):
    """Housse de couette à carreaux."""
    def fac(nt):
        c = nt.nodes.new("ShaderNodeTexChecker")
        c.inputs["Scale"].default_value = scale
        c.inputs["Color1"].default_value = (1, 1, 1, 1)
        c.inputs["Color2"].default_value = (0, 0, 0, 1)
        nt.links.new(_coords(nt), c.inputs["Vector"])
        return c.outputs["Fac"]
    return _two_tone(name, c1, c2, 0.9, fac)


def image(name, img, rough=0.7):
    if name in _CACHE:
        return _CACHE[name]
    m, nt, bsdf = _base(name)
    tex = nt.nodes.new("ShaderNodeTexImage")
    tex.image = img
    nt.links.new(tex.outputs["Color"], bsdf.inputs["Base Color"])
    bsdf.inputs["Roughness"].default_value = rough
    _CACHE[name] = m
    return m


def emissive(name, color, strength=1.0, img=None):
    """Surface lumineuse (ampoule, chiffres du radio-réveil)."""
    if name in _CACHE:
        return _CACHE[name]
    m, nt, bsdf = _base(name)
    bsdf.inputs["Base Color"].default_value = _hex(color)
    bsdf.inputs["Emission Color"].default_value = _hex(color)
    bsdf.inputs["Emission Strength"].default_value = strength
    if img is not None:
        tex = nt.nodes.new("ShaderNodeTexImage")
        tex.image = img
        nt.links.new(tex.outputs["Color"], bsdf.inputs["Emission Color"])
        nt.links.new(tex.outputs["Color"], bsdf.inputs["Base Color"])
    _CACHE[name] = m
    return m
