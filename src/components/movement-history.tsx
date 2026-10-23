"use client";

import { useMemo, useState } from "react";
import { Search, Download, ChevronLeft, ChevronRight } from "lucide-react";
import MovementList from "@/components/movement-list";
import type { MovementItem } from "@/lib/movements";

const PAGE_SIZE = 8;
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

const TYPES = [
  { value: "all", label: "Todos los tipos" },
  { value: "income", label: "Ingresos" },
  { value: "expense", label: "Egresos" },
] as const;

const PERIODS = [
  { value: "all", label: "Todo el período", days: null },
  { value: "7", label: "Últimos 7 días", days: 7 },
  { value: "30", label: "Últimos 30 días", days: 30 },
  { value: "90", label: "Últimos 90 días", days: 90 },
] as const;

type MovementType = (typeof TYPES)[number]["value"];
type Period = (typeof PERIODS)[number];

function escapeCsvCell(value: string) {
  const prefix = /^[=+\-@\t\r]/.test(value) ? "'" : "";
  const escapedValue = value.replaceAll('"', '""');
  return `"${prefix}${escapedValue}"`;
}

export default function MovementHistory({ items }: { items: MovementItem[] }) {
  const [query, setQuery] = useState("");
  const [type, setType] = useState<MovementType>("all");
  const [period, setPeriod] = useState<{ value: Period["value"]; since: number | null }>({
    value: "all",
    since: null,
  });
  const [page, setPage] = useState(1);

  function choosePeriod({ value, days }: Period) {
    setPeriod({
      value,
      since: days === null ? null : Date.now() - days * MILLISECONDS_PER_DAY,
    });
    setPage(1);
  }

  const filteredMovements = useMemo(() => {
    const searchTerm = query.toLocaleLowerCase();

    return items.filter((movement) => {
      const searchableText =
        `${movement.counterparty} ${movement.description} ${movement.category}`.toLocaleLowerCase();
      const matchesSearch = searchableText.includes(searchTerm);
      const matchesType =
        type === "all" ||
        (type === "income" ? movement.amountCents > 0 : movement.amountCents < 0);
      const matchesPeriod =
        period.since === null || new Date(movement.createdAt).getTime() >= period.since;

      return matchesSearch && matchesType && matchesPeriod;
    });
  }, [items, query, type, period.since]);

  const totalPages = Math.max(1, Math.ceil(filteredMovements.length / PAGE_SIZE));
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
    const csvFile = new Blob(["﻿" + csvContent], {
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
            const option = TYPES.find(({ value }) => value === e.target.value);
            if (!option) return;
            setType(option.value);
            setPage(1);
          }}
        >
          {TYPES.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select
          aria-label="Filtrar por período"
          value={period.value}
          onChange={(e) => {
            const option = PERIODS.find(({ value }) => value === e.target.value);
            if (option) choosePeriod(option);
          }}
        >
          {PERIODS.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
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
