import admin from 'firebase-admin';
import XLSX from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';

// Configuração para ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Script de Histórico (Analytics) - Estratégia Lean
 * Este script lê o Excel completo e faz um dump na coleção historico_rateios.
 * Regra de Ouro: NÃO interage com a coleção 'instalacoes' (não mexe no pipelineStatus).
 */

if (!admin.apps.length) {
    admin.initializeApp();
}

const db = admin.firestore();

// Helper para Mapear Status (Padrão V2)
const mapStatus = (str) => {
    if (!str) return 'pendente_correcao';
    const s = String(str).toLowerCase();
    if (s.includes("aprov")) return 'aprovado_aguardando_injecao';
    if (s.includes("reprov") || s.includes("recusa") || s.includes("rejeit")) return 'reprovado';
    if (s.includes("injet")) return 'injetado';
    if (s.includes("enviad")) return 'enviado_concessionaria';
    return 'pendente_correcao';
};

// Helper para Competência (Data Excel para MM/YYYY)
const getCompetencia = (date) => {
    if (!date) return null;
    let d = date;
    if (typeof date === 'number') {
        // Data Excel (número serial)
        d = new Date((date - 25569) * 86400 * 1000);
    } else if (!(d instanceof Date)) {
        d = new Date(date);
    }
    if (isNaN(d.getTime())) return null;
    return `${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
};

async function importarHistoricoMorto(filePath) {
    console.log(`\n🚀 Iniciando Importação de Histórico Morto: ${filePath}`);

    // 1. Ler Arquivo
    try {
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames.includes('Main') ? 'Main' : workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet);

        console.log(`📊 Linhas detectadas: ${jsonData.length}`);

        const results = { success: 0, error: 0, skipped: 0 };
        const ucCache = new Map(); // Cache local para evitar queries redundantes

        // 2. Processar em Lotes (Firestore Batch limit 500)
        const CHUNK_SIZE = 400;
        for (let i = 0; i < jsonData.length; i += CHUNK_SIZE) {
            const chunk = jsonData.slice(i, i + CHUNK_SIZE);
            const batch = db.batch();

            for (const row of chunk) {
                try {
                    // Colunas mapeadas conforme padrão Raízen
                    const uc = String(row['Instalação Padrão ANEEL'] || row['No. Instalação antiga'] || '').trim();
                    const statusStr = row['Status'];
                    const dataEnvioRaw = row['Data de envio'];

                    if (!uc || !statusStr) {
                        results.skipped++;
                        continue;
                    }

                    // Resolver ClientId e Database via Cache ou Query
                    let clientInfo = ucCache.get(uc);
                    if (!clientInfo) {
                        // Tenta localizar o cliente nas coleções legadas
                        const snap = await db.collection("clients").where("installations", "array-contains", uc).limit(1).get();
                        if (snap.empty) {
                            const snap2 = await db.collection("clients").where("installationId", "==", uc).limit(1).get();
                            if (!snap2.empty) {
                                clientInfo = { id: snap2.docs[0].id, db: snap2.docs[0].data().database || 'Raízen' };
                            }
                        } else {
                            clientInfo = { id: snap.docs[0].id, db: snap.docs[0].data().database || 'Raízen' };
                        }

                        if (clientInfo) ucCache.set(uc, clientInfo);
                    }

                    if (!clientInfo) {
                        results.error++;
                        continue;
                    }

                    const competencia = getCompetencia(dataEnvioRaw) || getCompetencia(new Date());
                    const mappedStatus = mapStatus(statusStr);

                    // Gerar ID seguro para o log de histórico
                    // Unimos UC + Competencia + Index para garantir que não sobrescrevemos logs do mesmo mês no Excel completo
                    const compSafe = competencia.replace(/\//g, "");
                    const rowIndex = i + chunk.indexOf(row);
                    const rateioLogId = `HIST_${clientInfo.id}_${uc}_${compSafe}_${rowIndex}`;

                    const rateioRef = db.collection("historico_rateios").doc(rateioLogId);

                    batch.set(rateioRef, {
                        instalacaoId: `${clientInfo.id}_inst_${uc}`,
                        clienteId: clientInfo.id,
                        usinaId: row['Nome Usina'] || "Desconhecida",
                        consorcio: "Padrão",
                        database: clientInfo.db,
                        competencia: competencia,
                        percentual: Number(row['Percentual Rateio'] || 0),
                        status: mappedStatus,
                        processedBy: "Migration Script (Lean)",
                        createdAt: admin.firestore.FieldValue.serverTimestamp(),
                        migrationMetadata: {
                            originalStatus: statusStr,
                            originalDataEnvio: dataEnvioRaw,
                            importDate: new Date().toISOString()
                        }
                    });

                    results.success++;
                } catch (err) {
                    console.error(`❌ Erro persistindo linha ${i + chunk.indexOf(row)}:`, err.message);
                    results.error++;
                }
            }

            await batch.commit();
            console.log(`✅ Bloco ${Math.floor(i / CHUNK_SIZE) + 1} concluído. (${Math.min(i + CHUNK_SIZE, jsonData.length)}/${jsonData.length})`);
        }

        console.log("\n--- RESULTADO FINAL ---");
        console.log(`✅ Sucesso: ${results.success}`);
        console.log(`❌ Erro (UC não encontrada): ${results.error}`);
        console.log(`⚠️ Ignorados (Dados incompletos): ${results.skipped}`);

    } catch (error) {
        console.error("⛔ Falha crítica no script:", error);
    }
}

// Execução (Caminho absoluto ou relativo à raiz do projeto)
const targetPath = path.join(__dirname, '../data/imports/Controle_Rateio_Raizen.xlsx');
importarHistoricoMorto(targetPath).catch(console.error);
