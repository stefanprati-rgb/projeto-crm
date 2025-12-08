import { cpf, cnpj } from 'cpf-cnpj-validator';

/**
 * Valida CPF ou CNPJ
 * @param {string} value - CPF ou CNPJ com ou sem formatação
 * @returns {true|string} - true se válido, mensagem de erro se inválido
 */
export const validateCpfCnpj = (value) => {
    if (!value) {
        return 'CPF/CNPJ é obrigatório';
    }

    // Remove formatação
    const cleaned = value.replace(/\D/g, '');

    // Verifica se tem tamanho válido
    if (cleaned.length !== 11 && cleaned.length !== 14) {
        return 'CPF deve ter 11 dígitos ou CNPJ deve ter 14 dígitos';
    }

    // Valida CPF (11 dígitos)
    if (cleaned.length === 11) {
        if (!cpf.isValid(cleaned)) {
            return 'CPF inválido';
        }
        return true;
    }

    // Valida CNPJ (14 dígitos)
    if (cleaned.length === 14) {
        if (!cnpj.isValid(cleaned)) {
            return 'CNPJ inválido';
        }
        return true;
    }

    return 'CPF/CNPJ inválido';
};

/**
 * Valida e-mail
 * @param {string} email - E-mail a ser validado
 * @returns {true|string} - true se válido, mensagem de erro se inválido
 */
export const validateEmail = (email) => {
    if (!email) {
        return true; // Email é opcional
    }

    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!regex.test(email)) {
        return 'E-mail inválido';
    }

    // Validações adicionais
    const [localPart, domain] = email.split('@');

    // Local part não pode começar ou terminar com ponto
    if (localPart.startsWith('.') || localPart.endsWith('.')) {
        return 'E-mail inválido';
    }

    // Não pode ter pontos consecutivos
    if (localPart.includes('..')) {
        return 'E-mail inválido';
    }

    // Domínio deve ter pelo menos um ponto
    if (!domain.includes('.')) {
        return 'E-mail inválido';
    }

    return true;
};

/**
 * Valida telefone brasileiro
 * @param {string} phone - Telefone a ser validado
 * @returns {true|string} - true se válido, mensagem de erro se inválido
 */
export const validatePhone = (phone) => {
    if (!phone) {
        return true; // Telefone é opcional
    }

    // Remove formatação
    const cleaned = phone.replace(/\D/g, '');

    // Telefone brasileiro: (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
    // 11 dígitos (celular) ou 10 dígitos (fixo)
    if (cleaned.length !== 10 && cleaned.length !== 11) {
        return 'Telefone deve ter 10 ou 11 dígitos';
    }

    // Verifica se o DDD é válido (11-99)
    const ddd = parseInt(cleaned.substring(0, 2));
    if (ddd < 11 || ddd > 99) {
        return 'DDD inválido';
    }

    // Se for celular (11 dígitos), o primeiro dígito após o DDD deve ser 9
    if (cleaned.length === 11 && cleaned[2] !== '9') {
        return 'Celular deve começar com 9 após o DDD';
    }

    // Verifica se não é um número com todos os dígitos iguais
    const allSame = cleaned.split('').every(digit => digit === cleaned[0]);
    if (allSame) {
        return 'Telefone inválido';
    }

    return true;
};

/**
 * Formata CPF
 * @param {string} value - CPF sem formatação
 * @returns {string} - CPF formatado (000.000.000-00)
 */
export const formatCpf = (value) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length !== 11) return value;
    return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
};

/**
 * Formata CNPJ
 * @param {string} value - CNPJ sem formatação
 * @returns {string} - CNPJ formatado (00.000.000/0000-00)
 */
export const formatCnpj = (value) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length !== 14) return value;
    return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
};

/**
 * Formata CPF ou CNPJ automaticamente
 * @param {string} value - CPF ou CNPJ sem formatação
 * @returns {string} - CPF ou CNPJ formatado
 */
export const formatCpfCnpj = (value) => {
    const cleaned = value.replace(/\D/g, '');

    if (cleaned.length <= 11) {
        return formatCpf(cleaned);
    }

    return formatCnpj(cleaned);
};

/**
 * Formata telefone brasileiro
 * @param {string} value - Telefone sem formatação
 * @returns {string} - Telefone formatado
 */
export const formatPhone = (value) => {
    const cleaned = value.replace(/\D/g, '');

    if (cleaned.length === 10) {
        // Fixo: (XX) XXXX-XXXX
        return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }

    if (cleaned.length === 11) {
        // Celular: (XX) XXXXX-XXXX
        return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }

    return value;
};

/**
 * Mascara CPF/CNPJ enquanto digita
 * @param {string} value - Valor atual do input
 * @returns {string} - Valor com máscara aplicada
 */
export const maskCpfCnpj = (value) => {
    const cleaned = value.replace(/\D/g, '');

    if (cleaned.length <= 11) {
        // Máscara CPF: 000.000.000-00
        return cleaned
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    }

    // Máscara CNPJ: 00.000.000/0000-00
    return cleaned
        .replace(/(\d{2})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1/$2')
        .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
};

/**
 * Mascara telefone enquanto digita
 * @param {string} value - Valor atual do input
 * @returns {string} - Valor com máscara aplicada
 */
export const maskPhone = (value) => {
    const cleaned = value.replace(/\D/g, '');

    if (cleaned.length <= 10) {
        // Fixo: (XX) XXXX-XXXX
        return cleaned
            .replace(/(\d{2})(\d)/, '($1) $2')
            .replace(/(\d{4})(\d{1,4})$/, '$1-$2');
    }

    // Celular: (XX) XXXXX-XXXX
    return cleaned
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{5})(\d{1,4})$/, '$1-$2');
};
