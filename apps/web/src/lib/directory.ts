import {
  formatLineage,
  getGenerations,
  getLineage,
  isLiving,
  resolveRootId,
  type FamilyData,
  type Locale,
} from "@family/core";

export interface DirectoryRow {
  id: string;
  name: string;
  lineage: string;
  gender: "male" | "female";
  birthYear: number | null;
  deathYear: number | null;
  living: boolean;
  generation: number | null;
  photoUrl: string | null;
  occupation: string | null;
}

export const buildDirectory = (data: FamilyData, locale: Locale): DirectoryRow[] => {
  const generations = getGenerations(data, resolveRootId(data));
  return Object.values(data.members).map((m) => ({
    id: m.id,
    name: m.name,
    lineage: formatLineage(getLineage(data, m.id), locale, 3),
    gender: m.gender,
    birthYear: m.birthYear ?? null,
    deathYear: m.deathYear ?? null,
    living: isLiving(m),
    generation: generations.get(m.id) ?? null,
    photoUrl: m.photoUrl || null,
    occupation: m.occupation ?? null,
  }));
};
