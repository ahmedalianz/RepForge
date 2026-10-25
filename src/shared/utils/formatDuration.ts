import { t } from '../../localization/i18n';
import { formatNumber } from '../../localization/format';
const MINUTE_MS = 60_000;
export function formatDuration(milliseconds: number): string {
  const minutes = Math.floor(milliseconds / MINUTE_MS);
  const hours = Math.floor(minutes / 60);
  return hours
    ? t('common:duration.hoursMinutes', {
        hours: formatNumber(hours),
        minutes: formatNumber(minutes % 60),
      })
    : t('common:duration.minutes', { minutes: formatNumber(minutes) });
}
