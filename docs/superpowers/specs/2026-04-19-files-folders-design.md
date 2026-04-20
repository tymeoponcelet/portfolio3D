# Fichiers & Dossiers Win95 — Design Spec

## Résumé

Système de fichiers virtuel éphémère (reset au boot/shutdown) permettant de créer des dossiers et fichiers `.txt` sur le bureau Win95 du portfolio. Les dossiers s'ouvrent dans une fenêtre File Explorer. Les fichiers `.txt` s'ouvrent dans un Notepad éditable. Les icônes sont renommables en double-clic lent ou F2.

---

## 1. Modèle de données — `src/stores/fsStore.js`

Store Zustand séparé d'`osStore`. Structure en liste plate :

```ts
type FsItem = {
  id:       string          // uuid court (Date.now() + random)
  type:     'folder' | 'file'
  name:     string          // "Nouveau dossier" | "Nouveau document texte.txt"
  parentId: string | null   // null = bureau, sinon id du dossier parent
  content:  string          // vide pour dossiers, texte pour fichiers .txt
}
```

**Actions :**
- `createItem(type, parentId)` → génère un id, nom par défaut, retourne l'id
- `renameItem(id, name)` → met à jour `name`
- `updateContent(id, content)` → met à jour `content` (fichiers txt uniquement)
- `deleteItem(id)` → supprime l'item et tous ses descendants récursivement

**Noms par défaut :**
- Dossier : `"Nouveau dossier"` (si déjà pris : `"Nouveau dossier (2)"`, etc.)
- Fichier : `"Nouveau document texte.txt"` (même logique)

---

## 2. Positionnement des icônes sur le bureau

Les icônes dynamiques (fsStore) s'empilent en **colonne gauche** en dessous de l'icône Portfolio statique :

- `left: 10px`, `top: 90 + index * 72px`
- `index` = position dans la liste des items `parentId === null`, triée par ordre de création

Pas de drag-and-drop dans cette version.

---

## 3. Composant d'icône dynamique — `DynamicIcon`

Nouveau composant dans `Desktop.jsx` (ou extrait dans `DynamicIcon.jsx` si trop grand) gérant :

**Props :**
- `item` : l'objet FsItem
- `isSelected`, `isRenaming` : états contrôlés par le parent
- `onSelect(id)`, `onOpen(item)`, `onRenameConfirm(id, name)`, `onRenameCancel(id)`

**Comportements :**
- **Clic simple** → appelle `onSelect(id)`
- **Double-clic** → appelle `onOpen(item)`
- **Deuxième clic lent** (mousedown sur icône déjà `isSelected`, ≥300ms après sélection) → appelle `onSelect(id)` qui trigger le renommage dans Desktop
- **F2** quand `isSelected` → Desktop passe `isRenaming=true`
- **Quand `isRenaming=true`** → remplace le label par un `<input>` avec le nom actuel, sélectionne tout le texte au focus
- **Entrée ou blur** → `onRenameConfirm(id, value)`
- **Échap** → `onRenameCancel(id)`

**Icônes visuelles :**
- Dossier : `icons.windowExplorerIcon` (asset disponible dans le projet)
- Fichier `.txt` : emoji `📄` (aucun asset document dans le projet)

---

## 4. Mise à jour du bureau — `Desktop.jsx`

**Nouveaux états :**
- `renamingId: string | null` — id de l'icône en cours de renommage
- `selectedFsId: string | null` — id de l'icône dynamique sélectionnée (distinct de `selected` pour les icônes statiques)

**Flux création :**
1. ContextMenu appelle `onCreateFolder()` ou `onCreateFile()` (callbacks passés en props)
2. Desktop appelle `fsStore.createItem(type, null)` → obtient le nouvel id
3. Desktop set `renamingId = newId` → `DynamicIcon` apparaît en mode renommage

**Flux renommage :**
- `onRenameConfirm(id, name)` → `fsStore.renameItem(id, name)` + `setRenamingId(null)`
- `onRenameCancel(id)` → `setRenamingId(null)` (si item vide de nom, garder le nom par défaut)

