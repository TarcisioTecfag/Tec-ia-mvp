
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function countRowsInCompilado() {
    try {
        const docId = 'faad6ce6-d6d4-4304-8282-e109af7f89bc';
        const chunks = await prisma.documentChunk.findMany({
            where: { documentId: docId }
        });

        let totalRows = 0;
        let headerRows = 0;

        const uniqueCodes = new Set<string>();
        const codes = [];

        chunks.forEach(chunk => {
            const lines = chunk.content.split('\n');
            lines.forEach(line => {
                if (line.trim().startsWith('|')) {
                    if (line.includes('---')) return;
                    if (line.toLowerCase().includes('código') || line.toLowerCase().includes('descrição')) return;

                    // Extract first column (Code)
                    const parts = line.split('|').map(p => p.trim());
                    // | Code | Desc | ... -> parts[0]="", parts[1]="Code", parts[2]="Desc"
                    const code = parts[1];

                    if (code && code.length > 2) { // minimal validity check
                        uniqueCodes.add(code);
                        codes.push(code);
                        totalRows++;
                    }
                }
            });
        });

        console.log(`Verified Rows in Compilado File:`);
        console.log(`- Total Data Rows: ${totalRows}`);
        console.log(`- Unique Codes: ${uniqueCodes.size}`);
        console.log(`- Duplicates found: ${totalRows - uniqueCodes.size}`);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

countRowsInCompilado();
