import express, { Request, Response } from 'express';
import multer from 'multer';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import { exec } from 'child_process';
import path from 'path';
import fsPromises from 'fs/promises';
import { authenticate, adminOnly, AuthRequest } from '../middleware/auth';
import * as cacheService from '../services/ai/cacheService';

const router = express.Router();
const prisma = new PrismaClient();

// Apply authentication to all routes
router.use(authenticate);

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        const uploadDir = path.resolve(process.env.UPLOAD_DIR || './uploads');
        console.log(`[Upload] Saving file to: ${uploadDir}`);

        // Ensure upload directory exists
        try {
            await fsPromises.mkdir(uploadDir, { recursive: true });
            cb(null, uploadDir);
        } catch (error) {
            console.error('[Upload] Error creating upload directory:', error);
            cb(error as Error, uploadDir);
        }
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        const filename = `document-${uniqueSuffix}${ext}`;
        console.log(`[Upload] Generated filename: ${filename}`);
        cb(null, filename);
    }
});

const upload = multer({
    storage,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE || '52428800') // 50MB default
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain',
            'image/jpeg',
            'image/png',
            'image/webp'
        ];

        console.log(`[Upload] Checking file: ${file.originalname} (${file.mimetype})`);
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            console.error(`[Upload] Invalid file type: ${file.mimetype}`);
            cb(new Error('Tipo de arquivo não suportado. Use PDF, DOCX, TXT ou Imagens (JPG, PNG, WEBP).'));
        }
    }
});

/**
 * Upload a new document (Admin only)
 */
