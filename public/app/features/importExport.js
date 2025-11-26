import { db } from "../core/firebase.js";
import { collection, doc, writeBatch } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { showToast } from "../ui/toast.js";
import { clientMapping } from "../utils/mapping.js";

class ExcelProcessor {
  constructor(targetDatabase) {
    this.mapping = clientMapping;
    this.targetDatabase = targetDatabase || 'GERAL'; // Define a base de destino (ex: EGS, CGB)
  }

  generateId() {
    return 'C' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  }

  parseDate(value) {
    if (!value) return null;
    if (value instanceof Date) return value.toISOString();
    // Tenta corrigir datas em texto se necessário
    const d = new Date(value);
    return isNaN(d.getTime()) ? value : d.toISOString();
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

          // Tenta encontrar a aba correta (prioridade para 'base' ou 'clientes')
          let sheetName = workbook.SheetNames.find(n =>
            n.toLowerCase().includes('base') ||
            n.toUpperCase().includes('clientes')
          ) || workbook.SheetNames[0];

          console.log(`Processando aba: ${sheetName}`);
          const ws = workbook.Sheets[sheetName];

          // --- DETECÇÃO AUTOMÁTICA DE CABEÇALHO ---
          // A base EGS tem a linha 1 vazia. Verificamos a célula A1.
          let startRow = 0;
          const cellA1 = ws[XLSX.utils.encode_cell({ r: 0, c: 0 })];

          // Se A1 não existe ou está vazia, assumimos que o cabeçalho está na linha 2 (index 1)
          if (!cellA1 || !cellA1.v) {
            console.log('Linha 1 vazia detectada. Usando linha 2 como cabeçalho.');
            startRow = 1;
          }

          const jsonData = XLSX.utils.sheet_to_json(ws, { range: startRow, defval: "" });

          jsonData.forEach(row => {
            // Validação mínima: Ignora linhas totalmente vazias
            // Verifica se tem "Nome/Razão Social" OU "Instalação"
            const hasName = row['NOME COMPLETO OU RAZÃO SOCIAL'] || row['Razão Social'] || row['NOME'];
            const hasUC = row['INSTALAÇÃO'] || row['Instalação'];

            if (!hasName && !hasUC) return;

            const client = {
              id: this.generateId(),
              source: 'IMPORT',
              database: this.targetDatabase, // Salva a tag da base (EGS/CGB)
              createdAt: new Date().toISOString()
            };

            // Mapeamento dinâmico
            for (const [excelHeader, val] of Object.entries(row)) {
              // Remove espaços extras do nome da coluna
              const cleanHeader = excelHeader.trim();
              const mappedKey = this.mapping[cleanHeader];

              if (mappedKey && val !== undefined && val !== "") {
                if (mappedKey === 'joinDate') {
                  client[mappedKey] = this.parseDate(val);
                }
                else if (mappedKey === 'cpf' || mappedKey === 'cnpj') {
                  client[mappedKey] = this.cleanDoc(val);
                }
                else if (mappedKey === 'consumption' || mappedKey === 'discount') {
                  // Trata números que venham como string "1.200,50"
                  if (typeof val === 'string') {
                    client[mappedKey] = parseFloat(val.replace(',', '.')) || 0;
                  } else {
                    client[mappedKey] = val;
                  }
                }
                else {
                  client[mappedKey] = val;
                }
              }
            }

            // Fallback para nome se não existir (usa a UC)
            if (!client.name && client.instalacao) {
              client.name = `Cliente UC ${client.instalacao}`;
            }

            result.clients.push(client);
          });

          resolve(result.clients);
        } catch (err) { reject(err); }
      };
      reader.readAsArrayBuffer(file);
    });
  }
}

// Função principal chamada pelo botão
export async function readExcelFile(file, targetDatabase) {
  const processor = new ExcelProcessor(targetDatabase);
  showToast(`Lendo ficheiro para base: ${targetDatabase || 'Geral'}...`, 'info');

  try {
    const clients = await processor.processExcelFile(file);

    if (clients.length === 0) {
      showToast('Nenhum cliente encontrado. Verifique o formato da planilha.', 'warning');
      return [];
    }

    showToast(`A salvar ${clients.length} registos...`, 'info');
    await saveToFirestoreBatch(clients, 'clients');

    showToast('Importação concluída com sucesso!', 'success');
    return clients;

  } catch (error) {
    console.error(error);
    showToast('Erro ao processar: ' + error.message, 'danger');
    throw error;
  }
}

// Salva no Firestore em lotes de 450
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
      // Usa a UC como ID do documento se existir (evita duplicatas ao reimportar)
      // Se não tiver UC, usa o ID gerado aleatoriamente
      let docId = item.id;
      if (item.instalacao) {
        // Sanitiza a UC para ser um ID válido (remove barras se houver)
        const cleanUC = item.instalacao.toString().replace(/[^a-zA-Z0-9]/g, '_');
        docId = `UC_${cleanUC}`;
      }

      const ref = doc(collection(db, collectionName), docId);
      batch.set(ref, item, { merge: true }); // Atualiza sem apagar campos existentes
    });
    await batch.commit();
    batchCount++;
    console.log(`Lote ${batchCount}/${chunks.length} salvo.`);
  }
}

export function exportJSON(clients) {
  if (!clients?.length) return;
  const blob = new Blob([JSON.stringify(clients, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement('a'), { href: url, download: `crm_backup.json` });
  document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
}

export function exportExcel(clients) {
  if (!clients?.length) return;

  // Inverte o mapeamento para usar nomes de colunas amigáveis
  const reverseMapping = {};
  for (const [key, val] of Object.entries(clientMapping)) {
    // Pega apenas a primeira ocorrência para o cabeçalho
    if (!Object.values(reverseMapping).includes(val)) {
      reverseMapping[val] = key;
    }
  }

  const ordered = clients.map(c => {
    const o = {};
    for (const [appField, excelHeader] of Object.entries(reverseMapping)) {
      if (c[appField] !== undefined) o[excelHeader] = c[appField];
    }
    return o;
  });

  const ws = XLSX.utils.json_to_sheet(ordered);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Clientes");
  XLSX.writeFile(wb, `CRM_Clientes.xlsx`);
}