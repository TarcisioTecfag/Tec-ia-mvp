/**
 * Script para re-indexar todos os documentos após mudança no modelo de embeddings
 * Necessário após o desligamento do text-embedding-004 em 14/01/2026
 */
import { PrismaClient } from '@prisma/client';
import { generateEmbedding } from '../services/ai/embeddings';

const prisma = new PrismaClient();

async function reindexAllChunks() {
    console.log('=== Re-indexação de Embeddings ===\n');
    console.log('Motivo: Modelo text-embedding-004 foi descontinuado em 14/01/2026');
    console.log('Novo modelo: gemini-embedding-001 ou fallback hash-based\n');

    // Buscar todos os chunks
    const chunks = await prisma.documentChunk.findMany({
        select: { id: true, content: true }
    });

    console.log(`Total de chunks a processar: ${chunks.length}\n`);

    let success = 0;
    let errors = 0;

    // Processar em lotes de 5 para não sobrecarregar
    const batchSize = 5;

    for (let i = 0; i < chunks.length; i += batchSize) {
        const batch = chunks.slice(i, i + batchSize);
        const progress = Math.round(((i + batch.length) / chunks.length) * 100);

        console.log(`[${progress}%] Processando chunks ${i + 1} a ${i + batch.length}...`);

        const results = await Promise.allSettled(
            batch.map(async (chunk) => {
                try {
                    // Gerar novo embedding
                    const newEmbedding = await generateEmbedding(chunk.content);

                    // Atualizar no banco
                    await prisma.documentChunk.update({
                        where: { id: chunk.id },
                        data: { embedding: JSON.stringify(newEmbedding) }
                    });

                    return true;
                } catch (error: any) {
                    console.error(`  Erro no chunk ${chunk.id.slice(0, 8)}:`, error.message);
                    return false;
                }
            })
        );

        results.forEach((result) => {
            if (result.status === 'fulfilled' && result.value) {
                success++;
            } else {
                errors++;
            }
        });

        // Pequena pausa entre lotes
        await new Promise(resolve => setTimeout(resolve, 200));
    }

    console.log('\n=== Resultado ===');
    console.log(`✅ Sucesso: ${success} chunks`);
    console.log(`❌ Erros: ${errors} chunks`);
    console.log(`📊 Total: ${chunks.length} chunks`);

    // Limpar cache de embeddings antigo
    console.log('\n🗑️ Limpando cache de embeddings antigo...');
    const deletedCache = await prisma.embeddingCache.deleteMany();
    console.log(`Cache limpo: ${deletedCache.count} entradas removidas`);

    console.log('\n✅ Re-indexação concluída!');
}

reindexAllChunks()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
