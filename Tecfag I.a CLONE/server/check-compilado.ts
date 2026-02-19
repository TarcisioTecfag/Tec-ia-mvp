import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

async function checkCompilado() {
    console.log('🔍 Searching for "Compilado" document...');

    const doc = await prisma.document.findFirst({
        where: {
            fileName: {
                contains: 'Compilado'
            }
        }
    });

    if (!doc) {
        console.error('❌ "Compilado" document not found in DB!');
        return;
    }

    console.log(`✅ Found document: ${doc.fileName}`);

    // Read the file content
    try {
        const content = fs.readFileSync(doc.filePath, 'utf-8');
        console.log(`\n📄 File Content Length: ${content.length} chars`);

        // Count potential machine rows
        let machineCount = 0;
        const lines = content.split('\n');

        console.log(`   Total lines: ${lines.length}`);

        for (const line of lines) {
            // Heuristic: A line with a code-like pattern (e.g., "XQD-", "DZ-") 
            // AND not a json key
            const trimmed = line.trim();
            if (trimmed.length > 5 &&
                !trimmed.includes('"caminho_arquivo":') &&
                !trimmed.includes('"dados":') &&
                !trimmed.includes('"planilha":') &&
                !trimmed.includes('Unnamed:') &&
                !trimmed.includes('"ABASTECEDOR AUTOMÁTICO":') && // Exclude header keys
                !trimmed.includes('"Código":') &&
                !trimmed.includes('NaN')) {

                // Check for Code pattern or long description
                // Regex for typical machine codes: 2+ letters, digits, optional dash
                if (/[A-Z0-9-]{3,}/.test(trimmed)) {
                    machineCount++;
                }
            }
        }
        console.log(`\n🤖 Estimated Unique Items (Heuristic): ${machineCount}`);

        // Count "dados" arrays to see how many "sheets" or sections
        const dadosMatches = content.match(/"dados":/g);
        console.log(`   Sections/Sheets: ${dadosMatches ? dadosMatches.length : 0}`);

    } catch (err: any) {
        console.error(`❌ Error reading file: ${err.message}`);
    }
}

checkCompilado()
    .then(() => prisma.$disconnect())
    .catch(e => { console.error(e); prisma.$disconnect(); });
