
import { PrismaClient } from '@prisma/client';
import { generateEmbedding, cosineSimilarity } from '../services/ai/embeddings';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });
const prisma = new PrismaClient();

async function main() {
    const fileName = "A realidade da importação direta.txt";
    console.log(`Checking embedding consistency for: "${fileName}"`);

    const doc = await prisma.document.findFirst({
        where: { fileName: { contains: "importação direta" } },
        include: { chunks: { take: 1 } }
    });

    if (!doc || doc.chunks.length === 0) {
        console.error("❌ Document or chunk not found.");
        return;
    }

    const chunk = doc.chunks[0];
    const storedEmbedding = JSON.parse(chunk.embedding);
    console.log(`Stored Vector Length: ${storedEmbedding.length}`);

    console.log("Generating fresh embedding for chunk content...");
    const freshEmbedding = await generateEmbedding(chunk.content);
    console.log(`Fresh Vector Length: ${freshEmbedding.length}`);

    const similarity = cosineSimilarity(storedEmbedding, freshEmbedding);
    console.log(`\nSimilarity between STORED and FRESH: ${similarity.toFixed(4)}`);

    if (similarity > 0.99) {
        console.log("✅ Embeddings Match! (Model likely unchanged)");
    } else {
        console.log("❌ Embeddings Mismatch! (Model changed or data corrupted)");
        console.log("This explains why search is failing.");
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
