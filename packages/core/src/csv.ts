import { getFatherId, getMotherId, getSpouseIds, resolveRootId } from "./graph";
import type { FamilyData, Member, Relationship } from "./types";

/**
 * CSV import/export of members (one row per person, relationships as id references).
 * Designed to round-trip through Excel / Google Sheets, including Arabic text.
 */
export const CSV_COLUMNS = [
  "id",
  "name",
  "gender",
  "birthYear",
  "deathYear",
  "isDeceased",
  "fatherId",
  "motherId",
  "spouseIds",
  "nickname",
  "occupation",
  "birthplace",
  "residence",
  "photoUrl",
  "bio",
  "isRoot",
] as const;
type Column = (typeof CSV_COLUMNS)[number];

/** Header aliases so hand-made spreadsheets (incl. Arabic headers) are understood. */
const HEADER_ALIASES: Record<string, Column> = {
  id: "id",
  المعرف: "id",
  name: "name",
  الاسم: "name",
  gender: "gender",
  sex: "gender",
  الجنس: "gender",
  birthyear: "birthYear",
  born: "birthYear",
  "سنة الميلاد": "birthYear",
  الميلاد: "birthYear",
  deathyear: "deathYear",
  died: "deathYear",
  "سنة الوفاة": "deathYear",
  الوفاة: "deathYear",
  isdeceased: "isDeceased",
  deceased: "isDeceased",
  متوفى: "isDeceased",
  fatherid: "fatherId",
  father: "fatherId",
  الأب: "fatherId",
  "معرف الأب": "fatherId",
  motherid: "motherId",
  mother: "motherId",
  الأم: "motherId",
  "معرف الأم": "motherId",
  spouseids: "spouseIds",
  spouses: "spouseIds",
  spouse: "spouseIds",
  الأزواج: "spouseIds",
  الزوج: "spouseIds",
  nickname: "nickname",
  اللقب: "nickname",
  occupation: "occupation",
  المهنة: "occupation",
  birthplace: "birthplace",
  "مكان الميلاد": "birthplace",
  residence: "residence",
  "مكان الإقامة": "residence",
  photourl: "photoUrl",
  photo: "photoUrl",
  الصورة: "photoUrl",
  bio: "bio",
  notes: "bio",
  نبذة: "bio",
  isroot: "isRoot",
  root: "isRoot",
  الجذر: "isRoot",
};

const LIST_SEPARATOR = "|";
const TEXT_COLUMNS = new Set<Column>([
  "name",
  "nickname",
  "occupation",
  "birthplace",
  "residence",
  "bio",
]);

