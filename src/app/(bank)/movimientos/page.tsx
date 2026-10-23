import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { toMovementItem } from "@/lib/movements";
import MovementHistory from "@/components/movement-history";
import Transfer from "@/components/transfer";

export default async function MovementsPage() {
  const user = await requireUser();
  const items = await db().movement.findMany({
    where: { accountId: user.account.id },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
  });
  return (
    <main className="page-content">
      <div className="page-heading">
        <div>
          <h1>Tus movimientos</h1>
          <p>Consultá, buscá y llevá el control de tu actividad.</p>
        </div>
        <Transfer balance={Number(user.account.balanceCents)} />
      </div>
      <MovementHistory items={items.map(toMovementItem)} />
    </main>
  );
}
