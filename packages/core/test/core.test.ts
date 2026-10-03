import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  addRelative,
  analyzeHealth,
  collapseBeyondDepth,
  computeStats,
  emptyFamilyData,
  familyDataSchema,
  formatLineage,
  getLineage,
  getSiblingIds,
  layoutFamilyTree,
  linkParent,
  linkSpouses,
  normalizeText,
  parseFamilyData,
  pathToRoot,
  removeMember,
  resolveRootId,
  searchMembers,
  toGedcom,
  validateParentLink,
  type FamilyData,
} from "../src";

const seedDir = resolve(__dirname, "../../data/seed");
const seed = familyDataSchema.parse(
  JSON.parse(readFileSync(resolve(seedDir, "family.json"), "utf8")),
);

const small = (): FamilyData => ({
  ...emptyFamilyData(),
  rootId: "g",
  members: { g: { id: "g", name: "Grandpa", gender: "male", birthYear: 1900 } },
});

describe("seed data", () => {
  it("is valid and fully connected", () => {
    const stats = computeStats(seed);
    expect(stats.total).toBe(47);
    expect(stats.disconnected).toBe(0);
    expect(stats.generations).toBe(5);
    expect(resolveRootId(seed)).toBe("m_001");
  });

  it("has no errors in the health report", () => {
    expect(analyzeHealth(seed).filter((i) => i.level === "error")).toEqual([]);
  });
});

describe("relationships", () => {
  it("adds a child to a couple and derives siblings", () => {
    let data = small();
    ({ data } = addRelative(data, "g", "spouse", {
      name: "Grandma",
      gender: "female",
      birthYear: 1905,
    }));
    const { data: d2, member: kid1 } = addRelative(data, "g", "child", {
      name: "Kid1",
      gender: "male",
      birthYear: 1930,
    });
    const { data: d3, member: kid2 } = addRelative(d2, kid1.id, "sibling", {
      name: "Kid2",
      gender: "female",
      birthYear: 1932,
    });
    // Child of a person with exactly one spouse gets both parents automatically.
    expect(d3.relationships.filter((r) => r.type === "parent" && r.toId === kid1.id)).toHaveLength(
      2,
    );
    expect(getSiblingIds(d3, kid1.id)).toEqual([kid2.id]);
  });

  it("rejects impossible parent links", () => {
    let data = small();
    const { data: d2, member: kid } = addRelative(data, "g", "child", {
      name: "K",
      gender: "male",
      birthYear: 1930,
    });
    data = d2;
    expect(validateParentLink(data, kid.id, "g").issues.map((i) => i.code)).toContain("circular");
    expect(validateParentLink(data, "g", kid.id).issues.map((i) => i.code)).toContain(
      "alreadyParent",
    );
    const { data: d3, member: other } = addRelative(data, "g", "spouse", {
      name: "W",
      gender: "female",
      birthYear: 1950,
    });
    expect(validateParentLink(d3, other.id, kid.id).issues.map((i) => i.code)).toContain(
      "parentYoungerThanChild",
    );
    expect(() => linkParent(d3, kid.id, "g")).toThrow("circular");
    expect(() => linkSpouses(d3, "g", kid.id)).toThrow("spouseIsLineal");
  });

  it("removes a member with cascade", () => {
    const withCascade = removeMember(seed, "m_003", { cascade: true });
    expect(withCascade.members.m_003).toBeUndefined();
    expect(Object.keys(withCascade.members).length).toBeLessThan(
      Object.keys(seed.members).length - 5,
    );
    const plain = removeMember(seed, "m_003");
    expect(Object.keys(plain.members)).toHaveLength(46);
    expect(plain.relationships.some((r) => r.fromId === "m_003" || r.toId === "m_003")).toBe(false);
  });
});

describe("lineage & search", () => {
  it("formats Arabic lineage names", () => {
    const chain = getLineage(seed, "m_012"); // عبدالله بن محمد بن عبدالله
    expect(formatLineage(chain, "ar", 2)).toBe("عبدالله بن محمد بن عبدالله");
  });

  it("normalises Arabic spelling variants", () => {
    expect(normalizeText("إبْراهيم")).toBe(normalizeText("ابراهيم"));
    expect(searchMembers(seed, "ابراهيم")[0]?.member.name).toBe("إبراهيم");
    expect(searchMembers(seed, "محمد بن عبدالله").length).toBeGreaterThan(0);
  });
});

describe("layout", () => {
  it("lays out every connected member without overlapping cards", () => {
    const layout = layoutFamilyTree(seed);
    const blood = layout.nodes.filter((n) => n.role === "blood");
    expect(blood).toHaveLength(computeStats(seed).bloodLine);
    const byRow = new Map<number, number[]>();
    for (const n of layout.nodes) byRow.set(n.y, [...(byRow.get(n.y) ?? []), n.x]);
    for (const xs of byRow.values()) {
      xs.sort((a, b) => a - b);
      for (let i = 1; i < xs.length; i += 1)
        expect(xs[i] - xs[i - 1]).toBeGreaterThanOrEqual(layout.cardWidth);
    }
    expect(layout.generations).toBe(5);
  });

  it("supports collapsing and bottom-up direction", () => {
    const collapsed = collapseBeyondDepth(seed, 2);
    const layout = layoutFamilyTree(seed, { collapsed, direction: "bottom-up" });
    expect(layout.generations).toBe(2);
    expect(layout.nodes.every((n) => n.y <= 0)).toBe(true);
    expect(pathToRoot(seed, "m_040")).toContain("m_001");
  });
});

describe("import", () => {
  it("migrates and sanitises the legacy v1 format", () => {
    const legacy = JSON.parse(readFileSync(resolve(seedDir, "legacy-family-data.json"), "utf8"));
    const { data, migrated } = parseFamilyData(legacy);
    expect(migrated).toBe(true);
    expect(familyDataSchema.safeParse(data).success).toBe(true);
    expect(analyzeHealth(data).filter((i) => i.code === "tooManyParents")).toEqual([]);
    expect(data.rootId).toBeTruthy();
  });

  it("round-trips the current format and exports GEDCOM", () => {
    const { data, dropped } = parseFamilyData(JSON.parse(JSON.stringify(seed)));
    expect(dropped).toBe(0);
    const ged = toGedcom(data);
    expect(ged).toContain("0 HEAD");
    expect(ged.match(/ INDI/g)).toHaveLength(47);
  });
});
