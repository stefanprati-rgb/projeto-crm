import {
  collection,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs,
  writeBatch
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export class ClientService {
  constructor(db) {
    this.db = db;
    this.collectionName = 'clients';
  }

  // --- PAGINAÇÃO REAL ---
  // Busca apenas uma fatia dos dados (ex: 10 clientes)
  // Retorna: { data: [...], lastDoc: object (para pedir a próxima pág), hasMore: boolean }
  async getPage(baseFilter, pageSize, lastDoc = null) {
    let q;

    // Query base: Filtra por base + Ordena por nome + Limite
    const constraints = [
      where('database', '==', baseFilter),
      orderBy('name'),
      limit(pageSize)
    ];

    // Se tivermos um cursor (último doc da página anterior), começamos depois dele
    if (lastDoc) {
      constraints.push(startAfter(lastDoc));
    }

    try {
      q = query(collection(this.db, this.collectionName), ...constraints);
    } catch (e) {
      console.warn("Índice de ordenação em falta. A usar fallback (ordem de criação).");
      // Fallback: Se o índice composto (database + name) não existir, busca sem ordenar por nome
      const simpleConstraints = [
        where('database', '==', baseFilter),
        limit(pageSize)
      ];
      if (lastDoc) simpleConstraints.push(startAfter(lastDoc));
      q = query(collection(this.db, this.collectionName), ...simpleConstraints);
    }

    const snapshot = await getDocs(q);

    return {
      data: snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })),
      lastDoc: snapshot.docs[snapshot.docs.length - 1] || null, // O cursor para a próxima chamada
      hasMore: snapshot.docs.length === pageSize // Se veio menos que o limite, acabou
    };
  }

  // --- DADOS PARA DASHBOARD ---
  // Busca todos os dados APENAS para cálculo de KPIs (separado da tabela)
  // No futuro, isto pode ser otimizado com 'Count' ou agregações no servidor
  async getAllForDashboard(baseFilter) {
    const q = query(
      collection(this.db, this.collectionName),
      where('database', '==', baseFilter)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  // --- OPERAÇÕES CRUD (Mantidas) ---

  async save(id, data) {
    const cleanData = this.removeUndefined(data);

    if (id) {
      const ref = doc(this.db, this.collectionName, id);
      await updateDoc(ref, cleanData);
    } else {
      cleanData.createdAt = new Date().toISOString();
      await addDoc(collection(this.db, this.collectionName), cleanData);
    }
  }

  async delete(id) {
    const ref = doc(this.db, this.collectionName, id);
    await deleteDoc(ref);
  }

  // Importação em Lote (Otimizada)
  async batchImport(rows, mapFunction, existingClients, batchSize = 400) {
    const items = rows.map(r => mapFunction ? mapFunction(r) : r);
    const chunks = [];

    for (let i = 0; i < items.length; i += batchSize) {
      chunks.push(items.slice(i, i + batchSize));
    }

    let count = 0;
    for (const chunk of chunks) {
      const batch = writeBatch(this.db);

      chunk.forEach(item => {
        if (item.id) {
          const ref = doc(this.db, this.collectionName, item.id);
          batch.set(ref, item, { merge: true });
        } else {
          const ref = doc(collection(this.db, this.collectionName));
          batch.set(ref, item);
        }
      });

      await batch.commit();
      count++;
      console.log(`Lote ${count}/${chunks.length} processado.`);
    }
  }

  removeUndefined(obj) {
    return Object.fromEntries(
      Object.entries(obj).filter(([_, v]) => v !== undefined && v !== null && v !== '')
    );
  }
}