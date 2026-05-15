import fs from "fs/promises";
import path from "path";

const CACHE_DIR = path.join(
  process.cwd(),
  "cache"
);

export async function readCache(
  filename: string
) {
  const cachePath = path.join(
    CACHE_DIR,
    filename
  );

  try {
    const data = await fs.readFile(
      cachePath,
      "utf-8"
    );

    return JSON.parse(data);
  } catch {
    return {};
  }
}

export async function writeCache(
  filename: string,
  cache: any
) {
  await fs.mkdir(CACHE_DIR, {
    recursive: true,
  });

  const cachePath = path.join(
    CACHE_DIR,
    filename
  );

  await fs.writeFile(
    cachePath,
    JSON.stringify(cache, null, 2)
  );
}