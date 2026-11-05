/**
 * Formatting helpers. Demo data is anchored to a fixed "today" so screens and
 * screenshots are stable; switch to the real clock when the API is connected.
 */
export const DEMO_TODAY = '2026-11-05';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Indian digit grouping: 1,05,211 */
export function groupIN(n: number): string {
  const negative = n < 0;
  const [int, dec] = Math.abs(n).toFixed(2).split('.');
  const last3 = int.slice(-3);
  const rest = int.slice(0, -3);
  const grouped = rest ? `${rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',')},${last3}` : last3;
  return `${negative ? '-' : ''}${grouped}${dec === '00' ? '' : `.${dec}`}`;
}

export const inr = (n: number) => `₹${groupIN(n)}`;

export function inrShort(n: number): string {
  if (n >= 1e7) return `₹${(n / 1e7).toFixed(2).replace(/\.?0+$/, '')} Cr`;
  if (n >= 1e5) return `₹${(n / 1e5).toFixed(2).replace(/\.?0+$/, '')} L`;
  if (n >= 1e3) return `₹${(n / 1e3).toFixed(1).replace(/\.0$/, '')}K`;
  return inr(n);
}

const parse = (iso: string) => {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return { y, m, d };
};

export function fmtDate(iso?: string, withYear = false): string {
  if (!iso) return 'Not scheduled';
  const { y, m, d } = parse(iso);
  return `${d} ${MONTHS[m - 1]}${withYear ? ` ${y}` : ''}`;
}

export function fmtDateTime(iso: string): string {
  const time = iso.length > 10 ? iso.slice(11, 16) : '';
  if (!time) return fmtDate(iso);
  const [h, min] = time.split(':').map(Number);
  const hh = ((h + 11) % 12) + 1;
  return `${fmtDate(iso)} · ${hh}:${String(min).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
}

export function fmtTime(iso: string): string {
  const [h, min] = iso.slice(11, 16).split(':').map(Number);
  const hh = ((h + 11) % 12) + 1;
  return `${hh}:${String(min).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
}

/** Whole days from DEMO_TODAY to iso (negative = past). */
export function daysFromToday(iso: string): number {
  const a = parse(DEMO_TODAY);
  const b = parse(iso);
  return Math.round((Date.UTC(b.y, b.m - 1, b.d) - Date.UTC(a.y, a.m - 1, a.d)) / 86_400_000);
}

export function dueLabel(iso?: string, done = false): { text: string; tone: 'muted' | 'gold' | 'danger' | 'success' } {
  if (done) return { text: 'Completed', tone: 'success' };
  if (!iso) return { text: 'Not scheduled', tone: 'muted' };
  const days = daysFromToday(iso);
  if (days < 0) return { text: `${-days} day${days === -1 ? '' : 's'} overdue`, tone: 'danger' };
  if (days === 0) return { text: 'Due today', tone: 'gold' };
  if (days === 1) return { text: 'Due tomorrow', tone: 'gold' };
  if (days <= 7) return { text: `Due in ${days} days`, tone: 'muted' };
  return { text: `Due ${fmtDate(iso)}`, tone: 'muted' };
}

export function relativeTime(iso: string): string {
  const days = -daysFromToday(iso);
  if (days <= 0) return iso.length > 10 ? fmtTime(iso) : 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return fmtDate(iso);
}

export function fileSize(bytes: number): string {
  if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(1)} MB`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${bytes} B`;
}

export const initials = (name: string) =>
  name
    .replace(/^(Dr\.|Mr\.|Ms\.)\s*/i, '')
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');

export const pad2 = (n: number) => String(n).padStart(2, '0');

export function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export function nowIso(): string {
  const d = new Date();
  return `${DEMO_TODAY}T${pad2(d.getHours())}:${pad2(d.getMinutes())}:00`;
}
