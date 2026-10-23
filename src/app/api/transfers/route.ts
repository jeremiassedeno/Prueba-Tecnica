import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { currentUser, sameOrigin } from "@/lib/auth";
import { db } from "@/lib/db";
import { transferSchema } from "@/lib/validation";

class InsufficientFundsError extends Error {}

export async function POST(request: Request) {
  if (!sameOrigin(request))
    return NextResponse.json({ error: "Origen no permitido." }, { status: 403 });
  try {
    const user = await currentUser();
    if (!user?.account)
      return NextResponse.json(
        { error: "Iniciá sesión para continuar." },
        { status: 401 },
      );
    const parsed = transferSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success)
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 },
      );
    const { recipient, amount, description, requestId } = parsed.data;
    const sender = user.account;
    const destination = await db().account.findFirst({
      where: { OR: [{ alias: recipient }, { number: recipient }] },
      include: { user: true },
    });
    if (!destination)
      return NextResponse.json(
        { error: "No encontramos una cuenta con ese alias o número." },
        { status: 404 },
      );
    if (destination.id === sender.id)
      return NextResponse.json(
        { error: "Elegí una cuenta diferente de la tuya." },
        { status: 400 },
      );
    await db().$transaction(async (tx) => {
      await tx.transfer.create({
        data: {
          id: requestId,
          senderId: sender.id,
          recipientId: destination.id,
          amountCents: amount,
        },
      });
      const updated = await tx.account.updateMany({
        where: { id: sender.id, balanceCents: { gte: amount } },
        data: { balanceCents: { decrement: amount } },
      });
      if (!updated.count) throw new InsufficientFundsError();
      await tx.account.update({
        where: { id: destination.id },
        data: { balanceCents: { increment: amount } },
      });
      await tx.movement.createMany({
        data: [
          {
            accountId: sender.id,
            amountCents: -amount,
            description,
            category: "Transferencias",
            counterparty: destination.user.name,
            reference: requestId,
          },
          {
            accountId: destination.id,
            amountCents: amount,
            description,
            category: "Transferencias",
            counterparty: user.name,
            reference: requestId,
          },
        ],
      });
    });
    return NextResponse.json({
      ok: true,
      reference: requestId,
      recipient: destination.user.name,
      amount,
    });
  } catch (error) {
    if (error instanceof InsufficientFundsError)
      return NextResponse.json(
        { error: "Tu saldo es insuficiente para esta transferencia." },
        { status: 400 },
      );
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002")
      return NextResponse.json(
        {
          error:
            "Esta operación ya fue procesada. Revisá tus movimientos antes de volver a transferir.",
        },
        { status: 409 },
      );
    return NextResponse.json(
      {
        error:
          "No pudimos completar la operación. Revisá tus movimientos e intentá nuevamente.",
      },
      { status: 503 },
    );
  }
}
