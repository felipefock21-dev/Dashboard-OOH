# Dashboard OOH - Outdoor

Dashboard em tempo real para monitoramento de campanhas OOH (Outdoor), integrado com Google Sheets.

## 🚀 Início Rápido

### Pré-requisitos
- Node.js 18+
- npm ou yarn

### Instalação

```bash
npm install
```

### Configuração

1. Copie o arquivo `.env.example` para `.env.local`:
```bash
cp .env.example .env.local
```

2. Atualize as variáveis de ambiente:
```env
NEXT_PUBLIC_GOOGLE_SHEETS_ID=seu_id_da_planilha
GOOGLE_SHEETS_API_KEY=sua_chave_api_opcional
```

A planilha do Google deve ter as seguintes colunas:
- `cliente` - Nome do cliente
- `praca` - Nome da praça/cidade
- `exibidora` - Nome da exibidora
- `impactos` - Número de impactos
- `mes` - Mês de referência (YYYY-MM)
- `ativo` - Status ativo/inativo (true/false)

### Desenvolvimento

```bash
npm run dev
```

Acesse http://localhost:3000

### Build para Produção

```bash
npm run build
npm start
```

## 📊 Recursos

- ✅ **Integração Google Sheets** - Lê dados em tempo real da planilha
- ✅ **KPIs em Destaque** - Métricas principais de forma clara
- ✅ **Gráficos Interativos** - Visualização de dados com Recharts
- ✅ **Rankings** - Clientes, praças e exibidoras mais ativas
- ✅ **Atualizações Automáticas** - SWR para refresh de dados
- ✅ **Design Responsivo** - Funciona em desktop, tablet e mobile
- ✅ **Dark Mode** - Interface otimizada para leitura

## 🏗️ Estrutura do Projeto

```
src/
├── app/              # App Router (Next.js 13+)
│   ├── page.tsx     # Página principal do dashboard
│   ├── layout.tsx   # Layout raiz
│   └── api/
│       └── metrics/
│           └── route.ts  # API para buscar métricas
├── components/       # Componentes React reutilizáveis
│   ├── KPICard.tsx
│   ├── Charts.tsx
│   ├── DataTable.tsx
│   ├── Header.tsx
│   └── index.ts
├── utils/
│   └── sheets.ts     # Funções de integração com Google Sheets
├── types/
│   └── index.ts      # TypeScript interfaces
└── globals.css       # Estilos globais + Tailwind
```

## 🔄 Fluxo de Dados

1. **Frontend** → Requisita `/api/metrics` usando SWR
2. **API Route** → Busca dados do Google Sheets via CSV export
3. **Processing** → Agrega e processa dados em métricas
4. **Response** → Retorna JSON com métricas para o frontend
5. **Caching** → SWR atualiza a cada 30 segundos

## 🚀 Deploy no Cloudflare Pages

### 1. Conectar repositório
- Faça push do código para GitHub
- No Cloudflare Pages, conecte o repositório

### 2. Configurar build
- **Build command:** `npm run build`
- **Build output directory:** `.next/static`
- **Root directory:** `/`

### 3. Variáveis de ambiente
Adicione no Cloudflare Pages:
```
NEXT_PUBLIC_GOOGLE_SHEETS_ID=seu_id
```

### 4. Deploy
Cloudflare automaticamente fará build e deploy a cada push

## 📈 Métricas Disponíveis

- **Impactos Totais** - Soma de todos os impactos
- **Clientes Ativos** - Total de clientes com campanhas
- **Praças Ativas** - Total de cidades/praças com campanhas
- **Exibidoras Ativas** - Total de exibidoras
- **Top 5 Clientes** - Clientes com mais impactos
- **Top 5 Praças** - Praças com mais impactos
- **Top 5 Exibidoras** - Exibidoras com mais impactos
- **Ranking por Cidade** - Todas as cidades ordenadas por impactos
- **Impactos por Mês** - Série temporal dos últimos 6 meses

## 🔧 Troubleshooting

### Dados não aparecem
- Verifique se a planilha está pública (view access)
- Confirme o ID da planilha em `.env.local`
- Verifique o formato das colunas na planilha

### Build falha no Cloudflare
- Certifique-se que o `package.json` tem todos os scripts
- Verifique a compatibilidade do Node.js versión

## 📝 Licença

Privado - Telaooh
