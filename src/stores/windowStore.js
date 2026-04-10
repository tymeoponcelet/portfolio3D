import { create } from 'zustand'

let nextId = 1

export const useWindowStore = create((set, get) => ({
  // Ref vers le mesh de l'écran 3D
  screenRef: null,
  setScreenRef: (ref) => set({ screenRef: ref }),

  // Centre géométrique world-space de l'écran (calculé par ScreenContent via bbox)
  // Utilisé par Scene.zoomToScreen pour viser exactement le même point que le Html
  screenCenter: null,
  setScreenCenter: (v) => set({ screenCenter: v }),

  // Fenêtres ouvertes
  windows: [],

  openWindow: (config) => {
    const id = nextId++
    const count = get().windows.length
    set((s) => ({
      windows: [
        ...s.windows,
        {
          id,
          title: config.title ?? 'Sans titre',
          content: config.content,
          icon: config.icon ?? null,
          position: { x: 40 + count * 22, y: 30 + count * 22 },
          size: { width: config.width ?? 420, height: config.height ?? 320 },
          isMinimized: false,
          isMaximized: false,
          zIndex: 10 + count,
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

  focusWindow: (id) =>
    set((s) => {
      const top = Math.max(0, ...s.windows.map((w) => w.zIndex))
      return {
        windows: s.windows.map((w) =>
          w.id === id ? { ...w, zIndex: top + 1 } : w
        ),
      }
    }),

  updatePosition: (id, pos) =>
    set((s) => ({
      windows: s.windows.map((w) => (w.id === id ? { ...w, position: pos } : w)),
    })),

  updateSize: (id, size) =>
    set((s) => ({
      windows: s.windows.map((w) => (w.id === id ? { ...w, size } : w)),
    })),
}))
