import express from "express";
import cors from "cors";
import onsenRoutes from "./routes/onsen";
import youtubeRoutes from "./routes/youtube";
import audeeRoutes from "./routes/audee";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/onsen", onsenRoutes);

app.use("/api/youtube", youtubeRoutes);

app.use("/api/audee", audeeRoutes);

const PORT = 3001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});