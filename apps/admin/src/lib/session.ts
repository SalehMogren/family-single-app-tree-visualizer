/**
 * Stateless admin session: an HMAC-signed, expiring cookie. Uses Web Crypto so it runs
 * both in the proxy and in server actions.
 */
export const SESSION_COOKIE = "family_admin_session";
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

const encoder = new TextEncoder();

const getSecret = () => {
  const secret = process.env.ADMIN_SECRET;
  if (secret && secret.length >= 16) return secret;
  if (process.env.NODE_ENV === "production")
    throw new Error("ADMIN_SECRET must be set (>= 16 chars) in production");
  return "dev-only-insecure-secret-change-me";
};

const toHex = (buffer: ArrayBuffer) =>
  [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, "0")).join("");

const sign = async (payload: string) => {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return toHex(await crypto.subtle.sign("HMAC", key, encoder.encode(payload)));
};

/** Constant-time string comparison. */
export const safeEqual = (a: string, b: string) => {
  const ab = encoder.encode(a);
  const bb = encoder.encode(b);
  let diff = ab.length ^ bb.length;
  for (let i = 0; i < Math.max(ab.length, bb.length); i += 1) diff |= (ab[i] ?? 0) ^ (bb[i] ?? 0);
  return diff === 0;
};

export const createSessionToken = async (actor = "admin") => {
  const payload = `${actor}.${Date.now() + SESSION_TTL_SECONDS * 1000}`;
  return `${payload}.${await sign(payload)}`;
};

export const verifySessionToken = async (token: string | undefined) => {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [actor, expires, signature] = parts;
  if (!safeEqual(signature, await sign(`${actor}.${expires}`))) return null;
  if (Number(expires) < Date.now()) return null;
  return { actor };
};
