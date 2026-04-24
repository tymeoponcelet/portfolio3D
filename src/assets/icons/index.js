// src/assets/icons/index.js
// Pattern Henry Heffernan — importe les PNG et les exporte par nom.
import folder             from './folder.png'
import txtfile            from './txtfile.png'
import trashEmpty         from './trashEmpty.svg'
import trashFull          from './trashFull.svg'
import calculatorIcon     from './calculator.svg'
import wallpaperIcon      from './wallpaper.svg'
import explorerIcon       from './Explorer.webp'
import showcaseIcon       from './showcaseIcon.png'
import windowExplorerIcon from './windowExplorerIcon.png'
import computerBig        from './computerBig.png'
import credits            from './credits.png'
import windowsStartIcon   from './windowsStartIcon.png'
import volumeOn           from './volumeOn.png'
import minimize           from './minimize.png'
import maximize           from './maximize.png'
import close              from './close.png'
import windowResize       from './windowResize.png'
import paintIcon         from './paint.svg'
import minesweeperIcon   from './minesweeper.svg'
import csgoIcon          from './csgo.svg'

export const icons = {
  folder,
  txtfile,
  trashEmpty,
  trashFull,
  calculatorIcon,
  wallpaperIcon,
  explorerIcon,
  showcaseIcon,
  windowExplorerIcon,
  computerBig,
  credits,
  windowsStartIcon,
  volumeOn,
  minimize,
  maximize,
  close,
  windowResize,
  paintIcon,
  minesweeperIcon,
  csgoIcon,
}

/** @param {keyof typeof icons} name */
export function getIcon(name) {
  return icons[name]
}
