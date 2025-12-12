import React from 'react';

interface TableColumn {
  key: string;
  label: string;
  render?: (value: any) => React.ReactNode;
}

interface TableProps {
  columns: TableColumn[];
  data: any[];
  title: string;
  loading?: boolean;
  maxRows?: number;
}

export const DataTable: React.FC<TableProps> = ({
  columns,
  data,
  title,
  loading = false,
  maxRows = 5,
}) => {
  const displayData = data.slice(0, maxRows);

  return (
    <div className="card">
      <h3 className="card-title mb-4">{title}</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700">
              {columns.map((col) => (
                <th key={col.key} className="text-left py-2 px-2 text-slate-400 font-medium">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="text-center py-8 text-slate-500">
                  Carregando...
                </td>
              </tr>
            ) : displayData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="text-center py-8 text-slate-500">
                  Sem dados disponíveis
                </td>
              </tr>
            ) : (
              displayData.map((row, idx) => (
                <tr key={idx} className="border-b border-slate-800 hover:bg-slate-700 transition-colors">
                  {columns.map((col) => (
                    <td key={col.key} className="py-3 px-2">
                      {col.render ? col.render(row[col.key]) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
