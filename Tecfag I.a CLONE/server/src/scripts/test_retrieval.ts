
import { searchByKeyword, searchSimilarChunks } from '../services/ai/vectorDB';
import { generateEmbedding } from '../services/ai/embeddings';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const folderId = undefined; // Simulate global search
    const query = 'Qual a realidade da importação direta?';

    console.log(`Testing retrieval with GLOBAL context (catalogId=undefined)`);
    console.log(`Query: "${query}"`);

    // Test 1: Keyword Search
    console.log('\n--- 1. Testing Keyword Search ---');
    const keywordResults = await searchByKeyword(query, 5, { catalogId: folderId });
    console.log(`Found ${keywordResults.length} chunks.`);
    keywordResults.forEach(r => {
        console.log(`   - [${r.similarity}] ${r.content.substring(0, 50)}... (DocID: ${r.documentId})`);
    });

    if (keywordResults.length > 0) {
        console.log('✅ Keyword Search passed!');
    } else {
        console.log('❌ Keyword Search failed.');
    }

    // Test 2: Semantic Search
    console.log('\n--- 2. Testing Semantic Search ---');
    try {
        const embedding = await generateEmbedding(query);
        const semanticResults = await searchSimilarChunks(embedding, 5, { catalogId: folderId });

        console.log(`Found ${semanticResults.length} chunks.`);
        semanticResults.forEach(r => {
            console.log(`   - [${r.similarity.toFixed(4)}] ${r.content.substring(0, 50)}... (DocID: ${r.documentId})`);
        });

        if (semanticResults.length > 0) {
            console.log('✅ Semantic Search passed!');
        } else {
            console.log('❌ Semantic Search failed.');
        }

    } catch (e) {
        console.log(`⚠️ Skipping semantic search test due to API/Embedding error: ${e}`);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
