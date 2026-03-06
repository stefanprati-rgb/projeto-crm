# Análise de Dados para CRM Client-Side

## Estrutura dos Dados Identificada

### 1. BASE DE CLIENTES V1 (630 registros, 44 campos)
**Principais Entidades:**
- **Cliente**: ID Externo, Nome/Razão Social, CPF/CNPJ, Tipo Contrato
- **Contato**: E-mail, Telefone, Endereço Completo, Cidade, UF, CEP
- **Contrato**: Data Adesão, Tipo Contrato, Desconto, Participação kWh, Modelo Contrato
- **Status**: Status Cliente, Status Rateio, Data Cancelamento, Motivos
- **Consumo**: Média Consumo Contratual, Média Consumo Móvel, Diferença
- **Financeiro**: Faturas Atrasadas, Fatura Atrasada, Doc, Fidelidade

### 2. MODELO CAD PORTAL GD (72 registros, 47 campos)
**Estrutura Padrão de Cadastro:**
- **Dados Cliente**: ID Externo, CPF/CNPJ, Nome/Razão Social, Nome Fantasia
- **Contato Financeiro**: Nome, E-mail, Telefone
- **Unidade Consumidora**: Nome, Instalação, Distribuidora, Endereço UC
- **Contrato**: Tipo, Data Assinatura, Desconto %, Participação kWh
- **Projeto**: ID, CNPJ, Razão Social, Nome Fantasia
- **Usina**: ID, Nome, Instalação, Potência, Geração, Início Operação

### 3. RELATÓRIO GERENCIAL (36 registros, 5 campos)
**Indicadores Operacionais:**
- **Vacância**: Quantidade, Consumo Médio, Receita, % Vacância
- **Status Clientes**: Ativas, Com/Sem Faturamento, Em Cancelamento
- **Métricas**: Energia Consumida Esperada, Faturamento

### 4. ACOMPANHAMENTO FATURAMENTO (1353 registros)
**Histórico Financeiro:**
- Dados mensais de faturamento por cliente
- Informações de cobrança e pagamentos

## Modelo de Dados Sugerido para o CRM

### Entidades Principais:
1. **CLIENTES** (tabela principal)
   - ID, Nome/Razão Social, CPF/CNPJ, Tipo, Status
   - Contatos (E-mail, Telefone, Endereço)
   - Dados Contratuais (Data Adesão, Tipo, Desconto)

2. **CONTRATOS** (relacionamento 1:N com Clientes)
   - ID Contrato, Tipo, Data Assinatura, Status
   - Participação kWh, Desconto %, Fidelidade
   - Modelo Contrato, Empresa Responsável

3. **FATURAMENTO** (relacionamento N:1 com Clientes)
   - Mês/Ano, Valor, Status Pagamento
   - Inadimplência, Número Faturas Atrasadas

4. **USINAS** (dados de referência)
   - ID, Nome, Instalação, Distribuidora
   - Potência, Geração, Início Operação

5. **PROJETOS** (dados de referência)
   - ID, CNPJ, Razão Social, Nome Fantasia

### Relacionamentos:
- Cliente 1:N Contratos
- Cliente 1:N Faturamento
- Contrato 1:1 Cliente (principal)
- Usina N:1 Projeto
