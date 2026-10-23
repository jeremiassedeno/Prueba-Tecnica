"use client";
import { useState, useRef, type SubmitEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, X, Check, LoaderCircle } from "lucide-react";
import { money } from "@/lib/format";

type Receipt = { recipient: string; amount: number; reference: string };

export default function Transfer({ balance }: { balance: number }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const router = useRouter();

  const requestId = useRef("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<Receipt | null>(null);

  function open() {
    requestId.current = crypto.randomUUID();
    setError("");
    setSuccess(null);
    dialog.current?.showModal();
  }
  async function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const values = Object.fromEntries(new FormData(event.currentTarget));
    try {
      const response = await fetch("/api/transfers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, requestId: requestId.current }),
      });
      const data = await response.json();
      if (response.status === 401) router.refresh();
      if (!response.ok) throw new Error(data.error);
      setSuccess({
        recipient: data.recipient,
        amount: data.amount,
        reference: data.reference,
      });
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Hubo un problema de conexión.");
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <button className="primary" onClick={open}>
        <ArrowUpRight size={19} />
        Transferir
      </button>
      <dialog
        ref={dialog}
        aria-labelledby="transfer-title"
        onCancel={(e) => {
          if (pending) e.preventDefault();
        }}
      >
        <div className="modal-top">
          <span className="mini-label">MOVÉ TUS PLANES</span>
          <button
            className="icon-button"
            aria-label="Cerrar"
            disabled={pending}
            onClick={() => dialog.current?.close()}
          >
            <X size={21} />
          </button>
        </div>
        {success ? (
          <div className="transfer-success">
            <div>
              <Check size={30} />
            </div>
            <h2 id="transfer-title">¡Transferencia realizada!</h2>
            <strong className="transfer-amount">{money(success.amount)}</strong>
            <p>El dinero ya está en la cuenta de {success.recipient}.</p>
            <p className="reference">Referencia: {success.reference}</p>
            <button className="primary" onClick={() => dialog.current?.close()}>
              Listo
            </button>
          </div>
        ) : (
          <>
            <h2 id="transfer-title">Nueva transferencia</h2>
            <p className="muted">Saldo disponible: {money(balance)}</p>
            <form onSubmit={submit}>
              <label htmlFor="recipient">Alias o número de cuenta</label>
              <input
                name="recipient"
                id="recipient"
                placeholder="Ej.: lucia.granabank"
                required
                minLength={3}
                maxLength={60}
              />
              <label htmlFor="amount">Importe en pesos</label>
              <input
                name="amount"
                id="amount"
                inputMode="decimal"
                placeholder="0,00"
                required
                pattern="[0-9]+([.,][0-9]{1,2})?"
                title="Solo números, con hasta dos decimales. Ej.: 1500,50"
              />
              <label htmlFor="description">Concepto</label>
              <input
                name="description"
                id="description"
                placeholder="Ej.: Almuerzo compartido"
                required
                minLength={3}
                maxLength={80}
              />
              {error && (
                <p className="error-message" role="alert">
                  {error}
                </p>
              )}
              <p className="form-help">
                Solo entre cuentas de esta demo. Revisá el alias y el importe antes de
                confirmar.
              </p>
              <button className="primary full" disabled={pending}>
                {pending ? (
                  <>
                    <LoaderCircle className="spin" size={18} /> Procesando...
                  </>
                ) : (
                  <>
                    Confirmar transferencia <ArrowUpRight size={18} />
                  </>
                )}
              </button>
            </form>
          </>
        )}
      </dialog>
    </>
  );
}
