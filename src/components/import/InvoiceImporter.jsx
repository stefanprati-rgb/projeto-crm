import { useState } from 'react';
import { Upload, AlertCircle, CheckCircle, FileText, Loader, Settings } from 'lucide-react';
import { Button } from '../Button';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import { clientService } from '../../services/clientService';
import { formatCurrency } from '../../utils/formatters';

/**
 * Componente de Importação de Faturas
 * Permite upload de Excel/CSV com faturas e mapeamento de colunas
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

    // Colunas esperadas
    const expectedColumns = [
        { key: 'installationId', label: 'Instalação (UC)', required: true },
        { key: 'amount', label: 'Valor', required: true },
        { key: 'dueDate', label: 'Vencimento', required: true },
        { key: 'competence', label: 'Competência (Mês/Ano)', required: false },
    ];

    const handleFileChange = async (e) => {
        const selectedFile = e.target.files[0];
        if (!selectedFile) return;

        setFile(selectedFile);
        setResults(null);

        try {
            toast.loading('Lendo arquivo...');
            const data = await readExcelFile(selectedFile);
            setHeaders(data.headers);
            setRows(data.rows);

            // Auto-detecta colunas
            const autoMapping = autoDetectColumns(data.headers);
            setColumnMapping(autoMapping);

            toast.dismiss();
            toast.success(`${data.rows.length} linhas encontradas`);
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
            .filter((col) => col.required && !columnMapping[col.key])
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
                    // Extrai dados da linha
                    const rawDueDate = row[columnMapping.dueDate] || '';
                    const dueDate = parseDueDate(rawDueDate);

                    // Determina status automaticamente baseado na data de vencimento
                    const status = dueDate && dueDate < new Date() ? 'overdue' : 'open';

                    const invoiceData = {
                        installationId: String(row[columnMapping.installationId] || '').trim(),
                        amount: parseFloat(row[columnMapping.amount]) || 0,
                        dueDate: rawDueDate,
                        competence: row[columnMapping.competence] || '',
                        status: status,
                        createdAt: new Date().toISOString(),
                    };

                    if (!invoiceData.installationId) {
                        throw new Error('Instalação vazia');
                    }

                    // Busca cliente pela instalação
                    const clients = await clientService.search(invoiceData.installationId, database);

                    if (!clients || clients.length === 0) {
                        importResults.notFound.push(invoiceData.installationId);
                        throw new Error(`Instalação ${invoiceData.installationId} não encontrada`);
                    }

                    const client = clients[0];

                    // Adiciona fatura ao cliente
                    const updatedInvoices = [...(client.invoices || []), invoiceData];

                    await clientService.update(client.id, {
                        invoices: updatedInvoices,
                    });

                    importResults.success++;
                    console.log(`✅ Fatura importada para ${client.name} (${invoiceData.installationId})`);
                } catch (error) {
                    console.error(`❌ Erro na linha ${i + 1}:`, error);
                    importResults.errors.push({
                        row: i + 1,
                        data: row,
                        error: error.message,
                    });
                }

                // Atualiza progresso
                setProgress({
                    current: i + 1,
                    total: rows.length,
                    percent: Math.round(((i + 1) / rows.length) * 100),
                });
            }

            setResults(importResults);
            toast.success(`✅ Importação concluída! ${importResults.success}/${importResults.total} faturas`);

            if (onComplete) {
                onComplete(importResults);
            }
        } catch (error) {
            toast.error('Erro na importação: ' + error.message);
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
                        Importar Faturas
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Faça upload de arquivo Excel/CSV com as faturas
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
                            Excel (.xlsx, .xls) ou CSV
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
                            Mapeamento de Colunas
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
                                Preview (primeira linha):
                            </p>
                            <div className="space-y-1 text-xs">
                                {expectedColumns.map((col) => {
                                    const value = columnMapping[col.key]
                                        ? rows[0][columnMapping[col.key]]
                                        : '-';
                                    return (
                                        <div key={col.key} className="flex gap-2">
                                            <span className="text-gray-500">{col.label}:</span>
                                            <span className="font-medium text-gray-900 dark:text-gray-100">
                                                {value}
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
                        <span className="text-sm text-gray-600 dark:text-gray-400">Importando...</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {progress.current}/{progress.total} ({progress.percent}%)
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
                        Resultado da Importação
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="text-gray-600 dark:text-gray-400">Total:</span>
                            <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">
                                {results.total}
                            </span>
                        </div>
                        <div>
                            <span className="text-gray-600 dark:text-gray-400">Sucesso:</span>
                            <span className="ml-2 font-medium text-green-600 dark:text-green-400">
                                {results.success}
                            </span>
                        </div>
                        <div>
                            <span className="text-gray-600 dark:text-gray-400">Erros:</span>
                            <span className="ml-2 font-medium text-red-600 dark:text-red-400">
                                {results.errors.length}
                            </span>
                        </div>
                        <div>
                            <span className="text-gray-600 dark:text-gray-400">Não encontrados:</span>
                            <span className="ml-2 font-medium text-yellow-600 dark:text-yellow-400">
                                {results.notFound.length}
                            </span>
                        </div>
                    </div>

                    {results.notFound.length > 0 && (
                        <details className="mt-4">
                            <summary className="cursor-pointer text-sm text-yellow-600 dark:text-yellow-400 hover:underline">
                                Instalações não encontradas ({results.notFound.length})
                            </summary>
                            <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                                {results.notFound.map((uc, i) => (
                                    <div key={i} className="text-xs text-gray-600 dark:text-gray-400">
                                        • {uc}
                                    </div>
                                ))}
                            </div>
                        </details>
                    )}

                    {results.errors.length > 0 && (
                        <details className="mt-4">
                            <summary className="cursor-pointer text-sm text-red-600 dark:text-red-400 hover:underline">
                                Ver erros ({results.errors.length})
                            </summary>
                            <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                                {results.errors.map((err, i) => (
                                    <div key={i} className="text-xs text-gray-600 dark:text-gray-400">
                                        • Linha {err.row}: {err.error}
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
                            Importar {rows.length} Faturas
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
};

/**
 * Lê arquivo Excel/CSV
 */
