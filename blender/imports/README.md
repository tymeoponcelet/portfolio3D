# Modèles à importer dans la chambre

Dépose ici des fichiers `.glb` pour enrichir la scène, puis relance
`./blender/run.ps1` (reconstruction + cuisson de l'éclairage + export).

- **Remplacer un objet généré** : nomme le fichier comme l'objet
  (`desk_lamp.glb`, `chair.glb`, `radio_clock.glb`, `poster_1.glb`…).
  Il prend la place de l'objet d'origine (même position) sauf si
  `placements.json` en décide autrement.
- **Ajouter un objet** : n'importe quel autre nom ; il est placé selon
  `placements.json` (sinon à l'origine — pense à le placer !).

`placements.json` (coordonnées du **site** : Y vers le haut, en mètres) :

```json
{
  "desk_lamp": { "position": [-0.35, 0.0, -0.05], "rotation_deg": [0, 30, 0], "scale": 1.0 },
  "plante":    { "position": [0.6, 0.0, -0.2] }
}
```

Les objets importés sont cuits dans l'atlas « props ». Garde-les légers
(quelques milliers de triangles) et de licence compatible (CC0 idéalement).
