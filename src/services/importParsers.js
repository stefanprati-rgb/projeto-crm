/**
 * Mapeadores de Headers para Importação de Onboarding
 */

export const importParsers = {
    /**
     * Helper para garantir string e trim
     */
    _s(val) {
        if (val === null || val === undefined) return '';
        return String(val).trim();
    },

    /**
     * Mapeia headers da Base de Clientes (Cadastral)
     */
    parseClientBase(rawData) {
        return rawData.map(row => ({
            uc: this._s(row.UC || row.uc || row['Unidade Consumidora']),
            name: this._s(row.Cliente || row.cliente || row.Nome || row['Razão Social']),
            cpfCnpj: this._s(row['CNPJ/CPF'] || row.cnpj || row.cpf || row.documento),
            usina: this._s(row.Usina || row.usina_vinculada || row.Projeto),
            phone: this._s(row.Telefone || row.Celular),
            email: this._s(row.Email || row.email),
        })).filter(item => !!item.uc);
    },

    /**
     * Mapeia headers da Planilha de Rateio (Operacional)
     */
    parseApportionment(rawData) {
        return rawData.map(row => ({
            uc: this._s(row.UC || row.uc || row['Unidade Consumidora']),
            rateio: row['% rateio'] || row.Percentual || row.Rateio, // Mantém numérico se for %
            previsao: this._s(row['Mês referência'] || row['Previsão Compensação'] || row.Previsao),
            usina: this._s(row['Usina alocada'] || row.Usina)
        })).filter(item => !!item.uc);
    },

    /**
     * Mapeia headers da Planilha de Faturamento (Financeira)
     */
    parseInvoicing(rawData) {
        return rawData.map(row => ({
            uc: this._s(row.UC || row.uc || row['Unidade Consumidora']),
            data_emissao: this._s(row['Data emissão'] || row.Emissao || row.Data),
            valor: row['Valor faturado'] || row.Valor || row.Total, // Mantém numérico
            referencia: this._s(row['Mês referência'] || row.Referencia)
        })).filter(item => !!item.uc);
    }
};
