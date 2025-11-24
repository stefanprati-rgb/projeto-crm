import { clientMapping } from "../utils/mapping.js";
import { cleanDoc, normalizeStatus } from "../utils/helpers.js";
import { showToast } from "../ui/toast.js";

export function readExcelFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const wb = XLSX.read(data, { type: 'array', cellDates: true });
        const sheetName = wb.SheetNames.find(n => n.toUpperCase().includes('BASE DE CLIENTES')) || wb.SheetNames[0];
        if (!sheetName) return reject(new Error('Nenhuma aba válida encontrada.'));
        resolve(XLSX.utils.sheet_to_json(wb.Sheets[sheetName]));
      } catch (err) { reject(err); }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

export function mapRowToClient(row) {
  const out = {};
  for (const excelHeader in clientMapping) {
    const key = clientMapping[excelHeader];
    const val = row[excelHeader];
    if (val === undefined) continue;
    if (key === 'joinDate' && val instanceof Date) out[key] = val.toISOString();
    else if (key === 'cpf' || key === 'cnpj') out[key] = cleanDoc(val);
    else if (key === 'status') out[key] = normalizeStatus(val);
    else out[key] = val;
  }
  return out;
}

export function exportJSON(clients) {
  if (!clients?.length) { showToast('Não há dados para exportar.', 'warning'); return; }
  const blob = new Blob([JSON.stringify(clients, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement('a'), { href: url, download: `crm_backup_${new Date().toISOString().split('T')[0]}.json` });
  document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  showToast('Dados exportados com sucesso!', 'success');
}

export function exportExcel(clients) {
  if (!clients?.length) { showToast('Não há dados para exportar.', 'warning'); return; }
  const ordered = clients.map(({id, ...c}) => {
    const o = {};
    for (const excelHeader in clientMapping) {
      const key = clientMapping[excelHeader];
      if (c.hasOwnProperty(key)) o[excelHeader] = c[key];
    }
    return o;
  });
  const ws = XLSX.utils.json_to_sheet(ordered);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Clientes");
  XLSX.writeFile(wb, `CRM_Clientes_${new Date().toISOString().split('T')[0]}.xlsx`);
  showToast('Excel exportado com sucesso!', 'success');
}
