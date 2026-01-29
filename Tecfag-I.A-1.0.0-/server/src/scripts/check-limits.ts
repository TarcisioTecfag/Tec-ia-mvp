
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function countTotalChunks() {
    try {
        const totalChunks = await prisma.documentChunk.count();
        console.log(`Total Chunks in DB: ${totalChunks}`);

        const documents = await prisma.document.findMany({
            include: {
                _count: {
                    select: { chunks: true }
                }
            }
        });

        console.log(`Total Documents: ${documents.length}`);

        // Count just "Mapeamento" chunks (likely the inventory)
        const mapeamentoDocs = documents.filter(d => d.fileName.includes('Mapeamento'));
        const mapeamentoChunks = mapeamentoDocs.reduce((acc, doc) => acc + doc._count.chunks, 0);

        console.log(`Chunks in 'Mapeamento' files: ${mapeamentoChunks}`);

    } catch (error) {
        console.error('Error counting:', error);
    } finally {
        await prisma.$disconnect();
    }
}

countTotalChunks();
