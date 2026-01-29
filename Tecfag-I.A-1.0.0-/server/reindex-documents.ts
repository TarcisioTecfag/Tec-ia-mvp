/**
 * Script de Reindexação de Documentos
 * 
 * Este script força a reindexação de TODOS os documentos usando
 * o novo chunking product-aware para melhorar a qualidade do RAG.
 * 
 * Uso: npx tsx reindex-documents.ts
 */

import { PrismaClient } from '@prisma/client';
import { reindexDocument } from './src/services/ai/documentProcessor';

const prisma = new PrismaClient();

async function reindexAllDocuments() {
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║   REINDEXAÇÃO COMPLETA - NotebookLM-Level Improvements       ║');
    console.log('╚══════════════════════════════════════════════════════════════╝');
    console.log('');
    console.log('Este processo irá reindexar TODOS os documentos com:');
    console.log('  • Chunking product-aware (3000 chars)');
    console.log('  • Overlap de 500 chars');
    console.log('  • Preservação de máquinas/produtos como unidades');
    console.log('');

    try {
        // Buscar todos os documentos
        const documents = await prisma.document.findMany({
            select: {
                id: true,
                fileName: true,
                indexed: true,
                chunkCount: true
            }
        });

        console.log(`📚 Encontrados ${documents.length} documentos para reindexar`);
        console.log('');

        let successCount = 0;
        let errorCount = 0;

        for (let i = 0; i < documents.length; i++) {
            const doc = documents[i];
            console.log(`[${i + 1}/${documents.length}] Processando: ${doc.fileName}`);

            try {
                await reindexDocument(doc.id);

                // Buscar contagem atualizada
                const updated = await prisma.document.findUnique({
                    where: { id: doc.id },
                    select: { chunkCount: true }
                });

                console.log(`   ✅ Sucesso - Chunks: ${doc.chunkCount || 0} → ${updated?.chunkCount || 0}`);
                successCount++;
            } catch (error: any) {
                console.log(`   ❌ Erro: ${error.message}`);
                errorCount++;
            }
        }

        console.log('');
        console.log('╔══════════════════════════════════════════════════════════════╗');
        console.log('║                      RESUMO                                   ║');
        console.log('╚══════════════════════════════════════════════════════════════╝');
        console.log(`  ✅ Sucesso: ${successCount} documentos`);
        console.log(`  ❌ Erros:   ${errorCount} documentos`);
        console.log('');

        if (successCount > 0) {
            console.log('🎉 Reindexação concluída! Os documentos agora usam chunking product-aware.');
            console.log('   Reinicie o servidor e teste com perguntas de recomendação.');
        }

    } catch (error: any) {
        console.error('❌ Erro fatal:', error.message);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

// Executar
reindexAllDocuments();
