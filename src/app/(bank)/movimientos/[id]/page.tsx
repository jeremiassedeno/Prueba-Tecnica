import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CircleCheck } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { dateTime, money } from "@/lib/format";
import { movementKind } from "@/lib/movements";

export default async function MovementDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  // Filtrar por la cuenta de la sesión evita ver movimientos ajenos cambiando la URL.
  const movement = await db().movement.findFirst({
    where: { id, accountId: user.account.id },
  });
  if (!movement) notFound();

  const kind = movementKind(movement);
  const incoming = movement.amountCents > 0;
  return (
    <main className="page-content">
      <Link className="back-link" href="/movimientos">
        <ArrowLeft size={16} /> Volver a movimientos
      </Link>
      <div className="page-heading">
        <div>
          <span className="mini-label">DETALLE DEL MOVIMIENTO</span>
          <h1>{movement.counterparty}</h1>
          <p>{movement.description}</p>
        </div>
      </div>
      <section className="panel movement-summary">
        <span className={`movement-icon ${kind.className}`} aria-hidden="true">
          <kind.Icon size={24} />
        </span>
        <div>
          <small>{kind.label}</small>
          <strong className={`movement-total ${incoming ? "positive" : ""}`}>
            {incoming ? "+ " : "− "}
            {money(Math.abs(movement.amountCents))}
          </strong>
        </div>
        <span className="status-badge">
          <CircleCheck size={15} /> Completado
        </span>
      </section>
      <section className="panel">
        <dl className="detail-list">
          <div>
            <dt>{incoming ? "De" : "Para"}</dt>
            <dd>{movement.counterparty}</dd>
          </div>
          <div>
            <dt>Concepto</dt>
            <dd>{movement.description}</dd>
          </div>
          <div>
            <dt>Categoría</dt>
            <dd>{movement.category}</dd>
          </div>
          <div>
            <dt>Fecha y hora</dt>
            <dd>{dateTime(movement.createdAt)}</dd>
          </div>
          <div>
            <dt>Cuenta</dt>
            <dd>Caja de ahorro en pesos •• {user.account.number.slice(-4)}</dd>
          </div>
          <div>
            <dt>Referencia</dt>
            <dd className="reference-code">{movement.reference}</dd>
          </div>
        </dl>
      </section>
    </main>
  );
}
