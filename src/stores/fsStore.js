import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const TRASH_ITEM = { id: 'trash', name: 'Corbeille', type: 'folder', parentId: null, system: true }

function collectDescendants(items, rootId) {
  const result = [rootId]
  items.filter((i) => i.parentId === rootId)
       .forEach((c) => result.push(...collectDescendants(items, c.id)))
  return result
}

function uniqueName(items, parentId, baseName) {
  const siblings = items.filter((i) => i.parentId === parentId).map((i) => i.name)
  if (!siblings.includes(baseName)) return baseName
  let n = 2
  while (siblings.includes(`${baseName} (${n})`)) n++
  return `${baseName} (${n})`
}

export const useFsStore = create(
  persist(
    (set, get) => ({
      items: [TRASH_ITEM],

      createItem: (type, parentId, pos = null) => {
        const base = type === 'folder' ? 'Nouveau dossier' : 'Nouveau document texte.txt'
        const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
        set((s) => {
          const name = uniqueName(s.items, parentId, base)
          return {
            items: [...s.items, {
              id, type, name,
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
          if (!item || item.system) return s
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
        set((s) => ({ items: s.items.map((i) => i.id === id ? { ...i, content } : i) }))
      },

      moveItem: (id, x, y) => {
        set((s) => ({ items: s.items.map((i) => i.id === id ? { ...i, pos: { x, y } } : i) }))
      },

      setParent: (id, parentId) => {
        set((s) => ({ items: s.items.map((i) => i.id === id ? { ...i, parentId, pos: null } : i) }))
      },

      trashItem: (id) => {
        set((s) => {
          const item = s.items.find((i) => i.id === id)
          if (!item || item.system) return s
          return {
            items: s.items.map((i) =>
              i.id === id ? { ...i, parentId: 'trash', originParentId: i.parentId, pos: null } : i
            ),
          }
        })
      },

      restoreItem: (id) => {
        set((s) => {
          const item = s.items.find((i) => i.id === id)
          if (!item) return s
          const originId = item.originParentId ?? null
          const originExists = originId === null || s.items.some((i) => i.id === originId)
          const newParentId = originExists ? originId : null
          return {
            items: s.items.map((i) =>
              i.id === id ? { ...i, parentId: newParentId, originParentId: undefined } : i
            ),
          }
        })
      },

      emptyTrash: () => {
        set((s) => {
          const toDelete = new Set()
          s.items.filter((i) => i.parentId === 'trash').forEach((i) => toDelete.add(i.id))
          let changed = true
          while (changed) {
            changed = false
            s.items.forEach((i) => {
              if (!toDelete.has(i.id) && i.parentId && toDelete.has(i.parentId)) {
                toDelete.add(i.id)
                changed = true
              }
            })
          }
          return { items: s.items.filter((i) => !toDelete.has(i.id)) }
        })
      },

      deleteItem: (id) => {
        set((s) => {
          const toDelete = new Set([id])
          let changed = true
          while (changed) {
            changed = false
            s.items.forEach((i) => {
              if (!toDelete.has(i.id) && i.parentId && toDelete.has(i.parentId)) {
                toDelete.add(i.id)
                changed = true
              }
            })
          }
          return { items: s.items.filter((i) => !toDelete.has(i.id)) }
        })
      },
    }),
    {
      name: 'win95-fs',
      partialize: (s) => ({ items: s.items }),
      merge: (persisted, current) => {
        const items = persisted?.items ?? []
        const hasTrash = items.some((i) => i.id === 'trash')
        return { ...current, items: hasTrash ? items : [TRASH_ITEM, ...items] }
      },
    }
  )
)
