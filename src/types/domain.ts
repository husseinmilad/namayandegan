export type ColorThemeKey = 'indigo' | 'emerald' | 'amber' | 'rose' | 'cyan' | 'violet'

export interface WorkingGroup {
  id: string
  name: string
  shortCode: string
  colorKey: ColorThemeKey
  description: string
}

export interface BoardMember {
  id: string
  fullName: string
  roleTitle: string
  avatarColor: ColorThemeKey
  active: boolean
}

export interface Representative {
  id: string
  fullName: string
  specialtyTitle: string
  boardMemberId: string
  workingGroupIds: string[]
  phone?: string
  active: boolean
}

export type AttendanceStatus = 'present' | 'partial' | 'absent'

export interface MeetingAttendanceRecord {
  representativeId: string
  status: AttendanceStatus
  startTime: string // HH:mm (24h)
  endTime: string // HH:mm (24h)
  durationMinutes: number
  note?: string
}

export interface MeetingSession {
  id: string
  sessionNumber: string
  workingGroupId: string
  jalaliDate: string // YYYY/MM/DD in Solar Hijri (e.g. "1405/08/20")
  startTime: string // HH:mm
  endTime: string // HH:mm
  durationMinutes: number
  subject: string // موضوع گزارش
  summary?: string // خلاصه مباحث و مصوبات
  location?: string
  attendances: MeetingAttendanceRecord[]
  createdAt: string
  updatedAt: string
}

export interface AppDatabase {
  version: string
  organizationTitle: string
  secretariatSubtitle: string
  lastUpdated: string
  workingGroups: WorkingGroup[]
  boardMembers: BoardMember[]
  representatives: Representative[]
  meetings: MeetingSession[]
}

export interface DashboardFilters {
  workingGroupId: string // 'all' or specific id
  boardMemberId: string // 'all' or specific id
  representativeId: string // 'all' or specific id
  dateFrom: string // '' or 'YYYY/MM/DD'
  dateTo: string // '' or 'YYYY/MM/DD'
  searchQuery: string
}

export const DEFAULT_FILTERS: DashboardFilters = {
  workingGroupId: 'all',
  boardMemberId: 'all',
  representativeId: 'all',
  dateFrom: '',
  dateTo: '',
  searchQuery: '',
}

export type ActiveTab =
  | 'dashboard'
  | 'meetings'
  | 'analytics'
  | 'directory'
  | 'files'
