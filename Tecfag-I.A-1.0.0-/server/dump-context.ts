import { PrismaClient } from '@prisma/client';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getRelevantChunks } from './src/services/ai/multiQueryRAG';
import { generateEmbedding } from './src/services/ai/embeddings';
import fs from 'fs';

const prisma = new PrismaClient();

async function dumpContext() {
    console.log('🔍 Simulating Chat Request to dump Context...');

    const query = "Quantas máquinas temos ao todo na lista 'Compilado'?";

    // 1. Generate Query Embedding
    const queryEmbedding = await generateEmbedding(query);

    // 2. Retrieve Chunks (simulating chatService logic)
    const retrieval = await getRelevantChunks(query, queryEmbedding, 50); // Request 50 chunks (should cover whole file)

    console.log(`\n📦 Retrieved ${retrieval.chunks.length} chunks.`);

    // 3. Construct Context String
    const contextString = retrieval.chunks.map(c => c.content).join('\n\n');

    // 4. Save to file for analysis
    const outputPath = 'debug-context-dump.txt';
    fs.writeFileSync(outputPath, contextString);

    console.log(`✅ Context dumped to ${outputPath}`);
    console.log(`📄 Total Characters: ${contextString.length}`);

    // 5. Analyze Content
    const lines = contextString.split('\n');
    let validMachineLines = 0;
    for (const line of lines) {
        if (/[A-Z0-9-]{3,}/.test(line) && line.length < 100) {
            validMachineLines++;
        }
    }
    console.log(`🤖 Heuristic Item Count in Context: ~${validMachineLines}`);

    // 6. Check for specific known missing items (if user provided examples, but I'll check for general sampling)
    console.log('--- Head of Context ---');
    console.log(contextString.substring(0, 500));
}

dumpContext()
    .then(() => prisma.$disconnect())
    .catch(e => { console.error(e); prisma.$disconnect(); });
