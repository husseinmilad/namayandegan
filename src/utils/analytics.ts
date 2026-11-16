import type {
  AppDatabase,
  AttendanceStatus,
  BoardMember,
  DashboardFilters,
  MeetingSession,
  Representative,
  WorkingGroup,
} from '../types/domain'
import { JALALI_MONTH_NAMES, normalizeJalaliString, parseJalaliDate, toPersianDigits } from './jalali'

export interface RepresentativeSessionLog {
  meetingId: string
  sessionNumber: string
  jalaliDate: string
  workingGroupId: string
  workingGroupName: string
  subject: string
  meetingStartTime: string
  meetingEndTime: string
  meetingDurationMinutes: number
  repStartTime: string
  repEndTime: string
  status: AttendanceStatus
  attendedMinutes: number
  note?: string
}

export interface WorkingGroupSlice {
  workingGroupId: string
  workingGroupName: string
  sessionsInvited: number
  sessionsAttended: number
  attendedMinutes: number
}

export interface RepresentativeStat {
  representative: Representative
  boardMember: BoardMember | undefined
  workingGroups: WorkingGroup[]
  invitedSessionsCount: number
  attendedSessionsCount: number
  partialSessionsCount: number
  absentSessionsCount: number
  totalAttendedMinutes: number
  expectedMinutes: number
  sessionAttendanceRate: number
  timeAttendanceRate: number
  byWorkingGroup: WorkingGroupSlice[]
  sessionLogs: RepresentativeSessionLog[]
}

export interface BoardMemberStat {
  boardMember: BoardMember
  representatives: Representative[]
  uniqueMeetingsCoveredCount: number
  totalRepInvitedSessions: number
  totalRepAttendedSessions: number
  totalAttendedMinutes: number
  expectedMinutes: number
  sessionAttendanceRate: number
  timeAttendanceRate: number
  byWorkingGroup: Array<
    WorkingGroupSlice & {
      representativeNames: string[]
    }
  >
  representativeStats: RepresentativeStat[]
}

export interface WorkingGroupStat {
  workingGroup: WorkingGroup
  meetingsCount: number
  totalMeetingDurationMinutes: number
  totalPersonAttendedMinutes: number
  totalInvitedPersonSessions: number
  totalPresentPersonSessions: number
  attendanceRate: number
  assignedRepresentativesCount: number
  lastMeetingDate: string | null
  recentSubjects: string[]
}

export interface MonthlyTrendItem {
  monthKey: string // YYYY/MM
  label: string // مهر ۱۴۰۵
  meetingsCount: number
  meetingMinutes: number
  personAttendedMinutes: number
}

export interface AnalyticsResult {
  filteredMeetings: MeetingSession[]
  totalMeetingsCount: number
  totalMeetingDurationMinutes: number
  totalPersonAttendedMinutes: number
  totalPresentPersonSessions: number
  totalInvitedPersonSessions: number
  overallSessionAttendanceRate: number
  overallTimeAttendanceRate: number
  representativeStats: RepresentativeStat[]
  boardMemberStats: BoardMemberStat[]
  workingGroupStats: WorkingGroupStat[]
  monthlyTrends: MonthlyTrendItem[]
}

