import { OOHData, DashboardMetrics, GoogleSheetsRow } from '@/types';

// Função para buscar dados do Google Sheets via API pública (CSV export)
export async function fetchGoogleSheetsData(): Promise<OOHData[]> {
  try {
    const sheetId = process.env.NEXT_PUBLIC_GOOGLE_SHEETS_ID;
    
    // Exportar como CSV
    const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
    
    const response = await fetch(csvUrl);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const csv = await response.text();
    const data = parseCSV(csv);
    
    return data;
  } catch (error) {
    console.error('Erro ao buscar dados do Google Sheets:', error);
    return [];
  }
}

// Parser de CSV simples
function parseCSV(csv: string): OOHData[] {
  const lines = csv.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const data: OOHData[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    
    const row: GoogleSheetsRow = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });

    // Mapear dados da planilha para nossa interface
    const oohData: OOHData = {
      id: `${row.cliente}-${row.praca}-${i}`,
      cliente: row.cliente || '',
      praca: row.praca || '',
      exibidora: row.exibidora || '',
      impactos: parseInt(row.impactos || '0', 10),
      mesReferencia: row.mes || new Date().toISOString().slice(0, 7),
      ativo: row.ativo !== 'false' && row.ativo !== '0',
    };

    data.push(oohData);
  }

  return data;
}

// Processar dados brutos para métricas de dashboard
export function processDashboardMetrics(data: OOHData[]): DashboardMetrics {
  const clienteMap = new Map<string, any>();
  const pracaMap = new Map<string, any>();
  const exibidoraMap = new Map<string, any>();
  const impactoPorMes = new Map<string, number>();

  // Processar dados
  data.forEach((item) => {
    if (!item.ativo) return;

    // Clientes
    if (!clienteMap.has(item.cliente)) {
      clienteMap.set(item.cliente, {
        nome: item.cliente,
        impactosTotal: 0,
        campanhasAtivas: new Set(),
        praçasAtuantes: new Set(),
      });
    }
    const cliente = clienteMap.get(item.cliente);
    cliente.impactosTotal += item.impactos;
    cliente.campanhasAtivas.add(item.id);
    cliente.praçasAtuantes.add(item.praca);

    // Praças
    if (!pracaMap.has(item.praca)) {
      pracaMap.set(item.praca, {
        nome: item.praca,
        estadoUF: extractState(item.praca),
        impactosTotal: 0,
        exibidorasAtivas: new Set(),
        campanhasAtivas: new Set(),
      });
    }
    const praca = pracaMap.get(item.praca);
    praca.impactosTotal += item.impactos;
    praca.exibidorasAtivas.add(item.exibidora);
    praca.campanhasAtivas.add(item.id);

    // Exibidoras
    if (!exibidoraMap.has(item.exibidora)) {
      exibidoraMap.set(item.exibidora, {
        nome: item.exibidora,
        impactosTotal: 0,
        campanhasAtivas: new Set(),
        praçasAtuantes: new Set(),
      });
    }
    const exibidora = exibidoraMap.get(item.exibidora);
    exibidora.impactosTotal += item.impactos;
    exibidora.campanhasAtivas.add(item.id);
    exibidora.praçasAtuantes.add(item.praca);

    // Impactos por mês
    const mes = item.mesReferencia;
    impactoPorMes.set(mes, (impactoPorMes.get(mes) || 0) + item.impactos);
  });

  // Converter Sets para counts e criar arrays
  const clientesMaisAtivos = Array.from(clienteMap.values())
    .map((c) => ({
      ...c,
      campanhasAtivas: c.campanhasAtivas.size,
      praçasAtuantes: c.praçasAtuantes.size,
    }))
    .sort((a, b) => b.impactosTotal - a.impactosTotal)
    .map((c, idx) => ({ ...c, ranking: idx + 1 }))
    .slice(0, 5);

  const praçasMaisAtivas = Array.from(pracaMap.values())
    .map((p) => ({
      ...p,
      exibidorasAtivas: p.exibidorasAtivas.size,
      campanhasAtivas: p.campanhasAtivas.size,
    }))
    .sort((a, b) => b.impactosTotal - a.impactosTotal)
    .map((p, idx) => ({ ...p, ranking: idx + 1 }))
    .slice(0, 5);

  const exibidoraMaisAtiva = Array.from(exibidoraMap.values())
    .map((e) => ({
      ...e,
      campanhasAtivas: e.campanhasAtivas.size,
      praçasAtuantes: e.praçasAtuantes.size,
    }))
    .sort((a, b) => b.impactosTotal - a.impactosTotal)
    .map((e, idx) => ({ ...e, ranking: idx + 1 }))
    .slice(0, 5);

  const impactosMês = Array.from(impactoPorMes.entries())
    .map(([mês, impactos]) => ({ mês, impactos }))
    .sort((a, b) => a.mês.localeCompare(b.mês))
    .slice(-6); // Últimos 6 meses

  return {
    clientesMaisAtivos,
    praçasMaisAtivas,
    exibidoraMaisAtiva,
    impactosMês,
    rankingPorCidade: praçasMaisAtivas,
    totalClientes: clienteMap.size,
    totalPraças: pracaMap.size,
    totalExibidoras: exibidoraMap.size,
    impactosTotal: Array.from(impactoPorMes.values()).reduce((a, b) => a + b, 0),
    ultimaAtualização: new Date(),
  };
}

// Extrair estado/UF da praça (assumindo formato "Cidade, UF" ou similar)
function extractState(praca: string): string {
  const parts = praca.split(',');
  return parts.length > 1 ? parts[1].trim().toUpperCase() : '';
}
