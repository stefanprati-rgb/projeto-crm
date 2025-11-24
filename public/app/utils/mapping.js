export const clientMapping = {
  // Identificação e Contato
  'INSTALAÇÃO': 'instalacao',
  'ID EXTERNO': 'externalId',
  'NOME COMPLETO OU RAZÃO SOCIAL': 'name',
  'CPF': 'cpf',
  'CNPJ': 'cnpj',
  'DOC': 'doc', // Campo extra encontrado
  'E-MAIL': 'email',
  'TELEFONE': 'phone',

  // Contrato e Status
  'TIPO CONTRATO': 'contractType',
  'STATUS DO CLIENTE': 'status',
  'STATUS RATEIO': 'statusRateio',
  'DATA DE ADESÃO': 'joinDate',
  'DATA CANCELAMENTO': 'dataCancelamento',
  'MOTIVO CANCELAMENTO': 'motivoCancelamento',

  // Endereço
  'CIDADE': 'city',
  'UF': 'state',
  'CEP': 'cep',
  'ENDEREÇO COMPLETO': 'address',

  // Dados Técnicos e Financeiros
  'FORNECIMENTO': 'connectionType', // Ex: Monofásico, Bifásico
  'EMPRESA NO CONTRATO': 'projeto', // Ex: Consorcio Era Verde
  'DESCONTO CONTRATADO': 'discount',
  'PARTICIPAÇÃO DISPONÍVEL': 'participation',
  'MÉDIA DE CONSUMO MÓVEL KWH': 'consumption',
  'DATA FIXA VENCIMENTO': 'dueDate',
  'PARCEIRO COMERCIAL': 'partner',
  'CANAL DE ENTRADA': 'channel'
};