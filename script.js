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

// Renderizar KPIs (4 métricas principais)
function renderKPIs(metrics) {
    document.getElementById('totalImpactos').textContent = metrics.totalImpactos.toLocaleString('pt-BR');
    document.getElementById('totalClientes').textContent = metrics.totalClientes;
    document.getElementById('totalPracas').textContent = metrics.totalPracas;
    document.getElementById('totalExibidoras').textContent = metrics.totalExibidoras;
}

// Renderizar itens de ranking em cards
function renderRankingList(data, elementId) {
    const container = document.getElementById(elementId);
    container.innerHTML = '';

    if (data.length === 0) {
        container.innerHTML = '<div class="loading">Sem dados</div>';
        return;
    }

    data.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'ranking-item';
        
        // Determina qual valor mostrar baseado no que tem
        let valor = '';
        if (item.cidadesAtivas !== undefined) {
            valor = `${item.cidadesAtivas} cidades`;
        } else if (item.clientesAtivos !== undefined) {
            valor = `${item.clientesAtivos} clientes`;
        } else {
            valor = item.impactos.toLocaleString('pt-BR');
        }
        
        div.innerHTML = `
            <span class="ranking-item-posicao">#${index + 1}</span>
            <span class="ranking-item-nome">${item.nome}</span>
            <span class="ranking-item-valor">${valor}</span>
        `;
        container.appendChild(div);
    });
}

