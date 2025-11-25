import {
  collection,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  writeBatch
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export class ClientService {
  constructor(db) {
    this.db = db;
    this.collectionName = 'clients';
  }

  // Ouvir atualizações em tempo real
  listen(onData, onError) {
    // Ordena por nome para facilitar a leitura
    const q = query(collection(this.db, this.collectionName), orderBy('name'));

    return onSnapshot(q, (snapshot) => {
      const clients = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      onData(clients);
    }, onError);
  }

  // Adicionar/Salvar Cliente (com ID automático ou manual)
  async save(id, data) {
    const cleanData = this.removeUndefined(data);

    if (id) {
      // Atualizar existente
      const ref = doc(this.db, this.collectionName, id);
      await updateDoc(ref, cleanData);
    } else {
      // Criar novo
      cleanData.createdAt = new Date().toISOString();
      await addDoc(collection(this.db, this.collectionName), cleanData);
    }
  }

  // Excluir Cliente
  async delete(id) {
    const ref = doc(this.db, this.collectionName, id);
    await deleteDoc(ref);
  }

  // Importação em Lote (Batch)
  async batchImport(rows, mapFunction, existingClients, batchSize = 400) {
    // Nota: O mapFunction agora pode ser opcional se os dados já vierem formatados
    const chunks = [];
    const items = rows.map(r => mapFunction ? mapFunction(r) : r);

    // Identificar duplicatas por CPF/CNPJ ou ID Externo para atualizar em vez de criar duplicado
    // (Lógica simples de upsert baseada no ID se fornecido, ou create new)

    for (let i = 0; i < items.length; i += batchSize) {
      chunks.push(items.slice(i, i + batchSize));
    }

    let count = 0;
    for (const chunk of chunks) {
      const batch = writeBatch(this.db);

      chunk.forEach(item => {
        // Se o item já tem ID (do importador), usa ele como chave do documento
        if (item.id) {
          const ref = doc(this.db, this.collectionName, item.id);
          batch.set(ref, item, { merge: true });
        } else {
          // Se não tem ID, deixa o Firestore criar
          const ref = doc(collection(this.db, this.collectionName));
          batch.set(ref, item);
        }
      });

      await batch.commit();
      count++;
      console.log(`Lote de clientes ${count}/${chunks.length} processado.`);
    }
  }

  // Utilitário para limpar objetos antes de enviar ao Firebase
  removeUndefined(obj) {
    return Object.fromEntries(
      Object.entries(obj).filter(([_, v]) => v !== undefined && v !== null && v !== '')
    );
  }
}