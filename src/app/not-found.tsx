import Link from "next/link";
export default function NotFound() {
  return (
    <main className="error-page">
      <h1>Esta página no existe.</h1>
      <Link className="primary" href="/inicio">
        Ir al inicio
      </Link>
    </main>
  );
}
