import { clsx }    from 'clsx'
import { twMerge } from 'tailwind-merge'

/** Fusionne des classes CSS (Tailwind + win95-*) sans conflits. */
export const cn = (...inputs) => twMerge(clsx(...inputs))
