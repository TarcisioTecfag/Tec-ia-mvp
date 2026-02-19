
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });
const prisma = new PrismaClient();

async function main() {
    const fileName = "A realidade da importação direta.txt";
    console.log(`Checking status for: "${fileName}"`);

    const doc = await prisma.document.findFirst({
        where: {
            fileName: {
                contains: "importação direta"
            }
        },
        include: {
            _count: {
                select: { chunks: true }
            }
        }
    });

    if (!doc) {
        console.error("❌ Document NOT FOUND in database.");
    } else {
        console.log("✅ Document Found:");
        console.log(`- ID: ${doc.id}`);
        console.log(`- Name: ${doc.fileName}`);
        console.log(`- Chunks (Count): ${doc._count.chunks}`);
        console.log(`- Indexed: ${doc.indexed}`);

        if (doc._count.chunks > 0) {
            const chunk = await prisma.documentChunk.findFirst({
                where: { documentId: doc.id }
            });
            console.log("\nSample Chunk:");
            console.log(`- Content: ${chunk?.content.substring(0, 100)}...`);
            console.log(`- Vector present: ${!!chunk?.embedding}`);

            // Re-check this chunk's embedding?
            // checking manually if it has valid vector
            if (chunk?.embedding) {
                const vec = JSON.parse(chunk.embedding);
                console.log(`- Vector length: ${vec.length}`);
            }
        }
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