/** Neutralise spreadsheet formula injection (=, +, -, @ at the start of a text cell). */
const guardFormula = (value: string) => (/^[=+\-@\t\r]/.test(value) ? `'${value}` : value);
const unguardFormula = (value: string) => (/^'[=+\-@\t\r]/.test(value) ? value.slice(1) : value);

const escapeCell = (value: string) =>
  /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;

export const toCsv = (data: FamilyData, { bom = true }: { bom?: boolean } = {}): string => {
  const rootId = resolveRootId(data);
  const rows = Object.values(data.members).map((m) => {
    const record: Record<Column, string> = {
      id: m.id,
      name: m.name,
      gender: m.gender,
      birthYear: m.birthYear ? String(m.birthYear) : "",
      deathYear: m.deathYear ? String(m.deathYear) : "",
      isDeceased: m.isDeceased || m.deathYear ? "yes" : "",
      fatherId: getFatherId(data, m.id) ?? "",
      motherId: getMotherId(data, m.id) ?? "",
      spouseIds: getSpouseIds(data, m.id).join(LIST_SEPARATOR),
      nickname: m.nickname ?? "",
      occupation: m.occupation ?? "",
      birthplace: m.birthplace ?? "",
      residence: m.residence ?? "",
      photoUrl: m.photoUrl ?? "",
      bio: m.bio ?? "",
      isRoot: m.id === rootId ? "yes" : "",
    };
    return CSV_COLUMNS.map((c) =>
      escapeCell(TEXT_COLUMNS.has(c) ? guardFormula(record[c]) : record[c]),
    ).join(",");
  });
  return (bom ? "\uFEFF" : "") + [CSV_COLUMNS.join(","), ...rows].join("\r\n") + "\r\n";
};

/** RFC 4180 parser: quoted fields, escaped quotes, embedded newlines, CRLF/LF, BOM. */
export const parseCsvRows = (text: string): string[][] => {
  const source = text.replace(/^\uFEFF/, "");
  // Excel in some locales saves with ";" (or tab); detect the delimiter from the header line.
  const firstLine = source.split(/\r?\n/, 1)[0] ?? "";
  const delimiter = [",", ";", "\t"].reduce((best, d) =>
    firstLine.split(d).length > firstLine.split(best).length ? d : best,
  );
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < source.length; i += 1) {
    const ch = source[i];
    if (quoted) {
      if (ch === '"' && source[i + 1] === '"') {
        cell += '"';
        i += 1;
      } else if (ch === '"') quoted = false;
      else cell += ch;
      continue;
    }
    if (ch === '"' && cell === "") quoted = true;
    else if (ch === delimiter) {
      row.push(cell);
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && source[i + 1] === "\n") i += 1;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else cell += ch;
  }
  if (cell !== "" || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
};

export interface CsvRowIssue {
  /** 1-based spreadsheet row number (header = row 1). */
  row: number;
  /** i18n key under `csv.*` */
  code: "missingName" | "invalidGender" | "invalidYear" | "duplicateId" | "unknownReference";
  value?: string;
}

export class CsvImportError extends Error {
  constructor(public code: "empty" | "missingNameColumn") {
    super(code);
    this.name = "CsvImportError";
  }
}

const parseGender = (value: string): Member["gender"] | null => {
  const v = value.trim().toLowerCase();
  if (["male", "m", "ذكر", "ذ", "1"].includes(v)) return "male";
  if (["female", "f", "أنثى", "انثى", "انثي", "أ", "2"].includes(v)) return "female";
  return null;
};

const parseYear = (value: string): number | null | "invalid" => {
  const v = value.trim().replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
  if (!v) return null;
  if (!/^\d{1,4}$/.test(v)) return "invalid";
  const n = Number(v);
  return n >= 1 && n <= 3000 ? n : "invalid";
};

const truthy = (value: string) =>
  ["yes", "y", "true", "1", "نعم", "x", "✓"].includes(value.trim().toLowerCase());

/**
 * Parse a members CSV into FamilyData (unvalidated: pass the result through
 * `parseFamilyData` for schema validation and sanitising). Bad rows are skipped and reported.
 */
export const fromCsv = (
  text: string,
): { data: FamilyData; issues: CsvRowIssue[]; rows: number } => {
  const table = parseCsvRows(text);
  if (table.length < 2) throw new CsvImportError("empty");
  const header = table[0].map(
    (h) =>
      HEADER_ALIASES[
        h
          .trim()
          .toLowerCase()
          .replace(/[\s_-]+/g, "")
      ] ?? HEADER_ALIASES[h.trim()],
  );
  if (!header.includes("name")) throw new CsvImportError("missingNameColumn");

  const issues: CsvRowIssue[] = [];
  const members: Record<string, Member> = {};
  const links: { row: number; childId: string; parentId: string }[] = [];
  const spouses: { row: number; aId: string; bId: string }[] = [];
  let rootId: string | null = null;
  const now = new Date().toISOString();

  table.slice(1).forEach((cells, index) => {
    const rowNumber = index + 2;
    const get = (column: Column) => {
      const at = header.indexOf(column);
      return at === -1 ? "" : unguardFormula((cells[at] ?? "").trim());
    };
    const name = get("name");
    if (!name) {
      issues.push({ row: rowNumber, code: "missingName" });
      return;
    }
    const gender = parseGender(get("gender"));
    if (!gender) {
      issues.push({ row: rowNumber, code: "invalidGender", value: get("gender") });
      return;
    }
    const id = get("id") || `csv_${rowNumber}`;
    if (members[id]) {
      issues.push({ row: rowNumber, code: "duplicateId", value: id });
      return;
    }
    const birthYear = parseYear(get("birthYear"));
    const deathYear = parseYear(get("deathYear"));
    if (birthYear === "invalid" || deathYear === "invalid")
      issues.push({
        row: rowNumber,
        code: "invalidYear",
        value: birthYear === "invalid" ? get("birthYear") : get("deathYear"),
      });

    const optional = (column: Column) => get(column) || undefined;
    const photo = get("photoUrl");
    members[id] = {
      id,
      name,
      gender,
      ...(typeof birthYear === "number" ? { birthYear } : {}),
      ...(typeof deathYear === "number" ? { deathYear } : {}),
      ...(truthy(get("isDeceased")) || typeof deathYear === "number" ? { isDeceased: true } : {}),
      ...(optional("nickname") ? { nickname: optional("nickname") } : {}),
      ...(optional("occupation") ? { occupation: optional("occupation") } : {}),
      ...(optional("birthplace") ? { birthplace: optional("birthplace") } : {}),
      ...(optional("residence") ? { residence: optional("residence") } : {}),
      ...(optional("bio") ? { bio: optional("bio") } : {}),
      ...(/^https?:\/\//.test(photo) ? { photoUrl: photo } : {}),
      createdAt: now,
      updatedAt: now,
    };
    for (const parentId of [get("fatherId"), get("motherId")])
      if (parentId) links.push({ row: rowNumber, childId: id, parentId });
    for (const spouseId of get("spouseIds")
      .split(/[|،]/)
      .map((s) => s.trim())
      .filter(Boolean))
      spouses.push({ row: rowNumber, aId: id, bId: spouseId });
    if (truthy(get("isRoot")) && !rootId) rootId = id;
  });

  const relationships: Relationship[] = [];
  const seen = new Set<string>();
  for (const { row, childId, parentId } of links) {
    if (!members[parentId]) {
      issues.push({ row, code: "unknownReference", value: parentId });
      continue;
    }
    const key = `parent:${parentId}:${childId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    relationships.push({ id: key, type: "parent", fromId: parentId, toId: childId });
  }
  for (const { row, aId, bId } of spouses) {
    if (!members[bId]) {
      issues.push({ row, code: "unknownReference", value: bId });
      continue;
    }
    const key = `spouse:${[aId, bId].sort().join(":")}`;
    if (seen.has(key) || aId === bId) continue;
    seen.add(key);
    relationships.push({ id: key, type: "spouse", fromId: aId, toId: bId });
  }

  return {
    data: { schemaVersion: 2, revision: 0, rootId, members, relationships, updatedAt: now },
    issues,
    rows: table.length - 1,
  };
};

/** An empty template (header row only) for people building a file in Excel. */
export const csvTemplate = () => `\uFEFF${CSV_COLUMNS.join(",")}\r\n`;
