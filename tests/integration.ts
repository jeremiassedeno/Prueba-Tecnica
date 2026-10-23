import "dotenv/config";
import assert from "node:assert/strict";
import { randomUUID, createHash } from "node:crypto";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

// Ejecutar con la app local iniciada en APP_URL: npm run test:integration.
// Crea cuentas exclusivas para esta ejecución y las elimina al terminar.
const origin = new URL(process.env.APP_URL ?? "http://localhost:3000").origin;
const databaseUrl = process.env.DATABASE_URL ?? "";
assert.match(
  databaseUrl,
  /@(localhost|127\.0\.0\.1):/,
  "Estas pruebas solo se ejecutan contra PostgreSQL local.",
);
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
});
async function main() {
  const suffix = randomUUID();
  const password = randomUUID();
  const hash = await bcrypt.hash(password, 4);
  const users: string[] = [];
  const accounts: string[] = [];
  const emails: string[] = [];
  const post = (path: string, body: object, cookie = "", source = origin) =>
    fetch(origin + path, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: source, Cookie: cookie },
      body: JSON.stringify(body),
    });
  try {
    for (const label of ["sender", "receiver"]) {
      const email = `${label}-${suffix}@test.invalid`;
      const user = await prisma.user.create({
        data: {
          name: `Test ${label}`,
          email,
          passwordHash: hash,
          account: {
            create: {
              alias: `${label}-${suffix}`,
              number: `${label}-${suffix}`,
              balanceCents: label === "sender" ? 10000 : 0,
            },
          },
        },
        include: { account: true },
      });
      users.push(user.id);
      accounts.push(user.account!.id);
      emails.push(email);
    }
    const checkPrivateRoutes = async (cookie = "") => {
      for (const path of ["/inicio", "/movimientos"]) {
        const response = await fetch(origin + path, {
          redirect: "manual",
          headers: { Cookie: cookie },
        });
        assert.equal(response.status, 307);
        assert.equal(response.headers.get("location"), "/login");
      }
    };
    await checkPrivateRoutes();
    await checkPrivateRoutes("granabank_session=invalid-token");
    const expiredToken = randomUUID();
    await prisma.session.create({
      data: {
        id: createHash("sha256").update(expiredToken).digest("hex"),
        userId: users[0],
        expiresAt: new Date(Date.now() - 60000),
      },
    });
    await checkPrivateRoutes(`granabank_session=${expiredToken}`);
    assert.equal(
      (await post("/api/transfers", {}, `granabank_session=${expiredToken}`)).status,
      401,
    );
    assert.equal((await post("/api/transfers", {})).status, 401);
    assert.equal(
      (await post("/api/auth/login", { email: emails[0], password: "incorrect" })).status,
      401,
    );
    assert.equal(
      (
        await post(
          "/api/auth/login",
          { email: emails[0], password },
          "",
          "https://evil.invalid",
        )
      ).status,
      403,
    );
    const login = await post("/api/auth/login", { email: emails[0], password });
    assert.equal(login.status, 200);
    const cookieHeader = login.headers.get("set-cookie")!;
    assert.match(cookieHeader, /HttpOnly/i);
    assert.match(cookieHeader, /SameSite=lax/i);
    const cookie = cookieHeader.split(";")[0];
    for (const path of ["/inicio", "/movimientos"])
      assert.equal(
        (await fetch(origin + path, { redirect: "manual", headers: { Cookie: cookie } }))
          .status,
        200,
      );
    const requestId = randomUUID();
    const transfer = {
      recipient: `receiver-${suffix}`,
      amount: "25.50",
      description: "Integration check",
      requestId,
    };
    const sent = await post("/api/transfers", transfer, cookie);
    assert.equal(sent.status, 200);
    assert.equal((await sent.json()).amount, 2550);
    assert.equal((await post("/api/transfers", transfer, cookie)).status, 409);
    assert.equal(
      (await prisma.account.findUniqueOrThrow({ where: { id: accounts[0] } }))
        .balanceCents,
      7450n,
    );
    assert.equal(
      (await prisma.account.findUniqueOrThrow({ where: { id: accounts[1] } }))
        .balanceCents,
      2550n,
    );
    assert.equal(await prisma.movement.count({ where: { reference: requestId } }), 2);
    const history = await (
      await fetch(origin + "/movimientos", { headers: { Cookie: cookie } })
    ).text();
    assert.ok(history.includes("Integration check"));
    const detail = (id: string) =>
      fetch(origin + "/movimientos/" + id, { headers: { Cookie: cookie } });
    const [own, foreign] = await Promise.all(
      accounts.map((accountId) =>
        prisma.movement.findFirstOrThrow({ where: { reference: requestId, accountId } }),
      ),
    );
    const ownDetail = await detail(own.id);
    assert.equal(ownDetail.status, 200);
    assert.ok((await ownDetail.text()).includes(requestId));
    // El movimiento del destinatario no debe ser visible para quien envió el dinero.
    // Con loading.tsx la respuesta ya empezó a enviarse, así que el status queda en 200
    // y Next muestra la página de no encontrado.
    for (const id of [foreign.id, "no-existe"]) {
      const html = await (await detail(id)).text();
      assert.ok(html.includes("No encontramos este movimiento"), id);
      assert.ok(!html.includes(requestId), id);
    }
    assert.equal(
      (
        await post(
          "/api/transfers",
          { ...transfer, requestId: randomUUID(), amount: "1000" },
          cookie,
        )
      ).status,
      400,
    );
    assert.equal(
      (
        await post(
          "/api/transfers",
          { ...transfer, requestId: randomUUID(), recipient: `sender-${suffix}` },
          cookie,
        )
      ).status,
      400,
    );
    // Dos débitos simultáneos de $60: solo uno puede usar el saldo de $74,50.
    const concurrent = await Promise.all(
      [1, 2].map(() =>
        post(
          "/api/transfers",
          { ...transfer, requestId: randomUUID(), amount: "60" },
          cookie,
        ),
      ),
    );
    assert.deepEqual(concurrent.map((r) => r.status).sort(), [200, 400]);
    assert.equal(
      (await prisma.account.findUniqueOrThrow({ where: { id: accounts[0] } }))
        .balanceCents,
      1450n,
    );
    const all = await prisma.account.findMany({ where: { id: { in: accounts } } });
    assert.equal(
      all.reduce((sum, account) => sum + account.balanceCents, 0n),
      10000n,
    );
    assert.equal(
      await prisma.movement.count({ where: { accountId: { in: accounts } } }),
      4,
    );
    // Con INTEGER este saldo (más de 2^31 centavos, unos $21,4 millones) desbordaba la columna.
    await prisma.account.update({
      where: { id: accounts[1] },
      data: { balanceCents: 2_147_483_000n },
    });
    assert.equal(
      (
        await post(
          "/api/transfers",
          { ...transfer, requestId: randomUUID(), amount: "10" },
          cookie,
        )
      ).status,
      200,
    );
    assert.equal(
      (await prisma.account.findUniqueOrThrow({ where: { id: accounts[1] } }))
        .balanceCents,
      2_147_484_000n,
    );
    assert.equal((await post("/api/auth/logout", {}, cookie)).status, 200);
    await checkPrivateRoutes(cookie);
    assert.equal((await post("/api/transfers", transfer, cookie)).status, 401);
    for (let i = 0; i < 10; i++)
      assert.equal(
        (await post("/api/auth/login", { email: emails[0], password: "wrong" })).status,
        401,
      );
    assert.equal(
      (await post("/api/auth/login", { email: emails[0], password })).status,
      429,
    );
    console.log(
      "OK: rutas privadas, login, cookies, origen, transferencia, idempotencia, historial, detalle, saldo insuficiente, montos grandes, concurrencia, conservación de saldo, logout y límite de intentos.",
    );
  } finally {
    await prisma.movement.deleteMany({ where: { accountId: { in: accounts } } });
    await prisma.transfer.deleteMany({ where: { senderId: { in: accounts } } });
    await prisma.account.deleteMany({ where: { id: { in: accounts } } });
    await prisma.user.deleteMany({ where: { id: { in: users } } });
    await prisma.loginAttempt.deleteMany({
      where: {
        key: { in: emails.map((e) => createHash("sha256").update(e).digest("hex")) },
      },
    });
  }
}
main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
