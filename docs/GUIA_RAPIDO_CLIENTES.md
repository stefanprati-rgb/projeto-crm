# 🚀 GUIA RÁPIDO - Novo Módulo de Clientes

**Versão:** 2.0 - GD Edition  
**Data:** 09/12/2024

---

## 📖 VISÃO GERAL

O módulo de clientes foi completamente refatorado para suportar **Geração Distribuída (GD)**. Agora você pode gerenciar:

- ✅ Múltiplos projetos por cliente
- ✅ Múltiplas instalações/UCs
- ✅ Equipamentos com garantias
- ✅ Contratos e faturamento
- ✅ Timeline de interações

---

## 🎯 ACESSO RÁPIDO

### Abrir Página de Clientes
```
http://localhost:5173/clients
```

---

## 🔍 BUSCA

### Como Buscar:
1. Digite no campo de busca no topo
2. Busca automática com debounce (300ms)
3. Resultados aparecem em tempo real

### O que você pode buscar:
- Nome do cliente
- Email
- Telefone
- CPF/CNPJ
- UC (Unidade Consumidora)
- Código de projeto (ex: GD-SP-001)
- Nome de usina
- Número de série de equipamento
- Cidade/Estado

---

## 🎛️ FILTROS

### Filtros Básicos (sempre visíveis):
- **Status do Cliente** - Ativo, Inativo, Suspenso, etc
- **Projeto** - Filtrar por projeto específico
- **Usina** - Filtrar por usina específica

### Filtros Avançados (clique em "Avançado"):
- **Status do Projeto** - Em análise, Ativo, Em construção, etc
- **Estado** - UF do cliente
- **Segmento** - Residencial, Comercial, Industrial, etc
- **Faturamento** - Mínimo e máximo
- **Inadimplência** - Apenas clientes inadimplentes
- **Data de Cadastro** - Período específico

### Salvar Filtros:
1. Configure os filtros desejados
2. Clique no ícone 💾 (Salvar)
3. Digite um nome
4. Filtro salvo aparecerá no topo

### Limpar Filtros:
- Clique em "Limpar" para resetar todos os filtros

---

## 👤 VER DETALHES DO CLIENTE

### Como Abrir:
1. Clique em qualquer cliente da lista
2. Modal full-width abrirá automaticamente

### Fechar Modal:
- Clique no X (canto superior direito)
- Pressione **ESC** no teclado
- Clique fora do modal

---

## 📑 ABAS DO MODAL

### 1️⃣ **Visão Geral**
**O que tem:**
- Informações cadastrais (tipo, segmento, documentos)
- Contatos múltiplos (comercial, financeiro, técnico)
- Endereço completo
- Tags
- Observações
- Timeline de atividades
- Metadata (criado por, atualizado em, etc)

**Quando usar:**
- Ver dados básicos do cliente
- Verificar contatos
- Adicionar observações

---

### 2️⃣ **Projetos** ⭐ NOVA!
**O que tem:**
- Métricas agregadas:
  - Total de projetos
  - Projetos ativos
  - Em construção
  - Potência total (kW)
  - Receita mensal estimada
- Cards por projeto com:
  - Código (ex: GD-SP-001)
  - Status visual (badge colorido)
  - Tipo de geração
  - Potência instalada
  - Valores (investimento + mensal)
  - Datas importantes
  - Responsáveis (técnico + comercial)
  - Usinas vinculadas

**Quando usar:**
- Ver todos os projetos do cliente
- Verificar status dos projetos
- Acompanhar potência instalada
- Validar valores e datas

---

### 3️⃣ **Financeiro**
**O que tem:**
- Resumo com 4 métricas:
  - Total faturado
  - Total pago
  - Em aberto
  - Vencido
- Informações de pagamento:
  - Dia de vencimento
  - Forma de pagamento
  - Último pagamento
  - Próximo vencimento
- Lista de faturas com:
  - Competência
  - Valor
  - Status (pago, vencido, em aberto)
  - Datas
  - Link para boleto
- Contratos ativos
- Alerta de inadimplência (se aplicável)

**Quando usar:**
- Verificar situação financeira
- Consultar faturas
- Baixar boletos
- Identificar inadimplência

---

### 4️⃣ **Técnico**
**O que tem:**
- Lista de instalações
- Por cada instalação:
  - UC (Unidade Consumidora)
  - Tipo (geração/consumo/híbrido)
  - Status (ativo, manutenção, etc)
  - Usina vinculada
  - Tensão
  - Medidor e número
  - Distribuidora
  - Endereço da instalação
  - Datas (instalação, ativação)

**Quando usar:**
- Verificar UCs do cliente
- Consultar dados técnicos
- Validar instalações
- Conferir distribuidora

---

### 5️⃣ **Equipamentos** ⭐ NOVA!
**O que tem:**
- Métricas de equipamentos:
  - Operacionais
  - Em manutenção
  - Com defeito
  - Garantia vencendo (próximos 90 dias)
- Cards por equipamento:
  - Tipo (inversor, painel, medidor, etc)
  - Marca e modelo
  - Número de série
  - Potência
  - Quantidade
  - Fornecedor
  - Valor de aquisição
  - Status de garantia com alertas visuais
  - Histórico de manutenções

