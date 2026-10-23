"use client";

import { useMemo, useState } from "react";
import { Search, Download, ChevronLeft, ChevronRight } from "lucide-react";
import MovementList from "@/components/movement-list";
import type { MovementItem } from "@/lib/movements";

const PAGE_SIZE = 8;
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

function escapeCsvCell(value: string) {
  // Evita que una planilla interprete el contenido como una fórmula.
  const prefix = /^[=+\-@\t\r]/.test(value) ? "'" : "";
  const escapedValue = value.replaceAll('"', '""');
  return `"${prefix}${escapedValue}"`;
}

export default function Movements({ items }: { items: MovementItem[] }) {
  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");
  const [period, setPeriod] = useState("all");
  const [page, setPage] = useState(1);

  const filteredMovements = useMemo(() => {
    const searchTerm = query.toLocaleLowerCase();
    const periodStart = Date.now() - Number(period) * MILLISECONDS_PER_DAY;

    return items.filter((movement) => {
      const searchableText =
        `${movement.counterparty} ${movement.description} ${movement.category}`.toLocaleLowerCase();
      const matchesSearch = searchableText.includes(searchTerm);
      const matchesType =
        type === "all" ||
        (type === "income" ? movement.amountCents > 0 : movement.amountCents < 0);
      const matchesPeriod =
        period === "all" || new Date(movement.createdAt).getTime() >= periodStart;

      return matchesSearch && matchesType && matchesPeriod;
    });
  }, [items, query, type, period]);

  const totalPages = Math.max(1, Math.ceil(filteredMovements.length / PAGE_SIZE));
  // Tras una transferencia la lista se recarga y la página actual puede quedar fuera de rango.
  const currentPage = Math.min(page, totalPages);
  const pageItems = filteredMovements.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  function exportCsv() {
    const rows = [
      ["Fecha", "Contraparte", "Concepto", "Categoría", "Importe ARS", "Referencia"],
      ...filteredMovements.map((movement) => [
        movement.createdAt,
        movement.counterparty,
        movement.description,
        movement.category,
        (movement.amountCents / 100).toFixed(2),
        movement.reference,
      ]),
    ];
    const csvContent = rows.map((row) => row.map(escapeCsvCell).join(";")).join("\r\n");
    const csvFile = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(csvFile);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "movimientos-granabank.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="panel">
      <div className="filter-bar">
        <div className="search-input">
          <Search size={18} />
          <input
            aria-label="Buscar movimientos"
            placeholder="Buscar por nombre o concepto"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <select
          aria-label="Filtrar por tipo"
          value={type}
          onChange={(e) => {
            setType(e.target.value);
            setPage(1);
          }}
        >
          <option value="all">Todos los tipos</option>
          <option value="income">Ingresos</option>
          <option value="expense">Egresos</option>
        </select>
        <select
          aria-label="Filtrar por período"
          value={period}
          onChange={(e) => {
            setPeriod(e.target.value);
            setPage(1);
          }}
        >
          <option value="all">Todo el período</option>
          <option value="7">Últimos 7 días</option>
          <option value="30">Últimos 30 días</option>
          <option value="90">Últimos 90 días</option>
        </select>
        <button
          className="secondary export-button"
          onClick={exportCsv}
          disabled={!filteredMovements.length}
        >
          <Download size={17} /> Exportar
        </button>
      </div>
      <MovementList
        items={pageItems}
        emptyHint="Probá con otros filtros o realizá tu primera transferencia."
      />
      <div className="pagination">
        <span>{filteredMovements.length} movimientos</span>
        <div>
          <button
            className="icon-button"
            aria-label="Página anterior"
            disabled={currentPage === 1}
            onClick={() => setPage(currentPage - 1)}
          >
            <ChevronLeft size={18} />
          </button>
          <span>
            {currentPage} de {totalPages}
          </span>
          <button
            className="icon-button"
            aria-label="Página siguiente"
            disabled={currentPage >= totalPages}
            onClick={() => setPage(currentPage + 1)}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </section>
  );
}
