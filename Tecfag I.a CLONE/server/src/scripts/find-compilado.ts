
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function findCompilado() {
    try {
        const documents = await prisma.document.findMany({
            where: {
                fileName: {
                    contains: 'Compilado'
                }
            }
        });

        console.log(`Found ${documents.length} documents matching 'Compilado':`);
        documents.forEach(doc => {
            console.log(`- ID: ${doc.id}`);
            console.log(`  FileName: ${doc.fileName}`);
            console.log(`  FilePath: ${doc.filePath}`);
            console.log(`  Chunks: ${doc.chunkCount}`);
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

findCompilado();
