/**
 * Multi-Query RAG - Sistema de recuperação avançada com múltiplas queries
 * 
 * Este módulo implementa:
 * 1. Geração de múltiplas sub-queries para perguntas complexas
 * 2. Fusão inteligente de resultados de múltiplas buscas
 * 3. Deduplicação de chunks recuperados
 * 4. Ranking por relevância combinada
 */

import { generateEmbedding } from './embeddings';
import { searchSimilarChunks, VectorSearchResult, searchByDocument, getFullDocumentChunks, searchByKeyword } from './vectorDB';
import { QueryAnalysis } from './queryAnalyzer';

export interface MultiQueryResult {
    chunks: VectorSearchResult[];
    uniqueDocuments: string[];
    totalChunksBeforeDedup: number;
    queryBreakdown: {
        query: string;
        chunksFound: number;
    }[];
}

/**
 * Executa busca multi-query para perguntas complexas
 */
export async function multiQuerySearch(
    originalQuestion: string,
    analysis: QueryAnalysis,
    catalogId?: string
): Promise<MultiQueryResult> {
    const allQueries = [originalQuestion, ...analysis.suggestedQueries];

    // ═══════════════════════════════════════════════════════════════
    // PRODUCT CODE EXPANSION: Handle format variations (VSF 30S vs VSF-30S)
    // ═══════════════════════════════════════════════════════════════
    const productCodeRegex = /\b([a-zA-Z]{2,})[\s-]?(\d+[a-zA-Z0-9]*)\b/g;
    let match;
    const additionalQueries: string[] = [];
    const keywordTargets: string[] = [];

    // Reset regex state since we might reuse it
    productCodeRegex.lastIndex = 0;

    while ((match = productCodeRegex.exec(originalQuestion)) !== null) {
        const prefix = match[1];
        const suffix = match[2];
        const fullMatch = match[0];

        // Generate variations:
        // 1. With hyphen: VSF-30S
        const withHyphen = `${prefix}-${suffix}`;
        // 2. With space: VSF 30S
        const withSpace = `${prefix} ${suffix}`;
        // 3. Compressed: VSF30S
        const compressed = `${prefix}${suffix}`;

        // Add variations that are different from original
        if (withHyphen !== fullMatch && !allQueries.includes(withHyphen)) additionalQueries.push(withHyphen);
        if (withSpace !== fullMatch && !allQueries.includes(withSpace)) additionalQueries.push(withSpace);
        if (compressed !== fullMatch && !allQueries.includes(compressed)) additionalQueries.push(compressed);

        // Add specific targets for KEYWORD SEARCH (Hybrid Search)
        keywordTargets.push(withHyphen);
        keywordTargets.push(withSpace);
        keywordTargets.push(compressed);

        console.log(`[MultiQueryRAG] 🔍 Detected product code "${fullMatch}". Added variations:`, additionalQueries);
    }

    // Add generated queries to execution list
    allQueries.push(...additionalQueries);

    const queryBreakdown: { query: string; chunksFound: number }[] = [];
    const allChunks: VectorSearchResult[] = [];
    const seenChunkIds = new Set<string>();

    console.log(`[MultiQueryRAG] Executing ${allQueries.length} queries...`);

    // Determinar chunks por query baseado no tipo
    const chunksPerQuery = Math.ceil(analysis.contextSize / Math.max(allQueries.length, 1));

    // Executar todas as queries em paralelo
    const queryPromises = allQueries.map(async (query) => {
        try {
            const embedding = await generateEmbedding(query);
            const chunks = await searchSimilarChunks(
                embedding,
                chunksPerQuery,
                catalogId ? { catalogId } : undefined
            );
            return { query, chunks };
        } catch (error) {
            console.error(`[MultiQueryRAG] Error for query "${query}":`, error);
            return { query, chunks: [] };
        }
    });

    const results = await Promise.all(queryPromises);

    // Processar resultados e deduplicar
    for (const { query, chunks } of results) {
        queryBreakdown.push({ query, chunksFound: chunks.length });

        for (const chunk of chunks) {
            if (!seenChunkIds.has(chunk.id)) {
                seenChunkIds.add(chunk.id);
                allChunks.push(chunk);
            }
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // HYBRID SEARCH: Execute Keyword Search for Product Codes
    // ═══════════════════════════════════════════════════════════════
    if (keywordTargets.length > 0) {
        console.log('[MultiQueryRAG] 🚀 Executing HYBRID KEYWORD SEARCH for targets:', keywordTargets);
        const keywordPromises = keywordTargets.map(async (kw) => {
            return searchByKeyword(kw, 3, catalogId ? { catalogId } : undefined);
        });

        const keywordResults = await Promise.all(keywordPromises);

        for (let i = 0; i < keywordTargets.length; i++) {
            const kw = keywordTargets[i];
            const chunks = keywordResults[i];

            if (chunks.length > 0) {
                console.log(`[MultiQueryRAG] ✅ Keyword match for "${kw}": found ${chunks.length} chunks`);
                queryBreakdown.push({ query: `[KW] ${kw}`, chunksFound: chunks.length });

                for (const chunk of chunks) {
                    // Boost score slightly for keyword matches to ensure they appear
                    chunk.similarity = Math.max(chunk.similarity, 0.85);

                    if (!seenChunkIds.has(chunk.id)) {
                        seenChunkIds.add(chunk.id);
                        allChunks.push(chunk);
                    }
                }
            }
        }
    }



    // ═══════════════════════════════════════════════════════════════
    // FULL DOCUMENT RETRIEVAL - Key improvement to match NotebookLM
    // For count/aggregation queries, we need ALL data from key documents
    // ═══════════════════════════════════════════════════════════════
    if (analysis.isCountQuery || analysis.requiresFullScan) {
        console.log('[MultiQueryRAG] 🎯 Count/Aggregation query detected - checking for MASTER LIST first');

        let fullDocChunks: VectorSearchResult[] = [];
        let usingMasterList = false;

        // 1. Try to find a "Master List" (Compilado) first to reduce context noise
        // This is a specific optimization for this use case where a master file exists
        if (analysis.isCountQuery) {
            const masterPatterns = ['compilado', 'master', 'geral', 'completo'];
            const masterChunks = await getFullDocumentChunks(masterPatterns, catalogId);

            // Check if we actually found a master list (roughly check chunk count or if docs found)
            if (masterChunks.length > 0 && masterChunks.length < 100) { // arbitrary sanity check
                console.log(`[MultiQueryRAG] ✅ MASTER LIST found (${masterChunks.length} chunks). Using it exclusively for count.`);
                fullDocChunks = masterChunks;
                usingMasterList = true;
            }
        }

        // 2. If no master list found (or not count query), do full scan
        if (!usingMasterList) {
            console.log('[MultiQueryRAG] No unique master list found or needed. Doing FULL SCAN.');

            // Patterns for documents that contain catalog/inventory data
            // IF it's a global count query, we want EVERYTHING (machine manuals, lists, etc)
            const catalogPatterns = analysis.isCountQuery
                ? [] // Empty array = fetch ALL documents
                : [
                    'planilha',
                    'catalogo',
                    'catálogo',
                    'mapeamento',
                    'lista',
                    'inventario',
                    'inventário',
                    'todas',
                    'completo'
                ];

            // Retrieve ALL chunks from matching documents
            fullDocChunks = await getFullDocumentChunks(catalogPatterns, catalogId);
        }

        console.log(`[MultiQueryRAG] Retrieved ${fullDocChunks.length} chunks via full document retrieval`);

        for (const chunk of fullDocChunks) {
            if (!seenChunkIds.has(chunk.id)) {
                seenChunkIds.add(chunk.id);
                allChunks.push(chunk);
            }
        }

        // Only fetch document summaries if we ARE NOT using the master list
        // (If we are using master list, we want to stay focused on it)
        if (!usingMasterList) {
            const docChunks = await fetchDocumentLevelData(catalogId);
            for (const chunk of docChunks) {
                if (!seenChunkIds.has(chunk.id)) {
                    seenChunkIds.add(chunk.id);
                    allChunks.push(chunk);
                }
            }
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // RECOMMENDATION QUERIES - Ensure document diversity for multi-options
    // ═══════════════════════════════════════════════════════════════
    if (analysis.type === 'recommendation') {
        console.log('[MultiQueryRAG] 🎯 Recommendation query detected - ensuring document DIVERSITY');

        // Patterns for machine/product documentation
        const productPatterns = [
            'AFPP',        // Empacotadoras
            'Diamond',     // Diamond pouches
            'envasadora',
            'seladora',
            'dosadora',
            'empacotadora',
            'pouch',
            'sachê',
            'sache'
        ];

        // Retrieve chunks from machine-related documents
        const productChunks = await getFullDocumentChunks(productPatterns, catalogId);
        console.log(`[MultiQueryRAG] Retrieved ${productChunks.length} chunks from product documents`);

        for (const chunk of productChunks) {
            if (!seenChunkIds.has(chunk.id)) {
                seenChunkIds.add(chunk.id);
                allChunks.push(chunk);
            }
        }
    }

    // For count queries, don't limit chunks - we need ALL data for accurate counting
    // This is key to matching NotebookLM's behavior
    // HOWEVER: We need to limit to avoid overwhelming the LLM (max ~40K tokens input)
    // UPDATE: Increased to 3000 chunks to support FULL database context (approx 750k tokens)
    const MAX_CHUNKS_FOR_AGGREGATION = 3000; // Effectively unlimited for current DB size (210 chunks)
    let sortedChunks: VectorSearchResult[];

    if (analysis.isCountQuery) {
        // For count queries, use all chunks sorted by chunkIndex to maintain document order
        sortedChunks = allChunks.sort((a, b) => {
            // First sort by documentId, then by chunkIndex
            if (a.documentId !== b.documentId) {
                return a.documentId.localeCompare(b.documentId);
            }
            return a.chunkIndex - b.chunkIndex;
        });

        // Apply limit to avoid LLM overwhelm
        if (sortedChunks.length > MAX_CHUNKS_FOR_AGGREGATION) {
            console.log(`[MultiQueryRAG] ⚠️ Count query: limiting from ${sortedChunks.length} to ${MAX_CHUNKS_FOR_AGGREGATION} chunks (LLM limit)`);
            sortedChunks = sortedChunks.slice(0, MAX_CHUNKS_FOR_AGGREGATION);
        } else {
            console.log(`[MultiQueryRAG] Count query: keeping ALL ${sortedChunks.length} chunks`);
        }
    } else {
        // For other queries, limit by contextSize and sort by similarity
        sortedChunks = allChunks
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, analysis.contextSize);
    }

    // Identificar documentos únicos
    const uniqueDocuments = [...new Set(sortedChunks.map(c => c.documentId))];

    console.log(`[MultiQueryRAG] Retrieved ${sortedChunks.length} unique chunks from ${uniqueDocuments.length} documents`);

    return {
        chunks: sortedChunks,
        uniqueDocuments,
        totalChunksBeforeDedup: allChunks.length,
        queryBreakdown,
    };
}

/**
 * Busca dados em nível de documento para agregações
 * Pega os primeiros chunks de cada documento para ter uma visão geral
 */
async function fetchDocumentLevelData(catalogId?: string): Promise<VectorSearchResult[]> {
    try {
        const docSummaries = await searchByDocument(catalogId);
        return docSummaries;
    } catch (error) {
        console.error('[MultiQueryRAG] Error fetching document-level data:', error);
        return [];
    }
}

/**
 * Agrupa chunks por documento fonte para melhor contexto
 */
export function groupChunksByDocument(chunks: VectorSearchResult[]): Map<string, VectorSearchResult[]> {
    const grouped = new Map<string, VectorSearchResult[]>();

    for (const chunk of chunks) {
        const docId = chunk.documentId;
        if (!grouped.has(docId)) {
            grouped.set(docId, []);
        }
        grouped.get(docId)!.push(chunk);
    }

    // Ordenar chunks dentro de cada documento por chunkIndex
    for (const [docId, docChunks] of grouped) {
        grouped.set(docId, docChunks.sort((a, b) => a.chunkIndex - b.chunkIndex));
    }

    return grouped;
}

/**
 * Formata contexto agrupado por documento para melhor compreensão
 */
export function formatGroupedContext(
    groupedChunks: Map<string, VectorSearchResult[]>
): string {
    const sections: string[] = [];
    let docIndex = 1;

    for (const [docId, chunks] of groupedChunks) {
        const fileName = chunks[0]?.metadata?.fileName || 'Documento';
        const content = chunks.map(c => c.content).join('\n\n');

        sections.push(
            `═══════════════════════════════════════════════════════════════\n` +
            `📄 DOCUMENTO ${docIndex}: ${fileName}\n` +
            `═══════════════════════════════════════════════════════════════\n` +
            `${content}`
        );
        docIndex++;
    }

    return sections.join('\n\n');
}

/**
 * Calcula score de cobertura para perguntas de agregação
 */
export function calculateCoverageScore(
    result: MultiQueryResult,
    expectedCategories: string[]
): number {
    if (expectedCategories.length === 0) {
        return result.uniqueDocuments.length > 5 ? 1.0 : result.uniqueDocuments.length / 5;
    }

    // Verificar quantas categorias foram cobertas
    const contentLower = result.chunks.map(c => c.content.toLowerCase()).join(' ');
    let covered = 0;

    for (const cat of expectedCategories) {
        if (contentLower.includes(cat)) {
            covered++;
        }
    }

    return covered / expectedCategories.length;
}
