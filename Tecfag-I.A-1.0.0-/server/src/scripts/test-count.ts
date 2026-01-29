
import { analyzeQuery } from '../services/ai/queryAnalyzer';
import { multiQuerySearch } from '../services/ai/multiQueryRAG';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testCountQuery() {
    const question = "Quantas maquinas temos hoje no total?";
    console.log(`Testing query: "${question}"`);

    // 1. Analyze
    const analysis = analyzeQuery(question);
    console.log('\nAnalysis Result:');
    console.log(`- Type: ${analysis.type}`);
    console.log(`- Is Count Query: ${analysis.isCountQuery}`);
    console.log(`- Requires Full Scan: ${analysis.requiresFullScan}`);

    // 2. Perform Search
    if (analysis.needsMultiQuery) {
        const result = await multiQuerySearch(question, analysis);
        console.log('\nSearch Result:');
        console.log(`- Unique Documents: ${result.uniqueDocuments.length}`);
        console.log(`- Total Chunks Retrieved: ${result.chunks.length}`);
        console.log(`- Total Chunks Before Dedup/Limit: ${result.totalChunksBeforeDedup}`);

        // Log chunk distribution
        const dist: Record<string, number> = {};
        result.chunks.forEach(c => {
            const file = c.metadata?.fileName || 'unknown';
            dist[file] = (dist[file] || 0) + 1;
        });

        console.log('\nChunk Distribution by File:');
        Object.keys(dist).forEach(k => console.log(`- ${k}: ${dist[k]}`));
    }
}

testCountQuery()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
