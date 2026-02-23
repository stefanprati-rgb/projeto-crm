import { useState } from 'react';
import { Upload, FileText, Loader, Settings } from 'lucide-react';
import { Button } from '../Button';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import { clientService } from '../../services/clientService';

/**
 * Utilitário para limpar e converter valores monetários BR
 * Ex: "R$ 1.500,50" -> 1500.50
 * Ex: 1500.5 -> 1500.50
 */
const parseMoney = (value) => {
    if (value === null || value === undefined || value === '') return 0;

    if (typeof value === 'number') return value;

    // Remove R$, espaços, pontos de milhar e troca vírgula por ponto
    const str = String(value).trim();
    const cleanStr = str.replace(/[R$\s]/g, '').replace(/\./g, '').replace(',', '.');

    const num = parseFloat(cleanStr);
    return isNaN(num) ? 0 : num;
};

/**
 * Utilitário para converter datas do Excel ou Strings BR
 */
const parseDate = (value) => {
    if (!value) return null;

    // Se for data do Excel (número serial)
    if (typeof value === 'number') {
        // Ajuste básico para data Excel JS (pode precisar da lib se for muito complexo, mas isso costuma funcionar)
        return new Date(Math.round((value - 25569) * 864e5));
    }

    const str = String(value).trim();

    // Formato BR: dd/MM/yyyy
    if (/^\d{2}\/\d{2}\/\d{4}/.test(str)) {
        const [day, month, year] = str.split('/');
        return new Date(year, month - 1, day);
    }

    // Formato ISO ou outro
    const date = new Date(str);
    return isNaN(date.getTime()) ? null : date;
};

/**
 * Componente de Importação de Faturas (Blindado)
 */
