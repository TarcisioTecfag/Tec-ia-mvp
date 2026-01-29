import { PrismaClient } from '@prisma/client';
import { reindexDocument } from './src/services/ai/documentProcessor';

const prisma = new PrismaClient();

async function runReindexing() {
    console.log('🔄 Finding "Compilado" document...');
    const doc = await prisma.document.findFirst({
        where: { fileName: { contains: 'Compilado' } }
    });

    if (!doc) {
        console.error('❌ Document not found!');
        return;
    }

    console.log(`✅ Found: ${doc.fileName} (ID: ${doc.id})`);
    console.log('🚀 Starting Re-indexing...');

    try {
        await reindexDocument(doc.id);
        console.log('✅ Re-indexing complete!');

        // Verify new count
        const count = await prisma.documentChunk.count({
            where: { documentId: doc.id }
        });
        console.log(`📊 New Chunk Count: ${count}`);

    } catch (error) {
        console.error('❌ Re-indexing failed:', error);
    }
}

runReindexing()
    .then(() => prisma.$disconnect())
    .catch(e => { console.error(e); prisma.$disconnect(); });
