/**
 * Utilitários de Máscara para Inputs
 * Formata valores enquanto o usuário digita
 */

/**
 * Máscara de CPF/CNPJ para input
 * CPF: 000.000.000-00
 * CNPJ: 00.000.000/0000-00
 */
export const maskCpfCnpjInput = (value) => {
    if (!value) return '';

    const numbers = value.replace(/\D/g, '');

    if (numbers.length <= 11) {
        // CPF: 000.000.000-00
        return numbers
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    } else {
        // CNPJ: 00.000.000/0000-00
        return numbers
            .replace(/(\d{2})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1/$2')
            .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
    }
};

/**
 * Máscara de Telefone para input
 * (00) 00000-0000 ou (00) 0000-0000
 */
export const maskPhoneInput = (value) => {
    if (!value) return '';

    const numbers = value.replace(/\D/g, '');

    if (numbers.length <= 10) {
        // Telefone fixo: (00) 0000-0000
        return numbers
            .replace(/(\d{2})(\d)/, '($1) $2')
            .replace(/(\d{4})(\d{1,4})$/, '$1-$2');
    } else {
        // Celular: (00) 00000-0000
        return numbers
            .replace(/(\d{2})(\d)/, '($1) $2')
            .replace(/(\d{5})(\d{1,4})$/, '$1-$2');
    }
};

/**
 * Máscara de CEP para input
 * 00000-000
 */
export const maskCepInput = (value) => {
    if (!value) return '';

    const numbers = value.replace(/\D/g, '');

    return numbers.replace(/(\d{5})(\d{1,3})$/, '$1-$2');
};

/**
 * Remove máscara (retorna apenas números)
 */
export const unmask = (value) => {
    if (!value) return '';
    return value.replace(/\D/g, '');
};
