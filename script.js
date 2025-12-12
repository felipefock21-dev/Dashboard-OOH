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

// Coordenadas das principais cidades do Brasil
const CITY_COORDINATES = {
    'são paulo': [-23.5505, -46.6333],
    'rio de janeiro': [-22.9068, -43.1729],
    'belo horizonte': [-19.9191, -43.9386],
    'brasília': [-15.8267, -47.8822],
    'salvador': [-12.9714, -38.5014],
    'fortaleza': [-3.7275, -38.5275],
    'recife': [-8.0476, -34.8770],
    'manaus': [-3.1190, -60.0217],
    'belém': [-1.4554, -48.5038],
    'curitiba': [-25.4284, -49.2733],
    'porto alegre': [-30.0331, -51.2304],
    'goiânia': [-15.8904, -48.9876],
    'são luis': [-2.5298, -44.3045],
    'natal': [-5.7942, -35.2110],
    'teresina': [-5.0892, -42.8019],
    'joão pessoa': [-7.1150, -34.8450],
    'maceió': [-9.6498, -35.7348],
    'aracaju': [-10.9111, -37.0705],
    'vitória': [-20.3155, -40.3128],
    'campo grande': [-20.4697, -54.6201],
    'cuiabá': [-15.5939, -56.0912],
    'porto velho': [-8.7619, -63.9039],
    'boa vista': [2.8235, -60.6743],
    'macapá': [0.3889, -51.4925],
    'rio branco': [-9.9754, -67.8077],
    'palmas': [-10.2090, -48.3239],
    'campinas': [-22.8952, -47.0467],
    'santos': [-23.9608, -46.3338],
    'sorocaba': [-23.5006, -47.4589],
    'ribeirão preto': [-21.1758, -47.8102],
    'guarulhos': [-23.4628, -46.4829],
    'osasco': [-23.5340, -46.7922],
    'abc paulista': [-23.6981, -46.5644],
    'santo andré': [-23.6681, -46.5348],
    'são bernardo do campo': [-23.6944, -46.5644],
    'diadema': [-23.6885, -46.6131],
    'jundiaí': [-23.1905, -46.8840],
    'piracicaba': [-22.7298, -47.6405],
    'limeira': [-22.5643, -47.4128],
    'araçatuba': [-21.2010, -50.4368],
    'presidente prudente': [-22.1230, -51.4605],
    'marília': [-22.2141, -49.9589],
    'londrina': [-23.3045, -51.1696],
    'maringá': [-23.4250, -51.4693],
    'ponta grossa': [-25.0955, -50.1646],
    'cascavel': [-24.9542, -53.4551],
    'foz do iguaçu': [-25.5051, -54.5753],
    'blumenau': [-26.8791, -49.0629],
    'joinville': [-26.3045, -48.8487],
    'brasília-df': [-15.8267, -47.8822],
    'df': [-15.8267, -47.8822],
};

let mapInstance = null;
let markersLayer = null;

// Inicializar mapa
function initMap() {
    if (mapInstance) return;

    mapInstance = L.map('mapContainer').setView([-14.2350, -51.9253], 4);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
    }).addTo(mapInstance);

    markersLayer = L.featureGroup().addTo(mapInstance);
}

// Renderizar mapa com praças ativas
function renderMap(data) {
    if (!mapInstance) initMap();

    markersLayer.clearLayers();

    // Agrupar dados por cidade e contar impactos
    const cityData = {};
    
    data.forEach(item => {
        const cidade = item.cidade.toLowerCase().trim();
        if (!cityData[cidade]) {
            cityData[cidade] = { impactos: 0, clientes: new Set(), exibidoras: new Set() };
        }
        cityData[cidade].impactos += item.impactos;
        if (item.cliente) cityData[cidade].clientes.add(item.cliente);
        if (item.exibidora) cityData[cidade].exibidoras.add(item.exibidora);
    });

    // Plotar markers no mapa
    Object.entries(cityData).forEach(([cidade, dados]) => {
        const coords = CITY_COORDINATES[cidade];
        if (!coords) return;

        const marker = L.circleMarker(coords, {
            radius: Math.min(20, 8 + Math.log(dados.impactos) * 2),
            fillColor: '#5a5fff',
            color: '#0ea5e9',
            weight: 2,
            opacity: 0.8,
            fillOpacity: 0.6,
        });

        const popupText = `
            <div style="font-weight: bold; margin-bottom: 8px;">${cidade.toUpperCase()}</div>
            <div>Impactos: <strong>${dados.impactos.toLocaleString('pt-BR')}</strong></div>
            <div>Clientes: <strong>${dados.clientes.size}</strong></div>
            <div>Exibidoras: <strong>${dados.exibidoras.size}</strong></div>
        `;

        marker.bindPopup(popupText);
        marker.addTo(markersLayer);
    });

    mapInstance.fitBounds(markersLayer.getBounds(), { padding: [50, 50] });
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
    
    // Renderizar mapa com dados ativos
    const activeData = data.filter(item => item.status.toUpperCase() === 'ATIVA');
    renderMap(activeData);

    updateTime();
    console.log('Dashboard atualizado!', metrics);
}

// Atualizar a cada 30 segundos
setInterval(loadDashboard, 30000);

// Carregar ao abrir a página
document.addEventListener('DOMContentLoaded', loadDashboard);
