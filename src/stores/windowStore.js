// src/stores/windowStore.js
// Ce store ne gère QUE l'état 3D (mesh-écran, centre world-space).
// La gestion des fenêtres OS est dans src/stores/osStore.js
import { create } from 'zustand'

export const useWindowStore = create((set) => ({
  screenRef:       null,
  setScreenRef:    (ref) => set({ screenRef: ref }),
  screenCenter:    null,
  setScreenCenter: (v)   => set({ screenCenter: v }),
}))
