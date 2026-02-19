import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { authRouter } from './routes/auth.js';
import { usersRouter } from './routes/users.js';
import { machinesRouter } from './routes/machines.js';
import { mindmapsRouter } from './routes/mindmaps.js';
import { chatRouter } from './routes/chat.js';
import { monitoringRouter } from './routes/monitoring.js';
import documentsRouter from './routes/documents.js';
import catalogRouter from './routes/catalog.js';
import { accessGroupsRouter } from './routes/accessGroups.js';
import feedbackRouter from './routes/feedback.js';
import cacheRouter from './routes/cache.js';
import exportsRouter from './routes/exports.js';
import backupRouter from './routes/backup.js';
import notificationsRouter from './routes/notifications.js';
import { createBackup, startScheduledBackup } from './services/backupService.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// ═══════════════════════════════════════════════════════════════
// CONFIGURAÇÃO PARA CLUSTER PM2
// ═══════════════════════════════════════════════════════════════

// Identificador do worker (0, 1, 2, etc.) - usado pelo PM2
const WORKER_ID = process.env.INSTANCE_ID || process.env.pm_id || '0';
const IS_PRIMARY_WORKER = WORKER_ID === '0';
const IS_CLUSTER_MODE = process.env.pm_id !== undefined;

// Prefixo para logs com identificação do worker
const logPrefix = IS_CLUSTER_MODE ? `[Worker ${WORKER_ID}]` : '[Server]';

// ═══════════════════════════════════════════════════════════════
// MIDDLEWARE
// ═══════════════════════════════════════════════════════════════

import morgan from 'morgan';
app.use(morgan('dev'));
app.use(cors({
    origin: [process.env.FRONTEND_URL || 'http://localhost:8080', 'http://localhost:8081', 'http://localhost:8082', 'https://teciaalpha.vercel.app'],
    credentials: true,
}));
app.use(express.json());

// Serve uploaded files statically
const uploadDir = process.env.UPLOAD_DIR || 'uploads';
import path from 'path';
// Ensure absolute path
const absoluteUploadDir = path.resolve(uploadDir);
console.log(`${logPrefix} Serving static files from: ${absoluteUploadDir}`);
app.use('/uploads', express.static(absoluteUploadDir));

// Fallback for images: Lookup by original filename in database
import { prisma } from './config/database.js';
app.get('/uploads/:filename', async (req, res) => {
    const { filename } = req.params;
    try {
        const document = await prisma.document.findFirst({
            where: { fileName: filename }
        });

        if (document && document.filePath) {
            console.log(`[Image Fallback] Found ${filename} -> ${document.filePath}`);
            res.sendFile(path.resolve(document.filePath));
            return;
        }
    } catch (e) {
        console.error(`[Image Fallback] Error looking up ${filename}:`, e);
    }
    res.status(404).json({ error: 'File not found' });
});

// ═══════════════════════════════════════════════════════════════
// ROUTES
// ═══════════════════════════════════════════════════════════════

app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/machines', machinesRouter);
app.use('/api/mindmaps', mindmapsRouter);
app.use('/api/chat', chatRouter);
app.use('/api/monitoring', monitoringRouter);
app.use('/api/documents', documentsRouter);
app.use('/api/catalog', catalogRouter);
app.use('/api/access-groups', accessGroupsRouter);
app.use('/api/feedback', feedbackRouter);
app.use('/api/cache', cacheRouter);
app.use('/api/exports', exportsRouter);
app.use('/api/backup', backupRouter);
app.use('/api/notifications', notificationsRouter);

// Health check - inclui worker ID para debug de load balancing
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        message: 'Tec I.A Backend is running!',
        workerId: WORKER_ID,
        clusterMode: IS_CLUSTER_MODE,
        timestamp: new Date().toISOString()
    });
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal server error' });
});

// ═══════════════════════════════════════════════════════════════
// SERVER STARTUP
// ═══════════════════════════════════════════════════════════════

const server = app.listen(PORT, () => {
    if (IS_CLUSTER_MODE) {
        console.log(`🚀 ${logPrefix} Worker started on http://localhost:${PORT}`);
    } else {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
    }

    console.log(`[VERSION CHECK] Server started at ${new Date().toISOString()} - Includes Admin Chat Fix & User Delete Fix`);
    console.log(`📚 API docs available at http://localhost:${PORT}/api/health`);

    // 🔒 BACKUP AUTOMÁTICO - Apenas no worker principal
    if (IS_PRIMARY_WORKER) {
        // Cria backup no startup do servidor
        createBackup('startup');

        // Agenda backups a cada 6 horas
        startScheduledBackup(6);

        console.log(`${logPrefix} ✅ Backup service initialized (primary worker)`);
    } else if (IS_CLUSTER_MODE) {
        console.log(`${logPrefix} ⏭️ Backup service skipped (secondary worker)`);
    }

    console.log('[SYSTEM] Server restarted to apply new API Key configuration.');

    // Notify PM2 that we're ready (for graceful start)
    if (process.send) {
        process.send('ready');
    }
});

// ═══════════════════════════════════════════════════════════════
// GRACEFUL SHUTDOWN
// ═══════════════════════════════════════════════════════════════

const gracefulShutdown = async (signal: string) => {
    console.log(`${logPrefix} Received ${signal}. Gracefully shutting down...`);

    server.close(async () => {
        console.log(`${logPrefix} HTTP server closed.`);

        // Disconnect from database
        await prisma.$disconnect();
        console.log(`${logPrefix} Database disconnected.`);

        process.exit(0);
    });

    // Force exit after 10 seconds
    setTimeout(() => {
        console.error(`${logPrefix} Could not close connections in time, forcefully shutting down`);
        process.exit(1);
    }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export default app;

