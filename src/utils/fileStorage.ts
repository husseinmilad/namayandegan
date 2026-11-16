import LZString from 'lz-string'
import { DEFAULT_WORKING_GROUPS, createInitialSeedDatabase } from '../data/seedData'
import type { AppDatabase, BoardMember, MeetingSession, Representative, WorkingGroup } from '../types/domain'
import { calcDurationMinutes, getTodayJalali } from './jalali'

const LOCAL_STORAGE_KEY = 'namayandegan_app_db_v1'

export interface ServerBackupFileMeta {
  fileName: string
  sizeBytes: number
  createdAt: string
  meetings: number
  representatives: number
  boardMembers: number
  label: string
}

export function validateAndNormalizeDatabase(raw: unknown): AppDatabase {
  if (!raw || typeof raw !== 'object') {
    throw new Error('ساختار فایل پشتیبان معتبر نیست (آبجکت JSON یافت نشد).')
  }

  const obj = raw as Record<string, unknown>

  if (
    !Array.isArray(obj.meetings) &&
    !Array.isArray(obj.representatives) &&
    !Array.isArray(obj.boardMembers)
  ) {
    throw new Error('فایل انتخاب‌شده شامل اطلاعات جلسات، نمایندگان یا اعضای هیئت امنا نیست.')
  }

  const workingGroups: WorkingGroup[] =
    Array.isArray(obj.workingGroups) && obj.workingGroups.length > 0
      ? (obj.workingGroups as WorkingGroup[])
      : structuredClone(DEFAULT_WORKING_GROUPS)

  const boardMembers: BoardMember[] = Array.isArray(obj.boardMembers)
    ? (obj.boardMembers as BoardMember[]).map((b, i) => ({
        id: String(b.id || `bm-${i + 1}`),
        fullName: String(b.fullName || 'عضو بدون نام'),
        roleTitle: String(b.roleTitle || 'عضو هیئت امنا'),
        avatarColor: b.avatarColor || 'indigo',
        active: b.active !== false,
      }))
    : []

  const representatives: Representative[] = Array.isArray(obj.representatives)
    ? (obj.representatives as Representative[]).map((r, i) => ({
        id: String(r.id || `rep-${i + 1}`),
        fullName: String(r.fullName || 'نماینده بدون نام'),
        specialtyTitle: String(r.specialtyTitle || ''),
        boardMemberId: String(r.boardMemberId || boardMembers[0]?.id || ''),
        workingGroupIds: Array.isArray(r.workingGroupIds) ? r.workingGroupIds.map(String) : [],
        phone: r.phone ? String(r.phone) : undefined,
        active: r.active !== false,
      }))
    : []

  const meetings: MeetingSession[] = Array.isArray(obj.meetings)
    ? (obj.meetings as MeetingSession[]).map((m, i) => {
        const startTime = String(m.startTime || '08:00')
        const endTime = String(m.endTime || '10:00')
        const durationMinutes =
          typeof m.durationMinutes === 'number' && m.durationMinutes > 0
            ? m.durationMinutes
            : calcDurationMinutes(startTime, endTime)
        return {
          id: String(m.id || `mtg-${Date.now()}-${i}`),
          sessionNumber: String(m.sessionNumber || ''),
          workingGroupId: String(m.workingGroupId || workingGroups[0]?.id || ''),
          jalaliDate: String(m.jalaliDate || getTodayJalali()),
          startTime,
          endTime,
          durationMinutes,
          subject: String(m.subject || 'بدون عنوان'),
          summary: m.summary ? String(m.summary) : '',
          location: m.location ? String(m.location) : '',
          attendances: Array.isArray(m.attendances)
            ? m.attendances.map((a) => {
                const status =
                  a.status === 'absent' || a.status === 'partial' ? a.status : 'present'
                const rs = String(a.startTime || startTime)
                const re = String(a.endTime || endTime)
                return {
                  representativeId: String(a.representativeId),
                  status,
                  startTime: rs,
                  endTime: re,
                  durationMinutes:
                    status === 'absent'
                      ? 0
                      : typeof a.durationMinutes === 'number'
                        ? a.durationMinutes
                        : calcDurationMinutes(rs, re),
                  note: a.note ? String(a.note) : undefined,
                }
              })
            : [],
          createdAt: String(m.createdAt || new Date().toISOString()),
          updatedAt: String(m.updatedAt || new Date().toISOString()),
        }
      })
    : []

  return {
    version: String(obj.version || '1.0.0'),
    organizationTitle: String(obj.organizationTitle || 'دبیرخانه هیئت امنا و کارگروه‌های تخصصی'),
    secretariatSubtitle: String(
      obj.secretariatSubtitle ||
        'سامانه یکپارچه ثبت جلسات، پایش ساعات حضور نمایندگان و گزارش‌گیری مدیریتی'
    ),
    lastUpdated: String(obj.lastUpdated || new Date().toISOString()),
    workingGroups,
    boardMembers,
    representatives,
    meetings,
  }
}

