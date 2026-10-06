import type { AttendanceStatus } from '@/components/ui/status-chip';
import type { MessageId } from '@/lib/i18n';

/** Fixed sample day so screenshots are deterministic. */
export const SAMPLE_DAY = new Date(2026, 9, 5);
const at = (h: number, m: number) => new Date(2026, 9, 5, h, m);

export const REQUIRED_MINUTES = 480;

export interface RegisterRow {
  id: string;
  employeeId: string;
  name: { en: string; ar: string };
  initials: { en: string; ar: string };
  team: MessageId;
  checkIn?: Date;
  checkOut?: Date;
  workedMinutes?: number;
  status: AttendanceStatus;
  /** Map position as % of the sample map (geographic, so never mirrored). */
  pos?: { x: number; y: number };
}

export const REGISTER: RegisterRow[] = [
  { id: '1', employeeId: 'ZN-10427', name: { en: 'Faisal Al-Harbi', ar: 'فيصل الحربي' }, initials: { en: 'FH', ar: 'ف' }, team: 'team.riyadhNorth', checkIn: at(9, 4), checkOut: at(17, 12), workedMinutes: 488, status: 'present', pos: { x: 22, y: 34 } },
  { id: '2', employeeId: 'ZN-10388', name: { en: 'Noura Al-Qahtani', ar: 'نورة القحطاني' }, initials: { en: 'NQ', ar: 'ن' }, team: 'team.riyadhNorth', checkIn: at(11, 52), checkOut: at(18, 30), workedMinutes: 398, status: 'present' },
  { id: '3', employeeId: 'ZN-10512', name: { en: 'Abdullah Al-Otaibi', ar: 'عبدالله العتيبي' }, initials: { en: 'AO', ar: 'ع' }, team: 'team.jeddahCentral', checkIn: at(12, 41), status: 'late', pos: { x: 47, y: 58 } },
  { id: '4', employeeId: 'ZN-10295', name: { en: 'Sara Al-Dosari', ar: 'سارة الدوسري' }, initials: { en: 'SD', ar: 'س' }, team: 'team.dammamEast', checkIn: at(9, 58), status: 'suspected_fake', pos: { x: 71, y: 30 } },
  { id: '5', employeeId: 'ZN-10633', name: { en: 'Khalid Al-Shehri', ar: 'خالد الشهري' }, initials: { en: 'KS', ar: 'خ' }, team: 'team.jeddahCentral', status: 'absent' },
  { id: '6', employeeId: 'ZN-10471', name: { en: 'Reem Al-Zahrani', ar: 'ريم الزهراني' }, initials: { en: 'RZ', ar: 'ر' }, team: 'team.riyadhNorth', status: 'on_leave' },
  { id: '7', employeeId: 'ZN-10219', name: { en: 'Omar Al-Ghamdi', ar: 'عمر الغامدي' }, initials: { en: 'OG', ar: 'ع' }, team: 'team.dammamEast', checkIn: at(10, 15), checkOut: at(18, 20), workedMinutes: 485, status: 'present', pos: { x: 84, y: 66 } },
  { id: '8', employeeId: 'ZN-10590', name: { en: 'Lama Al-Mutairi', ar: 'لمى المطيري' }, initials: { en: 'LM', ar: 'ل' }, team: 'team.jeddahCentral', checkIn: at(9, 30), checkOut: at(17, 41), workedMinutes: 491, status: 'confirmed_fake' },
];

export const shortfall = (row: RegisterRow) =>
  row.checkOut && row.workedMinutes !== undefined && row.workedMinutes < REQUIRED_MINUTES ? REQUIRED_MINUTES - row.workedMinutes : 0;
