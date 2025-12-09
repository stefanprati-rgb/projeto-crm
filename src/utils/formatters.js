/**
 * Utilitários de Formatação
 * Para uso em toda a aplicação
 */

/**
 * Formata valores monetários em BRL
 * @param {number|string} value - Valor a ser formatado
 * @returns {string} Valor formatado (Ex: R$ 1.234,56)
 */
export const formatCurrency = (value) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;

    if (isNaN(numValue)) {
        return 'R$ 0,00';
    }

    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(numValue);
};

/**
 * Formata CPF ou CNPJ
 * @param {string} document - CPF ou CNPJ sem formatação
 * @returns {string} Documento formatado
 */
export const formatDocument = (document) => {
    if (!document) return '';

    // Garante que document é string
    const docStr = String(document);
    // Remove tudo que não é número
    const cleaned = docStr.replace(/\D/g, '');

    // CPF: 000.000.000-00
    if (cleaned.length === 11) {
        return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }

    // CNPJ: 00.000.000/0000-00
    if (cleaned.length === 14) {
        return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }

    // Retorna original se não for CPF nem CNPJ
    return docStr;
};

/**
 * Remove formatação de documento (CPF/CNPJ)
 * @param {string} document - Documento formatado
 * @returns {string} Apenas números
 */
export const cleanDocument = (document) => {
    if (!document) return '';
    return document.replace(/\D/g, '');
};

/**
 * Formata telefone brasileiro
 * @param {string} phone - Telefone sem formatação
 * @returns {string} Telefone formatado
 */
export const formatPhone = (phone) => {
    if (!phone) return '';

    // Garante que phone é string
    const phoneStr = String(phone);
    const cleaned = phoneStr.replace(/\D/g, '');

    // Celular: (00) 00000-0000
    if (cleaned.length === 11) {
        return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }

    // Fixo: (00) 0000-0000
    if (cleaned.length === 10) {
        return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }

    return phoneStr;
};

/**
 * Formata CEP
 * @param {string} zipCode - CEP sem formatação
 * @returns {string} CEP formatado (00000-000)
 */
export const formatZipCode = (zipCode) => {
    if (!zipCode) return '';

    // Garante que zipCode é string
    const zipStr = String(zipCode);
    const cleaned = zipStr.replace(/\D/g, '');

    if (cleaned.length === 8) {
        return cleaned.replace(/(\d{5})(\d{3})/, '$1-$2');
    }

    return zipStr;
};

/**
 * Formata data para exibição
 * @param {Date|string} date - Data a ser formatada
 * @param {string} format - Formato desejado (default: dd/MM/yyyy)
 * @returns {string} Data formatada
 */
export const formatDate = (date, formatStr = 'dd/MM/yyyy') => {
    if (!date) return '';

    const dateObj = typeof date === 'string' ? new Date(date) : date;

    if (isNaN(dateObj.getTime())) {
        return '';
    }

    // Implementação simples sem date-fns para evitar dependência circular
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = dateObj.getFullYear();

    if (formatStr === 'dd/MM/yyyy') {
        return `${day}/${month}/${year}`;
    }

    if (formatStr === 'MM/yyyy') {
        return `${month}/${year}`;
    }

    return dateObj.toLocaleDateString('pt-BR');
};

/**
 * Formata número de instalação (UC)
 * @param {string|number} installationId - ID da instalação
 * @returns {string} ID formatado
 */
export const formatInstallationId = (installationId) => {
    if (!installationId) return '';
    return String(installationId).padStart(10, '0');
};

/**
 * Valida CPF
 * @param {string} cpf - CPF a ser validado
 * @returns {boolean} True se válido
 */
export const isValidCPF = (cpf) => {
    const cleaned = cleanDocument(cpf);

    if (cleaned.length !== 11) return false;
    if (/^(\d)\1+$/.test(cleaned)) return false; // Todos iguais

    let sum = 0;
    let remainder;

    for (let i = 1; i <= 9; i++) {
        sum += parseInt(cleaned.substring(i - 1, i)) * (11 - i);
    }

    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleaned.substring(9, 10))) return false;

    sum = 0;
    for (let i = 1; i <= 10; i++) {
        sum += parseInt(cleaned.substring(i - 1, i)) * (12 - i);
    }

    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleaned.substring(10, 11))) return false;

    return true;
};

/**
 * Valida CNPJ
 * @param {string} cnpj - CNPJ a ser validado
 * @returns {boolean} True se válido
 */
export const isValidCNPJ = (cnpj) => {
    const cleaned = cleanDocument(cnpj);

    if (cleaned.length !== 14) return false;
    if (/^(\d)\1+$/.test(cleaned)) return false;

    let length = cleaned.length - 2;
    let numbers = cleaned.substring(0, length);
    const digits = cleaned.substring(length);
    let sum = 0;
    let pos = length - 7;

    for (let i = length; i >= 1; i--) {
        sum += parseInt(numbers.charAt(length - i)) * pos--;
        if (pos < 2) pos = 9;
    }

    let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (result !== parseInt(digits.charAt(0))) return false;

    length = length + 1;
    numbers = cleaned.substring(0, length);
    sum = 0;
    pos = length - 7;

    for (let i = length; i >= 1; i--) {
        sum += parseInt(numbers.charAt(length - i)) * pos--;
        if (pos < 2) pos = 9;
    }

    result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (result !== parseInt(digits.charAt(1))) return false;

    return true;
};
