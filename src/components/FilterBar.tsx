import { Filter, RotateCcw, Search } from 'lucide-react'
import { DEFAULT_FILTERS, type AppDatabase, type DashboardFilters } from '../types/domain'
import { toPersianDigits } from '../utils/jalali'
import { JalaliDatePicker } from './JalaliDatePicker'

interface FilterBarProps {
  db: AppDatabase
  filters: DashboardFilters
  onChange: (next: DashboardFilters) => void
  matchedMeetingsCount: number
}

export function FilterBar({ db, filters, onChange, matchedMeetingsCount }: FilterBarProps) {
  const hasActiveFilter =
    filters.workingGroupId !== 'all' ||
    filters.boardMemberId !== 'all' ||
    filters.representativeId !== 'all' ||
    Boolean(filters.dateFrom) ||
    Boolean(filters.dateTo) ||
    Boolean(filters.searchQuery.trim())

  const filteredRepsForSelect =
    filters.boardMemberId === 'all'
      ? db.representatives
      : db.representatives.filter((r) => r.boardMemberId === filters.boardMemberId)

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
          <Filter className="h-4 w-4 text-emerald-600" />
          <span>فیلتر هوشمند گزارش‌ها (به‌روزرسانی آنی نمودارها، جداول، اکسل و PDF)</span>
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-slate-600 tabular-fa">
            {toPersianDigits(matchedMeetingsCount)} جلسه منطبق
          </span>
        </div>

        {hasActiveFilter && (
          <button
            type="button"
            onClick={() => onChange(DEFAULT_FILTERS)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            پاک کردن تمام فیلترها
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-6">
        {/* Search Subject */}
        <div className="relative lg:col-span-2">
          <Search className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={filters.searchQuery}
            onChange={(e) => onChange({ ...filters, searchQuery: e.target.value })}
            placeholder="جستجو در موضوع گزارش، نماینده یا عضو هیئت امنا..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50/60 py-2 pr-9 pl-3 text-xs text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
          />
        </div>

        {/* Working Group */}
        <div>
          <select
            value={filters.workingGroupId}
            onChange={(e) => onChange({ ...filters, workingGroupId: e.target.value })}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
          >
            <option value="all">همه کارگروه‌ها (۴ کارگروه)</option>
            {db.workingGroups.map((wg) => (
              <option key={wg.id} value={wg.id}>
                کارگروه {wg.name}
              </option>
            ))}
          </select>
        </div>

        {/* Board Member */}
        <div>
          <select
            value={filters.boardMemberId}
            onChange={(e) => {
              const nextBm = e.target.value
              const currentRepValid =
                nextBm === 'all' ||
                db.representatives.some(
                  (r) => r.id === filters.representativeId && r.boardMemberId === nextBm
                )
              onChange({
                ...filters,
                boardMemberId: nextBm,
                representativeId: currentRepValid ? filters.representativeId : 'all',
              })
            }}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
          >
            <option value="all">همه اعضای هیئت امنا</option>
            {db.boardMembers.map((bm) => (
              <option key={bm.id} value={bm.id}>
                نمایندگان {bm.fullName}
              </option>
            ))}
          </select>
        </div>

        {/* Date From */}
        <JalaliDatePicker
          value={filters.dateFrom}
          onChange={(d) => onChange({ ...filters, dateFrom: d })}
          placeholder="از تاریخ شمسی"
          clearable
          compact
        />

        {/* Date To */}
        <JalaliDatePicker
          value={filters.dateTo}
          onChange={(d) => onChange({ ...filters, dateTo: d })}
          placeholder="تا تاریخ شمسی"
          clearable
          compact
        />
      </div>

      {/* Optional Representative Quick Pill Filter */}
      {filteredRepsForSelect.length > 0 && (
        <div className="mt-2.5 flex items-center gap-2 border-t border-slate-100 pt-2.5">
          <span className="shrink-0 text-[11px] font-semibold text-slate-500">فیلتر نماینده:</span>
          <select
            value={filters.representativeId}
            onChange={(e) => onChange({ ...filters, representativeId: e.target.value })}
            className="max-w-xs rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 focus:border-emerald-500 focus:outline-none"
          >
            <option value="all">همه نمایندگان ({toPersianDigits(filteredRepsForSelect.length)} نفر)</option>
            {filteredRepsForSelect.map((r) => {
              const bm = db.boardMembers.find((b) => b.id === r.boardMemberId)
              return (
                <option key={r.id} value={r.id}>
                  {r.fullName} {bm ? `(نماینده ${bm.fullName})` : ''}
                </option>
              )
            })}
          </select>
        </div>
      )}
    </div>
  )
}
