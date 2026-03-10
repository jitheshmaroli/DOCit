import React, { useMemo, useCallback } from 'react';
import {
  Loader2,
  AlertCircle,
  RefreshCw,
  Edit2,
  Trash2,
  Ban,
  Eye,
  UserPlus,
  BadgeCheck,
  CheckCircle2,
  XCircle,
  InboxIcon,
} from 'lucide-react';

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

type ActionIcon = {
  icon: React.ElementType;
  hoverColor: string; // color shown on hover
  hoverBg: string; // background shown on hover
};

const ACTION_ICON_MAP: Record<string, ActionIcon> = {
  Edit: {
    icon: Edit2,
    hoverColor: 'group-hover/btn:text-primary-600',
    hoverBg: 'bg-primary-50   hover:bg-primary-100',
  },
  Delete: {
    icon: Trash2,
    hoverColor: 'group-hover/btn:text-error',
    hoverBg: 'bg-red-50       hover:bg-red-100',
  },
  Block: {
    icon: Ban,
    hoverColor: 'group-hover/btn:text-warning',
    hoverBg: 'bg-amber-50     hover:bg-amber-100',
  },
  Unblock: {
    icon: Ban,
    hoverColor: 'group-hover/btn:text-success',
    hoverBg: 'bg-emerald-50   hover:bg-emerald-100',
  },
  'View Details': {
    icon: Eye,
    hoverColor: 'group-hover/btn:text-teal-600',
    hoverBg: 'bg-teal-50      hover:bg-teal-100',
  },
  'Add User': {
    icon: UserPlus,
    hoverColor: 'group-hover/btn:text-primary-600',
    hoverBg: 'bg-primary-50   hover:bg-primary-100',
  },
  Verify: {
    icon: BadgeCheck,
    hoverColor: 'group-hover/btn:text-success',
    hoverBg: 'bg-emerald-50   hover:bg-emerald-100',
  },
  Approve: {
    icon: CheckCircle2,
    hoverColor: 'group-hover/btn:text-success',
    hoverBg: 'bg-emerald-50   hover:bg-emerald-100',
  },
  Reject: {
    icon: XCircle,
    hoverColor: 'group-hover/btn:text-error',
    hoverBg: 'bg-red-50       hover:bg-red-100',
  },
  Cancel: {
    icon: XCircle,
    hoverColor: 'group-hover/btn:text-error',
    hoverBg: 'bg-red-50       hover:bg-red-100',
  },
};

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
    const colSpan = columns.length + (actions.length > 0 ? 1 : 0);

    const renderCell = useCallback((item: T, column: Column<T>) => {
      if (typeof column.accessor === 'function') return column.accessor(item);
      const value = item[column.accessor];
      return value != null ? (
        String(value)
      ) : (
        <span className="text-text-muted">—</span>
      );
    }, []);

    type Action = NonNullable<DataTableProps<T>['actions']>[number];

    const renderActionButton = useCallback(
      (action: Action, item: T, idx: number) => {
        const config = ACTION_ICON_MAP[action.label];
        const Icon = config?.icon;
        return (
          <button
            key={idx}
            onClick={() => action.onClick(item)}
            className={`group/btn p-2 rounded-xl border border-surface-border transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 ${config?.hoverBg || 'bg-surface-muted hover:bg-surface-hover'} ${action.className || ''}`}
            aria-label={action.label}
            title={action.label}
          >
            {Icon ? (
              <Icon
                size={16}
                className={`text-text-muted transition-colors duration-150 ${config?.hoverColor || ''}`}
              />
            ) : (
              <span className="text-xs font-medium text-text-secondary">
                {action.label}
              </span>
            )}
          </button>
        );
      },
      []
    );

    const tableContent = useMemo(() => {
      if (isLoading) {
        return (
          <tr>
            <td colSpan={colSpan} className="py-16 text-center">
              <div className="flex flex-col items-center gap-3">
                <Loader2 size={28} className="animate-spin text-primary-500" />
                <p className="text-sm text-text-muted">Loading data...</p>
              </div>
            </td>
          </tr>
        );
      }

      if (error) {
        return (
          <tr>
            <td colSpan={colSpan} className="py-12 text-center">
              <div className="flex flex-col items-center gap-3 max-w-sm mx-auto">
                <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center">
                  <AlertCircle size={22} className="text-error" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-text-primary mb-1">
                    Something went wrong
                  </p>
                  <p className="text-xs text-text-muted">{error}</p>
                </div>
                {onRetry && (
                  <button
                    onClick={onRetry}
                    className="btn-secondary flex items-center gap-2 text-sm"
                  >
                    <RefreshCw size={14} /> Try again
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
            <td colSpan={colSpan} className="py-16 text-center">
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-surface-muted flex items-center justify-center">
                  <InboxIcon size={22} className="text-text-muted" />
                </div>
                <p className="text-sm text-text-secondary">{emptyMessage}</p>
              </div>
            </td>
          </tr>
        );
      }

      return data.map((item, index) => (
        <tr key={index} className="tr group">
          {columns.map((column, colIdx) => (
            <td
              key={colIdx}
              className={`td ${enableHorizontalScroll ? 'whitespace-nowrap' : ''} ${column.className || ''}`}
            >
              {renderCell(item, column)}
            </td>
          ))}
          {actions.length > 0 && (
            <td
              className={`td ${enableHorizontalScroll ? 'whitespace-nowrap' : ''}`}
            >
              <div className="flex items-center gap-1.5">
                {actions
                  .filter((a) => !a.condition || a.condition(item))
                  .map((action, idx) => renderActionButton(action, item, idx))}
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
      renderActionButton,
      enableHorizontalScroll,
      colSpan,
    ]);

    return (
      <div
        className={`overflow-x-auto ${enableHorizontalScroll ? 'scrollbar-thin scrollbar-thumb-surface-border scrollbar-track-transparent' : ''}`}
      >
        <table className="min-w-full">
          <thead>
            <tr className="bg-surface-bg border-b border-surface-border">
              {columns.map((column, idx) => (
                <th
                  key={idx}
                  className={`th ${enableHorizontalScroll ? 'whitespace-nowrap' : ''} ${column.className || ''}`}
                >
                  {column.header}
                </th>
              ))}
              {actions.length > 0 && (
                <th
                  className={`th ${enableHorizontalScroll ? 'whitespace-nowrap' : ''}`}
                >
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody>{tableContent}</tbody>
        </table>
      </div>
    );
  }
) as <T>(props: DataTableProps<T>) => React.ReactElement;

export default DataTable;
