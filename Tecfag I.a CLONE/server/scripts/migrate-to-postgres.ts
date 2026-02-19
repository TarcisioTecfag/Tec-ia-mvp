/**
 * Script de Migração SQLite → PostgreSQL
 * 
 * Este script:
 * 1. Conecta no SQLite antigo
 * 2. Conecta no PostgreSQL novo (via Prisma já configurado)
 * 3. Migra todas as tabelas preservando os IDs
 * 4. Valida a integridade dos dados
 */

import { PrismaClient as PrismaClientPostgres } from '@prisma/client';
import Database from 'better-sqlite3';
import * as path from 'path';
import * as fs from 'fs';

const SQLITE_PATH = path.join(__dirname, '../prisma/dev.db');

// Verificar se SQLite existe
if (!fs.existsSync(SQLITE_PATH)) {
    console.error('❌ Arquivo SQLite não encontrado:', SQLITE_PATH);
    process.exit(1);
}

const sqliteDb = new Database(SQLITE_PATH);
const postgresDb = new PrismaClientPostgres();

interface MigrationStats {
    table: string;
    sqliteCount: number;
    postgresCount: number;
    success: boolean;
}

const stats: MigrationStats[] = [];

async function migrateTable<T>(
    tableName: string,
    selectQuery: string,
    insertFn: (row: T) => Promise<any>
): Promise<void> {
    console.log(`\n📦 Migrando tabela: ${tableName}...`);

    const rows = sqliteDb.prepare(selectQuery).all() as T[];
    console.log(`   Encontrados: ${rows.length} registros`);

    let migrated = 0;
    let errors = 0;

    for (const row of rows) {
        try {
            await insertFn(row);
            migrated++;
        } catch (error: any) {
            // Ignorar erros de duplicata (registro já existe)
            if (error.code === 'P2002') {
                console.log(`   ⚠️ Registro já existe, pulando...`);
            } else {
                errors++;
                console.error(`   ❌ Erro ao migrar registro:`, error.message);
            }
        }
    }

    console.log(`   ✅ Migrados: ${migrated}/${rows.length} (${errors} erros)`);

    stats.push({
        table: tableName,
        sqliteCount: rows.length,
        postgresCount: migrated,
        success: errors === 0
    });
}

