/**
 * An event date more than a year ahead is allowed, but the form asks first, because a mistyped year (2028 for 2026)
 * puts an event in the wrong list for years. The dashboard and the mobile app ask the same question the same way.
 */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY = /^(\d{4})-(\d{2})-(\d{2})/;

/** "14 Oct 2028" from a "YYYY-MM-DD" day, read as a civil date. */
export function formatLongDay(ymd: string): string {
  const m = DAY.exec(ymd);
  return m ? `${Number(m[3])} ${MONTHS[Number(m[2]) - 1]} ${m[1]}` : ymd;
}

/** True when the day is after the same calendar day one year from today. A date that cannot be read is never far. */
export function isFarFuture(ymd: string | null | undefined, today: Date = new Date()): boolean {
  const m = DAY.exec(ymd ?? '');
  if (!m) return false;
  const limit = new Date(today.getFullYear() + 1, today.getMonth(), today.getDate());
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])).getTime() > limit.getTime();
}

export const farYearMessage = (ymd: string): string => `This event is on ${formatLongDay(ymd)}. Is the year right?`;

/** True to carry on: the date is near, or the person said the year is right. OK keeps it, Cancel goes back to the form. */
export function confirmYear(ymd: string | null | undefined, today: Date = new Date()): boolean {
  if (!ymd || !isFarFuture(ymd, today)) return true;
  return window.confirm(farYearMessage(ymd));
}
