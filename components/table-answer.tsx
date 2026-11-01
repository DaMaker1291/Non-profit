"use client";

// A TABLE COMPLETION ANSWER.
//
// The question supplies the column headings, the row labels and any cells that
// are already filled; only the blank cells are inputs. The value in the sitting
// state is JSON — one string per editable cell, in reading order — because a
// table is not a sentence and a marker that parses cells out of typed prose is
// guessing.
//
// The answer key never reaches this component. It knows which cells are editable
// and what unit each carries, and nothing about the values that fill them.

export interface TableCellView {
  /** A value already printed in the table, not an input. */
  given?: string;
  /** True when the learner fills this cell. */
  editable?: boolean;
  unit?: string;
}

export interface TableView {
  columns: string[];
  rows: Array<{ label?: string; cells: TableCellView[] }>;
}

function read(value: string): string[] {
  try {
    const data = JSON.parse(value);
    return Array.isArray(data) ? data.map((v) => (typeof v === "string" ? v : "")) : [];
  } catch {
    return [];
  }
}

export default function TableAnswer({
  table,
  value,
  onChange,
  label,
}: {
  table: TableView;
  value: string;
  onChange: (next: string) => void;
  label: string;
}) {
  const cells = read(value);
  const editableCount = table.rows.reduce((n, r) => n + r.cells.filter((c) => c.editable).length, 0);
  const current = Array.from({ length: editableCount }, (_, i) => cells[i] ?? "");

  const set = (index: number, next: string) => {
    const copy = [...current];
    copy[index] = next;
    onChange(JSON.stringify(copy));
  };

  let at = -1;
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ borderCollapse: "collapse", minWidth: 280 }} data-answer-table>
        <thead>
          <tr>
            <th scope="col" style={{ textAlign: "left", padding: "6px 10px", borderBottom: "1px solid var(--rule, #e5e7eb)" }} />
            {table.columns.map((c, i) => (
              <th
                key={i}
                scope="col"
                className="small"
                style={{ padding: "6px 10px", borderBottom: "1px solid var(--rule, #e5e7eb)", textAlign: "center" }}
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, ri) => (
            <tr key={ri}>
              <th scope="row" className="small" style={{ textAlign: "left", padding: "6px 10px", fontWeight: 600 }}>
                {row.label ?? ""}
              </th>
              {row.cells.map((cell, ci) => {
                if (cell.editable) {
                  at++;
                  const index = at;
                  return (
                    <td key={ci} style={{ padding: 4, borderBottom: "1px solid var(--rule, #e5e7eb)" }}>
                      <input
                        type="text"
                        inputMode="decimal"
                        autoComplete="off"
                        value={current[index] ?? ""}
                        onChange={(e) => set(index, e.target.value)}
                        aria-label={`${label}, row ${ri + 1}, column ${ci + 1}${cell.unit ? ` (${cell.unit})` : ""}`}
                        style={{ width: 72, padding: "7px 8px", border: "1px solid var(--rule, #e5e7eb)", borderRadius: 6, textAlign: "center" }}
                      />
                    </td>
                  );
                }
                return (
                  <td key={ci} className="small" style={{ padding: "6px 10px", borderBottom: "1px solid var(--rule, #e5e7eb)", textAlign: "center" }}>
                    {cell.given ?? ""}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
