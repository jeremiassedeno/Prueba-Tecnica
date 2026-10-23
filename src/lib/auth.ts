import { createHash, randomBytes } from "node:crypto";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";

const COOKIE = "granabank_session";
export const tokenHash = (value: string) =>
  createHash("sha256").update(value).digest("hex");
export async function createSession(userId: string) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000);
  await db().session.create({ data: { id: tokenHash(token), userId, expiresAt } });
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}
// cache: el layout y la página privada comparten una sola consulta por request.
export const currentUser = cache(async () => {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const session = await db().session.findUnique({
    where: { id: tokenHash(token) },
    include: { user: { include: { account: true } } },
  });
  if (!session || session.expiresAt < new Date()) return null;
  return session.user;
});
export async function requireUser() {
  const user = await currentUser();
  if (!user?.account) redirect("/login");
  return { ...user, account: user.account };
}
export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) await db().session.deleteMany({ where: { id: tokenHash(token) } });
  jar.delete(COOKIE);
}
export function sameOrigin(request: Request) {
  const expected = process.env.APP_URL
    ? new URL(process.env.APP_URL).origin
    : new URL(request.url).origin;
  return request.headers.get("origin") === expected;
}
