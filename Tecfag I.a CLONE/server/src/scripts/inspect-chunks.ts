
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function inspectDocumentParams() {
    try {
        const documents = await prisma.document.findMany({
            where: {
                fileName: {
                    contains: 'Alimentadores Parafuso'
                }
            }
        });

        if (documents.length === 0) {
            console.log('No document found.');
            return;
        }

        const doc = documents[0];
        console.log(`Inspecting Document: ${doc.fileName} (${doc.id})`);

        const chunks = await prisma.documentChunk.findMany({
            where: { documentId: doc.id }
        });

        console.log(`Found ${chunks.length} chunks.`);

        chunks.forEach((chunk, index) => {
            console.log(`\n--- Chunk ${index + 1} ---`);
            console.log(chunk.content);
            console.log('-------------------');
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

inspectDocumentParams();
