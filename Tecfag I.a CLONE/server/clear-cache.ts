/**
 * Script para limpar cache do RAG
 * Execute com: npx tsx clear-cache.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearCache() {
    console.log('🗑️ Limpando cache do RAG...');

    try {
        const queryResult = await prisma.queryCache.deleteMany();
        console.log(`✅ ${queryResult.count} entradas de QueryCache removidas`);

        const embeddingResult = await prisma.embeddingCache.deleteMany();
        console.log(`✅ ${embeddingResult.count} entradas de EmbeddingCache removidas`);

        console.log('\n✅ Cache limpo com sucesso!');
    } catch (error) {
        console.error('❌ Erro ao limpar cache:', error);
    } finally {
        await prisma.$disconnect();
    }
}

clearCache();
