import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { addRelative } from "@family/core";
import {
  ConflictError,
  getActivity,
  getFamilyData,
  getSiteContent,
  listBackups,
  restoreBackup,
  saveFamilyData,
} from "../src/store";

let dir: string;

beforeAll(() => {
  dir = mkdtempSync(join(tmpdir(), "family-data-"));
  process.env.DATA_DIR = dir;
});
afterAll(() => rmSync(dir, { recursive: true, force: true }));

describe("file store", () => {
  it("seeds on first read", async () => {
    const data = await getFamilyData();
    expect(Object.keys(data.members)).toHaveLength(47);
    const site = await getSiteContent();
    expect(site.brief.ar.familyName).toBeTruthy();
  });

  it("saves with optimistic concurrency, backups and activity", async () => {
    const data = await getFamilyData();
    const { data: next } = addRelative(data, "m_001", "child", { name: "جديد", gender: "male" });
    const saved = await saveFamilyData(next, {
      actor: "test",
      action: "member.create",
      expectedRevision: data.revision,
    });
    expect(saved.revision).toBe(data.revision + 1);
    expect(Object.keys((await getFamilyData()).members)).toHaveLength(48);
    await expect(
      saveFamilyData(next, {
        actor: "test",
        action: "member.create",
        expectedRevision: data.revision,
      }),
    ).rejects.toBeInstanceOf(ConflictError);
    expect((await getActivity())[0]?.action).toBe("member.create");

    const [backup] = await listBackups();
    expect(backup?.kind).toBe("family");
    await restoreBackup(backup!.file, "test");
    expect(Object.keys((await getFamilyData()).members)).toHaveLength(47);
  });
});

describe("seeding", () => {
  it("handles concurrent first reads", async () => {
    process.env.DATA_DIR = mkdtempSync(join(tmpdir(), "family-seed-"));
    const results = await Promise.all(Array.from({ length: 8 }, () => getSiteContent()));
    expect(results.every((r) => r.schemaVersion === 1)).toBe(true);
    rmSync(process.env.DATA_DIR, { recursive: true, force: true });
    process.env.DATA_DIR = dir;
  });
});
