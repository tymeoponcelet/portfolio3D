// src/stores/osStore.js
import { create } from 'zustand'

export const useOSStore = create((set, get) => {
  let _zCounter = 100  // compteur global de z-index (style Heffernan)
  let _idCounter = 1

  return {
  windows: [],

  openWindow: (config) => {
    const { windows } = get()

    if (config.appId) {
      const existing = windows.find((w) => w.appId === config.appId)
      if (existing) {
        get().focusWindow(existing.id)
        if (existing.isMinimized) {
          set((s) => ({
            windows: s.windows.map((w) =>
              w.id === existing.id ? { ...w, isMinimized: false } : w
            ),
          }))
        }
        return existing.id
      }
    }

    const id     = _idCounter++
    const count  = windows.length
    const zIndex = ++_zCounter

    set((s) => ({
      windows: [
        ...s.windows,
        {
          id,
          appId:       config.appId ?? null,
          title:       config.title ?? 'Sans titre',
          icon:        config.icon  ?? null,
          content:     config.content,
          position:    { x: 40 + (count % 6) * 24, y: 30 + (count % 6) * 24 },
          size:        { width: config.width ?? 440, height: config.height ?? 320 },
          isMinimized: false,
          isMaximized: false,
          zIndex,
        },
      ],
    }))
    return id
  },

  closeWindow: (id) =>
    set((s) => ({ windows: s.windows.filter((w) => w.id !== id) })),

  minimizeWindow: (id) =>
    set((s) => ({
      windows: s.windows.map((w) =>
        w.id === id ? { ...w, isMinimized: !w.isMinimized } : w
      ),
    })),

  maximizeWindow: (id) =>
    set((s) => ({
      windows: s.windows.map((w) =>
        w.id === id ? { ...w, isMaximized: !w.isMaximized } : w
      ),
    })),

  focusWindow: (id) => {
    const zIndex = ++_zCounter
    set((s) => ({
      windows: s.windows.map((w) =>
        w.id === id ? { ...w, zIndex } : w
      ),
    }))
  },

  updatePosition: (id, pos) =>
    set((s) => ({
      windows: s.windows.map((w) => (w.id === id ? { ...w, position: pos } : w)),
    })),

  updateSize: (id, size) =>
    set((s) => ({
      windows: s.windows.map((w) => (w.id === id ? { ...w, size } : w)),
    })),
  }
})
