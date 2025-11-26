// Retorna o HTML de um Badge estilo "Apple/iOS" (Pílula Suave)
export function statusBadge(status) {
  if (!status) {
    return '<span class="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide bg-slate-100 text-slate-400">N/A</span>';
  }

  const s = status.toUpperCase();
  let classes = 'bg-slate-100 text-slate-500'; // Default (Cinza neutro)
  let icon = '';

  // Cores inspiradas no iOS System Colors (Pastel backgrounds + Dark text)
  if (s === 'ATIVO') {
    // Verde (Success)
    classes = 'bg-emerald-50 text-emerald-600 border border-emerald-100';
    icon = '<i class="fas fa-check-circle me-1.5 text-[10px]"></i>';
  }
  else if (s === 'INATIVO' || s === 'CANCELADO' || s === 'RESCINDIDO') {
    // Cinza (Inactive)
    classes = 'bg-slate-100 text-slate-500 border border-slate-200';
    icon = '<i class="fas fa-ban me-1.5 text-[10px]"></i>';
  }
  else if (s === 'PENDENTE' || s === 'EM_ANALISE' || s === 'ACOMPANHAR' || s.includes('CRÉDITO')) {
    // Laranja/Amarelo (Warning)
    classes = 'bg-orange-50 text-orange-600 border border-orange-100';
    icon = '<i class="fas fa-clock me-1.5 text-[10px]"></i>';
  }
  else if (s === 'EM_CANCELAMENTO' || s === 'INADIMPLENTE' || s.includes('RETIRAR')) {
    // Vermelho (Danger)
    classes = 'bg-red-50 text-red-600 border border-red-100';
    icon = '<i class="fas fa-exclamation-circle me-1.5 text-[10px]"></i>';
  }
  else if (s.includes('APTO') || s === 'NOVO') {
    // Azul (Info)
    classes = 'bg-blue-50 text-blue-600 border border-blue-100';
    icon = '<i class="fas fa-thumbs-up me-1.5 text-[10px]"></i>';
  }

  // Badge com design "Pill" (arredondado, fonte pequena e bold)
  return `<span class="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide shadow-sm ${classes}">${icon}${status}</span>`;
}

// Formata Moeda (BRL)
export function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

// Formata Documento (CPF/CNPJ) com máscara
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

// --- VALIDAÇÕES (Mantidas do passo anterior) ---

export function validateCPF(cpf) {
  cpf = cpf.replace(/[^\d]+/g, '');
  if (cpf == '') return false;
  if (cpf.length != 11 ||
    cpf == "00000000000" ||
    cpf == "11111111111" ||
    cpf == "22222222222" ||
    cpf == "33333333333" ||
    cpf == "44444444444" ||
    cpf == "55555555555" ||
    cpf == "66666666666" ||
    cpf == "77777777777" ||
    cpf == "88888888888" ||
    cpf == "99999999999")
    return false;
  let add = 0;
  for (let i = 0; i < 9; i++)
    add += parseInt(cpf.charAt(i)) * (10 - i);
  let rev = 11 - (add % 11);
  if (rev == 10 || rev == 11) rev = 0;
  if (rev != parseInt(cpf.charAt(9))) return false;
  add = 0;
  for (let i = 0; i < 10; i++)
    add += parseInt(cpf.charAt(i)) * (11 - i);
  rev = 11 - (add % 11);
  if (rev == 10 || rev == 11) rev = 0;
  if (rev != parseInt(cpf.charAt(10))) return false;
  return true;
}

export function validateCNPJ(cnpj) {
  cnpj = cnpj.replace(/[^\d]+/g, '');
  if (cnpj == '') return false;
  if (cnpj.length != 14) return false;
  if (cnpj == "00000000000000" ||
    cnpj == "11111111111111" ||
    cnpj == "22222222222222" ||
    cnpj == "33333333333333" ||
    cnpj == "44444444444444" ||
    cnpj == "55555555555555" ||
    cnpj == "66666666666666" ||
    cnpj == "77777777777777" ||
    cnpj == "88888888888888" ||
    cnpj == "99999999999999")
    return false;
  let tamanho = cnpj.length - 2
  let numeros = cnpj.substring(0, tamanho);
  let digitos = cnpj.substring(tamanho);
  let soma = 0;
  let pos = tamanho - 7;
  for (let i = tamanho; i >= 1; i--) {
    soma += numeros.charAt(tamanho - i) * pos--;
    if (pos < 2) pos = 9;
  }
  let resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
  if (resultado != digitos.charAt(0)) return false;
  tamanho = tamanho + 1;
  numeros = cnpj.substring(0, tamanho);
  soma = 0;
  pos = tamanho - 7;
  for (let i = tamanho; i >= 1; i--) {
    soma += numeros.charAt(tamanho - i) * pos--;
    if (pos < 2) pos = 9;
  }
  resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
  if (resultado != digitos.charAt(1)) return false;
  return true;
}