import {
  AlertCircle,
  CheckCheck,
  CheckCircle2,
  Clock,
  FileText,
  Plus,
  UserCheck,
  UserPlus,
  UserX,
  X,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import type {
  AppDatabase,
  AttendanceStatus,
  MeetingAttendanceRecord,
  MeetingSession,
} from '../types/domain'
import {
  calcDurationMinutes,
  formatDurationVerbose,
  getTodayJalali,
  toPersianDigits,
} from '../utils/jalali'
import { getPalette } from '../utils/theme'
import { JalaliDatePicker } from './JalaliDatePicker'
import { TimePicker24 } from './TimePicker24'

interface MeetingModalProps {
  open: boolean
  db: AppDatabase
  editingMeeting: MeetingSession | null
  defaultWorkingGroupId?: string
  defaultJalaliDate?: string
  onClose: () => void
  onSave: (meeting: MeetingSession) => void
}

export function MeetingModal({
  open,
  db,
  editingMeeting,
  defaultWorkingGroupId,
  defaultJalaliDate,
  onClose,
  onSave,
}: MeetingModalProps) {
  const firstWgId = defaultWorkingGroupId || db.workingGroups[0]?.id || ''

  const [workingGroupId, setWorkingGroupId] = useState(firstWgId)
  const [jalaliDate, setJalaliDate] = useState(defaultJalaliDate || getTodayJalali())
  const [sessionNumber, setSessionNumber] = useState('')
  const [startTime, setStartTime] = useState('08:30')
  const [endTime, setEndTime] = useState('11:00')
  const [subject, setSubject] = useState('')
  const [summary, setSummary] = useState('')
  const [attendances, setAttendances] = useState<MeetingAttendanceRecord[]>([])
  const [guestRepId, setGuestRepId] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const buildDefaultAttendancesForWg = (
    wgId: string,
    sTime: string,
    eTime: string
  ): MeetingAttendanceRecord[] => {
    const dur = calcDurationMinutes(sTime, eTime)
    return db.representatives
      .filter((r) => r.active && r.workingGroupIds.includes(wgId))
      .map((r) => ({
        representativeId: r.id,
        status: 'present' as AttendanceStatus,
        startTime: sTime,
        endTime: eTime,
        durationMinutes: dur,
        note: '',
      }))
  }

  useEffect(() => {
    if (!open) return
    setErrorMsg('')
    if (editingMeeting) {
      setWorkingGroupId(editingMeeting.workingGroupId)
      setJalaliDate(editingMeeting.jalaliDate)
      setSessionNumber(editingMeeting.sessionNumber || '')
      setStartTime(editingMeeting.startTime)
      setEndTime(editingMeeting.endTime)
      setSubject(editingMeeting.subject)
      setSummary(editingMeeting.summary || '')

      // Ensure any new active representatives of this working group can also be seen
      const existingMap = new Map(
        editingMeeting.attendances.map((a) => [a.representativeId, { ...a }])
      )
      const wgReps = db.representatives.filter(
        (r) => r.active && r.workingGroupIds.includes(editingMeeting.workingGroupId)
      )
      for (const r of wgReps) {
        if (!existingMap.has(r.id)) {
          existingMap.set(r.id, {
            representativeId: r.id,
            status: 'absent',
            startTime: editingMeeting.startTime,
            endTime: editingMeeting.startTime,
            durationMinutes: 0,
            note: '',
          })
        }
      }
      setAttendances(Array.from(existingMap.values()))
    } else {
      const targetWg =
        defaultWorkingGroupId && defaultWorkingGroupId !== 'all'
          ? defaultWorkingGroupId
          : db.workingGroups[0]?.id || ''
      const initStart = '08:30'
      const initEnd = '11:00'
      const initDate = defaultJalaliDate || getTodayJalali()
      const countInWg = db.meetings.filter((m) => m.workingGroupId === targetWg).length + 1
      setWorkingGroupId(targetWg)
      setJalaliDate(initDate)
      setSessionNumber(toPersianDigits(`۱۴۰۵/${String(countInWg).padStart(2, '0')}`))
      setStartTime(initStart)
      setEndTime(initEnd)
      setSubject('')
      setSummary('')
      setAttendances(buildDefaultAttendancesForWg(targetWg, initStart, initEnd))
    }
    setGuestRepId('')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editingMeeting])

  if (!open) return null

  const meetingDuration = calcDurationMinutes(startTime, endTime)

  const handleWorkingGroupSwitch = (newWgId: string) => {
    setWorkingGroupId(newWgId)
    if (!editingMeeting) {
      const countInWg = db.meetings.filter((m) => m.workingGroupId === newWgId).length + 1
      setSessionNumber(toPersianDigits(`۱۴۰۵/${String(countInWg).padStart(2, '0')}`))
    }
    setAttendances(buildDefaultAttendancesForWg(newWgId, startTime, endTime))
  }

  const handleMeetingTimesChange = (newStart: string, newEnd: string) => {
    setStartTime(newStart)
    setEndTime(newEnd)
    const newDur = calcDurationMinutes(newStart, newEnd)
    setAttendances((prev) =>
      prev.map((a) => {
        if (a.status === 'present') {
          return {
            ...a,
            startTime: newStart,
            endTime: newEnd,
            durationMinutes: newDur,
          }
        }
        if (a.status === 'absent') {
          return {
            ...a,
            startTime: newStart,
            endTime: newStart,
            durationMinutes: 0,
          }
        }
        return a
      })
    )
  }

  const updateRepStatus = (repId: string, status: AttendanceStatus) => {
    setAttendances((prev) =>
      prev.map((a) => {
        if (a.representativeId !== repId) return a
        if (status === 'present') {
          return {
            ...a,
            status: 'present',
            startTime,
            endTime,
            durationMinutes: meetingDuration,
          }
        }
        if (status === 'absent') {
          return {
            ...a,
            status: 'absent',
            startTime,
            endTime: startTime,
            durationMinutes: 0,
          }
        }
        return {
          ...a,
          status: 'partial',
          startTime: a.startTime || startTime,
          endTime: a.endTime === a.startTime ? endTime : a.endTime || endTime,
          durationMinutes: calcDurationMinutes(
            a.startTime || startTime,
            a.endTime === a.startTime ? endTime : a.endTime || endTime
          ),
        }
      })
    )
  }

  const updateRepCustomTime = (repId: string, nextStart: string, nextEnd: string) => {
    const dur = calcDurationMinutes(nextStart, nextEnd)
    setAttendances((prev) =>
      prev.map((a) =>
        a.representativeId === repId
          ? {
              ...a,
              status: 'partial',
              startTime: nextStart,
              endTime: nextEnd,
              durationMinutes: dur,
            }
          : a
      )
    )
  }

  const updateRepNote = (repId: string, note: string) => {
    setAttendances((prev) =>
      prev.map((a) => (a.representativeId === repId ? { ...a, note } : a))
    )
  }

  const markAllPresent = () => {
    setAttendances((prev) =>
      prev.map((a) => ({
        ...a,
        status: 'present',
        startTime,
        endTime,
        durationMinutes: meetingDuration,
      }))
    )
  }

  const addGuestRepresentative = () => {
    if (!guestRepId) return
    if (attendances.some((a) => a.representativeId === guestRepId)) return
    setAttendances((prev) => [
      ...prev,
      {
        representativeId: guestRepId,
        status: 'present',
        startTime,
        endTime,
        durationMinutes: meetingDuration,
        note: 'حضور مهمان در کارگروه',
      },
    ])
    setGuestRepId('')
  }

  const availableGuestReps = db.representatives.filter(
    (r) => r.active && !attendances.some((a) => a.representativeId === r.id)
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!workingGroupId) {
      setErrorMsg('لطفاً کارگروه جلسه را انتخاب نمایید.')
      return
    }
    if (!jalaliDate) {
      setErrorMsg('لطفاً تاریخ شمسی جلسه را مشخص نمایید.')
      return
    }
    if (meetingDuration <= 0) {
      setErrorMsg('ساعت پایان جلسه باید بعد از ساعت شروع جلسه باشد.')
      return
    }
    if (!subject.trim()) {
      setErrorMsg('لطفاً موضوع گزارش / دستور جلسه را وارد نمایید.')
      return
    }

    for (const a of attendances) {
      if (a.status === 'partial' && a.durationMinutes <= 0) {
        const rep = db.representatives.find((r) => r.id === a.representativeId)
        setErrorMsg(
          `ساعت خروج نماینده «${rep?.fullName || ''}» باید بزرگ‌تر از ساعت ورود ایشان باشد.`
        )
        return
      }
    }

    const nowIso = new Date().toISOString()
    const saved: MeetingSession = {
      id: editingMeeting?.id || `mtg-${Date.now()}`,
      sessionNumber: sessionNumber.trim(),
      workingGroupId,
      jalaliDate,
      startTime,
      endTime,
      durationMinutes: meetingDuration,
      subject: subject.trim(),
      summary: summary.trim(),
      location: editingMeeting?.location || 'سالن جلسات دبیرخانه هیئت امنا',
      attendances,
      createdAt: editingMeeting?.createdAt || nowIso,
      updatedAt: nowIso,
    }
    onSave(saved)
  }

  const presentCount = attendances.filter((a) => a.status !== 'absent' && a.durationMinutes > 0).length
  const totalPersonMinutes = attendances.reduce(
    (s, a) => s + (a.status !== 'absent' ? a.durationMinutes : 0),
    0
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/55 p-3 backdrop-blur-xs sm:p-5">
      <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-6 py-4">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">
              {editingMeeting ? 'ویرایش اطلاعات جلسه و ساعت حضور نمایندگان' : 'ثبت جلسه جدید کارگروه تخصصی'}
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              اطلاعات کارگروه، تاریخ شمسی، ساعت شروع و پایان، موضوع گزارش و وضعیت حضور هر نماینده را وارد کنید.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-200/70 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 space-y-5 overflow-y-auto p-6">
          {errorMsg && (
            <div className="flex items-center gap-2.5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Step 1: Select Working Group */}
          <div>
            <label className="mb-2 block text-xs font-bold text-slate-700">
              ۱. انتخاب نام کارگروه تخصصی <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
              {db.workingGroups.map((wg) => {
                const pal = getPalette(wg.colorKey)
                const selected = workingGroupId === wg.id
                return (
                  <button
                    key={wg.id}
                    type="button"
                    onClick={() => handleWorkingGroupSwitch(wg.id)}
                    className={`flex flex-col items-start rounded-2xl border p-3 text-right transition-all ${
                      selected
                        ? `${pal.bgSoft} ${pal.border} ring-2 ${pal.ring}`
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex w-full items-center justify-between">
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${pal.solidBg}`}
                      />
                      {selected && <CheckCircle2 className={`h-4 w-4 ${pal.text}`} />}
                    </div>
                    <span className="mt-2 text-xs font-extrabold text-slate-800">{wg.name}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Step 2: Date, Session Number, Start & End Time */}
          <div className="grid grid-cols-1 gap-4 rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4 sm:grid-cols-12">
            <div className="sm:col-span-5">
              <label className="mb-1.5 block text-xs font-bold text-slate-700">
                ۲. تاریخ جلسه (تقویم شمسی) <span className="text-rose-500">*</span>
              </label>
              <JalaliDatePicker
                value={jalaliDate}
                onChange={setJalaliDate}
                showLongFormat
              />
            </div>

            <div className="sm:col-span-3">
              <label className="mb-1.5 block text-xs font-bold text-slate-700">
                شماره جلسه
              </label>
              <input
                type="text"
                value={sessionNumber}
                onChange={(e) => setSessionNumber(e.target.value)}
                placeholder="مثلاً ۱۴۰۵/۰۸"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-800 tabular-fa focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-4">
              <label className="mb-1.5 block text-xs font-bold text-slate-700">
                ۳. ساعت شروع و پایان جلسه <span className="text-rose-500">*</span>
              </label>
              <div className="flex flex-wrap items-center gap-2">
                <TimePicker24
                  value={startTime}
                  onChange={(val) => handleMeetingTimesChange(val, endTime)}
                />
                <span className="text-xs font-bold text-slate-400">تا</span>
                <TimePicker24
                  value={endTime}
                  onChange={(val) => handleMeetingTimesChange(startTime, val)}
                />
              </div>
              <div className="mt-1.5 flex items-center gap-1.5 text-[11px] font-semibold">
                <Clock className="h-3.5 w-3.5 text-emerald-600" />
                {meetingDuration > 0 ? (
                  <span className="text-emerald-700">
                    مدت زمان جلسه: {formatDurationVerbose(meetingDuration)}
                  </span>
                ) : (
                  <span className="text-rose-600">ساعت پایان باید بعد از شروع باشد</span>
                )}
              </div>
            </div>
          </div>

          {/* Step 3: Report Subject & Summary */}
          <div className="space-y-3">
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-slate-700">
                <FileText className="h-4 w-4 text-emerald-600" />
                <span>۴. موضوع گزارش / دستور اصلی جلسه</span>
                <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="عنوان دقیق موضوع گزارش بررسی‌شده در جلسه کارگروه را وارد نمایید..."
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                چکیده مباحث / مصوبات گزارش (اختیاری)
              </label>
              <textarea
                rows={2}
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="خلاصه تصمیمات، مصوبات یا نکات کلیدی جهت درج در گزارش تفصیلی..."
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs leading-relaxed text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
              />
            </div>
          </div>

          {/* Step 4: Representatives Attendance */}
          <div className="rounded-2xl border border-slate-200 bg-white">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-slate-50/70 px-4 py-3">
              <div>
                <h3 className="text-xs font-extrabold text-slate-800">
                  ۵. ثبت حضور و ساعت حضور نمایندگان کارگروه و اعضای هیئت امنا
                </h3>
                <p className="text-[11px] text-slate-500">
                  به‌طور پیش‌فرض ساعت حضور با ساعت جلسه تنظیم می‌شود؛ برای تأخیر یا خروج زودتر گزینه «حضور ساعتی» را بزنید.
                </p>
              </div>
              <button
                type="button"
                onClick={markAllPresent}
                className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                ثبت حضور کامل همه
              </button>
            </div>

            {attendances.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">
                هنوز نماینده‌ای به این کارگروه اختصاص داده نشده است. می‌توانید از بخش زیر نماینده اضافه کنید یا در منوی «ساختار هیئت امنا و کارگروه‌ها» نمایندگان را تعریف نمایید.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {attendances.map((att) => {
                  const rep = db.representatives.find((r) => r.id === att.representativeId)
                  const bm = rep
                    ? db.boardMembers.find((b) => b.id === rep.boardMemberId)
                    : undefined

                  return (
                    <div
                      key={att.representativeId}
                      className={`flex flex-col gap-3 p-3.5 transition sm:flex-row sm:items-center sm:justify-between ${
                        att.status === 'absent' ? 'bg-slate-50/60 opacity-75' : 'bg-white'
                      }`}
                    >
                      {/* Representative & Board Member Info */}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-bold text-slate-900">
                            {rep?.fullName || 'نماینده حذف‌شده'}
                          </span>
                          {bm && (
                            <span className="inline-flex items-center rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-0.5 text-[11px] font-semibold text-indigo-700">
                              نماینده: {bm.fullName}
                            </span>
                          )}
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                          {rep?.specialtyTitle && <span>{rep.specialtyTitle}</span>}
                          <span className="font-semibold text-emerald-700 tabular-fa">
                            میزان حضور ثبت‌شده:{' '}
                            {att.status === 'absent'
                              ? 'غایب (۰ دقیقه)'
                              : formatDurationVerbose(att.durationMinutes)}
                          </span>
                        </div>
                      </div>

                      {/* Status Selector & Optional Custom Time / Note */}
                      <div className="flex flex-col items-stretch gap-2 sm:items-end">
                        <div className="inline-flex rounded-xl border border-slate-200 bg-slate-100/80 p-0.5">
                          <button
                            type="button"
                            onClick={() => updateRepStatus(att.representativeId, 'present')}
                            className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                              att.status === 'present'
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            <UserCheck className="h-3.5 w-3.5" />
                            حاضر کامل
                          </button>

                          <button
                            type="button"
                            onClick={() => updateRepStatus(att.representativeId, 'partial')}
                            className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                              att.status === 'partial'
                                ? 'bg-amber-500 text-white shadow-xs'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            <Clock className="h-3.5 w-3.5" />
                            حضور ساعتی
                          </button>

                          <button
                            type="button"
                            onClick={() => updateRepStatus(att.representativeId, 'absent')}
                            className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                              att.status === 'absent'
                                ? 'bg-rose-600 text-white shadow-xs'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            <UserX className="h-3.5 w-3.5" />
                            غایب
                          </button>
                        </div>

                        {att.status === 'partial' && (
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-[11px] font-medium text-slate-500">ورود:</span>
                            <TimePicker24
                              compact
                              value={att.startTime}
                              onChange={(s) =>
                                updateRepCustomTime(att.representativeId, s, att.endTime)
                              }
                            />
                            <span className="text-[11px] font-medium text-slate-500">خروج:</span>
                            <TimePicker24
                              compact
                              value={att.endTime}
                              onChange={(eVal) =>
                                updateRepCustomTime(att.representativeId, att.startTime, eVal)
                              }
                            />
                          </div>
                        )}

                        <input
                          type="text"
                          value={att.note || ''}
                          onChange={(e) => updateRepNote(att.representativeId, e.target.value)}
                          placeholder={
                            att.status === 'absent' ? 'علت غیبت (اختیاری)...' : 'توضیح کوتاه (اختیاری)...'
                          }
                          className="w-full rounded-lg border border-slate-200 bg-slate-50/70 px-2.5 py-1 text-[11px] text-slate-700 placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none sm:w-56"
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Add Guest Representative from other working groups */}
            {availableGuestReps.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 bg-slate-50/50 px-4 py-2.5">
                <UserPlus className="h-4 w-4 text-slate-400" />
                <select
                  value={guestRepId}
                  onChange={(e) => setGuestRepId(e.target.value)}
                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:border-emerald-500 focus:outline-none"
                >
                  <option value="">افزودن نماینده مهمان از سایر کارگروه‌ها...</option>
                  {availableGuestReps.map((r) => {
                    const bm = db.boardMembers.find((b) => b.id === r.boardMemberId)
                    return (
                      <option key={r.id} value={r.id}>
                        {r.fullName} {bm ? `(نماینده ${bm.fullName})` : ''}
                      </option>
                    )
                  })}
                </select>
                {guestRepId && (
                  <button
                    type="button"
                    onClick={addGuestRepresentative}
                    className="inline-flex items-center gap-1 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-700"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    افزودن به جلسه
                  </button>
                )}
              </div>
            )}
          </div>
        </form>

        {/* Modal Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50 px-6 py-3.5">
          <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-600 tabular-fa">
            <span>
              حاضرین: <strong className="text-emerald-700">{toPersianDigits(presentCount)}</strong> از{' '}
              {toPersianDigits(attendances.length)} نفر
            </span>
            <span className="text-slate-300">|</span>
            <span>
              مجموع نفر-ساعت حضور در جلسه:{' '}
              <strong className="text-indigo-700">{formatDurationVerbose(totalPersonMinutes)}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-100"
            >
              انصراف
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-extrabold text-white shadow-sm shadow-emerald-600/20 transition hover:bg-emerald-700"
            >
              {editingMeeting ? 'ذخیره تغییرات جلسه' : 'ثبت نهایی جلسه و محاسبه ساعات'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
