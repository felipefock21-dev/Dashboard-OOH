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

    console.log('Headers encontrados:', headers);

    // Encontrar índices das colunas (busca flexível)
    let clienteIdx = -1, statusIdx = -1, cidadeIdx = -1, exibidoraIdx = -1, impactosIdx = -1;
    
    headers.forEach((h, idx) => {
        if (h.includes('cliente') && !h.includes('status')) clienteIdx = idx;
        if (h.includes('status cliente')) statusIdx = idx;  // ESPECÍFICO: "status cliente"
        if (h.includes('cidade') || h.includes('praca')) cidadeIdx = idx;
        if (h.includes('exibidora') || h.includes('emissor')) exibidoraIdx = idx;
        if (h.includes('impacto')) impactosIdx = idx;
    });

    console.log('Índices encontrados:', { clienteIdx, statusIdx, cidadeIdx, exibidoraIdx, impactosIdx });

    for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue; // Pular linhas vazias
        
        const values = lines[i].split(',').map(v => v.trim());
        
        const item = {
            cliente: clienteIdx >= 0 ? values[clienteIdx] || '' : '',
            status: statusIdx >= 0 ? values[statusIdx] || '' : '',
            cidade: cidadeIdx >= 0 ? values[cidadeIdx] || '' : '',
            exibidora: exibidoraIdx >= 0 ? values[exibidoraIdx] || '' : '',
            impactostotal: impactosIdx >= 0 ? parseInt(values[impactosIdx] || '0', 10) : 0
        };
        
        data.push(item);
    }

    console.log('Primeiros 5 registros parseados:', data.slice(0, 5));
    return data;
}

// Processar dados e calcular métricas
function processMetrics(data) {
    console.log('=== PROCESSANDO MÉTRICAS ===');
    console.log('Total de linhas carregadas:', data.length);
    
    // Filtrar apenas registros com "Status Cliente" = ATIVA
    const activeData = data.filter(item => {
        const status = item.status.toLowerCase().trim();
        const isActive = status === 'ativo' || status === 'ativa' || status === 'a';
        return isActive;
    });
    
    console.log('Linhas com status ATIVA:', activeData.length);
    console.log('Exemplos de status encontrados:', [...new Set(data.map(item => item.status.trim()).slice(0, 10))]);
    console.log('Primeiras linhas ativas:', activeData.slice(0, 3));

    // KPIs
    const totalImpactos = activeData.reduce((sum, item) => sum + item.impactostotal, 0);
    console.log('Total de impactos calculado:', totalImpactos);
    
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
    // Ranking dos 3 clientes com mais CIDADES DIFERENTES ativas
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
    // Ranking das 3 cidades com mais CLIENTES DIFERENTES ativos
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
    // Ranking das 3 exibidoras com mais CIDADES DIFERENTES ativas
    const exibidorasCidades = new Map();
    activeData.forEach(item => {
        if (!exibidorasCidades.has(item.exibidora)) {
            exibidorasCidades.set(item.exibidora, new Set());
        }
        exibidorasCidades.get(item.exibidora).add(item.cidade);
    });

    const exibidorasMaisAtivas = Array.from(exibidorasCidades.entries())
        .map(([nome, cidades]) => ({
            nome,
            cidadesAtivas: cidades.size,
            impactos: activeData
                .filter(item => item.exibidora === nome)
                .reduce((sum, item) => sum + item.impactostotal, 0)
        }))
        .sort((a, b) => b.cidadesAtivas - a.cidadesAtivas)
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
        
        // Determina qual valor mostrar baseado no que tem
        let valor = '';
        if (item.cidadesAtivas !== undefined) {
            valor = `${item.cidadesAtivas} cidades`;
        } else if (item.clientesAtivos !== undefined) {
            valor = `${item.clientesAtivos} clientes`;
        } else {
            valor = item.impactos.toLocaleString('pt-BR');
        }
        
        tr.innerHTML = `
            <td><strong>${index + 1}</strong></td>
            <td>${item.nome}</td>
            <td>${valor}</td>
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

    console.log('Métricas calculadas:', metrics);

    // Renderizar tudo
    renderKPIs(metrics);
    renderTable(metrics.clientesMaisAtivos, 'clientesList');
    renderTable(metrics.pracasMaisAtivas, 'pracasList');
    renderTable(metrics.exibidorasMaisAtivas, 'exibidorasList');
    renderTable(metrics.rankingCidades, 'cidadesList');
    
    // Carregar mapa com dados
    loadMap(data);

    updateTime();
    console.log('Dashboard atualizado!', metrics);
}

// Inicializar mapa do Brasil (estático em SVG)
let mapLoaded = false;

function loadMap(data) {
    // Apenas inicializa uma vez
    if (mapLoaded) return;
    mapLoaded = true;
    
    fetch('BRASIL.kml')
        .then(response => response.text())
        .then(kmlText => {
            const parser = new DOMParser();
            const kmlDom = parser.parseFromString(kmlText, 'text/xml');
            const geoJson = toGeoJSON.kml(kmlDom);
            
            const svg = document.getElementById('mapasvg');
            
            // Função para converter coordenadas geográficas para SVG
            function latLngToSvg(lat, lng) {
                const scale = 40;
                const x = (lng + 75) * scale + 50;
                const y = (lat * -1 + 12) * scale + 50;
                return { x, y };
            }
            
            // Renderizar features do GeoJSON
            geoJson.features.forEach(feature => {
                if (feature.geometry.type === 'Polygon') {
                    feature.geometry.coordinates[0].forEach((coord, idx) => {
                        const pos = latLngToSvg(coord[1], coord[0]);
                        
                        const path = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                        path.setAttribute('cx', pos.x);
                        path.setAttribute('cy', pos.y);
                        path.setAttribute('r', '2');
                        path.setAttribute('fill', '#5a5fff');
                        svg.appendChild(path);
                    });
                }
            });
            
            console.log('Mapa do Brasil carregado como SVG');
        })
        .catch(error => console.error('Erro ao carregar KML:', error));
}

// Atualizar a cada 30 segundos
setInterval(loadDashboard, 30000);

// Carregar ao abrir a página
document.addEventListener('DOMContentLoaded', loadDashboard);