router.post('/upload', adminOnly, upload.single('file'), async (req: AuthRequest, res: Response) => {
    console.log('[Upload] Handler reached');
    try {
        const { catalogId, deliveryMode, folderId } = req.body;
        const file = req.file;

        console.log(`[Upload] Processing request. CatalogId: ${catalogId || 'GLOBAL'}, folderId: ${folderId || 'ROOT'}, deliveryMode: ${deliveryMode || 'text'}, File: ${file?.filename}`);

        if (!file) {
            return res.status(400).json({ error: 'Nenhum arquivo enviado' });
        }

        // Validate deliveryMode
        const validDeliveryModes = ['text', 'media'];
        const finalDeliveryMode = (deliveryMode && validDeliveryModes.includes(deliveryMode)) ? deliveryMode : 'text';

        // Verify catalog item exists if catalogId is provided
        if (catalogId) {
            const catalogItem = await prisma.catalogItem.findUnique({
                where: { id: catalogId }
            });

            if (!catalogItem) {
                await fsPromises.unlink(file.path);
                return res.status(404).json({ error: 'Item de catálogo não encontrado' });
            }
        }

        // Create document record (catalogId is now optional for global documents)
        const document = await prisma.document.create({
            data: {
                catalogId: catalogId || null,
                folderId: folderId || null,
                fileName: file.originalname,
                fileType: file.mimetype,
                fileSize: file.size,
                filePath: file.path,
                deliveryMode: finalDeliveryMode,
                uploadedBy: req.user?.id || null,
                indexed: false,
                processingProgress: 0,
                isActive: true
            }
        });

        // Process document asynchronously (don't await to avoid blocking)
        processDocument(document.id).catch(error => {
            console.error(`Failed to process document ${document.id}:`, error);
        });

        res.json({
            success: true,
            document,
            message: 'Documento enviado! O processamento começará em breve.'
        });

    } catch (error: any) {
        console.error('Error uploading document:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Restore a physical file (Admin only)
 * Used to sync files from local to cloud after DB migration
 */
router.post('/restore-file', adminOnly, upload.single('file'), async (req: AuthRequest, res: Response) => {
    try {
        const file = req.file;
        const { targetFilename } = req.body;

        if (!file || !targetFilename) {
            return res.status(400).json({ error: 'Arquivo e targetFilename são obrigatórios' });
        }

        // Move uploaded file to target filename to match what's in the DB
        const uploadDir = path.resolve(process.env.UPLOAD_DIR || './uploads');
        const targetPath = path.join(uploadDir, targetFilename);

        await fsPromises.rename(file.path, targetPath);

        res.json({ success: true, message: 'Arquivo restaurado com sucesso' });
    } catch (error: any) {
        console.error('Error restoring file:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * List ALL documents (Admin only - for Document Management module)
 */
router.get('/all', adminOnly, async (req: AuthRequest, res: Response) => {
    try {
        const documents = await prisma.document.findMany({
            where: { isActive: true },
            include: {
                catalogItem: {
                    select: {
                        code: true,
                        name: true,
                        category: true
                    }
                }
            },
            orderBy: { uploadedAt: 'desc' }
        });

        res.json(documents);

    } catch (error: any) {
        console.error('Error listing all documents:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * List documents for a catalog item
 */
router.get('/catalog/:catalogId', async (req: AuthRequest, res: Response) => {
    try {
        const { catalogId } = req.params;

        const documents = await prisma.document.findMany({
            where: {
                catalogId,
                isActive: true
            },
            orderBy: { uploadedAt: 'desc' },
            select: {
                id: true,
                fileName: true,
                fileType: true,
                fileSize: true,
                indexed: true,
                processingProgress: true,
                processingError: true,
                chunkCount: true,
                totalTokens: true,
                uploadedAt: true,
                indexedAt: true
            }
        });

        res.json(documents);

    } catch (error: any) {
        console.error('Error listing documents:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Get all documents (optional: filter by indexed status)
 */
router.get('/', async (req: AuthRequest, res: Response) => {
    try {
        const { indexed } = req.query;

        const where: any = { isActive: true };

        if (indexed !== undefined) {
            where.indexed = indexed === 'true';
        }

        const documents = await prisma.document.findMany({
            where,
            include: {
                catalogItem: {
                    select: {
                        code: true,
                        name: true
                    }
                }
            },
            orderBy: { uploadedAt: 'desc' }
        });

        res.json(documents);

    } catch (error: any) {
        console.error('Error getting documents:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Delete a document (Admin only)
 */
router.delete('/:documentId', adminOnly, async (req: AuthRequest, res: Response) => {
    try {
        const { documentId } = req.params;

        // Get document to find file path
        const document = await prisma.document.findUnique({
            where: { id: documentId }
        });

        if (!document) {
            return res.status(404).json({ error: 'Documento não encontrado' });
        }

        // Delete file from disk
        try {
            await fsPromises.unlink(document.filePath);
        } catch (error) {
            console.error('Error deleting file:', error);
            // Continue anyway
        }

        // Delete from database (will cascade to chunks)
        await deleteDocument(documentId);

        // Invalidate cache for this document
        await cacheService.invalidateCacheByDocument(documentId);
        console.log(`[Documents] Cache invalidated for deleted document: ${documentId}`);

        res.json({ success: true, message: 'Documento deletado com sucesso' });

    } catch (error: any) {
        console.error('Error deleting document:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Reindex a document (Admin only)
 */
router.post('/:documentId/reindex', adminOnly, async (req: AuthRequest, res: Response) => {
    try {
        const { documentId } = req.params;

        const document = await prisma.document.findUnique({
            where: { id: documentId }
        });

        if (!document) {
            return res.status(404).json({ error: 'Documento não encontrado' });
        }

        // Reindex asynchronously
        reindexDocument(documentId).catch(error => {
            console.error(`Failed to reindex document ${documentId}:`, error);
        });

        // Invalidate cache for this document (data may have changed)
        await cacheService.invalidateCacheByDocument(documentId);
        console.log(`[Documents] Cache invalidated for reindexed document: ${documentId}`);

        res.json({
            success: true,
            message: 'Reindexação iniciada'
        });

    } catch (error: any) {
        console.error('Error reindexing document:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Update document delivery mode (Admin only)
 * Changes how the document is delivered: 'text' (RAG processing) or 'media' (attachment)
 */
router.patch('/:documentId/delivery-mode', adminOnly, async (req: AuthRequest, res: Response) => {
    try {
        const { documentId } = req.params;
        const { deliveryMode } = req.body;

        // Validate deliveryMode
        const validModes = ['text', 'media'];
        if (!deliveryMode || !validModes.includes(deliveryMode)) {
            return res.status(400).json({ error: 'deliveryMode inválido. Use "text" ou "media".' });
        }

        const document = await prisma.document.findUnique({
            where: { id: documentId }
        });

        if (!document) {
            return res.status(404).json({ error: 'Documento não encontrado' });
        }

        // Update deliveryMode
        await prisma.document.update({
            where: { id: documentId },
            data: {
                deliveryMode,
                indexed: false, // Mark for reprocessing
                processingProgress: 0,
                processingError: null
            }
        });

        // Reprocess document asynchronously with new delivery mode
        reindexDocument(documentId).catch(error => {
            console.error(`Failed to reprocess document ${documentId} with new delivery mode:`, error);
        });

        // Invalidate cache
        await cacheService.invalidateCacheByDocument(documentId);
        console.log(`[Documents] Document ${documentId} delivery mode changed to '${deliveryMode}'. Reprocessing started.`);

        res.json({
            success: true,
            deliveryMode,
            message: `Modo de entrega alterado para '${deliveryMode === 'text' ? 'Leitura por IA' : 'Anexo de mídia'}'. Reprocessamento iniciado.`
        });

    } catch (error: any) {
        console.error('Error updating document delivery mode:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Fix encoding (Mojibake) for a document (Admin only)
 */
router.post('/:documentId/fix-encoding', adminOnly, async (req: AuthRequest, res: Response) => {
    try {
        const { documentId } = req.params;

        // Fix encoding asynchronously
        fixDocumentEncoding(documentId).catch(error => {
            console.error(`Failed to fix encoding for document ${documentId}:`, error);
        });

        // Invalidate cache
        await cacheService.invalidateCacheByDocument(documentId);

        res.json({
            success: true,
            message: 'Correção de codificação iniciada'
        });

    } catch (error: any) {
        console.error('Error fixing document encoding:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Download a document file
 */
router.get('/:documentId/download', async (req: AuthRequest, res: Response) => {
    try {
        const { documentId } = req.params;

        const document = await prisma.document.findUnique({
            where: { id: documentId }
        });

        if (!document) {
            return res.status(404).json({ error: 'Documento não encontrado' });
        }

        // Check if file exists
        try {
            await fs.access(document.filePath);
        } catch {
            return res.status(404).json({ error: 'Arquivo não encontrado no servidor' });
        }

        // Set headers for download
        res.setHeader('Content-Type', document.fileType);
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(document.fileName)}"`);
        res.setHeader('Content-Length', document.fileSize.toString());

        // Stream file
        const fileStream = require('fs').createReadStream(document.filePath);
        fileStream.pipe(res);

    } catch (error: any) {
        console.error('Error downloading document:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Get document processing status
 */
router.get('/:documentId/status', async (req: AuthRequest, res: Response) => {
    try {
        const { documentId } = req.params;

        const document = await prisma.document.findUnique({
            where: { id: documentId },
            select: {
                id: true,
                indexed: true,
                processingProgress: true,
                processingError: true,
                chunkCount: true,
                totalTokens: true
            }
        });

        if (!document) {
            return res.status(404).json({ error: 'Documento não encontrado' });
        }

        res.json(document);

    } catch (error: any) {
        console.error('Error getting document status:', error);
        res.status(500).json({ error: error.message });
    }
});

// ========== FOLDER MANAGEMENT ==========

/**
 * Create a new document folder (Admin only)
 */
router.post('/folders', adminOnly, async (req: AuthRequest, res: Response) => {
    try {
        const { name, parentId } = req.body;

        if (!name || name.trim().length === 0) {
            return res.status(400).json({ error: 'Nome da pasta não pode estar vazio' });
        }

        // Verify parent folder exists if provided
        if (parentId) {
            const parentFolder = await prisma.documentFolder.findUnique({
                where: { id: parentId }
            });
            if (!parentFolder) {
                return res.status(404).json({ error: 'Pasta pai não encontrada' });
            }
        }

        // Get current max order for siblings (same parent)
        const maxOrderFolder = await prisma.documentFolder.findFirst({
            where: { parentId: parentId || null },
            orderBy: { order: 'desc' }
        });

        const folder = await prisma.documentFolder.create({
            data: {
                name: name.trim(),
                order: (maxOrderFolder?.order || 0) + 1,
                parentId: parentId || null
            }
        });

        res.json({
            id: folder.id,
            name: folder.name,
            order: folder.order,
            parentId: folder.parentId,
            createdAt: folder.createdAt,
            documentCount: 0
        });
    } catch (error: any) {
        console.error('Error creating document folder:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Get all document folders with document counts (Admin only)
 */
router.get('/folders', adminOnly, async (req: AuthRequest, res: Response) => {
    try {
        const folders = await prisma.documentFolder.findMany({
            orderBy: { order: 'asc' },
            include: {
                _count: {
                    select: { documents: true, children: true }
                }
            }
        });

        res.json({
            folders: folders.map(f => ({
                id: f.id,
                name: f.name,
                order: f.order,
                parentId: f.parentId,
                documentCount: f._count.documents,
                childrenCount: f._count.children,
                createdAt: f.createdAt
            }))
        });
    } catch (error: any) {
        console.error('Error getting document folders:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Rename a document folder (Admin only)
 */
router.put('/folders/:folderId', adminOnly, async (req: AuthRequest, res: Response) => {
    try {
        const { folderId } = req.params;
        const { name } = req.body;

        if (!name || name.trim().length === 0) {
            return res.status(400).json({ error: 'Nome da pasta não pode estar vazio' });
        }

        const folder = await prisma.documentFolder.findUnique({
            where: { id: folderId }
        });

        if (!folder) {
            return res.status(404).json({ error: 'Pasta não encontrada' });
        }

        const updated = await prisma.documentFolder.update({
            where: { id: folderId },
            data: { name: name.trim() }
        });

        res.json({
            id: updated.id,
            name: updated.name,
            order: updated.order
        });
    } catch (error: any) {
        console.error('Error renaming document folder:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Delete a document folder (Admin only)
 * Documents in the folder will be moved to root (null folder)
 */
router.delete('/folders/:folderId', adminOnly, async (req: AuthRequest, res: Response) => {
    try {
        const { folderId } = req.params;

        const folder = await prisma.documentFolder.findUnique({
            where: { id: folderId }
        });

        if (!folder) {
            return res.status(404).json({ error: 'Pasta não encontrada' });
        }

        // Move all documents in this folder to root (null folder)
        await prisma.document.updateMany({
            where: { folderId },
            data: { folderId: null }
        });

        await prisma.documentFolder.delete({
            where: { id: folderId }
        });

        res.json({ success: true, message: 'Pasta deletada com sucesso' });
    } catch (error: any) {
        console.error('Error deleting document folder:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Move a document to a folder (Admin only)
 */
router.put('/:documentId/move', adminOnly, async (req: AuthRequest, res: Response) => {
    try {
        const { documentId } = req.params;
        const { folderId } = req.body;

        const document = await prisma.document.findUnique({
            where: { id: documentId }
        });

        if (!document) {
            return res.status(404).json({ error: 'Documento não encontrado' });
        }

        // Verify folder exists if folderId is provided
        if (folderId) {
            const folder = await prisma.documentFolder.findUnique({
                where: { id: folderId }
            });

            if (!folder) {
                return res.status(404).json({ error: 'Pasta não encontrada' });
            }
        }

        const updated = await prisma.document.update({
            where: { id: documentId },
            data: { folderId: folderId || null }
        });

        res.json({
            id: updated.id,
            folderId: updated.folderId
        });
    } catch (error: any) {
        console.error('Error moving document:', error);
        res.status(500).json({ error: error.message });
    }
});
// --- Admin endpoint to run the import script inside the cloud server ---
router.post('/admin/run-import', adminOnly, async (req: AuthRequest, res: Response) => {
    try {
        console.log('Running internal db:migrate:import on cloud server...');
        res.json({ success: true, message: 'Database import triggered internally' });

        // Trigger the script asynchronously so the request doesn't timeout
        exec('npx tsx migrate-data.ts import', (error, stdout, stderr) => {
            if (error) {
                console.error(`Error running import script: ${error.message}`);
                return;
            }
            if (stderr) {
                console.error(`Import script stderr: ${stderr}`);
            }
            console.log(`Import script stdout:\n${stdout}`);
        });

    } catch (error: any) {
        console.error('Error running import:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;