export function mergeDatabases(current: AppDatabase, incoming: AppDatabase): AppDatabase {
  const wgMap = new Map(current.workingGroups.map((x) => [x.id, x]))
  for (const wg of incoming.workingGroups) wgMap.set(wg.id, wg)

  const bmMap = new Map(current.boardMembers.map((x) => [x.id, x]))
  for (const bm of incoming.boardMembers) bmMap.set(bm.id, bm)

  const repMap = new Map(current.representatives.map((x) => [x.id, x]))
  for (const rep of incoming.representatives) repMap.set(rep.id, rep)

  const mtgMap = new Map(current.meetings.map((x) => [x.id, x]))
  for (const mtg of incoming.meetings) mtgMap.set(mtg.id, mtg)

  return {
    ...current,
    lastUpdated: new Date().toISOString(),
    workingGroups: Array.from(wgMap.values()),
    boardMembers: Array.from(bmMap.values()),
    representatives: Array.from(repMap.values()),
    meetings: Array.from(mtgMap.values()),
  }
}

export function loadFromBrowserStorage(): AppDatabase | null {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY)
    if (!raw) return null
    return validateAndNormalizeDatabase(JSON.parse(raw))
  } catch {
    return null
  }
}

export function saveToBrowserStorage(db: AppDatabase): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(db))
  } catch {
    // ignore storage quota errors
  }
}

export async function loadInitialDatabase(): Promise<{
  db: AppDatabase
  diskConnected: boolean
  isSharedSnapshot: boolean
}> {
  // 1. Check if URL contains shared snapshot (#share=...)
  const shared = decodeDatabaseFromUrlHash()
  if (shared) {
    return { db: shared, diskConnected: false, isSharedSnapshot: true }
  }

  // 2. Try local disk server API (/api/db)
  try {
    const res = await fetch('/api/db', { headers: { Accept: 'application/json' } })
    if (res.ok) {
      const payload = (await res.json()) as { exists?: boolean; data?: unknown }
      if (payload.exists && payload.data) {
        const validated = validateAndNormalizeDatabase(payload.data)
        saveToBrowserStorage(validated)
        return { db: validated, diskConnected: true, isSharedSnapshot: false }
      }
      // Server API is available, check browser localStorage or seed and persist to disk
      const local = loadFromBrowserStorage() || createInitialSeedDatabase()
      await saveToServerDisk(local)
      saveToBrowserStorage(local)
      return { db: local, diskConnected: true, isSharedSnapshot: false }
    }
  } catch {
    // Running without local server API (pure static mode)
  }

  // 3. Fallback to browser localStorage or seed
  const browserDb = loadFromBrowserStorage()
  if (browserDb) {
    return { db: browserDb, diskConnected: false, isSharedSnapshot: false }
  }

  const seeded = createInitialSeedDatabase()
  saveToBrowserStorage(seeded)
  return { db: seeded, diskConnected: false, isSharedSnapshot: false }
}

export async function saveToServerDisk(db: AppDatabase): Promise<boolean> {
  try {
    const res = await fetch('/api/db', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(db),
    })
    return res.ok
  } catch {
    return false
  }
}

export async function listServerBackups(): Promise<ServerBackupFileMeta[]> {
  try {
    const res = await fetch('/api/backups')
    if (!res.ok) return []
    const json = (await res.json()) as { files?: ServerBackupFileMeta[] }
    return Array.isArray(json.files) ? json.files : []
  } catch {
    return []
  }
}

export async function createServerNamedBackup(
  db: AppDatabase,
  label: string
): Promise<{ ok: boolean; fileName?: string }> {
  try {
    const fileTag = getTodayJalali().replace(/\//g, '-')
    const res = await fetch('/api/backups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileTag, label, data: db }),
    })
    if (!res.ok) return { ok: false }
    return (await res.json()) as { ok: boolean; fileName?: string }
  } catch {
    return { ok: false }
  }
}

