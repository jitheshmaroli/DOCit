import React, { useMemo, useCallback } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Loader2 } from 'lucide-react';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Block as BlockIcon,
  Visibility as ViewDetailsIcon,
  PersonAdd as AddUserIcon,
  Verified as VerifyIcon,
  CheckCircle as ApproveIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';

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
  enableHorizontalScroll?: boolean;
}

const DataTable = React.memo(
  <T,>({
    data,
    columns,
    actions = [],
    isLoading = false,
    error,
    onRetry,
    emptyMessage = 'No data found.',
    enableHorizontalScroll = true,
  }: DataTableProps<T>) => {
    const renderCell = useCallback((item: T, column: Column<T>) => {
      if (typeof column.accessor === 'function') {
        return column.accessor(item);
      }
      const value = item[column.accessor];
      return value != null ? String(value) : 'N/A';
    }, []);

    const getIconForAction = (label: string) => {
      switch (label) {
        case 'Edit':
          return <EditIcon className="text-2xl" style={{ color: '#1976d2' }} />;
        case 'Delete':
          return <DeleteIcon className="text-2xl" style={{ color: '#d32f2f' }} />;
        case 'Block':
          return <BlockIcon className="text-2xl" style={{ color: '#ed6c02' }} />;
        case 'Unblock':
          return <BlockIcon className="text-2xl" style={{ color: '#2e7d32' }} />;
        case 'View Details':
          return <ViewDetailsIcon className="text-2xl" style={{ color: '#2e7d32' }} />;
        case 'Add User':
          return <AddUserIcon className="text-2xl" style={{ color: '#1976d2' }} />;
        case 'Verify':
          return <VerifyIcon className="text-2xl" style={{ color: '#2e7d32' }} />;
        case 'Approve':
          return <ApproveIcon className="text-2xl" style={{ color: '#2e7d32' }} />;
        case 'Reject':
          return <CancelIcon className="text-2xl" style={{ color: '#d32f2f' }} />;
        case 'Cancel':
          return <CancelIcon className="text-2xl" style={{ color: '#d32f2f' }} />;
        default:
          return null;
      }
    };

    const tableContent = useMemo(() => {
      if (isLoading) {
        return (
          <tr>
            <td
              colSpan={columns.length + (actions.length > 0 ? 1 : 0)}
              className="py-8 text-center"
            >
              <div className="flex justify-center items-center">
                <Loader2
                  className="animate-spin text-purple-400"
                  size={32}
                  aria-label="Loading data"
                />
              </div>
            </td>
          </tr>
        );
      }

      if (error) {
        return (
          <tr>
            <td
              colSpan={columns.length + (actions.length > 0 ? 1 : 0)}
              className="py-8 text-center"
            >
              <div className="bg-red-500/20 border-l-4 border-red-500 p-4 rounded-lg text-white max-w-md mx-auto">
                <p className="text-sm">Error: {error}</p>
                {onRetry && (
                  <button
                    onClick={onRetry}
                    className="mt-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all duration-300 focus:ring-2 focus:ring-purple-400 focus:outline-none"
                    aria-label="Retry loading data"
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
            <td
              colSpan={columns.length + (actions.length > 0 ? 1 : 0)}
              className="py-8 text-center text-gray-200 text-sm"
            >
              {emptyMessage}
            </td>
          </tr>
        );
      }

      return data.map((item, index) => (
        <tr
          key={index}
          className="border-b border-white/10 hover:bg-white/5 transition-all duration-300"
        >
          {columns.map((column) => (
            <td
              key={String(column.accessor)}
              className={`px-4 py-3 text-sm text-white ${enableHorizontalScroll ? 'whitespace-nowrap' : ''} ${column.className || ''}`}
            >
              {renderCell(item, column)}
            </td>
          ))}
          {actions.length > 0 && (
            <td
              className={`px-4 py-3 text-sm ${enableHorizontalScroll ? 'whitespace-nowrap' : ''}`}
            >
              <div className="flex flex-wrap gap-2">
                {actions
                  .filter(
                    (action) => !action.condition || action.condition(item)
                  )
                  .map((action, idx) => (
                    <button
                      key={idx}
                      onClick={() => action.onClick(item)}
                      className="flex items-center justify-center p-2 bg-white/10 backdrop-blur-lg border border-white/20 rounded-lg hover:bg-white/20 transition-all duration-300 focus:ring-2 focus:ring-purple-400 focus:outline-none"
                      aria-label={action.label}
                      title={action.label}
                    >
                      {getIconForAction(action.label)}
                    </button>
                  ))}
              </div>
            </td>
          )}
        </tr>
      ));
    }, [
      data,
      columns,
      actions,
      isLoading,
      error,
      onRetry,
      emptyMessage,
      renderCell,
      enableHorizontalScroll,
    ]);

    return (
      <>
        <ToastContainer position="top-right" autoClose={3000} theme="dark" />
        <div
          className={`overflow-x-auto ${enableHorizontalScroll ? 'scrollbar-thin scrollbar-thumb-purple-600 scrollbar-track-white/10' : ''}`}
        >
          <table className="min-w-full bg-white/10 backdrop-blur-lg border border-white/20 rounded-lg">
            <thead>
              <tr className="bg-white/5 border-b border-white/20">
                {columns.map((column) => (
                  <th
                    key={String(column.accessor)}
                    className={`px-4 py-3 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider ${enableHorizontalScroll ? 'whitespace-nowrap' : ''} ${column.className || ''}`}
                  >
                    {column.header}
                  </th>
                ))}
                {actions.length > 0 && (
                  <th
                    className={`px-4 py-3 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider ${enableHorizontalScroll ? 'whitespace-nowrap' : ''}`}
                  >
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">{tableContent}</tbody>
          </table>
        </div>
      </>
    );
  }
) as <T>(props: DataTableProps<T>) => React.ReactElement;

export default DataTable;