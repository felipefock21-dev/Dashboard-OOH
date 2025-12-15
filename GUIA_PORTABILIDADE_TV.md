# 📺 Guia de Portabilidade - Dashboard OOH em TV

## 🎯 Visão Geral
Este guia documenta como replicar o projeto **telaooh** em outro projeto, mantendo o mesmo layout responsivo, estrutura visual e funcionalidades em TV.

---

## ✅ Checklist de Implementação

- [ ] Meta tags viewport configuradas
- [ ] CSS base com reset e responsividade
- [ ] Layout flexbox de 2 colunas (40% esquerda / 60% direita)
- [ ] Mapa SVG com layer de animações
- [ ] Sistema de PINGs animados
- [ ] Check-in recentes com scroll lateral
- [ ] Ticker de notícias no rodapé
- [ ] Media queries para TV (1920x1080 e 4K)

---

## 1️⃣ META TAGS (HTML HEAD)

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover, user-scalable=no">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <meta name="theme-color" content="#001B4D">
    <title>Dashboard OOH</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="styles.css?v=1.0">
</head>
```

**Por que cada meta tag é importante:**
- `viewport-fit=cover` - Usa toda a tela sem barras de status
- `user-scalable=no` - Impede zoom manual em TV
- `apple-mobile-web-app-capable` - Fullscreen em iOS
- `theme-color` - Define cor de barra em browsers

---

## 2️⃣ ESTRUTURA HTML

### Layout Principal (2 Colunas)

```html
<body>
    <div class="main-wrapper">
        <!-- COLUNA ESQUERDA (40%) - Métricas e Rankings -->
        <div class="left-column">
            <div class="metrics-section">
                <!-- 4 Cards de KPIs -->
                <div class="metrica-card">
                    <div class="metrica-label">Cidades Ativas</div>
                    <div class="metrica-valor">15</div>
                    <div class="metrica-chart"><!-- Chart/Gráfico --></div>
                </div>
                <!-- ... 3 cards adicionais ... -->
            </div>

            <div class="rankings-section">
                <!-- 4 Ranking Cards (Top 3 cada) -->
                <div class="ranking-card">
                    <h3>Top Clientes</h3>
                    <div class="ranking-list">
                        <div class="ranking-item">1. Cliente A</div>
                        <div class="ranking-item">2. Cliente B</div>
                        <div class="ranking-item">3. Cliente C</div>
                    </div>
                </div>
                <!-- ... 3 rankings adicionais ... -->
            </div>
        </div>

        <!-- COLUNA DIREITA (60%) - Mapa e Check-ins -->
        <div class="right-column">
            <div class="mapa-border-container">
                <!-- Check-in Recentes (Sidebar 25%) -->
                <div class="checkins-lateral">
                    <h4>Check-in Recentes</h4>
                    <div id="lista-checkins-lateral" class="lista-lateral">
                        <div class="loading">Carregando...</div>
                    </div>
                </div>

                <!-- Mapa (75%) -->
                <div class="mapa-fundo-container">
                    <div id="mapa-container">
                        <object id="mapa-object" data="mapa-brasil.svg" type="image/svg+xml"></object>
                        <div id="animacoes-layer"></div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- TICKER/NOTÍCIAS (Rodapé) -->
    <div id="news-ticker" class="news-ticker">
        <div class="ticker-header">
            <span class="ticker-label">Monitoramento OOH</span>
        </div>
        <div class="ticker-content">
            <div class="ticker-scroll">
                <div id="ticker-items" class="ticker-items">
                    <!-- Items dinâmicos via JavaScript -->
                </div>
            </div>
        </div>
    </div>

    <!-- TOOLTIP Flutuante -->
    <div id="tooltip" class="tooltip hidden"></div>

    <script src="script.js?v=1.0"></script>
</body>
```

---

## 3️⃣ CSS GLOBAL & RESET

```css
/* Reset Padrão */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

html, body {
    width: 100%;
    height: 100%;
    overflow: hidden;
}

