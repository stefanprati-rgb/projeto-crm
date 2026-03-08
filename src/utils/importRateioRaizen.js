import * as XLSX from 'xlsx';
import { clientService } from '../services/clientService';

/**
 * Mapeamento das colunas da planilha de Rateio Raízen
 */
const RATEIO_COLUMN_MAP = {
    // Identificação da Usina
    instalacaoUsina: ['Instalação Usina'],
    nomeUsina: ['Nome Usina'],
    distribuidora: ['Distribuidora'],

    // Identificação do Beneficiário
    uc: ['No. Instalação antiga'],
    instalacaoPadraoAneel: ['Instalação Padrão ANEEL'],

    // Dados do Rateio
    percentualRateio: ['Percentual Rateio'],
    dataEnvio: ['Data de envio'],
    status: ['Status'],
    motivoRecusa: ['Motivo de recusa no rateio'],
    estimativaCompensacao: ['estimativa de compensação']
};

/**
 * Encontra o nome real da coluna no arquivo
 */
const findColumn = (headers, possibleNames) => {
    for (const name of possibleNames) {
        const found = headers.find(
            (h) => h && h.toString().trim().toUpperCase() === name.toUpperCase()
        );
        if (found) return found;
    }
    return null;
};

/**
 * Lê o arquivo Excel e retorna os registros de Rateio estruturados
 */
export const readRateioFile = async (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });

                // Pega a planilha 'Main' (ou a primeira se 'Main' não existir)
                const sheetName = workbook.SheetNames.includes('Main') ? 'Main' : workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

                // Acha a linha de cabeçalho real (como pode ter colunas vazias, garantimos ler a partir de "No. Instalação antiga" ou "Status")
                let headerRowIndex = 0;
                for (let i = 0; i < Math.min(jsonData.length, 10); i++) { // Busca nas 10 primeiras linhas
                    const rowText = jsonData[i].join(' ').toLowerCase();
                    if (rowText.includes('status') && rowText.includes('rateio')) {
                        headerRowIndex = i;
                        break;
                    }
                }

                const headers = jsonData[headerRowIndex];
                const rows = jsonData.slice(headerRowIndex + 1);

                // Mapeia colunas
                const columnMapping = {};
                Object.keys(RATEIO_COLUMN_MAP).forEach((key) => {
                    const colIndex = findColumn(headers, RATEIO_COLUMN_MAP[key]);
                    if (colIndex) {
                        columnMapping[key] = headers.indexOf(colIndex);
                    }
                });

                // Converte linhas em objetos
                const records = rows
                    .map((row) => {
                        const record = {};
                        Object.keys(columnMapping).forEach((key) => {
                            const colIndex = columnMapping[key];
                            let val = row[colIndex];
                            if (typeof val === 'string') val = val.trim();
                            record[key] = val;
                        });

                        // Converte a data do Excel (número serial) para Date do JS caso seja numérico,
                        // ou faz parser básico caso venha em outro formato serial/string.
                        if (record.dataEnvio && typeof record.dataEnvio === 'number') {
                            // Data no Excel começa em 1900. O JS usa Epoch. O offset é 25569 dias.
                            const dateValue = new Date((record.dataEnvio - 25569) * 86400 * 1000);
                            // Ajusta o timezone (simplificado)
                            record.dataEnvio = new Date(dateValue.getTime() + (dateValue.getTimezoneOffset() * 60000));
                        }

                        return record;
                    })
                    // Filtra apenas registros que contenham Status e UC (No. Instalação Antiga ou ANEEL)
                    .filter((r) => r.status && (r.uc || r.instalacaoPadraoAneel));

                resolve({ records, columnMapping, rawDataLength: rows.length });
            } catch (error) {
                reject(error);
            }
        };

        reader.onerror = (error) => reject(error);
        reader.readAsArrayBuffer(file);
    });
};

/**
 * Processa a atualização do Rateio no Cadastro de Clientes
 */
export const updateRateioBase = async (records, options = {}) => {
    const { onProgress } = options;

    const results = {
        total: records.length,
        success: 0,
        errors: [],
        updatedCount: 0,
        notFoundCount: 0
    };

    for (let i = 0; i < records.length; i++) {
        const record = records[i];

        try {
            // Unifica o número da UC para busca string (pode vir como número do Excel)
            const numUc = record.uc ? String(record.uc).trim() : (record.instalacaoPadraoAneel ? String(record.instalacaoPadraoAneel).trim() : null);

            if (!numUc) {
                throw new Error("Registro sem UC de identificação.");
            }

            // 1. Procurar cliente na base (na função original, procura pelo 'installations' ou 'instalacoes.uc')
            // Vamos testar usando o search original.
            let existingClient = null;
            const searchByUc = await clientService.search(numUc, 'Raízen'); // Ou tira o 'Raízen' se o banco tiver clientes mistos. Supondo raizen:

            if (searchByUc && searchByUc.length > 0) {
                existingClient = searchByUc[0];
            } else {
                // Fallback: Busca genérica no banco pela array 'installations'
                const genericSearchByUc = await clientService.query({ filters: [{ field: 'installations', operator: 'array-contains', value: numUc }] });
                if (genericSearchByUc.data && genericSearchByUc.data.length > 0) {
                    existingClient = genericSearchByUc.data[0];
                }
            }

            if (!existingClient) {
                results.notFoundCount++;
                results.errors.push({
                    record,
                    error: `Pendente de cruzamento: Cliente com UC ${numUc} não foi encontrado na base local.`,
                    row: i + 2
                });
            } else {
                // Prepara os dados do Rateio
                const updateData = {
                    rateio: {
                        statusBase: record.status || null,
                        percentualAtual: record.percentualRateio || 0,
                        nomeUsinaAssociada: record.nomeUsina || null,
                        motivoRecusa: record.motivoRecusa || null,
                        dataUltimoEnvioBase: record.dataEnvio || null,
                        estimativaCompensacao: record.estimativaCompensacao || null,
                        ultimaAtualizacaoRateio: new Date().toISOString()
                    }
                };

                // Atualizar o cliente no firebase
                await clientService.update(existingClient.id, updateData);
                results.updatedCount++;
                results.success++;
                console.log(`✏️ Rateio de ${existingClient.nome} atualizado! Status: ${record.status}`);
            }

            // Callback de progresso
            if (onProgress) {
                onProgress({
                    current: i + 1,
                    total: records.length,
                    percent: Math.round(((i + 1) / records.length) * 100),
                });
            }
        } catch (error) {
            console.error(`❌ Erro ao atualizar rateio do registro linha ${i + 2}:`, error);
            results.errors.push({
                record,
                error: error.message || 'Erro desconhecido',
                row: i + 2
            });
        }
    }

    return results;
};

/**
 * Validar arquivo de Rateio antes da atualização final
 */
export const validateRateioFile = (records) => {
    const errors = [];
    const warnings = [];

    if (!records || records.length === 0) {
        errors.push('Arquivo vazio ou sem registros válidos detectados. Certifique-se de que a aba tem a coluna "Status" e "No. Instalação antiga".');
        return { valid: false, errors, warnings };
    }

    const recsWithoutStatus = records.filter((r) => !r.status);
    if (recsWithoutStatus.length > 0) {
        warnings.push(`${recsWithoutStatus.length} registros sem 'Status'.`);
    }

    return {
        valid: errors.length === 0,
        errors,
        warnings,
    };
};
