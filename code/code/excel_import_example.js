// Exemplo de implementação para importação de Excel
class ExcelProcessor {
    constructor() {
        this.fieldMappings = {
            // BASE DE CLIENTES V1
            'BASE DE CLIENTES V1': {
                'ID EXTERNO': 'externalId',
                'NOME COMPLETO OU RAZÃO SOCIAL': 'name',
                'TIPO CONTRATO': 'contractType',
                'CPF': 'cpf',
                'CNPJ': 'cnpj',
                'DATA DE ADESÃO': 'joinDate',
                'STATUS DO CLIENTE': 'status',
                'E-MAIL': 'email',
                'TELEFONE': 'phone',
                'CIDADE': 'city',
                'UF': 'state',
                'CEP': 'cep',
                'ENDEREÇO COMPLETO': 'address',
                'DESCONTO CONTRATADO': 'discount',
                'PARTICIPAÇÃO DISPONÍVEL': 'participation',
                'MÉDIA DE CONSUMO MÓVEL KWH': 'consumoMedio',
                'MÉDIA DE CONSUMO CONTRATUAL KWH': 'consumoContratual',
                'CANAL DE ENTRADA': 'canalEntrada',
                'PARCEIRO COMERCIAL': 'parceiroComercial',
                'DATA CANCELAMENTO': 'dataCancelamento',
                'MOTIVO CANCELAMENTO': 'motivoCancelamento',
                'FORNECIMENTO': 'fornecimento',
                'MODELO CONTRATO': 'modeloContrato'
            },
            // MODELO CAD PORTAL GD
            'MODELO CAD PORTAL GD': {
                'ID Externo': 'externalId',
                'CPF ou CNPJ': 'cpfCnpj',
                'Nome ou Razão Social': 'name',
                'Nome Fantasia': 'nomeFantasia',
                ' Contato Financeiro': 'contatoFinanceiro',
                'E-mail Contato Financeiro': 'emailFinanceiro',
                'Telefone Contato Financeiro': 'telefoneFinanceiro',
                'CEP': 'cep',
                'Endereço com número': 'address',
                'Cidade': 'city',
                'UF': 'state',
                'Instalação': 'instalacao',
                'Número do Cliente': 'numeroCliente',
                'Distribuidora - UC ': 'distribuidoraUC',
                'Tipo Contrato': 'contractType',
                'Data Assinatura': 'dataAssinatura',
                'Desconto (%)': 'discount',
                'Participação (kWh)': 'participation',
                'Id Externo - Usina': 'plantExternalId',
                'Nome - Usina': 'plantName',
                'Instalação - Usina': 'plantInstalacao',
                'Início Operação - Usina': 'plantInicioOperacao'
            }
        };
    }

    // Processar arquivo Excel completo
    async processExcelFile(file) {
        try {
            const data = await this.readExcelFile(file);
            const processedData = {
                clients: [],
                contracts: [],
                plants: [],
                projects: []
            };

            // Processar cada aba
            for (const [sheetName, sheetData] of Object.entries(data)) {
                if (sheetData.length === 0) continue;

                console.log(`Processando aba: ${sheetName}`);
                
                switch (sheetName) {
                    case 'BASE DE CLIENTES V1':
                        processedData.clients = this.processBaseClientes(sheetData);
                        break;
                    case 'MODELO CAD PORTAL GD':
                        const modelData = this.processModeloCad(sheetData);
                        processedData.clients = [...processedData.clients, ...modelData.clients];
                        processedData.contracts = [...processedData.contracts, ...modelData.contracts];
                        processedData.plants = [...processedData.plants, ...modelData.plants];
                        break;
                    default:
                        console.log(`Aba não reconhecida: ${sheetName}`);
                }
            }

            return processedData;
        } catch (error) {
            console.error('Erro ao processar arquivo Excel:', error);
            throw error;
        }
    }