body {
    font-family: 'Space Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    background: linear-gradient(135deg, #001B4D 0%, #0a1f5e 100%);
    color: #ffffff;
    font-size: clamp(12px, 1.5vw, 20px);
    line-height: 1.6;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
}

/* Removeu scrollbar padrão */
::-webkit-scrollbar {
    width: 6px;
    height: 6px;
}

::-webkit-scrollbar-track {
    background: rgba(224, 61, 153, 0.1);
}

::-webkit-scrollbar-thumb {
    background: rgba(224, 61, 153, 0.5);
    border-radius: 3px;
}
```

---

## 4️⃣ LAYOUT PRINCIPAL (Flexbox)

```css
.main-wrapper {
    display: flex;
    flex-direction: row;
    width: 100vw;
    height: calc(100vh - 45px); /* 45px reservado para ticker */
    gap: clamp(12px, 1.5vw, 24px);
    padding: clamp(15px, 2vw, 30px);
    overflow: hidden;
}

/* COLUNA ESQUERDA - 40% */
.left-column {
    flex: 0 0 40%;
    display: flex;
    flex-direction: column;
    gap: clamp(12px, 1.5vw, 20px);
    min-height: 0;
    min-width: 0;
    overflow: hidden;
}

/* COLUNA DIREITA - 60% */
.right-column {
    flex: 0 0 60%;
    display: flex;
    flex-direction: column;
    gap: clamp(12px, 1.5vw, 20px);
    min-height: 0;
    min-width: 0;
    overflow: hidden;
}

/* KEY RULE: Permitir que flex funcione com overflow */
.left-column > * {
    min-height: 0;
    min-width: 0;
}

.right-column > * {
    min-height: 0;
    min-width: 0;
}
```

**Regras de Ouro:**
- `flex: 0 0 40%` = Não cresce, não encolhe, fica 40%
- `min-height: 0` = Permite overflow correto em flex
- `gap: clamp(...)` = Espaçamento responsivo
- `overflow: hidden` = Nada sai da tela

---

## 5️⃣ SEÇÃO DE MÉTRICAS (KPIs)

```css
.metrics-section {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: clamp(10px, 1.2vw, 16px);
    flex: 0 0 auto;
}

.metrica-card {
    background: rgba(224, 61, 153, 0.08);
    border: 2px solid rgba(224, 61, 153, 0.3);
    border-radius: clamp(10px, 1.5vw, 16px);
    padding: clamp(12px, 1.5vw, 20px);
    display: flex;
    flex-direction: column;
    gap: clamp(6px, 0.8vw, 12px);
    backdrop-filter: blur(10px);
    transition: all 0.3s ease;
}

.metrica-card:hover {
    border-color: rgba(224, 61, 153, 0.6);
    background: rgba(224, 61, 153, 0.15);
}

.metrica-label {
    font-size: clamp(10px, 0.8vw, 14px);
    color: rgba(255, 255, 255, 0.7);
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 1px;
}

.metrica-valor {
    font-size: clamp(24px, 3.5vw, 48px);
    font-weight: 700;
    color: #E03D99;
    line-height: 1;
}

.metrica-chart {
    height: clamp(30px, 4vw, 60px);
    background: rgba(90, 95, 255, 0.1);
    border-radius: 4px;
    overflow: hidden;
}
```

---

## 6️⃣ SEÇÃO DE RANKINGS

```css
.rankings-section {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: clamp(10px, 1.2vw, 16px);
    flex: 1;
    min-height: 0;
}

.ranking-card {
    background: rgba(90, 95, 255, 0.08);
    border: 2px solid rgba(90, 95, 255, 0.3);
    border-radius: clamp(10px, 1.5vw, 16px);
    padding: clamp(12px, 1.5vw, 20px);
    display: flex;
    flex-direction: column;
    gap: clamp(8px, 1vw, 12px);
    backdrop-filter: blur(10px);
    overflow: hidden;
    min-height: 0;
}

