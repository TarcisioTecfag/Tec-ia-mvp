import { PrismaClient } from '@prisma/client';
import { cosineSimilarity } from './embeddings';

const prisma = new PrismaClient();

export interface VectorSearchResult {
    id: string;
    content: string;
    similarity: number;
    metadata: any;
    documentId: string;
    chunkIndex: number;
}

/**
 * Store document chunks with embeddings in the database
 */
export async function storeChunks(
    documentId: string,
    chunks: Array<{
        content: string;
        embedding: number[];
        chunkIndex: number;
        metadata?: any;
    }>
): Promise<void> {
    await prisma.documentChunk.createMany({
        data: chunks.map(chunk => ({
            documentId,
            content: chunk.content,
            chunkIndex: chunk.chunkIndex,
            embedding: JSON.stringify(chunk.embedding),
            metadata: chunk.metadata ? JSON.stringify(chunk.metadata) : null
        }))
    });
}

/**
 * Search for similar chunks using cosine similarity
 */
export async function searchSimilarChunks(
    queryEmbedding: number[],
    topK: number = 5,
    filters?: {
        documentId?: string;
        catalogId?: string;
    }
): Promise<VectorSearchResult[]> {
    // Get all chunks (with optional filters)
    const whereClause: any = {};

    if (filters?.documentId) {
        whereClause.documentId = filters.documentId;
    }

    if (filters?.catalogId) {
        whereClause.document = {
            OR: [
                { catalogId: filters.catalogId },
                { folderId: filters.catalogId }
            ]
        };
    }

    const chunks = await prisma.documentChunk.findMany({
        where: whereClause,
        include: {
            document: true
        }
    });

    // Calculate similarity for each chunk
    const results: VectorSearchResult[] = chunks.map(chunk => {
        const embedding = JSON.parse(chunk.embedding);
        const similarity = cosineSimilarity(queryEmbedding, embedding);

        return {
            id: chunk.id,
            content: chunk.content,
            similarity,
            metadata: chunk.metadata ? JSON.parse(chunk.metadata) : {},
            documentId: chunk.documentId,
            chunkIndex: chunk.chunkIndex
        };
    });

    // Sort by similarity (descending) and return top K
    return results
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, topK);
}

/**
 * Delete all chunks for a document
 */
export async function deleteDocumentChunks(documentId: string): Promise<void> {
    await prisma.documentChunk.deleteMany({
        where: { documentId }
    });
}

/**
 * Get chunks count for a document
 */
export async function getChunksCount(documentId: string): Promise<number> {
    return await prisma.documentChunk.count({
        where: { documentId }
    });
}

/**
 * Search by document - retrieves first chunks from each document for aggregation queries
 * This provides a high-level view of all available documents
 */
export async function searchByDocument(
    catalogId?: string,
    chunksPerDocument: number = 2
): Promise<VectorSearchResult[]> {
    const whereClause: any = {};

    if (catalogId) {
        whereClause.document = {
            OR: [
                { catalogId },
                { folderId: catalogId }
            ]
        };
    }

    // Get all unique documents
    const documents = await prisma.document.findMany({
        where: whereClause,
        select: {
            id: true,
            fileName: true,
        }
    });

    console.log(`[VectorDB] Found ${documents.length} documents for aggregation`);

    // Get first chunks from each document
    const results: VectorSearchResult[] = [];

    for (const doc of documents) {
        const chunks = await prisma.documentChunk.findMany({
            where: { documentId: doc.id },
            orderBy: { chunkIndex: 'asc' },
            take: chunksPerDocument,
            include: { document: true }
        });

        for (const chunk of chunks) {
            results.push({
                id: chunk.id,
                content: chunk.content,
                similarity: 0.5, // Default similarity for document-level fetch
                metadata: chunk.metadata ? JSON.parse(chunk.metadata) : { fileName: doc.fileName },
                documentId: chunk.documentId,
                chunkIndex: chunk.chunkIndex
            });
        }
    }

    return results;
}

/**
 * Get document statistics for aggregation queries
 */
export async function getDocumentStats(catalogId?: string): Promise<{
    totalDocuments: number;
    totalChunks: number;
    documentNames: string[];
}> {
    const whereClause: any = {};
    if (catalogId) {
        whereClause.OR = [
            { catalogId },
            { folderId: catalogId }
        ];
    }

    const documents = await prisma.document.findMany({
        where: whereClause,
        select: {
            id: true,
            fileName: true,
            _count: {
                select: { chunks: true }
            }
        }
    });

    return {
        totalDocuments: documents.length,
        totalChunks: documents.reduce((sum: number, d: { _count: { chunks: number } }) => sum + d._count.chunks, 0),
        documentNames: documents.map((d: { fileName: string }) => d.fileName)
    };
}

