export default function Loading() {
  return (
    <main className="page-content" aria-busy="true" aria-label="Cargando cuenta">
      <div className="skeleton heading-skeleton" />
      <div className="skeleton card-skeleton" />
      <div className="skeleton table-skeleton" />
    </main>
  );
}
