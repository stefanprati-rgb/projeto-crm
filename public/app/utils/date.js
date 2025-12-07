// Helpers de datas e referência (competência)

export const toDate = (v) => {
  if (!v) return null;
  if (v instanceof Date) return v;
  const t = typeof v === 'number' ? new Date(v) : new Date(String(v));
  return isNaN(t) ? null : t;
};

// Normaliza REF. Aceita "2025-08", "2025/08", "2025-08-01", "AGO/2025" (tentativa best-effort)
export const parseRef = (ref) => {
  if (!ref) return null;
  const s = String(ref).trim();
  // yyyy-mm ou yyyy/mm
  const m1 = s.match(/^(\d{4})[-\/](\d{1,2})/);
  if (m1) {
    const y = +m1[1], m = +m1[2];
    if (y > 1900 && m >= 1 && m <= 12) return `${y}-${String(m).padStart(2,'0')}`;
  }
  // dd/mm/yyyy → yyyy-mm
  const m2 = s.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})$/);
  if (m2) {
    const y = +m2[3], m = +m2[2];
    if (y > 1900 && m >= 1 && m <= 12) return `${y}-${String(m).padStart(2,'0')}`;
  }
  // Ex.: "AGO/2025" (PT-BR)
  const meses = { JAN:1, FEV:2, MAR:3, ABR:4, MAI:5, JUN:6, JUL:7, AGO:8, SET:9, OUT:10, NOV:11, DEZ:12 };
  const m3 = s.toUpperCase().match(/(JAN|FEV|MAR|ABR|MAI|JUN|JUL|AGO|SET|OUT|NOV|DEZ)[^\d]{0,3}(\d{4})/);
  if (m3) {
    const y = +m3[2], m = meses[m3[1]];
    return `${y}-${String(m).padStart(2,'0')}`;
  }
  return null;
};

export const daysBetween = (a, b) => {
  const d1 = toDate(a), d2 = toDate(b);
  if (!d1 || !d2) return null;
  return Math.round((d2 - d1) / 86400000);
};

export const todayISO = () => new Date().toISOString().slice(0,10);

export const getAgingBucket = (days) => {
  if (days === null || days === undefined) return 'Sem Data';
  if (days <= 0)  return 'Em Dia';
  if (days <= 15) return '1–15';
  if (days <= 30) return '16–30';
  if (days <= 60) return '31–60';
  if (days <= 90) return '61–90';
  return '>90';
};
