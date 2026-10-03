import { getParentIds, getSpouseIds } from "./graph";
import type { FamilyData } from "./types";

/** Export as GEDCOM 5.5.1 so the data can be opened in any genealogy software. */
export const toGedcom = (data: FamilyData, sourceName = "FamilyTree"): string => {
  const lines: string[] = [
    "0 HEAD",
    `1 SOUR ${sourceName}`,
    "1 GEDC",
    "2 VERS 5.5.1",
    "2 FORM LINEAGE-LINKED",
    "1 CHAR UTF-8",
  ];
  const ids = Object.keys(data.members);
  const indi = new Map(ids.map((id, i) => [id, `@I${i + 1}@`]));

  // A family per couple, plus one per single parent with children outside a couple.
  const families = new Map<string, { husb?: string; wife?: string; children: string[] }>();
  const familyKey = (a?: string, b?: string) => [a ?? "", b ?? ""].sort().join("+");
  const ensure = (a?: string, b?: string) => {
    const key = familyKey(a, b);
    if (!families.has(key)) {
      const members = [a, b].filter(Boolean) as string[];
      const husb = members.find((m) => data.members[m]?.gender === "male");
      const wife = members.find((m) => m !== husb);
      families.set(key, { husb, wife, children: [] });
    }
    return families.get(key)!;
  };
  for (const id of ids) for (const s of getSpouseIds(data, id)) ensure(id, s);
  for (const id of ids) {
    const [p1, p2] = getParentIds(data, id);
    if (p1) ensure(p1, p2).children.push(id);
  }
  const famIds = new Map([...families.keys()].map((k, i) => [k, `@F${i + 1}@`]));

  for (const id of ids) {
    const m = data.members[id];
    lines.push(
      `0 ${indi.get(id)} INDI`,
      `1 NAME ${m.name}`,
      `1 SEX ${m.gender === "male" ? "M" : "F"}`,
    );
    if (m.birthYear || m.birthplace) {
      lines.push("1 BIRT");
      if (m.birthYear) lines.push(`2 DATE ${m.birthYear}`);
      if (m.birthplace) lines.push(`2 PLAC ${m.birthplace}`);
    }
    if (m.deathYear || m.isDeceased) {
      lines.push("1 DEAT" + (m.deathYear ? "" : " Y"));
      if (m.deathYear) lines.push(`2 DATE ${m.deathYear}`);
    }
    if (m.occupation) lines.push(`1 OCCU ${m.occupation}`);
    if (m.bio) lines.push(`1 NOTE ${m.bio.replace(/\r?\n/g, " ")}`);
    for (const [key, fam] of families) {
      if (fam.husb === id || fam.wife === id) lines.push(`1 FAMS ${famIds.get(key)}`);
      if (fam.children.includes(id)) lines.push(`1 FAMC ${famIds.get(key)}`);
    }
  }
  for (const [key, fam] of families) {
    lines.push(`0 ${famIds.get(key)} FAM`);
    if (fam.husb) lines.push(`1 HUSB ${indi.get(fam.husb)}`);
    if (fam.wife) lines.push(`1 WIFE ${indi.get(fam.wife)}`);
    for (const c of fam.children) lines.push(`1 CHIL ${indi.get(c)}`);
  }
  lines.push("0 TRLR");
  return lines.join("\n");
};
