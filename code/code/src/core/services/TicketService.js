import { collection, addDoc, updateDoc, deleteDoc, doc, query, where, orderBy, onSnapshot, serverTimestamp, limit } from "firebase/firestore";
import { db } from "../config/firebase.js";

const COLLECTION = "tickets";

export const TicketService = {
  async createTicket(ticketData) {
    const docRef = await addDoc(collection(db, COLLECTION), {
      ...ticketData,
      status: ticketData.status || 'aberto',
      dataCriacao: serverTimestamp(),
      dataAtualizacao: serverTimestamp(),
      dataFechamento: null
    });
    await this.addTimelineEntry(docRef.id, {
      tipo: 'criacao',
      mensagem: 'Ticket criado',
      autor: ticketData.responsavel || 'Sistema'
    });
    return docRef.id;
  },

  async updateTicket(id, newData, oldData = null) {
    const updatePayload = { ...newData, dataAtualizacao: serverTimestamp() };
    if (newData.status === 'fechado' && oldData?.status !== 'fechado') {
      updatePayload.dataFechamento = serverTimestamp();
    }
    await updateDoc(doc(db, COLLECTION, id), updatePayload);
    if (oldData && newData.status && newData.status !== oldData.status) {
      await this.addTimelineEntry(id, {
        tipo: 'status',
        mensagem: `Status alterado: ${oldData.status} -> ${newData.status}`,
        autor: newData.responsavel || 'Sistema'
      });
    }
    return true;
  },

  async deleteTicket(id) {
    return await deleteDoc(doc(db, COLLECTION, id));
  },

  async addTimelineEntry(ticketId, entryData) {
    return await addDoc(collection(db, COLLECTION, ticketId, 'timeline'), {
      ...entryData,
      data: serverTimestamp()
    });
  },

  subscribeToTimeline(ticketId, callback) {
    const q = query(collection(db, COLLECTION, ticketId, 'timeline'), orderBy('data', 'desc'));
    return onSnapshot(q, (snapshot) => {
      callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
  },

  subscribeToTickets(filters = {}, callback) {
    let constraints = [orderBy('dataCriacao', 'desc'), limit(50)];
    if (filters.status) constraints.push(where('status', '==', filters.status));
    if (filters.clientId) constraints.push(where('clientId', '==', filters.clientId));
    if (filters.prioridade) constraints.push(where('prioridade', '==', filters.prioridade));
    return onSnapshot(query(collection(db, COLLECTION), ...constraints), (snapshot) => {
      callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
  }
};
