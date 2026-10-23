import { ArrowDownLeft, ArrowUpRight, RefreshCw } from "lucide-react";

export type MovementItem = {
  id: string;
  amountCents: number;
  counterparty: string;
  description: string;
  category: string;
  createdAt: string;
  reference: string;
};

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
