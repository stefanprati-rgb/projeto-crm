import {
  collection, onSnapshot, addDoc, setDoc, deleteDoc, doc,
  writeBatch
} from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

export class ClientService {
  constructor(db) {
    this.db = db;
    this.ref = collection(db, "clients");
    this.unsubscribe = null;
  }

  listen(onChange, onError) {
    if (this.unsubscribe) this.unsubscribe();
    this.unsubscribe = onSnapshot(
      this.ref,
      (snap) => {
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        onChange(data);
      },
      onError
    );
  }

  save(id, data) {
    if (id) {
      return setDoc(doc(this.db, "clients", id), data, { merge: true });
    }
    return addDoc(this.ref, data);
  }

  delete(id) {
    return deleteDoc(doc(this.db, "clients", id));
  }

  /**
   * (ESTA É A SUA NOVA LÓGICA ATUALIZADA)
   * Importa clientes em lote, verificando duplicatas pelo 'externalId' E pela instalação.
   * Se o 'externalId' + instalação já existir, atualiza o cliente.
   * Se não existir, cria um novo cliente.
   */
  async batchImport(rows, mapRowFn, existingClients, chunk = 400) {
    // 1. Cria um mapa composto: "externalId|instalacao" -> docId
    const clientMap = new Map();
    existingClients.forEach(c => {
      if (c.externalId) {
        // Cria chave única combinando externalId e instalação (se houver)
        const key = c.instalacao
          ? `${String(c.externalId).trim()}|${String(c.instalacao).trim()}`
          : String(c.externalId).trim();
        clientMap.set(key, c.id);
      }
    });
  
    // 2. Processa as linhas em lotes (chunks)
    for (let i = 0; i < rows.length; i += chunk) {
      const batch = writeBatch(this.db);
      rows.slice(i, i + chunk).forEach(row => {
        const clientData = mapRowFn(row);
        const externalId = clientData.externalId ? String(clientData.externalId).trim() : null;
              
        let ref;

        // 3. Cria chave única para verificação
        if (externalId) {
          const key = clientData.instalacao
            ? `${externalId}|${String(clientData.instalacao).trim()}`
            : externalId;
                  
          // 4. Verifica se o cliente já existe
          if (clientMap.has(key)) {
            // Se SIM, usa o ID do documento existente para ATUALIZAR
            const docId = clientMap.get(key);
            ref = doc(this.db, "clients", docId);
          } else {
            // Se NÃO, cria uma nova referência para ADICIONAR
            ref = doc(this.ref);
          }
        } else {
          // Sem externalId, sempre cria novo
          ref = doc(this.ref);
        }
              
        // 5. Usa set(..., { merge: true }) para criar ou atualizar
        batch.set(ref, clientData, { merge: true });
      });
          
      // 6. Envia o lote para o Firestore
      await batch.commit();
    }
  }
}

