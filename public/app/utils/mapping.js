export const clientMapping = {
  // === Identificação ===
  'INSTALAÇÃO': 'instalacao',           // UC
  'ID EXTERNO': 'externalId',
  'NOME COMPLETO OU RAZÃO SOCIAL': 'name',
  'CPF': 'cpf',
  'CNPJ': 'cnpj',
  'DOC': 'doc',
  'CONTA CONTRATO': 'contaContrato',    // NOVO: Solicitação AL Ambiental

  // === Contrato e Status ===
  'TIPO CONTRATO': 'contractType',
  'STATUS DO CLIENTE': 'status',
  'STATUS RATEIO': 'statusRateio',      // Importante para o novo gráfico
  'ETAPA UC': 'etapaUc',
  'DATA DE ADESÃO': 'joinDate',
  'DATA CANCELAMENTO': 'dataCancelamento',

  // === Técnico ===
  'FORNECIMENTO': 'connectionType',
  'EMPRESA NO CONTRATO': 'projeto',
  'DISTRIBUIDORA': 'distribuidora',

  // === Financeiro e Consumo ===
  'DESCONTO CONTRATADO': 'discount',
  'MÉDIA DE CONSUMO MÓVEL KWH': 'consumption', // Usado para cálculo de vacância
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