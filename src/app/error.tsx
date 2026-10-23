"use client";
import { useEffect } from "react";
import Link from "next/link";

export default function ErrorPage({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  useEffect(() => {
    // El detalle técnico queda en la consola; al usuario se le muestra un mensaje claro.
    console.error(error);
  }, [error]);
  return (
    <main className="error-page">
      <h1>Algo salió mal.</h1>
      <p>
        No pudimos cargar esta sección. Tu dinero y tus datos no se modificaron. Intentá
        de nuevo en unos segundos.
      </p>
      <button className="primary" onClick={() => retry()}>
        Reintentar
      </button>
      <Link href="/inicio">Ir al inicio</Link>
    </main>
  );
}
