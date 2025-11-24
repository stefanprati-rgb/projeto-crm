export const clientMapping = {
  // === Identificação ===
  'INSTALAÇÃO': 'instalacao',           // UC
  'ID EXTERNO': 'externalId',
  'NOME COMPLETO OU RAZÃO SOCIAL': 'name',
  'CPF': 'cpf',
  'CNPJ': 'cnpj',
  'DOC': 'doc',                         // Campo auxiliar de documento encontrado

  // === Contrato e Status ===
  'TIPO CONTRATO': 'contractType',
  'STATUS DO CLIENTE': 'status',
  'STATUS RATEIO': 'statusRateio',      // Confirmado no arquivo
  'DATA DE ADESÃO': 'joinDate',
  'DATA CANCELAMENTO': 'dataCancelamento',
  'MOTIVO CANCELAMENTO': 'motivoCancelamento',

  // === Técnico e Comercial ===
  'FORNECIMENTO': 'connectionType',     // CORREÇÃO: Monofásico, Bifásico, etc.
  'EMPRESA NO CONTRATO': 'projeto',     // Confirmado: Consórcio/Usina
  'PARCEIRO COMERCIAL': 'partner',      // Novo campo útil
  'CANAL DE ENTRADA': 'channel',        // Novo campo útil

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