**Keydown F2 :**
- useEffect global sur `keydown` : si `selectedFsId && e.key === 'F2'` → `setRenamingId(selectedFsId)`

**Rendu :**
```jsx
{desktopFsItems.map((item, index) => (
  <DynamicIcon
    key={item.id}
    item={item}
    style={{ top: 90 + index * 72, left: 10 }}
    isSelected={selectedFsId === item.id}
    isRenaming={renamingId === item.id}
    onSelect={setSelectedFsId}
    onOpen={handleOpenFsItem}
    onRenameConfirm={handleRenameConfirm}
    onRenameCancel={handleRenameCancel}
  />
))}
```

**Sélection unifiée :** cliquer sur le bureau désélectionne tout (`setSelected(null)` + `setSelectedFsId(null)` + `setRenamingId(null)`)

---

## 5. Mise à jour du menu contextuel — `ContextMenu.jsx`

- Activer "Dossier" et "Fichier texte" dans le sous-menu "Nouveau" (retirer la classe `disabled`)
- Passer deux nouvelles props au composant `ContextMenu` : `onCreateFolder` et `onCreateFile`
- Ces callbacks sont définis dans `Desktop.jsx` et appellent `fsStore.createItem`
- Au clic sur "Dossier" : `win95sounds.click()` + `onCreateFolder()` + `onClose()`
- Au clic sur "Fichier texte" : `win95sounds.click()` + `onCreateFile()` + `onClose()`

---

## 6. `FileExplorer.jsx` — `src/components/OS/apps/FileExplorer.jsx`

Fenêtre ouverte par double-clic sur un dossier. Reçoit `folderId` et `folderName` en props (passés via le `content` du window config).

**Contenu :**
- Barre d'adresse statique : `C:\Bureau\{folderName}` (style Win95, non éditable)
- Grille des items dont `parentId === folderId`
- Même comportement double-clic/renommage que le bureau
- Si vide : texte centré "Ce dossier est vide."
- Pas de navigation remonter (pas de bouton "Précédent" pour l'instant)

**Ouverture dans osStore :**
```js
openWindow({
  appId:  `explorer-${folderId}`,   // une fenêtre par dossier
  title:  folderName,
  icon:   '📁',
  width:  480,
  height: 320,
  content: <FileExplorer folderId={folderId} folderName={folderName} />,
})
```

---

## 7. `Notepad.jsx` — `src/components/OS/apps/Notepad.jsx`

Fenêtre ouverte par double-clic sur un fichier `.txt`. Reçoit `fileId` en prop.

**Contenu :**
- `<textarea>` pleine hauteur, style Win95 (fond blanc, bordure `--border-sunken`, police `--w-font-mono`)
- Lit `fsStore.items.find(i => i.id === fileId).content` à l'initialisation
- `onChange` → appelle `fsStore.updateContent(fileId, value)` à chaque frappe

**Ouverture dans osStore :**
```js
openWindow({
  appId:  `notepad-${fileId}`,   // une fenêtre par fichier
  title:  `${fileName} — Bloc-notes`,
  icon:   '📄',
  width:  400,
  height: 300,
  content: <Notepad fileId={fileId} />,
})
```

---

## 8. Fichiers modifiés / créés

| Action  | Fichier |
|---------|---------|
| Créer   | `src/stores/fsStore.js` |
| Créer   | `src/components/OS/apps/FileExplorer.jsx` |
| Créer   | `src/components/OS/apps/Notepad.jsx` |
| Modifier | `src/components/OS/Desktop.jsx` |
| Modifier | `src/components/OS/ContextMenu.jsx` |

---

## 9. Hors périmètre (cette version)

- Drag-and-drop des icônes
- Couper / Copier / Coller
- Supprimer (corbeille)
- Navigation "dossier parent" dans FileExplorer
- Persistance localStorage
- Dossiers imbriqués dans des dossiers (supporté par le modèle mais pas l'UI)
