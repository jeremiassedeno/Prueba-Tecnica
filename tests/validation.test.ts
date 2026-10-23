import { test } from "node:test";
import assert from "node:assert/strict";
import { transferSchema, loginSchema } from "../src/lib/validation";
const valid = {
  recipient: "lucia.granabank",
  amount: "123,45",
  description: "Almuerzo",
  requestId: "41f90bc2-5f4b-43b9-aa82-f59fa3d56fc2",
};
test("convierte dinero a centavos exactos", () => {
  assert.equal(transferSchema.parse(valid).amount, 12345);
  assert.equal(transferSchema.parse({ ...valid, amount: "1.01" }).amount, 101);
  assert.equal(transferSchema.parse({ ...valid, amount: "100" }).amount, 10000);
});
test("rechaza montos negativos, ambiguos, excesivos o con precisión inválida", () => {
  for (const amount of [
    "-1",
    "0",
    "0.99",
    "1.001",
    "1e5",
    "NaN",
    "1.000,00",
    "1000001",
    "",
  ])
    assert.equal(transferSchema.safeParse({ ...valid, amount }).success, false, amount);
});
test("normaliza destinatario y exige referencia de idempotencia", () => {
  assert.equal(
    transferSchema.parse({ ...valid, recipient: " LUCIA.GRANABANK " }).recipient,
    "lucia.granabank",
  );
  assert.equal(transferSchema.safeParse({ ...valid, requestId: "bad" }).success, false);
});
test("valida login y limita tamaño de contraseña", () => {
  assert.equal(
    loginSchema.parse({ email: "MARTIN@granabank.demo", password: "example" }).email,
    "martin@granabank.demo",
  );
  assert.equal(loginSchema.safeParse({ email: "mal", password: "" }).success, false);
  assert.equal(
    loginSchema.safeParse({ email: "a@b.com", password: "x".repeat(129) }).success,
    false,
  );
});
test("los errores de transferencia que ve el usuario están en español", () => {
  const cases = [
    { ...valid, recipient: "  ab  " },
    { ...valid, recipient: "x".repeat(61) },
    { ...valid, description: "  x" },
    { ...valid, description: "x".repeat(81) },
    { ...valid, amount: "abc" },
    { ...valid, requestId: "bad" },
    {
      recipient: undefined,
      amount: "10",
      description: "Almuerzo",
      requestId: valid.requestId,
    },
    null,
  ];
  for (const input of cases) {
    const message = transferSchema.safeParse(input).error?.issues[0].message ?? "";
    assert.match(message, /^(Ingresá|El |La |No pudimos)/, message);
  }
});
