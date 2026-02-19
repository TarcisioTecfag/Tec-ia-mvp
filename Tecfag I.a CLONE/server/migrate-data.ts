
import { PrismaClient } from '@prisma/client';
import fs from 'fs';

// 1. Conectar ao banco LOCAL (origem)
// O cliente padrão do projeto já está configurado para ler do .env local
const localPrisma = new PrismaClient();

async function exportData() {
    console.log('📦 Exporting data from LOCAL database...');

    // Ordem de exportação importa menos, mas vamos manter organizado
    const accessGroups = await localPrisma.accessGroup.findMany();
    const users = await localPrisma.user.findMany();
    const machines = await localPrisma.machine.findMany({ include: { specifications: true } });
    const mindmaps = await localPrisma.mindMap.findMany({ include: { nodes: { include: { connectionsFrom: true } } } });
    const catalogItems = await localPrisma.catalogItem.findMany();
    const documents = await localPrisma.document.findMany({ include: { chunks: true } });
    const chatFolders = await localPrisma.chatFolder.findMany();
    const archivedChats = await localPrisma.archivedChat.findMany();

    const data = {
        accessGroups,
        users,
        machines,
        mindmaps,
        catalogItems,
        documents,
        chatFolders,
        archivedChats
    };

    fs.writeFileSync('migration_dump.json', JSON.stringify(data, null, 2));
    console.log(`✅ Data exported to migration_dump.json (${(JSON.stringify(data).length / 1024 / 1024).toFixed(2)} MB)`);

    await localPrisma.$disconnect();
}

async function importData() {
    // LER O DUMP
    if (!fs.existsSync('migration_dump.json')) {
        console.error('❌ migration_dump.json not found!');
        return;
    }
    const data = JSON.parse(fs.readFileSync('migration_dump.json', 'utf-8'));

    // CONECTAR AO RAILWAY
    const railwayPrisma = new PrismaClient({
        datasources: {
            db: {
                url: process.env.RAILWAY_DATABASE_URL
            }
        }
    });

    console.log('🚀 Importing data to RAILWAY database...');
    console.log(`Target: ${process.env.RAILWAY_DATABASE_URL?.split('@')[1]}`);

    try {
        // 1. Access Groups (Dependency for Users)
        if (data.accessGroups && data.accessGroups.length > 0) {
            console.log(`Importing ${data.accessGroups.length} access groups...`);
            for (const group of data.accessGroups) {
                await railwayPrisma.accessGroup.upsert({
                    where: { id: group.id },
                    update: {},
                    create: group
                });
            }
        }

        // 2. Users
        console.log(`Importing ${data.users.length} users...`);
        for (const user of data.users) {
            const { accessGroupId, ...userData } = user;

            // Verificar se o grupo existe, senão remover vínculo para evitar erro
            let validAccessGroupId = accessGroupId;
            if (accessGroupId) {
                const groupExists = await railwayPrisma.accessGroup.findUnique({ where: { id: accessGroupId } });
                if (!groupExists) validAccessGroupId = null;
            }

            await railwayPrisma.user.upsert({
                where: { id: user.id },
                update: {},
                create: {
                    ...userData,
                    accessGroupId: validAccessGroupId
                }
            });
        }

        // 3. Machines
        console.log(`Importing ${data.machines.length} machines...`);
        for (const machine of data.machines) {
            const { specifications, ...machineData } = machine;
            await railwayPrisma.machine.upsert({
                where: { id: machine.id },
                update: {},
                create: {
                    ...machineData,
                    specifications: {
                        create: specifications.map((s: any) => ({ content: s.content }))
                    }
                }
            });
        }

        // 4. Catalog Items (Dependency for Documents)
        console.log(`Importing ${data.catalogItems.length} catalog items...`);
        for (const item of data.catalogItems) {
            await railwayPrisma.catalogItem.upsert({
                where: { id: item.id },
                update: {},
                create: item
            });
        }

        // 5. Documents
        console.log(`Importing ${data.documents.length} documents...`);
        for (const doc of data.documents) {
            const { chunks, ...docData } = doc;
            // Verificar dependências
            if (docData.catalogId) {
                const exists = await railwayPrisma.catalogItem.findUnique({ where: { id: docData.catalogId } });
                if (!exists) docData.catalogId = null;
            }
            if (docData.folderId) {
                // Se folder não foi migrado ainda, remover vínculo. 
                // Idealmente deveríamos migrar DocumentFolders antes.
                docData.folderId = null;
            }

            await railwayPrisma.document.upsert({
                where: { id: doc.id },
                update: {},
                create: {
                    ...docData,
                    chunks: {
                        create: chunks.map((c: any) => ({
                            content: c.content,
                            chunkIndex: c.chunkIndex,
                            embedding: c.embedding,
                            metadata: c.metadata
                        }))
                    }
                }
            });
        }

        // 6. Chat Folders & Archives
        if (data.chatFolders) {
            for (const folder of data.chatFolders) {
                await railwayPrisma.chatFolder.upsert({
                    where: { id: folder.id },
                    update: {},
                    create: folder
                });
            }
        }

        if (data.archivedChats) {
            for (const chat of data.archivedChats) {
                // Verificar folder
                if (chat.folderId) {
                    const exists = await railwayPrisma.chatFolder.findUnique({ where: { id: chat.folderId } });
                    if (!exists) chat.folderId = null;
                }

                await railwayPrisma.archivedChat.upsert({
                    where: { id: chat.id },
                    update: {},
                    create: chat
                });
            }
        }

        console.log('✅ Migration finished successfully!');

    } catch (e) {
        console.error('❌ Error during import:', e);
    } finally {
        await railwayPrisma.$disconnect();
    }
}

// Check args
const mode = process.argv[2];
if (mode === 'export') {
    exportData();
} else if (mode === 'import') {
    importData();
} else {
    console.log('Usage: npx tsx migrate-data.ts [export|import]');
}
