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

    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        
        const row = {};
        headers.forEach((header, index) => {
            row[header] = values[index] || '';
        });

        data.push({
            cliente: row.cliente || '',
            praca: row.praca || '',
            exibidora: row.exibidora || '',
            impactos: parseInt(row.impactos || '0', 10),
            mes: row.mes || new Date().toISOString().slice(0, 7),
            ativo: row.ativo !== 'false' && row.ativo !== '0'
        });
    }

    return data;
}

// Processar dados e calcular métricas
function processMetrics(data) {
    const clienteMap = new Map();
    const pracaMap = new Map();
    const exibidoraMap = new Map();

    // Filtrar dados ativos
    const activeData = data.filter(item => item.ativo);

    activeData.forEach(item => {
        // Clientes
        if (!clienteMap.has(item.cliente)) {
            clienteMap.set(item.cliente, { nome: item.cliente, impactos: 0 });
        }
        clienteMap.get(item.cliente).impactos += item.impactos;

        // Praças
        if (!pracaMap.has(item.praca)) {
            pracaMap.set(item.praca, { nome: item.praca, impactos: 0 });
        }
        pracaMap.get(item.praca).impactos += item.impactos;

        // Exibidoras
        if (!exibidoraMap.has(item.exibidora)) {
            exibidoraMap.set(item.exibidora, { nome: item.exibidora, impactos: 0 });
        }
        exibidoraMap.get(item.exibidora).impactos += item.impactos;
    });

    // Converter para arrays e ordenar
    const clientes = Array.from(clienteMap.values())
        .sort((a, b) => b.impactos - a.impactos)
        .slice(0, 10);

    const pracas = Array.from(pracaMap.values())
        .sort((a, b) => b.impactos - a.impactos)
        .slice(0, 10);

    const exibidoras = Array.from(exibidoraMap.values())
        .sort((a, b) => b.impactos - a.impactos)
        .slice(0, 10);

    // Extrair estado da praça (assumindo formato "Cidade, UF")
    const cidadesComUF = pracas.map(praca => {
        const parts = praca.nome.split(',');
        return {
            ...praca,
            cidade: parts[0].trim(),
            uf: parts.length > 1 ? parts[1].trim().toUpperCase() : 'XX'
        };
    });

    return {
        totalImpactos: activeData.reduce((sum, item) => sum + item.impactos, 0),
        totalClientes: clienteMap.size,
        totalPracas: pracaMap.size,
        totalExibidoras: exibidoraMap.size,
        clientes,
        pracas,
        exibidoras,
        cidades: cidadesComUF
    };
}

// Renderizar KPIs
function renderKPIs(metrics) {
    document.getElementById('totalImpactos').textContent = metrics.totalImpactos.toLocaleString('pt-BR');
    document.getElementById('totalClientes').textContent = metrics.totalClientes;
    document.getElementById('totalPracas').textContent = metrics.totalPracas;
    document.getElementById('totalExibidoras').textContent = metrics.totalExibidoras;
}

// Renderizar tabela genérica
function renderTable(data, elementId, maxRows = 10) {
    const tbody = document.getElementById(elementId);
    tbody.innerHTML = '';

    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align: center;">Sem dados</td></tr>';
        return;
    }

    data.slice(0, maxRows).forEach((item, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${index + 1}</strong></td>
            <td>${item.nome || item.cidade}</td>
            <td>${item.impactos.toLocaleString('pt-BR')}</td>
        `;
        tbody.appendChild(tr);
    });
}

// Renderizar tabela de cidades (com UF)
function renderCidadesTable(data) {
    const tbody = document.getElementById('cidadesList');
    tbody.innerHTML = '';

    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center;">Sem dados</td></tr>';
        return;
    }

    data.forEach((item, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${index + 1}</strong></td>
            <td>${item.cidade}</td>
            <td>${item.uf}</td>
            <td>${item.impactos.toLocaleString('pt-BR')}</td>
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
    renderTable(metrics.clientes, 'clientesList', 10);
    renderTable(metrics.pracas, 'pracasList', 10);
    renderTable(metrics.exibidoras, 'exibidorasList', 10);
    renderCidadesTable(metrics.cidades);

    updateTime();
    console.log('Dashboard atualizado!');
}

// Atualizar a cada 30 segundos
setInterval(loadDashboard, 30000);

// Carregar ao abrir a página
document.addEventListener('DOMContentLoaded', loadDashboard);
