import { ArrowDownLeft, ArrowUpRight, RefreshCw } from "lucide-react";
import type { Movement } from "@/generated/prisma/client";

export type MovementItem = {
  id: string;
  amountCents: number;
  counterparty: string;
  description: string;
  category: string;
  createdAt: string;
  reference: string;
};

export const toMovementItem = (movement: Movement): MovementItem => ({
  id: movement.id,
  amountCents: Number(movement.amountCents),
  counterparty: movement.counterparty,
  description: movement.description,
  category: movement.category,
  createdAt: movement.createdAt.toISOString(),
  reference: movement.reference,
});

const SUBSCRIPTION_CATEGORIES = ["Suscripciones", "Servicios"];

export function movementKind({
  amountCents,
  category,
}: Pick<MovementItem, "amountCents" | "category">) {
  if (amountCents > 0)
    return { className: "incoming", label: "Ingreso", Icon: ArrowDownLeft } as const;
  if (SUBSCRIPTION_CATEGORIES.includes(category))
    return { className: "subscription", label: "Suscripción", Icon: RefreshCw } as const;
  return { className: "", label: "Egreso", Icon: ArrowUpRight } as const;
}
