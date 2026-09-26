import "server-only";
import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySessionToken } from "./session";

export class UnauthorizedError extends Error {
  constructor() {
    super("unauthorized");
  }
}

/** Every server action re-checks the session; the proxy alone is not a security boundary. */
export const requireSession = async () => {
  const store = await cookies();
  const session = await verifySessionToken(store.get(SESSION_COOKIE)?.value);
  if (!session) throw new UnauthorizedError();
  return session;
};

export const getAdminPassword = () => {
  if (process.env.ADMIN_PASSWORD) return process.env.ADMIN_PASSWORD;
  return process.env.NODE_ENV === "production" ? null : "admin";
};
