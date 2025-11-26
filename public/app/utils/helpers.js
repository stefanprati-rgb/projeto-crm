// Retorna o HTML de um Badge moderno com Tailwind CSS
export function statusBadge(status) {
  // Se não houver status, retorna N/A cinza
  if (!status) {
    return '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-500">N/A</span>';
  }

  const s = status.toUpperCase();
  let classes = 'bg-slate-100 text-slate-600 border border-slate-200'; // Default (Cinza)
  let icon = '';

  // Lógica de Cores e Ícones
  if (s === 'ATIVO') {
    // Verde Esmeralda (Sucesso)
    classes = 'bg-emerald-100 text-emerald-800 border border-emerald-200';
    icon = '<i class="fas fa-check-circle me-1.5 text-xs opacity-75"></i>';
  }
  else if (s === 'INATIVO' || s === 'CANCELADO' || s === 'RESCINDIDO') {
    // Cinza/Slate (Inativo)
    classes = 'bg-slate-100 text-slate-600 border border-slate-200';
    icon = '<i class="fas fa-ban me-1.5 text-xs opacity-75"></i>';
  }
  else if (s === 'PENDENTE' || s === 'EM_ANALISE' || s === 'ACOMPANHAR') {
    // Âmbar/Amarelo (Atenção)
    classes = 'bg-amber-50 text-amber-700 border border-amber-200';
    icon = '<i class="fas fa-clock me-1.5 text-xs opacity-75"></i>';
  }
  else if (s === 'EM_CANCELAMENTO' || s === 'INADIMPLENTE' || s.includes('RETIRAR')) {
    // Rosa/Vermelho (Perigo)
    classes = 'bg-rose-50 text-rose-700 border border-rose-200';
    icon = '<i class="fas fa-exclamation-circle me-1.5 text-xs opacity-75"></i>';
  }
  else if (s.includes('APTO') || s === 'NOVO') {
    // Azul (Info)
    classes = 'bg-blue-50 text-blue-700 border border-blue-200';
    icon = '<i class="fas fa-thumbs-up me-1.5 text-xs opacity-75"></i>';
  }

  return `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium shadow-sm ${classes}">${icon}${status}</span>`;
}

// Formata Moeda (BRL)
export function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

// Formata Documento (CPF/CNPJ)
export function formatDoc(doc) {
  if (!doc) return '';
  const clean = doc.toString().replace(/\D/g, '');
  if (clean.length === 11) { // CPF
    return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }
  if (clean.length === 14) { // CNPJ
    return clean.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }
  return doc; // Retorna original se não casar com padrões
}

export function normalizeString(str) {
  return str ? str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() : "";
}

export function cleanDoc(value) {
  if (!value) return '';
  return value.toString().replace(/[^0-9]/g, '');
}

export function normalizeStatus(val) {
  if (!val) return 'PENDENTE';
  const v = val.toUpperCase();
  if (v.includes('ATIV')) return 'ATIVO';
  if (v.includes('CANCEL')) return 'CANCELADO';
  return v;
}