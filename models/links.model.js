import path from "path";
import { readFile, writeFile } from "fs/promises";

const dataFilePath = path.join(path.dirname(import.meta.dirname), "data", "link.json")

export const saveLinks = async (links) => {
  await writeFile(
    dataFilePath,
    JSON.stringify(links),
    "utf-8"
  );
};

export const loadLinks = async () => {
  try {
    const data = await readFile(
      dataFilePath,
      "utf-8"
    );
    return JSON.parse(data);
  } catch (error) {
    if (error.code === "ENOENT") {
      await writeFile(
        dataFilePath,
        JSON.stringify({}),
        "utf-8"
      );
      return {};
    }
    throw error;
  }
};
