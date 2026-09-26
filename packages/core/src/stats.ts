import { getChildIds, getConnectedIds, getGenerations, isLiving, resolveRootId } from "./graph";
import type { FamilyData } from "./types";

export interface FamilyStats {
  total: number;
  living: number;
  deceased: number;
  male: number;
  female: number;
  generations: number;
  bloodLine: number;
  inLaws: number;
  disconnected: number;
  averageChildren: number;
  earliestBirthYear: number | null;
  latestBirthYear: number | null;
  topNames: { name: string; count: number }[];
  perGeneration: { generation: number; count: number }[];
}

export const computeStats = (data: FamilyData): FamilyStats => {
  const members = Object.values(data.members);
  const rootId = resolveRootId(data);
  const generations = getGenerations(data, rootId);
  const connected = getConnectedIds(data, rootId);
  const years = members.map((m) => m.birthYear).filter((y): y is number => !!y);
  const parents = members.filter((m) => getChildIds(data, m.id).length > 0);
  const nameCounts = new Map<string, number>();
  for (const m of members) nameCounts.set(m.name, (nameCounts.get(m.name) ?? 0) + 1);
  const perGen = new Map<number, number>();
  for (const g of generations.values()) perGen.set(g, (perGen.get(g) ?? 0) + 1);

  return {
    total: members.length,
    living: members.filter(isLiving).length,
    deceased: members.filter((m) => !isLiving(m)).length,
    male: members.filter((m) => m.gender === "male").length,
    female: members.filter((m) => m.gender === "female").length,
    generations: perGen.size,
    bloodLine: generations.size,
    inLaws: connected.size - generations.size,
    disconnected: members.length - connected.size,
    averageChildren: parents.length
      ? Math.round(
          (parents.reduce((sum, p) => sum + getChildIds(data, p.id).length, 0) / parents.length) *
            10,
        ) / 10
      : 0,
    earliestBirthYear: years.length ? Math.min(...years) : null,
    latestBirthYear: years.length ? Math.max(...years) : null,
    topNames: [...nameCounts.entries()]
      .filter(([, count]) => count > 1)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, count]) => ({ name, count })),
    perGeneration: [...perGen.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([generation, count]) => ({ generation, count })),
  };
};