.ranking-card h3 {
    font-size: clamp(12px, 1.3vw, 18px);
    color: rgba(255, 255, 255, 0.9);
    font-weight: 600;
}

.ranking-list {
    display: flex;
    flex-direction: column;
    gap: clamp(4px, 0.6vw, 8px);
    overflow-y: auto;
    flex: 1;
    min-height: 0;
}

.ranking-item {
    font-size: clamp(10px, 1vw, 14px);
    padding: clamp(4px, 0.5vw, 8px);
    color: rgba(255, 255, 255, 0.7);
    border-left: 3px solid #E03D99;
    padding-left: clamp(8px, 1vw, 12px);
    transition: all 0.2s ease;
}

.ranking-item:hover {
    color: #E03D99;
    background: rgba(224, 61, 153, 0.1);
}
```

---

## 7️⃣ MAPA & ANIMAÇÕES

```css
.mapa-border-container {
    flex: 1;
    display: flex;
    gap: 0;
    border-radius: clamp(12px, 1.5vw, 20px);
    border: 2px solid rgba(224, 61, 153, 0.3);
    background: rgba(224, 61, 153, 0.08);
    overflow: hidden;
    min-height: 0;
}

/* Check-ins Lateral (Esquerda - 25%) */
.checkins-lateral {
    flex: 0 0 25%;
    background: #001B4D;
    border-right: 2px solid rgba(224, 61, 153, 0.3);
    border-top-right-radius: clamp(10px, 1.5vw, 20px);
    border-bottom-right-radius: clamp(10px, 1.5vw, 20px);
    display: flex;
    flex-direction: column;
    gap: clamp(8px, 1vw, 12px);
    padding: clamp(12px, 1.5vw, 16px);
    overflow: hidden;
}

.checkins-lateral h4 {
    font-size: clamp(12px, 1.3vw, 16px);
    font-weight: 600;
    color: rgba(255, 255, 255, 0.9);
}

.lista-lateral {
    display: flex;
    flex-direction: column;
    gap: clamp(4px, 0.5vw, 8px);
    overflow-y: auto;
    flex: 1;
    min-height: 0;
}

.checkin-item {
    background: rgba(224, 61, 153, 0.1);
    border-left: 2px solid #E03D99;
    padding: clamp(6px, 0.8vw, 10px);
    border-radius: 4px;
    font-size: clamp(9px, 0.9vw, 12px);
    color: rgba(255, 255, 255, 0.8);
    transition: all 0.2s ease;
}

.checkin-item:hover {
    background: rgba(224, 61, 153, 0.2);
}

/* Mapa (Direita - 75%) */
.mapa-fundo-container {
    flex: 1;
    background: rgba(90, 95, 255, 0.08);
    border: 2px solid rgba(90, 95, 255, 0.4);
    border-top-left-radius: clamp(10px, 1.5vw, 20px);
    border-bottom-left-radius: clamp(10px, 1.5vw, 20px);
    position: relative;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto;
    width: 72%;
    height: 95%;
    min-height: 0;
}

#mapa-container {
    flex: 1;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    overflow: hidden;
    isolation: isolate;
}

#mapa-object {
    width: 100%;
    height: 100%;
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
    object-position: center;
    display: block;
}

#animacoes-layer {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: auto;
    z-index: 10;
    isolation: isolate;
}
```

---

## 8️⃣ SISTEMA DE PINGs (Animações)

```css
/* SVG PING - Marcador de Cidade Ativa */
.pinga {
    position: absolute;
    width: clamp(20px, 2vw, 32px);
    height: clamp(20px, 2vw, 32px);
    margin-left: calc(-1 * clamp(10px, 1vw, 16px));
    margin-top: calc(-1 * clamp(10px, 1vw, 16px));
    pointer-events: auto;
    cursor: pointer;
    filter: drop-shadow(0 0 8px rgba(224, 61, 153, 0.6));
    transition: filter 0.2s ease;
}

.pinga:hover {
    filter: drop-shadow(0 0 16px rgba(224, 61, 153, 1));
}

