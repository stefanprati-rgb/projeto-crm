export const clientMapping = {
  // === Identificação ===
  'INSTALAÇÃO': 'instalacao',           // UC
  'ID EXTERNO': 'externalId',
  'NOME COMPLETO OU RAZÃO SOCIAL': 'name', // Razão Social
  'CPF': 'cpf',
  'CNPJ': 'cnpj',
  'DOC': 'doc',

  // === Contrato e Status ===
  'TIPO CONTRATO': 'contractType',
  'STATUS DO CLIENTE': 'status',        // Status Cliente (Ativo/Cancelado)
  'STATUS RATEIO': 'statusRateio',      // Status Rateio (Apto, Acompanhar...)
  'ETAPA UC': 'etapaUc',                // Preparado para planilha da Livia
  'DATA DE ADESÃO': 'joinDate',
  'DATA CANCELAMENTO': 'dataCancelamento',
  'MOTIVO CANCELAMENTO': 'motivoCancelamento',

  // === Técnico e Comercial ===
  'FORNECIMENTO': 'connectionType',     // Mono/Bifásico
  'EMPRESA NO CONTRATO': 'projeto',     // Projeto
  'DISTRIBUIDORA': 'distribuidora',     // Preparado caso adicione na planilha
  'PARCEIRO COMERCIAL': 'partner',
  'CANAL DE ENTRADA': 'channel',

  // === Financeiro e Consumo ===
  'DESCONTO CONTRATADO': 'discount',
  'MÉDIA DE CONSUMO MÓVEL KWH': 'consumption',
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