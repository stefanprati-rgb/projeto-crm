import {
  collection, onSnapshot, addDoc, setDoc, deleteDoc, doc, query, orderBy, writeBatch
} from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

export class InvoiceService {
  constructor(db) {
    this.db = db;
    this.ref = collection(db, "invoices"); // coleção: invoices
    this.unsubscribe = null;
  }

  // Ouve todas as faturas (ordenadas por REF)
  listen(onChange, onError) {
    if (this.unsubscribe) this.unsubscribe();
    const q = query(this.ref, orderBy("ref", "asc"));
    this.unsubscribe = onSnapshot(
      q,
      (snap) => {
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        onChange(data);
      },
      onError
    );
    return this.unsubscribe;
  }

  save(id, data) {
    if (id) return setDoc(doc(this.db, "invoices", id), data, { merge: true });
    return addDoc(this.ref, data);
  }

  delete(id) {
    return deleteDoc(doc(this.db, "invoices", id));
  }

  // Importa em lote (linhas pré-processadas)
  async batchImport(rows, chunk = 400) {
    for (let i = 0; i < rows.length; i += chunk) {
      const batch = writeBatch(this.db);
      rows.slice(i, i + chunk).forEach((row) => {
        const ref = row.id ? doc(this.db, "invoices", row.id) : doc(this.ref);
        batch.set(ref, row, { merge: true });
      });
      await batch.commit();
    }
  }
}
