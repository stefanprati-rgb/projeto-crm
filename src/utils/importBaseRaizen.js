import { httpsCallable } from 'firebase/functions';
import { functions } from '../services/firebase';
import { cleanDocument } from './formatters';

/**
 * processRaizenImport (Backend)
 */
const backendImport = httpsCallable(functions, 'processRaizenImport');

/**
 * Mapeamento das colunas da planilha Raízen
 */
const RAIZEN_COLUMN_MAP = {
    // Identificação
    idContaAcc: ['id_conta__acc', 'ID Conta', 'ID_CONTA__ACC', 'ID_Conta__acc'],
    idUcNegociada: ['id_uc_negociada', 'ID UC Negociada'],
    nome: ['RAZÃO SOCIAL FATURAMENTO', 'RAZÃO SOCIAL CONTRATO', 'RAZAO SOCIAL', 'NOME', 'Razão Social', 'Nome', 'Nome/Razão Social'],
    cpfCnpj: ['CNPJ FATURAMENTO', 'CNPJ CONTRATO', 'CNPJ PAGADOR', 'CNPJ', 'CPF', 'CPF/CNPJ', 'Documento'],
    numeroCliente: ['NUMERO CLIENTE', 'NUM IBM', 'Num Cliente', 'NUM_CLIENTE'],

    // Comercial / Contrato
    consorcio: ['CONSORCIO', 'Consórcio', 'Consorcio'],
    tipoCliente: ['Tipo cliente', 'TIPO CLIENTE', 'Tipo Cliente'],
    distribuidora: ['DISTRIBUIDORA', 'Distribuidora'],
    grupoContas: ['GRUPO CONTAS', 'Grupo Contas', 'Grupo de Contas'],
    canalEntrada: ['CANAL DE ENTRADA', 'Canal', 'Canal de Entrada'],

    // Contato / Endereço
    telefone: ['TELEFONE FATURAMENTO', 'TELEFONE CONTRATO', 'telefone', 'Telefone', 'CELULAR', 'Celular'],
    email: ['E-MAIL FATURAMENTO', 'E-MAIL CONTRATO', 'email', 'E-mail', 'Email'],
    endereco: ['ENDEREÇO COMPLETO', 'Endereço', 'ENDERECO', 'ENDEREÇO'],
    bairro: ['Bairro', 'BAIRRO'],
    cidade: ['Cidade', 'CIDADE'],
    estado: ['UF', 'Estado', 'ESTADO'],
    cep: ['CEP', 'Cep'],

    // Instalação
    uc: ['NOVA UC', 'UC', 'INSTALACAO', 'Instalação'],

    // Portal e Segurança
    portalLogin: ['login', 'Login', 'LOGIN'],
    portalSenha: ['senha', 'Senha', 'SENHA']
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
 * Lê o arquivo Excel/CSV e retorna o array de objetos mapeado
 */
export const readRaizenFile = async (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });

                // Pega a planilha 'base_clientes' ou a primeira se não existir
                const targetSheetName = workbook.SheetNames.includes('base_clientes') ? 'base_clientes' : workbook.SheetNames[0];
                const targetSheet = workbook.Sheets[targetSheetName];
                const jsonData = XLSX.utils.sheet_to_json(targetSheet, { header: 1 });

                // Header está na linha 3 (índice 2) para a aba base_clientes
                const headerRowIndex = targetSheetName === 'base_clientes' ? 2 : 0;
                const headers = jsonData[headerRowIndex];
                const rows = jsonData.slice(headerRowIndex + 1);

                // Mapeia colunas
                const columnMapping = {};
                Object.keys(RAIZEN_COLUMN_MAP).forEach((key) => {
                    const colIndex = findColumn(headers, RAIZEN_COLUMN_MAP[key]);
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
                            // Conversão defensiva para string e trim para evitar erros de tipagem em campos como telefone/documento vindos como Number do Excel
                            let val = row[colIndex];
                            if (val !== null && val !== undefined) {
                                val = String(val).trim();
                            }
                            record[key] = val;
                        });
                        return record;
                    })
                    // Só importa se tiver nome ou idContaAcc
                    .filter((r) => r.nome || r.idContaAcc);

                resolve({ records, columnMapping });
            } catch (error) {
                reject(error);
            }
        };

        reader.onerror = (error) => reject(error);
        reader.readAsArrayBuffer(file);
    });
};

/**
 * Processa os dados mapeados enviando para a Cloud Function (Backend).
 */
export const importBaseRaizen = async (records, options = {}) => {
    const { onProgress } = options;

    const results = {
        total: records.length,
        success: 0,
        errors: [],
        createdCount: 0,
        updatedCount: 0
    };

    // Dividimos em pedaços de 100 para o backend não dar timeout e podermos mostrar progresso
    const CHUNK_SIZE = 100;
    const chunks = [];
    for (let i = 0; i < records.length; i += CHUNK_SIZE) {
        chunks.push(records.slice(i, i + CHUNK_SIZE));
    }

    for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        try {
            // Chama a Cloud Function
            const response = await backendImport({
                records: chunk,
                baseName: "Raízen"
            });

            const { data } = response;

            results.success += data.success;
            results.createdCount += data.created;
            results.updatedCount += data.updated;
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
            console.error(`❌ Erro crítico no lote ${i}:`, error);
            results.errors.push({
                error: `Falha no lote ${i}: ${error.message}`
            });
        }
    }

    return results;
};

/**
 * Validar arquivo antes da importação final
 */
export const validateRaizenFile = (records) => {
    const errors = [];
    const warnings = [];

    if (!records || records.length === 0) {
        errors.push('Arquivo vazio ou sem registros válidos mapeados');
        return { valid: false, errors, warnings };
    }

    // Verifica campos críticos
    const semNomeEConta = records.filter((r) => !r.nome && !r.idContaAcc);
    if (semNomeEConta.length > 0) {
        warnings.push(`${semNomeEConta.length} registros sem 'RAZAO SOCIAL' e 'ID Conta' (possivelmente ignorados na listagem final)`);
    }

    const semUc = records.filter(r => !r.uc);
    if (semUc.length > 0) {
        warnings.push(`${semUc.length} registros sem 'NOVA UC'.`);
    }

    return {
        valid: errors.length === 0,
        errors,
        warnings,
    };
};
