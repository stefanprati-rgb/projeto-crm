import {
  collection,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  writeBatch
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export class ClientService {
  constructor(db) {
    this.db = db;
    this.collectionName = 'clients';
  }

  // Ouvir atualizações em tempo real, filtradas pela base selecionada
  listen(baseFilter, onData, onError) {
    let q;

    if (baseFilter) {
      // Filtra apenas clientes da base selecionada (ex: 'EGS')
      // Nota: Se o Firestore reclamar de falta de índice composto (where + orderBy), 
      // clique no link fornecido no console do navegador para criá-lo.
      // Se o índice não existir, a query falhará.
      try {
        q = query(
          collection(this.db, this.collectionName),
          where('database', '==', baseFilter),
          orderBy('name')
        );
      } catch (e) {
        // Fallback: Se der erro de índice, tenta sem orderBy e ordena no cliente
        console.warn("Tentando query sem ordenação (possível falta de índice).");
        q = query(
          collection(this.db, this.collectionName),
          where('database', '==', baseFilter)
        );
      }
    } else {
      // Se não houver filtro (ex: admin vê tudo), traz tudo ordenado
      q = query(collection(this.db, this.collectionName), orderBy('name'));
    }

    return onSnapshot(q, (snapshot) => {
      const clients = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Ordenação manual no cliente caso a query tenha sido simplificada
      if (baseFilter && !q._query.orderBy) { // Verificação simplificada
        clients.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      }

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
    const items = rows.map(r => mapFunction ? mapFunction(r) : r);
    const chunks = [];

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