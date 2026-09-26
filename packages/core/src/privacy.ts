import { getGenerations, isLiving, resolveRootId } from "./graph";
import type { FamilyData, Member, SiteSettings } from "./types";

/**
 * Apply public privacy settings on the server so hidden data never reaches the browser.
 */
export const toPublicFamilyData = (
  data: FamilyData,
  privacy: SiteSettings["privacy"],
): FamilyData => {
  let members = data.members;
  let relationships = data.relationships;

  if (privacy.hideSpouses) {
    const blood = getGenerations(data, resolveRootId(data));
    members = Object.fromEntries(Object.entries(members).filter(([id]) => blood.has(id)));
    relationships = relationships.filter((r) => members[r.fromId] && members[r.toId]);
  }

  if (privacy.hideLivingDetails) {
    members = Object.fromEntries(
      Object.entries(members).map(([id, m]): [string, Member] => [
        id,
        isLiving(m) ? { id: m.id, name: m.name, gender: m.gender, nickname: m.nickname } : m,
      ]),
    );
  }

  const strip = (m: Member): Member => {
    const { createdAt: _c, updatedAt: _u, ...rest } = m;
    return rest;
  };
  return {
    ...data,
    rootId: resolveRootId(data),
    members: Object.fromEntries(Object.entries(members).map(([id, m]) => [id, strip(m)])),
    relationships,
  };
};
