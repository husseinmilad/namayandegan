import type { ColorThemeKey } from '../types/domain'

export interface ThemePalette {
  bgSoft: string
  bgBadge: string
  text: string
  border: string
  solidBg: string
  ring: string
  hex: string
  hexSoft: string
}

export const THEME_PALETTES: Record<ColorThemeKey, ThemePalette> = {
  indigo: {
    bgSoft: 'bg-indigo-50/80',
    bgBadge: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    text: 'text-indigo-700',
    border: 'border-indigo-200',
    solidBg: 'bg-indigo-600',
    ring: 'ring-indigo-500/20',
    hex: '#4f46e5',
    hexSoft: '#eef2ff',
  },
  emerald: {
    bgSoft: 'bg-emerald-50/80',
    bgBadge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    solidBg: 'bg-emerald-600',
    ring: 'ring-emerald-500/20',
    hex: '#059669',
    hexSoft: '#ecfdf5',
  },
  amber: {
    bgSoft: 'bg-amber-50/80',
    bgBadge: 'bg-amber-100 text-amber-800 border-amber-200',
    text: 'text-amber-700',
    border: 'border-amber-200',
    solidBg: 'bg-amber-600',
    ring: 'ring-amber-500/20',
    hex: '#d97706',
    hexSoft: '#fffbeb',
  },
  rose: {
    bgSoft: 'bg-rose-50/80',
    bgBadge: 'bg-rose-100 text-rose-800 border-rose-200',
    text: 'text-rose-700',
    border: 'border-rose-200',
    solidBg: 'bg-rose-600',
    ring: 'ring-rose-500/20',
    hex: '#e11d48',
    hexSoft: '#fff1f2',
  },
  cyan: {
    bgSoft: 'bg-cyan-50/80',
    bgBadge: 'bg-cyan-100 text-cyan-800 border-cyan-200',
    text: 'text-cyan-700',
    border: 'border-cyan-200',
    solidBg: 'bg-cyan-600',
    ring: 'ring-cyan-500/20',
    hex: '#0891b2',
    hexSoft: '#ecfeff',
  },
  violet: {
    bgSoft: 'bg-violet-50/80',
    bgBadge: 'bg-violet-100 text-violet-800 border-violet-200',
    text: 'text-violet-700',
    border: 'border-violet-200',
    solidBg: 'bg-violet-600',
    ring: 'ring-violet-500/20',
    hex: '#7c3aed',
    hexSoft: '#f5f3ff',
  },
}

export function getPalette(key?: ColorThemeKey): ThemePalette {
  return THEME_PALETTES[key || 'indigo'] || THEME_PALETTES.indigo
}

export function getInitials(name: string): string {
  const cleaned = name
    .replace(/^(دکتر|مهندس|سید|سیده|حجت‌الاسلام|استاد|آقای|خانم)\s+/g, '')
    .trim()
  const parts = cleaned.split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'ن'
  if (parts.length === 1) return parts[0].slice(0, 2)
  return `${parts[0][0]}‌${parts[parts.length - 1][0]}`
}
