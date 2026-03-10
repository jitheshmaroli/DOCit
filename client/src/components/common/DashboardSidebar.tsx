import React from 'react';
import { Link } from 'react-router-dom';
import { LucideIcon } from 'lucide-react';

export interface SidebarNavItem {
  key: string;
  label: string;
  route: string;
  icon: LucideIcon;
}

interface DashboardSidebarProps {
  items: SidebarNavItem[];
  activePage: string;
  onClose?: () => void;
  sectionLabel?: string;
}

const DashboardSidebar: React.FC<DashboardSidebarProps> = ({
  items,
  activePage,
  onClose,
  sectionLabel = 'Navigation',
}) => {
  const isActive = (item: SidebarNavItem) => {
    const segment = item.route.split('/')[2];
    return activePage === segment || activePage === item.key;
  };

  return (
    <nav className="flex-1 py-4 overflow-y-auto">
      <p className="px-5 mb-2 text-[10px] font-semibold text-text-muted uppercase tracking-widest">
        {sectionLabel}
      </p>
      <ul className="space-y-0.5 px-3">
        {items.map((item) => {
          const active = isActive(item);
          const Icon = item.icon;
          return (
            <li key={item.key}>
              <Link
                to={item.route}
                onClick={onClose}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  active
                    ? 'bg-primary-50 text-primary-700 shadow-sm'
                    : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
                }`}
              >
                <Icon
                  size={17}
                  className={active ? 'text-primary-600' : 'text-text-muted'}
                />
                {item.label}
                {active && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-500" />
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default DashboardSidebar;
