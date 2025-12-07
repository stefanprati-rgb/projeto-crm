import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import Papa from 'papaparse';

/**
 * Utilitários para exportação de dados
 */

/**
 * Exporta dados para Excel (.xlsx)
 */
export const exportToExcel = (data, filename = 'export') => {
    try {
        // Criar workbook
        const wb = XLSX.utils.book_new();

        // Converter dados para worksheet
        const ws = XLSX.utils.json_to_sheet(data);

        // Adicionar worksheet ao workbook
        XLSX.utils.book_append_sheet(wb, ws, 'Dados');

        // Gerar arquivo Excel
        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });

        // Salvar arquivo
        const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        saveAs(blob, `${filename}.xlsx`);

        return { success: true };
    } catch (error) {
        console.error('Erro ao exportar para Excel:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Exporta dados para CSV
 */
export const exportToCSV = (data, filename = 'export') => {
    try {
        const csv = Papa.unparse(data);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        saveAs(blob, `${filename}.csv`);

        return { success: true };
    } catch (error) {
        console.error('Erro ao exportar para CSV:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Exporta dados para JSON
 */
export const exportToJSON = (data, filename = 'export') => {
    try {
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        saveAs(blob, `${filename}.json`);

        return { success: true };
    } catch (error) {
        console.error('Erro ao exportar para JSON:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Importa dados de arquivo Excel
 */
export const importFromExcel = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });

                // Pegar primeira planilha
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];

                // Converter para JSON
                const jsonData = XLSX.utils.sheet_to_json(worksheet);

                resolve({ success: true, data: jsonData });
            } catch (error) {
                reject({ success: false, error: error.message });
            }
        };

        reader.onerror = () => {
            reject({ success: false, error: 'Erro ao ler arquivo' });
        };

        reader.readAsArrayBuffer(file);
    });
};

/**
 * Importa dados de arquivo CSV
 */
export const importFromCSV = (file) => {
    return new Promise((resolve, reject) => {
        Papa.parse(file, {
            header: true,
            complete: (results) => {
                resolve({ success: true, data: results.data });
            },
            error: (error) => {
                reject({ success: false, error: error.message });
            },
        });
    });
};

/**
 * Formata dados de clientes para exportação
 */
export const formatClientsForExport = (clients) => {
    return clients.map((client) => ({
        Nome: client.name || '',
        Email: client.email || '',
        Telefone: client.phone || '',
        'CPF/CNPJ': client.cpfCnpj || '',
        Endereço: client.address || '',
        Cidade: client.city || '',
        Estado: client.state || '',
        CEP: client.zipCode || '',
        Status: client.status === 'active' ? 'Ativo' : 'Inativo',
        Base: client.database || '',
        Observações: client.notes || '',
        'Criado em': client.createdAt ? new Date(client.createdAt).toLocaleString('pt-BR') : '',
    }));
};

/**
 * Formata dados de tickets para exportação
 */
export const formatTicketsForExport = (tickets) => {
    return tickets.map((ticket) => ({
        Protocolo: ticket.protocol || '',
        Assunto: ticket.subject || '',
        Descrição: ticket.description || '',
        Categoria: ticket.category || '',
        Prioridade: ticket.priority === 'high' ? 'Alta' : ticket.priority === 'medium' ? 'Média' : 'Baixa',
        Status: ticket.status === 'open' ? 'Aberto' : ticket.status === 'in_progress' ? 'Em Andamento' : ticket.status === 'resolved' ? 'Resolvido' : 'Fechado',
        Vencido: ticket.overdue ? 'Sim' : 'Não',
        'Prazo (SLA)': ticket.dueDate ? new Date(ticket.dueDate).toLocaleString('pt-BR') : '',
        'Aberto por': ticket.openedByEmail || '',
        'Criado em': ticket.createdAt ? new Date(ticket.createdAt).toLocaleString('pt-BR') : '',
        'Resolvido em': ticket.resolvedAt ? new Date(ticket.resolvedAt).toLocaleString('pt-BR') : '',
    }));
};
