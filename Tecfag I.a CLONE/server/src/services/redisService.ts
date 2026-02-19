/**
 * Redis Service - Cache Distribuído de Alta Performance
 * 
 * Este serviço fornece uma abstração sobre o Redis (Memurai no Windows)
 * para cache de:
 * - Respostas RAG (query cache)
 * - Embeddings calculados
 * - Sessões de usuário
 * 
 * Benefícios:
 * - Cache em memória (microsegundos de latência)
 * - Não compete com o PostgreSQL por I/O
 * - Suporta TTL automático
 * - Preparado para múltiplas instâncias do servidor
 */

import Redis from 'ioredis';

// Configuração do Redis
const REDIS_CONFIG = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: 3,
    retryDelayOnFailover: 100,
    lazyConnect: true, // Não conecta automaticamente
};

// Prefixos para organizar as chaves
const PREFIXES = {
    QUERY_CACHE: 'cache:query:',
    EMBEDDING_CACHE: 'cache:embed:',
    SESSION: 'session:',
    RATE_LIMIT: 'ratelimit:',
};

// TTL padrão (em segundos)
const DEFAULT_TTL = {
    QUERY: 24 * 60 * 60,      // 24 horas para queries
    EMBEDDING: 7 * 24 * 60 * 60, // 7 dias para embeddings
    SESSION: 30 * 60,          // 30 minutos para sessões
    RATE_LIMIT: 60,            // 1 minuto para rate limiting
};

class RedisService {
    private client: Redis | null = null;
    private isConnected = false;
    private connectionPromise: Promise<void> | null = null;

    /**
     * Conecta ao Redis (lazy - só quando necessário)
     */
    async connect(): Promise<boolean> {
        if (this.isConnected && this.client) {
            return true;
        }

        if (this.connectionPromise) {
            await this.connectionPromise;
            return this.isConnected;
        }

        this.connectionPromise = this._doConnect();
        await this.connectionPromise;
        return this.isConnected;
    }

    private async _doConnect(): Promise<void> {
        try {
            this.client = new Redis(REDIS_CONFIG);

            // Eventos de conexão
            this.client.on('connect', () => {
                console.log('[Redis] ✅ Conectado ao Redis/Memurai');
                this.isConnected = true;
            });

            this.client.on('error', (err) => {
                console.error('[Redis] ❌ Erro de conexão:', err.message);
                this.isConnected = false;
            });

            this.client.on('close', () => {
                console.log('[Redis] 🔌 Conexão fechada');
                this.isConnected = false;
            });

            // Tenta conectar
            await this.client.connect();

            // Ping para verificar
            await this.client.ping();
            console.log('[Redis] 🏓 Ping OK - Cache Redis ativo');

        } catch (error: any) {
            console.warn('[Redis] ⚠️ Redis não disponível, usando fallback SQLite:', error.message);
            this.isConnected = false;
            this.client = null;
        }
    }

    /**
     * Verifica se Redis está disponível
     */
    isAvailable(): boolean {
        return this.isConnected && this.client !== null;
    }

    // ========== CACHE DE QUERIES RAG ==========

    /**
     * Busca resposta cacheada para uma query
     */
    async getQueryCache(queryHash: string): Promise<{ response: string; sources: string } | null> {
        if (!this.isAvailable()) return null;

        try {
            const key = PREFIXES.QUERY_CACHE + queryHash;
            const data = await this.client!.get(key);

            if (data) {
                // Incrementa hit count (fire and forget)
                this.client!.hincrby(key + ':meta', 'hits', 1);
                console.log(`[Redis] 🎯 Cache HIT para query: ${queryHash.substring(0, 8)}...`);
                return JSON.parse(data);
            }

            return null;
        } catch (error) {
            console.error('[Redis] Erro ao buscar cache:', error);
            return null;
        }
    }

    /**
     * Salva resposta no cache
     */
    async setQueryCache(
        queryHash: string,
        response: string,
        sources: string,
        ttlSeconds: number = DEFAULT_TTL.QUERY
    ): Promise<void> {
        if (!this.isAvailable()) return;

        try {
            const key = PREFIXES.QUERY_CACHE + queryHash;
            const data = JSON.stringify({ response, sources });

            await this.client!.setex(key, ttlSeconds, data);
            console.log(`[Redis] 💾 Cache SAVED para query: ${queryHash.substring(0, 8)}...`);
        } catch (error) {
            console.error('[Redis] Erro ao salvar cache:', error);
        }
    }

    // ========== CACHE DE EMBEDDINGS ==========

