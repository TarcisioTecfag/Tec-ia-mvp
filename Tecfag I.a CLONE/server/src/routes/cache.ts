/**
 * Rotas administrativas para gerenciamento do cache
 */
import express, { Response } from 'express';
import { authenticate, adminOnly, AuthRequest } from '../middleware/auth';
import * as cacheService from '../services/ai/cacheService';

const router = express.Router();

// Aplicar autenticação em todas as rotas
router.use(authenticate);

/**
 * GET /api/cache/stats
 * Retorna estatísticas do cache
 */
router.get('/stats', adminOnly, async (req: AuthRequest, res: Response) => {
    try {
        const stats = await cacheService.getCacheStats();

        res.json({
            success: true,
            stats: {
                ...stats,
                config: cacheService.CacheConfig
            }
        });
    } catch (error: any) {
        console.error('[Cache] Error getting stats:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/cache/entries
 * Lista entradas recentes do cache (para debug)
 */
router.get('/entries', adminOnly, async (req: AuthRequest, res: Response) => {
    try {
        const limit = parseInt(req.query.limit as string) || 20;
        const entries = await cacheService.getRecentCacheEntries(limit);

        res.json({
            success: true,
            count: entries.length,
            entries
        });
    } catch (error: any) {
        console.error('[Cache] Error getting entries:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/cache/clear
 * Limpa todo o cache (admin only)
 */
router.post('/clear', adminOnly, async (req: AuthRequest, res: Response) => {
    try {
        const result = await cacheService.clearAllCache();

        console.log(`[Cache] Admin ${req.user?.email} cleared all cache`);

        res.json({
            success: true,
            message: 'Cache limpo com sucesso',
            deleted: result
        });
    } catch (error: any) {
        console.error('[Cache] Error clearing cache:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/cache/cleanup
 * Remove entradas expiradas do cache
 */
router.post('/cleanup', adminOnly, async (req: AuthRequest, res: Response) => {
    try {
        const deleted = await cacheService.cleanupExpiredCache();

        res.json({
            success: true,
            message: `${deleted} entradas expiradas removidas`,
            deleted
        });
    } catch (error: any) {
        console.error('[Cache] Error cleaning up cache:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * DELETE /api/cache/document/:documentId
 * Invalida cache relacionado a um documento específico
 */
router.delete('/document/:documentId', adminOnly, async (req: AuthRequest, res: Response) => {
    try {
        const { documentId } = req.params;
        const deleted = await cacheService.invalidateCacheByDocument(documentId);

        res.json({
            success: true,
            message: `${deleted} entradas de cache invalidadas para o documento`,
            deleted
        });
    } catch (error: any) {
        console.error('[Cache] Error invalidating document cache:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * DELETE /api/cache/catalog/:catalogId
 * Invalida cache relacionado a um catálogo específico
 */
router.delete('/catalog/:catalogId', adminOnly, async (req: AuthRequest, res: Response) => {
    try {
        const { catalogId } = req.params;
        const deleted = await cacheService.invalidateCacheByCatalog(catalogId);

        res.json({
            success: true,
            message: `${deleted} entradas de cache invalidadas para o catálogo`,
            deleted
        });
    } catch (error: any) {
        console.error('[Cache] Error invalidating catalog cache:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
