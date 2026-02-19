
import { PrismaClient } from '@prisma/client';
import { searchSimilarChunks } from '../services/ai/vectorDB';
import { generateEmbedding } from '../services/ai/embeddings';
import dotenv from 'dotenv';
import path from 'path';

// Setup environment
dotenv.config({ path: path.join(process.cwd(), '.env') });

const prisma = new PrismaClient();

async function main() {
    const query = "Qual a realidade da importação direta?";
    console.log("Testing retrieval for:", query);

    try {
        // 1. Check DB Stats
        const docCount = await prisma.document.count();
        const chunkCount = await prisma.documentChunk.count();
        console.log(`\nDB Stats: ${docCount} documents, ${chunkCount} chunks. at ${path.join(process.cwd(), '.env')}`);

        if (chunkCount === 0) {
            console.error("CRITICAL: No chunks found in database!");
            return;
        }

        // 2. Generate Embedding
        console.log("\nGenerating embedding...");
        const startEmbed = Date.now();
        const embedding = await generateEmbedding(query);
        console.log(`Embedding generated in ${Date.now() - startEmbed}ms. Vector length: ${embedding.length}`);

        // 3. Search
        console.log("\nSearching similar chunks...");
        const startSearch = Date.now();
        const results = await searchSimilarChunks(embedding, 5);
        console.log(`Search completed in ${Date.now() - startSearch}ms. Found ${results.length} matches.`);

        // 4. Results
        console.log("\nTop Results:");
        results.forEach((r, i) => {
            console.log(`[${i + 1}] Similarity: ${r.similarity.toFixed(4)} | File: ${r.metadata?.fileName}`);
            console.log(`     Content: ${r.content.substring(0, 100).replace(/\n/g, ' ')}...`);
            console.log('---');
        });

    } catch (error: any) {
        console.error("Error during verification:", error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
