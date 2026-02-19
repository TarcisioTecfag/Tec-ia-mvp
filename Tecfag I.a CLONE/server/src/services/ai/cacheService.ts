/**
 * Cache Inteligente para RAG
 * 
 * Este serviço implementa um sistema de cache em TRÊS camadas:
 * 1. Redis (L1): Cache em memória, microsegundos de latência
 * 2. Cache Exato (L2): Match por hash MD5 da query no PostgreSQL
 * 3. Cache Semântico (L2): Match por similaridade de embedding (>0.95)
 * 
 * Também implementa cache de embeddings para evitar chamadas repetidas à API.
 */

import { PrismaClient } from '@prisma/client';
import { createHash } from 'crypto';
import { cosineSimilarity } from './embeddings';
import { redisService } from '../redisService';

const prisma = new PrismaClient();

// ═══════════════════════════════════════════════════════════════
// CONFIGURAÇÃO DO CACHE
// ═══════════════════════════════════════════════════════════════

export const CacheConfig = {
    semanticThreshold: 0.95,      // Similaridade mínima para cache hit semântico
    maxCacheAgeHours: 24,         // TTL padrão em horas
    maxCacheSize: 1000,           // Máximo de entradas no cache
    enableSemanticCache: true,    // Toggle para cache semântico
    enableEmbeddingCache: true,   // Toggle para cache de embeddings
    enableRedisCache: true,       // Toggle para cache Redis (L1)
};

// ═══════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════

interface CachedResponse {
    id: string;
    response: string;
    sources: any[];
    hitCount: number;
    createdAt: Date;
}

interface CacheStats {
    totalEntries: number;
    totalHits: number;
    avgHitCount: number;
    oldestEntry: Date | null;
    newestEntry: Date | null;
    embeddingCacheSize: number;
}

// ═══════════════════════════════════════════════════════════════
// UTILIDADES
// ═══════════════════════════════════════════════════════════════

/**
 * Gera hash MD5 de um texto para cache exato
 */
function generateHash(text: string): string {
    return createHash('md5').update(text.toLowerCase().trim()).digest('hex');
}

/**
 * Calcula data de expiração baseada na config
 */
function getExpirationDate(): Date {
    const now = new Date();
    now.setHours(now.getHours() + CacheConfig.maxCacheAgeHours);
    return now;
}

// ═══════════════════════════════════════════════════════════════
// CACHE DE RESPOSTAS RAG
// ═══════════════════════════════════════════════════════════════

/**
 * Busca resposta cacheada por match exato (hash)
 * Camada L1 (Redis) → Camada L2 (PostgreSQL)
 */
export async function getCachedResponseExact(
    query: string,
    catalogId?: string,
    userId?: string
): Promise<CachedResponse | null> {
    try {
        const queryHash = generateHash(query);

        // ========== L1: REDIS (microsegundos) ==========
        if (CacheConfig.enableRedisCache && redisService.isAvailable()) {
            const redisKey = `query:${catalogId || 'all'}:${userId || 'all'}:${queryHash}`;
            const redisCached = await redisService.getQueryCache(redisKey);

            if (redisCached) {
                console.log(`[Cache] ⚡ Redis L1 HIT for query hash: ${queryHash.substring(0, 8)}...`);
                return {
                    id: 'redis-' + queryHash,
                    response: redisCached.response,
                    sources: JSON.parse(redisCached.sources || '[]'),
                    hitCount: 0,
                    createdAt: new Date()
                };
            }
        }

        // ========== L2: POSTGRESQL (milissegundos) ==========
        const cached = await prisma.queryCache.findFirst({
            where: {
                queryHash,
                catalogId: catalogId || null,
                userId: userId || null,
                expiresAt: { gt: new Date() }
            }
        });

        if (cached) {
            console.log(`[Cache] ✅ PostgreSQL L2 HIT for query hash: ${queryHash.substring(0, 8)}...`);

            // Promover para Redis L1 (fire and forget)
            if (CacheConfig.enableRedisCache && redisService.isAvailable()) {
                const redisKey = `query:${catalogId || 'all'}:${userId || 'all'}:${queryHash}`;
                redisService.setQueryCache(redisKey, cached.response, cached.sources || '[]');
            }

            return {
                id: cached.id,
                response: cached.response,
                sources: JSON.parse(cached.sources || '[]'),
                hitCount: cached.hitCount,
                createdAt: cached.createdAt
            };
        }

        return null;
    } catch (error: any) {
        console.error(`[Cache] Error getting cached response:`, error.message);
        return null;
    }
}

/**
 * Busca resposta cacheada por similaridade semântica
 */
