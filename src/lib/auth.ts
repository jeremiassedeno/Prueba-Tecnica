import { createHash, randomBytes } from "node:crypto";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";

const COOKIE = "granabank_session";
// La sesión vence tras 15 minutos sin actividad y, como máximo, 8 horas después del login.
const IDLE_TIMEOUT_MS = 15 * 60 * 1000;
const MAX_SESSION_MS = 8 * 60 * 60 * 1000;
// Con actividad continua, el vencimiento se renueva como mucho una vez por minuto.
const RENEW_STEP_MS = 60 * 1000;

export const tokenHash = (value: string) =>
  createHash("sha256").update(value).digest("hex");
export async function createSession(userId: string) {
  const token = randomBytes(32).toString("hex");
  const now = Date.now();
  // Aprovecha el login para borrar las sesiones vencidas del usuario.
  await db().session.deleteMany({ where: { userId, expiresAt: { lt: new Date(now) } } });
  await db().session.create({
    data: { id: tokenHash(token), userId, expiresAt: new Date(now + IDLE_TIMEOUT_MS) },
  });
  // Sin expires: es una cookie de sesión y el navegador la borra al cerrarse.
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
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
  const now = Date.now();
  if (!session || session.expiresAt.getTime() <= now) return null;
  // El nuevo vencimiento nunca supera el máximo de 8 horas desde el login.
  const expiresAt = Math.min(
    now + IDLE_TIMEOUT_MS,
    session.createdAt.getTime() + MAX_SESSION_MS,
  );
  if (expiresAt - session.expiresAt.getTime() >= RENEW_STEP_MS)
    await db().session.update({
      where: { id: session.id },
      data: { expiresAt: new Date(expiresAt) },
    });
  return session.user;
});
export async function requireUser() {
  const user = await currentUser();
  if (!user?.account) {
    // Si llegó una cookie pero no hay sesión válida, venció: el login lo avisa.
    const expired = (await cookies()).has(COOKIE);
    redirect(expired ? "/login?sesion=vencida" : "/login");
  }
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
