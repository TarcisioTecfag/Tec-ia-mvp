import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkCompiladoChunks() {
    const doc = await prisma.document.findFirst({
        where: { fileName: { contains: 'Compilado' } }
    });

    if (!doc) {
        console.log('Document not found');
        return;
    }

    const count = await prisma.documentChunk.count({
        where: { documentId: doc.id }
    });

    console.log(`Document: ${doc.fileName}`);
    console.log(`ID: ${doc.id}`);
    console.log(`Total Chunks in DB: ${count}`);

    // Expected chunks
    // Assuming ~1000 chars per chunk (default in many splitters)
    // File size 167795 chars
    console.log(`Estimated Chunks needed: ~${Math.ceil(167795 / 1000)}`);
}

checkCompiladoChunks()
    .then(() => prisma.$disconnect())
    .catch(e => { console.error(e); prisma.$disconnect(); });
