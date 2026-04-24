// src/stores/osStore.js
import { create } from 'zustand'

export const useOSStore = create((set, get) => {
  let _zCounter = 100  // compteur global de z-index (style Heffernan)
  let _idCounter = 1

  return {
  windows: [],

  screenWidth:  640,
  screenHeight: 480,
  setScreenSize: (w, h) => set({ screenWidth: w, screenHeight: h }),

  isShutdown: false,
  numShutdowns: 0,
  isBSOD: false,
  triggerBSOD: () => set({ isBSOD: true }),
  clearBSOD:   () => set({ isBSOD: false }),

  triggerShutdown: () =>
    set((s) => ({ isShutdown: true, numShutdowns: s.numShutdowns + 1 })),

  completeShutdown: () =>
    set(() => ({ isShutdown: false, windows: [] })),

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
    const { screenWidth, screenHeight } = get()
    const TASKBAR_H = 28
    const desktopW  = screenWidth
    const desktopH  = screenHeight - TASKBAR_H

    set((s) => ({
      windows: [
        ...s.windows,
        {
          id,
          appId:       config.appId ?? null,
          title:       config.title ?? 'Sans titre',
          icon:        config.icon  ?? null,
          rainbow:     config.rainbow ?? false,
          content:     config.content,
          position:    { x: Math.round((desktopW - (config.width ?? 580)) / 2) + (count % 4) * 16, y: Math.round((desktopH - (config.height ?? 400)) / 2) + (count % 4) * 16 },
          size:        { width: config.width ?? 580, height: config.height ?? 400 },
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

  closeWindowByAppId: (appId) =>
    set((s) => ({ windows: s.windows.filter((w) => w.appId !== appId) })),

  // ── Wallpaper ──────────────────────────────────────────────────
  wallpaper: { type: 'pattern', value: 'teal' },
  setWallpaper: (wp) => set({ wallpaper: wp }),

  // ── Run Dialog ─────────────────────────────────────────────────
  runDialogOpen: false,
  openRunDialog:  () => set({ runDialogOpen: true }),
  closeRunDialog: () => set({ runDialogOpen: false }),
  }
})
