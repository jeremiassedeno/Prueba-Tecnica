"use client";
import { useEffect } from "react";

export default function ErrorPage({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  useEffect(() => {
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
      {/* Recarga completa: un <Link> a la misma ruta no reinicia el error. */}
      <a href="/inicio">Ir al inicio</a>
    </main>
  );
}