export async function getCachedResponseSemantic(
    queryEmbedding: number[],
    catalogId?: string,
    userId?: string,
    threshold: number = CacheConfig.semanticThreshold
): Promise<CachedResponse | null> {
    if (!CacheConfig.enableSemanticCache) {
        return null;
    }

    try {
        // Buscar todas as entradas válidas do cache para o catálogo
        const cachedEntries = await prisma.queryCache.findMany({
            where: {
                catalogId: catalogId || null,
                userId: userId || null,
                expiresAt: { gt: new Date() }
            },
            take: 100, // Limitar para performance
            orderBy: { lastUsed: 'desc' }
        });

        if (cachedEntries.length === 0) {
            return null;
        }

        // Calcular similaridade com cada entrada
        let bestMatch: { entry: typeof cachedEntries[0]; similarity: number } | null = null;

        for (const entry of cachedEntries) {
            try {
                const entryEmbedding = JSON.parse(entry.queryEmbedding);
                const similarity = cosineSimilarity(queryEmbedding, entryEmbedding);

                if (similarity >= threshold) {
                    if (!bestMatch || similarity > bestMatch.similarity) {
                        bestMatch = { entry, similarity };
                    }
                }
            } catch (e) {
                // Ignorar entradas com embedding inválido
                continue;
            }
        }

        if (bestMatch) {
            console.log(`[Cache] ✅ Semantic cache HIT (similarity: ${bestMatch.similarity.toFixed(3)}) for query`);
            return {
                id: bestMatch.entry.id,
                response: bestMatch.entry.response,
                sources: JSON.parse(bestMatch.entry.sources || '[]'),
                hitCount: bestMatch.entry.hitCount,
                createdAt: bestMatch.entry.createdAt
            };
        }

        return null;
    } catch (error: any) {
        console.error(`[Cache] Error getting semantic cached response:`, error.message);
        return null;
    }
}

/**
 * Registra um hit no cache (incrementa contador e atualiza lastUsed)
 */
export async function recordCacheHit(cacheId: string): Promise<void> {
    try {
        await prisma.queryCache.update({
            where: { id: cacheId },
            data: {
                hitCount: { increment: 1 },
                lastUsed: new Date()
            }
        });
    } catch (error: any) {
        console.warn(`[Cache] Error recording cache hit:`, error.message);
    }
}

/**
 * Salva resposta no cache (L1 Redis + L2 PostgreSQL)
 */
export async function cacheResponse(
    query: string,
    queryEmbedding: number[],
    response: string,
    sources: any[],
    documentIds: string[],
    catalogId?: string,
    userId?: string
): Promise<void> {
    try {
        const queryHash = generateHash(query);
        const expiresAt = getExpirationDate();
        const sourcesJson = JSON.stringify(sources);

        // ========== L1: SALVAR NO REDIS ==========
        if (CacheConfig.enableRedisCache && redisService.isAvailable()) {
            const redisKey = `query:${catalogId || 'all'}:${userId || 'all'}:${queryHash}`;
            const ttlSeconds = CacheConfig.maxCacheAgeHours * 60 * 60;
            await redisService.setQueryCache(redisKey, response, sourcesJson, ttlSeconds);
            console.log(`[Cache] ⚡ Redis L1 SAVED for query hash: ${queryHash.substring(0, 8)}...`);
        }

        // ========== L2: SALVAR NO POSTGRESQL ==========
        // Verificar limite de tamanho do cache
        const currentSize = await prisma.queryCache.count();
        if (currentSize >= CacheConfig.maxCacheSize) {
            // Remover entradas mais antigas
            await cleanupOldestEntries(Math.floor(CacheConfig.maxCacheSize * 0.1)); // Remove 10%
        }

        // Upsert para evitar duplicatas
        await prisma.queryCache.upsert({
            where: { queryHash },
            create: {
                queryText: query,
                queryHash,
                queryEmbedding: JSON.stringify(queryEmbedding),
                response,
                sources: sourcesJson,
                documentIds: JSON.stringify(documentIds),
                catalogId: catalogId || null,
                userId: userId || null,
                expiresAt,
                hitCount: 0
            },
            update: {
                response,
                sources: sourcesJson,
                queryEmbedding: JSON.stringify(queryEmbedding),
                documentIds: JSON.stringify(documentIds),
                expiresAt,
                lastUsed: new Date()
            }
        });

        console.log(`[Cache] 💾 PostgreSQL L2 SAVED for query hash: ${queryHash.substring(0, 8)}...`);
    } catch (error: any) {
        console.error(`[Cache] Error caching response:`, error.message);
    }
}

// ═══════════════════════════════════════════════════════════════
// CACHE DE EMBEDDINGS
// ═══════════════════════════════════════════════════════════════

