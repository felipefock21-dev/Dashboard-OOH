export interface OOHData {
  id: string;
  cliente: string;
  praca: string;
  exibidora: string;
  impactos: number;
  mesReferencia: string;
  ativo: boolean;
}

export interface ClienteMetrics {
  nome: string;
  impactosTotal: number;
  campanhasAtivas: number;
  praçasAtuantes: number;
  ranking: number;
}

export interface PraçaMetrics {
  nome: string;
  estadoUF: string;
  impactosTotal: number;
  exibidorasAtivas: number;
  campanhasAtivas: number;
  ranking: number;
}

export interface ExibidoraMetrics {
  nome: string;
  impactosTotal: number;
  campanhasAtivas: number;
  praçasAtuantes: number;
  ranking: number;
}

export interface DashboardMetrics {
  clientesMaisAtivos: ClienteMetrics[];
  praçasMaisAtivas: PraçaMetrics[];
  exibidoraMaisAtiva: ExibidoraMetrics[];
  impactosMês: { mês: string; impactos: number }[];
  rankingPorCidade: PraçaMetrics[];
  totalClientes: number;
  totalPraças: number;
  totalExibidoras: number;
  impactosTotal: number;
  ultimaAtualização: Date;
}

export interface GoogleSheetsRow {
  [key: string]: any;
}
