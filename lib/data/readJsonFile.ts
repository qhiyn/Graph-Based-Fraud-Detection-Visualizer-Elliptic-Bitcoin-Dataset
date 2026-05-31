import { promises as fs } from "fs";
import path from "path";

// Server-only helper. Reads committed dashboard JSON from public/data.
// Never touches /ml or raw CSV. The deployed app needs no Python.
const DATA_DIR = path.join(process.cwd(), "public", "data");

export class DataError extends Error {
  code: string;
  constructor(message: string, code: string) {
    super(message);
    this.code = code;
  }
}

export async function readJsonFile<T>(fileName: string): Promise<T> {
  const filePath = path.join(DATA_DIR, fileName);
  let raw: string;
  try {
    raw = await fs.readFile(filePath, "utf8");
  } catch {
    throw new DataError(`Data file not found: ${fileName}`, "DATA_FILE_MISSING");
  }
  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new DataError(`Data file is not valid JSON: ${fileName}`, "DATA_FILE_INVALID");
  }
}
