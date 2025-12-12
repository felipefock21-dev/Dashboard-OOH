'use client';

import { useEffect, useState } from 'react';
import useSWR from 'swr';
import { Header, KPICard, DataTable, SimpleBarChart, SimplePieChart } from '@/components';
import { DashboardMetrics } from '@/types';

const fetcher = async () => {
  const response = await fetch('/api/metrics');
  if (!response.ok) throw new Error('Erro ao buscar dados');
  return response.json();
};

export default function DashboardPage() {
  const { data: metrics, error, isLoading } = useSWR<DashboardMetrics>('/api/metrics', fetcher, {
    revalidateOnFocus: false,
    refreshInterval: 30000, // Atualiza a cada 30 segundos
  });

  return (
    <main className="min-h-screen">
      <Header title="Dashboard OOH" lastUpdate={metrics?.ultimaAtualização} />

      <div className="max-w-7xl mx-auto px-6 pb-12">
        {/* KPIs principais */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Métricas Gerais</h2>
          <div className="container-grid">
            <KPICard
              title="Total de Impactos"
              value={metrics?.impactosTotal.toLocaleString('pt-BR') || '0'}
              icon="📊"
              loading={isLoading}
            />
            <KPICard
              title="Clientes Ativos"
              value={metrics?.totalClientes || '0'}
              icon="👥"
              loading={isLoading}
            />
            <KPICard
              title="Praças Ativas"
              value={metrics?.totalPraças || '0'}
              icon="📍"
              loading={isLoading}
            />
            <KPICard
              title="Exibidoras Ativas"
              value={metrics?.totalExibidoras || '0'}
              icon="📺"
              loading={isLoading}
            />
          </div>
        </section>

        {/* Gráficos */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Análises</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <SimpleBarChart
              title="Impactos por Mês"
              data={metrics?.impactosMês || []}
              xKey="mês"
              yKey="impactos"
              color="#10b981"
              loading={isLoading}
            />
            <SimplePieChart
              title="Distribuição por Exibidora"
              data={metrics?.exibidoraMaisAtiva || []}
              nameKey="nome"
              valueKey="impactosTotal"
              loading={isLoading}
            />
          </div>
        </section>

        {/* Tabelas de ranking */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
          <DataTable
            title="🏆 Clientes Mais Ativos"
            columns={[
              { key: 'ranking', label: '#' },
              { key: 'nome', label: 'Cliente' },
              { key: 'impactosTotal', label: 'Impactos', render: (v) => v.toLocaleString('pt-BR') },
            ]}
            data={metrics?.clientesMaisAtivos || []}
            loading={isLoading}
          />
          <DataTable
            title="🎯 Praças Mais Ativas"
            columns={[
              { key: 'ranking', label: '#' },
              { key: 'nome', label: 'Praça' },
              { key: 'impactosTotal', label: 'Impactos', render: (v) => v.toLocaleString('pt-BR') },
            ]}
            data={metrics?.praçasMaisAtivas || []}
            loading={isLoading}
          />
          <DataTable
            title="📺 Exibidoras Mais Ativas"
            columns={[
              { key: 'ranking', label: '#' },
              { key: 'nome', label: 'Exibidora' },
              { key: 'impactosTotal', label: 'Impactos', render: (v) => v.toLocaleString('pt-BR') },
            ]}
            data={metrics?.exibidoraMaisAtiva || []}
            loading={isLoading}
          />
        </section>

        {/* Ranking por Cidade */}
        <section className="mb-8">
          <DataTable
            title="🌍 Ranking de Impactos por Cidade"
            columns={[
              { key: 'ranking', label: '#' },
              { key: 'nome', label: 'Cidade' },
              { key: 'estadoUF', label: 'UF' },
              { key: 'impactosTotal', label: 'Impactos', render: (v) => v.toLocaleString('pt-BR') },
              { key: 'campanhasAtivas', label: 'Campanhas' },
            ]}
            data={metrics?.rankingPorCidade || []}
            loading={isLoading}
            maxRows={20}
          />
        </section>

        {error && (
          <div className="bg-red-900 text-red-100 p-4 rounded-lg mb-4">
            <p className="font-bold">Erro ao carregar dados</p>
            <p>{error.message}</p>
          </div>
        )}
      </div>
    </main>
  );
}