// Renderizar check-ins recentes na lateral do mapa
function renderCheckinsRecentes(data) {
    const container = document.getElementById('lista-checkins-lateral');
    if (!container) return;
    
    container.innerHTML = '';

    // Filtrar dados ativos e ordenar por último (pegamos últimos 10)
    const activeData = data.filter(item => {
        const status = item.status.toLowerCase().trim();
        return status === 'ativo' || status === 'ativa' || status === 'a';
    });

    if (activeData.length === 0) {
        container.innerHTML = '<div class="loading">Sem check-ins</div>';
        return;
    }

    // Pegar os últimos registros (inversão da ordem)
    const checkinsRecentes = activeData.slice(-10).reverse();

    checkinsRecentes.forEach((item) => {
        const div = document.createElement('div');
        div.className = 'checkin-item';
        
        div.innerHTML = `
            <div class="checkin-header">
                <span class="checkin-cliente">${item.cliente || 'N/A'}</span>
                <span class="checkin-hora">Agora</span>
            </div>
            <div class="checkin-praca">${item.cidade || 'N/A'}</div>
            <div class="checkin-exibidora">${item.exibidora || 'N/A'}</div>
        `;
        container.appendChild(div);
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

    // Renderizar KPIs (4 métricas principais)
    renderKPIs(metrics);
    
    // Renderizar os 4 rankings em cards
    renderRankingList(metrics.clientesMaisAtivos, 'ranking-clientes');
    renderRankingList(metrics.pracasMaisAtivas, 'ranking-pracas');
    renderRankingList(metrics.exibidorasMaisAtivas, 'ranking-exibidoras');
    renderRankingList(metrics.rankingCidades, 'ranking-cidades');
    
    // Renderizar check-ins recentes ao lado do mapa
    renderCheckinsRecentes(data);
    
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
    
    const svg = document.getElementById('mapasvg');
    
    // Usar SVG do Brasil pré-definido com qualidade
    fetch('https://raw.githubusercontent.com/brunocs/brasil-geojson/master/brasil.json')
        .then(response => response.json())
        .then(geojson => {
            renderBrazilMap(svg, geojson);
            console.log('Mapa do Brasil carregado com sucesso');
        })
        .catch(error => {
            console.error('Erro ao carregar mapa:', error);
            // Fallback: carregar do KML local
            loadMapFromKML(svg);
        });
}

function loadMapFromKML(svg) {
    fetch('BRASIL.kml')
        .then(response => response.text())
        .then(kmlText => {
            const parser = new DOMParser();
            const kmlDom = parser.parseFromString(kmlText, 'text/xml');
            
            if (kmlDom.getElementsByTagName('parsererror').length > 0) {
                console.error('Erro ao parsear KML');
                return;
            }
            
            const placemarks = kmlDom.getElementsByTagName('Placemark');
            console.log('Placemarks encontrados:', placemarks.length);
            
            let hasGeometry = false;
            const features = [];
            
            for (let placemark of placemarks) {
                const polygon = placemark.getElementsByTagName('Polygon')[0];
                
                if (polygon) {
                    hasGeometry = true;
                    const outerBoundary = polygon.getElementsByTagName('outerBoundaryIs')[0];
                    if (outerBoundary) {
                        const linearRing = outerBoundary.getElementsByTagName('LinearRing')[0];
                        if (linearRing) {
                            const coordinates = linearRing.getElementsByTagName('coordinates')[0];
                            if (coordinates) {
                                const coordsText = coordinates.textContent.trim();
                                const coords = coordsText.split(/\s+/)
                                    .filter(c => c.includes(','))
                                    .map(c => {
                                        const [lng, lat] = c.split(',').map(v => parseFloat(v.trim()));
                                        return [lng, lat];
                                    });
                                
                                if (coords.length > 2) {
                                    features.push({
                                        type: 'Feature',
                                        geometry: {
                                            type: 'Polygon',
                                            coordinates: [coords]
                                        }
                                    });
                                }
                            }
                        }
                    }
                }
            }
            
            if (features.length > 0) {
                const geojson = {
                    type: 'FeatureCollection',
                    features: features
                };
                renderBrazilMap(svg, geojson);
            }
        })
        .catch(error => console.error('Erro ao carregar KML:', error));
}

function renderBrazilMap(svg, geojson) {
    svg.setAttribute('viewBox', '0 0 1200 1000');
    svg.innerHTML = '';
    
    // Fundo
    const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    bg.setAttribute('width', '1200');
    bg.setAttribute('height', '1000');
    bg.setAttribute('fill', '#0d1726');
    svg.appendChild(bg);
    
    // Calcular bounds
    let minLng = 180, maxLng = -180;
    let minLat = 90, maxLat = -90;
    
    geojson.features.forEach(feature => {
        if (feature.geometry.type === 'Polygon') {
            feature.geometry.coordinates[0].forEach(coord => {
                minLng = Math.min(minLng, coord[0]);
                maxLng = Math.max(maxLng, coord[0]);
                minLat = Math.min(minLat, coord[1]);
                maxLat = Math.max(maxLat, coord[1]);
            });
        }
    });
    
    const padding = 80;
    const width = 1200 - 2 * padding;
    const height = 1000 - 2 * padding;
    
    // Conversor de coordenadas
    const lngToX = (lng) => ((lng - minLng) / (maxLng - minLng)) * width + padding;
    const latToY = (lat) => ((maxLat - lat) / (maxLat - minLat)) * height + padding;
    
    // Renderizar polígonos
    geojson.features.forEach(feature => {
        if (feature.geometry.type === 'Polygon') {
            feature.geometry.coordinates[0].forEach((coord, idx) => {
                const x = lngToX(coord[0]);
                const y = latToY(coord[1]);
                
                if (idx === 0) {
                    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                    let pathData = `M ${x} ${y}`;
                    
                    for (let i = 1; i < feature.geometry.coordinates[0].length; i++) {
                        const c = feature.geometry.coordinates[0][i];
                        const px = lngToX(c[0]);
                        const py = latToY(c[1]);
                        pathData += ` L ${px} ${py}`;
                    }
                    
                    pathData += ' Z';
                    
                    path.setAttribute('d', pathData);
                    path.setAttribute('fill', 'rgba(90, 95, 255, 0.15)');
                    path.setAttribute('stroke', '#5a5fff');
                    path.setAttribute('stroke-width', '1.2');
                    path.setAttribute('stroke-linejoin', 'round');
                    
                    svg.appendChild(path);
                }
            });
        }
    });
}

// Atualizar a cada 30 segundos
setInterval(loadDashboard, 30000);

// Carregar dashboard na inicialização
loadDashboard();

// Carregar ao abrir a página
document.addEventListener('DOMContentLoaded', loadDashboard);
