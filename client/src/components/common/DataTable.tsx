import React, { useMemo, useCallback } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export interface Column<T> {
  header: string;
  accessor: keyof T | ((item: T) => React.ReactNode);
  className?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  actions?: Array<{
    label: string;
    onClick: (item: T) => void;
    className?: string;
    condition?: (item: T) => boolean;
  }>;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  emptyMessage?: string;
}

const DataTable = React.memo(<T,>({
  data,
  columns,
  actions,
  isLoading,
  error,
  onRetry,
  emptyMessage = 'No data found.',
}: DataTableProps<T>) => {
  const renderCell = useCallback((item: T, column: Column<T>) => {
    if (typeof column.accessor === 'function') {
      return column.accessor(item);
    }
    return String(item[column.accessor]);
  }, []);
  console.log('data:',data)

  const tableContent = useMemo(() => {
    if (isLoading) {
      return (
        <tr>
          <td colSpan={columns.length + (actions ? 1 : 0)} className="py-8 text-center">
            <div className="flex justify-center items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
            </div>
          </td>
        </tr>
      );
    }

    if (error) {
      return (
        <tr>
          <td colSpan={columns.length + (actions ? 1 : 0)} className="py-8 text-center">
            <div className="bg-red-500/20 border-l-4 border-red-500 p-4 rounded-lg text-white">
              <p className="text-sm">Error: {error}</p>
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="mt-2 text-sm text-purple-300 hover:text-purple-200"
                >
                  Retry
                </button>
              )}
            </div>
          </td>
        </tr>
      );
    }

    if (data.length === 0) {
      return (
        <tr>
          <td colSpan={columns.length + (actions ? 1 : 0)} className="py-8 text-center text-gray-200">
            {emptyMessage}
          </td>
        </tr>
      );
    }

    return data.map((item, index) => (
      <tr key={index} className="hover:bg-white/30 transition-all duration-300">
        {columns.map((column) => (
          <td
            key={String(column.accessor)}
            className={`px-4 py-4 text-sm text-white ${column.className || ''}`}
          >
            {renderCell(item, column)}
          </td>
        ))}
        {actions && (
          <td className="px-4 py-4 text-sm space-x-2">
            {actions.map((action, idx) => (
              (!action.condition || action.condition(item)) && (
                <button
                  key={idx}
                  onClick={() => action.onClick(item)}
                  className={`px-3 py-1 rounded-lg text-white ${action.className || 'bg-purple-600 hover:bg-purple-700'}`}
                >
                  {action.label}
                </button>
              )
            ))}
          </td>
        )}
      </tr>
    ));
  }, [data, columns, actions, isLoading, error, onRetry, emptyMessage, renderCell]);

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} theme="dark" />
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white/20 backdrop-blur-lg border border-white/20 rounded-lg">
          <thead>
            <tr className="bg-white/10 border-b border-white/20">
              {columns.map((column) => (
                <th
                  key={String(column.accessor)}
                  className={`px-4 py-3 text-left text-xs font-bold text-gray-200 uppercase tracking-wider ${column.className || ''}`}
                >
                  {column.header}
                </th>
              ))}
              {actions && (
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-200 uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/20">
            {tableContent}
          </tbody>
        </table>
      </div>
    </>
  );
}) as <T>(props: DataTableProps<T>) => React.ReactElement;

export default DataTable;