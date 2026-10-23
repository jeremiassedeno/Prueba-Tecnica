import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});
const DAY = 86400000;

async function main() {
  const password = process.env.SEED_PASSWORD;
  if (!password || password.length < 12)
    throw new Error("Definí SEED_PASSWORD con al menos 12 caracteres.");
  const primaryPassword = process.env.SEED_PRIMARY_PASSWORD;
  if (!primaryPassword || primaryPassword.length < 8)
    throw new Error("Definí SEED_PRIMARY_PASSWORD con al menos 8 caracteres.");
  const users = [
    {
      name: "Martín González",
      email: "soygranate@clublanus.com",
      password: primaryPassword,
      alias: "martin.granabank",
      number: "0000003100012345678901",
      balanceCents: 125345150,
      movements: [
        {
          amountCents: -499900,
          counterparty: "GranaMusic Premium",
          description: "Suscripción mensual",
          category: "Suscripciones",
          days: 0,
        },
        {
          amountCents: -1850000,
          counterparty: "Lucía Fernández",
          description: "Cena del fin de semana",
          category: "Transferencias",
          days: 0,
        },
        {
          amountCents: 85000000,
          counterparty: "Estudio Creativo",
          description: "Acreditación de haberes",
          category: "Ingresos",
          days: 1,
        },
        {
          amountCents: -645099,
          counterparty: "Café Martínez",
          description: "Tu pausa del día",
          category: "Gastronomía",
          days: 2,
        },
        {
          amountCents: -5245090,
          counterparty: "Mercado Libre",
          description: "Compra online",
          category: "Compras",
          days: 3,
        },
        {
          amountCents: 2500000,
          counterparty: "Sofía Rodríguez",
          description: "Transferencia recibida",
          category: "Transferencias",
          days: 4,
        },
        {
          amountCents: -3275000,
          counterparty: "Internet hogar",
          description: "Pago de servicio",
          category: "Servicios",
          days: 6,
        },
        {
          amountCents: -820000,
          counterparty: "Librería Cúspide",
          description: "Compra con débito",
          category: "Compras",
          days: 8,
        },
        {
          amountCents: -1200000,
          counterparty: "Tomás López",
          description: "Regalo compartido",
          category: "Transferencias",
          days: 12,
        },
        {
          amountCents: -4899000,
          counterparty: "Supermercado",
          description: "Compra semanal",
          category: "Compras",
          days: 16,
        },
      ],
    },
    {
      name: "Lucía Fernández",
      email: "lucia@granabank.demo",
      password,
      alias: "lucia.granabank",
      number: "0000003100012345678902",
      balanceCents: 35000000,
      movements: [],
    },
  ];
  for (const { password, movements, balanceCents, ...user } of users) {
    if (await prisma.user.findUnique({ where: { email: user.email } })) {
      console.log(`La cuenta ${user.email} ya existe; se conserva su información.`);
      continue;
    }
    // El saldo inicial compensa el historial para que la suma de movimientos dé el saldo.
    const net = movements.reduce((sum, m) => sum + m.amountCents, 0);
    await prisma.user.create({
      data: {
        name: user.name,
        email: user.email,
        passwordHash: await bcrypt.hash(password, 12),
        account: {
          create: {
            alias: user.alias,
            number: user.number,
            balanceCents,
            movements: {
              create: [
                {
                  amountCents: balanceCents - net,
                  counterparty: "GranaBank",
                  description: "Saldo inicial de demostración",
                  category: "Ingresos",
                  reference: `seed-${user.alias}-initial`,
                  createdAt: new Date(Date.now() - 40 * DAY),
                },
                ...movements.map(({ days, ...movement }, index) => ({
                  ...movement,
                  reference: `seed-${user.alias}-${index}`,
                  createdAt: new Date(Date.now() - days * DAY),
                })),
              ],
            },
          },
        },
      },
    });
    console.log(`Cuenta de prueba creada: ${user.email} / alias: ${user.alias}`);
  }
}
main()
  .catch((e) => {
    console.error(e.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
