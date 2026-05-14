export function normalizeAudeeDate(dateString: string) {
  const isoString =
    dateString.replace(" ", "T") + "+09:00";

  return {
    iso: isoString,
    unix: Math.floor(
      new Date(isoString).getTime() / 1000
    ),
  };
}