async function main() {
    console.log('🚀 Iniciando migração SQLite → PostgreSQL\n');
    console.log('📂 SQLite:', SQLITE_PATH);
    console.log('🐘 PostgreSQL: tecfag_ia\n');
    console.log('='.repeat(50));

    try {
        // 1. AccessGroup (sem dependências)
        await migrateTable<any>(
            'AccessGroup',
            'SELECT * FROM AccessGroup',
            async (row) => {
                await postgresDb.accessGroup.create({
                    data: {
                        id: row.id,
                        name: row.name,
                        description: row.description,
                        canViewChat: Boolean(row.canViewChat),
                        canViewMindMap: Boolean(row.canViewMindMap),
                        canViewCatalog: Boolean(row.canViewCatalog),
                        canViewUsers: Boolean(row.canViewUsers),
                        canViewMonitoring: Boolean(row.canViewMonitoring),
                        canViewDocuments: Boolean(row.canViewDocuments),
                        canViewSettings: Boolean(row.canViewSettings),
                        canViewNotifications: Boolean(row.canViewNotifications),
                        createdAt: new Date(row.createdAt),
                        updatedAt: new Date(row.updatedAt),
                    }
                });
            }
        );

        // 2. User (depende de AccessGroup)
        await migrateTable<any>(
            'User',
            'SELECT * FROM User',
            async (row) => {
                await postgresDb.user.create({
                    data: {
                        id: row.id,
                        email: row.email,
                        password: row.password,
                        name: row.name,
                        role: row.role,
                        lastActive: new Date(row.lastActive),
                        createdAt: new Date(row.createdAt),
                        updatedAt: new Date(row.updatedAt),
                        mustChangePassword: Boolean(row.mustChangePassword),
                        jobTitle: row.jobTitle,
                        department: row.department,
                        technicalLevel: row.technicalLevel,
                        communicationStyle: row.communicationStyle,
                        accessGroupId: row.accessGroupId,
                        canViewChat: row.canViewChat === null ? null : Boolean(row.canViewChat),
                        canViewMindMap: row.canViewMindMap === null ? null : Boolean(row.canViewMindMap),
                        canViewCatalog: row.canViewCatalog === null ? null : Boolean(row.canViewCatalog),
                        canViewUsers: row.canViewUsers === null ? null : Boolean(row.canViewUsers),
                        canViewMonitoring: row.canViewMonitoring === null ? null : Boolean(row.canViewMonitoring),
                        canViewDocuments: row.canViewDocuments === null ? null : Boolean(row.canViewDocuments),
                        canViewSettings: row.canViewSettings === null ? null : Boolean(row.canViewSettings),
                        canViewNotifications: row.canViewNotifications === null ? null : Boolean(row.canViewNotifications),
                    }
                });
            }
        );

        // 3. CatalogItem
        await migrateTable<any>(
            'CatalogItem',
            'SELECT * FROM CatalogItem',
            async (row) => {
                await postgresDb.catalogItem.create({
                    data: {
                        id: row.id,
                        code: row.code,
                        name: row.name,
                        category: row.category,
                        description: row.description,
                        createdAt: new Date(row.createdAt),
                        updatedAt: new Date(row.updatedAt),
                    }
                });
            }
        );

        // 4. DocumentFolder
        await migrateTable<any>(
            'DocumentFolder',
            'SELECT * FROM DocumentFolder',
            async (row) => {
                await postgresDb.documentFolder.create({
                    data: {
                        id: row.id,
                        name: row.name,
                        order: row.order,
                        parentId: row.parentId,
                        createdAt: new Date(row.createdAt),
                    }
                });
            }
        );

        // 5. Document
        await migrateTable<any>(
            'Document',
            'SELECT * FROM Document',
            async (row) => {
                await postgresDb.document.create({
                    data: {
                        id: row.id,
                        catalogId: row.catalogId,
                        deliveryMode: row.deliveryMode || 'text',
                        folderId: row.folderId,
                        fileName: row.fileName,
                        fileType: row.fileType,
                        fileSize: row.fileSize,
                        filePath: row.filePath,
                        indexed: Boolean(row.indexed),
                        processingProgress: row.processingProgress || 0,
                        processingError: row.processingError,
                        isActive: row.isActive === undefined ? true : Boolean(row.isActive),
                        chunkCount: row.chunkCount,
                        totalTokens: row.totalTokens,
                        uploadedBy: row.uploadedBy,
                        uploadedAt: new Date(row.uploadedAt),
                        indexedAt: row.indexedAt ? new Date(row.indexedAt) : null,
                        version: row.version || 1,
                        previousVersionId: row.previousVersionId,
                    }
                });
            }
        );

        // 6. DocumentChunk (CRÍTICO - dados de embeddings)
        await migrateTable<any>(
            'DocumentChunk',
            'SELECT * FROM DocumentChunk',
            async (row) => {
                await postgresDb.documentChunk.create({
                    data: {
                        id: row.id,
                        documentId: row.documentId,
                        content: row.content,
                        chunkIndex: row.chunkIndex,
                        embedding: row.embedding, // JSON string preservado
                        metadata: row.metadata,
                        createdAt: new Date(row.createdAt),
                    }
                });
            }
        );

        // 7. Machine
        await migrateTable<any>(
            'Machine',
            'SELECT * FROM Machine',
            async (row) => {
                await postgresDb.machine.create({
                    data: {
                        id: row.id,
                        name: row.name,
                        category: row.category,
                        capacity: row.capacity,
                        model: row.model,
                        price: row.price,
                        maintenanceStatus: row.maintenanceStatus,
                        lastMaintenance: row.lastMaintenance,
                        createdAt: new Date(row.createdAt),
                        updatedAt: new Date(row.updatedAt),
                    }
                });
            }
        );

        // 8. MachineSpecification
        await migrateTable<any>(
            'MachineSpecification',
            'SELECT * FROM MachineSpecification',
            async (row) => {
                await postgresDb.machineSpecification.create({
                    data: {
                        id: row.id,
                        machineId: row.machineId,
                        content: row.content,
                    }
                });
            }
        );

        // 9. MindMap
        await migrateTable<any>(
            'MindMap',
            'SELECT * FROM MindMap',
            async (row) => {
                await postgresDb.mindMap.create({
                    data: {
                        id: row.id,
                        name: row.name,
                        createdAt: new Date(row.createdAt),
                        updatedAt: new Date(row.updatedAt),
                    }
                });
            }
        );

        // 10. MindMapNode
        await migrateTable<any>(
            'MindMapNode',
            'SELECT * FROM MindMapNode',
            async (row) => {
                await postgresDb.mindMapNode.create({
                    data: {
                        id: row.id,
                        mindMapId: row.mindMapId,
                        label: row.label,
                        type: row.type,
                        x: row.x,
                        y: row.y,
                    }
                });
            }
        );

        // 11. MindMapConnection
        await migrateTable<any>(
            'MindMapConnection',
            'SELECT * FROM MindMapConnection',
            async (row) => {
                await postgresDb.mindMapConnection.create({
                    data: {
                        id: row.id,
                        fromNodeId: row.fromNodeId,
                        toNodeId: row.toNodeId,
                    }
                });
            }
        );

        // 12. ChatMessage
        await migrateTable<any>(
            'ChatMessage',
            'SELECT * FROM ChatMessage',
            async (row) => {
                await postgresDb.chatMessage.create({
                    data: {
                        id: row.id,
                        userId: row.userId,
                        role: row.role,
                        content: row.content,
                        createdAt: new Date(row.createdAt),
                    }
                });
            }
        );

        // 13. ArchivedChat
        await migrateTable<any>(
            'ArchivedChat',
            'SELECT * FROM ArchivedChat',
            async (row) => {
                await postgresDb.archivedChat.create({
                    data: {
                        id: row.id,
                        userId: row.userId,
                        title: row.title,
                        messagesCount: row.messagesCount,
                        messages: row.messages,
                        createdAt: new Date(row.createdAt),
                        archivedAt: new Date(row.archivedAt),
                        folderId: row.folderId,
                        isPinned: Boolean(row.isPinned),
                    }
                });
            }
        );

        // 14. ChatFolder
        await migrateTable<any>(
            'ChatFolder',
            'SELECT * FROM ChatFolder',
            async (row) => {
                await postgresDb.chatFolder.create({
                    data: {
                        id: row.id,
                        userId: row.userId,
                        name: row.name,
                        isDefault: Boolean(row.isDefault),
                        order: row.order,
                        createdAt: new Date(row.createdAt),
                    }
                });
            }
        );

        // 15. TokenUsage
        await migrateTable<any>(
            'TokenUsage',
            'SELECT * FROM TokenUsage',
            async (row) => {
                await postgresDb.tokenUsage.create({
                    data: {
                        id: row.id,
                        userId: row.userId,
                        inputTokens: row.inputTokens,
                        outputTokens: row.outputTokens,
                        totalTokens: row.totalTokens,
                        model: row.model,
                        requestType: row.requestType || 'chat',
                        createdAt: new Date(row.createdAt),
                    }
                });
            }
        );

        // 16. MessageFeedback
        await migrateTable<any>(
            'MessageFeedback',
            'SELECT * FROM MessageFeedback',
            async (row) => {
                await postgresDb.messageFeedback.create({
                    data: {
                        id: row.id,
                        messageId: row.messageId,
                        messageContent: row.messageContent,
                        queryContent: row.queryContent,
                        rating: row.rating,
                        category: row.category,
                        comment: row.comment,
                        userId: row.userId,
                        model: row.model,
                        catalogId: row.catalogId,
                        createdAt: new Date(row.createdAt),
                    }
                });
            }
        );

        // 17. ChatSessionContext
        await migrateTable<any>(
            'ChatSessionContext',
            'SELECT * FROM ChatSessionContext',
            async (row) => {
                await postgresDb.chatSessionContext.create({
                    data: {
                        id: row.id,
                        userId: row.userId,
                        contextSummary: row.contextSummary,
                        mentionedEntities: row.mentionedEntities,
                        providedInfo: row.providedInfo,
                        detectedPreferences: row.detectedPreferences,
                        messageCount: row.messageCount || 0,
                        lastUpdated: new Date(row.lastUpdated),
                        createdAt: new Date(row.createdAt),
                    }
                });
            }
        );

        // 18. QueryCache
        await migrateTable<any>(
            'QueryCache',
            'SELECT * FROM QueryCache',
            async (row) => {
                await postgresDb.queryCache.create({
                    data: {
                        id: row.id,
                        queryText: row.queryText,
                        queryHash: row.queryHash,
                        queryEmbedding: row.queryEmbedding,
                        response: row.response,
                        sources: row.sources,
                        hitCount: row.hitCount || 0,
                        catalogId: row.catalogId,
                        userId: row.userId,
                        documentIds: row.documentIds,
                        createdAt: new Date(row.createdAt),
                        lastUsed: new Date(row.lastUsed),
                        expiresAt: new Date(row.expiresAt),
                    }
                });
            }
        );

        // 19. EmbeddingCache
        await migrateTable<any>(
            'EmbeddingCache',
            'SELECT * FROM EmbeddingCache',
            async (row) => {
                await postgresDb.embeddingCache.create({
                    data: {
                        id: row.id,
                        textHash: row.textHash,
                        embedding: row.embedding,
                        createdAt: new Date(row.createdAt),
                    }
                });
            }
        );

        // 20. NotificationSettings
        await migrateTable<any>(
            'NotificationSettings',
            'SELECT * FROM NotificationSettings',
            async (row) => {
                await postgresDb.notificationSettings.create({
                    data: {
                        id: row.id,
                        userId: row.userId,
                        systemAlerts: Boolean(row.systemAlerts),
                        userAlerts: Boolean(row.userAlerts),
                        documentAlerts: Boolean(row.documentAlerts),
                        chatAlerts: Boolean(row.chatAlerts),
                        inAppEnabled: Boolean(row.inAppEnabled),
                        emailEnabled: Boolean(row.emailEnabled),
                        frequency: row.frequency || 'realtime',
                        quietHoursEnabled: Boolean(row.quietHoursEnabled),
                        quietHoursStart: row.quietHoursStart,
                        quietHoursEnd: row.quietHoursEnd,
                        createdAt: new Date(row.createdAt),
                        updatedAt: new Date(row.updatedAt),
                    }
                });
            }
        );

        // 21. Notification
        await migrateTable<any>(
            'Notification',
            'SELECT * FROM Notification',
            async (row) => {
                await postgresDb.notification.create({
                    data: {
                        id: row.id,
                        userId: row.userId,
                        type: row.type,
                        category: row.category,
                        title: row.title,
                        message: row.message,
                        metadata: row.metadata,
                        isRead: Boolean(row.isRead),
                        readAt: row.readAt ? new Date(row.readAt) : null,
                        createdAt: new Date(row.createdAt),
                    }
                });
            }
        );

        // 22. TokenCostSettings
        await migrateTable<any>(
            'TokenCostSettings',
            'SELECT * FROM TokenCostSettings',
            async (row) => {
                await postgresDb.tokenCostSettings.create({
                    data: {
                        id: row.id,
                        inputCostPer1M: row.inputCostPer1M || 0,
                        outputCostPer1M: row.outputCostPer1M || 0,
                        currency: row.currency || 'BRL',
                        updatedAt: new Date(row.updatedAt),
                    }
                });
            }
        );

        // Resumo final
        console.log('\n' + '='.repeat(50));
        console.log('📊 RESUMO DA MIGRAÇÃO\n');

        let totalSqlite = 0;
        let totalPostgres = 0;
        let allSuccess = true;

        for (const stat of stats) {
            const status = stat.success ? '✅' : '⚠️';
            console.log(`${status} ${stat.table}: ${stat.postgresCount}/${stat.sqliteCount}`);
            totalSqlite += stat.sqliteCount;
            totalPostgres += stat.postgresCount;
            if (!stat.success) allSuccess = false;
        }

        console.log('\n' + '-'.repeat(50));
        console.log(`📈 Total: ${totalPostgres}/${totalSqlite} registros migrados`);

        if (allSuccess) {
            console.log('\n🎉 MIGRAÇÃO CONCLUÍDA COM SUCESSO!');
        } else {
            console.log('\n⚠️ Migração concluída com alguns erros. Verifique os logs.');
        }

    } catch (error) {
        console.error('\n❌ Erro fatal durante migração:', error);
        process.exit(1);
    } finally {
        sqliteDb.close();
        await postgresDb.$disconnect();
    }
}

main();
