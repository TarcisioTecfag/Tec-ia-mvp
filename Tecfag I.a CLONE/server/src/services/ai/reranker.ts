/**
 * Reranker - Melhora a qualidade do retrieval usando Gemini para reordenar chunks
 * 
 * Este módulo implementa um reranking de dois estágios:
 * 1. Primeiro passa: similaridade coseno (rápido)
 * 2. Segunda passa: avaliação de relevância pelo LLM (preciso)
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export interface RankedChunk {
    id: string;
    content: string;
    originalSimilarity: number;
    llmRelevanceScore: number;
    combinedScore: number;
    documentId: string;
    chunkIndex: number;
    metadata: any;
}

/**
 * Rerank chunks using Gemini to evaluate relevance
 * This is the KEY improvement for matching NotebookLM quality
 */
export async function rerankChunks(
    question: string,
    chunks: Array<{
        id: string;
        content: string;
        similarity: number;
        documentId: string;
        chunkIndex: number;
        metadata: any;
    }>,
    topK: number = 30
): Promise<RankedChunk[]> {
    // Skip reranking if we have very few chunks
    if (chunks.length <= 5) {
        return chunks.map(c => ({
            ...c,
            originalSimilarity: c.similarity,
            llmRelevanceScore: c.similarity,
            combinedScore: c.similarity
        }));
    }

    console.log(`[Reranker] Reranking ${chunks.length} chunks for question: "${question.substring(0, 50)}..."`);

    try {
        // Take top candidates for reranking (limit to avoid token limits)
        const candidates = chunks.slice(0, Math.min(chunks.length, 50));

        // Build reranking prompt
        const chunkSummaries = candidates.map((c, i) =>
            `[CHUNK ${i + 1}] ${c.content.substring(0, 400)}...`
        ).join('\n\n');

        const prompt = `Você é um especialista em avaliar relevância de textos para responder perguntas.

PERGUNTA DO USUÁRIO:
"${question}"

TRECHOS DE DOCUMENTOS PARA AVALIAR:
${chunkSummaries}

TAREFA:
Para cada chunk, atribua uma pontuação de relevância de 1 a 10:
- 10: Diretamente responde a pergunta com informações específicas
- 7-9: Contém informações muito úteis para a resposta
- 4-6: Parcialmente relevante, pode complementar
- 1-3: Pouco ou nada relevante

Responda APENAS com um JSON array de scores na ordem dos chunks:
[score1, score2, score3, ...]`;

        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
        const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: {
                temperature: 0.1,
                maxOutputTokens: 500
            }
        });

        const responseText = result.response.text();

        // Parse scores from response
        const scoresMatch = responseText.match(/\[[\d,\s]+\]/);
        let scores: number[] = [];

        if (scoresMatch) {
            try {
                scores = JSON.parse(scoresMatch[0]);
            } catch (e) {
                console.warn('[Reranker] Failed to parse scores, using fallback');
                scores = candidates.map(() => 5);
            }
        } else {
            console.warn('[Reranker] No scores found in response, using fallback');
            scores = candidates.map(() => 5);
        }

        // Combine scores with original similarity
        const rankedChunks: RankedChunk[] = candidates.map((chunk, i) => {
            const llmScore = (scores[i] || 5) / 10; // Normalize to 0-1
            const combinedScore = (chunk.similarity * 0.4) + (llmScore * 0.6); // Weight LLM more

            return {
                id: chunk.id,
                content: chunk.content,
                originalSimilarity: chunk.similarity,
                llmRelevanceScore: llmScore,
                combinedScore: combinedScore,
                documentId: chunk.documentId,
                chunkIndex: chunk.chunkIndex,
                metadata: chunk.metadata
            };
        });

        // Sort by combined score
        rankedChunks.sort((a, b) => b.combinedScore - a.combinedScore);

        console.log(`[Reranker] ✅ Reranked ${rankedChunks.length} chunks. Top score: ${rankedChunks[0]?.combinedScore.toFixed(3)}`);

        // Return top K
        return rankedChunks.slice(0, topK);

    } catch (error: any) {
        console.error('[Reranker] Error during reranking:', error.message);
        // Fallback: return original order with default scores
        return chunks.slice(0, topK).map(c => ({
            ...c,
            originalSimilarity: c.similarity,
            llmRelevanceScore: c.similarity,
            combinedScore: c.similarity
        }));
    }
}

/**
 * Quick relevance check without full reranking
 * Useful for filtering obviously irrelevant chunks
 */
export function quickRelevanceFilter(
    question: string,
    content: string
): boolean {
    const questionTerms = question.toLowerCase().split(/\s+/).filter(t => t.length > 2);
    const contentLower = content.toLowerCase();

    // Check if at least some question terms appear in content
    const matchCount = questionTerms.filter(term => contentLower.includes(term)).length;

    return matchCount >= Math.min(2, questionTerms.length * 0.3);
}