const readExcelFile = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

                const headers = jsonData[0];
                const rows = jsonData.slice(1).filter((row) => row.length > 0);

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
 * Auto-detecta colunas baseado em palavras-chave
 */
const autoDetectColumns = (headers) => {
    const mapping = {
        installationId: '',
        amount: '',
        dueDate: '',
        competence: '',
    };

    headers.forEach((header, index) => {
        const h = String(header).toLowerCase();

        if (h.includes('instalacao') || h.includes('instalação') || h.includes('uc')) {
            mapping.installationId = index;
        } else if (h.includes('valor') || h.includes('total')) {
            mapping.amount = index;
        } else if (h.includes('vencimento') || h.includes('venc')) {
            mapping.dueDate = index;
        } else if (h.includes('competencia') || h.includes('competência') || h.includes('mes')) {
            mapping.competence = index;
        }
    });

    return mapping;
};

/**
 * Parseia data em diferentes formatos (ISO, dd/MM/yyyy, etc)
 */
const parseDueDate = (dateStr) => {
    if (!dateStr) return null;

    const str = String(dateStr).trim();

    // Formato ISO: 2024-12-10
    if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
        return new Date(str);
    }

    // Formato BR: dd/MM/yyyy
    if (/^\d{2}\/\d{2}\/\d{4}/.test(str)) {
        const [day, month, year] = str.split('/');
        return new Date(year, month - 1, day);
    }

    // Tenta parseamento genérico
    const parsed = new Date(str);
    return isNaN(parsed.getTime()) ? null : parsed;
};
