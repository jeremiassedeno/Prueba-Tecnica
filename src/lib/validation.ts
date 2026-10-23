import { z } from "zod";
export const loginSchema = z.object({
  email: z
    .email()
    .max(254)
    .transform((v) => v.toLowerCase()),
  password: z.string().min(1).max(128),
});
// La API muestra al usuario el primer mensaje, por eso cada regla define el suyo.
export const transferSchema = z.object(
  {
    recipient: z
      .string({ error: "Ingresá el alias o número de cuenta." })
      .trim()
      .min(3, "El alias o número de cuenta debe tener al menos 3 caracteres.")
      .max(60, "El alias o número de cuenta no puede superar los 60 caracteres.")
      .transform((v) => v.toLowerCase()),
    amount: z
      .string({ error: "Ingresá el importe." })
      .regex(
        /^\d{1,7}([.,]\d{1,2})?$/,
        "Ingresá un importe válido con hasta dos decimales.",
      )
      .transform((value) => {
        const [whole, decimals = ""] = value.replace(",", ".").split(".");
        return Number(whole) * 100 + Number(decimals.padEnd(2, "0"));
      })
      .pipe(
        z
          .number()
          .int()
          .min(100, "El mínimo es $1.")
          .max(100000000, "El máximo por transferencia es $1.000.000."),
      ),
    description: z
      .string({ error: "Ingresá un concepto." })
      .trim()
      .min(3, "El concepto debe tener al menos 3 caracteres.")
      .max(80, "El concepto no puede superar los 80 caracteres."),
    requestId: z.uuid(
      "La operación no es válida. Cerrá el formulario y volvé a intentar.",
    ),
  },
  { error: "No pudimos leer los datos de la transferencia." },
);
