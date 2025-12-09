import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../services/firebase';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

/**
 * Serviço de Exportação de Dados
 * Exporta todos os dados de um projeto para Excel
 */
export const exportService = {
    /**
     * Exporta todos os clientes de um projeto
     */
    async exportClients(projectId, projectName) {
        try {
            console.log(`📊 Exportando clientes do projeto: ${projectName}`);

            const q = query(
                collection(db, 'clients'),
                where('database', '==', projectId)
            );
            const snapshot = await getDocs(q);

            const clients = snapshot.docs.map((doc) => {
                const data = doc.data();
                return {
                    ID: doc.id,
                    Nome: data.name || data.nome || '',
                    Email: data.email || '',
                    Telefone: data.phone || data.telefone || '',
                    'CPF/CNPJ': data.cpfCnpj || data.documento || '',
                    Endereço: data.address || data.endereco || '',
                    CEP: data.zipCode || data.cep || '',
                    Cidade: data.city || data.cidade || '',
                    Estado: data.state || data.estado || '',
                    Status: data.status || '',
                    'Data Criação': data.createdAt || '',
                    'Criado Por': data.createdByEmail || '',
                    Projeto: projectName,
                };
            });

            console.log(`   ✓ ${clients.length} clientes encontrados`);
            return clients;
        } catch (error) {
            console.error('Erro ao exportar clientes:', error);
            throw error;
        }
    },

    /**
     * Exporta todos os tickets de um projeto
     */
    async exportTickets(projectId, projectName) {
        try {
            console.log(`📊 Exportando tickets do projeto: ${projectName}`);

            const q = query(
                collection(db, 'tickets'),
                where('database', '==', projectId)
            );
            const snapshot = await getDocs(q);

            const tickets = snapshot.docs.map((doc) => {
                const data = doc.data();
                return {
                    ID: doc.id,
                    Título: data.title || data.titulo || '',
                    Descrição: data.description || data.descricao || '',
                    Status: data.status || '',
                    Prioridade: data.priority || data.prioridade || '',
                    'ID Cliente': data.clientId || '',
                    'Nome Cliente': data.clientName || '',
                    Categoria: data.category || data.categoria || '',
                    'Data Criação': data.createdAt || '',
                    'Data Atualização': data.updatedAt || '',
                    'Criado Por': data.createdByEmail || '',
                    Projeto: projectName,
                };
            });

            console.log(`   ✓ ${tickets.length} tickets encontrados`);
            return tickets;
        } catch (error) {
            console.error('Erro ao exportar tickets:', error);
            throw error;
        }
    },

    /**
     * Exporta eventos de clientes
     */
    async exportEvents(projectId, projectName) {
        try {
            console.log(`📊 Exportando eventos do projeto: ${projectName}`);

            const q = query(
                collection(db, 'client_events'),
                where('database', '==', projectId)
            );
            const snapshot = await getDocs(q);

            const events = snapshot.docs.map((doc) => {
                const data = doc.data();
                return {
                    ID: doc.id,
                    'ID Cliente': data.clientId || '',
                    Tipo: data.type || data.tipo || '',
                    Descrição: data.description || data.descricao || '',
                    Data: data.date || data.data || '',
                    'Criado Por': data.createdByEmail || '',
                    Projeto: projectName,
                };
            });

            console.log(`   ✓ ${events.length} eventos encontrados`);
            return events;
        } catch (error) {
            console.error('Erro ao exportar eventos:', error);
            throw error;
        }
    },

    /**
     * Exporta todos os dados de um projeto para arquivo Excel
     */
    async exportProjectData(projectId, projectName) {
        try {
            console.log(`\n📦 Iniciando exportação completa do projeto: ${projectName}`);

            // Buscar todos os dados
            const [clients, tickets, events] = await Promise.all([
                this.exportClients(projectId, projectName),
                this.exportTickets(projectId, projectName),
                this.exportEvents(projectId, projectName),
            ]);

            // Criar workbook
            const wb = XLSX.utils.book_new();

            // Adicionar sheets
            const wsClients = XLSX.utils.json_to_sheet(clients);
            XLSX.utils.book_append_sheet(wb, wsClients, 'Clientes');

            const wsTickets = XLSX.utils.json_to_sheet(tickets);
            XLSX.utils.book_append_sheet(wb, wsTickets, 'Tickets');

            const wsEvents = XLSX.utils.json_to_sheet(events);
            XLSX.utils.book_append_sheet(wb, wsEvents, 'Eventos');

            // Adicionar sheet de resumo
            const summary = [
                { Item: 'Projeto', Valor: projectName },
                { Item: 'ID do Projeto', Valor: projectId },
                { Item: 'Data da Exportação', Valor: new Date().toISOString() },
                { Item: 'Total de Clientes', Valor: clients.length },
                { Item: 'Total de Tickets', Valor: tickets.length },
                { Item: 'Total de Eventos', Valor: events.length },
            ];
            const wsSummary = XLSX.utils.json_to_sheet(summary);
            XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumo');

            // Gerar arquivo
            const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
            const blob = new Blob([wbout], { type: 'application/octet-stream' });

            // Nome do arquivo com timestamp
            const timestamp = new Date().toISOString().split('T')[0];
            const filename = `Exportacao_${projectName.replace(/\s+/g, '_')}_${timestamp}.xlsx`;

            // Download
            saveAs(blob, filename);

            console.log(`\n✅ Exportação concluída com sucesso!`);
            console.log(`   Arquivo: ${filename}`);
            console.log(`   Clientes: ${clients.length}`);
            console.log(`   Tickets: ${tickets.length}`);
            console.log(`   Eventos: ${events.length}`);

            return {
                success: true,
                filename,
                counts: {
                    clients: clients.length,
                    tickets: tickets.length,
                    events: events.length,
                },
            };
        } catch (error) {
            console.error('Erro ao exportar dados do projeto:', error);
            throw error;
        }
    },

    /**
     * Exporta todos os projetos
     */
    async exportAllProjects() {
        try {
            const projectsSnapshot = await getDocs(collection(db, 'projects'));
            const projects = projectsSnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));

            for (const project of projects) {
                await this.exportProjectData(project.id, project.name);
            }

            return { success: true, projectsExported: projects.length };
        } catch (error) {
            console.error('Erro ao exportar todos os projetos:', error);
            throw error;
        }
    },
};
