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
import { db, auth } from './firebase';

/**
 * Serviço de Usinas (Plants)
 * Gerencia CRUD de usinas de geração distribuída
 */
export const plantService = {
    /**
     * Busca todas as usinas
     */
    async getAll() {
        const q = query(collection(db, 'plants'), orderBy('name', 'asc'));
        const snapshot = await getDocs(q);

        return snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));
    },

    /**
     * Busca uma usina por ID
     */
    async getById(id) {
        const docRef = doc(db, 'plants', id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() };
        }
        return null;
    },

    /**
     * Busca usina por nome
     */
    async getByName(name) {
        const q = query(collection(db, 'plants'), where('name', '==', name));
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
            const doc = snapshot.docs[0];
            return { id: doc.id, ...doc.data() };
        }
        return null;
    },

    /**
     * Cria uma nova usina
     */
    async create(plantData) {
        const user = auth.currentUser;

        const plant = {
            ...plantData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: user?.uid || null,
            createdByEmail: user?.email || 'Sistema',
        };

        const cleanData = this._removeUndefined(plant);
        const docRef = await addDoc(collection(db, 'plants'), cleanData);
        return { id: docRef.id, ...cleanData };
    },

    /**
     * Atualiza uma usina
     */
    async update(id, updates) {
        const ref = doc(db, 'plants', id);

        const updateData = {
            ...updates,
            updatedAt: new Date().toISOString(),
        };

        const cleanData = this._removeUndefined(updateData);
        await updateDoc(ref, cleanData);
        return { id, ...cleanData };
    },

    /**
     * Deleta uma usina
     */
    async delete(id) {
        const ref = doc(db, 'plants', id);
        await deleteDoc(ref);
    },

    /**
     * Listener em tempo real
     */
    listen(onData, onError) {
        const q = query(collection(db, 'plants'), orderBy('name', 'asc'));

        return onSnapshot(
            q,
            (snapshot) => {
                const plants = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                }));
                onData(plants);
            },
            onError
        );
    },

    /**
     * Busca ou cria usina por nome (útil para importação)
     */
    async findOrCreate(name, operator = 'EGS') {
        // Busca primeiro
        let plant = await this.getByName(name);

        // Se não existe, cria
        if (!plant) {
            plant = await this.create({
                name,
                operator,
                status: 'active',
            });
            console.log(`✅ Usina criada: ${name}`);
        }

        return plant;
    },

    /**
     * Remove campos undefined, null e vazios
     */
    _removeUndefined(obj) {
        return Object.fromEntries(
            Object.entries(obj).filter(([_, v]) => v !== undefined && v !== null && v !== '')
        );
    },
};
