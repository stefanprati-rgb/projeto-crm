import * as XLSX from 'xlsx';
import { clientService } from '../services/clientService';
import { plantService } from '../services/plantService';
import { cleanDocument } from './formatters';

/**
 * Importador de Base EGS
 * Lê arquivo "Infos Clientes.csv" e popula clients e plants
 */

/**
 * Mapeamento de colunas do CSV/Excel
 */
const COLUMN_MAP = {
    name: ['Nome/Razão Social', 'NOME', 'RAZAO SOCIAL', 'Nome'],
    document: ['CPF/CNPJ', 'CNPJ', 'CPF', 'Documento'],
    email: ['E-mail', 'EMAIL', 'Email'],
    phone: ['Telefone', 'TELEFONE', 'Fone', 'FONE'],
    installationId: ['INSTALACAO', 'INSTALAÇÃO', 'UC', 'Instalação'],
    plantName: ['USINA', 'Usina', 'PLANTA'],
    voltage: ['TENSAO', 'TENSÃO', 'Tensão'],
    meter: ['MEDIDOR', 'Medidor'],
    address: ['Endereço', 'ENDERECO', 'ENDEREÇO'],
    city: ['Cidade', 'CIDADE'],
    state: ['Estado', 'ESTADO', 'UF'],
    zipCode: ['CEP', 'Cep'],
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
 * Lê arquivo Excel/CSV e retorna array de objetos
 */
export const readFile = async (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });

                // Pega a primeira planilha
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

                // Primeira linha são os headers
                const headers = jsonData[0];
                const rows = jsonData.slice(1);

                // Mapeia colunas
                const columnMapping = {};
                Object.keys(COLUMN_MAP).forEach((key) => {
                    const colName = findColumn(headers, COLUMN_MAP[key]);
                    if (colName) {
                        columnMapping[key] = headers.indexOf(colName);
                    }
                });

                // Converte linhas em objetos
                const records = rows
                    .map((row) => {
                        const record = {};
                        Object.keys(columnMapping).forEach((key) => {
                            const colIndex = columnMapping[key];
                            record[key] = row[colIndex];
                        });
                        return record;
                    })
                    .filter((r) => r.installationId); // Só registros com instalação

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
 * Processa e importa os dados para o Firestore
 */
export const importBaseEGS = async (records, options = {}) => {
    const { database = 'EGS', onProgress } = options;

    const results = {
        total: records.length,
        success: 0,
        errors: [],
        plantsCreated: new Set(),
    };

    for (let i = 0; i < records.length; i++) {
        const record = records[i];

        try {
            // 1. Garante que a usina existe
            let plantId = null;
            if (record.plantName) {
                const plant = await plantService.findOrCreate(record.plantName, 'EGS');
                plantId = plant.id;
                results.plantsCreated.add(record.plantName);
            }

            // 2. Prepara dados do cliente
            const clientData = {
                name: record.name || 'Sem Nome',
                document: record.document ? cleanDocument(record.document) : null,
                email: record.email || null,
                phone: record.phone || null,
                installationId: String(record.installationId).trim(),
                plantName: record.plantName || null,
                plantId: plantId,
                voltage: record.voltage || null,
                meter: record.meter || null,
                address: record.address || null,
                city: record.city || null,
                state: record.state || null,
                zipCode: record.zipCode || null,
                database: database,
                status: 'active',
                installations: [String(record.installationId).trim()], // Array para múltiplas instalações
            };

            // 3. Verifica se já existe (por installationId)
            const existing = await clientService.search(clientData.installationId, database);

            if (existing && existing.length > 0) {
                // Atualiza
                await clientService.update(existing[0].id, clientData);
                console.log(`✏️ Cliente atualizado: ${clientData.name} (${clientData.installationId})`);
            } else {
                // Cria novo
                await clientService.create(clientData);
                console.log(`✅ Cliente criado: ${clientData.name} (${clientData.installationId})`);
            }

            results.success++;

            // Callback de progresso
            if (onProgress) {
                onProgress({
                    current: i + 1,
                    total: records.length,
                    percent: Math.round(((i + 1) / records.length) * 100),
                });
            }
        } catch (error) {
            console.error(`❌ Erro ao importar ${record.installationId}:`, error);
            results.errors.push({
                record,
                error: error.message,
            });
        }
    }

    return results;
};

/**
 * Valida arquivo antes de importar
 */
export const validateFile = (records) => {
    const errors = [];
    const warnings = [];

    if (!records || records.length === 0) {
        errors.push('Arquivo vazio ou sem dados válidos');
        return { valid: false, errors, warnings };
    }

    // Verifica se tem installationId
    const withoutInstallation = records.filter((r) => !r.installationId);
    if (withoutInstallation.length > 0) {
        warnings.push(`${withoutInstallation.length} registros sem INSTALACAO serão ignorados`);
    }

    // Verifica duplicatas
    const installations = records.map((r) => r.installationId).filter(Boolean);
    const duplicates = installations.filter((item, index) => installations.indexOf(item) !== index);
    if (duplicates.length > 0) {
        warnings.push(`${duplicates.length} instalações duplicadas encontradas`);
    }

    return {
        valid: errors.length === 0,
        errors,
        warnings,
    };
};
