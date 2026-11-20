import type { ReactNode } from 'react';

type Colonne = {
  key: string;
  label: string;
};

type TableProps = {
  colonnes: Colonne[];
  data: Record<string, unknown>[];
  vide?: string;
  renderCell?: (key: string, value: unknown, row: Record<string, unknown>) => ReactNode;
};

export default function Table({
  colonnes,
  data,
  vide = 'Aucune donnée disponible.',
  renderCell,
}: TableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-[#E2E8F0]">
      <table className="min-w-full divide-y divide-[#E2E8F0] text-sm">
        <thead className="bg-[#172B4D]">
          <tr>
            {colonnes.map((col) => (
              <th
                key={col.key}
                scope="col"
                className="px-4 py-3 text-left font-semibold text-white uppercase tracking-wide text-xs"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#E2E8F0] bg-white">
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={colonnes.length}
                className="px-4 py-8 text-center text-[#64748B]"
              >
                {vide}
              </td>
            </tr>
          ) : (
            data.map((row, i) => (
              <tr key={i} className={`hover:bg-[#F5F7F6] transition-colors ${i % 2 === 1 ? 'bg-[#F5F7F6]/50' : 'bg-white'}`}>
                {colonnes.map((col) => (
                  <td key={col.key} className="px-4 py-3 text-[#172B4D] whitespace-nowrap">
                    {renderCell
                      ? renderCell(col.key, row[col.key], row)
                      : String(row[col.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
