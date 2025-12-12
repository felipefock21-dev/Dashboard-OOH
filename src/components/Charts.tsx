import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface ChartData {
  name: string;
  value: number;
  [key: string]: any;
}

interface BarChartProps {
  data: ChartData[];
  title: string;
  xKey: string;
  yKey: string;
  color?: string;
  loading?: boolean;
}

interface PieChartProps {
  data: ChartData[];
  title: string;
  nameKey: string;
  valueKey: string;
  loading?: boolean;
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export const SimpleBarChart: React.FC<BarChartProps> = ({
  data,
  title,
  xKey,
  yKey,
  color = '#3b82f6',
  loading = false,
}) => {
  if (loading) {
    return <div className="card h-80 animate-pulse bg-slate-700" />;
  }

  return (
    <div className="card">
      <h3 className="card-title mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
          <XAxis dataKey={xKey} stroke="#94a3b8" />
          <YAxis stroke="#94a3b8" />
          <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }} />
          <Bar dataKey={yKey} fill={color} radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export const SimplePieChart: React.FC<PieChartProps> = ({
  data,
  title,
  nameKey,
  valueKey,
  loading = false,
}) => {
  if (loading) {
    return <div className="card h-80 animate-pulse bg-slate-700" />;
  }

  const chartData = data.map((item) => ({
    name: item[nameKey],
    value: item[valueKey],
  }));

  return (
    <div className="card">
      <h3 className="card-title mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie data={chartData} cx="50%" cy="50%" labelLine={false} label={{ fill: '#e2e8f0' }} outerRadius={80} fill="#8884d8" dataKey="value">
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
