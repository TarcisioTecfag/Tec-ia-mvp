
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Map of common mojibake patterns to correct characters
const REPLACEMENTS: Record<string, string> = {
    'Ã§Ã£': 'çã',
    'Ã£': 'ã',
    'Ã¡': 'á',
    'Ã©': 'é',
    'Ãf': 'í', // Sometimes appears
    'Ã³': 'ó',
    'Ã´': 'ô',
    'Ãº': 'ú',
    'Ã§': 'ç',
    'Ãª': 'ê',
    'Ã ': 'à',
};

async function fixMojibake() {
    console.log('🔄 Starting Mojibake correction...');

    const documents = await prisma.document.findMany();
    let updatedCount = 0;

    for (const doc of documents) {
        let newName = doc.fileName;
        let changed = false;

        // Apply replacements
        for (const [bad, good] of Object.entries(REPLACEMENTS)) {
            if (newName.includes(bad)) {
                newName = newName.split(bad).join(good); // Replace all occurrences
                changed = true;
            }
        }

        if (changed) {
            console.log(`\n🛠️ Fixing: "${doc.fileName}" -> "${newName}"`);

            try {
                // Update Document
                await prisma.document.update({
                    where: { id: doc.id },
                    data: { fileName: newName }
                });
                console.log('   ✅ Document updated');

                // Update related chunks metadata if needed
                // Note: Chunks contain metadata JSON string which includes fileName
                // We need to fetch, parse, update, and save back.

                const chunks = await prisma.documentChunk.findMany({
                    where: { documentId: doc.id },
                    select: { id: true, metadata: true }
                });

                if (chunks.length > 0) {
                    console.log(`   📝 Updating ${chunks.length} chunks...`);

                    for (const chunk of chunks) {
                        if (chunk.metadata) {
                            try {
                                const meta = JSON.parse(chunk.metadata as string);
                                if (meta.fileName && meta.fileName !== newName) {
                                    meta.fileName = newName;
                                    await prisma.documentChunk.update({
                                        where: { id: chunk.id },
                                        data: { metadata: JSON.stringify(meta) }
                                    });
                                }
                            } catch (e) {
                                console.warn(`   ⚠️ Failed to parse metadata for chunk ${chunk.id}`);
                            }
                        }
                    }
                }

                updatedCount++;
            } catch (error) {
                console.error(`   ❌ Failed to update: ${error}`);
            }
        }
    }

    console.log(`\n✨ Finished. Fixed ${updatedCount} documents.`);
}

fixMojibake()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
