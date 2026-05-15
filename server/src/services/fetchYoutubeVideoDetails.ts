const API_KEY =
  process.env.YOUTUBE_API_KEY;

export async function fetchYoutubeVideoDetails(
  videoIds: string[]
) {
  const batches: string[][] = [];

  for (
    let i = 0;
    i < videoIds.length;
    i += 50
  ) {
    batches.push(
      videoIds.slice(i, i + 50)
    );
  }

  const results: any[] = [];

  for (const batch of batches) {
    const ids = batch.join(",");

    console.log(
      `Fetching video details batch (${batch.length} videos)`
    );

    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,snippet&id=${ids}&key=${API_KEY}`
    );

    const json = await res.json();

    results.push(
      ...(json.items ?? [])
    );
  }

  return results;
}