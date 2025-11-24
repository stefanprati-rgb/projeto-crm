// Importador da aba "Acompanhamento FATURAMENTO"
// Requer XLSX global já carregado no index.html

import { parseRef, toDate } from "../../utils/date.js";

// Tenta localizar a aba correta pelo nome
const findSheetName = (wb) => {
  const target = wb.SheetNames.find(n => n.toUpperCase().includes("FATURAMENTO"));
  return target || wb.SheetNames[0];
};

// Acha a linha de cabeçalho varrendo as 40 primeiras linhas
const findHeaderRow = (ws) => {
  const R = XLSX.utils.sheet_to_json(ws, { header: 1, range: 0, blankrows: false });
  let bestRow = 0, bestScore = -1;
  for (let i = 0; i < Math.min(R.length, 40); i++) {
    const row = (R[i] || []).map(v => String(v || "").toUpperCase());
    let score = 0;
    if (row.includes("INSTALAÇÃO")) score++;
    if (row.includes("RZ SOCIAL") || row.includes("RAZÃO SOCIAL")) score++;
    if (row.includes("VALOR EMITIDO")) score++;
    if (row.includes("VALOR PAGO")) score++;
    if (row.includes("DATA DE VENCIMENTO")) score++;
    if (row.includes("DATA DE PAGAMENTO")) score++;
    if (row.includes("STATUS PGTO")) score++;
    if (row.includes("ENERGIA CONSUMIDA (KWH)") || row.includes("KWH")) score++;
    if (score > bestScore) { bestScore = score; bestRow = i; }
  }
  return bestRow;
};

const headerMap = {
  "INSTALAÇÃO": "instalacao",
  "RZ SOCIAL": "razaoSocial",
  "RAZÃO SOCIAL": "razaoSocial",
  "REF": "ref",
  "VALOR EMITIDO": "valorEmitido",
  "VALOR PAGO": "valorPago",
  "MULTAS E JUROS": "multasJuros",
  "DATA DE VENCIMENTO": "dataVenc",
  "DATA DE PAGAMENTO": "dataPag",
  "STATUS PGTO": "statusPgto",
  "ENERGIA CONSUMIDA (KWH)": "energiaKwh",
  "KWH": "energiaKwh",
  "BOLETO CANCELADO": "boletoCancelado",
  "MOTIVO CANCELAMENTO": "motivoCancelamento"
};

// Normaliza/cast de valores
const castRow = (r) => {
  const num = (v) => {
    if (v === null || v === undefined || v === "") return 0;
    const n = typeof v === 'string' ? Number(v.replace(/\./g,'').replace(',', '.')) : Number(v);
    return isNaN(n) ? 0 : n;
  };
  const out = { ...r };
  out.ref = parseRef(r.ref) || r.ref || null;
  out.valorEmitido = num(r.valorEmitido);
  out.valorPago    = num(r.valorPago);
  out.multasJuros  = num(r.multasJuros);
  out.energiaKwh   = num(r.energiaKwh);
  out.dataVenc = toDate(r.dataVenc)?.toISOString() ?? null;
  out.dataPag  = toDate(r.dataPag)?.toISOString() ?? null;
  if (out.statusPgto) out.statusPgto = String(out.statusPgto).toUpperCase().trim();
  return out;
};

export async function readInvoicesExcel(file) {
  const data = new Uint8Array(await file.arrayBuffer());
  const wb = XLSX.read(data, { type: "array", cellDates: true });
  const sheetName = findSheetName(wb);
  const ws = wb.Sheets[sheetName];

  const headerRow = findHeaderRow(ws);
  const rows = XLSX.utils.sheet_to_json(ws, {
    header: 1, range: headerRow, blankrows: false, defval: null
  });

  const headers = (rows.shift() || []).map(h => String(h || "").toUpperCase().trim());
  const idx = {};
  headers.forEach((h, i) => { if (headerMap[h]) idx[headerMap[h]] = i; });

  const json = rows.map((arr) => {
    const o = {};
    Object.entries(idx).forEach(([k, i]) => { o[k] = arr[i]; });
    return castRow(o);
  }).filter(o => o.instalacao || o.valorEmitido || o.valorPago);

  return json;
}
