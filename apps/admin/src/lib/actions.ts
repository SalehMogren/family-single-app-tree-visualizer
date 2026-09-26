"use server";

import { revalidatePath } from "next/cache";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  familyDataSchema,
  ImportError,
  parseFamilyData,
  siteContentSchema,
  type FamilyData,
  type SiteContent,
} from "@family/core";
import { ConflictError, restoreBackup, saveFamilyData, saveSiteContent } from "@family/data";
import { isLocale, LOCALE_COOKIE } from "@family/i18n";
import { getAdminPassword, requireSession, UnauthorizedError } from "./auth";
import { createSessionToken, safeEqual, SESSION_COOKIE, SESSION_TTL_SECONDS } from "./session";

export type ActionResult<T = undefined> =
  | ({ ok: true } & (T extends undefined ? object : { value: T }))
  | { ok: false; code: string; currentRevision?: number };

const fail = (error: unknown): { ok: false; code: string; currentRevision?: number } => {
  if (error instanceof UnauthorizedError) return { ok: false, code: "unauthorized" };
  if (error instanceof ConflictError)
    return { ok: false, code: "revisionConflict", currentRevision: error.currentRevision };
  if (error instanceof ImportError) return { ok: false, code: "invalidFile" };
  console.error(error);
  return { ok: false, code: "unknown" };
};

// ---- auth ----------------------------------------------------------------

const attempts = new Map<string, { count: number; until: number }>();
const MAX_ATTEMPTS = 8;
const LOCKOUT_MS = 15 * 60 * 1000;

export const loginAction = async (_: unknown, form: FormData): Promise<{ error?: string }> => {
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const record = attempts.get(ip);
  if (record && record.count >= MAX_ATTEMPTS && record.until > Date.now())
    return { error: "rateLimited" };

  const expected = getAdminPassword();
  const password = String(form.get("password") ?? "");
  if (!expected || !safeEqual(password, expected)) {
    const count = (record && record.until > Date.now() ? record.count : 0) + 1;
    attempts.set(ip, { count, until: Date.now() + LOCKOUT_MS });
    await new Promise((r) => setTimeout(r, 400));
    return { error: expected ? "invalid" : "notConfigured" };
  }
  attempts.delete(ip);
  const store = await cookies();
  store.set(SESSION_COOKIE, await createSessionToken("admin"), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
  const next = String(form.get("next") ?? "/");
  redirect(next.startsWith("/") && !next.startsWith("//") ? next : "/");
};

export const logoutAction = async () => {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/login");
};

export const setLocaleAction = async (locale: "ar" | "en") => {
  if (!isLocale(locale)) return;
  (await cookies()).set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
};

// ---- data ----------------------------------------------------------------

export const saveFamilyAction = async (
  data: FamilyData,
  meta: { expectedRevision: number; action: string; summary?: string },
): Promise<ActionResult<FamilyData>> => {
  try {
    const session = await requireSession();
    const parsed = familyDataSchema.parse(data);
    const saved = await saveFamilyData(parsed, { ...meta, actor: session.actor });
    revalidatePath("/", "layout");
    return { ok: true, value: saved };
  } catch (error) {
    return fail(error);
  }
};

export const importFamilyAction = async (
  raw: unknown,
): Promise<ActionResult<{ data: FamilyData; dropped: number; migrated: boolean }>> => {
  try {
    const session = await requireSession();
    const { data, dropped, migrated } = parseFamilyData(raw);
    const saved = await saveFamilyData(data, {
      actor: session.actor,
      action: "data.import",
      summary: `${Object.keys(data.members).length} members`,
    });
    revalidatePath("/", "layout");
    return { ok: true, value: { data: saved, dropped, migrated } };
  } catch (error) {
    return fail(error);
  }
};

export const saveSiteAction = async (
  content: SiteContent,
  meta: { action: string; summary?: string },
): Promise<ActionResult<SiteContent>> => {
  try {
    const session = await requireSession();
    const saved = await saveSiteContent(siteContentSchema.parse(content), {
      ...meta,
      actor: session.actor,
    });
    revalidatePath("/", "layout");
    return { ok: true, value: saved };
  } catch (error) {
    return fail(error);
  }
};

export const restoreBackupAction = async (file: string): Promise<ActionResult> => {
  try {
    const session = await requireSession();
    await restoreBackup(file, session.actor);
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (error) {
    return fail(error);
  }
};
