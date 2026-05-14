import express from "express";

import { scrapeOnsen } from "../services/scrapeOnsen";

import {
  readCache,
  writeCache,
} from "../utils/onsenCache";

const router = express.Router();

router.post("/import", async (req, res) => {
  try {
    const url = req.body?.url;

    if (!url) {
      return res.status(400).json({
        error: "URL required",
      });
    }

    const slug =
      url.split("/program/")[1];

    if (!slug) {
      return res.status(400).json({
        error: "Invalid Onsen URL",
      });
    }

    const cache = await readCache();

    if (cache[slug]) {
      console.log(
        `Returning cached data for ${slug}`
      );

      return res.json(cache[slug]);
    }

    console.log(
      `Scraping fresh data for ${slug}`
    );

    const data = await scrapeOnsen(url);

    cache[slug] = data;

    await writeCache(cache);

    res.json(data);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Failed to scrape page",
    });
  }
});

export default router;