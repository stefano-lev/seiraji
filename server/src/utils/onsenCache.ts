import fs from "fs/promises";
import path from "path";

const CACHE_DIR = path.join(process.cwd(), "cache");

const CACHE_PATH = path.join(
  CACHE_DIR,
  "onsen-programs.json"
);

export async function readCache() {
  try {
    const data = await fs.readFile(
      CACHE_PATH,
      "utf-8"
    );

    return JSON.parse(data);
  } catch {
    return {};
  }
}

export async function writeCache(cache: any) {
  await fs.mkdir(CACHE_DIR, {
    recursive: true,
  });

  await fs.writeFile(
    CACHE_PATH,
    JSON.stringify(cache, null, 2)
  );
}