/**
 * Busca embedding cacheado por texto (L1 Redis → L2 PostgreSQL)
 */
export async function getEmbeddingFromCache(text: string): Promise<number[] | null> {
    if (!CacheConfig.enableEmbeddingCache) {
        return null;
    }

    try {
        const textHash = generateHash(text);

        // ========== L1: REDIS ==========
        if (CacheConfig.enableRedisCache && redisService.isAvailable()) {
            const cached = await redisService.getEmbeddingCache(textHash);
            if (cached) {
                console.log(`[Cache] ⚡ Redis L1 Embedding HIT`);
                return cached;
            }
        }

        // ========== L2: POSTGRESQL ==========
        const cached = await prisma.embeddingCache.findUnique({
            where: { textHash }
        });

        if (cached) {
            console.log(`[Cache] ✅ PostgreSQL L2 Embedding HIT`);
            const embedding = JSON.parse(cached.embedding);

            // Promover para Redis L1
            if (CacheConfig.enableRedisCache && redisService.isAvailable()) {
                redisService.setEmbeddingCache(textHash, embedding);
            }

            return embedding;
        }

        return null;
    } catch (error: any) {
        console.error(`[Cache] Error getting cached embedding:`, error.message);
        return null;
    }
}

/**
 * Salva embedding no cache (L1 Redis + L2 PostgreSQL)
 */
export async function cacheEmbedding(text: string, embedding: number[]): Promise<void> {
    if (!CacheConfig.enableEmbeddingCache) {
        return;
    }

    try {
        const textHash = generateHash(text);

        // ========== L1: SALVAR NO REDIS ==========
        if (CacheConfig.enableRedisCache && redisService.isAvailable()) {
            await redisService.setEmbeddingCache(textHash, embedding);
        }

        // ========== L2: SALVAR NO POSTGRESQL ==========
        await prisma.embeddingCache.upsert({
            where: { textHash },
            create: {
                textHash,
                embedding: JSON.stringify(embedding)
            },
            update: {
                embedding: JSON.stringify(embedding)
            }
        });

        console.log(`[Cache] 💾 Cached embedding (L1+L2) for text hash: ${textHash.substring(0, 8)}...`);
    } catch (error: any) {
        console.error(`[Cache] Error caching embedding:`, error.message);
    }
}

// ═══════════════════════════════════════════════════════════════
// INVALIDAÇÃO DE CACHE
// ═══════════════════════════════════════════════════════════════

/**
 * Invalida cache relacionado a um documento específico
 */
export async function invalidateCacheByDocument(documentId: string): Promise<number> {
    try {
        // Buscar e deletar entradas que usam este documento
        const entries = await prisma.queryCache.findMany({
            where: {
                documentIds: { contains: documentId }
            },
            select: { id: true }
        });

        if (entries.length > 0) {
            await prisma.queryCache.deleteMany({
                where: {
                    id: { in: entries.map(e => e.id) }
                }
            });
            console.log(`[Cache] 🗑️ Invalidated ${entries.length} cache entries for document ${documentId.substring(0, 8)}...`);
        }

        return entries.length;
    } catch (error: any) {
        console.error(`[Cache] Error invalidating cache by document:`, error.message);
        return 0;
    }
}

/**
 * Invalida todo o cache de um catálogo
 */
export async function invalidateCacheByCatalog(catalogId: string): Promise<number> {
    try {
        const result = await prisma.queryCache.deleteMany({
            where: { catalogId }
        });
        console.log(`[Cache] 🗑️ Invalidated ${result.count} cache entries for catalog ${catalogId.substring(0, 8)}...`);
        return result.count;
    } catch (error: any) {
        console.error(`[Cache] Error invalidating cache by catalog:`, error.message);
        return 0;
    }
}

/**
 * Invalida todo o cache de um usuário específico
 */
export async function invalidateCacheByUser(userId: string): Promise<number> {
    try {
        // Clear PostgreSQL L2 cache
        const result = await prisma.queryCache.deleteMany({
            where: { userId }
        });

        let redisCleared = 0;
        // Clear Redis L1 cache
        if (CacheConfig.enableRedisCache && redisService.isAvailable()) {
            // Pattern: cache:query:query:${catalogId}:${userId}:${hash}
            // We use * for catalogId and hash
            const pattern = `cache:query:query:*:${userId}:*`;
            redisCleared = await redisService.clearByPattern(pattern);
        }

        console.log(`[Cache] 🗑️ Invalidated ${result.count} DB entries and ${redisCleared} Redis keys for user ${userId.substring(0, 8)}...`);
        return result.count + redisCleared;
    } catch (error: any) {
        console.error(`[Cache] Error invalidating cache by user:`, error.message);
        return 0;
    }
}

