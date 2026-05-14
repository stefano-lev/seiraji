import express from "express";
import { scrapeYouTubePlaylist } from "../services/scrapeYoutube";

const router = express.Router();

router.post("/import", async (req, res) => {
  try {
    const url = req.body?.url;

    if (!url) {
      return res.status(400).json({
        error: "URL required",
      });
    }

    const data = await scrapeYouTubePlaylist(url);

    res.json(data);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: "Failed to fetch playlist",
    });
  }
});

export default router;