import {
  Building2,
  Check,
  Edit3,
  Layers,
  Plus,
  Save,
  Trash2,
  UserCheck,
  Users,
  X,
} from 'lucide-react'
import { useState } from 'react'
import type {
  AppDatabase,
  BoardMember,
  ColorThemeKey,
  Representative,
  WorkingGroup,
} from '../types/domain'
import { toPersianDigits } from '../utils/jalali'
import { getInitials, getPalette } from '../utils/theme'

interface DirectoryManagementViewProps {
  db: AppDatabase
  onUpdateDb: (updater: (prev: AppDatabase) => AppDatabase, toastMsg?: string) => void
}

const COLOR_CHOICES: Array<{ key: ColorThemeKey; label: string }> = [
  { key: 'indigo', label: 'نیلی' },
  { key: 'emerald', label: 'زمردی' },
  { key: 'amber', label: 'طلایی' },
  { key: 'rose', label: 'یاقوتی' },
  { key: 'cyan', label: 'فیروزه‌ای' },
  { key: 'violet', label: 'بنفش' },
]

export function DirectoryManagementView({ db, onUpdateDb }: DirectoryManagementViewProps) {
  const [section, setSection] = useState<'representatives' | 'boardMembers' | 'workingGroups'>(
    'representatives'
  )

  // Organization Title Edit
  const [orgTitle, setOrgTitle] = useState(db.organizationTitle)
  const [orgSub, setOrgSub] = useState(db.secretariatSubtitle)

  // Representative Form State
  const [editingRep, setEditingRep] = useState<Representative | null>(null)
  const [repName, setRepName] = useState('')
  const [repSpecialty, setRepSpecialty] = useState('')
  const [repBmId, setRepBmId] = useState(db.boardMembers[0]?.id || '')
  const [repWgIds, setRepWgIds] = useState<string[]>(
    db.workingGroups[0] ? [db.workingGroups[0].id] : []
  )
  const [showRepForm, setShowRepForm] = useState(false)

  // Board Member Form State
  const [editingBm, setEditingBm] = useState<BoardMember | null>(null)
  const [bmName, setBmName] = useState('')
  const [bmRole, setBmRole] = useState('عضو هیئت امنا')
  const [bmColor, setBmColor] = useState<ColorThemeKey>('indigo')
  const [showBmForm, setShowBmForm] = useState(false)

  // Working Group Form State
  const [editingWg, setEditingWg] = useState<WorkingGroup | null>(null)
  const [wgName, setWgName] = useState('')
  const [wgDesc, setWgDesc] = useState('')
  const [wgColor, setWgColor] = useState<ColorThemeKey>('indigo')
  const [showWgForm, setShowWgForm] = useState(false)

  const openNewRepForm = () => {
    setEditingRep(null)
    setRepName('')
    setRepSpecialty('')
    setRepBmId(db.boardMembers[0]?.id || '')
    setRepWgIds(db.workingGroups[0] ? [db.workingGroups[0].id] : [])
    setShowRepForm(true)
  }

  const openEditRepForm = (rep: Representative) => {
    setEditingRep(rep)
    setRepName(rep.fullName)
    setRepSpecialty(rep.specialtyTitle)
    setRepBmId(rep.boardMemberId)
    setRepWgIds([...rep.workingGroupIds])
    setShowRepForm(true)
  }

  const toggleRepWg = (wgId: string) => {
    setRepWgIds((prev) =>
      prev.includes(wgId) ? prev.filter((x) => x !== wgId) : [...prev, wgId]
    )
  }

  const handleSaveRep = (e: React.FormEvent) => {
    e.preventDefault()
    if (!repName.trim() || !repBmId || repWgIds.length === 0) return

    const item: Representative = {
      id: editingRep?.id || `rep-${Date.now()}`,
      fullName: repName.trim(),
      specialtyTitle: repSpecialty.trim(),
      boardMemberId: repBmId,
      workingGroupIds: repWgIds,
      active: true,
    }

    onUpdateDb(
      (prev) => ({
        ...prev,
        representatives: editingRep
          ? prev.representatives.map((r) => (r.id === editingRep.id ? item : r))
          : [...prev.representatives, item],
      }),
      editingRep ? 'اطلاعات نماینده به‌روزرسانی شد.' : 'نماینده جدید با موفقیت اضافه شد.'
    )
    setShowRepForm(false)
  }

  const handleDeleteRep = (repId: string) => {
    onUpdateDb(
      (prev) => ({
        ...prev,
        representatives: prev.representatives.filter((r) => r.id !== repId),
      }),
      'نماینده از فهرست حذف شد.'
    )
  }

  const openNewBmForm = () => {
    setEditingBm(null)
    setBmName('')
    setBmRole('عضو هیئت امنا')
    setBmColor('indigo')
    setShowBmForm(true)
  }

  const openEditBmForm = (bm: BoardMember) => {
    setEditingBm(bm)
    setBmName(bm.fullName)
    setBmRole(bm.roleTitle)
    setBmColor(bm.avatarColor)
    setShowBmForm(true)
  }

  const handleSaveBm = (e: React.FormEvent) => {
    e.preventDefault()
    if (!bmName.trim()) return
    const item: BoardMember = {
      id: editingBm?.id || `bm-${Date.now()}`,
      fullName: bmName.trim(),
      roleTitle: bmRole.trim() || 'عضو هیئت امنا',
      avatarColor: bmColor,
      active: true,
    }
    onUpdateDb(
      (prev) => ({
        ...prev,
        boardMembers: editingBm
          ? prev.boardMembers.map((b) => (b.id === editingBm.id ? item : b))
          : [...prev.boardMembers, item],
      }),
      editingBm ? 'مشخصات عضو هیئت امنا ویرایش شد.' : 'عضو جدید هیئت امنا ثبت شد.'
    )
    setShowBmForm(false)
  }

  const handleDeleteBm = (bmId: string) => {
    onUpdateDb(
      (prev) => ({
        ...prev,
        boardMembers: prev.boardMembers.filter((b) => b.id !== bmId),
      }),
      'عضو هیئت امنا حذف شد.'
    )
  }

  const openEditWgForm = (wg?: WorkingGroup) => {
    if (wg) {
      setEditingWg(wg)
      setWgName(wg.name)
      setWgDesc(wg.description)
      setWgColor(wg.colorKey)
    } else {
      setEditingWg(null)
      setWgName('')
      setWgDesc('')
      setWgColor('cyan')
    }
    setShowWgForm(true)
  }

  const handleSaveWg = (e: React.FormEvent) => {
    e.preventDefault()
    if (!wgName.trim()) return
    const item: WorkingGroup = {
      id: editingWg?.id || `wg-${Date.now()}`,
      name: wgName.trim(),
      shortCode: wgName.trim().slice(0, 12),
      colorKey: wgColor,
      description: wgDesc.trim(),
    }
    onUpdateDb(
      (prev) => ({
        ...prev,
        workingGroups: editingWg
          ? prev.workingGroups.map((w) => (w.id === editingWg.id ? item : w))
          : [...prev.workingGroups, item],
      }),
      editingWg ? 'کارگروه تخصصی ویرایش شد.' : 'کارگروه جدید اضافه شد.'
    )
    setShowWgForm(false)
  }

  return (
    <div className="space-y-5">
      {/* Organization Header Settings Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-bold text-slate-700">
                عنوان سازمان / دبیرخانه (درج در داشبورد و سربرگ PDF)
              </label>
              <input
                type="text"
                value={orgTitle}
                onChange={(e) => setOrgTitle(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-2 text-xs font-bold text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-slate-700">
                زیرعنوان سامانه گزارش‌گیری
              </label>
              <input
                type="text"
                value={orgSub}
                onChange={(e) => setOrgSub(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-2 text-xs text-slate-700 focus:border-emerald-500 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              onUpdateDb(
                (prev) => ({
                  ...prev,
                  organizationTitle: orgTitle.trim() || prev.organizationTitle,
                  secretariatSubtitle: orgSub.trim() || prev.secretariatSubtitle,
                }),
                'عنوان سازمانی به‌روزرسانی شد.'
              )
            }
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-slate-800"
          >
            <Save className="h-3.5 w-3.5" />
            ذخیره عنوان سربرگ
          </button>
        </div>
      </div>

      {/* Sub-navigation Tabs */}
      <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-2xs">
        <button
          type="button"
          onClick={() => setSection('representatives')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-extrabold transition ${
            section === 'representatives'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <UserCheck className="h-4 w-4" />
          <span>اسامی نمایندگان کارگروه‌ها ({toPersianDigits(db.representatives.length)})</span>
        </button>

        <button
          type="button"
          onClick={() => setSection('boardMembers')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-extrabold transition ${
            section === 'boardMembers'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Building2 className="h-4 w-4" />
          <span>اعضای هیئت امنا ({toPersianDigits(db.boardMembers.length)})</span>
        </button>

        <button
          type="button"
          onClick={() => setSection('workingGroups')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-extrabold transition ${
            section === 'workingGroups'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Layers className="h-4 w-4" />
          <span>کارگروه‌های تخصصی ({toPersianDigits(db.workingGroups.length)})</span>
        </button>
      </div>

      {/* SECTION 1: Representatives Management */}
      {section === 'representatives' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-white p-4">
            <div>
              <h3 className="text-sm font-black text-slate-900">
                فهرست نمایندگان کارگروه‌ها و انتساب به اعضای هیئت امنا
              </h3>
              <p className="mt-0.5 text-xs text-slate-500">
                مشخص کنید هر نماینده در کدام کارگروه فعالیت دارد و نماینده کدام یک از اعضای محترم هیئت امناست
              </p>
            </div>
            <button
              type="button"
              onClick={openNewRepForm}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-extrabold text-white hover:bg-emerald-700"
            >
              <Plus className="h-4 w-4" />
              افزودن نماینده جدید
            </button>
          </div>

          {showRepForm && (
            <form
              onSubmit={handleSaveRep}
              className="rounded-2xl border-2 border-emerald-200 bg-emerald-50/40 p-5 shadow-sm"
            >
              <div className="mb-4 flex items-center justify-between">
                <h4 className="text-sm font-extrabold text-slate-900">
                  {editingRep ? 'ویرایش مشخصات نماینده کارگروه' : 'تعریف نماینده جدید در کارگروه'}
                </h4>
                <button
                  type="button"
                  onClick={() => setShowRepForm(false)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-white hover:text-slate-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700">
                    نام و نام خانوادگی نماینده *
                  </label>
                  <input
                    required
                    type="text"
                    value={repName}
                    onChange={(e) => setRepName(e.target.value)}
                    placeholder="مثلاً دکتر کامران رضایی‌فر"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-900 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700">
                    نماینده کدام عضو هیئت امنا هست؟ *
                  </label>
                  <select
                    required
                    value={repBmId}
                    onChange={(e) => setRepBmId(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-800 focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="" disabled>
                      انتخاب عضو هیئت امنا...
                    </option>
                    {db.boardMembers.map((bm) => (
                      <option key={bm.id} value={bm.id}>
                        {bm.fullName} ({bm.roleTitle})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700">
                    تخصص / عنوان کارشناسی (اختیاری)
                  </label>
                  <input
                    type="text"
                    value={repSpecialty}
                    onChange={(e) => setRepSpecialty(e.target.value)}
                    placeholder="مثلاً متخصص اکچوئری / حسابرس ارشد"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="mb-2 block text-xs font-bold text-slate-700">
                  عضویت در کارگروه‌های تخصصی (حداقل یک کارگروه را انتخاب کنید) *
                </label>
                <div className="flex flex-wrap gap-2">
                  {db.workingGroups.map((wg) => {
                    const checked = repWgIds.includes(wg.id)
                    const pal = getPalette(wg.colorKey)
                    return (
                      <button
                        key={wg.id}
                        type="button"
                        onClick={() => toggleRepWg(wg.id)}
                        className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-bold transition ${
                          checked
                            ? `${pal.bgBadge} ring-2 ${pal.ring}`
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {checked && <Check className="h-3.5 w-3.5" />}
                        <span>{wg.name}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowRepForm(false)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={!repName.trim() || !repBmId || repWgIds.length === 0}
                  className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-extrabold text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  ذخیره اطلاعات نماینده
                </button>
              </div>
            </form>
          )}

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[780px] text-right text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                    <th className="px-4 py-3 font-extrabold">نام و نام خانوادگی نماینده</th>
                    <th className="px-4 py-3 font-extrabold">نماینده کدام عضو هیئت امنا</th>
                    <th className="px-4 py-3 font-extrabold">کارگروه‌های تخصصی عضو</th>
                    <th className="px-4 py-3 font-extrabold">تخصص / سمت</th>
                    <th className="px-4 py-3 text-center font-extrabold">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {db.representatives.map((rep) => {
                    const bm = db.boardMembers.find((b) => b.id === rep.boardMemberId)
                    return (
                      <tr key={rep.id} className="hover:bg-slate-50/70">
                        <td className="px-4 py-3.5 font-extrabold text-slate-900">
                          {rep.fullName}
                        </td>
                        <td className="px-4 py-3.5">
                          {bm ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-0.5 font-bold text-indigo-700">
                              <Users className="h-3 w-3" />
                              نماینده {bm.fullName}
                            </span>
                          ) : (
                            <span className="text-rose-500">عضو هیئت امنا نامشخص</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex flex-wrap gap-1.5">
                            {rep.workingGroupIds.map((wgId) => {
                              const wg = db.workingGroups.find((w) => w.id === wgId)
                              if (!wg) return null
                              const pal = getPalette(wg.colorKey)
                              return (
                                <span
                                  key={wg.id}
                                  className={`rounded-lg border px-2 py-0.5 text-[11px] font-bold ${pal.bgBadge}`}
                                >
                                  {wg.name}
                                </span>
                              )
                            })}
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-slate-500">
                          {rep.specialtyTitle || '—'}
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => openEditRepForm(rep)}
                              className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-indigo-50 hover:text-indigo-700"
                              title="ویرایش"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteRep(rep.id)}
                              className="rounded-lg border border-slate-200 p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                              title="حذف"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: Board of Trustees Members Management */}
      {section === 'boardMembers' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-white p-4">
            <div>
              <h3 className="text-sm font-black text-slate-900">مدیریت اعضای محترم هیئت امنا</h3>
              <p className="mt-0.5 text-xs text-slate-500">
                تعریف و ویرایش اسامی و سمت اعضای هیئت امنا جهت انتساب نمایندگان کارگروه‌ها
              </p>
            </div>
            <button
              type="button"
              onClick={openNewBmForm}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-extrabold text-white hover:bg-emerald-700"
            >
              <Plus className="h-4 w-4" />
              افزودن عضو هیئت امنا
            </button>
          </div>

          {showBmForm && (
            <form
              onSubmit={handleSaveBm}
              className="rounded-2xl border-2 border-indigo-200 bg-indigo-50/40 p-5"
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700">
                    نام و نام خانوادگی عضو هیئت امنا *
                  </label>
                  <input
                    required
                    type="text"
                    value={bmName}
                    onChange={(e) => setBmName(e.target.value)}
                    placeholder="مثلاً دکتر سید محمدرضا هاشمی"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-900 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700">
                    سمت در هیئت امنا
                  </label>
                  <input
                    type="text"
                    value={bmRole}
                    onChange={(e) => setBmRole(e.target.value)}
                    placeholder="رئیس هیئت امنا / عضو هیئت امنا"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700">رنگ نشان</label>
                  <div className="flex items-center gap-2 pt-1">
                    {COLOR_CHOICES.map((c) => {
                      const pal = getPalette(c.key)
                      return (
                        <button
                          key={c.key}
                          type="button"
                          onClick={() => setBmColor(c.key)}
                          className={`h-7 w-7 rounded-full ${pal.solidBg} transition ${
                            bmColor === c.key ? 'ring-2 ring-slate-900 ring-offset-2' : 'opacity-70'
                          }`}
                          title={c.label}
                        />
                      )
                    })}
                  </div>
                </div>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowBmForm(false)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-indigo-600 px-5 py-2 text-xs font-extrabold text-white hover:bg-indigo-700"
                >
                  ذخیره عضو هیئت امنا
                </button>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {db.boardMembers.map((bm) => {
              const pal = getPalette(bm.avatarColor)
              const assignedReps = db.representatives.filter((r) => r.boardMemberId === bm.id)
              return (
                <div
                  key={bm.id}
                  className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-xs"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <span
                          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-xs font-black text-white ${pal.solidBg}`}
                        >
                          {getInitials(bm.fullName)}
                        </span>
                        <div>
                          <h4 className="text-sm font-black text-slate-900">{bm.fullName}</h4>
                          <span className="text-xs font-medium text-slate-500">{bm.roleTitle}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEditBmForm(bm)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-indigo-600"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteBm(bm.id)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 border-t border-slate-100 pt-3">
                      <span className="text-[11px] font-bold text-slate-400">
                        نمایندگان معرفی‌شده ایشان ({toPersianDigits(assignedReps.length)} نفر):
                      </span>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {assignedReps.map((r) => (
                          <span
                            key={r.id}
                            className="rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-700"
                          >
                            {r.fullName}
                          </span>
                        ))}
                        {assignedReps.length === 0 && (
                          <span className="text-[11px] text-slate-400">
                            هنوز نماینده‌ای ثبت نشده است
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* SECTION 3: Working Groups Management */}
      {section === 'workingGroups' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-white p-4">
            <div>
              <h3 className="text-sm font-black text-slate-900">
                کارگروه‌های تخصصی هیئت امنا
              </h3>
              <p className="mt-0.5 text-xs text-slate-500">
                چهار کارگروه رسمی «حسابرسی و بودجه»، «اقتصاد و سرمایه‌گذاری»، «بیمه و محاسبات اکچوئری» و «بهداشت و درمان» به صورت پیش‌فرض تنظیم شده‌اند.
              </p>
            </div>
            <button
              type="button"
              onClick={() => openEditWgForm()}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100"
            >
              <Plus className="h-4 w-4" />
              افزودن کارگروه جدید
            </button>
          </div>

          {showWgForm && (
            <form
              onSubmit={handleSaveWg}
              className="rounded-2xl border-2 border-emerald-200 bg-emerald-50/40 p-5"
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700">نام کارگروه *</label>
                  <input
                    required
                    type="text"
                    value={wgName}
                    onChange={(e) => setWgName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-900 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700">شرح وظایف</label>
                  <input
                    type="text"
                    value={wgDesc}
                    onChange={(e) => setWgDesc(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700">تم رنگی</label>
                  <div className="flex items-center gap-2 pt-1">
                    {COLOR_CHOICES.map((c) => (
                      <button
                        key={c.key}
                        type="button"
                        onClick={() => setWgColor(c.key)}
                        className={`h-7 w-7 rounded-full ${getPalette(c.key).solidBg} ${
                          wgColor === c.key ? 'ring-2 ring-slate-900 ring-offset-2' : 'opacity-70'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowWgForm(false)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-extrabold text-white"
                >
                  ذخیره کارگروه
                </button>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {db.workingGroups.map((wg) => {
              const pal = getPalette(wg.colorKey)
              const wgReps = db.representatives.filter((r) => r.workingGroupIds.includes(wg.id))
              return (
                <div
                  key={wg.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className={`h-3.5 w-3.5 rounded-full ${pal.solidBg}`} />
                      <h4 className="text-sm font-black text-slate-900">کارگروه {wg.name}</h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => openEditWgForm(wg)}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-slate-500">{wg.description}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5 border-t border-slate-100 pt-3">
                    {wgReps.map((r) => {
                      const bm = db.boardMembers.find((b) => b.id === r.boardMemberId)
                      return (
                        <span
                          key={r.id}
                          className="rounded-lg bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-700"
                        >
                          {r.fullName}{' '}
                          {bm && <span className="text-slate-400">({bm.fullName})</span>}
                        </span>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