export async function restoreFromServerBackup(fileName: string): Promise<AppDatabase> {
  const res = await fetch(`/api/backups/${encodeURIComponent(fileName)}`)
  if (!res.ok) throw new Error('خواندن فایل پشتیبان از سرور محلی ناموفق بود.')
  const json = (await res.json()) as { data?: unknown }
  return validateAndNormalizeDatabase(json.data)
}

export async function deleteServerBackup(fileName: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/backups/${encodeURIComponent(fileName)}`, {
      method: 'DELETE',
    })
    return res.ok
  } catch {
    return false
  }
}

/**
 * Browser File Download & File System Access API
 */
export function downloadDatabaseJsonFile(db: AppDatabase, customFileName?: string): string {
  const datePart = getTodayJalali().replace(/\//g, '-')
  const fileName = customFileName || `namayandegan-backup-${datePart}.json`
  const payload = {
    ...db,
    exportedAt: new Date().toISOString(),
  }
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json;charset=utf-8',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 2000)
  return fileName
}

interface FileSystemWritable {
  write: (data: string) => Promise<void>
  close: () => Promise<void>
}

export interface LocalFileHandle {
  name: string
  createWritable: () => Promise<FileSystemWritable>
  getFile: () => Promise<File>
}

export function isFileSystemAccessSupported(): boolean {
  return typeof window !== 'undefined' && 'showSaveFilePicker' in window && window.self === window.top
}

export async function saveWithNativeFilePicker(
  db: AppDatabase,
  existingHandle?: LocalFileHandle | null
): Promise<{ saved: boolean; handle?: LocalFileHandle; usedFallbackDownload?: boolean; fileName: string }> {
  const datePart = getTodayJalali().replace(/\//g, '-')
  const defaultName = `namayandegan-backup-${datePart}.json`

  try {
    if (existingHandle) {
      const writable = await existingHandle.createWritable()
      await writable.write(JSON.stringify({ ...db, exportedAt: new Date().toISOString() }, null, 2))
      await writable.close()
      return { saved: true, handle: existingHandle, fileName: existingHandle.name }
    }

    const win = window as unknown as {
      showSaveFilePicker?: (opts: unknown) => Promise<LocalFileHandle>
    }

    if (win.showSaveFilePicker && window.self === window.top) {
      const handle = await win.showSaveFilePicker({
        suggestedName: defaultName,
        types: [
          {
            description: 'فایل پشتیبان سامانه نمایندگان (JSON)',
            accept: { 'application/json': ['.json'] },
          },
        ],
      })
      const writable = await handle.createWritable()
      await writable.write(JSON.stringify({ ...db, exportedAt: new Date().toISOString() }, null, 2))
      await writable.close()
      return { saved: true, handle, fileName: handle.name }
    }
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      return { saved: false, fileName: '' }
    }
    // SecurityError inside iframe or unsupported browser -> fallback to standard download
  }

  const downloadedName = downloadDatabaseJsonFile(db, defaultName)
  return { saved: true, usedFallbackDownload: true, fileName: downloadedName }
}

export async function parseUploadedJsonFile(file: File): Promise<AppDatabase> {
  const text = await file.text()
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new Error('فایل انتخاب‌شده فرمت JSON معتبری ندارد.')
  }
  return validateAndNormalizeDatabase(parsed)
}

/**
 * Shareable Snapshot Link Helpers (LZString URL Hash)
 */
export function encodeDatabaseShareLink(db: AppDatabase): string {
  const compact = JSON.stringify(db)
  const compressed = LZString.compressToEncodedURIComponent(compact)
  const baseUrl = `${window.location.origin}${window.location.pathname}`
  return `${baseUrl}#share=${compressed}`
}

export function decodeDatabaseFromUrlHash(): AppDatabase | null {
  try {
    if (typeof window === 'undefined') return null
    const hash = window.location.hash || ''
    if (!hash.startsWith('#share=')) return null
    const encoded = hash.slice('#share='.length)
    if (!encoded) return null
    const jsonStr = LZString.decompressFromEncodedURIComponent(encoded)
    if (!jsonStr) return null
    return validateAndNormalizeDatabase(JSON.parse(jsonStr))
  } catch {
    return null
  }
}

export function clearShareUrlHash(): void {
  if (typeof window !== 'undefined' && window.location.hash.startsWith('#share=')) {
    window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`)
  }
}