/**
 * Limpa todo o cache (L1 Redis + L2 PostgreSQL)
 */
export async function clearAllCache(): Promise<{ queries: number; embeddings: number; redis: number }> {
    try {
        // ========== L1: LIMPAR REDIS ==========
        let redisCleared = 0;
        if (CacheConfig.enableRedisCache && redisService.isAvailable()) {
            const queryCleared = await redisService.clearByPattern('cache:query:*');
            const embedCleared = await redisService.clearByPattern('cache:embed:*');
            redisCleared = queryCleared + embedCleared;
            console.log(`[Cache] ⚡ Redis L1 cleared: ${redisCleared} keys`);
        }

        // ========== L2: LIMPAR POSTGRESQL ==========
        const queriesResult = await prisma.queryCache.deleteMany();
        const embeddingsResult = await prisma.embeddingCache.deleteMany();

        console.log(`[Cache] 🗑️ Cleared all cache: ${queriesResult.count} queries, ${embeddingsResult.count} embeddings, ${redisCleared} Redis keys`);

        return {
            queries: queriesResult.count,
            embeddings: embeddingsResult.count,
            redis: redisCleared
        };
    } catch (error: any) {
        console.error(`[Cache] Error clearing cache:`, error.message);
        return { queries: 0, embeddings: 0, redis: 0 };
    }
}

// ═══════════════════════════════════════════════════════════════
// MANUTENÇÃO DO CACHE
// ═══════════════════════════════════════════════════════════════

/**
 * Remove entradas expiradas do cache
 */
export async function cleanupExpiredCache(): Promise<number> {
    try {
        const result = await prisma.queryCache.deleteMany({
            where: {
                expiresAt: { lt: new Date() }
            }
        });

        if (result.count > 0) {
            console.log(`[Cache] 🧹 Cleaned up ${result.count} expired cache entries`);
        }

        return result.count;
    } catch (error: any) {
        console.error(`[Cache] Error cleaning up expired cache:`, error.message);
        return 0;
    }
}

/**
 * Remove as entradas mais antigas do cache (LRU)
 */
async function cleanupOldestEntries(count: number): Promise<number> {
    try {
        const oldest = await prisma.queryCache.findMany({
            orderBy: { lastUsed: 'asc' },
            take: count,
            select: { id: true }
        });

        if (oldest.length > 0) {
            await prisma.queryCache.deleteMany({
                where: {
                    id: { in: oldest.map(e => e.id) }
                }
            });
            console.log(`[Cache] 🧹 Removed ${oldest.length} oldest cache entries (LRU)`);
        }

        return oldest.length;
    } catch (error: any) {
        console.error(`[Cache] Error cleaning up oldest entries:`, error.message);
        return 0;
    }
}

// ═══════════════════════════════════════════════════════════════
// ESTATÍSTICAS
// ═══════════════════════════════════════════════════════════════

/**
 * Retorna estatísticas do cache
 */
export async function getCacheStats(): Promise<CacheStats> {
    try {
        const queryCount = await prisma.queryCache.count();
        const embeddingCount = await prisma.embeddingCache.count();

        const aggregations = await prisma.queryCache.aggregate({
            _sum: { hitCount: true },
            _avg: { hitCount: true },
            _min: { createdAt: true },
            _max: { createdAt: true }
        });

        return {
            totalEntries: queryCount,
            totalHits: aggregations._sum.hitCount || 0,
            avgHitCount: aggregations._avg.hitCount || 0,
            oldestEntry: aggregations._min.createdAt,
            newestEntry: aggregations._max.createdAt,
            embeddingCacheSize: embeddingCount
        };
    } catch (error: any) {
        console.error(`[Cache] Error getting cache stats:`, error.message);
        return {
            totalEntries: 0,
            totalHits: 0,
            avgHitCount: 0,
            oldestEntry: null,
            newestEntry: null,
            embeddingCacheSize: 0
        };
    }
}

/**
 * Retorna entradas recentes do cache (para debug)
 */
export async function getRecentCacheEntries(limit: number = 20): Promise<any[]> {
    try {
        const entries = await prisma.queryCache.findMany({
            orderBy: { lastUsed: 'desc' },
            take: limit,
            select: {
                id: true,
                queryText: true,
                hitCount: true,
                catalogId: true,
                createdAt: true,
                lastUsed: true,
                expiresAt: true
            }
        });

        return entries.map(e => ({
            ...e,
            queryText: e.queryText.substring(0, 50) + (e.queryText.length > 50 ? '...' : '')
        }));
    } catch (error: any) {
        console.error(`[Cache] Error getting recent entries:`, error.message);
        return [];
    }
}
