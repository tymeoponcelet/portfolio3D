// src/assets/icons/index.js
import folder             from './folder.webp'
import txtfile            from './txtfile.webp'
import trashEmpty         from './trashEmpty.svg'
import trashFull          from './trashFull.svg'
import calculatorIcon     from './calculator.svg'
import wallpaperIcon      from './wallpaper.svg'
import explorerIcon       from './Explorer.webp'
import showcaseIcon       from './showcaseIcon.webp'
import windowExplorerIcon from './windowExplorerIcon.webp'
import computerBig        from './computerBig.webp'
import credits            from './credits.webp'
import windowsStartIcon   from './windowsStartIcon.webp'
import volumeOn           from './volumeOn.webp'
import minimize           from './minimize.webp'
import maximize           from './maximize.webp'
import close              from './close.webp'
import windowResize       from './windowResize.webp'
import paintIcon          from './paint.svg'
import minesweeperIcon    from './minesweeper.svg'

export const icons = {
  folder, txtfile, trashEmpty, trashFull,
  calculatorIcon, wallpaperIcon, explorerIcon,
  showcaseIcon, windowExplorerIcon, computerBig,
  credits, windowsStartIcon, volumeOn,
  minimize, maximize, close, windowResize,
  paintIcon, minesweeperIcon,
}

/** @param {keyof typeof icons} name */
export function getIcon(name) {
  return icons[name]
}