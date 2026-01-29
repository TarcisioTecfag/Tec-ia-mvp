
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function inspectCompiladoChunks() {
    try {
        const docId = 'faad6ce6-d6d4-4304-8282-e109af7f89bc';

        console.log(`Inspecting chunks for document ID: ${docId}`);

        const chunks = await prisma.documentChunk.findMany({
            where: { documentId: docId },
            orderBy: { chunkIndex: 'asc' },
            take: 3 // Inspect first 3 chunks to check format
        });

        chunks.forEach((chunk, index) => {
            console.log(`\n--- Chunk ${index + 1} ---`);
            console.log(chunk.content.substring(0, 500) + '...'); // Print first 500 chars
            console.log('-------------------');
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

inspectCompiladoChunks();
