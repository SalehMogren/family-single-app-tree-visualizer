import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  CsvImportError,
  computeStats,
  familyDataSchema,
  fromCsv,
  getLineage,
  formatLineage,
  parseCsvRows,
  parseFamilyData,
  resolveRootId,
  toCsv,
} from "../src";

const seed = familyDataSchema.parse(
  JSON.parse(readFileSync(resolve(__dirname, "../../data/seed/family.json"), "utf8")),
);

describe("csv export/import", () => {
  it("round-trips the seed family", () => {
    const csv = toCsv(seed);
    expect(csv.startsWith("﻿")).toBe(true);
    const { data, issues, rows } = fromCsv(csv);
    expect(issues).toEqual([]);
    expect(rows).toBe(47);
    const { data: clean, dropped } = parseFamilyData(data);
    expect(dropped).toBe(0);
    expect(computeStats(clean)).toEqual(computeStats(seed));
    expect(resolveRootId(clean)).toBe(resolveRootId(seed));
    expect(clean.relationships.length).toBe(seed.relationships.length);
    expect(formatLineage(getLineage(clean, "m_012"), "ar")).toBe(
      formatLineage(getLineage(seed, "m_012"), "ar"),
    );
  });

  it("parses quoting, embedded newlines, semicolons and Arabic headers", () => {
    const text = [
      "المعرف;الاسم;الجنس;سنة الميلاد;الأب;نبذة",
      '1;عبدالله;ذكر;١٩٠٠;;"مؤسس العائلة; ""التاجر""',
      'سطر ثاني"',
      "2;محمد;ذكر;1930;1;",
    ].join("\n");
    const { data, issues } = fromCsv(text);
    expect(issues).toEqual([]);
    expect(data.members["1"].birthYear).toBe(1900);
    expect(data.members["1"].bio).toBe('مؤسس العائلة; "التاجر"\nسطر ثاني');
    expect(data.relationships).toEqual([
      { id: "parent:1:2", type: "parent", fromId: "1", toId: "2" },
    ]);
  });

  it("reports bad rows instead of failing the whole file", () => {
    const text = "id,name,gender,fatherId\n1,A,male,\n2,,male,\n3,B,unknown,\n4,C,f,99\n1,D,m,";
    const { data, issues } = fromCsv(text);
    expect(Object.keys(data.members)).toEqual(["1", "4"]);
    expect(issues.map((i) => [i.row, i.code])).toEqual([
      [3, "missingName"],
      [4, "invalidGender"],
      [6, "duplicateId"],
      [5, "unknownReference"],
    ]);
  });

  it("guards against spreadsheet formula injection and restores on import", () => {
    const evil = {
      ...seed,
      members: { ...seed.members, m_001: { ...seed.members.m_001, bio: '=HYPERLINK("x")' } },
    };
    const csv = toCsv(evil);
    expect(csv).toContain(`"'=HYPERLINK(""x"")"`);
    expect(fromCsv(csv).data.members.m_001.bio).toBe('=HYPERLINK("x")');
  });

  it("rejects files without a name column", () => {
    expect(() => fromCsv("a,b\n1,2")).toThrow(CsvImportError);
    expect(parseCsvRows("a,b\r\n\r\n1,2\r\n")).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
  });
});
