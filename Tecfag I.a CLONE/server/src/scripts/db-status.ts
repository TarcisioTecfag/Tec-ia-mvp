import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('=== Database Status ===\n');

    // Count documents
    const docs = await prisma.document.findMany({
        select: { id: true, fileName: true, fileType: true, indexed: true, processingError: true }
    });
    console.log('Total documents:', docs.length);
    console.log('\nDocument list:');
    docs.forEach((d, i) => {
        const status = d.indexed ? 'INDEXED' : (d.processingError ? 'ERROR' : 'PENDING');
        console.log(`  ${i + 1}. [${status}] ${d.fileName} (${d.fileType})`);
        if (d.processingError) {
            console.log(`      Error: ${d.processingError.slice(0, 100)}...`);
        }
    });

    // Count chunks
    const chunks = await prisma.documentChunk.count();
    console.log('\n=== Chunks ===');
    console.log('Total document chunks indexed:', chunks);

    // Count chunks by document
    const chunksByDoc = await prisma.documentChunk.groupBy({
        by: ['documentId'],
        _count: true
    });
    console.log('Documents with chunks:', chunksByDoc.length);

    // Sample chunks
    if (chunks > 0) {
        const sampleChunks = await prisma.documentChunk.findMany({
            take: 3,
            select: { id: true, content: true }
        });
        console.log('\nSample chunk contents:');
        sampleChunks.forEach((c, i) => {
            console.log(`  ${i + 1}. ${c.content.slice(0, 150)}...`);
        });
    }

    // Check for A02 content
    const a02Chunks = await prisma.documentChunk.findMany({
        where: {
            content: { contains: 'A02' }
        },
        take: 5
    });
    console.log('\n=== A02 Content ===');
    console.log('Chunks containing "A02":', a02Chunks.length);
    if (a02Chunks.length > 0) {
        a02Chunks.forEach((c, i) => {
            console.log(`  ${i + 1}. ${c.content.slice(0, 200)}...`);
        });
    } else {
        console.log('No text content found about A02!');
    }

    // Check embedding cache
    const embeddingCount = await prisma.embeddingCache.count();
    console.log('\n=== Cache ===');
    console.log('Embedding cache entries:', embeddingCount);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
