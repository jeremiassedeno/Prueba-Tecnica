import Link from "next/link";

export default function MovementNotFound() {
  return (
    <main className="error-page">
      <h1>No encontramos este movimiento.</h1>
      <p>Puede que el enlace esté mal escrito o que no pertenezca a tu cuenta.</p>
      <Link className="primary" href="/movimientos">
        Ver mis movimientos
      </Link>
    </main>
  );
}
