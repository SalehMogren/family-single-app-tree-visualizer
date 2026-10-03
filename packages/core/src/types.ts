import { z } from "zod";

export const genderSchema = z.enum(["male", "female"]);
export type Gender = z.infer<typeof genderSchema>;

const year = z.number().int().min(1, "invalidYear").max(3000, "invalidYear").nullable().optional();

const optionalText = (max: number) => z.string().trim().max(max).optional();

export const memberSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1, "nameRequired").max(120),
  gender: genderSchema,
  birthYear: year,
  deathYear: year,
  isDeceased: z.boolean().optional(),
  nickname: optionalText(120),
  occupation: optionalText(160),
  birthplace: optionalText(160),
  residence: optionalText(160),
  bio: optionalText(5000),
  photoUrl: z.union([z.url(), z.literal("")]).optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});
export type Member = z.infer<typeof memberSchema>;

/** Fields an editor can submit for a member (id + timestamps are managed by the system). */
export const memberInputSchema = memberSchema
  .omit({ id: true, createdAt: true, updatedAt: true })
  .refine((m) => !m.birthYear || !m.deathYear || m.deathYear >= m.birthYear, {
    message: "deathBeforeBirth",
    path: ["deathYear"],
  });
export type MemberInput = z.infer<typeof memberInputSchema>;

export const relationshipTypeSchema = z.enum(["parent", "spouse"]);
export type RelationshipType = z.infer<typeof relationshipTypeSchema>;

export const relationshipSchema = z.object({
  id: z.string().min(1),
  type: relationshipTypeSchema,
  /** parent: the parent. spouse: either partner. */
  fromId: z.string().min(1),
  /** parent: the child. spouse: either partner. */
  toId: z.string().min(1),
  metadata: z
    .object({
      marriageYear: year,
      divorceYear: year,
      kind: z.enum(["biological", "adopted", "step"]).optional(),
    })
    .optional(),
});
export type Relationship = z.infer<typeof relationshipSchema>;

export const familyDataSchema = z.object({
  schemaVersion: z.literal(2),
  /** Monotonic revision used for optimistic concurrency when saving. */
  revision: z.number().int().nonnegative(),
  rootId: z.string().nullable(),
  members: z.record(z.string(), memberSchema),
  relationships: z.array(relationshipSchema),
  updatedAt: z.string(),
});
export type FamilyData = z.infer<typeof familyDataSchema>;

export type Locale = "ar" | "en";
export const localizedTextSchema = z.object({ ar: z.string(), en: z.string() });
export type LocalizedText = z.infer<typeof localizedTextSchema>;

export const timelineEventTypeSchema = z.enum([
  "family",
  "birth",
  "marriage",
  "death",
  "migration",
  "business",
  "education",
  "reunion",
  "other",
]);
export type TimelineEventType = z.infer<typeof timelineEventTypeSchema>;

export const timelineEventSchema = z.object({
  id: z.string().min(1),
  /** YYYY, YYYY-MM or YYYY-MM-DD */
  date: z.string().regex(/^\d{1,4}(-\d{2}){0,2}$/, "invalidDate"),
  type: timelineEventTypeSchema,
  title: localizedTextSchema,
  description: localizedTextSchema,
  memberIds: z.array(z.string()).default([]),
});
export type TimelineEvent = z.infer<typeof timelineEventSchema>;

export const familyBriefSchema = z.object({
  familyName: z.string(),
  tagline: z.string(),
  origin: z.string(),
  established: z.string(),
  description: z.string(),
  notableMembers: z.string(),
  geography: z.object({ mainRegion: z.string(), description: z.string() }),
  achievements: z.array(z.string()),
});
export type FamilyBrief = z.infer<typeof familyBriefSchema>;

export const treeDirectionSchema = z.enum(["top-down", "bottom-up"]);
export type TreeDirection = z.infer<typeof treeDirectionSchema>;

export const siteSettingsSchema = z.object({
  defaultLocale: z.enum(["ar", "en"]),
  features: z.object({
    brief: z.boolean(),
    timeline: z.boolean(),
    directory: z.boolean(),
    stats: z.boolean(),
    export: z.boolean(),
  }),
  tree: z.object({
    direction: treeDirectionSchema,
    showSpouses: z.boolean(),
    showYears: z.boolean(),
    showPhotos: z.boolean(),
    /** Generations expanded on first load; deeper branches start collapsed. 0 = everything. */
    initialDepth: z.number().int().min(0).max(50),
  }),
  privacy: z.object({
    /** Hide birth years and details of living members on the public site. */
    hideLivingDetails: z.boolean(),
    /** Only show blood-line members (hide in-laws) publicly. */
    hideSpouses: z.boolean(),
  }),
  contact: z.object({
    location: z.string(),
    email: z.string(),
    phone: z.string(),
  }),
});
export type SiteSettings = z.infer<typeof siteSettingsSchema>;

export const siteContentSchema = z.object({
  schemaVersion: z.literal(1),
  settings: siteSettingsSchema,
  brief: z.object({ ar: familyBriefSchema, en: familyBriefSchema }),
  timeline: z.array(timelineEventSchema),
  updatedAt: z.string(),
});
export type SiteContent = z.infer<typeof siteContentSchema>;

/** Relation of a *new or existing* person to a target person. */
export type RelationKind = "parent" | "child" | "spouse" | "sibling";

export interface Issue {
  level: "error" | "warning";
  /** i18n key under `issues.*` */
  code: string;
  params?: Record<string, string | number>;
}

export interface ValidationResult {
  ok: boolean;
  issues: Issue[];
}
