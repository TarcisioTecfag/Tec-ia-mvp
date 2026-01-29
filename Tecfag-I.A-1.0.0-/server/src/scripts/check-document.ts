
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDocument() {
    try {
        const documents = await prisma.document.findMany({
            where: {
                fileName: {
                    contains: 'Alimentadores Parafuso'
                }
            }
        });

        console.log(`Found ${documents.length} documents matching 'Alimentadores Parafuso':`);
        documents.forEach(doc => {
            console.log(`- ID: ${doc.id}`);
            console.log(`  FileName: ${doc.fileName}`);
            console.log(`  FilePath: ${doc.filePath}`);
            console.log(`  Indexed: ${doc.indexed}`);
            console.log(`  ProcessingProgress: ${doc.processingProgress}`);
            console.log(`  Error: ${doc.processingError}`);
            console.log(`  Chunks: ${doc.chunkCount}`);
            console.log(`  IsActive: ${doc.isActive}`);
        });

        // Also check if we have chunks
        for (const doc of documents) {
            const chunkCount = await prisma.documentChunk.count({
                where: { documentId: doc.id }
            });
            console.log(`  Actual Chunks in DB: ${chunkCount}`);
        }

    } catch (error) {
        console.error('Error checking document:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkDocument();
