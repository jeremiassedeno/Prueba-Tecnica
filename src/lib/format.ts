import { TIME_ZONE } from "@/lib/dates";

const LOCALE = "es-AR";
const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

export const money = (cents: number) =>
  new Intl.NumberFormat(LOCALE, {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
  }).format(cents / 100);

// "23 oct 2026"
export const date = (value: string | Date) =>
  new Intl.DateTimeFormat(LOCALE, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: TIME_ZONE,
  }).format(new Date(value));

// "Viernes, 23 de octubre de 2026, 12:04"
export const dateTime = (value: string | Date) =>
  capitalize(
    new Intl.DateTimeFormat(LOCALE, {
      dateStyle: "full",
      timeStyle: "short",
      timeZone: TIME_ZONE,
    }).format(new Date(value)),
  );

// "23 de octubre"
export const dayAndMonth = (value: Date) =>
  new Intl.DateTimeFormat(LOCALE, {
    day: "numeric",
    month: "long",
    timeZone: TIME_ZONE,
  }).format(value);

// "Octubre de 2026"
export const monthAndYear = (value: Date) =>
  capitalize(
    new Intl.DateTimeFormat(LOCALE, {
      month: "long",
      year: "numeric",
      timeZone: TIME_ZONE,
    }).format(value),
  );
