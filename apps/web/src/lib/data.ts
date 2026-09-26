import "server-only";
import { cache } from "react";
import { toPublicFamilyData } from "@family/core";
import { getFamilyData, getSiteContent } from "@family/data";

/** Family data with the site's privacy rules applied (server-side). */
export const getPublicFamily = cache(async () => {
  const [data, site] = await Promise.all([getFamilyData(), getSiteContent()]);
  return toPublicFamilyData(data, site.settings.privacy);
});

export const getSite = cache(getSiteContent);
