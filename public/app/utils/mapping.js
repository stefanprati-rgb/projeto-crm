export const clientMapping = {
  // === Identificação ===
  'INSTALAÇÃO': 'instalacao',           // Chave Principal (UC)
  'Instalação': 'instalacao',           // Variação de caixa
  'ID EXTERNO': 'externalId',
  'NOME COMPLETO OU RAZÃO SOCIAL': 'name',
  'Razão Social': 'name',               // Variação no arquivo de faturamento
  'CPF': 'cpf',
  'CNPJ': 'cnpj',
  'DOC': 'doc',
  'CONTA CONTRATO': 'contaContrato',

  // === Contrato e Status ===
  'TIPO CONTRATO': 'contractType',
  'STATUS DO CLIENTE': 'status',
  'STATUS DE CLIENTE': 'status',        // Variação EGS
  'STATUS RATEIO': 'statusRateio',
  'ETAPA UC': 'etapaUc',
  'DATA DE ADESÃO': 'joinDate',
  'DATA CANCELAMENTO': 'dataCancelamento',
  'MOTIVO CANCELAMENTO': 'motivoCancelamento',
  'MOTIVO RETIRADA': 'motivoCancelamento', // Variação EGS

  // === Técnico ===
  'FORNECIMENTO': 'connectionType',
  'EMPRESA NO CONTRATO': 'projeto',
  'DISTRIBUIDORA': 'distribuidora',
  'Distribuidora': 'distribuidora',     // Variação EGS
  'REGIÃO': 'region',                   // Novo EGS (ex: MS)

  // === Financeiro e Consumo ===
  'DESCONTO CONTRATADO': 'discount',
  'MÉDIA DE CONSUMO MÓVEL KWH': 'consumption',
  'CONS. DISPONÍVEL KWH': 'consumption', // Variação EGS
  'PARTICIPAÇÃO DISPONÍVEL': 'participation',
  'DATA FIXA VENCIMENTO': 'dueDate',

  // === Endereço ===
  'E-MAIL': 'email',
  'TELEFONE': 'phone',
  'CIDADE': 'city',
  'UF': 'state',
  'CEP': 'cep',
  'ENDEREÇO COMPLETO': 'address'
};