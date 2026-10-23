import Link from "next/link";
import { ArrowUpRight, ArrowDownLeft, ArrowRight } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { startOfMonth } from "@/lib/dates";
import { dayAndMonth, money, monthAndYear } from "@/lib/format";
import { Balance, CopyAlias } from "@/components/account-actions";
import Transfer from "@/components/transfer";
import MovementList from "@/components/movement-list";

export default async function Home() {
  const user = await requireUser();
  const now = new Date();
  const monthStart = startOfMonth(now);
  const [recent, income, expenses] = await Promise.all([
    db().movement.findMany({
      where: { accountId: user.account.id },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: 5,
    }),
    db().movement.aggregate({
      where: {
        accountId: user.account.id,
        amountCents: { gt: 0 },
        createdAt: { gte: monthStart },
      },
      _sum: { amountCents: true },
    }),
    db().movement.aggregate({
      where: {
        accountId: user.account.id,
        amountCents: { lt: 0 },
        createdAt: { gte: monthStart },
      },
      _sum: { amountCents: true },
    }),
  ]);
  return (
    <main className="page-content">
      <div className="page-heading">
        <div>
          <span className="mini-label">ESTÁS EN TU CASA</span>
          <h1>
            Hola, {user.name.split(" ")[0]}{" "}
            <span className="greeting-dot" aria-hidden="true">
              ✳
            </span>
          </h1>
          <p>Un nuevo día para hacer eso que tenés en mente.</p>
        </div>
        <span className="date-badge">{dayAndMonth(now)}</span>
      </div>
      <div className="overview-grid">
        <section className="balance-card">
          <div className="card-heading">
            <span>
              <span className="account-dot" /> Caja de ahorro en pesos
            </span>
            <span>•• {user.account.number.slice(-4)}</span>
          </div>
          <Balance value={user.account.balanceCents} />
          <div className="balance-bottom">
            <CopyAlias value={user.account.alias} />
            <Transfer balance={user.account.balanceCents} />
          </div>
        </section>
        <section className="month-card">
          <div className="card-heading">
            <h2>Tu mes, en números</h2>
            <span className="month-name">{monthAndYear(now)}</span>
          </div>
          <div className="monthly-stat">
            <span className="movement-icon incoming">
              <ArrowDownLeft size={20} />
            </span>
            <div>
              <small>Ingresos</small>
              <strong>{money(income._sum.amountCents ?? 0)}</strong>
            </div>
            <span className="stat-line income-line" />
          </div>
          <div className="monthly-stat">
            <span className="movement-icon">
              <ArrowUpRight size={20} />
            </span>
            <div>
              <small>Egresos</small>
              <strong>{money(Math.abs(expenses._sum.amountCents ?? 0))}</strong>
            </div>
            <span className="stat-line expense-line" />
          </div>
        </section>
      </div>
      <div className="detail-grid">
        <section className="panel">
          <div className="section-heading">
            <div>
              <h2>Últimos movimientos</h2>
              <p>Lo que pasa con tu plata, siempre a mano.</p>
            </div>
            <Link href="/movimientos">
              Ver todos <ArrowRight size={16} />
            </Link>
          </div>
          <MovementList
            items={recent.map((m) => ({ ...m, createdAt: m.createdAt.toISOString() }))}
            emptyHint="Cuando envíes o recibas dinero, lo vas a ver acá."
          />
        </section>
        <aside className="home-side">
          <div className="daily-card">
            <span className="eyebrow">MENOS VUELTAS, MÁS PLANES</span>
            <h2>
              Tu próximo paso
              <br />
              empieza acá.
            </h2>
            <div className="steps-art" aria-hidden="true">
              <span />
              <span />
              <span />
              <ArrowUpRight />
            </div>
            <p>
              Transferí en segundos.
              <br />
              Seguí con lo que te mueve.
            </p>
            <Link href="/movimientos">
              Explorá tus movimientos <ArrowUpRight size={17} />
            </Link>
          </div>
        </aside>
      </div>
    </main>
  );
}
