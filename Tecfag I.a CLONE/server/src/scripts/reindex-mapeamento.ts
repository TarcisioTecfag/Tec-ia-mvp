
import { PrismaClient } from '@prisma/client';
import { reindexDocument } from '../services/ai/documentProcessor';

const prisma = new PrismaClient();

async function reindexAllMapeamento() {
    try {
        const documents = await prisma.document.findMany({
            where: {
                fileName: {
                    contains: 'Mapeamento'
                }
            }
        });

        if (documents.length === 0) {
            console.log('No "Mapeamento" documents found to reindex.');
            return;
        }

        console.log(`Found ${documents.length} "Mapeamento" documents. Starting bulk reindex...`);

        for (const doc of documents) {
            console.log(`Reindexing: ${doc.fileName}...`);
            await reindexDocument(doc.id);
            console.log(`  - Triggered.`);
        }

        console.log('All reindex jobs started. Waiting 10 seconds for processing...');
        await new Promise(resolve => setTimeout(resolve, 10000));

        // Verify generic check
        const count = await prisma.document.count({
            where: {
                fileName: { contains: 'Mapeamento' },
                indexed: true
            }
        });
        console.log(`Finished. Total indexed "Mapeamento" docs: ${count}/${documents.length}`);

    } catch (error) {
        console.error('Error reindexing:', error);
    } finally {
        await prisma.$disconnect();
    }
}

reindexAllMapeamento();
