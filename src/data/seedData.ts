import type { AppDatabase, BoardMember, MeetingSession, Representative, WorkingGroup } from '../types/domain'
import { calcDurationMinutes } from '../utils/jalali'

export const DEFAULT_WORKING_GROUPS: WorkingGroup[] = [
  {
    id: 'wg-audit-budget',
    name: 'حسابرسی و بودجه',
    shortCode: 'حسابرسی',
    colorKey: 'indigo',
    description: 'بررسی گزارش‌های حسابرس مستقل، نظارت مالی، تفریغ و تدوین بودجه سالانه و عملیاتی',
  },
  {
    id: 'wg-economy-investment',
    name: 'اقتصاد و سرمایه‌گذاری',
    shortCode: 'اقتصاد',
    colorKey: 'emerald',
    description: 'پایش پرتفوی سرمایه‌گذاری، ارزیابی بازدهی هلدینگ‌ها و سیاست‌گذاری اقتصادی دارایی‌ها',
  },
  {
    id: 'wg-insurance-actuarial',
    name: 'بیمه و محاسبات اکچوئری',
    shortCode: 'اکچوئری',
    colorKey: 'amber',
    description: 'ارزش‌گذاری اکچوئری تعهدات بیمه‌ای، پایداری صندوق و تحلیل شاخص‌های بیمه‌گری',
  },
  {
    id: 'wg-health-care',
    name: 'بهداشت و درمان',
    shortCode: 'درمان',
    colorKey: 'rose',
    description: 'سیاست‌گذاری خدمات سلامت، پایش مراکز درمانی ملکی، خرید راهبردی خدمت و اقتصاد درمان',
  },
]

export const SAMPLE_BOARD_MEMBERS: BoardMember[] = [
  {
    id: 'bm-1',
    fullName: 'دکتر سید محمدرضا هاشمی',
    roleTitle: 'رئیس هیئت امنا',
    avatarColor: 'indigo',
    active: true,
  },
  {
    id: 'bm-2',
    fullName: 'دکتر علیرضا فرهمندپور',
    roleTitle: 'نایب‌رئیس هیئت امنا',
    avatarColor: 'emerald',
    active: true,
  },
  {
    id: 'bm-3',
    fullName: 'مهندس مسعود نیک‌نژاد',
    roleTitle: 'عضو هیئت امنا',
    avatarColor: 'amber',
    active: true,
  },
  {
    id: 'bm-4',
    fullName: 'دکتر مریم السادات طباطبایی',
    roleTitle: 'عضو هیئت امنا',
    avatarColor: 'rose',
    active: true,
  },
  {
    id: 'bm-5',
    fullName: 'دکتر حسین محمودیان',
    roleTitle: 'عضو و دبیر هیئت امنا',
    avatarColor: 'cyan',
    active: true,
  },
]

