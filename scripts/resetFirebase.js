import { collection, getDocs, writeBatch, doc } from 'firebase/firestore';
import { db } from '../services/firebase';

/**
 * Script para resetar o Firebase
 * Remove todos os dados das coleções principais
 * 
 * USO: node scripts/resetFirebase.js
 */

const COLLECTIONS_TO_RESET = [
    'clients',
    'tickets',
    'client_events',
    'plants',
    // Não resetar 'projects' - será gerenciado separadamente
];

async function deleteCollection(collectionName) {
    console.log(`\n🗑️  Deletando coleção: ${collectionName}`);

    try {
        const collectionRef = collection(db, collectionName);
        const snapshot = await getDocs(collectionRef);

        if (snapshot.empty) {
            console.log(`   ✓ Coleção ${collectionName} já está vazia`);
            return 0;
        }

        const batchSize = 500;
        const batches = [];
        let currentBatch = writeBatch(db);
        let operationCount = 0;
        let totalDeleted = 0;

        snapshot.docs.forEach((document) => {
            currentBatch.delete(document.ref);
            operationCount++;
            totalDeleted++;

            if (operationCount === batchSize) {
                batches.push(currentBatch);
                currentBatch = writeBatch(db);
                operationCount = 0;
            }
        });

        // Adicionar último batch se tiver operações
        if (operationCount > 0) {
            batches.push(currentBatch);
        }

        // Executar todos os batches
        console.log(`   Executando ${batches.length} batch(es)...`);
        for (let i = 0; i < batches.length; i++) {
            await batches[i].commit();
            console.log(`   ✓ Batch ${i + 1}/${batches.length} concluído`);
        }

        console.log(`   ✅ ${totalDeleted} documentos deletados de ${collectionName}`);
        return totalDeleted;
    } catch (error) {
        console.error(`   ❌ Erro ao deletar ${collectionName}:`, error);
        throw error;
    }
}

async function resetFirebase() {
    console.log('🔥 INICIANDO RESET DO FIREBASE');
    console.log('⚠️  ATENÇÃO: Esta operação irá deletar TODOS os dados!');
    console.log('');

    const startTime = Date.now();
    let totalDeleted = 0;

    try {
        for (const collectionName of COLLECTIONS_TO_RESET) {
            const deleted = await deleteCollection(collectionName);
            totalDeleted += deleted;
        }

        const duration = ((Date.now() - startTime) / 1000).toFixed(2);

        console.log('\n✅ RESET CONCLUÍDO COM SUCESSO!');
        console.log(`   Total de documentos deletados: ${totalDeleted}`);
        console.log(`   Tempo total: ${duration}s`);
        console.log('');
        console.log('📝 Próximos passos:');
        console.log('   1. Inicializar projetos padrão (EGS e Era Verde)');
        console.log('   2. Reimportar dados com campo "database" correto');

    } catch (error) {
        console.error('\n❌ ERRO DURANTE O RESET:', error);
        process.exit(1);
    }
}

// Executar se for chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
    resetFirebase()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
}

export { resetFirebase, deleteCollection };
