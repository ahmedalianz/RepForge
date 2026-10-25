export const DAYS_PER_WEEK = 7;
export function localDayStart(timestamp: number): Date {
  const date = new Date(timestamp);
  date.setHours(0, 0, 0, 0);
  return date;
}
export function shiftDays(date: Date, days: number): Date {
  const shifted = new Date(date);
  shifted.setDate(shifted.getDate() + days);
  return shifted;
}
export function localDayKey(timestamp: number): string {
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
export function getWeekDays(
  now: number,
): { start: number; end: number; label: string }[] {
  const today = localDayStart(now);
  const monday = shiftDays(today, -((today.getDay() + 6) % DAYS_PER_WEEK));
  return Array.from({ length: DAYS_PER_WEEK }, (_, index) => {
    const day = shiftDays(monday, index);
    return {
      start: day.getTime(),
      end: shiftDays(day, 1).getTime(),
      label: day.toLocaleDateString('en', { weekday: 'long' }),
    };
  });
}
