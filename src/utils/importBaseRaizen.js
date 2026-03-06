import * as XLSX from 'xlsx';
import { clientService } from '../services/clientService';
import { plantService } from '../services/plantService';
import { cleanDocument } from './formatters';
import CryptoJS from 'crypto-js';

// Chave secreta mockada (em um ambiente real, deve vir das variáveis de ambiente)
// process.env.VITE_ENCRYPTION_KEY || ...
const SECRET_KEY = import.meta.env?.VITE_ENCRYPTION_KEY || 'chave_secreta_padrao_gd_crm';

/**
 * Função para ofuscar (criptografar) a senha
 */
const encryptPassword = (password) => {
    if (!password) return null;
    return CryptoJS.AES.encrypt(String(password), SECRET_KEY).toString();
};

/**
 * Mapeamento das colunas da planilha Raízen
 */
const RAIZEN_COLUMN_MAP = {
    // Identificação
    idContaAcc: ['id_conta__acc', 'ID Conta', 'ID_CONTA__ACC', 'ID_Conta__acc'],
    idUcNegociada: ['id_uc_negociada', 'ID UC Negociada'],
    nome: ['RAZAO SOCIAL', 'NOME', 'Razão Social', 'Nome', 'Nome/Razão Social'],
    cpfCnpj: ['CNPJ PAGADOR', 'CNPJ', 'CPF', 'CPF/CNPJ', 'Documento'],
    numeroCliente: ['NUMERO CLIENTE', 'NUM IBM', 'Num Cliente', 'NUM_CLIENTE'],

    // Comercial / Contrato
    consorcio: ['CONSORCIO', 'Consórcio', 'Consorcio'],
    tipoCliente: ['Tipo cliente', 'TIPO CLIENTE', 'Tipo Cliente'],
    distribuidora: ['DISTRIBUIDORA', 'Distribuidora'],
    grupoContas: ['GRUPO CONTAS', 'Grupo Contas', 'Grupo de Contas'],
    canalEntrada: ['CANAL DE ENTRADA', 'Canal', 'Canal de Entrada'],

    // Contato / Endereço
    telefone: ['telefone', 'Telefone', 'CELULAR', 'Celular'],
    email: ['email', 'E-mail', 'Email'],
    endereco: ['Endereço', 'ENDERECO', 'ENDEREÇO'],
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

                // Pega a primeira planilha
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

                // Primeira linha: Headers
                const headers = jsonData[0];
                const rows = jsonData.slice(1);

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
                            // Mantém o valor original, se for string aplica trim
                            let val = row[colIndex];
                            if (typeof val === 'string') val = val.trim();
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
 * Processa os dados mapeados e insere/atualiza no Firestore.
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

    for (let i = 0; i < records.length; i++) {
        const record = records[i];

        try {
            // Limpa Documento
            const cleanCpfCnpj = record.cpfCnpj ? cleanDocument(record.cpfCnpj) : null;

            // Tratamento do Portal
            const portalStatus = (record.portalLogin || record.portalSenha) ? 'CADASTRADO' : 'PENDENTE';
            const senhaOfuscada = record.portalSenha ? encryptPassword(record.portalSenha) : null;

            // Tratamento da UC (Garantir string)
            const numUc = record.uc ? String(record.uc).trim() : null;

            // Define o Objeto Cliente usando o design pattern do Schema (Parcial, para o Merge da Update ou completude pro Create)
            const clientData = {
                idContaAcc: record.idContaAcc || null,
                idUcNegociada: record.idUcNegociada || null,
                nome: record.nome || 'Sem Razão Social',
                cpfCnpj: cleanCpfCnpj,

                // Comercial
                consorcio: record.consorcio || null,
                canalEntrada: record.canalEntrada || null,
                grupoContas: record.grupoContas || null,

                // Contatos e Enderecos
                email: record.email || null,
                phone: record.telefone || null,
                address: record.endereco || null,
                city: record.cidade || null,
                state: record.estado || null,
                zipCode: record.cep || null,

                database: 'Raízen', // Marcador fixo desta base
                status: 'active',

                // Portal (Mesclar com existente se UPDATE, novo objeto se CREATE)
                portal: {
                    status: portalStatus,
                    login: record.portalLogin || null,
                    senhaOfuscada: senhaOfuscada,
                    fraudeMapeada: false,
                    pendenciaCadastral: false,
                    onboarding: null
                }
            };

            // Prepara Instalação se houver UC
            if (numUc) {
                clientData.instalacoes = [{
                    uc: numUc,
                    distribuidoraEnum: record.distribuidora || null,
                    statusRateio: 'PENDING_PORTAL'
                }];
                // Backward compatibility
                clientData.installations = [numUc];
                clientData.installationId = numUc;
            }

            // 1. Verificar se cliente já existe
            // Ordem de busca: idContaAcc -> cpfCnpj -> uc
            let existingClient = null;

            if (record.idContaAcc) {
                const searchByAcc = await clientService.query({ filters: [{ field: 'idContaAcc', operator: '==', value: record.idContaAcc }] });
                if (searchByAcc.data && searchByAcc.data.length > 0) existingClient = searchByAcc.data[0];
            }

            if (!existingClient && cleanCpfCnpj) {
                // Fallback para CPF/CNPJ
                const searchByDoc = await clientService.query({ filters: [{ field: 'cpfCnpj', operator: '==', value: cleanCpfCnpj }] });
                if (searchByDoc.data && searchByDoc.data.length > 0) existingClient = searchByDoc.data[0];
            }

            if (!existingClient && numUc) {
                // Fallback para UC usando busca customizada
                const searchByUc = await clientService.search(numUc, 'Raízen');
                if (searchByUc && searchByUc.length > 0) existingClient = searchByUc[0];
            }

            if (existingClient) {
                // Atualizar
                // Previne de sobrescrever senhas existentes caso não venha na planilha
                if (existingClient.portal && !record.portalSenha) {
                    clientData.portal.senhaOfuscada = existingClient.portal.senhaOfuscada;
                    clientData.portal.status = existingClient.portal.status;
                }

                await clientService.update(existingClient.id, clientData);
                results.updatedCount++;
                console.log(`✏️ Cliente Raízen atualizado: ${clientData.nome} (${existingClient.id})`);
            } else {
                // Criar
                await clientService.create(clientData);
                results.createdCount++;
                console.log(`✅ Cliente Raízen criado: ${clientData.nome}`);
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
            console.error(`❌ Erro ao importar registro na linha ${i + 2}:`, error);
            results.errors.push({
                record,
                error: error.message,
                row: i + 2
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
