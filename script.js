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

    // Pegar os últimos 10 registros (inversão da ordem)
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

// Inicializar mapa do Brasil (estático em SVG via object tag)
let mapLoaded = false;
let geoJsonCache = null;

function loadMap(data) {
    // Apenas inicializa uma vez
    if (mapLoaded) {
        // Se já carregou, apenas atualizar os PINGs
        plotarPings(data, geoJsonCache);
        return;
    }
    mapLoaded = true;
    
    // Criar um GeoJSON mínimo apenas para os bounds do Brasil
    geoJsonCache = {
        type: 'FeatureCollection',
        features: [{
            type: 'Feature',
            geometry: {
                type: 'Polygon',
                coordinates: [[[-73, -33], [-32, -33], [-32, 5], [-73, 5], [-73, -33]]]
            }
        }]
    };
    
    // Plotar PINGs das praças ativas
    plotarPings(data, geoJsonCache);
    console.log('Mapa do Brasil e PINGs carregados com sucesso');
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

// Cache de coordenadas de cidades (para evitar múltiplas chamadas à API)
const geonamesCache = {
    // Principais cidades brasileiras com coordenadas pré-definidas
    'São Paulo': { lat: -23.5505, lng: -46.6333 },
    'Rio de Janeiro': { lat: -22.9068, lng: -43.1729 },
    'Belo Horizonte': { lat: -19.9167, lng: -43.9345 },
    'Brasília': { lat: -15.7975, lng: -47.8919 },
    'Salvador': { lat: -12.9714, lng: -38.5014 },
    'Fortaleza': { lat: 3.7314, lng: -38.5267 },
    'Manaus': { lat: -3.1190, lng: -60.0217 },
    'Curitiba': { lat: -25.4284, lng: -49.2733 },
    'Recife': { lat: -8.0476, lng: -34.8770 },
    'Porto Alegre': { lat: -30.0277, lng: -51.5005 },
    'Goiânia': { lat: -15.7939, lng: -48.0693 },
    'Belém': { lat: -1.4558, lng: -48.5044 },
    'Campinas': { lat: -22.9068, lng: -47.0606 },
    'Santos': { lat: -23.9608, lng: -46.3339 },
    'Sorocaba': { lat: -23.5006, lng: -47.4522 },
    'São Bernardo do Campo': { lat: -23.6953, lng: -46.5633 },
    'Santo André': { lat: -23.6628, lng: -46.5361 },
    'Osasco': { lat: -23.5309, lng: -46.7914 },
    'Mauá': { lat: -23.6678, lng: -46.4514 },
    'Diadema': { lat: -23.6845, lng: -46.6136 },
    'Guarulhos': { lat: -23.4615, lng: -46.4731 },
    'Campina Grande': { lat: -7.2300, lng: -35.8804 },
    'João Pessoa': { lat: -7.1496, lng: -34.8450 },
    'Maceió': { lat: -9.6400, lng: -35.7347 },
    'Aracaju': { lat: -10.9111, lng: -37.0734 },
    'Teresina': { lat: -5.0892, lng: -42.8019 },
    'São Luís': { lat: -2.5387, lng: -44.2829 },
    'Natal': { lat: -5.7975, lng: -35.2094 },
    'Campo Grande': { lat: -20.4697, lng: -54.6201 },
    'Cuiabá': { lat: -15.5939, lng: -56.0911 },
    'Palmas': { lat: -10.1753, lng: -48.3382 },
    'Porto Velho': { lat: -8.7619, lng: -63.9039 },
    'Rio Branco': { lat: -9.9761, lng: -67.8102 },
    'Boa Vista': { lat: 2.8235, lng: -60.6758 },
    'Macapá': { lat: 0.3510, lng: -51.0695 },
    'Pirassununga': { lat: -21.9933, lng: -47.4333 },
    'Araraquara': { lat: -21.7939, lng: -48.1840 },
    'Bauru': { lat: -22.3142, lng: -49.0656 },
    'Ribeirão Preto': { lat: -21.1797, lng: -47.8103 },
    'Marília': { lat: -22.2141, lng: -49.9459 },
    'Piracicaba': { lat: -22.7297, lng: -47.6500 },
    'Franca': { lat: -20.5350, lng: -47.4047 },
    'Londrina': { lat: -23.3100, lng: -51.1628 },
    'Maringá': { lat: -23.4250, lng: -51.4664 },
    'Ponta Grossa': { lat: -25.0955, lng: -50.1618 },
    'Cascavel': { lat: -24.9547, lng: -53.4581 },
    'Foz do Iguaçu': { lat: -25.5951, lng: -54.5793 },
    'Blumenau': { lat: -26.8791, lng: -49.0694 },
    'Joinville': { lat: -26.3045, lng: -48.8487 },
    'Chapecó': { lat: -27.1002, lng: -52.6169 },
    'Caxias do Sul': { lat: -29.1767, lng: -51.1800 },
    'Pelotas': { lat: -31.7683, lng: -52.3406 },
    'Santa Cruz do Sul': { lat: -29.7167, lng: -52.4333 },
    'Santa Maria': { lat: -29.6843, lng: -53.8066 },
    'Uruguaiana': { lat: -32.3582, lng: -56.4133 },
    'Jundiaí': { lat: -23.1811, lng: -46.8778 },
    'Taubaté': { lat: -23.0277, lng: -45.5555 },
    'São José dos Campos': { lat: -23.1798, lng: -45.8903 },
    'Itabuna': { lat: -14.7867, lng: -39.2800 },
    'Vitória da Conquista': { lat: -14.8627, lng: -40.8394 },
    'Ilhéus': { lat: -14.7889, lng: -39.0347 }
};

const GEONAMES_USERNAME = 'kaike';

// Função para normalizar nomes de cidades (remove acentos)
function normalizeCityName(name) {
    return name
        .toLowerCase()
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove acentos
        .replace(/\s+/g, ' '); // Normaliza espaços
}

// Buscar coordenadas de uma cidade - usar apenas cache local
async function getCoordinatesByCity(cityName) {
    // Verificar cache primeiro (inclui cidades pré-definidas)
    if (geonamesCache[cityName]) {
        return geonamesCache[cityName];
    }

    // Normalizar o nome da cidade para busca
    const cityNameNormalized = normalizeCityName(cityName);
    
    // Procurar por correspondência exata (após normalização)
    for (const [cachedCity, coords] of Object.entries(geonamesCache)) {
        const cachedCityNormalized = normalizeCityName(cachedCity);
        if (cachedCityNormalized === cityNameNormalized) {
            console.log(`Cidade encontrada (normalizada): ${cityName} -> ${cachedCity}`);
            return coords;
        }
    }
    
    // Procurar por correspondência parcial (se for uma abreviação ou parte do nome)
    for (const [cachedCity, coords] of Object.entries(geonamesCache)) {
        const cachedCityNormalized = normalizeCityName(cachedCity);
        if (cachedCityNormalized.includes(cityNameNormalized) || 
            cityNameNormalized.includes(cachedCityNormalized)) {
            console.log(`Cidade encontrada (parcial): ${cityName} -> ${cachedCity}`);
            return coords;
        }
    }

    // Se não encontrar, retornar null (não plotar PING)
    console.warn(`Cidade não encontrada no cache: ${cityName}`);
    return null;
}

// Plotar PINGs no mapa (SVG)
async function plotarPings(data, geojson) {
    const animacoesLayer = document.getElementById('animacoes-layer');
    if (!animacoesLayer) return;
    
    // Limpar PINGs antigos
    animacoesLayer.innerHTML = '';
    
    // Calcular bounds para converter coordenadas geográficas em pixels
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
    
    const lngToX = (lng) => ((lng - minLng) / (maxLng - minLng)) * width + padding;
    const latToY = (lat) => ((maxLat - lat) / (maxLat - minLat)) * height + padding;
    
    // Filtrar cidades únicas com status ativo
    const activeData = data.filter(item => {
        const status = item.status.toLowerCase().trim();
        return status === 'ativo' || status === 'ativa' || status === 'a';
    });
    
    const cidadesUnicas = [...new Set(activeData.map(item => item.cidade))];
    
    // Plotar PING para cada cidade ativa
    for (const cidade of cidadesUnicas) {
        if (!cidade || cidade === 'N/A') continue;
        
        const coords = await getCoordinatesByCity(cidade);
        
        if (coords) {
            const x = lngToX(coords.lng);
            const y = latToY(coords.lat);
            
            // Criar SVG do PING
            const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.setAttribute('class', 'pinga');
            svg.setAttribute('style', `left: ${x}px; top: ${y}px;`);
            svg.setAttribute('width', '24');
            svg.setAttribute('height', '24');
            svg.setAttribute('viewBox', '0 0 24 24');
            
            // Círculo principal
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', '12');
            circle.setAttribute('cy', '12');
            circle.setAttribute('r', '6');
            circle.setAttribute('fill', '#E03D99');
            circle.setAttribute('filter', 'drop-shadow(0 0 10px #E03D99)');
            svg.appendChild(circle);
            
            // Ripple (onda)
            const ripple = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            ripple.setAttribute('cx', '12');
            ripple.setAttribute('cy', '12');
            ripple.setAttribute('r', '6');
            ripple.setAttribute('fill', 'none');
            ripple.setAttribute('stroke', '#5A5FFF');
            ripple.setAttribute('stroke-width', '1');
            ripple.setAttribute('class', 'pinga-ripple');
            svg.appendChild(ripple);
            
            // Tooltip ao hover
            svg.addEventListener('mouseenter', (e) => {
                const tooltip = document.getElementById('tooltip');
                tooltip.innerHTML = `<div class="tooltip-content"><strong>${cidade}</strong><div>Praça Ativa</div></div>`;
                tooltip.style.left = (e.pageX + 10) + 'px';
                tooltip.style.top = (e.pageY + 10) + 'px';
                tooltip.classList.remove('hidden');
            });
            
            svg.addEventListener('mouseleave', () => {
                document.getElementById('tooltip').classList.add('hidden');
            });
            
            animacoesLayer.appendChild(svg);
            console.log(`PING plotado: ${cidade} (${coords.lat}, ${coords.lng})`);
        }
    }
}

// Atualizar a cada 30 segundos
setInterval(loadDashboard, 30000);

// Carregar dashboard na inicialização
loadDashboard();

// Carregar ao abrir a página
document.addEventListener('DOMContentLoaded', loadDashboard);
