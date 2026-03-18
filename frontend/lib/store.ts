import { promises as fs } from "node:fs";
import path from "node:path";
import { Sighting } from "./types";

const DATA_FILE = path.join(process.cwd(), "data", "sightings.json");

async function ensureFile() {
  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
    await fs.writeFile(DATA_FILE, "[]", "utf-8");
  }
}

export async function listSightings(): Promise<Sighting[]> {
  await ensureFile();
  const raw = await fs.readFile(DATA_FILE, "utf-8");
  const sightings = JSON.parse(raw) as Sighting[];
  return sightings.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export async function addSighting(sighting: Sighting): Promise<void> {
  const sightings = await listSightings();
  sightings.unshift(sighting);
  await fs.writeFile(DATA_FILE, JSON.stringify(sightings, null, 2), "utf-8");
}