    /**
     * Busca embedding cacheado
     */
    async getEmbeddingCache(textHash: string): Promise<number[] | null> {
        if (!this.isAvailable()) return null;

        try {
            const key = PREFIXES.EMBEDDING_CACHE + textHash;
            const data = await this.client!.get(key);

            if (data) {
                return JSON.parse(data);
            }
            return null;
        } catch (error) {
            console.error('[Redis] Erro ao buscar embedding:', error);
            return null;
        }
    }

    /**
     * Salva embedding no cache
     */
    async setEmbeddingCache(
        textHash: string,
        embedding: number[],
        ttlSeconds: number = DEFAULT_TTL.EMBEDDING
    ): Promise<void> {
        if (!this.isAvailable()) return;

        try {
            const key = PREFIXES.EMBEDDING_CACHE + textHash;
            await this.client!.setex(key, ttlSeconds, JSON.stringify(embedding));
        } catch (error) {
            console.error('[Redis] Erro ao salvar embedding:', error);
        }
    }

    // ========== RATE LIMITING ==========

    /**
     * Verifica rate limit para um usuário/operação
     * Retorna true se ainda está dentro do limite
     */
    async checkRateLimit(
        userId: string,
        operation: string,
        maxRequests: number = 30,
        windowSeconds: number = 60
    ): Promise<{ allowed: boolean; remaining: number; resetIn: number }> {
        if (!this.isAvailable()) {
            return { allowed: true, remaining: maxRequests, resetIn: 0 };
        }

        try {
            const key = `${PREFIXES.RATE_LIMIT}${operation}:${userId}`;
            const current = await this.client!.incr(key);

            if (current === 1) {
                // Primeira requisição, define TTL
                await this.client!.expire(key, windowSeconds);
            }

            const ttl = await this.client!.ttl(key);
            const allowed = current <= maxRequests;
            const remaining = Math.max(0, maxRequests - current);

            if (!allowed) {
                console.warn(`[Redis] ⚠️ Rate limit excedido para ${userId} em ${operation}`);
            }

            return { allowed, remaining, resetIn: ttl };
        } catch (error) {
            console.error('[Redis] Erro em rate limit:', error);
            return { allowed: true, remaining: maxRequests, resetIn: 0 };
        }
    }

    // ========== CACHE GENÉRICO ==========

    /**
     * Get genérico
     */
    async get<T>(key: string): Promise<T | null> {
        if (!this.isAvailable()) return null;

        try {
            const data = await this.client!.get(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            return null;
        }
    }

    /**
     * Set genérico com TTL
     */
    async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
        if (!this.isAvailable()) return;

        try {
            const data = JSON.stringify(value);
            if (ttlSeconds) {
                await this.client!.setex(key, ttlSeconds, data);
            } else {
                await this.client!.set(key, data);
            }
        } catch (error) {
            console.error('[Redis] Erro ao salvar:', error);
        }
    }

    /**
     * Delete
     */
    async del(key: string): Promise<void> {
        if (!this.isAvailable()) return;

        try {
            await this.client!.del(key);
        } catch (error) {
            console.error('[Redis] Erro ao deletar:', error);
        }
    }

    /**
     * Limpa cache por padrão
     */
    async clearByPattern(pattern: string): Promise<number> {
        if (!this.isAvailable()) return 0;

        try {
            const keys = await this.client!.keys(pattern);
            if (keys.length > 0) {
                await this.client!.del(...keys);
                console.log(`[Redis] 🗑️ Limpou ${keys.length} chaves com padrão: ${pattern}`);
            }
            return keys.length;
        } catch (error) {
            console.error('[Redis] Erro ao limpar por padrão:', error);
            return 0;
        }
    }

    /**
     * Estatísticas do cache
     */
    async getStats(): Promise<{
        connected: boolean;
        keys: number;
        memory: string;
    }> {
        if (!this.isAvailable()) {
            return { connected: false, keys: 0, memory: '0B' };
        }

        try {
            const info = await this.client!.info('memory');
            const dbSize = await this.client!.dbsize();

            // Parse memory info
            const memMatch = info.match(/used_memory_human:(\S+)/);
            const memory = memMatch ? memMatch[1] : '0B';

            return {
                connected: true,
                keys: dbSize,
                memory,
            };
        } catch (error) {
            return { connected: false, keys: 0, memory: '0B' };
        }
    }

    /**
     * Desconecta do Redis
     */
    async disconnect(): Promise<void> {
        if (this.client) {
            await this.client.quit();
            this.client = null;
            this.isConnected = false;
            console.log('[Redis] 👋 Desconectado');
        }
    }
}

// Singleton
export const redisService = new RedisService();

// Conecta automaticamente ao importar
redisService.connect().catch(() => {
    console.log('[Redis] Iniciando sem Redis, usando fallback SQLite');
});

export default redisService;
