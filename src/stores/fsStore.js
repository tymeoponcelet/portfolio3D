// src/stores/fsStore.js
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

  createItem: (type, parentId) => {
    const { items } = get()
    const base = type === 'folder'
      ? 'Nouveau dossier'
      : 'Nouveau document texte.txt'
    const name = uniqueName(items, parentId, base)
    const id   = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    set((s) => ({ items: [...s.items, { id, type, name, parentId: parentId ?? null, content: '' }] }))
    return id
  },

  renameItem: (id, name) => {
    const trimmed = name.trim()
    if (!trimmed) return
    set((s) => ({
      items: s.items.map((i) => i.id === id ? { ...i, name: trimmed } : i),
    }))
  },

  updateContent: (id, content) => {
    set((s) => ({
      items: s.items.map((i) => i.id === id ? { ...i, content } : i),
    }))
  },

  deleteItem: (id) => {
    const collect = (items, rootId) => {
      const result = [rootId]
      items.filter((i) => i.parentId === rootId)
           .forEach((c) => result.push(...collect(items, c.id)))
      return result
    }
    const { items } = get()
    const toDelete = new Set(collect(items, id))
    set(() => ({ items: items.filter((i) => !toDelete.has(i.id)) }))
  },
}))
