/**
 * Utilitários para mascaramento de dados sensíveis (PII)
 */

/**
 * Mascara CPF: 123.456.789-00 -> ***.456.***-00
 */
export const maskCPF = (cpf) => {
    if (!cpf) return '';
    const clean = cpf.replace(/\D/g, '');
    if (clean.length !== 11) return cpf; // Retorna original se formato inválido
    return `***.${clean.substr(3, 3)}.${clean.substr(6, 3)}-**`;
    // Ou formato mais estrito: ***.456.***-00
};

/**
 * Mascara CNPJ: 12.345.678/0001-90 -> 12.***.***/0001 -**
 */
export const maskCNPJ = (cnpj) => {
    if (!cnpj) return '';
    const clean = cnpj.replace(/\D/g, '');
    if (clean.length !== 14) return cnpj;
    return `${clean.substr(0, 2)}.${clean.substr(2, 3)}.***/${clean.substr(8, 4)}-**`;
};

/**
 * Mascara Email: usuario@exemplo.com -> u***@exemplo.com
 */
export const maskEmail = (email) => {
    if (!email) return '';
    const parts = email.split('@');
    if (parts.length !== 2) return email;

    const [user, domain] = parts;
    const maskedUser = user.length > 3
        ? `${user.substr(0, 1)}***${user.substr(-1)}`
        : `${user.substr(0, 1)}***`;

    return `${maskedUser}@${domain}`;
};

/**
 * Mascara Telefone: (11) 98765-4321 -> (11) 9****-4321
 */
export const maskPhone = (phone) => {
    if (!phone) return '';
    // Assume formato formatado (XX) XXXXX-XXXX
    if (phone.includes('-')) {
        const parts = phone.split('-');
        if (parts.length === 2) {
            // (11) 98765 => (11) 9****
            const prefix = parts[0];
            const suffix = parts[1];
            // Mantém os 2 últimos dígitos do sufixo
            const maskedPrefix = prefix.replace(/\d(?=\d{2})/g, '*'); // Substitui digitos exceto os 2 ultimos? Não.
            // Simples: (11) 9****-4321
            return `${prefix.substr(0, prefix.length - 4)}****-${suffix}`;
        }
    }
    return phone.replace(/(\d{4,5})-(\d{4})/, '****-$2');
};

/**
 * Mascara Nome (apenas iniciais do sobrenome): João da Silva -> João d. S.
 */
export const maskName = (name) => {
    if (!name) return '';
    const parts = name.split(' ');
    if (parts.length <= 1) return name;

    return parts.map((part, index) => {
        if (index === 0) return part; // Primeiro nome visível
        if (part.length <= 2) return part; // de, da, do
        return `${part[0]}.`;
    }).join(' ');
};

export const maskValue = (value, type) => {
    switch (type) {
        case 'cpf': return maskCPF(value);
        case 'cnpj': return maskCNPJ(value);
        case 'email': return maskEmail(value);
        case 'phone': return maskPhone(value);
        case 'name': return maskName(value);
        default: return value;
    }
};
