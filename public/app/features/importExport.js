import { db } from "../core/firebase.js";
import { collection, doc, writeBatch } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { showToast } from "../ui/toast.js";
import { clientMapping } from "../utils/mapping.js";

class ExcelProcessor {
  constructor(targetDatabase) {
    this.mapping = clientMapping;
    this.targetDatabase = targetDatabase || 'GERAL';
  }

  generateId() {
    return 'C' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  }

  parseDate(value) {
    if (!value) return null;
    if (value instanceof Date) return value.toISOString();
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

          let sheetName = workbook.SheetNames.find(n =>
            n.toLowerCase().includes('base') ||
            n.toUpperCase().includes('CLIENTES')
          ) || workbook.SheetNames[0];

          console.log(`Processando aba: ${sheetName}`);
          const ws = workbook.Sheets[sheetName];

          let startRow = 0;
          const cellA1 = ws[XLSX.utils.encode_cell({ r: 0, c: 0 })];

          if (!cellA1 || !cellA1.v) {
            startRow = 1;
          }

          const jsonData = XLSX.utils.sheet_to_json(ws, { range: startRow, defval: "" });

          jsonData.forEach(row => {
            const hasName = row['NOME COMPLETO OU RAZÃO SOCIAL'] || row['Razão Social'] || row['NOME'];
            const hasUC = row['INSTALAÇÃO'] || row['Instalação'];

            if (!hasName && !hasUC) return;

            const client = {
              id: this.generateId(),
              source: 'IMPORT',
              database: this.targetDatabase,
              createdAt: new Date().toISOString()
            };

            for (const [excelHeader, val] of Object.entries(row)) {
              const cleanHeader = excelHeader.trim();
              const mappedKey = this.mapping[cleanHeader];

              if (mappedKey && val !== undefined && val !== "") {
                if (mappedKey === 'joinDate') {
                  client[mappedKey] = this.parseDate(val);
                }
                else if (mappedKey === 'cpf' || mappedKey === 'cnpj') {
                  client[mappedKey] = this.cleanDoc(val);
                }
                else if (mappedKey === 'consumption' || mappedKey === 'discount' || mappedKey === 'targetConsumption') {
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
      let docId = item.id;
      if (item.instalacao) {
        const cleanUC = item.instalacao.toString().replace(/[^a-zA-Z0-9]/g, '_');
        docId = `UC_${cleanUC}`;
      }

      const ref = doc(collection(db, collectionName), docId);
      batch.set(ref, item, { merge: true });
    });
    await batch.commit();
    batchCount++;
    console.log(`Lote ${batchCount}/${chunks.length} salvo.`);
  }
}

export function exportJSON(clients) {
  if (!clients?.length) {
    showToast('Sem dados para exportar', 'warning');
    return;
  }
  const blob = new Blob([JSON.stringify(clients, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement('a'), { href: url, download: `crm_backup_${new Date().toISOString().slice(0, 10)}.json` });
  document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
}

export function exportExcel(clients) {
  if (!clients?.length) {
    showToast('Sem dados para exportar', 'warning');
    return;
  }

  const reverseMapping = {};
  for (const [key, val] of Object.entries(clientMapping)) {
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
  XLSX.writeFile(wb, `CRM_Clientes_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

// --- NOVA FUNÇÃO: EXPORTAÇÃO PDF ---
export function exportPDF(clients, title = "Relatório de Clientes") {
  if (!clients?.length) {
    showToast('Sem dados para exportar', 'warning');
    return;
  }

  // Acede ao jspdf global (importado via CDN no index.html)
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  // Título e Metadados
  doc.setFontSize(18);
  doc.setTextColor(15, 118, 110); // Teal 700 (Cor da marca)
  doc.text(title, 14, 22);

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Gerado em: ${new Date().toLocaleDateString()} às ${new Date().toLocaleTimeString()}`, 14, 30);
  doc.text(`Total de Registos: ${clients.length}`, 14, 35);

  // Colunas da Tabela
  const tableColumn = ["Nome / Razão Social", "Documento", "Status", "Cidade/UF", "Consumo (kWh)"];
  const tableRows = [];

  // Prepara os dados
  clients.forEach(client => {
    const clientData = [
      client.name || "Sem Nome",
      client.cpf || client.cnpj || "N/A",
      client.status || "N/A",
      `${client.city || ''} ${client.state ? '/ ' + client.state : ''}`,
      client.consumption || "0"
    ];
    tableRows.push(clientData);
  });

  // Gera a tabela usando autoTable
  doc.autoTable({
    head: [tableColumn],
    body: tableRows,
    startY: 40,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 3, font: 'helvetica' },
    headStyles: { fillColor: [15, 118, 110], textColor: 255, fontStyle: 'bold' }, // Header Teal
    alternateRowStyles: { fillColor: [240, 253, 250] }, // Zebra striping suave (Teal 50)
    margin: { top: 40 }
  });

  // Salva o arquivo
  const fileName = `relatorio_crm_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(fileName);
  showToast('Relatório PDF gerado com sucesso!', 'success');
}