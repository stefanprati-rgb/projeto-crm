import {
    collection,
    addDoc,
    updateDoc,
    doc,
    deleteDoc,
    query,
    orderBy,
    onSnapshot,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db, auth } from "../core/firebase.js";

export class TaskService {
    constructor() {
        // Tarefas são subcoleção: clients/{id}/tasks
    }

    /**
     * Cria uma nova tarefa para um cliente
     */
    async addTask(clientId, taskData) {
        if (!clientId) throw new Error("Client ID obrigatório");

        const user = auth.currentUser;
        const path = `clients/${clientId}/tasks`;

        const task = {
            title: taskData.title,
            description: taskData.description || '',
            dueDate: taskData.dueDate, // YYYY-MM-DD
            status: 'pending', // pending, done
            priority: taskData.priority || 'medium', // low, medium, high
            type: taskData.type || 'general',

            assignedTo: user ? user.uid : null,
            assignedToEmail: user ? user.email : 'Sistema',

            createdAt: new Date().toISOString(),
            timestamp: serverTimestamp()
        };

        return await addDoc(collection(db, path), task);
    }

    /**
     * Marca uma tarefa como concluída/pendente
     */
    async toggleStatus(clientId, taskId, currentStatus) {
        const path = `clients/${clientId}/tasks`;
        const newStatus = currentStatus === 'done' ? 'pending' : 'done';

        const ref = doc(db, path, taskId);
        await updateDoc(ref, {
            status: newStatus,
            completedAt: newStatus === 'done' ? new Date().toISOString() : null
        });
    }

    /**
     * Apaga uma tarefa
     */
    async deleteTask(clientId, taskId) {
        const path = `clients/${clientId}/tasks`;
        await deleteDoc(doc(db, path, taskId));
    }

    /**
     * Escuta as tarefas de um cliente específico em tempo real
     */
    listenToClientTasks(clientId, onData) {
        if (!clientId) return null;

        const path = `clients/${clientId}/tasks`;
        const q = query(collection(db, path), orderBy('status', 'desc'), orderBy('dueDate', 'asc'));

        return onSnapshot(q, (snapshot) => {
            const tasks = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            onData(tasks);
        });
    }
}