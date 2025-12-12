import { NextResponse } from 'next/server';
import { fetchGoogleSheetsData, processDashboardMetrics } from '@/utils/sheets';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    // Buscar dados do Google Sheets
    const data = await fetchGoogleSheetsData();

    // Processar e agregar dados
    const metrics = processDashboardMetrics(data);

    // Retornar com cache de 30 segundos (SWR irá respeitar)
    return NextResponse.json(metrics, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Erro ao processar métricas:', error);
    return NextResponse.json(
      { error: 'Erro ao processar dados' },
      { status: 500 }
    );
  }
}
