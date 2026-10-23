export const TIME_ZONE = "America/Argentina/Buenos_Aires";
const UTC_OFFSET_MS = -3 * 60 * 60 * 1000;

export function startOfMonth(value: Date) {
  const local = new Date(value.getTime() + UTC_OFFSET_MS);
  return new Date(
    Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), 1) - UTC_OFFSET_MS,
  );
}