export const SAMPLE_REPRESENTATIVES: Representative[] = [
  // کارگروه حسابرسی و بودجه
  {
    id: 'rep-1',
    fullName: 'دکتر کامران رضایی‌فر',
    specialtyTitle: 'حسابدار رسمی و متخصص بودجه‌ریزی',
    boardMemberId: 'bm-1',
    workingGroupIds: ['wg-audit-budget'],
    active: true,
  },
  {
    id: 'rep-2',
    fullName: 'دکتر نسرین کاظمی',
    specialtyTitle: 'حسابرس ارشد و کنترل داخلی',
    boardMemberId: 'bm-2',
    workingGroupIds: ['wg-audit-budget'],
    active: true,
  },
  {
    id: 'rep-3',
    fullName: 'مهندس بهرام شفیعی',
    specialtyTitle: 'کارشناس ارشد مالی و تلفیق بودجه',
    boardMemberId: 'bm-3',
    workingGroupIds: ['wg-audit-budget', 'wg-economy-investment'],
    active: true,
  },
  {
    id: 'rep-4',
    fullName: 'دکتر امیرحسین مرادی',
    specialtyTitle: 'متخصص گزارشگری مالی و حسابرسی عملکرد',
    boardMemberId: 'bm-5',
    workingGroupIds: ['wg-audit-budget'],
    active: true,
  },

  // کارگروه اقتصاد و سرمایه‌گذاری
  {
    id: 'rep-5',
    fullName: 'دکتر پیمان سعیدی‌نیا',
    specialtyTitle: 'دکترای اقتصاد مالی و بازار سرمایه',
    boardMemberId: 'bm-1',
    workingGroupIds: ['wg-economy-investment'],
    active: true,
  },
  {
    id: 'rep-6',
    fullName: 'دکتر سارا نادری',
    specialtyTitle: 'تحلیلگر ارشد سرمایه‌گذاری و مدیریت دارایی',
    boardMemberId: 'bm-4',
    workingGroupIds: ['wg-economy-investment'],
    active: true,
  },
  {
    id: 'rep-7',
    fullName: 'مهندس کیوان توکلی',
    specialtyTitle: 'متخصص تأمین مالی و ارزشیابی بنگاه‌ها',
    boardMemberId: 'bm-2',
    workingGroupIds: ['wg-economy-investment'],
    active: true,
  },

  // کارگروه بیمه و محاسبات اکچوئری
  {
    id: 'rep-8',
    fullName: 'دکتر شهاب‌الدین معتمدی',
    specialtyTitle: 'اکچوئر رسمی و مدل‌ساز ریسک بیمه‌ای',
    boardMemberId: 'bm-1',
    workingGroupIds: ['wg-insurance-actuarial'],
    active: true,
  },
  {
    id: 'rep-9',
    fullName: 'دکتر الهام جلالی',
    specialtyTitle: 'دکترای آمار بیمه‌ای و محاسبات مستمری',
    boardMemberId: 'bm-2',
    workingGroupIds: ['wg-insurance-actuarial'],
    active: true,
  },
  {
    id: 'rep-10',
    fullName: 'دکتر فرهاد سلیمانی',
    specialtyTitle: 'متخصص پایداری صندوق‌های بازنشستگی',
    boardMemberId: 'bm-3',
    workingGroupIds: ['wg-insurance-actuarial'],
    active: true,
  },
  {
    id: 'rep-11',
    fullName: 'مهندس مهدی کریمی‌راد',
    specialtyTitle: 'تحلیلگر داده‌های بیمه‌ای و جمعیتی',
    boardMemberId: 'bm-5',
    workingGroupIds: ['wg-insurance-actuarial', 'wg-audit-budget'],
    active: true,
  },

  // کارگروه بهداشت و درمان
  {
    id: 'rep-12',
    fullName: 'دکتر سهیلا برومند',
    specialtyTitle: 'متخصص سیاست‌گذاری و اقتصاد سلامت',
    boardMemberId: 'bm-4',
    workingGroupIds: ['wg-health-care'],
    active: true,
  },
  {
    id: 'rep-13',
    fullName: 'دکتر رضا پورمحمدی',
    specialtyTitle: 'پزشک و مدیر خدمات بیمارستانی',
    boardMemberId: 'bm-1',
    workingGroupIds: ['wg-health-care'],
    active: true,
  },
  {
    id: 'rep-14',
    fullName: 'دکتر نیما رحیمیان',
    specialtyTitle: 'متخصص خرید راهبردی خدمات درمانی',
    boardMemberId: 'bm-3',
    workingGroupIds: ['wg-health-care'],
    active: true,
  },
  {
    id: 'rep-15',
    fullName: 'دکتر زهرا موسوی‌پور',
    specialtyTitle: 'متخصص مدیریت دارو و اسناد پزشکی',
    boardMemberId: 'bm-5',
    workingGroupIds: ['wg-health-care'],
    active: true,
  },
]

