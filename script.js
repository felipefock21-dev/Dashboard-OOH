// ID da planilha Google
const SHEET_ID = '1H3qFr2if6MdNN4ZZnrMidTq9kNpOdb6OY8ICAS9Gsj4';

// Buscar dados do Google Sheets (via CSV export)
async function fetchSheetData() {
    try {
        // URL para exportar a planilha como CSV
        const csvUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv`;
        
        const response = await fetch(csvUrl);
        if (!response.ok) throw new Error('Erro ao buscar planilha');
        
        const csv = await response.text();
        return parseCSV(csv);
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao carregar dados. Verifique se a planilha está pública.');
        return [];
    }
}

// Parser de CSV simples
function parseCSV(csv) {
    const lines = csv.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const data = [];

    // Encontrar índices das colunas
    const clienteIdx = headers.findIndex(h => h === 'cliente' || h === 'a');
    const statusIdx = headers.findIndex(h => h === 'status cliente' || h === 'status' || h === 'b');
    const cidadeIdx = headers.findIndex(h => h === 'cidade' || h === 'h');
    const exibidoraIdx = headers.findIndex(h => h === 'exibidora' || h === 'i');
    const impactosIdx = headers.findIndex(h => h === 'impactos total' || h === 'impactostotal' || h === 'n');

    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        
        data.push({
            cliente: clienteIdx >= 0 ? values[clienteIdx] || '' : '',
            status: statusIdx >= 0 ? values[statusIdx] || '' : '',
            cidade: cidadeIdx >= 0 ? values[cidadeIdx] || '' : '',
            exibidora: exibidoraIdx >= 0 ? values[exibidoraIdx] || '' : '',
            impactostotal: impactosIdx >= 0 ? parseInt(values[impactosIdx] || '0', 10) : 0
        });
    }

    return data;
}

// Processar dados e calcular métricas
function processMetrics(data) {
    // Filtrar apenas registros com "Status Cliente" ativo
    const activeData = data.filter(item => {
        const status = item.status.toLowerCase().trim();
        return status === 'ativo' || status === 'ativa';
    });

    // KPIs
    const totalImpactos = activeData.reduce((sum, item) => sum + item.impactostotal, 0);
    
    // Clientes Ativos (contagem única de clientes)
    const clientesUnicos = new Set(activeData.map(item => item.cliente));
    const totalClientes = clientesUnicos.size;

    // Praças Ativas (contagem única de cidades ativas)
    const pracasUnicas = new Set(activeData.map(item => item.cidade));
    const totalPracas = pracasUnicas.size;

    // Exibidoras Ativas (contagem única de exibidoras ativas)
    const exibidorasUnicas = new Set(activeData.map(item => item.exibidora));
    const totalExibidoras = exibidorasUnicas.size;

    // === CLIENTES MAIS ATIVOS ===
    // Ranking dos 3 clientes com mais cidades ativas
    const clientesCidades = new Map();
    activeData.forEach(item => {
        if (!clientesCidades.has(item.cliente)) {
            clientesCidades.set(item.cliente, new Set());
        }
        clientesCidades.get(item.cliente).add(item.cidade);
    });

    const clientesMaisAtivos = Array.from(clientesCidades.entries())
        .map(([nome, cidades]) => ({
            nome,
            cidadesAtivas: cidades.size,
            impactos: activeData
                .filter(item => item.cliente === nome)
                .reduce((sum, item) => sum + item.impactostotal, 0)
        }))
        .sort((a, b) => b.cidadesAtivas - a.cidadesAtivas)
        .slice(0, 3);

    // === PRAÇAS MAIS ATIVAS ===
    // Ranking das 3 cidades com mais clientes ativos
    const pracasClientes = new Map();
    activeData.forEach(item => {
        if (!pracasClientes.has(item.cidade)) {
            pracasClientes.set(item.cidade, new Set());
        }
        pracasClientes.get(item.cidade).add(item.cliente);
    });

    const pracasMaisAtivas = Array.from(pracasClientes.entries())
        .map(([nome, clientes]) => ({
            nome,
            clientesAtivos: clientes.size,
            impactos: activeData
                .filter(item => item.cidade === nome)
                .reduce((sum, item) => sum + item.impactostotal, 0)
        }))
        .sort((a, b) => b.clientesAtivos - a.clientesAtivos)
        .slice(0, 3);

    // === EXIBIDORAS MAIS ATIVAS ===
    // Ranking das 3 exibidoras com mais clientes ativos
    const exibidorasClientes = new Map();
    activeData.forEach(item => {
        if (!exibidorasClientes.has(item.exibidora)) {
            exibidorasClientes.set(item.exibidora, new Set());
        }
        exibidorasClientes.get(item.exibidora).add(item.cliente);
    });

    const exibidorasMaisAtivas = Array.from(exibidorasClientes.entries())
        .map(([nome, clientes]) => ({
            nome,
            clientesAtivos: clientes.size,
            impactos: activeData
                .filter(item => item.exibidora === nome)
                .reduce((sum, item) => sum + item.impactostotal, 0)
        }))
        .sort((a, b) => b.clientesAtivos - a.clientesAtivos)
        .slice(0, 3);

    // === RANKING DE IMPACTOS POR CIDADE ===
    // Ranking das 3 cidades com mais impactos totais
    const cidadesImpactos = new Map();
    activeData.forEach(item => {
        if (!cidadesImpactos.has(item.cidade)) {
            cidadesImpactos.set(item.cidade, 0);
        }
        cidadesImpactos.set(item.cidade, cidadesImpactos.get(item.cidade) + item.impactostotal);
    });

    const rankingCidades = Array.from(cidadesImpactos.entries())
        .map(([nome, impactos]) => ({
            nome,
            impactos
        }))
        .sort((a, b) => b.impactos - a.impactos)
        .slice(0, 3);

    return {
        totalImpactos,
        totalClientes,
        totalPracas,
        totalExibidoras,
        clientesMaisAtivos,
        pracasMaisAtivas,
        exibidorasMaisAtivas,
        rankingCidades
    };
}

// Renderizar KPIs
function renderKPIs(metrics) {
    document.getElementById('totalImpactos').textContent = metrics.totalImpactos.toLocaleString('pt-BR');
    document.getElementById('totalClientes').textContent = metrics.totalClientes;
    document.getElementById('totalPracas').textContent = metrics.totalPracas;
    document.getElementById('totalExibidoras').textContent = metrics.totalExibidoras;
}

// Renderizar tabela genérica com 3 linhas
function renderTable(data, elementId) {
    const tbody = document.getElementById(elementId);
    tbody.innerHTML = '';

    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align: center;">Sem dados</td></tr>';
        return;
    }

    data.forEach((item, index) => {
        const tr = document.createElement('tr');
        const impactos = item.impactos || item.cidadesAtivas || item.clientesAtivos || 0;
        const label = item.cidadesAtivas !== undefined ? `${item.cidadesAtivas} cidades` : 
                      item.clientesAtivos !== undefined ? `${item.clientesAtivos} clientes` :
                      impactos.toLocaleString('pt-BR');
        
        tr.innerHTML = `
            <td><strong>${index + 1}</strong></td>
            <td>${item.nome}</td>
            <td>${label}</td>
        `;
        tbody.appendChild(tr);
    });
}

// Atualizar hora de última atualização
function updateTime() {
    // Função removida
}

// Carregar e exibir dados
async function loadDashboard() {
    console.log('Carregando dados...');
    const data = await fetchSheetData();
    
    if (data.length === 0) {
        console.error('Nenhum dado foi carregado');
        return;
    }

    console.log(`${data.length} linhas carregadas`);
    const metrics = processMetrics(data);

    // Renderizar tudo
    renderKPIs(metrics);
    renderTable(metrics.clientesMaisAtivos, 'clientesList');
    renderTable(metrics.pracasMaisAtivas, 'pracasList');
    renderTable(metrics.exibidorasMaisAtivas, 'exibidorasList');
    renderTable(metrics.rankingCidades, 'cidadesList');

    updateTime();
    console.log('Dashboard atualizado!', metrics);
}

// Atualizar a cada 30 segundos
setInterval(loadDashboard, 30000);

// Carregar ao abrir a página
document.addEventListener('DOMContentLoaded', loadDashboard);
