import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    // Find A02 documents
    const docs = await prisma.document.findMany({
        where: { fileName: { contains: 'A02' } },
        include: { chunks: true }
    });

    console.log('=== A02 Documents ===');
    console.log('Found', docs.length, 'documents with A02');

    for (const doc of docs) {
        console.log(`\n--- ${doc.fileName} ---`);
        console.log('File ID:', doc.id.slice(0, 8));
        console.log('Type:', doc.fileType);
        console.log('Indexed:', doc.indexed);
        console.log('Chunks:', doc.chunks.length);

        if (doc.chunks.length > 0) {
            console.log('\nChunk contents:');
            doc.chunks.forEach((c, i) => {
                console.log(`  Chunk ${i + 1}:`, c.content.slice(0, 300));
            });
        } else {
            console.log('NO CHUNKS - Document not properly indexed!');
        }
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
