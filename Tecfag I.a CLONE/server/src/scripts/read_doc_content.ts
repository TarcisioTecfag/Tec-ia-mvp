
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });
const prisma = new PrismaClient();

async function main() {
    const doc = await prisma.document.findFirst({
        where: { fileName: { contains: "importação direta" } },
        include: { chunks: true }
    });

    if (doc && doc.chunks.length > 0) {
        console.log("Document Content:");
        console.log(doc.chunks[0].content);
    } else {
        console.log("Document not found");
    }
}

main().finally(() => prisma.$disconnect());
