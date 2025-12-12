import React from 'react';

interface HeaderProps {
  title: string;
  lastUpdate?: Date;
}

export const Header: React.FC<HeaderProps> = ({ title, lastUpdate }) => {
  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(date);
  };

  return (
    <header className="bg-gradient-to-r from-slate-900 to-slate-800 border-b border-slate-700 py-6 px-6 mb-8">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">{title}</h1>
          <p className="text-slate-400">Monitoramento em tempo real</p>
        </div>
        {lastUpdate && (
          <div className="text-right">
            <p className="text-sm text-slate-400 mb-1">Última atualização</p>
            <p className="text-lg text-green-400 font-mono">{formatTime(lastUpdate)}</p>
          </div>
        )}
      </div>
    </header>
  );
};
