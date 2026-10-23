import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { createSession, sameOrigin, tokenHash } from "@/lib/auth";
import { loginSchema } from "@/lib/validation";

export async function POST(request: Request) {
  if (!sameOrigin(request))
    return NextResponse.json({ error: "Origen no permitido." }, { status: 403 });
  try {
    const parsed = loginSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success)
      return NextResponse.json(
        { error: "Revisá tu email y contraseña." },
        { status: 400 },
      );
    const { email, password } = parsed.data;
    const key = tokenHash(email);
    const now = new Date();
    await db().loginAttempt.deleteMany({
      where: { key, windowStart: { lt: new Date(Date.now() - 15 * 60 * 1000) } },
    });
    const attempt = await db().loginAttempt.upsert({
      where: { key },
      create: { key, windowStart: now },
      update: { count: { increment: 1 } },
    });
    if (attempt.count > 10)
      return NextResponse.json(
        { error: "Demasiados intentos. Volvé a intentar en 15 minutos." },
        { status: 429 },
      );
    const user = await db().user.findUnique({ where: { email } });
    const valid = await bcrypt.compare(
      password,
      user?.passwordHash ??
        "$2b$12$R9h/cIPz0gi.URNNX3kh2OPST9/PgBkqquzi.Ss7KIUgO2t0jWMUW",
    );
    if (!user || !valid)
      return NextResponse.json(
        { error: "Email o contraseña incorrectos." },
        { status: 401 },
      );
    await createSession(user.id);
    await db().loginAttempt.deleteMany({ where: { key } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      {
        error:
          "No pudimos iniciar sesión. Comprobá que la base de datos esté configurada.",
      },
      { status: 503 },
    );
  }
}
