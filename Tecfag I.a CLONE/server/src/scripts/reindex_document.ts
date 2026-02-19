
import { PrismaClient } from '@prisma/client';
import { generateEmbedding } from '../services/ai/embeddings';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });
const prisma = new PrismaClient();

async function main() {
    const fileName = "A realidade da importação direta.txt";
    console.log(`Re-indexing document: "${fileName}"`);

    const doc = await prisma.document.findFirst({
        where: { fileName: { contains: "importação direta" } },
        include: { chunks: true }
    });

    if (!doc) {
        console.error("❌ Document not found.");
        return;
    }

    console.log(`Found ${doc.chunks.length} chunks. Updating embeddings...`);

    for (const chunk of doc.chunks) {
        console.log(`Processing chunk ${chunk.chunkIndex}...`);

        // Generate new embedding
        const newVector = await generateEmbedding(chunk.content);

        // Update DB
        await prisma.documentChunk.update({
            where: { id: chunk.id },
            data: {
                embedding: JSON.stringify(newVector)
            }
        });

        console.log(`✅ Updated chunk ${chunk.chunkIndex} (Vector Len: ${newVector.length})`);
    }

    console.log("\nRe-indexing complete.");
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