export const InvoiceImporter = ({ database = 'EGS', onComplete }) => {
    const [file, setFile] = useState(null);
    const [headers, setHeaders] = useState([]);
    const [rows, setRows] = useState([]);
    const [columnMapping, setColumnMapping] = useState({
        installationId: '',
        amount: '',
        dueDate: '',
        competence: '',
    });
    const [importing, setImporting] = useState(false);
    const [progress, setProgress] = useState(null);
    const [results, setResults] = useState(null);
    const [showMapping, setShowMapping] = useState(false);

    // Colunas esperadas e suas variações comuns
    const expectedColumns = [
        {
            key: 'installationId',
            label: 'Instalação (UC)',
            required: true,
            keywords: ['instalacao', 'instalação', 'uc', 'unidade consumidora', 'conta contrato']
        },
        {
            key: 'amount',
            label: 'Valor (R$)',
            required: true,
            keywords: ['valor', 'total', 'emitido', 'consolidado', 'valor final', 'fatura']
        },
        {
            key: 'dueDate',
            label: 'Vencimento',
            required: true,
            keywords: ['vencimento', 'venc', 'data venc']
        },
        {
            key: 'competence',
            label: 'Competência',
            required: false,
            keywords: ['competencia', 'competência', 'mes', 'referencia', 'ref']
        },
    ];

    const handleFileChange = async (e) => {
        const selectedFile = e.target.files[0];
        if (!selectedFile) return;

        setFile(selectedFile);
        setResults(null);
        setRows([]);
        setHeaders([]);
        setShowMapping(false);

        try {
            toast.loading('Analisando arquivo...');
            const data = await readExcelFileSmart(selectedFile);

            if (data.rows.length === 0) {
                throw new Error('Nenhuma linha de dados encontrada.');
            }

            setHeaders(data.headers);
            setRows(data.rows);

            // Auto-detecta colunas
            const autoMapping = autoDetectColumns(data.headers, expectedColumns);
            setColumnMapping(autoMapping);

            toast.dismiss();
            toast.success(`${data.rows.length} linhas de dados identificadas`);
            setShowMapping(true);
        } catch (error) {
            toast.dismiss();
            toast.error('Erro ao ler arquivo: ' + error.message);
            console.error(error);
        }
    };

    const handleImport = async () => {
        // Valida mapeamento
        const missingRequired = expectedColumns
            .filter((col) => col.required && columnMapping[col.key] === '')
            .map((col) => col.label);

        if (missingRequired.length > 0) {
            toast.error(`Mapeie as colunas obrigatórias: ${missingRequired.join(', ')}`);
            return;
        }

        setImporting(true);
        setProgress({ current: 0, total: rows.length, percent: 0 });

        const importResults = {
            total: rows.length,
            success: 0,
            errors: [],
            notFound: [],
        };

        try {
            for (let i = 0; i < rows.length; i++) {
                const row = rows[i];

                try {
                    // Extrai e limpa dados
                    const rawInst = row[columnMapping.installationId];
                    if (!rawInst) {
                        // Pula linhas vazias silenciosamente se não tiver instalação
                        continue;
                    }

                    const rawAmount = row[columnMapping.amount];
                    const rawDueDate = row[columnMapping.dueDate];

                    const amount = parseMoney(rawAmount);
                    const dueDate = parseDate(rawDueDate);

                    // Validações básicas
                    if (!dueDate) throw new Error(`Data inválida: ${rawDueDate}`);
                    // Permitimos valor 0, mas avisamos se for NaN real antes do parse

                    const status = dueDate && dueDate < new Date() ? 'overdue' : 'open';

                    const invoiceData = {
                        installationId: String(rawInst).trim(),
                        amount: amount,
                        dueDate: dueDate.toISOString(),
                        competence: columnMapping.competence !== '' ? row[columnMapping.competence] : '',
                        status: status,
                        createdAt: new Date().toISOString(),
                        importedAt: new Date().toISOString()
                    };

                    // Busca cliente
                    const clients = await clientService.search(invoiceData.installationId, database);

                    if (!clients || clients.length === 0) {
                        importResults.notFound.push(invoiceData.installationId);
                        // Não lançamos erro aqui para não parar o fluxo, apenas registramos
                        // throw new Error(`Instalação ${invoiceData.installationId} não encontrada`);
                    } else {
                        const client = clients[0];

                        // Verifica duplicidade básica (mesmo valor e vencimento) para evitar sujeira
                        const exists = (client.invoices || []).some(inv =>
                            inv.dueDate.split('T')[0] === invoiceData.dueDate.split('T')[0] &&
                            Math.abs(inv.amount - invoiceData.amount) < 0.01
                        );

                        if (!exists) {
                            const updatedInvoices = [...(client.invoices || []), invoiceData];
                            await clientService.update(client.id, {
                                invoices: updatedInvoices,
                            });
                            importResults.success++;
                        } else {
                            // Consideramos sucesso se já existe, para não poluir log de erros
                            console.log(`Fatura já existente para ${invoiceData.installationId}`);
                            importResults.success++;
                        }
                    }

                } catch (error) {
                    console.error(`❌ Erro na linha ${i + 1}:`, error);
                    importResults.errors.push({
                        row: i + 1,
                        data: row,
                        error: error.message,
                    });
                }

                // Atualiza progresso a cada 10 registros para performance
                if (i % 10 === 0 || i === rows.length - 1) {
                    setProgress({
                        current: i + 1,
                        total: rows.length,
                        percent: Math.round(((i + 1) / rows.length) * 100),
                    });
                }
            }

            setResults(importResults);
            toast.success(`✅ Processado! Sucessos: ${importResults.success}`);

            if (onComplete) {
                onComplete(importResults);
            }
        } catch (error) {
            toast.error('Erro crítico na importação: ' + error.message);
            console.error(error);
        } finally {
            setImporting(false);
        }
    };

    return (
        <div className="card">
            <div className="flex items-center gap-3 mb-6">
                <FileText className="h-6 w-6 text-primary-600" />
                <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        Importar Faturas (Smart)
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Aceita Excel/CSV de EGS, ESP, LNV e ALA
                    </p>
                </div>
            </div>

            {/* Upload Area */}
            <div className="mb-6">
                <label
                    htmlFor="invoice-upload"
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="h-8 w-8 text-gray-400 mb-2" />
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            {file ? file.name : 'Clique para selecionar arquivo'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                            Excel (.xlsx) ou CSV - Detecta cabeçalho automaticamente
                        </p>
                    </div>
                    <input
                        id="invoice-upload"
                        type="file"
                        className="hidden"
                        accept=".csv,.xlsx,.xls"
                        onChange={handleFileChange}
                        disabled={importing}
                    />
                </label>
            </div>

            {/* Column Mapping */}
            {showMapping && headers.length > 0 && (
                <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2 mb-4">
                        <Settings className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                        <h3 className="font-medium text-gray-900 dark:text-gray-100">
                            Confirme as Colunas
                        </h3>
                    </div>

                    <div className="space-y-3">
                        {expectedColumns.map((col) => (
                            <div key={col.key} className="grid grid-cols-2 gap-3 items-center">
                                <label className="text-sm text-gray-700 dark:text-gray-300">
                                    {col.label}
                                    {col.required && <span className="text-red-500 ml-1">*</span>}
                                </label>
                                <select
                                    value={columnMapping[col.key]}
                                    onChange={(e) =>
                                        setColumnMapping({ ...columnMapping, [col.key]: e.target.value })
                                    }
                                    className="input text-sm"
                                >
                                    <option value="">Selecione...</option>
                                    {headers.map((header, i) => (
                                        <option key={i} value={i}>
                                            {header}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        ))}
                    </div>

                    {/* Preview */}
                    {rows.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                                Preview da 1ª linha importável:
                            </p>
                            <div className="space-y-1 text-xs bg-white dark:bg-gray-900 p-2 rounded border border-gray-200 dark:border-gray-700">
                                {expectedColumns.map((col) => {
                                    const rawVal = columnMapping[col.key] !== ''
                                        ? rows[0][columnMapping[col.key]]
                                        : '-';

                                    // Mostra preview processado para valor
                                    let displayVal = rawVal;
                                    if (col.key === 'amount' && rawVal !== '-') {
                                        displayVal = `${rawVal} ➡️ ${parseMoney(rawVal)}`;
                                    }

                                    return (
                                        <div key={col.key} className="flex gap-2">
                                            <span className="text-gray-500 w-24">{col.label}:</span>
                                            <span className="font-medium text-gray-900 dark:text-gray-100 truncate">
                                                {displayVal}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Progress */}
            {importing && progress && (
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Processando...</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {progress.current}/{progress.total}
                        </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                            className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${progress.percent}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Results */}
            {results && (
                <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
                        Relatório
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="text-gray-600 dark:text-gray-400">Total Lido:</span>
                            <span className="ml-2 font-bold text-gray-900 dark:text-gray-100">
                                {results.total}
                            </span>
                        </div>
                        <div>
                            <span className="text-gray-600 dark:text-gray-400">Processado:</span>
                            <span className="ml-2 font-bold text-green-600 dark:text-green-400">
                                {results.success}
                            </span>
                        </div>
                        <div>
                            <span className="text-gray-600 dark:text-gray-400">Falhas Leitura:</span>
                            <span className="ml-2 font-bold text-red-600 dark:text-red-400">
                                {results.errors.length}
                            </span>
                        </div>
                        <div>
                            <span className="text-gray-600 dark:text-gray-400">UC Não Encontrada:</span>
                            <span className="ml-2 font-bold text-yellow-600 dark:text-yellow-400">
                                {results.notFound.length}
                            </span>
                        </div>
                    </div>

                    {results.notFound.length > 0 && (
                        <details className="mt-4">
                            <summary className="cursor-pointer text-sm text-yellow-600 dark:text-yellow-400 hover:underline">
                                Ver UCs não encontradas ({results.notFound.length})
                            </summary>
                            <div className="mt-2 space-y-1 max-h-40 overflow-y-auto p-2 bg-white dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700">
                                {[...new Set(results.notFound)].map((uc, i) => (
                                    <div key={i} className="text-xs font-mono text-gray-600 dark:text-gray-400">
                                        {uc}
                                    </div>
                                ))}
                            </div>
                        </details>
                    )}
                </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
                <Button
                    onClick={handleImport}
                    disabled={!showMapping || importing || !rows.length}
                    className="flex-1"
                >
                    {importing ? (
                        <>
                            <Loader className="h-4 w-4 mr-2 animate-spin" />
                            Importando...
                        </>
                    ) : (
                        <>
                            <FileText className="h-4 w-4 mr-2" />
                            Confirmar Importação
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
};

/**
 * Lê arquivo Excel/CSV procurando a linha de cabeçalho
 */
const readExcelFileSmart = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array', cellDates: true });
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];

                // Lê tudo como matriz primeiro
                const fullData = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: '' });

                // Procura a linha de cabeçalho
                let headerRowIndex = 0;
                let maxScore = 0;
                const keywords = ['INSTALAÇÃO', 'UC', 'VALOR', 'VENCIMENTO', 'TOTAL', 'NOTA FISCAL', 'CONSOLIDADO'];

                // Varre até a linha 50 procurando a linha que tem mais keywords
                for (let i = 0; i < Math.min(fullData.length, 50); i++) {
                    const row = fullData[i];
                    if (!row || !Array.isArray(row)) continue;

                    let score = 0;
                    const rowStr = row.map(c => String(c).toUpperCase());

                    keywords.forEach(k => {
                        if (rowStr.some(cell => cell.includes(k))) score++;
                    });

                    if (score > maxScore) {
                        maxScore = score;
                        headerRowIndex = i;
                    }
                }

                if (maxScore === 0) {
                    console.warn("Cabeçalho não detectado com certeza, usando linha 0");
                    headerRowIndex = 0;
                }

                const headers = fullData[headerRowIndex].map(h => String(h || '').trim());
                const rows = fullData.slice(headerRowIndex + 1);

                resolve({ headers, rows });
            } catch (error) {
                reject(error);
            }
        };

        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
    });
};

/**
 * Auto-detecta colunas baseado em palavras-chave e keywords configuradas
 */
const autoDetectColumns = (headers, expectedColumns) => {
    const mapping = {};

    expectedColumns.forEach(col => {
        mapping[col.key] = '';
        const colKeywords = col.keywords || [];

        // Tenta achar a melhor coluna correspondente
        for (let i = 0; i < headers.length; i++) {
            const h = headers[i].toUpperCase();
            if (colKeywords.some(k => h.includes(k.toUpperCase()))) {
                mapping[col.key] = i;
                break; // Achou, para (prioridade para a primeira encontrada na esquerda)
            }
        }
    });

    return mapping;
};