/* Círculo Interno (Rosa) */
.pinga-circle {
    fill: #E03D99;
    box-shadow: 0 0 10px #E03D99;
}

/* Ripple Externo (Azul) */
.pinga-ripple {
    fill: none;
    stroke: #5A5FFF;
    stroke-width: 1;
    animation: pinga-pulse 2s ease-in-out infinite;
}

@keyframes pinga-pulse {
    0% {
        r: 6px;
        opacity: 1;
    }
    50% {
        r: 12px;
        opacity: 0.5;
    }
    100% {
        r: 18px;
        opacity: 0;
    }
}
```

---

## 9️⃣ TICKER DE NOTÍCIAS (Rodapé)

```css
.news-ticker {
    position: fixed;
    bottom: 0;
    left: 0;
    width: 100vw;
    height: 45px;
    background: linear-gradient(90deg, rgba(0, 27, 77, 0.95) 0%, rgba(0, 27, 77, 0.9) 100%);
    border-top: 2px solid rgba(224, 61, 153, 0.3);
    display: flex;
    align-items: center;
    gap: clamp(8px, 1vw, 16px);
    padding: 0 clamp(10px, 1.5vw, 20px);
    overflow: hidden;
    z-index: 100;
}

.ticker-header {
    flex: 0 0 auto;
}

.ticker-label {
    font-size: clamp(10px, 1vw, 14px);
    font-weight: 600;
    color: #E03D99;
    text-transform: uppercase;
    letter-spacing: 1px;
    white-space: nowrap;
}

.ticker-content {
    flex: 1;
    overflow: hidden;
    min-width: 0;
}

.ticker-scroll {
    display: flex;
    animation: scroll-left 30s linear infinite;
}

.ticker-items {
    display: flex;
    gap: clamp(30px, 5vw, 60px);
    white-space: nowrap;
}

.ticker-item {
    font-size: clamp(10px, 0.9vw, 13px);
    color: rgba(255, 255, 255, 0.7);
}

@keyframes scroll-left {
    0% {
        transform: translateX(100%);
    }
    100% {
        transform: translateX(-100%);
    }
}
```

---

## 🔟 TOOLTIP FLUTUANTE

```css
.tooltip {
    position: fixed;
    background: rgba(0, 27, 77, 0.95);
    border: 1px solid rgba(224, 61, 153, 0.5);
    border-radius: 8px;
    padding: clamp(8px, 1vw, 12px);
    font-size: clamp(10px, 0.9vw, 12px);
    color: #ffffff;
    z-index: 1000;
    pointer-events: none;
    white-space: nowrap;
}

.tooltip.hidden {
    display: none;
}

