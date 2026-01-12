# 🔧 GUIA DE DEBUG - Dashboard OOH

## ✅ Correções Realizadas

### 1. **Timestamps de Cache Atualizados**
- ❌ Antes: `v=20251215160200` (data futura inválida)
- ✅ Depois: `v=20260112120000` (data válida e atual)
- **Impacto**: Força o navegador a recarregar CSS/JS novos

### 2. **Melhorado Carregamento do Google Sheets**
- Adicionados headers explícitos na requisição
- Melhor tratamento de erros com mensagens claras
- Logging detalhado para diagnosticar problemas

### 3. **Melhorado Carregamento do Mapa**
- Adicionado delay de 500ms para SVG ser renderizado
- Melhor logging do status do mapa
- Verificação de elemento tooltip antes de usar

### 4. **Logging Aprimorado**
- Emojis visuais para cada evento
- Contagem clara de dados processados
- Mensagens de erro mais específicas

---

## 🔍 COMO VERIFICAR O QUE ESTÁ ERRADO

### Abrir Console do Navegador
1. Pressione **F12** ou **Ctrl+Shift+I**
2. Vá para a aba **Console**
3. Procure por mensagens com:
   - ❌ **Erro ao carregar dados**: Problema com Google Sheets
   - ⚠️ **Nenhum registro ATIVO**: Planilha vazia ou sem status "Ativo"
   - ✅ **PING plotado**: Mapa está funcionando

---

## 📋 CHECKLIST DE VERIFICAÇÃO

### Passo 1: Verificar Google Sheets
```
A planilha está PÚBLICA? 
- [ ] Abra: https://docs.google.com/spreadsheets/d/1H3qFr2if6MdNN4ZZnrMidTq9kNpOdb6OY8ICAS9Gsj4
- [ ] Compartilhamento → Qualquer pessoa com o link pode visualizar
```

### Passo 2: Verificar Estrutura da Planilha
Colunas esperadas (case-insensitive):
- [ ] **cliente** (ou similar) - Nome do cliente
- [ ] **status campanha** - Deve conter "Ativo" ou "Ativa"
- [ ] **cidade** ou **praca** - Nome da cidade
- [ ] **exibidora** ou **emissor** - Nome da exibidora  
- [ ] **impactos** - Número de impactos

### Passo 3: Verificar Dados
No console, procure por:
```
✅ Linhas com status ATIVA: [número]
```

Se for 0, significa que:
- Coluna de status não está sendo encontrada
- Os valores não são "Ativo" exatamente
- Há espaços ou caracteres especiais

### Passo 4: Verificar Mapa
Procure por no console:
```
✅ PING plotado: [Cidade] (lat: X, lng: Y)
```

Se nenhum PING aparecer:
- Cidades não estão no cache de coordenadas
- Coordenadas estão fora dos limites do mapa

---

## 🛠️ SOLUÇÕES RÁPIDAS

### Problema: "Erro ao carregar dados"
**Solução:**
1. Abra a planilha em uma aba incógnita
2. Se pedir login, está PRIVADA
3. Mude para compartilhamento público

### Problema: Métricas mostram "--"
**Solução:**
1. Verifique no console se há logs do CSV
2. Verifique se coluna "status campanha" existe
3. Certifique-se que há registros com status "Ativo"

### Problema: Pings não aparecem
**Solução:**
1. Verifique se cidades existem no `geonamesCache` (script.js linha ~500)
2. Adicione nova cidade ao cache se necessário
3. Certifique-se que coordenadas estão dentro do Brasil

---

## 📝 COMO ADICIONAR NOVA CIDADE

No **script.js**, procure por `const geonamesCache = {`:

```javascript
const geonamesCache = {
    'São Paulo': { lat: -23.5505, lng: -46.6333 },
    'Rio de Janeiro': { lat: -22.9068, lng: -43.1729 },
    'Salvador': { lat: -12.9714, lng: -38.5014 },
    // Adicione aqui:
    'Sua Cidade': { lat: -XX.XXXX, lng: -XX.XXXX },
};
```

Coordenadas podem ser encontradas em: Google Maps → Clique no local → Copie lat/lng

---

## 🚀 TESTANDO LOCALMENTE

1. Abra o arquivo `index.html` no navegador
2. Abra o console (F12)
3. Procure por mensagens iniciadas com emojis
4. Verifique cada passo do carregamento

---

## 📞 PRÓXIMOS PASSOS

Se ainda tiver problemas:
1. Copie todo o console (F12 → Console → Ctrl+A → Ctrl+C)
2. Cole em um arquivo de texto
3. Compare com este guia

**Data da correção**: 12 de Janeiro de 2026
**Versão corrigida**: v=20260112120000
