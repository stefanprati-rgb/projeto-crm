// Importador Inteligente de Faturas (Adaptado para Faturamento.csv)
import { parseRef, toDate } from "../../utils/date.js";

// Tenta localizar a aba correta pelo nome (caso seja xlsx)
const findSheetName = (wb) => {
  const target = wb.SheetNames.find(n => n.toUpperCase().includes("FATURAMENTO"));
  return target || wb.SheetNames[0];
};

// Acha a linha de cabeçalho varrendo as 40 primeiras linhas
const findHeaderRow = (ws) => {
  const R = XLSX.utils.sheet_to_json(ws, { header: 1, range: 0, blankrows: false });
  let bestRow = 0, bestScore = -1;

  // Palavras-chave para identificar o cabeçalho do Faturamento.csv
  const keywords = ["INSTALAÇÃO", "RAZÃO SOCIAL", "REFERÊNCIA", "VALOR EMITIDO", "STATUS PAGAMENTO"];

  for (let i = 0; i < Math.min(R.length, 40); i++) {
    const row = (R[i] || []).map(v => String(v || "").toUpperCase().trim());
    let score = 0;
    keywords.forEach(k => {
      if (row.includes(k)) score++;
    });

    if (score > bestScore) { bestScore = score; bestRow = i; }
  }
  return bestRow;
};

// Mapa exato das colunas do Faturamento.csv para o Firestore
const headerMap = {
  "INSTALAÇÃO": "instalacao",
  "RAZÃO SOCIAL": "razaoSocial",
  "RZ SOCIAL": "razaoSocial",
  "REFERÊNCIA": "ref",                // Ajustado para o CSV
  "REF": "ref",
  "VALOR EMITIDO": "valorEmitido",
  "VALOR PAGO": "valorPago",
  "MULTA/JUROS": "multasJuros",       // Ajustado para o CSV (Multa/Juros)
  "MULTAS E JUROS": "multasJuros",
  "DATA VENCIMENTO": "dataVenc",      // Ajustado
  "DATA DE VENCIMENTO": "dataVenc",
  "DATA PAGAMENTO": "dataPag",        // Ajustado
  "DATA DE PAGAMENTO": "dataPag",
  "STATUS PAGAMENTO": "statusPgto",   // Ajustado
  "STATUS PGTO": "statusPgto",
  "CRÉD. CONSUMIDO": "energiaKwh",    // Mapeia 'Créd. Consumido' como energia
  "ENERGIA CONSUMIDA (KWH)": "energiaKwh",
  "MOTIVO NÃO EMISSÃO": "motivoCancelamento",
  "MOTIVO CANCELAMENTO": "motivoCancelamento"
};

// Normaliza/cast de valores
const castRow = (r) => {
  const num = (v) => {
    if (v === null || v === undefined || v === "") return 0;
    // Remove R$, espaços e trata vírgula decimal
    const n = typeof v === 'string'
      ? Number(v.replace('R$', '').trim().replace(/\./g, '').replace(',', '.'))
      : Number(v);
    return isNaN(n) ? 0 : n;
  };

  const out = { ...r };

  // Tratamento especial para Referência (YYYY-MM-DD ou MM/YYYY)
  out.ref = parseRef(r.ref) || r.ref || null;

  out.valorEmitido = num(r.valorEmitido);
  out.valorPago = num(r.valorPago);
  out.multasJuros = num(r.multasJuros);
  out.energiaKwh = num(r.energiaKwh);

  out.dataVenc = toDate(r.dataVenc)?.toISOString() ?? null;
  out.dataPag = toDate(r.dataPag)?.toISOString() ?? null;

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

  // Normaliza headers do Excel para Uppercase para o match funcionar
  const headers = (rows.shift() || []).map(h => String(h || "").toUpperCase().trim());

  const idx = {};
  headers.forEach((h, i) => { if (headerMap[h]) idx[headerMap[h]] = i; });

  const json = rows.map((arr) => {
    const o = {};
    // Se o item tiver ID (gerado por outro processo), preserva
    if (arr.id) o.id = arr.id;

    Object.entries(idx).forEach(([k, i]) => { o[k] = arr[i]; });

    // Gera um ID único para a fatura se não existir: UC_REF
    if (o.instalacao && o.ref) {
      const cleanUC = String(o.instalacao).replace(/[^a-zA-Z0-9]/g, '_');
      o.id = `${cleanUC}_${o.ref}`;
    }

    return castRow(o);
  }).filter(o => o.instalacao && (o.valorEmitido || o.valorPago || o.statusPgto));

  return json;
}