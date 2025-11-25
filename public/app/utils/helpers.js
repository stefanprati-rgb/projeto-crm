// Retorna o HTML de um Badge baseado no status (Design Soft UI)
export function statusBadge(status) {
  if (!status) return '<span class="badge bg-secondary opacity-50">N/A</span>';

  const s = status.toUpperCase();
  let badgeClass = 'bg-secondary';
  let icon = '';

  if (s === 'ATIVO') {
    badgeClass = 'bg-success-soft'; // Verde suave
    icon = '<i class="fas fa-check-circle me-1"></i>';
  }
  else if (s === 'INATIVO' || s === 'CANCELADO') {
    badgeClass = 'bg-secondary bg-opacity-25 text-dark'; // Cinza claro
    icon = '<i class="fas fa-ban me-1"></i>';
  }
  else if (s === 'PENDENTE' || s === 'EM_ANALISE') {
    badgeClass = 'bg-warning-soft'; // Amarelo suave
    icon = '<i class="fas fa-clock me-1"></i>';
  }
  else if (s === 'EM_CANCELAMENTO' || s === 'INADIMPLENTE') {
    badgeClass = 'bg-danger-soft'; // Vermelho suave
    icon = '<i class="fas fa-exclamation-circle me-1"></i>';
  }
  else if (s.includes('APTO')) {
    badgeClass = 'bg-info-soft'; // Azul suave
    icon = '<i class="fas fa-thumbs-up me-1"></i>';
  }

  return `<span class="badge ${badgeClass}">${icon}${status}</span>`;
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
  return doc;
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