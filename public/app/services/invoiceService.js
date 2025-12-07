import {
  collection,
  doc,
  writeBatch,
  onSnapshot,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export class InvoiceService {
  constructor(db) {
    this.db = db;
    this.collectionName = 'invoices';
  }

  listen(onData, onError) {
    // Traz as faturas, idealmente ordenadas por data
    const q = query(collection(this.db, this.collectionName));

    return onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      onData(items);
    }, onError);
  }

  async batchImport(rows, batchSize = 400) {
    const chunks = [];
    for (let i = 0; i < rows.length; i += batchSize) {
      chunks.push(rows.slice(i, i + batchSize));
    }

    let count = 0;
    for (const chunk of chunks) {
      const batch = writeBatch(this.db);
      chunk.forEach(item => {
        // Usa o ID gerado na leitura do Excel como chave única
        if (item.id) {
          const ref = doc(this.db, this.collectionName, item.id);
          batch.set(ref, item, { merge: true });
        }
      });
      await batch.commit();
      count++;
      console.log(`Lote financeiro ${count}/${chunks.length} processado.`);
    }
  }
}