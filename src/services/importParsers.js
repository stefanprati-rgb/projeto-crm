/**
 * Mapeadores de Headers para Importação de Onboarding
 */

export const importParsers = {
    /**
     * Mapeia headers da Base de Clientes (Cadastral)
     */
    parseClientBase(rawData) {
        return rawData.map(row => ({
            uc: row.UC || row.uc || row['Unidade Consumidora'],
            name: row.Cliente || row.cliente || row.Nome || row['Razão Social'],
            cpfCnpj: row['CNPJ/CPF'] || row.cnpj || row.cpf || row.documento,
            usina: row.Usina || row.usina_vinculada || row.Projeto,
            phone: row.Telefone || row.Celular,
            email: row.Email || row.email,
        })).filter(item => !!item.uc);
    },

    /**
     * Mapeia headers da Planilha de Rateio (Operacional)
     */
    parseApportionment(rawData) {
        return rawData.map(row => ({
            uc: row.UC || row.uc || row['Unidade Consumidora'],
            rateio: row['% rateio'] || row.Percentual || row.Rateio,
            previsao: row['Mês referência'] || row['Previsão Compensação'] || row.Previsao,
            usina: row['Usina alocada'] || row.Usina
        })).filter(item => !!item.uc);
    },

    /**
     * Mapeia headers da Planilha de Faturamento (Financeira)
     */
    parseInvoicing(rawData) {
        return rawData.map(row => ({
            uc: row.UC || row.uc || row['Unidade Consumidora'],
            data_emissao: row['Data emissão'] || row.Emissao || row.Data,
            valor: row['Valor faturado'] || row.Valor || row.Total,
            referencia: row['Mês referência'] || row.Referencia
        })).filter(item => !!item.uc);
    }
};
