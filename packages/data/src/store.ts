import { existsSync } from "node:fs";
import {
  mkdir,
  readFile,
  readdir,
  rename,
  rm,
  stat,
  writeFile,
  appendFile,
} from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { dirname, join, resolve } from "node:path";
import seedFamily from "../seed/family.json";
import seedSite from "../seed/site.json";
import {
  parseFamilyData,
  siteContentSchema,
  type FamilyData,
  type SiteContent,
} from "@family/core";

const SEEDS: Record<string, unknown> = { "family.json": seedFamily, "site.json": seedSite };
const MAX_BACKUPS = 30;

/** DATA_DIR, or `<workspace root>/data` found by walking up from cwd. */
export const resolveDataDir = () => {
  if (process.env.DATA_DIR) return resolve(/*turbopackIgnore: true*/ process.env.DATA_DIR);
  let dir = process.cwd();
  for (let i = 0; i < 6; i += 1) {
    if (existsSync(join(/*turbopackIgnore: true*/ dir, "pnpm-workspace.yaml")))
      return join(/*turbopackIgnore: true*/ dir, "data");
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return join(/*turbopackIgnore: true*/ process.cwd(), "data");
};

export class ConflictError extends Error {
  constructor(public currentRevision: number) {
    super("revisionConflict");
    this.name = "ConflictError";
  }
}

export interface ActivityEntry {
  at: string;
  actor: string;
  action: string;
  summary?: string;
  revision?: number;
}

interface Cached<T> {
  mtimeMs: number;
  value: T;
}

const cache = new Map<string, Cached<unknown>>();
let writeQueue: Promise<unknown> = Promise.resolve();

/** Serialise writes inside this process so revision checks are atomic. */
const withLock = <T>(fn: () => Promise<T>): Promise<T> => {
  const run = writeQueue.then(fn, fn);
  writeQueue = run.catch(() => undefined);
  return run;
};

const atomicWrite = async (file: string, contents: string) => {
  await mkdir(dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.${randomUUID()}.tmp`;
  await writeFile(tmp, contents, "utf8");
  await rename(tmp, file);
};

const seeding = new Map<string, Promise<void>>();

/** Concurrent first reads share one seeding write. */
const seedOnce = (file: string, name: string) => {
  let pending = seeding.get(file);
  if (!pending) {
    pending = (async () => {
      if (!existsSync(file)) await atomicWrite(file, JSON.stringify(SEEDS[name], null, 2));
    })().finally(() => seeding.delete(file));
    seeding.set(file, pending);
  }
  return pending;
};

const readJson = async <T>(name: string, parse: (raw: unknown) => T): Promise<T> => {
  const file = join(/*turbopackIgnore: true*/ resolveDataDir(), name);
  if (!existsSync(file)) await seedOnce(file, name);
  const { mtimeMs } = await stat(file);
  const hit = cache.get(file) as Cached<T> | undefined;
  if (hit && hit.mtimeMs === mtimeMs) return hit.value;
  const value = parse(JSON.parse(await readFile(file, "utf8")));
  cache.set(file, { mtimeMs, value });
  return value;
};

const backup = async (name: string) => {
  const dir = resolveDataDir();
  const file = join(/*turbopackIgnore: true*/ dir, name);
  if (!existsSync(file)) return;
  const backups = join(/*turbopackIgnore: true*/ dir, "backups");
  await mkdir(backups, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  await writeFile(
    join(/*turbopackIgnore: true*/ backups, `${name.replace(".json", "")}-${stamp}.json`),
    await readFile(file),
  );
  const prefix = name.replace(".json", "-");
  const existing = (await readdir(backups)).filter((f) => f.startsWith(prefix)).sort();
  for (const old of existing.slice(0, Math.max(0, existing.length - MAX_BACKUPS)))
    await rm(join(/*turbopackIgnore: true*/ backups, old), { force: true });
};

export const getFamilyData = () => readJson("family.json", (raw) => parseFamilyData(raw).data);

export const getSiteContent = () => readJson("site.json", (raw) => siteContentSchema.parse(raw));

export const logActivity = async (entry: Omit<ActivityEntry, "at">) => {
  const line = JSON.stringify({ at: new Date().toISOString(), ...entry }) + "\n";
  await mkdir(resolveDataDir(), { recursive: true });
  await appendFile(
    join(/*turbopackIgnore: true*/ resolveDataDir(), "activity.jsonl"),
    line,
    "utf8",
  );
};

export const getActivity = async (limit = 50): Promise<ActivityEntry[]> => {
  const file = join(/*turbopackIgnore: true*/ resolveDataDir(), "activity.jsonl");
  if (!existsSync(file)) return [];
  const lines = (await readFile(file, "utf8")).trim().split("\n").filter(Boolean);
  return lines
    .slice(-limit)
    .reverse()
    .flatMap((l) => {
      try {
        return [JSON.parse(l) as ActivityEntry];
      } catch {
        return [];
      }
    });
};

interface SaveMeta {
  actor: string;
  action: string;
  summary?: string;
  /** Reject the save if someone else saved in the meantime. */
  expectedRevision?: number;
}

export const saveFamilyData = (next: FamilyData, meta: SaveMeta) =>
  withLock(async () => {
    const current = await getFamilyData();
    if (meta.expectedRevision !== undefined && meta.expectedRevision !== current.revision)
      throw new ConflictError(current.revision);
    const { data } = parseFamilyData(next);
    const saved: FamilyData = {
      ...data,
      revision: current.revision + 1,
      updatedAt: new Date().toISOString(),
    };
    await backup("family.json");
    await atomicWrite(
      join(/*turbopackIgnore: true*/ resolveDataDir(), "family.json"),
      JSON.stringify(saved, null, 2),
    );
    await logActivity({
      actor: meta.actor,
      action: meta.action,
      summary: meta.summary,
      revision: saved.revision,
    });
    return saved;
  });

export const saveSiteContent = (next: SiteContent, meta: Omit<SaveMeta, "expectedRevision">) =>
  withLock(async () => {
    const saved = siteContentSchema.parse({ ...next, updatedAt: new Date().toISOString() });
    await backup("site.json");
    await atomicWrite(
      join(/*turbopackIgnore: true*/ resolveDataDir(), "site.json"),
      JSON.stringify(saved, null, 2),
    );
    await logActivity({ actor: meta.actor, action: meta.action, summary: meta.summary });
    return saved;
  });

export interface BackupInfo {
  file: string;
  kind: "family" | "site";
  createdAt: string;
  size: number;
}

export const listBackups = async (): Promise<BackupInfo[]> => {
  const dir = join(/*turbopackIgnore: true*/ resolveDataDir(), "backups");
  if (!existsSync(dir)) return [];
  const files = (await readdir(dir))
    .filter((f) => f.endsWith(".json"))
    .sort()
    .reverse();
  return Promise.all(
    files.map(async (file) => {
      const info = await stat(join(/*turbopackIgnore: true*/ dir, file));
      return {
        file,
        kind: file.startsWith("site-") ? ("site" as const) : ("family" as const),
        createdAt: info.mtime.toISOString(),
        size: info.size,
      };
    }),
  );
};

export const restoreBackup = async (file: string, actor: string) => {
  if (!/^(family|site)-[\w-]+\.json$/.test(file)) throw new Error("invalidBackup");
  const raw = JSON.parse(
    await readFile(join(/*turbopackIgnore: true*/ resolveDataDir(), "backups", file), "utf8"),
  );
  if (file.startsWith("site-"))
    return saveSiteContent(siteContentSchema.parse(raw), {
      actor,
      action: "backup.restore",
      summary: file,
    });
  return saveFamilyData(parseFamilyData(raw).data, {
    actor,
    action: "backup.restore",
    summary: file,
  });
};
