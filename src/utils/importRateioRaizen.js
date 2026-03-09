import * as XLSX from 'xlsx';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../services/firebase';

/**
 * processRateioImport (Backend)
 */
const backendRateioImport = httpsCallable(functions, 'processRateioImport');

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
                            // Conversão defensiva para string e trim para evitar erros de tipagem em campos como UC/Instalação vindos como Number do Excel
                            let val = row[colIndex];
                            if (val !== null && val !== undefined) {
                                val = String(val).trim();
                            }
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
 * Processa a atualização do Rateio via Cloud Function (Backend).
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

    const CHUNK_SIZE = 100;
    const chunks = [];
    for (let i = 0; i < records.length; i += CHUNK_SIZE) {
        chunks.push(records.slice(i, i + CHUNK_SIZE));
    }

    for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        try {
            const response = await backendRateioImport({ records: chunk });
            const { data } = response;

            results.success += data.success;
            results.updatedCount += data.updated;
            results.notFoundCount += data.notFound;

            if (data.errors && data.errors.length > 0) {
                results.errors.push(...data.errors);
            }

            // Callback de progresso
            if (onProgress) {
                const totalProcessed = Math.min((i + 1) * CHUNK_SIZE, records.length);
                onProgress({
                    current: totalProcessed,
                    total: records.length,
                    percent: Math.round((totalProcessed / records.length) * 100),
                });
            }
        } catch (error) {
            console.error(`❌ Erro no processamento de rateio do lote ${i}:`, error);
            results.errors.push({ error: error.message });
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