.tooltip-content {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.tooltip-content strong {
    color: #E03D99;
    font-weight: 600;
}
```

---

## 1️⃣1️⃣ MEDIA QUERIES - TV 1920x1080

```css
@media (min-width: 1920px) and (max-height: 1200px) {
    body {
        font-size: clamp(12px, 1.8vw, 18px);
    }

    .main-wrapper {
        padding: 12px;
        gap: 12px;
    }

    .metrica-card {
        padding: 14px;
    }

    .metrica-valor {
        font-size: clamp(28px, 3.5vw, 40px);
    }

    .ranking-item {
        font-size: clamp(10px, 1.1vw, 13px);
    }

    .checkin-item {
        font-size: clamp(9px, 1vw, 12px);
    }

    .ticker-label {
        font-size: clamp(11px, 1.2vw, 14px);
    }
}
```

---

## 1️⃣2️⃣ MEDIA QUERIES - TV 4K (3840x2160)

```css
@media (min-width: 3840px) and (min-height: 2160px) {
    body {
        font-size: clamp(16px, 2vw, 24px);
    }

    .main-wrapper {
        padding: 24px;
        gap: 20px;
    }

    .left-column, .right-column {
        gap: clamp(16px, 2vw, 28px);
    }

    .metrica-card {
        padding: 20px;
    }

    .metrica-valor {
        font-size: clamp(48px, 4vw, 72px);
    }

    .ranking-item {
        font-size: clamp(12px, 1.4vw, 18px);
    }

    .checkin-item {
        font-size: clamp(11px, 1.2vw, 16px);
    }

    .ticker-label {
        font-size: clamp(13px, 1.5vw, 18px);
    }

    #animacoes-layer {
        z-index: 15;
    }
}
```

---

## 🔑 PROPRIEDADES RESPONSIVAS ESSENCIAIS

| Propriedade | Valor Recomendado | Uso |
|------------|-------------------|-----|
| `font-size` | `clamp(12px, 1.5vw, 20px)` | Fonte que cresce com viewport |
| `gap` | `clamp(12px, 1.5vw, 20px)` | Espaço entre elementos |
| `border-radius` | `clamp(10px, 1.5vw, 20px)` | Raio responsivo |
| `padding` | `clamp(12px, 1.5vw, 20px)` | Padding responsivo |
| `width` | `100vw`, `50%`, `flex: 0 0 50%` | Sempre relativo |
| `height` | `100vh`, `calc(100vh - 45px)` | Sempre relativo |
| `flex` | `0 0 40%` | Tamanho fixo em flex |

---

## ⚠️ ERROS COMUNS (Evitar!)

### ❌ NÃO FAÇA ISTO:

```css
/* Valores fixos quebram em TV */
width: 500px;
font-size: 16px;
padding: 20px;
height: 600px;

/* Overflow permite scroll em TV (ruim) */
overflow: auto;
overflow-y: scroll;

/* Position fixed quebra em TV */
position: fixed;
```

### ✅ FAÇA ASSIM:

```css
/* Valores responsivos */
width: 50vw;
font-size: clamp(12px, 1.5vw, 20px);
padding: clamp(12px, 1.5vw, 20px);
height: calc(100vh - 45px);

/* Overflow hidden (nada sai) */
overflow: hidden;

/* Position absolute (relativo ao pai) */
position: absolute;
```

---

## 📊 ESTRUTURA DE DADOS ESPERADA

### Google Sheets (CSV)

```csv
cliente,status cliente,cidade,exibidora,impactostotal
Cliente A,ATIVO,São Paulo,Exibidora 1,1500
Cliente B,ATIVO,Rio de Janeiro,Exibidora 2,2000
Cliente C,INATIVO,Belo Horizonte,Exibidora 1,500
```

**Colunas obrigatórias:**
- `cliente` - Nome do cliente
- `status cliente` - "ATIVO" ou "INATIVO"
- `cidade` - Cidade da praça
- `exibidora` - Nome da exibidora
- `impactostotal` - Número de impactos

---

## 📝 JAVASCRIPT ESSENCIAL

### 1. Fetch de Dados

```javascript
const SHEET_ID = 'SEU_ID_AQUI';

