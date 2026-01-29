import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

async function dumpChunks() {
    console.log('🔍 Dumping chunks from DB for Compilado...');

    const doc = await prisma.document.findFirst({
        where: { fileName: { contains: 'Compilado' } }
    });

    if (!doc) {
        console.error('❌ Document not found');
        return;
    }

    const chunks = await prisma.documentChunk.findMany({
        where: { documentId: doc.id },
        orderBy: { chunkIndex: 'asc' }
    });

    console.log(`✅ Found ${chunks.length} chunks.`);

    let fullText = '';
    for (const chunk of chunks) {
        fullText += chunk.content + '\n\n';
    }

    const outputPath = 'debug-chunks-dump.txt';
    fs.writeFileSync(outputPath, fullText);

    console.log(`📄 Total Characters: ${fullText.length}`);

    // Heuristic Count
    let machineCount = 0;
    const lines = fullText.split('\n');
    for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.length > 5 && /[A-Z0-9-]{3,}/.test(trimmed) &&
            !trimmed.includes('caminho_arquivo') &&
            !trimmed.includes('dados') &&
            !trimmed.includes('NaN')) {
            machineCount++;
        }
    }
    console.log(`🤖 Heuristic Item Count in Chunks: ~${machineCount}`);
}

dumpChunks()
    .then(() => prisma.$disconnect())
    .catch(e => { console.error(e); prisma.$disconnect(); });
