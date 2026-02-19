import { GoogleGenerativeAI } from '@google/generative-ai';
import { PrismaClient } from '@prisma/client';
import { generateEmbedding } from './embeddings';
import { searchSimilarChunks } from './vectorDB';
// z removal


const prisma = new PrismaClient();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const MODEL_NAME = 'gemini-2.5-flash'; // Synced with aiService.ts

interface MindmapNode {
    id: string;
    label: string;
    type: 'machine' | 'process' | 'parameter'; // Mapped to: Root/Problem, Action, Decision
}

interface MindmapEdge {
    from: string;
    to: string;
}

interface MindmapData {
    root: string;
    nodes: MindmapNode[];
    edges: MindmapEdge[];
}

/**
 * Core function to generate mindmap from ANY text context
 */
async function generateMindmapFromText(
    contextText: string,
    topic: string,
    userId: string
): Promise<MindmapData> {
    try {
        // 2. Construct Prompt
        const prompt = `
Você é um Engenheiro de Processos Sênior especialista em manutenção industrial.
Sua tarefa é analisar o texto técnico abaixo (extraído de um manual ou conversa técnica) e criar um FLUXOGRAMA LÓGICO para resolver o problema ou explicar o processo solicitado: "${topic}".

REGRAS DE ESTRUTURA (IMPORTANTE):
- O fluxograma deve ser uma árvore de decisão ou sequencial.
- Extraia "Problemas" (Raiz), "Verificações/Decisões" (Nós intermediários) e "Ações/Soluções" (Folhas).
- Identifique a Causa Raiz e suas Soluções.

MAPPING DE TIPOS (Use estritamente estes tipos):
- "machine": Use APENAS para o Nó Raiz (O problema principal ou nome do processo).
- "parameter": Use para DECISÕES, PERGUNTAS ou VERIFICAÇÕES (Ex: "O led está piscando?", "Temperatura > 180?").
- "process": Use para AÇÕES FÍSICAS ou SOLUÇÕES (Ex: "Trocar fusível", "Apertar parafuso", "Limpar sensor").

OUTPUT JSON ESTRITO:
Retorne APENAS um JSON válido com esta estrutura exata, sem markdown, sem explicações extras:
{
  "root": "Título do Fluxo",
  "nodes": [
    { "id": "1", "label": "Texto curto", "type": "machine" },
    { "id": "2", "label": "Texto curto", "type": "parameter" }
  ],
  "edges": [
    { "from": "1", "to": "2" }
  ]
}

CONTEXTO:
${contextText}
`;

        // 3. Call AI
        console.log(`[MindmapGenerator] Calling ${MODEL_NAME}...`);
        const model = genAI.getGenerativeModel({ model: MODEL_NAME });

        const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: {
                temperature: 0.2,
                responseMimeType: "application/json"
            }
        });

        const responseText = result.response.text();
        const usage = result.response.usageMetadata;

        // 4. Record Costs (MANDATORY)
        if (usage) {
            await prisma.tokenUsage.create({
                data: {
                    userId: userId,
                    model: MODEL_NAME,
                    requestType: 'mindmap_generation',
                    inputTokens: usage.promptTokenCount || 0,
                    outputTokens: usage.candidatesTokenCount || 0,
                    totalTokens: usage.totalTokenCount || 0
                }
            });
            console.log(`[MindmapGenerator] 💰 Cost recorded: ${usage.totalTokenCount} tokens`);
        }

        // 5. Parse and Validate
        let data: MindmapData;
        try {
            data = JSON.parse(responseText);
        } catch (e) {
            console.error('Failed to parse AI response:', responseText);
            throw new Error('A IA não retornou um formato válido. Tente novamente com um tópico mais específico.');
        }

        // Validate types
        data.nodes = data.nodes.map(node => ({
            ...node,
            type: ['machine', 'process', 'parameter'].includes(node.type) ? node.type : 'process'
        }));

        console.log(`[MindmapGenerator] Generated ${data.nodes.length} nodes and ${data.edges.length} edges`);
        return data;

    } catch (error: any) {
        console.error('[MindmapGenerator] Error:', error);
        throw error;
    }
}

/**
 * Generates mindmap from Document ID
 */
export async function generateMindmapFromDocument(
    documentId: string,
    topic: string,
    userId: string
): Promise<MindmapData> {
    console.log(`[MindmapGenerator] Generating from Document ${documentId}`);

    // 1. Retrieve relevant context from the document
    const searchQuery = `${topic} troubleshooting problemas defeitos solução de falhas passo a passo`;
    const embedding = await generateEmbedding(searchQuery);

    console.log(`[MindmapGenerator] Searching chunks in document ${documentId}...`);
    const chunks = await searchSimilarChunks(embedding, 15, { documentId });

    if (chunks.length === 0) {
        throw new Error('Nenhum conteúdo relevante encontrado no documento para este tópico.');
    }

    const contextText = chunks.map(c => c.content).join('\n\n---\n\n');

    return generateMindmapFromText(contextText, topic, userId);
}

/**
 * Generates mindmap from Chat History or Raw Text
 */
export async function generateMindmapFromContext(
    contextText: string,
    topic: string,
    userId: string
): Promise<MindmapData> {
    console.log(`[MindmapGenerator] Generating from Chat Context (len: ${contextText.length})`);
    if (!contextText || contextText.length < 10) {
        throw new Error("Contexto muito curto para gerar um mapa mental.");
    }
    return generateMindmapFromText(contextText, topic, userId);
}
