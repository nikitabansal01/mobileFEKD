/** Returns an ISO local date without relying on device timezone or locale shape. */
export function localDateAt(date: Date, timezone: string): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const value = (type: string) =>
    parts.find((part) => part.type === type)?.value;
  const year = value("year");
  const month = value("month");
  const day = value("day");
  if (!year || !month || !day)
    throw new Error("Unable to resolve user local date.");
  return `${year}-${month}-${day}`;
}

/** A review can only be submitted after the plan's local calendar day closes. */
export const isClosedPlanDate = (
  localDate: string,
  timezone: string,
  now = new Date(),
) => localDate < localDateAt(now, timezone);