**Quando usar:**
- Verificar equipamentos instalados
- Acompanhar garantias
- Consultar histórico de manutenções
- Identificar equipamentos com defeito

---

## ✏️ EDITAR CLIENTE

### Como Editar:
1. Abra o modal do cliente
2. Clique em "Editar" (header ou footer)
3. Formulário de edição abrirá
4. Faça as alterações
5. Clique em "Salvar"

---

## 🗑️ REMOVER CLIENTE

### Como Remover:
1. Abra o modal do cliente
2. Clique em "Remover Cliente" (footer, botão vermelho)
3. Confirme a ação
4. Cliente será removido permanentemente

⚠️ **ATENÇÃO:** Esta ação não pode ser desfeita!

---

## ➕ ADICIONAR NOVO CLIENTE

### Como Adicionar:
1. Clique em "+ Novo Cliente" (canto superior direito)
2. Preencha o formulário
3. Clique em "Salvar"

---

## 📊 MÉTRICAS

### Métricas Globais (topo da página):
- **Total** - Total de clientes
- **Ativos** - Clientes ativos
- **Inativos** - Clientes inativos

### Métricas por Aba:
- **Projetos:** Total, Ativos, Em Construção, Potência, Receita
- **Financeiro:** Faturado, Pago, Em Aberto, Vencido
- **Equipamentos:** Operacionais, Manutenção, Defeito, Garantia Vencendo

---

## 🎨 BADGES E CORES

### Status do Cliente:
- 🟢 **Verde** - Ativo
- 🟡 **Amarelo** - Suspenso
- 🔵 **Azul** - Em Análise
- ⚪ **Cinza** - Inativo/Prospecto

### Status do Projeto:
- 🟢 **Verde** - Ativo, Aprovado
- 🟡 **Amarelo** - Em Construção, Suspenso
- 🔵 **Azul** - Em Análise
- 🔴 **Vermelho** - Cancelado
- ⚪ **Cinza** - Concluído

### Status de Fatura:
- 🟢 **Verde** - Pago
- 🔵 **Azul** - Em Aberto
- 🔴 **Vermelho** - Vencido
- 🟡 **Amarelo** - Pago Parcial

### Status de Equipamento:
- 🟢 **Verde** - Operacional
- 🟡 **Amarelo** - Manutenção
- 🔴 **Vermelho** - Defeito
- ⚪ **Cinza** - Desativado

### Garantia:
- 🟢 **Verde** - Em Garantia
- 🟠 **Laranja** - Vencendo (< 90 dias)
- 🔴 **Vermelho** - Vencida

---

## ⌨️ ATALHOS DE TECLADO

- **ESC** - Fechar modal
- **Ctrl/Cmd + K** - Focar no campo de busca (futuro)

---

## 📱 RESPONSIVIDADE

### Desktop (> 1024px):
- Modal ocupa até 1400px de largura
- Todas as abas visíveis
- Layout otimizado

### Tablet (768px - 1024px):
- Modal ajusta largura
- Abas em scroll horizontal se necessário

### Mobile (< 768px):
- Modal ocupa tela inteira
- Abas empilhadas
- Botões maiores para toque

---

## 💡 DICAS

### Produtividade:
1. **Salve filtros frequentes** - Economize tempo
2. **Use busca rápida** - Digite qualquer coisa relacionada
3. **Navegue por abas** - Informações organizadas
4. **Verifique métricas** - Visão geral rápida

### Gestão:
1. **Acompanhe garantias** - Aba Equipamentos mostra alertas
2. **Monitore inadimplência** - Aba Financeiro destaca problemas
3. **Valide projetos** - Aba Projetos mostra status visual
4. **Confira instalações** - Aba Técnico lista todas as UCs

---

## ❓ PERGUNTAS FREQUENTES

### **P: Como adicionar um projeto a um cliente?**
R: Por enquanto, projetos são adicionados via código. Em breve teremos formulário na aba Projetos.

### **P: Posso editar um projeto direto no modal?**
R: Ainda não. Clique em "Ver Detalhes" no card do projeto (futuro).

### **P: Como adicionar equipamentos?**
R: Por enquanto, via código. Formulário em desenvolvimento.

### **P: Os filtros salvos ficam onde?**
R: No localStorage do navegador. Se limpar cache, perderá os filtros salvos.

### **P: Posso exportar a lista de clientes?**
R: Ainda não implementado. Funcionalidade futura.

### **P: Como funciona a busca?**
R: Busca em 15+ campos simultaneamente com debounce de 300ms.

---

## 🐛 PROBLEMAS CONHECIDOS

Nenhum no momento! 🎉

---

## 🔄 ATUALIZAÇÕES FUTURAS

### Em Desenvolvimento:
- [ ] Formulário de adicionar projeto
- [ ] Formulário de adicionar equipamento
- [ ] Formulário de adicionar instalação
- [ ] Edição inline de projetos
- [ ] Exportar lista de clientes
- [ ] Importar clientes em massa
- [ ] Gráficos de faturamento
- [ ] Mapa de instalações

---

## 📞 SUPORTE

Dúvidas? Problemas?
- Verifique a documentação completa em `docs/`
- Revise o código inline (bem documentado)
- Teste com dados de exemplo primeiro

---

**Aproveite o novo sistema! 🚀**
