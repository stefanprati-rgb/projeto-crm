export const clientMapping = {
  // === Identificação ===
  'INSTALAÇÃO': 'instalacao',
  'Instalação': 'instalacao',
  'ID EXTERNO': 'externalId',
  'NOME COMPLETO OU RAZÃO SOCIAL': 'name',
  'Razão Social': 'name',
  'Nome': 'name', // Variação encontrada
  'CNPJ': 'cnpj',
  'CPF': 'cpf',
  'DOC': 'doc',
  'CONTA CONTRATO': 'contaContrato',

  // === Contrato e Status ===
  'TIPO CONTRATO': 'contractType',
  'STATUS DO CLIENTE': 'status',
  'STATUS DE CLIENTE': 'status',
  'STATUS RATEIO': 'statusRateio',
  'ETAPA UC': 'etapaUc',

  'DATA DE ADESÃO': 'joinDate',
  'DATA CANCELAMENTO': 'dataCancelamento',
  'DATA RETIRADA DE RATEIO': 'churnDate', // Mapeado para Data de Saída Real

  'MOTIVO CANCELAMENTO': 'motivoCancelamento',
  'MOTIVO RETIRADA': 'churnReason',       // Inteligência de Churn
  'MOTIVO RETIRADA RATEIO': 'churnReason',

  // === Inteligência Comercial (NOVOS) ===
  'CANAL DE ENTRADA': 'acquisitionChannel', // Inbound, Parceiro...
  'CANAL DO LEAD (INBOUND, OUTBOUND, PARCEIRO, AFILIADO)': 'acquisitionChannel',
  'PARCEIRO COMERCIAL': 'partner',          // Quem vendeu?

  // === Técnico e Operacional ===
  'FORNECIMENTO': 'connectionType',
  'EMPRESA NO CONTRATO': 'projeto',
  'DISTRIBUIDORA': 'distribuidora',
  'REGIÃO': 'region',

  // === Financeiro e Consumo ===
  'DESCONTO CONTRATADO': 'discount',
  'MÉDIA DE CONSUMO MÓVEL KWH': 'consumption',
  'CONS. DISPONÍVEL KWH': 'consumption',
  'CONSUMO ALVO': 'targetConsumption',
  'PARTICIPAÇÃO DISPONÍVEL': 'participation',

  'BOLETOS ATRASADOS': 'overdueBills',
  'DATA FIXA VENCIMENTO': 'dueDate',

  // === Endereço e Contato ===
  'E-MAIL': 'email',
  'TELEFONE': 'phone',
  'CIDADE': 'city',
  'UF': 'state',
  'CEP': 'cep',
  'ENDEREÇO COMPLETO': 'address'
};