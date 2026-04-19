import { create } from 'zustand'

function uniqueName(items, parentId, baseName) {
  const siblings = items
    .filter((i) => i.parentId === parentId)
    .map((i) => i.name)
  if (!siblings.includes(baseName)) return baseName
  let n = 2
  while (siblings.includes(`${baseName} (${n})`)) n++
  return `${baseName} (${n})`
}

export const useFsStore = create((set, get) => ({
  items: [],

  createItem: (type, parentId, pos = null) => {
    const base = type === 'folder'
      ? 'Nouveau dossier'
      : 'Nouveau document texte.txt'
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    set((s) => {
      const name = uniqueName(s.items, parentId, base)
      return {
        items: [...s.items, {
          id,
          type,
          name,
          parentId: parentId ?? null,
          pos:      pos ?? null,
          ...(type === 'file' ? { content: '' } : {}),
        }],
      }
    })
    return id
  },

  renameItem: (id, name) => {
    const trimmed = name.trim()
    if (!trimmed) return
    set((s) => {
      const item = s.items.find((i) => i.id === id)
      if (!item) return s
      const siblings = s.items.filter((i) => i.parentId === item.parentId && i.id !== id)
      let finalName = trimmed
      if (siblings.some((i) => i.name === trimmed)) {
        let n = 2
        while (siblings.some((i) => i.name === `${trimmed} (${n})`)) n++
        finalName = `${trimmed} (${n})`
      }
      return { items: s.items.map((i) => i.id === id ? { ...i, name: finalName } : i) }
    })
  },

  updateContent: (id, content) => {
    set((s) => ({
      items: s.items.map((i) => i.id === id ? { ...i, content } : i),
    }))
  },

  moveItem: (id, x, y) => {
    set((s) => ({
      items: s.items.map((i) => i.id === id ? { ...i, pos: { x, y } } : i),
    }))
  },

  setParent: (id, parentId) => {
    set((s) => ({
      items: s.items.map((i) => i.id === id ? { ...i, parentId, pos: null } : i),
    }))
  },

  deleteItem: (id) => {
    const collect = (items, rootId) => {
      const result = [rootId]
      items.filter((i) => i.parentId === rootId)
           .forEach((c) => result.push(...collect(items, c.id)))
      return result
    }
    set((s) => {
      const toDelete = new Set(collect(s.items, id))
      return { items: s.items.filter((i) => !toDelete.has(i.id)) }
    })
  },
}))
