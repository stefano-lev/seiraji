import * as cheerio from "cheerio";

export async function scrapeOnsen(url: string) {
  const response = await fetch(url);

  const html = await response.text();

  const $ = cheerio.load(html);

  const title =
    $('meta[name="twitter:title"]').attr("content") || "";

  const description =
    $('meta[name="twitter:description"]').attr("content") || "";
	
	const host =
	  $(".single-categories.performer a")
		.text()
		.trim();
	
	const liveperiod =
	  $(".live-period-mb")
		.text()
		.trim();
	
  const tableHtml = $(".scroll-table").html();

  console.log(tableHtml);
  
  const episodes: any[] = [];

	$(".scroll-table tr.wrap-content").each((_, element) => {
	  const row = $(element);

	  const title =
		row.find(".pro-title-content").text().trim();

	  const date =
		row.find("td").eq(1).text().trim();

	  const tags: string[] = [];

	  if (row.find(".tag-free").length) {
		tags.push("FREE");
	  }

	  if (row.find(".tag-premium").length) {
		tags.push("PREMIUM");
	  }

	  if (row.find(".tag-guest").length) {
		tags.push("GUEST");
	  }

	  episodes.push({
		title,
		date,
		tags,
	  });
	});

  return {
    title,
    description,
	host,
	liveperiod,
	episodes,
  };
}