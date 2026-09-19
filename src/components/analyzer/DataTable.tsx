"use client";
import { useMemo, useState, type ReactNode } from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { EmptyState } from "./Panel";
export interface Column<T> {
  id: string;
  label: string;
  render: (row: T) => ReactNode;
  sortValue?: (row: T) => number | string;
}
export function DataTable<T>({
  rows,
  columns,
  initialSort,
  rowKey,
  rowClassName,
  caption,
}: {
  rows: T[];
  columns: Column<T>[];
  initialSort: string;
  rowKey: (row: T) => string;
  rowClassName?: (row: T) => string;
  caption: string;
}) {
  const [sort, setSort] = useState({ key: initialSort, descending: true });
  const [page, setPage] = useState(0);
  const sorted = useMemo(() => {
    const column = columns.find((c) => c.id === sort.key);
    if (!column?.sortValue) return rows;
    const getter = column.sortValue;
    return [...rows].sort((a, b) => {
      const av = getter(a),
        bv = getter(b);
      const delta =
        typeof av === "number" && typeof bv === "number"
          ? av - bv
          : String(av).localeCompare(String(bv), "pt-BR");
      return sort.descending ? -delta : delta;
    });
  }, [rows, columns, sort]);
  const pageSize = 25,
    pages = Math.ceil(rows.length / pageSize),
    currentPage = Math.min(page, Math.max(0, pages - 1));
  if (!rows.length) return <EmptyState />;
  return (
    <div className="data-table">
      <Table>
        <caption className="sr-only">{caption}</caption>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead
                key={column.id}
                aria-sort={
                  column.sortValue
                    ? sort.key === column.id
                      ? sort.descending
                        ? "descending"
                        : "ascending"
                      : "none"
                    : undefined
                }
              >
                {column.sortValue ? (
                  <button
                    className="sort-button"
                    onClick={() => {
                      setSort({
                        key: column.id,
                        descending:
                          sort.key === column.id ? !sort.descending : true,
                      });
                      setPage(0);
                    }}
                  >
                    {column.label}
                    {sort.key === column.id ? (
                      sort.descending ? (
                        <ArrowDown />
                      ) : (
                        <ArrowUp />
                      )
                    ) : (
                      <ArrowUpDown />
                    )}
                  </button>
                ) : (
                  column.label
                )}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted
            .slice(currentPage * pageSize, (currentPage + 1) * pageSize)
            .map((row) => (
              <TableRow key={rowKey(row)} className={rowClassName?.(row)}>
                {columns.map((column) => (
                  <TableCell key={column.id}>{column.render(row)}</TableCell>
                ))}
              </TableRow>
            ))}
        </TableBody>
      </Table>
      {pages > 1 && (
        <div className="table-pagination">
          <span>
            {currentPage * pageSize + 1}–
            {Math.min((currentPage + 1) * pageSize, rows.length)} de{" "}
            {rows.length} registros
          </span>
          <div>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Página anterior"
              disabled={currentPage === 0}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft />
            </Button>
            <span>
              {currentPage + 1} / {pages}
            </span>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Próxima página"
              disabled={currentPage === pages - 1}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
