/**
 * Utilitários de Normalização de Dados para o CRM
 */

export const normalization = {
    /**
     * Normaliza a Unidade Consumidora (UC) para garantir match preciso
     * @param {string|number} uc 
     * @returns {string}
     */
    normalizeUC(uc) {
        if (!uc) return '';

        // Converte para string e remove espaços, barras, traços e pontos
        let clean = String(uc).replace(/[\s\/\.\-]/g, '');

        // Remove zeros à esquerda para padronização (opcional, conforme regra de negócio)
        clean = clean.replace(/^0+/, '');

        return clean;
    },

    /**
     * Padroniza formatos de data vindos de planilhas (Excel/CSV)
     * @param {any} date 
     * @returns {string|null} ISO8601
     */
    normalizeDate(date) {
        if (!date) return null;

        try {
            // Se for número (Excel Serial Date)
            if (typeof date === 'number' && date > 40000) {
                const excelEpoch = new Date(1899, 11, 30);
                const d = new Date(excelEpoch.getTime() + date * 86400000);
                return d.toISOString();
            }

            const d = new Date(date);
            if (isNaN(d.getTime())) return null;
            return d.toISOString();
        } catch (e) {
            return null;
        }
    },

    /**
     * Limpa strings para comparação e indexação
     */
    cleanString(str) {
        if (!str) return '';
        return str.trim().toLowerCase();
    }
};
