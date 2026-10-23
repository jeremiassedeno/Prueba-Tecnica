export const TIME_ZONE = "America/Argentina/Buenos_Aires";
// Argentina usa UTC-3 todo el año: no tiene horario de verano.
const UTC_OFFSET_MS = -3 * 60 * 60 * 1000;

// Primer instante del mes en curso según la hora de Argentina.
export function startOfMonth(value: Date) {
  const local = new Date(value.getTime() + UTC_OFFSET_MS);
  return new Date(
    Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), 1) - UTC_OFFSET_MS,
  );
}
