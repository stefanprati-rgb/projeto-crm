import { db } from "../core/firebase.js";
import { collection, doc, writeBatch } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { showToast } from "../ui/toast.js";

// === 1. Lógica de Processamento (Adaptada do seu exemplo robusto) ===
class ExcelProcessor {
  constructor() {
    this.fieldMappings = {
      'BASE DE CLIENTES V1': {
        'ID EXTERNO': 'externalId',
        'NOME COMPLETO OU RAZÃO SOCIAL': 'name',
        'TIPO CONTRATO': 'contractType',
        'CPF': 'cpf',
        'CNPJ': 'cnpj',
        'DATA DE ADESÃO': 'joinDate',
        'STATUS DO CLIENTE': 'status',
        'E-MAIL': 'email',
        'TELEFONE': 'phone',
        'CIDADE': 'city',
        'UF': 'state',
        'CEP': 'cep',
        'ENDEREÇO COMPLETO': 'address',
        'DESCONTO CONTRATADO': 'discount',
        'PARTICIPAÇÃO DISPONÍVEL': 'participation',
        'MÉDIA DE CONSUMO MÓVEL KWH': 'consumoMedio'
      },
      'MODELO CAD PORTAL GD': {
        'ID Externo': 'externalId',
        'CPF ou CNPJ': 'cpfCnpj',
        'Nome ou Razão Social': 'name',
        'Tipo Contrato': 'contractType',
        'Data Assinatura': 'signatureDate',
        'Desconto (%)': 'discount',
        'Participação (kWh)': 'participation',
        'Id Externo - Usina': 'plantExternalId',
        'Nome - Usina': 'plantName',
        'Instalação - Usina': 'plantInstalacao',
        'Início Operação - Usina': 'plantInicioOperacao'
      }
    };
  }

  generateId() {
    return 'C' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  }

  parseDate(value) {
    if (!value) return null;
    if (value instanceof Date) return value.toISOString();
    // Tratamento simples para string (assumindo formato ISO ou similar se necessário)
    return new Date(value).toISOString();
  }

  cleanDoc(value) {
    if (!value) return '';
    return value.toString().replace(/[^0-9]/g, '');
  }

  parseNumber(value) {
    if (!value) return 0;
    if (typeof value === 'number') return value;
    return parseFloat(value.replace(',', '.')) || 0;
  }

  async processExcelFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array', cellDates: true });

          const result = { clients: [], contracts: [], plants: [] };

          // ... dentro de processExcelFile ...

          // Processar Abas
          workbook.SheetNames.forEach(sheetName => {
            // Ajuste: A planilha 'BASE DE CLIENTES V1' tem o cabeçalho na linha 2 (índice 1)
            // Usamos 'range: 1' para pular a primeira linha vazia se for esta aba.
            let options = { defval: "" }; // defval garante que células vazias venham como string vazia

            if (sheetName.toUpperCase().includes('BASE DE CLIENTES V1')) {
              options.range = 1; // Pula a primeira linha (linha 0), começa na linha 1
            }

            const jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], options);

            // Debug: Verifique no console se os dados estão vindo corretamente
            if (jsonData.length > 0) {
              console.log(`Aba ${sheetName}: Primeira linha processada:`, jsonData[0]);
            }

            // Lógica para 'BASE DE CLIENTES V1'
            if (sheetName.toUpperCase().includes('BASE DE CLIENTES')) {
              const mapping = this.fieldMappings['BASE DE CLIENTES V1']; // Certifique-se de atualizar o constructor com o mapping novo

              jsonData.forEach(row => {
                // Validação básica: se não tiver nome nem instalação, ignora (linha vazia)
                if (!row['NOME COMPLETO OU RAZÃO SOCIAL'] && !row['INSTALAÇÃO']) return;

                const client = { id: this.generateId(), source: 'IMPORT', createdAt: new Date().toISOString() };

                // ... resto do loop de mapeamento igual ao anterior ...
                // ...
                for (const [excelField, appField] of Object.entries(mapping)) {
                  if (row[excelField] !== undefined) {
                    if (appField === 'joinDate') client[appField] = this.parseDate(row[excelField]);
                    else if (appField === 'cpf' || appField === 'cnpj') client[appField] = this.cleanDoc(row[excelField]);
                    else client[appField] = row[excelField];
                  }
                }
                result.clients.push(client);
              });
            }

            // Lógica para 'MODELO CAD PORTAL GD' (Exemplo simplificado)
            if (sheetName.toUpperCase().includes('PORTAL GD')) {
              const mapping = this.fieldMappings['MODELO CAD PORTAL GD'];
              jsonData.forEach(row => {
                // Aqui você pode expandir para separar Cliente, Contrato e Usina conforme seu script original
                // Para simplificar o teste inicial, vamos focar nos clientes
                const client = { id: this.generateId(), source: 'GD_IMPORT', createdAt: new Date().toISOString() };
                if (row['Nome ou Razão Social']) client.name = row['Nome ou Razão Social'];
                result.clients.push(client);
              });
            }
          });

          resolve(result);
        } catch (err) { reject(err); }
      };
      reader.readAsArrayBuffer(file);
    });
  }
}

// === 2. Funções Exportadas para a UI ===

export async function processAndUpload(file) {
  const processor = new ExcelProcessor();
  showToast('Processando arquivo...', 'info');

  try {
    const data = await processor.processExcelFile(file);

    if (data.clients.length === 0) {
      showToast('Nenhum dado válido encontrado nas abas esperadas.', 'warning');
      return;
    }

    showToast(`Encontrados ${data.clients.length} clientes. Iniciando upload...`, 'info');
    await saveToFirestoreBatch(data.clients, 'clients');

    // Se houver contratos/usinas, salvar também:
    // await saveToFirestoreBatch(data.contracts, 'contracts');

    showToast('Importação concluída com sucesso!', 'success');

    // Recarregar a página ou atualizar a tabela
    setTimeout(() => window.location.reload(), 1500);

  } catch (error) {
    console.error(error);
    showToast('Erro ao processar arquivo: ' + error.message, 'danger');
  }
}

// Função auxiliar para salvar em lotes (Firestore tem limite de 500 ops por lote)
async function saveToFirestoreBatch(items, collectionName) {
  const batchSize = 450; // Margem de segurança
  const chunks = [];

  for (let i = 0; i < items.length; i += batchSize) {
    chunks.push(items.slice(i, i + batchSize));
  }

  let batchCount = 0;
  for (const chunk of chunks) {
    const batch = writeBatch(db);
    chunk.forEach(item => {
      const ref = doc(collection(db, collectionName), item.id); // Usa o ID gerado ou deixe o Firestore gerar
      batch.set(ref, item);
    });
    await batch.commit();
    batchCount++;
    console.log(`Lote ${batchCount}/${chunks.length} salvo em ${collectionName}.`);
  }
}

// Manter compatibilidade com chamadas antigas se houver
export function readExcelFile(file) {
  return processAndUpload(file);
}