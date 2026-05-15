import express from "express";
import "dotenv/config";
import cors from "cors";
import onsenRoutes from "./routes/onsen";
import youtubeRoutes from "./routes/youtube";
import audeeRoutes from "./routes/audee";
import libraryRoutes
  from "./routes/library";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/onsen", onsenRoutes);

app.use("/api/youtube", youtubeRoutes);

app.use("/api/audee", audeeRoutes);

app.use(
  "/api/library",
  libraryRoutes
);

const PORT = 3001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});