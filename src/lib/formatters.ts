import { format, isValid, parseISO } from "date-fns";

export function formatCurrency(value: number) {
  return `৳${new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(value)}`;
}

export function formatCompactNumber(value: number) {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatDate(date: string) {
  if (!date) {
    return "N/A";
  }

  const parsed = parseISO(date);
  return isValid(parsed) ? format(parsed, "dd MMM yyyy") : "N/A";
}

export function formatDateTime(date: string) {
  if (!date) {
    return "N/A";
  }

  const parsed = parseISO(date);
  return isValid(parsed) ? format(parsed, "dd MMM yyyy, hh:mm a") : "N/A";
}

export function titleCase(input: string) {
  return input
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}
