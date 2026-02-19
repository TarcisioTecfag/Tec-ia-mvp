
import { multiQuerySearch } from '../services/ai/multiQueryRAG';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testRetrieval() {
    try {
        const query = "VSF 30S";
        console.log(`\n--- Testando MultiQuery Retrieval para query: "${query}" ---`);

        // Mock Analysis
        const mockAnalysis = {
            type: 'factual',
            contextSize: 10,
            needsMultiQuery: true,
            isCountQuery: false,
            suggestedQueries: [],
            categories: [], // Add missing required properties
            requiresFullScan: false
        };

        // Executar MultiQuery Search
        const result = await multiQuerySearch(query, mockAnalysis as any);

        console.log(`\nEncontrados ${result.chunks.length} chunks únicos.`);
        console.log('Queries executadas:', result.queryBreakdown.map(q => q.query));

        result.chunks.slice(0, 10).forEach((chunk, index) => {
            console.log(`\n[${index + 1}] Score: ${chunk.similarity.toFixed(4)} | Doc: ${chunk.metadata?.fileName}`);
            console.log(`Conteúdo: ${chunk.content.substring(0, 150).replace(/\n/g, ' ')}...`);
        });

    } catch (error) {
        console.error('Erro no teste:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testRetrieval();
