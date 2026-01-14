// ID da planilha Google
const SHEET_ID = '1H3qFr2if6MdNN4ZZnrMidTq9kNpOdb6OY8ICAS9Gsj4';

// Buscar dados do Google Sheets (via CSV export)
async function fetchSheetData() {
    try {
        // URL para exportar a planilha como CSV
        const csvUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv`;
        
        console.log('🔄 Tentando carregar dados do Google Sheets...');
        console.log('ID da Planilha:', SHEET_ID);
        console.log('URL:', csvUrl);
        
        const response = await fetch(csvUrl, {
            method: 'GET',
            headers: {
                'Accept': 'text/csv'
            }
        });
        
        if (!response.ok) {
            console.error('Erro HTTP:', response.status, response.statusText);
            throw new Error(`Erro ${response.status} ao buscar planilha`);
        }
        
        const csv = await response.text();
        console.log('✅ Dados recebidos! Tamanho:', csv.length, 'bytes');
        
        if (!csv || csv.trim().length === 0) {
            console.warn('⚠️ Resposta vazia do Google Sheets');
            throw new Error('Resposta vazia');
        }
        
        return parseCSV(csv);
    } catch (error) {
        console.error('❌ Erro ao carregar dados:', error);
        alert('Erro ao carregar dados. Verifique se:\n1. A planilha está PÚBLICA\n2. O ID está correto\n3. Há conexão com internet');
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
        if (h.includes('status campanha')) statusIdx = idx;  // ESPECÍFICO: "status campanha"
        if (h.includes('cidade') || h.includes('praca')) cidadeIdx = idx;
        if (h.includes('exibidora') || h.includes('emissor')) exibidoraIdx = idx;
        if (h.includes('impacto')) impactosIdx = idx;
    });

    console.log('Índices encontrados:', { clienteIdx, statusIdx, cidadeIdx, exibidoraIdx, impactosIdx });

    for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue; // Pular linhas vazias
        
        const values = lines[i].split(',').map(v => v.trim());
        
        // Garantir que impactos seja um número válido
        let impactos = 0;
        if (impactosIdx >= 0 && values[impactosIdx]) {
            const impactosValue = values[impactosIdx].replace(/\D/g, '');
            impactos = parseInt(impactosValue || '0', 10);
        }
        
        const item = {
            cliente: clienteIdx >= 0 ? values[clienteIdx] || '' : '',
            status: statusIdx >= 0 ? values[statusIdx] || '' : '',
            cidade: cidadeIdx >= 0 ? values[cidadeIdx] || '' : '',
            exibidora: exibidoraIdx >= 0 ? values[exibidoraIdx] || '' : '',
            impactostotal: impactos
        };
        
        data.push(item);
    }

    console.log('Primeiros 5 registros parseados:', data.slice(0, 5));
    return data;
}

// Processpar dados e calcular métricas
function processMetrics(data) {
    console.log('=== PROCESSANDO MÉTRICAS ===');
    console.log('Total de linhas carregadas:', data.length);
    
    if (data.length === 0) {
        console.warn('⚠️ Nenhum dado para processar!');
        return {
            totalImpactos: 0,
            totalClientes: 0,
            totalPracas: 0,
            totalExibidoras: 0,
            clientesMaisAtivos: [],
            pracasMaisAtivas: [],
            exibidorasMaisAtivas: [],
            rankingCidades: []
        };
    }
    
    // Filtrar apenas registros com "Status Campanha" = ATIVA
    const activeData = data.filter(item => {
        const status = item.status.toLowerCase().trim();
        const isActive = status === 'ativo' || status === 'ativa' || status === 'a';
        return isActive;
    });
    
    console.log('✅ Linhas com status ATIVA:', activeData.length);
    if (activeData.length === 0) {
        console.warn('⚠️ Nenhum registro ATIVO encontrado!');
    }
    
    console.log('Exemplos de status encontrados:', [...new Set(data.map(item => item.status.trim()).slice(0, 10))]);
    console.log('Primeiras linhas ativas:', activeData.slice(0, 3));

    // KPIs
    const totalImpactos = activeData.reduce((sum, item) => sum + item.impactostotal, 0);
    console.log('📊 Total de impactos calculado:', totalImpactos);
    
    // Clientes Ativos (contagem única de clientes)
    const clientesUnicos = new Set(activeData.map(item => item.cliente));
    const totalClientes = clientesUnicos.size;
    console.log('👥 Total de clientes únicos:', totalClientes);

    // Praças Ativas (contagem única de cidades ativas com status campanha = ATIVA)
    // Toda cidade diferente será considerada como 1
    const pracasUnicas = new Set(activeData.map(item => item.cidade.toLowerCase().trim()).filter(c => c && c !== 'n/a'));
    const totalPracas = pracasUnicas.size;
    console.log('🏙️ Total de praças (cidades):', totalPracas);

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
        .slice(0, 5);

    console.log('🏢 Exibidoras Mais Ativas:', exibidorasMaisAtivas);

    // === RANKING DE IMPACTOS POR CIDADE ===
    // Ranking das 3 cidades com mais impactos totais
    const cidadesImpactos = new Map();
    activeData.forEach(item => {
        // Ignorar cidades vazias ou "N/A"
        const cidade = item.cidade.toLowerCase().trim();
        if (!cidade || cidade === 'n/a') return;
        
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

    console.log(`📊 Renderizando ranking [${elementId}]:`, data);

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
        
        console.log(`  Item ${index + 1}: nome="${item.nome}", valor="${valor}"`);
        
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
    const container = document.getElementById('lista-lateral');
    if (!container) return;
    
    container.innerHTML = '';

    // Filtrar dados ativos (status campanha) e ordenar por último (pegamos últimos 10)
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
        div.innerHTML = '';
        container.appendChild(div);
    });
}

// Atualizar hora de última atualização
function updateTime() {
    // Função removida
}

// Carregar e exibir dados
async function loadDashboard() {
    console.log('🚀 Carregando dashboard...');
    const data = await fetchSheetData();
    
    if (data.length === 0) {
        console.error('❌ Nenhum dado foi carregado');
        document.getElementById('totalImpactos').textContent = '--';
        document.getElementById('totalClientes').textContent = '--';
        document.getElementById('totalPracas').textContent = '--';
        document.getElementById('totalExibidoras').textContent = '--';
        return;
    }

    console.log(`✅ ${data.length} linhas carregadas com sucesso`);
    const metrics = processMetrics(data);

    console.log('📈 Métricas calculadas:', metrics);

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
        console.log('🔄 Atualizando PINGs...');
        plotarPings(data, geoJsonCache);
        return;
    }
    mapLoaded = true;
    
    console.log('📍 Inicializando mapa...');
    
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
    
    // Aguardar o SVG ser renderizado
    const mapaObject = document.getElementById('mapa-object');
    if (mapaObject) {
        // Tentar carregar após o elemento estar pronto
        setTimeout(() => {
            console.log('📌 Plotando PINGs no mapa...');
            plotarPings(data, geoJsonCache);
        }, 500); // Dar tempo para o SVG ser renderizado
    }
    
    console.log('✅ Mapa do Brasil carregado com sucesso');
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
    'Fortaleza': { lat: -3.7314, lng: -38.5267 },
    'Manaus': { lat: -3.1190, lng: -60.0217 },
    'Curitiba': { lat: -25.4284, lng: -49.2733 },
    'Recife': { lat: -8.0476, lng: -34.8770 },
    'Porto Alegre': { lat: -30.0277, lng: -51.5005 },
    'Goiânia': { lat: -15.7939, lng: -48.0693 },
    'Belém': { lat: -1.4558, lng: -48.5044 },
    'Campinas': { lat: -22.8945, lng: -47.0626 },
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
    'São Luís': { lat: -2.8967, lng: -44.3045 },
    'Natal': { lat: -5.7942, lng: -35.2094 },
    'Campo Grande': { lat: -20.4697, lng: -54.6201 },
    'Cuiabá': { lat: -15.5939, lng: -56.0911 },
    'Palmas': { lat: -10.1753, lng: -48.3382 },
    'Porto Velho': { lat: -8.7619, lng: -63.9039 },
    'Rio Branco': { lat: -9.9761, lng: -67.8102 },
    'Boa Vista': { lat: 2.82, lng: -60.6758 },
    'Macapá': { lat: -0.0350, lng: -51.0695 },
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
    'Uruguaiana': { lat: -31.55, lng: -56.4133 },
    'Jundiaí': { lat: -23.1811, lng: -46.8778 },
    'Taubaté': { lat: -23.0277, lng: -45.5555 },
    'São José dos Campos': { lat: -23.1798, lng: -45.8903 },
    'Itabuna': { lat: -14.7867, lng: -39.2800 },
    'Vitória da Conquista': { lat: -14.8627, lng: -40.8394 },
    'Ilhéus': { lat: -14.7889, lng: -39.0347 },
    'Barra do Ribeiro': { lat: -30.2489, lng: -51.2983 },
    'Tapes': { lat: -30.6778, lng: -51.3817 },
    'Canguçu': { lat: -31.3819, lng: -52.6731 },
    'Piratini': { lat: -31.7428, lng: -52.8922 },
    'São José do Norte': { lat: -32.0144, lng: -52.1014 },
    'Vacaria': { lat: -28.5061, lng: -50.7525 },
    'Sorriso': { lat: -12.5075, lng: -55.7169 },
    'Lucas do Rio Verde': { lat: -12.7623, lng: -55.9025 },
    'Sinop': { lat: -11.8650, lng: -55.4897 },
    'Campo Novo do Parecis': { lat: -13.6403, lng: -57.8761 },
    'Rio Verde': { lat: -17.7889, lng: -50.9219 },
    'Formosa': { lat: -15.5281, lng: -47.3281 },
    'Dourados': { lat: -22.2231, lng: -54.8028 },
    'Dom Pedrito': { lat: -31.0281, lng: -53.7472 },
    'Balsas': { lat: -7.5328, lng: -46.7653 },
    'Unaí': { lat: -16.3789, lng: -46.5553 },
    'Uberlândia': { lat: -18.9147, lng: -48.2744 },
    'Barreiras': { lat: -12.1544, lng: -44.9944 },
    'Passo Fundo': { lat: -28.2603, lng: -52.4084 },
    'Lagoa da Confusão': { lat: -10.0628, lng: -49.3669 },
    'Catalão': { lat: -18.1644, lng: -47.9431 },
    'Luís Eduardo Magalhães': { lat: -12.1544, lng: -45.8508 },
    'Jataí': { lat: -17.8789, lng: -51.7172 },
    'Paragominas': { lat: -2.9192, lng: -47.9264 },
    'Timbó': { lat: -26.8278, lng: -49.0628 },
    'Feira de Santana': { lat: -12.2625, lng: -38.9603 },
    'Jequié': { lat: -13.8619, lng: -40.0797 },
    
    // Cidades adicionais faltantes
    'Juazeiro': { lat: -9.4122, lng: -40.4725 },
    'Marabá': { lat: -5.3697, lng: -49.3087 },
    'Tomé Açu': { lat: -2.2858, lng: -48.3461 },
    'Parauapebas': { lat: -6.0744, lng: -49.9067 },
    'Lages': { lat: -27.8097, lng: -50.3314 },
    'Tubarão': { lat: -28.4737, lng: -49.0017 },
    'Lajeado': { lat: -29.4566, lng: -51.9706 },
    'Betim': { lat: -19.9689, lng: -44.1908 },
    'Contagem': { lat: -19.9328, lng: -44.0539 },
    'Juiz de Fora': { lat: -21.7639, lng: -43.3489 },
    'Sete Lagoas': { lat: -19.4615, lng: -44.2864 },
    'Vespasiano': { lat: -19.8419, lng: -43.8203 },
    'Florianópolis': { lat: -27.5965, lng: -48.5493 },
    'Pato Branco': { lat: -26.2306, lng: -51.0831 },
    'Timbiras': { lat: -5.0258, lng: -43.4531 },
    'Santo Antônio de Jesus': { lat: -13.2608, lng: -39.2692 },
    'Paulo Afonso': { lat: -9.1089, lng: -38.2261 },
    'São Jerônimo': { lat: -29.8572, lng: -51.7139 },
    'Monte Negro': { lat: -8.7736, lng: -63.3136 },
    'Alegrete': { lat: -29.7837, lng: -55.7914 },
    'Camaquã': { lat: -30.4811, lng: -51.8064 },
    'Gramado': { lat: -29.3731, lng: -50.8787 },
    'Castanhal': { lat: -1.2889, lng: -47.9331 },
    'Balneário Camboriú': { lat: -26.9901, lng: -48.6304 },
    'Bal. Camboriú': { lat: -26.9901, lng: -48.6304 }, // Abreviação comum
    'Piçarras': { lat: -26.9206, lng: -48.6414 },
    'São Carlos': { lat: -22.0175, lng: -47.8945 },
    'Cajamar': { lat: -23.3658, lng: -46.8833 },
    'Uberaba': { lat: -19.7681, lng: -47.9487 },
    'São Lourenço do Sul': { lat: -31.3589, lng: -52.2117 },
    'Porto Seguro': { lat: -16.4344, lng: -39.0756 },
    'Serrinha': { lat: -13.6569, lng: -38.9659 }
};

// Criar cache normalizado para busca sem acentos
const geonamesCacheNormalized = {};
Object.entries(geonamesCache).forEach(([city, coords]) => {
    const normalizedKey = city
        .toLowerCase()
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
    geonamesCacheNormalized[normalizedKey] = coords;
});

const GEONAMES_USERNAME = 'kaike';

// Função de distância de Levenshtein (similar, para fuzzy matching)
function levenshteinDistance(str1, str2) {
    const arr = [];
    for (let i = 0; i <= str2.length; i++) {
        arr[i] = [i];
    }
    for (let j = 0; j <= str1.length; j++) {
        arr[0][j] = j;
    }
    for (let i = 1; i <= str2.length; i++) {
        for (let j = 1; j <= str1.length; j++) {
            const marker = str1[j - 1] === str2[i - 1] ? 0 : 1;
            arr[i][j] = Math.min(
                arr[i][j - 1] + 1, // deletion
                arr[i - 1][j] + 1, // insertion
                arr[i - 1][j - 1] + marker // substitution
            );
        }
    }
    return arr[str2.length][str1.length];
}

// Função para normalizar nomes de cidades (remove acentos)
function normalizeCityName(name) {
    return name
        .toLowerCase()
        .trim()
        .replace(/^"|"$/g, '') // Remove aspas no início ou fim
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove acentos
        .replace(/\s+/g, ' '); // Normaliza espaços
}

// Buscar coordenadas de uma cidade - usar cache local com fuzzy matching
async function getCoordinatesByCity(cityName) {
    // Normalizar o nome da cidade para busca
    const cityNameNormalized = normalizeCityName(cityName);
    
    // Procurar no cache normalizado (sem acentos) - MATCH EXATO
    if (geonamesCacheNormalized[cityNameNormalized]) {
        console.log(`✅ Cidade encontrada (exato): ${cityName}`);
        return geonamesCacheNormalized[cityNameNormalized];
    }

    // Se não encontrar match exato, fazer fuzzy matching
    let bestMatch = null;
    let bestScore = 0;
    const threshold = 0.75; // 75% de similaridade
    
    for (const [normalizedCityInCache, coords] of Object.entries(geonamesCacheNormalized)) {
        // Calcular similaridade usando Levenshtein
        const distance = levenshteinDistance(cityNameNormalized, normalizedCityInCache);
        const maxLen = Math.max(cityNameNormalized.length, normalizedCityInCache.length);
        const similarity = 1 - (distance / maxLen);
        
        if (similarity > bestScore && similarity >= threshold) {
            bestScore = similarity;
            bestMatch = coords;
        }
    }
    
    if (bestMatch) {
        console.log(`✅ Cidade encontrada (fuzzy match ${(bestScore * 100).toFixed(0)}%): ${cityName}`);
        return bestMatch;
    }

    // Se não encontrar, retornar null (não plotar PING)
    console.warn(`⚠️ Cidade não encontrada no cache: "${cityName}"`);
    return null;
}

// Plotar PINGs no mapa (SVG)
async function plotarPings(data, geojson) {
    const animacoesLayer = document.getElementById('animacoes-layer');
    const mapaContainer = document.getElementById('mapa-container');
    const mapaObject = document.getElementById('mapa-object');
    if (!animacoesLayer || !mapaContainer || !mapaObject) return;
    
    // Limpar PINGs antigos
    animacoesLayer.innerHTML = '';
    
    // Calcular bounds reais do GeoJSON (não usar valores fixos)
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
    
    console.log(`📍 Bounds calculados do GeoJSON: Lng [${minLng.toFixed(2)}, ${maxLng.toFixed(2)}], Lat [${minLat.toFixed(2)}, ${maxLat.toFixed(2)}]`);
    
    // Obter dimensões e posição reais do SVG renderizado
    const mapaRect = mapaObject.getBoundingClientRect();
    const containerRect = mapaContainer.getBoundingClientRect();
    
    // Dimensões do container
    const containerWidth = mapaContainer.clientWidth;
    const containerHeight = mapaContainer.clientHeight;
    
    // Posição do SVG relativa ao container (para compensar offsets de renderização)
    const svgOffsetX = mapaRect.left - containerRect.left;
    const svgOffsetY = mapaRect.top - containerRect.top;
    const svgWidth = mapaRect.width;
    const svgHeight = mapaRect.height;
    
    console.log(`🗺️ SVG renderizado: ${svgWidth.toFixed(0)}x${svgHeight.toFixed(0)}, Offset: (${svgOffsetX.toFixed(0)}, ${svgOffsetY.toFixed(0)})`);
    
    // Converter coordenadas geográficas para pixels com validação de limites
    const lngToX = (lng) => {
        // Validar se está dentro dos limites
        if (lng < minLng || lng > maxLng) {
            console.warn(`⚠️ Longitude FORA dos limites: ${lng.toFixed(2)} (min: ${minLng.toFixed(2)}, max: ${maxLng.toFixed(2)})`);
            return null;
        }
        const percentX = ((lng - minLng) / (maxLng - minLng));
        return svgOffsetX + (percentX * svgWidth);
    };
    const latToY = (lat) => {
        // Validar se está dentro dos limites
        if (lat < minLat || lat > maxLat) {
            console.warn(`⚠️ Latitude FORA dos limites: ${lat.toFixed(2)} (min: ${minLat.toFixed(2)}, max: ${maxLat.toFixed(2)})`);
            return null;
        }
        const percentY = ((maxLat - lat) / (maxLat - minLat));
        return svgOffsetY + (percentY * svgHeight);
    };
    
    // Filtrar cidades únicas com status campanha ativo
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
            
            // Validar se coordenadas estão dentro dos limites
            if (x === null || y === null) {
                console.warn(`⚠️ PING descartado: ${cidade} (fora dos limites do mapa)`);
                continue;
            }
            
            // Criar SVG do PING - centralizar no ponto (offset de -50%)
            const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.setAttribute('class', 'pinga');
            svg.setAttribute('style', `left: calc(${x}px - 4.5px + 10px); top: calc(${y}px - 4.5px);`);
            svg.setAttribute('width', '9');
            svg.setAttribute('height', '9');
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
                if (tooltip) {
                    tooltip.innerHTML = `<div class="tooltip-content"><strong>${cidade}</strong><div>Praça Ativa</div></div>`;
                    tooltip.style.left = (e.pageX + 10) + 'px';
                    tooltip.style.top = (e.pageY + 10) + 'px';
                    tooltip.classList.remove('hidden');
                }
            });
            
            svg.addEventListener('mouseleave', () => {
                const tooltip = document.getElementById('tooltip');
                if (tooltip) {
                    tooltip.classList.add('hidden');
                }
            });
            
            animacoesLayer.appendChild(svg);
            console.log(`✅ PING plotado: ${cidade} (lat: ${coords.lat}, lng: ${coords.lng})`);
        }
    }
    console.log('✨ Todos os PINGs foram plotados!');
}

// Atualizar a cada 30 segundos
console.log('⏱️ Configurando atualização automática a cada 30 segundos');
setInterval(loadDashboard, 30000);

// Carregar dashboard na inicialização
console.log('🎯 Iniciando carregamento do dashboard...');
loadDashboard();

// Carregar ao abrir a página
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM completamente carregado!');
    loadDashboard();
});
