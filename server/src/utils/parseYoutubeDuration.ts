export function parseYoutubeDuration(
  iso: string
) {
  const matches = iso.match(
    /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/
  );

  if (!matches) {
    return 0;
  }

  const hours = parseInt(
    matches[1] || "0"
  );

  const minutes = parseInt(
    matches[2] || "0"
  );

  const seconds = parseInt(
    matches[3] || "0"
  );

  return (
    hours * 3600 +
    minutes * 60 +
    seconds
  );
}