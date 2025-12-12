import React from 'react';

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: number;
  loading?: boolean;
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  loading = false,
}) => {
  return (
    <div className="card">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <p className="card-title">{title}</p>
          <div className="card-value">{loading ? '...' : value}</div>
          {subtitle && <p className="card-subtitle">{subtitle}</p>}
        </div>
        {icon && <div className="text-2xl opacity-50">{icon}</div>}
      </div>
      {trend !== undefined && (
        <div className={`text-sm mt-2 ${trend >= 0 ? 'text-success' : 'text-danger'}`}>
          {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
        </div>
      )}
    </div>
  );
};
