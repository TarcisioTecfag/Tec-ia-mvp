
import { PrismaClient } from '@prisma/client';
import { reindexDocument } from '../services/ai/documentProcessor';

const prisma = new PrismaClient();

async function reindexSpecificDocument() {
    try {
        const documents = await prisma.document.findMany({
            where: {
                fileName: {
                    contains: 'Alimentadores Parafuso'
                }
            }
        });

        if (documents.length === 0) {
            console.log('No document found to reindex.');
            return;
        }

        const doc = documents[0];
        console.log(`Reindexing Document: ${doc.fileName} (${doc.id})`);

        await reindexDocument(doc.id);

        console.log('Reindexing triggered. Waiting a few seconds for processing...');

        // Wait for a bit (processing is async but fast for small files)
        await new Promise(resolve => setTimeout(resolve, 5000));

        // Check verification
        const updatedDoc = await prisma.document.findUnique({ where: { id: doc.id } });
        console.log(`Updated Status: Indexed=${updatedDoc?.indexed}, Progress=${updatedDoc?.processingProgress}`);

    } catch (error) {
        console.error('Error reindexing:', error);
    } finally {
        await prisma.$disconnect();
    }
}

reindexSpecificDocument();