async function fetchSheetData() {
    const csvUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv`;
    const response = await fetch(csvUrl);
    const csv = await response.text();
    return parseCSV(csv);
}
```

### 2. Parser CSV

```javascript
function parseCSV(csv) {
    const lines = csv.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const data = [];

    for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        
        const values = lines[i].split(',').map(v => v.trim());
        const item = {
            cliente: values[0],
            status: values[1],
            cidade: values[2],
            exibidora: values[3],
            impactos: values[4]
        };
        data.push(item);
    }
    return data;
}
```

### 3. Plotar PINGs no Mapa

```javascript
async function plotarPings(data, geojson) {
    const animacoesLayer = document.getElementById('animacoes-layer');
    
    // Calcular bounds do mapa
    let minLng = 180, maxLng = -180;
    let minLat = 90, maxLat = -90;
    
    geojson.features.forEach(feature => {
        feature.geometry.coordinates[0].forEach(coord => {
            minLng = Math.min(minLng, coord[0]);
            maxLng = Math.max(maxLng, coord[0]);
            minLat = Math.min(minLat, coord[1]);
            maxLat = Math.max(maxLat, coord[1]);
        });
    });
    
    // Converter coordenadas geográficas em pixels
    const mapaRect = document.getElementById('mapa-object').getBoundingClientRect();
    const containerRect = animacoesLayer.getBoundingClientRect();
    
    // ... resto do código de plotting
}
```

### 4. Atualização Automática (30s)

```javascript
async function loadDashboard() {
    const data = await fetchSheetData();
    renderMetrics(data);
    renderRankings(data);
    renderCheckinsRecentes(data);
    plotarPings(data, geojsonCache);
}

// Atualizar a cada 30 segundos
setInterval(loadDashboard, 30000);

// Carregar na inicialização
loadDashboard();
```

---

## 🎬 TESTANDO EM DIFERENTES RESOLUÇÕES

Abra DevTools (F12) e teste em:

### 1920x1080 (TV Full HD)
```
@media (min-width: 1920px) and (max-height: 1200px)
```

### 3840x2160 (TV 4K)
```
@media (min-width: 3840px) and (min-height: 2160px)
```

### 1366x768 (Desktop Pequeno)
```
Sem media query específica (usa valores clamp padrão)
```

---

## 📦 ARQUIVO: MAPA SVG

**Arquivo obrigatório:** `mapa-brasil.svg`

```html
<!-- Referência no HTML -->
<object id="mapa-object" data="mapa-brasil.svg" type="image/svg+xml"></object>
```

**Requisitos do SVG:**
- ✅ Deve conter contornos de estados brasileiros
- ✅ Cores: azul ou verde escuro (compatível com background)
- ✅ ViewBox definido (ex: `viewBox="0 0 1200 1000"`)
- ✅ Sem stroke muito espesso
- ✅ Bem otimizado (remover metadados desnecessários)

---

## 💡 DICAS FINAIS

1. **Sempre use `clamp()`** para sizing responsivo
2. **Sempre defina `min-height: 0` e `min-width: 0`** em flex containers
3. **Use `overflow: hidden`** em tudo que não precisa scroll
4. **Meta tag `viewport-fit=cover`** é CRÍTICO para TV
5. **Teste em múltiplas resoluções** antes de deployment
6. **Use unidades relativas** (`vw`, `vh`, `%`) NUNCA px
7. **Cache do navegador** - adicione `?v=VERSAO` aos arquivos

---

## 📁 ARQUIVOS DO PROJETO

Copie do projeto funcionando `telaooh/`:

```
✅ index.html          → Estrutura HTML com meta tags
✅ styles.css          → Todo CSS com media queries e clamp
✅ script.js           → Lógica JavaScript completa
✅ mapa-brasil.svg     → SVG do mapa do Brasil
```

---

## 🚀 CHECKLIST FINAL

- [ ] HTML com meta tags viewport corretas
- [ ] CSS com reset completo (margin, padding, box-sizing)
- [ ] Layout flexbox 2 colunas funcionando
- [ ] Todas as fontes usando `clamp()`
- [ ] Todos os gaps usando `clamp()`
- [ ] Media queries para 1920x1080 e 4K
- [ ] Google Sheets integrado e funcionando
- [ ] Mapa SVG carregando corretamente
- [ ] PINGs aparecendo e animando
- [ ] Ticker de notícias funcionando
- [ ] Atualizando a cada 30 segundos
- [ ] Testado em múltiplas resoluções
- [ ] Sem erros de console

---

## 📞 SUPORTE

Qualquer dúvida sobre responsividade em TV, consulte:
- [Google TV Documentation](https://developers.google.com/tv)
- [MDN - CSS Viewport Units](https://developer.mozilla.org/en-US/docs/Web/CSS/viewport_percentage_length)
- [CSS-Tricks - Flexbox Guide](https://css-tricks.com/snippets/css/a-guide-to-flexbox/)

---

**Última atualização:** 15 de Dezembro de 2025
**Versão do Projeto:** telaooh v1.0
**Compatibilidade:** TV 1080p e 4K, Desktop 1366px+