/**
 * Get ALL chunks from documents matching specific patterns
 * Used for aggregation/count queries where we need complete document context
 * This is the key difference vs NotebookLM - we now retrieve FULL documents
 */
export async function getFullDocumentChunks(
    documentPatterns: string[],
    catalogId?: string
): Promise<VectorSearchResult[]> {
    // Build OR conditions for document name patterns
    const patternConditions = documentPatterns.map(pattern => ({
        fileName: { contains: pattern }
    }));

    // If patterns provided, use OR condition. If empty, fetch ALL docs (no filter)
    const whereClause: any = {};

    if (patternConditions.length > 0) {
        whereClause.OR = patternConditions;
    }

    if (catalogId) {
        whereClause.OR = [
            ...(whereClause.OR || []),
            { catalogId },
            { folderId: catalogId }
        ];
    }

    // Find all matching documents
    const documents = await prisma.document.findMany({
        where: whereClause,
        select: {
            id: true,
            fileName: true,
        }
    });

    console.log(`[VectorDB] Full document retrieval: Found ${documents.length} matching documents for patterns: ${documentPatterns.join(', ')}`);

    const results: VectorSearchResult[] = [];

    // Get ALL chunks from each matching document (no limit!)
    for (const doc of documents) {
        const chunks = await prisma.documentChunk.findMany({
            where: { documentId: doc.id },
            orderBy: { chunkIndex: 'asc' },
            // ⚠️ NO LIMIT - retrieve ALL chunks for complete context
        });

        console.log(`[VectorDB] Retrieved ${chunks.length} chunks from "${doc.fileName}"`);

        for (const chunk of chunks) {
            results.push({
                id: chunk.id,
                content: chunk.content,
                similarity: 0.8, // High similarity for full document retrieval
                metadata: chunk.metadata ? JSON.parse(chunk.metadata) : { fileName: doc.fileName },
                documentId: chunk.documentId,
                chunkIndex: chunk.chunkIndex
            });
        }
    }

    console.log(`[VectorDB] Total chunks retrieved for aggregation: ${results.length}`);
    return results;
}

/**
 * Garante diversidade de documentos nos resultados
 * Seleciona os melhores chunks de pelo menos N documentos diferentes
 * Usado para queries de recomendação onde queremos múltiplas opções
 */
export function ensureDocumentDiversity(
    chunks: VectorSearchResult[],
    minDocuments: number = 5,
    maxChunksPerDoc: number = 3
): VectorSearchResult[] {
    const byDocument = new Map<string, VectorSearchResult[]>();

    // Agrupar por documento
    for (const chunk of chunks) {
        const docId = chunk.documentId;
        if (!byDocument.has(docId)) {
            byDocument.set(docId, []);
        }
        byDocument.get(docId)!.push(chunk);
    }

    console.log(`[VectorDB] ensureDocumentDiversity: ${byDocument.size} unique documents found`);

    const result: VectorSearchResult[] = [];

    // Pegar até maxChunksPerDoc de cada documento, priorizando por similarity
    for (const [docId, docChunks] of byDocument) {
        const topChunks = docChunks
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, maxChunksPerDoc);
        result.push(...topChunks);
    }

    // Ordenar resultado final por similarity
    return result.sort((a, b) => b.similarity - a.similarity);
}

/**
 * Perform keyword-based search for exact matches (SQL LIKE)
 * Essential for product codes like "VSF-30S" that embeddings might miss
 */
export async function searchByKeyword(
    keyword: string,
    limit: number = 5,
    filters?: {
        documentId?: string;
        catalogId?: string;
    }
): Promise<VectorSearchResult[]> {
    // Split keyword into terms and filter out short words
    const terms = keyword.split(' ')
        .map(t => t.trim())
        .filter(t => t.length > 2)
        .slice(0, 5); // Limit to 5 terms to avoid query explosion

    if (terms.length === 0) return [];

    const whereClause: any = {
        OR: terms.map(term => ({
            content: {
                contains: term
            }
        }))
    };

    if (filters?.documentId) {
        whereClause.documentId = filters.documentId;
    }

    if (filters?.catalogId) {
        whereClause.document = {
            OR: [
                { catalogId: filters.catalogId },
                { folderId: filters.catalogId }
            ]
        };
    }

    const chunks = await prisma.documentChunk.findMany({
        where: whereClause,
        take: limit,
        include: {
            document: true
        }
    });

    console.log(`[VectorDB] Keyword search for "${keyword}": found ${chunks.length} chunks (Terms: ${terms.join(', ')})`);

    return chunks.map(chunk => ({
        id: chunk.id,
        content: chunk.content,
        // Give keyword matches a boosted artificial similarity score
        // to ensure they appear high in results but below perfect semantic matches
        similarity: 0.85,
        metadata: chunk.metadata ? JSON.parse(chunk.metadata) : {},
        documentId: chunk.documentId,
        chunkIndex: chunk.chunkIndex
    }));
}


