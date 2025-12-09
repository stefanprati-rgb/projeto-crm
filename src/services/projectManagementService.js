import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    query,
    where,
    orderBy,
    onSnapshot,
} from 'firebase/firestore';
import { db } from './firebase';

/**
 * Serviço de Gerenciamento de Projetos
 * Gerencia CRUD de projetos/bases no sistema
 */
export const projectManagementService = {
    /**
     * Busca todos os projetos
     */
    async getAll() {
        try {
            const q = query(collection(db, 'projects'), orderBy('name', 'asc'));
            const snapshot = await getDocs(q);

            return snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));
        } catch (error) {
            console.error('Erro ao buscar projetos:', error);
            throw error;
        }
    },

    /**
     * Busca um projeto por ID
     */
    async getById(id) {
        try {
            const docRef = doc(db, 'projects', id);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                return { id: docSnap.id, ...docSnap.data() };
            }
            return null;
        } catch (error) {
            console.error('Erro ao buscar projeto:', error);
            throw error;
        }
    },

    /**
     * Cria um novo projeto
     */
    async create(projectData) {
        try {
            const project = {
                name: projectData.name,
                description: projectData.description || '',
                active: projectData.active !== false,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            const docRef = await addDoc(collection(db, 'projects'), project);
            return { id: docRef.id, ...project };
        } catch (error) {
            console.error('Erro ao criar projeto:', error);
            throw error;
        }
    },

    /**
     * Atualiza um projeto
     */
    async update(id, updates) {
        try {
            const ref = doc(db, 'projects', id);

            const updateData = {
                ...updates,
                updatedAt: new Date().toISOString(),
            };

            await updateDoc(ref, updateData);
            return { id, ...updateData };
        } catch (error) {
            console.error('Erro ao atualizar projeto:', error);
            throw error;
        }
    },

    /**
     * Deleta um projeto
     * ATENÇÃO: Não deleta os dados associados (clientes, tickets, etc)
     */
    async delete(id) {
        try {
            const ref = doc(db, 'projects', id);
            await deleteDoc(ref);
        } catch (error) {
            console.error('Erro ao deletar projeto:', error);
            throw error;
        }
    },

    /**
     * Listener em tempo real
     */
    listen(onData, onError) {
        const q = query(collection(db, 'projects'), orderBy('name', 'asc'));

        return onSnapshot(
            q,
            (snapshot) => {
                const projects = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                }));
                onData(projects);
            },
            onError
        );
    },

    /**
     * Conta quantos clientes um projeto tem
     */
    async getClientCount(projectId) {
        try {
            const q = query(
                collection(db, 'clients'),
                where('database', '==', projectId)
            );
            const snapshot = await getDocs(q);
            return snapshot.size;
        } catch (error) {
            console.error('Erro ao contar clientes:', error);
            return 0;
        }
    },

    /**
     * Inicializa projetos padrão (EGS e Era Verde)
     */
    async initializeDefaultProjects() {
        try {
            const existingProjects = await this.getAll();

            // Se já existem projetos, não inicializa
            if (existingProjects.length > 0) {
                console.log('Projetos já existem, pulando inicialização');
                return existingProjects;
            }

            console.log('Criando projetos padrão...');

            const egs = await this.create({
                name: 'EGS',
                description: 'Projeto EGS',
                active: true,
            });

            const eraVerde = await this.create({
                name: 'Era Verde',
                description: 'Projeto Era Verde',
                active: true,
            });

            console.log('Projetos padrão criados:', [egs, eraVerde]);
            return [egs, eraVerde];
        } catch (error) {
            console.error('Erro ao inicializar projetos padrão:', error);
            throw error;
        }
    },
};
