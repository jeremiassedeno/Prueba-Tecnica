"use client";
import { useState } from "react";
import { Copy, Check, Eye, EyeOff } from "lucide-react";
import { money } from "@/lib/format";
export function Balance({ value }: { value: number }) {
  const [hidden, setHidden] = useState(false);
  return (
    <>
      <div className="balance-label">
        Saldo disponible{" "}
        <button
          className="icon-button"
          aria-label={hidden ? "Mostrar saldo" : "Ocultar saldo"}
          onClick={() => setHidden(!hidden)}
        >
          {hidden ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      </div>
      <div className="balance-amount">
        {hidden ? "$ •••••••" : money(value)}
        <span>ARS</span>
      </div>
    </>
  );
}
export function CopyAlias({ value }: { value: string }) {
  const [state, setState] = useState("");
  return (
    <button
      className="alias-copy"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setState("Copiado");
          setTimeout(() => setState(""), 2000);
        } catch {
          setState("No se pudo copiar");
        }
      }}
      aria-label={`Copiar alias ${value}`}
    >
      Alias: <strong>{value}</strong>
      {state === "Copiado" ? <Check size={14} /> : <Copy size={14} />}
      <span aria-live="polite">{state}</span>
    </button>
  );
}
