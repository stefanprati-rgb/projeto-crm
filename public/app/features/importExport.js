import { db } from "../core/firebase.js";
import { collection, doc, writeBatch } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { showToast } from "../ui/toast.js";
import { clientMapping } from "../utils/mapping.js";

// === 1. Lógica de Processamento ===
class ExcelProcessor {
  constructor() {
    // Usa o mapping centralizado
    this.mapping = clientMapping;
  }

  generateId() {
    return 'C' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  }

  parseDate(value) {
    if (!value) return null;
    if (value instanceof Date) return value.toISOString();
    return new Date(value).toISOString();
  }

  cleanDoc(value) {
    if (!value) return '';
    return value.toString().replace(/[^0-9]/g, '');
  }

  async processExcelFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array', cellDates: true });

          const result = { clients: [] };

          workbook.SheetNames.forEach(sheetName => {
            // Configuração para pular a linha vazia da "BASE DE CLIENTES"
            let options = { defval: "" };
            if (sheetName.toUpperCase().includes('BASE DE CLIENTES')) {
              options.range = 1; // Pula a primeira linha (linha 0)
            }

            const jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], options);

            // Lógica para 'BASE DE CLIENTES V1'
            if (sheetName.toUpperCase().includes('BASE DE CLIENTES')) {
              jsonData.forEach(row => {
                // Ignora linhas vazias (sem nome e sem instalação)
                if (!row['NOME COMPLETO OU RAZÃO SOCIAL'] && !row['INSTALAÇÃO']) return;

                const client = { id: this.generateId(), source: 'IMPORT', createdAt: new Date().toISOString() };

                // Mapeia colunas do Excel para campos do Sistema
                for (const [excelField, appField] of Object.entries(this.mapping)) {
                  if (row[excelField] !== undefined && row[excelField] !== "") {
                    if (appField === 'joinDate' || appField === 'dataCancelamento') {
                      client[appField] = this.parseDate(row[excelField]);
                    }
                    else if (appField === 'cpf' || appField === 'cnpj') {
                      client[appField] = this.cleanDoc(row[excelField]);
                    }
                    else {
                      client[appField] = row[excelField];
                    }
                  }
                }
                result.clients.push(client);
              });
            }
          });

          resolve(result.clients);
        } catch (err) { reject(err); }
      };
      reader.readAsArrayBuffer(file);
    });
  }
}

// === 2. Funções Exportadas para a UI ===

export async function readExcelFile(file) {
  const processor = new ExcelProcessor();
  showToast('Processando arquivo...', 'info');

  try {
    const clients = await processor.processExcelFile(file);

    if (clients.length === 0) {
      showToast('Nenhum dado válido encontrado. Verifique se é a planilha correta.', 'warning');
      return [];
    }

    showToast(`Encontrados ${clients.length} clientes. Iniciando upload...`, 'info');
    await saveToFirestoreBatch(clients, 'clients');

    showToast('Importação concluída com sucesso!', 'success');
    return clients;

  } catch (error) {
    console.error(error);
    showToast('Erro ao processar arquivo: ' + error.message, 'danger');
    throw error;
  }
}

// Salva em lotes (Firestore Batch)
async function saveToFirestoreBatch(items, collectionName) {
  const batchSize = 450;
  const chunks = [];

  for (let i = 0; i < items.length; i += batchSize) {
    chunks.push(items.slice(i, i + batchSize));
  }

  let batchCount = 0;
  for (const chunk of chunks) {
    const batch = writeBatch(db);
    chunk.forEach(item => {
      const ref = doc(collection(db, collectionName), item.id);
      batch.set(ref, item, { merge: true }); // merge: true atualiza sem apagar campos extras
    });
    await batch.commit();
    batchCount++;
    console.log(`Lote ${batchCount}/${chunks.length} salvo.`);
  }
}

export function exportJSON(clients) {
  if (!clients?.length) { showToast('Não há dados para exportar.', 'warning'); return; }
  const blob = new Blob([JSON.stringify(clients, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement('a'), { href: url, download: `crm_backup_${new Date().toISOString().split('T')[0]}.json` });
  document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  showToast('JSON exportado!', 'success');
}

export function exportExcel(clients) {
  if (!clients?.length) { showToast('Não há dados para exportar.', 'warning'); return; }

  // Inverte o mapeamento para exportar com os nomes originais das colunas
  const reverseMapping = {};
  for (const [key, val] of Object.entries(clientMapping)) {
    reverseMapping[val] = key;
  }

  const ordered = clients.map(c => {
    const o = {};
    for (const [appField, excelHeader] of Object.entries(reverseMapping)) {
      if (c[appField]) o[excelHeader] = c[appField];
    }
    return o;
  });

  const ws = XLSX.utils.json_to_sheet(ordered);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Clientes");
  XLSX.writeFile(wb, `CRM_Clientes_${new Date().toISOString().split('T')[0]}.xlsx`);
  showToast('Excel exportado!', 'success');
}