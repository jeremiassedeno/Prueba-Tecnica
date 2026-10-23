import Link from "next/link";
import { ArrowDownLeft } from "lucide-react";
import { date, money } from "@/lib/format";
import { movementKind, type MovementItem } from "@/lib/movements";

export default function MovementList({
  items,
  emptyHint,
}: {
  items: MovementItem[];
  emptyHint: string;
}) {
  if (!items.length)
    return (
      <div className="empty-state">
        <ArrowDownLeft size={30} />
        <h3>No hay movimientos para mostrar</h3>
        <p>{emptyHint}</p>
      </div>
    );
  return (
    <div className="movement-table">
      <div className="table-head">
        <span>Descripción</span>
        <span>Fecha</span>
        <span>Importe</span>
      </div>
      {items.map((item) => {
        const kind = movementKind(item);
        const incoming = item.amountCents > 0;
        return (
          <Link className="movement-row" href={`/movimientos/${item.id}`} key={item.id}>
            <span className="movement-name">
              <span
                className={`movement-icon ${kind.className}`}
                role="img"
                aria-label={kind.label}
                title={kind.label}
              >
                <kind.Icon size={19} />
              </span>
              <span>
                <strong>{item.counterparty}</strong>
                <small>{item.description}</small>
              </span>
            </span>
            <span className="movement-date">{date(item.createdAt)}</span>
            <strong className={`movement-amount ${incoming ? "positive" : ""}`}>
              {incoming ? "+ " : "− "}
              {money(Math.abs(item.amountCents))}
              <small>Completado</small>
            </strong>
          </Link>
        );
      })}
    </div>
  );
}