function buildMeeting(
  id: string,
  sessionNumber: string,
  workingGroupId: string,
  jalaliDate: string,
  startTime: string,
  endTime: string,
  subject: string,
  summary: string,
  attendanceSpecs: Array<{
    repId: string
    status: 'present' | 'partial' | 'absent'
    start?: string
    end?: string
    note?: string
  }>
): MeetingSession {
  const durationMinutes = calcDurationMinutes(startTime, endTime)
  return {
    id,
    sessionNumber,
    workingGroupId,
    jalaliDate,
    startTime,
    endTime,
    durationMinutes,
    subject,
    summary,
    location: 'سالن جلسات دبیرخانه هیئت امنا',
    attendances: attendanceSpecs.map((a) => {
      const s = a.status === 'absent' ? startTime : a.start || startTime
      const e = a.status === 'absent' ? startTime : a.end || endTime
      return {
        representativeId: a.repId,
        status: a.status,
        startTime: s,
        endTime: e,
        durationMinutes: a.status === 'absent' ? 0 : calcDurationMinutes(s, e),
        note: a.note,
      }
    }),
    createdAt: '2026-10-10T08:00:00.000Z',
    updatedAt: '2026-11-15T12:00:00.000Z',
  }
}

export const SAMPLE_MEETINGS: MeetingSession[] = [
  buildMeeting(
    'mtg-101',
    '۱۴۰۵/۰۷-۰۱',
    'wg-audit-budget',
    '1405/07/06',
    '08:30',
    '11:00',
    'بررسی گزارش حسابرس مستقل و صورت‌های مالی تلفیقی شش‌ماهه اول ۱۴۰۵',
    'بندهای شرط گزارش حسابرس مستقل بررسی و تکالیف اصلاحی به معاونت مالی ابلاغ گردید.',
    [
      { repId: 'rep-1', status: 'present' },
      { repId: 'rep-2', status: 'present' },
      { repId: 'rep-3', status: 'partial', start: '09:00', end: '11:00', note: '۳۰ دقیقه تأخیر با اطلاع قبلی' },
      { repId: 'rep-4', status: 'present' },
      { repId: 'rep-11', status: 'present' },
    ]
  ),
  buildMeeting(
    'mtg-102',
    '۱۴۰۵/۰۷-۰۲',
    'wg-economy-investment',
    '1405/07/11',
    '09:00',
    '12:00',
    'ارزیابی بازدهی پرتفوی سرمایه‌گذاری هلدینگ‌های تابعه و پایش ریسک بازار',
    'گزارش عملکرد فصل تابستان هلدینگ‌ها ارائه و شاخص بازده تعدیل‌شده با ریسک تصویب شد.',
    [
      { repId: 'rep-5', status: 'present' },
      { repId: 'rep-6', status: 'present' },
      { repId: 'rep-7', status: 'present' },
      { repId: 'rep-3', status: 'present' },
    ]
  ),
  buildMeeting(
    'mtg-103',
    '۱۴۰۵/۰۷-۰۳',
    'wg-insurance-actuarial',
    '1405/07/15',
    '13:30',
    '16:00',
    'تحلیل گزارش ارزش‌گذاری اکچوئری تعهدات بلندمدت بیمه‌ای و نسبت پشتیبانی',
    'سناریوهای جمعیتی ۱۰ ساله آینده و اثر آن بر جریان نقدی ورودی و خروجی بررسی شد.',
    [
      { repId: 'rep-8', status: 'present' },
      { repId: 'rep-9', status: 'present' },
      { repId: 'rep-10', status: 'absent', note: 'مأموریت اداری استانی' },
      { repId: 'rep-11', status: 'present' },
    ]
  ),
  buildMeeting(
    'mtg-104',
    '۱۴۰۵/۰۷-۰۴',
    'wg-health-care',
    '1405/07/20',
    '08:00',
    '10:30',
    'پایش شاخص‌های بهره‌وری بیمارستان‌های ملکی و مدیریت زمان انتظار بیمه‌شدگان',
    'بسته ارتقای کیفیت خدمات سرپایی و کاهش کسورات اسناد بیمارستانی نهایی گردید.',
    [
      { repId: 'rep-12', status: 'present' },
      { repId: 'rep-13', status: 'present' },
      { repId: 'rep-14', status: 'partial', start: '08:00', end: '10:00', note: 'ترک جلسه ۳۰ دقیقه زودتر جهت کمیسیون پزشکی' },
      { repId: 'rep-15', status: 'present' },
    ]
  ),
  buildMeeting(
    'mtg-105',
    '۱۴۰۵/۰۷-۰۵',
    'wg-audit-budget',
    '1405/07/27',
    '08:30',
    '11:30',
    'بررسی عملکرد بودجه سرمایه‌ای و انحرافات ردیف‌های هزینه‌ای سه‌ماهه دوم',
    'گزارش تفریغ بودجه شش‌ماهه جمع‌بندی و جهت طرح در صحن هیئت امنا آماده شد.',
    [
      { repId: 'rep-1', status: 'present' },
      { repId: 'rep-2', status: 'present' },
      { repId: 'rep-3', status: 'present' },
      { repId: 'rep-4', status: 'absent', note: 'مرخصی استعلاجی' },
      { repId: 'rep-11', status: 'partial', start: '09:15', end: '11:30', note: 'حضور از ساعت ۰۹:۱۵' },
    ]
  ),
  buildMeeting(
    'mtg-106',
    '۱۴۰۵/۰۸-۰۱',
    'wg-economy-investment',
    '1405/08/03',
    '09:30',
    '12:30',
    'بررسی طرح تأمین مالی پروژه‌های پیشران و واگذاری دارایی‌های غیرمولد',
    'چارچوب مزایده املاک مازاد و تبدیل به دارایی‌های مولد با بازدهی بالا تأیید شد.',
    [
      { repId: 'rep-5', status: 'present' },
      { repId: 'rep-6', status: 'partial', start: '10:00', end: '12:30', note: '۳۰ دقیقه تأخیر' },
      { repId: 'rep-7', status: 'present' },
      { repId: 'rep-3', status: 'present' },
    ]
  ),
  buildMeeting(
    'mtg-107',
    '۱۴۰۵/۰۸-۰۲',
    'wg-insurance-actuarial',
    '1405/08/09',
    '14:00',
    '16:45',
    'بازنگری مفروضات نرخ بازده اکچوئری و جدول مرگ‌ومیر بیمه‌شدگان و مستمری‌بگیران',
    'مفروضات فنی جدید جهت محاسبه ذخایر ریاضی پایان سال ۱۴۰۵ مورد توافق قرار گرفت.',
    [
      { repId: 'rep-8', status: 'present' },
      { repId: 'rep-9', status: 'present' },
      { repId: 'rep-10', status: 'present' },
      { repId: 'rep-11', status: 'present' },
    ]
  ),
  buildMeeting(
    'mtg-108',
    '۱۴۰۵/۰۸-۰۳',
    'wg-health-care',
    '1405/08/12',
    '08:30',
    '11:00',
    'بررسی تعرفه‌های خرید راهبردی خدمات تشخیصی و پایش هزینه‌های دارویی پرمصرف',
    'راهنمای تجویز منطقی دارو در سامانه نسخه الکترونیک با هدف کنترل هزینه‌ها تصویب شد.',
    [
      { repId: 'rep-12', status: 'present' },
      { repId: 'rep-13', status: 'absent', note: 'حضور در همایش کشوری سلامت' },
      { repId: 'rep-14', status: 'present' },
      { repId: 'rep-15', status: 'present' },
    ]
  ),
  buildMeeting(
    'mtg-109',
    '۱۴۰۵/۰۸-۰۴',
    'wg-audit-budget',
    '1405/08/17',
    '08:30',
    '11:30',
    'تدوین بخشنامه بودجه‌ریزی سال ۱۴۰۶ و سقف منابع و مصارف پیشنهادی',
    'شاخص‌های کلان بودجه‌ریزی مبتنی بر عملکرد برای سال مالی آتی تصویب گردید.',
    [
      { repId: 'rep-1', status: 'present' },
      { repId: 'rep-2', status: 'partial', start: '08:30', end: '10:45', note: 'خروج در ساعت ۱۰:۴۵' },
      { repId: 'rep-3', status: 'present' },
      { repId: 'rep-4', status: 'present' },
      { repId: 'rep-11', status: 'present' },
    ]
  ),
  buildMeeting(
    'mtg-110',
    '۱۴۰۵/۰۸-۰۵',
    'wg-economy-investment',
    '1405/08/20',
    '10:00',
    '12:30',
    'پایش عملکرد سودآوری شرکت‌های بورسی و سیاست تقسیم سود مجامع پیش‌رو',
    'راهبرد رأی‌دهی نمایندگان در مجامع عمومی عادی سالیانه شرکت‌های تابعه تعیین شد.',
    [
      { repId: 'rep-5', status: 'present' },
      { repId: 'rep-6', status: 'present' },
      { repId: 'rep-7', status: 'absent', note: 'عدم حضور موجه' },
      { repId: 'rep-3', status: 'present' },
    ]
  ),
  buildMeeting(
    'mtg-111',
    '۱۴۰۵/۰۸-۰۶',
    'wg-insurance-actuarial',
    '1405/08/22',
    '13:30',
    '16:00',
    'ارزیابی آثار مالی طرح‌های بیمه‌ای تکمیلی و مقرری بیکاری در نیمه دوم سال',
    'گزارش حساسیت منابع بیمه‌ای نسبت به تغییرات دستمزد و اشتغال بررسی و نهایی شد.',
    [
      { repId: 'rep-8', status: 'present' },
      { repId: 'rep-9', status: 'partial', start: '14:00', end: '16:00', note: '۳۰ دقیقه تأخیر' },
      { repId: 'rep-10', status: 'present' },
      { repId: 'rep-11', status: 'present' },
    ]
  ),
  buildMeeting(
    'mtg-112',
    '۱۴۰۵/۰۸-۰۷',
    'wg-health-care',
    '1405/08/24',
    '08:30',
    '11:15',
    'گزارش ممیزی پرونده‌های بستری، تسویه مطالبات مراکز طرف قرارداد و تجهیزات پزشکی',
    'جدول زمان‌بندی پرداخت مطالبات داروخانه‌ها و مراکز تشخیصی تا پایان آذرماه تصویب شد.',
    [
      { repId: 'rep-12', status: 'present' },
      { repId: 'rep-13', status: 'present' },
      { repId: 'rep-14', status: 'present' },
      { repId: 'rep-15', status: 'present' },
    ]
  ),
]

