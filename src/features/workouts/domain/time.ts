export const DEFAULT_REST_MS = 120_000;
export const REST_EXTENSION_MS = 30_000;
export function formatWorkoutClock(milliseconds: number): string {
  const total = Math.max(0, Math.floor(milliseconds / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor(total / 60) % 60;
  const seconds = total % 60;
  return `${hours ? `${hours}:` : ''}${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}
export function getRestState(
  endsAt: number | null,
  durationMs: number,
  now: number,
) {
  const remaining = endsAt === null ? 0 : Math.max(0, endsAt - now);
  return {
    remaining,
    label: formatWorkoutClock(Math.ceil(remaining / 1000) * 1000),
    active: remaining > 0,
    progress: Math.max(0, Math.min(1, remaining / Math.max(1, durationMs))),
  };
}
