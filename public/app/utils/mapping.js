export const clientMapping = {
  // === Identificação ===
  'INSTALAÇÃO': 'instalacao',           // Chave Principal (UC)
  'Instalação': 'instalacao',
  'ID EXTERNO': 'externalId',
  'NOME COMPLETO OU RAZÃO SOCIAL': 'name',
  'Razão Social': 'name',
  'CNPJ': 'cnpj',
  'CPF': 'cpf',
  'DOC': 'doc',
  'CONTA CONTRATO': 'contaContrato',

  // === Contrato e Status ===
  'TIPO CONTRATO': 'contractType',
  'STATUS DO CLIENTE': 'status',
  'STATUS DE CLIENTE': 'status',        // Mapeado do base.csv
  'STATUS RATEIO': 'statusRateio',
  'ETAPA UC': 'etapaUc',

  'DATA DE ADESÃO': 'joinDate',
  'DATA CANCELAMENTO': 'dataCancelamento',
  'DATA RETIRADA DE RATEIO': 'dataCancelamento', // Mapeado do base.csv

  'MOTIVO CANCELAMENTO': 'motivoCancelamento',
  'MOTIVO RETIRADA': 'motivoCancelamento',       // Mapeado do base.csv

  // === Técnico e Operacional ===
  'FORNECIMENTO': 'connectionType',
  'EMPRESA NO CONTRATO': 'projeto',
  'DISTRIBUIDORA': 'distribuidora',
  'REGIÃO': 'region',                   // Mapeado do base.csv

  // === Financeiro e Consumo ===
  'DESCONTO CONTRATADO': 'discount',
  'MÉDIA DE CONSUMO MÓVEL KWH': 'consumption',
  'CONS. DISPONÍVEL KWH': 'consumption', // Mapeado do base.csv
  'CONSUMO ALVO': 'targetConsumption',   // NOVO: Para cálculo de vacância
  'PARTICIPAÇÃO DISPONÍVEL': 'participation',

  'BOLETOS ATRASADOS': 'overdueBills',   // NOVO: Indicador rápido de risco
  'DATA FIXA VENCIMENTO': 'dueDate',

  // === Endereço e Contato ===
  'E-MAIL': 'email',
  'TELEFONE': 'phone',
  'CIDADE': 'city',
  'UF': 'state',
  'CEP': 'cep',
  'ENDEREÇO COMPLETO': 'address'
};