export function computeAnalytics(db: AppDatabase, filters: DashboardFilters): AnalyticsResult {
  const wgMap = new Map<string, WorkingGroup>(db.workingGroups.map((w) => [w.id, w]))
  const bmMap = new Map<string, BoardMember>(db.boardMembers.map((b) => [b.id, b]))
  const repMap = new Map<string, Representative>(db.representatives.map((r) => [r.id, r]))

  const normFrom = filters.dateFrom ? normalizeJalaliString(filters.dateFrom) : ''
  const normTo = filters.dateTo ? normalizeJalaliString(filters.dateTo) : ''
  const q = filters.searchQuery.trim().toLowerCase()

  // 1. Filter meetings
  const filteredMeetings = db.meetings
    .filter((m) => {
      if (filters.workingGroupId !== 'all' && m.workingGroupId !== filters.workingGroupId) {
        return false
      }
      const mDate = normalizeJalaliString(m.jalaliDate)
      if (normFrom && mDate < normFrom) return false
      if (normTo && mDate > normTo) return false

      if (filters.representativeId !== 'all') {
        const hasRep = m.attendances.some((a) => a.representativeId === filters.representativeId)
        if (!hasRep) return false
      }

      if (filters.boardMemberId !== 'all') {
        const hasBmRep = m.attendances.some((a) => {
          const r = repMap.get(a.representativeId)
          return r?.boardMemberId === filters.boardMemberId
        })
        if (!hasBmRep) return false
      }

      if (q) {
        const wgName = wgMap.get(m.workingGroupId)?.name || ''
        const repNames = m.attendances
          .map((a) => {
            const r = repMap.get(a.representativeId)
            const bm = r ? bmMap.get(r.boardMemberId) : undefined
            return `${r?.fullName || ''} ${bm?.fullName || ''}`
          })
          .join(' ')
        const haystack = `${m.subject} ${m.summary || ''} ${m.sessionNumber || ''} ${wgName} ${m.jalaliDate} ${repNames}`.toLowerCase()
        if (!haystack.includes(q)) return false
      }

      return true
    })
    .sort((a, b) => {
      const cmp = normalizeJalaliString(b.jalaliDate).localeCompare(normalizeJalaliString(a.jalaliDate))
      if (cmp !== 0) return cmp
      return b.startTime.localeCompare(a.startTime)
    })

  // 2. Compute Representative Stats
  const targetReps = db.representatives.filter((r) => {
    if (filters.representativeId !== 'all' && r.id !== filters.representativeId) return false
    if (filters.boardMemberId !== 'all' && r.boardMemberId !== filters.boardMemberId) return false
    if (
      filters.workingGroupId !== 'all' &&
      !r.workingGroupIds.includes(filters.workingGroupId) &&
      !filteredMeetings.some((m) => m.attendances.some((a) => a.representativeId === r.id))
    ) {
      return false
    }
    return true
  })

  const representativeStats: RepresentativeStat[] = targetReps
    .map((rep) => {
      const bm = bmMap.get(rep.boardMemberId)
      const wgs = rep.workingGroupIds
        .map((id) => wgMap.get(id))
        .filter((w): w is WorkingGroup => Boolean(w))

      let invitedSessionsCount = 0
      let attendedSessionsCount = 0
      let partialSessionsCount = 0
      let absentSessionsCount = 0
      let totalAttendedMinutes = 0
      let expectedMinutes = 0

      const wgAccum = new Map<string, WorkingGroupSlice>()
      for (const wg of db.workingGroups) {
        wgAccum.set(wg.id, {
          workingGroupId: wg.id,
          workingGroupName: wg.name,
          sessionsInvited: 0,
          sessionsAttended: 0,
          attendedMinutes: 0,
        })
      }

      const sessionLogs: RepresentativeSessionLog[] = []

      for (const m of filteredMeetings) {
        const record = m.attendances.find((a) => a.representativeId === rep.id)
        if (!record) continue

        invitedSessionsCount += 1
        expectedMinutes += m.durationMinutes

        const isAttended = record.status !== 'absent' && record.durationMinutes > 0
        const mins = isAttended ? record.durationMinutes : 0

        if (isAttended) {
          attendedSessionsCount += 1
          totalAttendedMinutes += mins
          if (record.status === 'partial') partialSessionsCount += 1
        } else {
          absentSessionsCount += 1
        }

        const wgSlice = wgAccum.get(m.workingGroupId)
        if (wgSlice) {
          wgSlice.sessionsInvited += 1
          if (isAttended) {
            wgSlice.sessionsAttended += 1
            wgSlice.attendedMinutes += mins
          }
        }

        sessionLogs.push({
          meetingId: m.id,
          sessionNumber: m.sessionNumber,
          jalaliDate: m.jalaliDate,
          workingGroupId: m.workingGroupId,
          workingGroupName: wgMap.get(m.workingGroupId)?.name || 'نامشخص',
          subject: m.subject,
          meetingStartTime: m.startTime,
          meetingEndTime: m.endTime,
          meetingDurationMinutes: m.durationMinutes,
          repStartTime: record.startTime,
          repEndTime: record.endTime,
          status: record.status,
          attendedMinutes: mins,
          note: record.note,
        })
      }

      const sessionAttendanceRate =
        invitedSessionsCount > 0 ? Math.round((attendedSessionsCount / invitedSessionsCount) * 100) : 0
      const timeAttendanceRate =
        expectedMinutes > 0 ? Math.round((totalAttendedMinutes / expectedMinutes) * 100) : 0

      return {
        representative: rep,
        boardMember: bm,
        workingGroups: wgs,
        invitedSessionsCount,
        attendedSessionsCount,
        partialSessionsCount,
        absentSessionsCount,
        totalAttendedMinutes,
        expectedMinutes,
        sessionAttendanceRate,
        timeAttendanceRate,
        byWorkingGroup: Array.from(wgAccum.values()),
        sessionLogs,
      }
    })
    .sort((a, b) => b.totalAttendedMinutes - a.totalAttendedMinutes)

  // 3. Compute Board Member Stats
  const repStatByRepId = new Map<string, RepresentativeStat>(
    representativeStats.map((rs) => [rs.representative.id, rs])
  )

  const targetBoardMembers = db.boardMembers.filter(
    (bm) => filters.boardMemberId === 'all' || bm.id === filters.boardMemberId
  )

  const boardMemberStats: BoardMemberStat[] = targetBoardMembers
    .map((bm) => {
      const bmReps = db.representatives.filter((r) => r.boardMemberId === bm.id)
      const bmRepIds = new Set(bmReps.map((r) => r.id))

      const bmRepStats = bmReps
        .map((r) => repStatByRepId.get(r.id))
        .filter((rs): rs is RepresentativeStat => Boolean(rs))

      let uniqueMeetingsCoveredCount = 0
      for (const m of filteredMeetings) {
        const covered = m.attendances.some(
          (a) => bmRepIds.has(a.representativeId) && a.status !== 'absent' && a.durationMinutes > 0
        )
        if (covered) uniqueMeetingsCoveredCount += 1
      }

      const totalRepInvitedSessions = bmRepStats.reduce((sum, r) => sum + r.invitedSessionsCount, 0)
      const totalRepAttendedSessions = bmRepStats.reduce((sum, r) => sum + r.attendedSessionsCount, 0)
      const totalAttendedMinutes = bmRepStats.reduce((sum, r) => sum + r.totalAttendedMinutes, 0)
      const expectedMinutes = bmRepStats.reduce((sum, r) => sum + r.expectedMinutes, 0)

      const sessionAttendanceRate =
        totalRepInvitedSessions > 0
          ? Math.round((totalRepAttendedSessions / totalRepInvitedSessions) * 100)
          : 0
      const timeAttendanceRate =
        expectedMinutes > 0 ? Math.round((totalAttendedMinutes / expectedMinutes) * 100) : 0

      const byWorkingGroup = db.workingGroups.map((wg) => {
        let sessionsInvited = 0
        let sessionsAttended = 0
        let attendedMinutes = 0
        const repNames = bmReps
          .filter((r) => r.workingGroupIds.includes(wg.id))
          .map((r) => r.fullName)

        for (const rs of bmRepStats) {
          const slice = rs.byWorkingGroup.find((s) => s.workingGroupId === wg.id)
          if (slice) {
            sessionsInvited += slice.sessionsInvited
            sessionsAttended += slice.sessionsAttended
            attendedMinutes += slice.attendedMinutes
          }
        }

        return {
          workingGroupId: wg.id,
          workingGroupName: wg.name,
          sessionsInvited,
          sessionsAttended,
          attendedMinutes,
          representativeNames: repNames,
        }
      })

      return {
        boardMember: bm,
        representatives: bmReps,
        uniqueMeetingsCoveredCount,
        totalRepInvitedSessions,
        totalRepAttendedSessions,
        totalAttendedMinutes,
        expectedMinutes,
        sessionAttendanceRate,
        timeAttendanceRate,
        byWorkingGroup,
        representativeStats: bmRepStats,
      }
    })
    .sort((a, b) => b.totalAttendedMinutes - a.totalAttendedMinutes)

  // 4. Compute Working Group Stats
  const allowedRepIds = new Set(targetReps.map((r) => r.id))

  const workingGroupStats: WorkingGroupStat[] = db.workingGroups.map((wg) => {
    const wgMeetings = filteredMeetings.filter((m) => m.workingGroupId === wg.id)
    const meetingsCount = wgMeetings.length
    const totalMeetingDurationMinutes = wgMeetings.reduce((s, m) => s + m.durationMinutes, 0)

    let totalPersonAttendedMinutes = 0
    let totalInvitedPersonSessions = 0
    let totalPresentPersonSessions = 0

    for (const m of wgMeetings) {
      for (const a of m.attendances) {
        if (!allowedRepIds.has(a.representativeId)) continue
        totalInvitedPersonSessions += 1
        if (a.status !== 'absent' && a.durationMinutes > 0) {
          totalPresentPersonSessions += 1
          totalPersonAttendedMinutes += a.durationMinutes
        }
      }
    }

    const attendanceRate =
      totalInvitedPersonSessions > 0
        ? Math.round((totalPresentPersonSessions / totalInvitedPersonSessions) * 100)
        : 0

    const assignedRepresentativesCount = db.representatives.filter((r) =>
      r.workingGroupIds.includes(wg.id)
    ).length

    return {
      workingGroup: wg,
      meetingsCount,
      totalMeetingDurationMinutes,
      totalPersonAttendedMinutes,
      totalInvitedPersonSessions,
      totalPresentPersonSessions,
      attendanceRate,
      assignedRepresentativesCount,
      lastMeetingDate: wgMeetings[0]?.jalaliDate || null,
      recentSubjects: wgMeetings.slice(0, 3).map((m) => m.subject),
    }
  })

  // 5. Global Totals & Monthly Trends
  const totalMeetingsCount = filteredMeetings.length
  const totalMeetingDurationMinutes = filteredMeetings.reduce((s, m) => s + m.durationMinutes, 0)
  const totalPersonAttendedMinutes = representativeStats.reduce(
    (s, r) => s + r.totalAttendedMinutes,
    0
  )
  const totalPresentPersonSessions = representativeStats.reduce(
    (s, r) => s + r.attendedSessionsCount,
    0
  )
  const totalInvitedPersonSessions = representativeStats.reduce(
    (s, r) => s + r.invitedSessionsCount,
    0
  )
  const totalExpectedPersonMinutes = representativeStats.reduce((s, r) => s + r.expectedMinutes, 0)

  const overallSessionAttendanceRate =
    totalInvitedPersonSessions > 0
      ? Math.round((totalPresentPersonSessions / totalInvitedPersonSessions) * 100)
      : 0

  const overallTimeAttendanceRate =
    totalExpectedPersonMinutes > 0
      ? Math.round((totalPersonAttendedMinutes / totalExpectedPersonMinutes) * 100)
      : 0

  const monthMap = new Map<string, MonthlyTrendItem>()
  for (const m of filteredMeetings) {
    const parsed = parseJalaliDate(m.jalaliDate)
    if (!parsed) continue
    const key = `${parsed.jy}/${String(parsed.jm).padStart(2, '0')}`
    const label = `${JALALI_MONTH_NAMES[parsed.jm - 1]} ${toPersianDigits(parsed.jy)}`
    const existing = monthMap.get(key) || {
      monthKey: key,
      label,
      meetingsCount: 0,
      meetingMinutes: 0,
      personAttendedMinutes: 0,
    }
    existing.meetingsCount += 1
    existing.meetingMinutes += m.durationMinutes
    for (const a of m.attendances) {
      if (!allowedRepIds.has(a.representativeId)) continue
      if (a.status !== 'absent' && a.durationMinutes > 0) {
        existing.personAttendedMinutes += a.durationMinutes
      }
    }
    monthMap.set(key, existing)
  }

  const monthlyTrends = Array.from(monthMap.values()).sort((a, b) =>
    a.monthKey.localeCompare(b.monthKey)
  )

  return {
    filteredMeetings,
    totalMeetingsCount,
    totalMeetingDurationMinutes,
    totalPersonAttendedMinutes,
    totalPresentPersonSessions,
    totalInvitedPersonSessions,
    overallSessionAttendanceRate,
    overallTimeAttendanceRate,
    representativeStats,
    boardMemberStats,
    workingGroupStats,
    monthlyTrends,
  }
}