export function createInitialSeedDatabase(): AppDatabase {
  return {
    version: '1.0.0',
    organizationTitle: 'دبیرخانه هیئت امنا و کارگروه‌های تخصصی',
    secretariatSubtitle: 'سامانه یکپارچه ثبت جلسات، پایش ساعات حضور نمایندگان و گزارش‌گیری مدیریتی',
    lastUpdated: new Date().toISOString(),
    workingGroups: structuredClone(DEFAULT_WORKING_GROUPS),
    boardMembers: structuredClone(SAMPLE_BOARD_MEMBERS),
    representatives: structuredClone(SAMPLE_REPRESENTATIVES),
    meetings: structuredClone(SAMPLE_MEETINGS),
  }
}

export function createBlankDatabase(keepStructure = false, currentDb?: AppDatabase): AppDatabase {
  return {
    version: '1.0.0',
    organizationTitle: currentDb?.organizationTitle || 'دبیرخانه هیئت امنا و کارگروه‌های تخصصی',
    secretariatSubtitle:
      currentDb?.secretariatSubtitle ||
      'سامانه یکپارچه ثبت جلسات، پایش ساعات حضور نمایندگان و گزارش‌گیری مدیریتی',
    lastUpdated: new Date().toISOString(),
    workingGroups: currentDb ? structuredClone(currentDb.workingGroups) : structuredClone(DEFAULT_WORKING_GROUPS),
    boardMembers: keepStructure && currentDb ? structuredClone(currentDb.boardMembers) : [],
    representatives: keepStructure && currentDb ? structuredClone(currentDb.representatives) : [],
    meetings: [],
  }
}