    // Ler arquivo Excel
    readExcelFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { 
                        type: 'array',
                        cellDates: true,
                        cellNF: false,
                        cellText: false
                    });
                    
                    const result = {};
                    workbook.SheetNames.forEach(sheetName => {
                        const worksheet = workbook.Sheets[sheetName];
                        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
                            header: 1, // Array de arrays
                            defval: '',
                            raw: false
                        });
                        
                        // Converter para objeto com headers
                        if (jsonData.length > 0) {
                            const headers = jsonData[0];
                            const rows = jsonData.slice(1);
                            
                            result[sheetName] = rows.map(row => {
                                const obj = {};
                                headers.forEach((header, index) => {
                                    obj[header] = row[index];
                                });
                                return obj;
                            });
                        }
                    });
                    
                    resolve(result);
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.onerror = reject;
            reader.readAsArrayBuffer(file);
        });
    }

    // Processar dados da BASE DE CLIENTES V1
    processBaseClientes(data) {
        const clients = [];
        const mapping = this.fieldMappings['BASE DE CLIENTES V1'];
        
        data.forEach(row => {
            const client = {
                id: this.generateId(),
                source: 'BASE_DE_CLIENTES_V1',
                createdAt: new Date().toISOString()
            };

            // Mapear campos
            for (const [excelField, appField] of Object.entries(mapping)) {
                if (row[excelField]) {
                    let value = row[excelField];
                    
                    // Limpar e formatar valores
                    switch (appField) {
                        case 'cpf':
                        case 'cnpj':
                            value = this.formatDocument(value);
                            break;
                        case 'joinDate':
                        case 'dataCancelamento':
                            value = this.parseDate(value);
                            break;
                        case 'discount':
                            value = this.parsePercentage(value);
                            break;
                        case 'consumoMedio':
                        case 'consumoContratual':
                        case 'participation':
                            value = this.parseNumber(value);
                            break;
                        case 'cep':
                            value = this.formatCEP(value);
                            break;
                    }
                    
                    client[appField] = value;
                }
            }

            // Validar dados obrigatórios
            if (client.name && (client.cpf || client.cnpj)) {
                clients.push(client);
            }
        });

        return clients;
    }

    // Processar dados do MODELO CAD PORTAL GD
    processModeloCad(data) {
        const result = {
            clients: [],
            contracts: [],
            plants: []
        };

        const clientMapping = this.fieldMappings['MODELO CAD PORTAL GD'];

        data.forEach(row => {
            // Processar Cliente
            const client = {
                id: this.generateId(),
                source: 'MODELO_CAD_PORTAL_GD',
                createdAt: new Date().toISOString()
            };

            // Mapear campos do cliente
            for (const [excelField, appField] of Object.entries(clientMapping)) {
                if (row[excelField]) {
                    let value = row[excelField];
                    
                    switch (appField) {
                        case 'cpfCnpj':
                            if (value.toString().length <= 14) {
                                client.cpf = this.formatDocument(value);
                            } else {
                                client.cnpj = this.formatDocument(value);
                            }
                            break;
                        case 'dataAssinatura':
                            value = this.parseDate(value);
                            break;
                        case 'discount':
                            value = this.parsePercentage(value);
                            break;
                        case 'participation':
                            value = this.parseNumber(value);
                            break;
                        default:
                            client[appField] = value;
                    }
                }
            }

            // Processar Contrato
            const contract = {
                id: this.generateId(),
                clientId: client.id,
                externalId: client.externalId,
                plantExternalId: row['Id Externo - Usina'],
                contractType: row['Tipo Contrato'],
                signatureDate: this.parseDate(row['Data Assinatura']),
                discount: this.parsePercentage(row['Desconto (%)']),
                participation: this.parseNumber(row['Participação (kWh)']),
                createdAt: new Date().toISOString()
            };

            // Processar Usina
            const plant = {
                id: this.generateId(),
                externalId: row['Id Externo - Usina'],
                name: row['Nome - Usina'],
                instalacao: row['Instalação - Usina'],
                distribuidora: row['Distribuidora - Usina'],
                inicioOperacao: this.parseDate(row['Início Operação - Usina']),
                createdAt: new Date().toISOString()
            };

            if (client.name) {
                result.clients.push(client);
                result.contracts.push(contract);
                result.plants.push(plant);
            }
        });

        return result;
    }

    // Utilitários de formatação
    formatDocument(value) {
        if (!value) return '';
        const digits = value.toString().replace(/\D/g, '');
        
        if (digits.length === 11) {
            // CPF
            return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
        } else if (digits.length === 14) {
            // CNPJ
            return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
        }
        return value;
    }

    formatCEP(value) {
        if (!value) return '';
        const digits = value.toString().replace(/\D/g, '');
        return digits.replace(/(\d{5})(\d{3})/, '$1-$2');
    }

    parseDate(value) {
        if (!value) return null;
        
        if (value instanceof Date) {
            return value.toISOString().split('T')[0];
        }
        
        // Tentar diferentes formatos
        const dateStr = value.toString();
        
        // Formato DD/MM/YYYY
        if (dateStr.includes('/')) {
            const parts = dateStr.split('/');
            if (parts.length === 3) {
                const day = parts[0].padStart(2, '0');
                const month = parts[1].padStart(2, '0');
                const year = parts[2];
                return `${year}-${month}-${day}`;
            }
        }
        
        // Formato YYYY-MM-DD
        if (dateStr.includes('-')) {
            return dateStr.split('T')[0];
        }
        
        return null;
    }

    parsePercentage(value) {
        if (!value) return 0;
        const num = parseFloat(value.toString().replace(',', '.'));
        return isNaN(num) ? 0 : num;
    }

    parseNumber(value) {
        if (!value) return 0;
        const num = parseFloat(value.toString().replace(/[^\d.-]/g, ''));
        return isNaN(num) ? 0 : num;
    }

    generateId() {
        return 'C' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    }

    // Validação de dados
    validateClient(client) {
        const errors = [];

        if (!client.name) {
            errors.push('Nome é obrigatório');
        }

        if (!client.cpf && !client.cnpj) {
            errors.push('CPF ou CNPJ é obrigatório');
        }

        if (client.cpf && !this.validateCPF(client.cpf)) {
            errors.push('CPF inválido');
        }

        if (client.cnpj && !this.validateCNPJ(client.cnpj)) {
            errors.push('CNPJ inválido');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    validateCPF(cpf) {
        cpf = cpf.replace(/\D/g, '');
        
        if (cpf.length !== 11) return false;
        if (/^(\d)\1{10}$/.test(cpf)) return false;
        
        // Validar dígitos verificadores
        let sum = 0;
        for (let i = 0; i < 9; i++) {
            sum += parseInt(cpf.charAt(i)) * (10 - i);
        }
        let digit = 11 - (sum % 11);
        if (digit >= 10) digit = 0;
        if (digit !== parseInt(cpf.charAt(9))) return false;
        
        sum = 0;
        for (let i = 0; i < 10; i++) {
            sum += parseInt(cpf.charAt(i)) * (11 - i);
        }
        digit = 11 - (sum % 11);
        if (digit >= 10) digit = 0;
        if (digit !== parseInt(cpf.charAt(10))) return false;
        
        return true;
    }

    validateCNPJ(cnpj) {
        cnpj = cnpj.replace(/\D/g, '');
        
        if (cnpj.length !== 14) return false;
        if (/^(\d)\1{13}$/.test(cnpj)) return false;
        
        // Validar dígitos verificadores (simplificado)
        const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
        const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
        
        let sum = 0;
        for (let i = 0; i < 12; i++) {
            sum += parseInt(cnpj.charAt(i)) * weights1[i];
        }
        let digit = sum % 11 < 2 ? 0 : 11 - (sum % 11);
        if (digit !== parseInt(cnpj.charAt(12))) return false;
        
        sum = 0;
        for (let i = 0; i < 13; i++) {
            sum += parseInt(cnpj.charAt(i)) * weights2[i];
        }
        digit = sum % 11 < 2 ? 0 : 11 - (sum % 11);
        
        return digit === parseInt(cnpj.charAt(13));
    }

    // Relatório de importação
    generateImportReport(processedData) {
        const report = {
            summary: {
                totalClients: processedData.clients.length,
                totalContracts: processedData.contracts.length,
                totalPlants: processedData.plants.length,
                validClients: 0,
                invalidClients: 0
            },
            errors: [],
            warnings: [],
            fieldAnalysis: {}
        };

        // Validar clientes
        processedData.clients.forEach(client => {
            const validation = this.validateClient(client);
            if (validation.isValid) {
                report.summary.validClients++;
            } else {
                report.summary.invalidClients++;
                report.errors.push({
                    clientId: client.id,
                    clientName: client.name,
                    errors: validation.errors
                });
            }
        });

        // Análise de campos
        const fields = ['status', 'contractType', 'city', 'state'];
        fields.forEach(field => {
            const values = processedData.clients
                .map(c => c[field])
                .filter(v => v && v !== '');
            
            const uniqueValues = [...new Set(values)];
            report.fieldAnalysis[field] = {
                filled: values.length,
                empty: processedData.clients.length - values.length,
                uniqueValues: uniqueValues.length,
                examples: uniqueValues.slice(0, 5)
            };
        });

        return report;
    }
}

// Exemplo de uso
async function importExcelFile(file) {
    const processor = new ExcelProcessor();
    
    try {
        console.log('Iniciando importação...');
        const processedData = await processor.processExcelFile(file);
        
        console.log('Gerando relatório...');
        const report = processor.generateImportReport(processedData);
        
        console.log('Relatório de importação:', report);
        
        // Retornar dados processados e relatório
        return {
            data: processedData,
            report: report
        };
        
    } catch (error) {
        console.error('Erro na importação:', error);
        throw error;
    }
}

// Exportar para uso em outros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ExcelProcessor;
}
