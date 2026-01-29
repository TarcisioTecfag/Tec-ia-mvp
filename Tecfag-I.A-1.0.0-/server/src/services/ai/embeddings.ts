/**
 * Embedding Service
 * Usa gemini-embedding-001 via REST API com outputDimensionality: 768
 * para manter compatibilidade com embeddings existentes
 */

const EMBEDDING_MODEL = 'gemini-embedding-001';
const OUTPUT_DIMENSIONS = 768; // Compatível com embeddings existentes

interface EmbeddingResponse {
    embedding?: {
        values?: number[];
    };
}

/**
 * Generate embeddings for text using Gemini API REST endpoint
 */
export async function generateEmbedding(text: string): Promise<number[]> {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        throw new Error('GEMINI_API_KEY not configured');
    }

    try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${EMBEDDING_MODEL}:embedContent?key=${apiKey}`;

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: `models/${EMBEDDING_MODEL}`,
                content: {
                    parts: [{ text }]
                },
                outputDimensionality: OUTPUT_DIMENSIONS
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`API returned ${response.status}: ${JSON.stringify(errorData)}`);
        }

        const data = await response.json() as EmbeddingResponse;

        if (!data.embedding?.values) {
            throw new Error('Empty embedding returned');
        }

        console.log(`[Embedding] ✅ ${EMBEDDING_MODEL} (${data.embedding.values.length}D)`);
        return data.embedding.values;

    } catch (error: any) {
        console.error('[Embedding] Error:', error.message);
        throw new Error(`Failed to generate embedding: ${error.message}`);
    }
}

/**
 * Generate embeddings for multiple texts in batch
 */
export async function generateEmbeddingsBatch(texts: string[]): Promise<number[][]> {
    const embeddings: number[][] = [];

    // Process in batches of 10 to avoid rate limits
    const batchSize = 10;
    for (let i = 0; i < texts.length; i += batchSize) {
        const batch = texts.slice(i, i + batchSize);
        const batchEmbeddings = await Promise.all(
            batch.map(text => generateEmbedding(text))
        );
        embeddings.push(...batchEmbeddings);

        // Small delay to respect rate limits
        if (i + batchSize < texts.length) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }

    return embeddings;
}

/**
 * Calculate cosine similarity between two vectors
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) {
        throw new Error('Vectors must have the same length');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }

    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);

    if (normA === 0 || normB === 0) {
        return 0;
    }

    return dotProduct / (normA * normB);
}
