import { formatLineage, getLineage } from "./graph";
import type { FamilyData, Member } from "./types";

/** Normalise Arabic/Latin text for forgiving search (diacritics, alef/yaa/taa-marbuta variants). */
export const normalizeText = (value: string) =>
  value
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[ً-ٰٟـ]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

export interface SearchHit {
  member: Member;
  lineage: string;
  score: number;
}

export const searchMembers = (data: FamilyData, query: string, limit = 20): SearchHit[] => {
  const q = normalizeText(query);
  if (!q) return [];
  const hits: SearchHit[] = [];
  for (const member of Object.values(data.members)) {
    const name = normalizeText(member.name);
    const lineage = formatLineage(getLineage(data, member.id), "ar", 3);
    const lineageNorm = normalizeText(lineage);
    const extra = normalizeText(
      [member.nickname, member.occupation, member.birthplace, member.residence]
        .filter(Boolean)
        .join(" "),
    );
    let score = 0;
    if (name === q) score = 100;
    else if (name.startsWith(q)) score = 80;
    else if (lineageNorm.startsWith(q)) score = 70;
    else if (name.includes(q)) score = 60;
    else if (lineageNorm.includes(q)) score = 50;
    else if (extra.includes(q)) score = 30;
    if (score) hits.push({ member, lineage, score });
  }
  return hits
    .sort((a, b) => b.score - a.score || a.lineage.localeCompare(b.lineage, "ar"))
    .slice(0, limit);
};

/** First meaningful letter of a name, for avatar fallbacks ("عبدالله" → "ع", "Ahmad" → "A"). */
export const initials = (name: string) => name.trim().slice(0, 1).toUpperCase();
