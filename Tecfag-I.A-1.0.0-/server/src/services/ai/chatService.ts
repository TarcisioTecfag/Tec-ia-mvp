import { GoogleGenerativeAI } from '@google/generative-ai';
import { generateEmbedding } from './embeddings';
import { searchSimilarChunks, getDocumentStats } from './vectorDB';
import { analyzeQuery, generateAggregationPrompt, QueryAnalysis } from './queryAnalyzer';
import { multiQuerySearch, groupChunksByDocument, formatGroupedContext } from './multiQueryRAG';
import { rerankChunks } from './reranker';
import * as sessionMemory from './sessionMemory';
import * as cacheService from './cacheService';
import Groq from 'groq-sdk';
import notificationService from '../notificationService';
import { prisma } from '../../config/database';
import * as path from 'path';

// Gemini 2.5 Flash como provider principal, Groq como fallback
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || 'dummy' });

// Modelo principal: Gemini 2.5 Flash
const GEMINI_MODEL = 'gemini-2.5-flash';
const GROQ_MODEL = 'llama-3.3-70b-versatile';

export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

export interface ChatResponse {
    response: string;
    sources: Array<{
        fileName: string;
        chunkIndex: number;
        similarity: number;
    }>;
    tokenUsage?: {
        inputTokens: number;
        outputTokens: number;
        totalTokens: number;
        model: string;
    };
    fromCache?: boolean;  // Indica se a resposta veio do cache
}

export interface UserProfile {
    userId?: string;  // Required for session context
    name?: string;
    jobTitle?: string;
    department?: string;
    technicalLevel?: string;
    communicationStyle?: string;
}

/**
 * Generate a greeting response without RAG (for simple greetings)
 */
function generateGreetingResponse(question: string, mode: string): string {
    const lowerQ = question.toLowerCase().trim();

    // Detect time-based greetings
    const hour = new Date().getHours();
    let timeGreeting = 'Olá';
    if (hour >= 5 && hour < 12) timeGreeting = 'Bom dia';
    else if (hour >= 12 && hour < 18) timeGreeting = 'Boa tarde';
    else timeGreeting = 'Boa noite';

    // Professional mode greeting
    if (mode === 'professional') {
        return `${timeGreeting}! Sou o assistente comercial da Tecfag. Como posso ajudá-lo hoje com nossas soluções de equipamentos e automação?`;
    }

    // Casual mode greeting
    if (mode === 'casual') {
        return `${timeGreeting}! 👋 Tudo bem? Estou aqui para ajudar com qualquer dúvida sobre os produtos e soluções da Tecfag. O que precisa?`;
    }

    // Direct mode greeting
    if (mode === 'direct') {
        return `${timeGreeting}. Como posso ajudar?`;
    }

    // Educational/default greeting
    return `${timeGreeting}! Sou o assistente técnico da Tecfag. Estou aqui para ajudar com informações sobre nossos equipamentos, especificações técnicas e orientações. Como posso ajudá-lo hoje?`;
}

/**
 * Answer a question using RAG (Retrieval Augmented Generation)
 */
export async function answerQuestion(
    question: string,
    catalogId?: string,
    chatHistory: ChatMessage[] = [],
    mode: 'direct' | 'casual' | 'educational' | 'professional' = 'educational',
    isTableMode: boolean = false,
    userProfile?: UserProfile,
    isAttachmentMode: boolean = false
): Promise<ChatResponse> {
    try {
        console.log(`[ChatService] Processing question: ${question.substring(0, 50)}... (Mode: ${mode}, Provider: Gemini 2.5 Flash, Attachment: ${isAttachmentMode})`);

        // ═══════════════════════════════════════════════════════════════
        // SESSION CONTEXT: Process user context for memory-aware responses
        // ═══════════════════════════════════════════════════════════════
        let contextInstruction = '';
        if (userProfile?.userId) {
            try {
                const responseFormat = isTableMode ? 'table' : 'normal';
                const { contextInstruction: ctxInst } = await sessionMemory.processMessageContext(
                    userProfile.userId,
                    question,
                    responseFormat
                );
                contextInstruction = ctxInst;
                console.log(`[ChatService] Session context loaded for user ${userProfile.userId}`);
            } catch (ctxError: any) {
                console.warn(`[ChatService] Session context error (non-fatal): ${ctxError.message}`);
            }
        }

        // ═══════════════════════════════════════════════════════════════
        // ADVANCED RAG: Step 1 - Analyze the query to determine strategy
        // ═══════════════════════════════════════════════════════════════
        const queryAnalysis = analyzeQuery(question);

        console.log(`[ChatService] Query Analysis:`, {
            type: queryAnalysis.type,
            contextSize: queryAnalysis.contextSize,
            needsMultiQuery: queryAnalysis.needsMultiQuery,
            isCountQuery: queryAnalysis.isCountQuery,
            categories: queryAnalysis.categories
        });

        // Handle greetings without RAG
        if (queryAnalysis.type === 'greeting') {
            return {
                response: generateGreetingResponse(question, mode),
                sources: []
            };
        }

        // ═══════════════════════════════════════════════════════════════
        // CACHE CHECK: Step 1.5 - Check for cached response
        // ═══════════════════════════════════════════════════════════════
        // First, check exact cache (by hash)
        const cachedExact = await cacheService.getCachedResponseExact(question, catalogId);
        if (cachedExact) {
            console.log(`[ChatService] 🚀 Returning CACHED response (exact match)`);
            await cacheService.recordCacheHit(cachedExact.id);
            return {
                response: cachedExact.response,
                sources: cachedExact.sources,
                fromCache: true
            };
        }

        // ═══════════════════════════════════════════════════════════════
        // ADVANCED RAG: Step 2 - Multi-query search or standard search
        // ═══════════════════════════════════════════════════════════════
        let relevantChunks;
        let searchMetadata = '';

        if (queryAnalysis.needsMultiQuery) {
            // Use advanced multi-query RAG for aggregation/exploratory queries
            console.log(`[ChatService] Using Multi-Query RAG (${queryAnalysis.suggestedQueries.length + 1} queries)`);

            const multiResult = await multiQuerySearch(question, queryAnalysis, catalogId);
            relevantChunks = multiResult.chunks;

            // Add metadata about the search for better context
            searchMetadata = `
📊 INFORMAÇÃO DO SISTEMA (use para contexto):
- Foram consultados ${multiResult.uniqueDocuments.length} documentos diferentes
- Recuperados ${multiResult.chunks.length} trechos relevantes
- Queries executadas: ${multiResult.queryBreakdown.map(q => q.query).slice(0, 3).join(', ')}...
`;

            // For count queries, also get document stats
            if (queryAnalysis.isCountQuery) {
                const stats = await getDocumentStats(catalogId);
                searchMetadata += `
📈 ESTATÍSTICAS DA BASE:
- Total de documentos indexados: ${stats.totalDocuments}
- Total de chunks na base: ${stats.totalChunks}
- Documentos: ${stats.documentNames.slice(0, 10).join(', ')}${stats.documentNames.length > 10 ? '...' : ''}
`;
            }
        } else {
            // Standard semantic search for factual queries
            // First check embedding cache
            let questionEmbedding = await cacheService.getEmbeddingFromCache(question);
            if (!questionEmbedding) {
                questionEmbedding = await generateEmbedding(question);
                await cacheService.cacheEmbedding(question, questionEmbedding);
            }

            // Check semantic cache before doing full RAG
            const cachedSemantic = await cacheService.getCachedResponseSemantic(questionEmbedding, catalogId);
            if (cachedSemantic) {
                console.log(`[ChatService] 🚀 Returning CACHED response (semantic match)`);
                await cacheService.recordCacheHit(cachedSemantic.id);
                return {
                    response: cachedSemantic.response,
                    sources: cachedSemantic.sources,
                    fromCache: true
                };
            }

            relevantChunks = await searchSimilarChunks(
                questionEmbedding,
                queryAnalysis.contextSize,
                catalogId ? { catalogId } : undefined
            );
        }

        console.log(`[ChatService] Found ${relevantChunks.length} relevant chunks`);

        // ═══════════════════════════════════════════════════════════════
        // RERANKING: Use Gemini to reorder chunks by relevance
        // This is KEY for matching NotebookLM quality
        // ═══════════════════════════════════════════════════════════════
        if (relevantChunks.length > 10 &&
            (queryAnalysis.type === 'recommendation' || queryAnalysis.type === 'exploratory' || queryAnalysis.type === 'comparative')) {
            console.log(`[ChatService] 🎯 Applying reranking for ${queryAnalysis.type} query...`);
            try {
                const rerankedChunks = await rerankChunks(question, relevantChunks, Math.min(relevantChunks.length, 50));
                // Convert back to expected format
                relevantChunks = rerankedChunks.map(rc => ({
                    id: rc.id,
                    content: rc.content,
                    similarity: rc.combinedScore, // Use combined score
                    metadata: rc.metadata,
                    documentId: rc.documentId,
                    chunkIndex: rc.chunkIndex
                }));
                console.log(`[ChatService] ✅ Reranking complete. Top chunk score: ${relevantChunks[0]?.similarity.toFixed(3)}`);
            } catch (rerankError: any) {
                console.warn(`[ChatService] ⚠️ Reranking failed, using original order: ${rerankError.message}`);
            }
        }

        // Log chunk distribution for debugging
        const chunksByDoc = new Map<string, number>();
        for (const chunk of relevantChunks) {
            const fileName = chunk.metadata?.fileName || 'Unknown';
            chunksByDoc.set(fileName, (chunksByDoc.get(fileName) || 0) + 1);
        }
        console.log(`[ChatService] Chunk distribution:`, Object.fromEntries(chunksByDoc));

        if (relevantChunks.length === 0) {
            return {
                response: 'Não encontrei informações suficientes nos documentos para responder sua pergunta com a profundidade necessária. Tente adicionar mais documentos relacionados ou reformule a pergunta.',
                sources: []
            };
        }

        // ═══════════════════════════════════════════════════════════════
        // ADVANCED RAG: Step 3 - Build context (grouped by document for aggregation)
        // ═══════════════════════════════════════════════════════════════
        let context: string;

        if (queryAnalysis.type === 'aggregation' || queryAnalysis.type === 'exploratory') {
            // Group chunks by document for better understanding
            const groupedChunks = groupChunksByDocument(relevantChunks);
            context = formatGroupedContext(groupedChunks);
        } else {
            // Standard context formatting for factual queries
            context = relevantChunks
                .map((chunk, index) => {
                    const metadata = chunk.metadata || {};
                    return `[ID: ${index + 1} | Fonte: ${metadata.fileName || 'Documento'}]
${chunk.content}`;
                })
                .join('\n\n---\n\n');
        }

        // Add aggregation-specific prompt if needed
        const aggregationPrompt = generateAggregationPrompt(question, queryAnalysis);

        // Add recommendation-specific prompt for multi-option responses
        const recommendationPrompt = queryAnalysis.type === 'recommendation' ? `
📍 **PERGUNTA DE RECOMENDAÇÃO DETECTADA**
Esta pergunta pede uma RECOMENDAÇÃO de equipamento/máquina. Siga estas regras OBRIGATÓRIAS:

1. **IDENTIFICAÇÃO DO PRODUTO** (SE NÃO ESPECIFICADO):
   - Se a pergunta não especificar CLARAMENTE o tipo de produto (pó, líquido, grão, pastoso), o formato desejado (sachê stick, sachê 3 soldas, pouch, etc.), ou o volume de produção, PERGUNTE PRIMEIRO antes de recomendar.
   - Exemplo: "Para recomendar a máquina ideal, preciso saber: qual tipo de produto será embalado (pó, grãos, líquido)? Qual o formato de sachê desejado?"

2. **MÚLTIPLAS OPÇÕES (OBRIGATÓRIO)**:
   - SEMPRE apresente pelo menos **3-4 opções de máquinas diferentes**, organizadas por categoria/aplicação.
   - Use formatação estruturada com headers para cada categoria:
     ### 1. Para Sachês tipo [Tipo] (Aplicação)
     - **Modelo**: [Nome da máquina]
     - **Dosagem**: [Faixa em g ou ml]
     - **Produtividade**: [embalagens/min]
     - **Tipo de Selagem**: [descrição]
   
3. **COMPARAÇÃO PRÁTICA**:
   - Ao final, compare brevemente QUANDO cada opção é mais indicada.
   - Adicione uma "Dica de Especialista" BREVE (máximo 2-3 linhas) - NÃO domine a resposta com metodologia SPICED.

4. **PRIORIZE ESPECIFICAÇÕES TÉCNICAS**:
   - Foque em informações objetivas: capacidade, produtividade, tipo de selagem.
   - NÃO use metodologia SPICED para perguntas de recomendação técnica.
   - Seja como um catálogo técnico interativo, não um vendedor.

303: EXEMPLO DE ESTRUTURA ESPERADA:
"Para recomendar a máquina ideal para embalar e envasar sachê, identifiquei as seguintes opções com base no tipo de produto:

### 1. Para Sachês tipo Stick (Pós)
- **Modelo**: AFPP2830B
- **Dosagem**: 10 a 30g
- **Produtividade**: 25 a 35 emb/min
- **Selagem**: 3 soldas

### 2. Para Sachês Tradicionais (Pós/Granulados)
[...]

### Qual escolher?
- Se o produto for pó fino: opte pela AFPP2830B
- Se precisar de sachês com 4 soldas: AFPP1528A
[...]"` : '';

        // Build User Profile Context
        let userProfileContext = '';
        if (userProfile) {
            userProfileContext = `
PERFIL DO USUÁRIO (Personalize a resposta para esta pessoa):
- Nome: ${userProfile.name || 'Desconhecido'}
- Cargo: ${userProfile.jobTitle || 'Não informado'}
- Departamento: ${userProfile.department || 'Não informado'}
- Nível Técnico: ${userProfile.technicalLevel || 'Padrão'}
- Estilo Preferido: ${userProfile.communicationStyle || 'Padrão'}

INSTRUÇÃO DE PERSONALIZAÇÃO:
- Adapte o vocabulário e a profundidade técnica ao Nível Técnico do usuário.
- Dê exemplos relevantes ao Cargo e Departamento do usuário.
- Se o estilo for "Visual", use muitas listas e tabelas.
- Se o estilo for "Direto", seja extremamente conciso.
- Responda como se estivesse falando diretamente para esta pessoa específica.
`;
        }

        // 4. Build prompt based on Mode
        let systemPrompt = '';

        const baseContext = `
REGRAS DE FONTE (RAG) - LEIA COM ATENÇÃO:

📌 REGRA PRINCIPAL - USO EXCLUSIVO DOS DOCUMENTOS:
- Baseie sua resposta ESTRITAMENTE nos documentos fornecidos abaixo.
- NÃO invente informações que não estejam nos documentos.
- NÃO busque informações na internet, web, ou qualquer fonte externa.
- NÃO use seu conhecimento prévio de treinamento para complementar respostas.
- Toda informação na sua resposta DEVE vir dos documentos anexados abaixo.

📌 REGRA CRÍTICA - USE TODOS OS DOCUMENTOS:
- Você tem acesso a TODOS os documentos relevantes para esta pergunta.
- NUNCA diga que informações não estavam nos "documentos iniciais" - esse termo não existe.
- NUNCA invente limitações sobre quais documentos você tem acesso.
- Se a informação está em QUALQUER documento fornecido, você DEVE incluí-la na resposta.
- Analise TODOS os trechos fornecidos antes de responder.

📌 REGRA DE TRANSPARÊNCIA - QUANDO INFORMAÇÃO NÃO EXISTE:
- Se após analisar TODOS os documentos fornecidos você não encontrar a informação solicitada, diga claramente:
  "Não encontrei informações sobre [tema] nos documentos cadastrados no sistema. Pode ser que esse conteúdo ainda não tenha sido adicionado à base de conhecimento."
- Seja específico sobre O QUE não foi encontrado, não generalize.
- NUNCA use a desculpa de "documentos iniciais" ou "primeiros documentos".

📌 CITAÇÃO DE FONTES:
- NÃO cite as fontes no texto da resposta (ex: "Segundo documento X").
- As fontes serão apresentadas separadamente pela interface do sistema.

${userProfileContext}
${searchMetadata}
${aggregationPrompt}
${recommendationPrompt}
${contextInstruction}

DOCUMENTOS DE REFERÊNCIA (USE TODO O CONTEÚDO ABAIXO):
${context}`;

        // ═══════════════════════════════════════════════════════════════
        // IMAGE LINKING: Find relevant images in chunks and append to response
        // ═══════════════════════════════════════════════════════════════
        let imageAppendix = '';

        // Only process images if attachment mode is active
        if (isAttachmentMode) {
            const imageChunks = relevantChunks.filter(c => c.metadata?.isImage === true);

            if (imageChunks.length > 0) {
                console.log(`[ChatService] 🖼️ Found ${imageChunks.length} image chunks relevant to query`);

                // Deduplicate images by normalized filename (case-insensitive, URL-decoded)
                const uniqueImages = new Set<string>();
                const images: Array<{ fileName: string, storedName: string }> = [];

                for (const chunk of imageChunks) {
                    const fileName = chunk.metadata.fileName;
                    // Normalize filename for deduplication
                    const normalizedFileName = decodeURIComponent(fileName || '').toLowerCase().trim();

                    if (fileName && !uniqueImages.has(normalizedFileName)) {
                        uniqueImages.add(normalizedFileName);

                        let storedName = chunk.metadata.storedFileName;

                        // Fallback: If storedFileName is missing (old documents), fetch from DB
                        if (!storedName && chunk.documentId) {
                            try {
                                const doc = await prisma.document.findUnique({
                                    where: { id: chunk.documentId },
                                    select: { filePath: true }
                                });
                                if (doc?.filePath) {
                                    storedName = path.basename(doc.filePath);
                                }
                            } catch (err) {
                                console.warn(`[ChatService] Failed to resolve file path for doc ${chunk.documentId}`);
                            }
                        }

                        images.push({
                            fileName,
                            storedName: storedName || fileName // Fallback to original name if all else fails
                        });
                    }
                }

                if (images.length > 0) {
                    imageAppendix = '\n\n---\n\n### Imagens Relacionadas:\n\n';
                    images.forEach(img => {
                        // Encode filename for URL
                        const encodedName = encodeURIComponent(img.storedName);
                        // Use absolute URL to backend static files
                        // Assuming uploadDir is mounted at /uploads
                        const imageUrl = `http://localhost:3001/uploads/${encodedName}`;
                        imageAppendix += `![${img.fileName}](${imageUrl})\n\n`;
                    });
                    console.log(`[ChatService] Added ${images.length} images to response`);
                }
            }
        }

        const tableInstruction = isTableMode
            ? `\n\nREQUISITO ESPECIAL DE FORMATAÇÃO:
- O usuário ATIVOU o "Modo Tabela".
- Você DEVE apresentar a resposta ou parte significativa dela em formato de TABELA MARKDOWN sempre que houver dados comparáveis ou listáveis.
- Se a pergunta for sobre comparação, diferenças, especificações ou listas, a tabela é OBRIGATÓRIA.
- Use colunas claras e objetivas.`
            : '';

        switch (mode) {
            case 'direct':
                systemPrompt = `Você é um especialista técnico da Tecfag que valoriza o tempo do colega.

Responda de forma objetiva e eficiente. Se for sim ou não, comece assim.
Quando listar informações, faça de forma organizada, mas sem perder naturalidade.
Não use introduções desnecessárias - vá direto ao que importa.

${baseContext}
${tableInstruction}`;
                break;

            case 'casual':
                systemPrompt = `Você é um colega experiente da Tecfag batendo um papo.

Responda como se estivesse conversando no corredor ou tomando um café.
Seja natural - pode usar expressões do dia a dia, mas sem exagerar.
Valide dúvidas quando fizer sentido ("Boa pergunta", "É, isso confunde mesmo").
Seja prestativo sem ser formal.

${baseContext}
${tableInstruction}`;
                break;

            case 'professional':
                systemPrompt = `CONTEXTO: Você é um CONSULTOR DE VENDAS ESPECIALISTA da Tecfag Group.

PAPEL E IDENTIDADE:
- Você é um especialista comercial da Tecfag Group com profundo conhecimento em soluções técnicas, processos industriais e automação.
- Você fala como um consultor experiente conversando com um colega, NÃO como um robô ou chatbot.
- Seu objetivo é ENSINAR o vendedor a vender de forma consultiva, não apenas listar informações.

DETECÇÃO DE CONTEXTO E PROPORÇÃO DE RESPOSTA (CRÍTICO):
Antes de responder, AVALIE a complexidade e o tipo da pergunta:

📍 **SAUDAÇÕES E MENSAGENS SOCIAIS** (ex: "bom dia", "olá", "como vai?"):
- Responda de forma CORDIAL e BREVE
- NÃO aplique SPICED
- NÃO inclua Dica de Especialista
- NÃO liste produtos ou soluções não solicitados
- Exemplo: "Bom dia! Como posso ajudá-lo hoje com as soluções da Tecfag?"

📍 **PERGUNTAS FACTUAIS SIMPLES** (ex: "Qual o preço?", "Onde fica a empresa?"):
- Responda DIRETAMENTE com a informação solicitada
- NÃO aplique SPICED
- Seja objetivo e profissional

📍 **PERGUNTAS SOBRE VENDAS/CONSULTORIA** (ex: "Como vender X?", "Como usar técnica Y?"):
- APLIQUE SPICED de forma narrativa e fluida
- INCLUA Dica de Especialista com analogia memorável
- Use estrutura consultiva completa

📍 **PERGUNTAS TÉCNICAS COMPLEXAS** (ex: "Como funciona X?", "Comparar A vs B"):
- Use abordagem consultiva com dados técnicos integrados
- SPICED pode ser aplicado se agregar valor ao argumento de vendas
- Dica de Especialista OPCIONAL, apenas se genuinamente útil

METODOLOGIA DE VENDAS (SPICED - Uso Condicional):
Quando a pergunta for sobre VENDAS, CONSULTORIA ou PRODUTOS, estruture a resposta usando SPICED de forma NARRATIVA e FLUIDA:
- Situation: Explique como entender o contexto do cliente
- Pain: Identifique as dores específicas que o produto resolve
- Impact: Quantifique o valor e ROI da solução
- Critical Event: Identifique gatilhos de urgência
- Decision: Facilite o processo de decisão

ESTILO DE RESPOSTA NARRATIVO:
✅ **FAÇA:**
- Escreva como um especialista explicando para outro profissional (narrativa fluida, não listas mecânicas)
- Para cada etapa do SPICED, inclua uma **"Pergunta chave:"** específica e prática que o vendedor pode usar
- Integre dados técnicos NATURALMENTE no argumento de vendas (não como lista separada)
- Use marcadores (•) apenas para destacar pontos-chave dentro da narrativa
- Quando usar SPICED completo, inclua uma seção **"Dica de Especialista:"** com uma ANALOGIA MEMORÁVEL

❌ **EVITE:**
- Aplicar estruturas complexas em perguntas simples
- Listas genéricas sem contexto
- Tom robótico ou formato de checklist
- Separar "Benefícios" do texto principal (integre no argumento)
- Perguntas vagas - seja ESPECÍFICO com dados do produto

ESTRUTURA ESPERADA (para perguntas de vendas/consultoria):
1. **Introdução consultiva** explicando a abordagem
2. **Desenvolvimento narrativo** para cada etapa do SPICED:
   - Explicação do objetivo da etapa
   - • **Aplicação**: Como aplicar com o produto específico
   - • **Pergunta chave**: "[pergunta específica que o vendedor pode fazer]"
   - Destaque dados técnicos integrados naturalmente
3. **Dica de Especialista**: Inclua analogia poderosa e memorável que compare o produto/processo atual a algo familiar
4. **Conclusão persuasiva** (opcional, se fizer sentido)

EXEMPLO DE TOM NARRATIVO:
✅ "**1. Situação (Situation)** - O objetivo aqui é entender o contexto atual do cliente. Pergunte sobre o volume de produção e os materiais utilizados. • **Aplicação**: Verifique se o cliente trabalha com embalagens flexíveis como PP, PE, BOPP. • **Pergunta chave**: 'Como é o seu processo de selagem hoje e qual o tamanho da sua produção atual?'. Saiba que a TC20 é ideal para pequena escala, mas com operação contínua."

EXEMPLO DE ANALOGIA MEMORÁVEL:
✅ "**Dica de Especialista:** Para facilitar o entendimento do cliente sobre a versatilidade da máquina, use esta analogia: 'Imagine que sua produção hoje é como lavar louça à mão; você gasta tempo e esforço em cada peça individualmente. A Pratic Seal TC20 funciona como uma lavadora de louças: você apenas posiciona as embalagens na entrada e ela faz o trabalho de forma contínua e padronizada, permitindo que você foque em expandir seu negócio enquanto ela garante o fechamento perfeito.'"

INTEGRAÇÃO DE DADOS TÉCNICOS:
- NÃO crie listas separadas de especificações (exceto se solicitado ou em modo tabela)
- INTEGRE os dados técnicos nos argumentos de forma natural
- Use os dados para QUANTIFICAR impacto e ROI

${baseContext}
${tableInstruction}

LEMBRE-SE: Seja PROPORCIONAL à pergunta. Saudações merecem saudações. Perguntas complexas merecem respostas completas. Sua resposta deve parecer que foi escrita por um consultor HUMANO experiente que adapta sua comunicação ao contexto.`;
                break;
            default:
                systemPrompt = `Você é um especialista técnico da Tecfag explicando para um colega.

Sua paixão é ensinar e fazer as pessoas entenderem de verdade.
Explique o raciocínio por trás das coisas, não apenas os fatos.
Use analogias quando ajudarem a clarear conceitos complexos.
Antecipe perguntas que a pessoa possa ter e responda-as naturalmente.

${baseContext}
${tableInstruction}`;
                break;
        }

        const userPrompt = `PERGUNTA DO USUÁRIO: "${question}"

Elabore uma resposta completa baseada nos documentos acima.`;

        // 5. Generate response - Gemini 2.5 Flash primary, Groq fallback
        let response: string = "";
        let tokenUsage: ChatResponse['tokenUsage'] = undefined;
        let usedFallback = false;

        // Build messages for Gemini
        const geminiMessages = [
            { role: 'user', parts: [{ text: systemPrompt }] },
            { role: 'model', parts: [{ text: `Entendido. Modo ${mode} ativado.` }] },
            ...chatHistory.slice(-6).map(msg => ({
                role: msg.role === 'user' ? 'user' : 'model',
                parts: [{ text: msg.content }]
            })),
            { role: 'user', parts: [{ text: userPrompt }] }
        ];

        try {
            // PRIMARY: Gemini 2.5 Pro (User Requested)
            const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });

            console.log(`[ChatService] Requesting completion from Gemini 2.5 Pro (High Reasoning)...`);
            const result = await model.generateContent({
                contents: geminiMessages as any,
                generationConfig: {
                    temperature: 0.2, // Low temp for analytical precision (NotebookLM style)
                    maxOutputTokens: 65536 // Massive output limit for full lists
                }
            });

            response = result.response.text();

            // Append images if found
            if (imageAppendix) {
                response += imageAppendix;
            }

            // Capture token usage from Gemini
            const usageMetadata = result.response.usageMetadata;
            if (usageMetadata) {
                tokenUsage = {
                    inputTokens: usageMetadata.promptTokenCount || 0,
                    outputTokens: usageMetadata.candidatesTokenCount || 0,
                    totalTokens: usageMetadata.totalTokenCount || 0,
                    model: GEMINI_MODEL,
                };
                console.log(`[ChatService] ✅ Gemini 2.5 Flash - Token usage: ${tokenUsage.totalTokens} total (${tokenUsage.inputTokens} in, ${tokenUsage.outputTokens} out)`);
            }

        } catch (geminiError: any) {
            // FALLBACK: Groq (Llama 3.3 70B)
            console.warn(`[ChatService] ⚠️ Gemini error: ${geminiError.message}. Switching to Groq fallback...`);
            usedFallback = true;

            try {
                const groqMessages: any[] = [
                    { role: 'system', content: systemPrompt },
                    ...chatHistory.slice(-4).map(msg => ({
                        role: msg.role === 'assistant' ? 'assistant' : 'user',
                        content: msg.content
                    })),
                    { role: 'user', content: userPrompt }
                ];

                console.log('[ChatService] Requesting completion from Groq (Llama 3.3 70B) as fallback...');

                const completion = await groq.chat.completions.create({
                    messages: groqMessages,
                    model: GROQ_MODEL,
                    temperature: 0.3,
                    max_tokens: 4096,
                    top_p: 0.9,
                });

                response = completion.choices[0]?.message?.content || "";
                response += '\n\n*(Backup: Groq Llama 3.3)*';

                // Append images if found
                if (imageAppendix) {
                    response += imageAppendix;
                }

                // Capture token usage from Groq
                if (completion.usage) {
                    tokenUsage = {
                        inputTokens: completion.usage.prompt_tokens || 0,
                        outputTokens: completion.usage.completion_tokens || 0,
                        totalTokens: completion.usage.total_tokens || 0,
                        model: GROQ_MODEL + ' (fallback)',
                    };
                    console.log(`[ChatService] ✅ Groq Fallback - Token usage: ${tokenUsage.totalTokens} total`);
                }

            } catch (groqError: any) {
                console.error('[ChatService] ❌ Both Gemini and Groq failed:', groqError);

                // Notificar admins sobre falha crítica de IA
                await notificationService.broadcastToAdmins(
                    'system',
                    '🚨 Falha Crítica: APIs de IA Indisponíveis',
                    `Gemini: ${geminiError.message} | Groq: ${groqError.message}`,
                    'error',
                    { geminiError: geminiError.message, groqError: groqError.message }
                );

                throw new Error(`AI providers unavailable: Gemini (${geminiError.message}), Groq (${groqError.message})`);
            }
        }

        console.log(`[ChatService] ✅ Generated response (${response.length} chars)`);

        // 6. Extract sources
        const sources = relevantChunks.map((chunk, index) => ({
            fileName: chunk.metadata?.fileName || 'Documento desconhecido',
            chunkIndex: chunk.chunkIndex,
            similarity: chunk.similarity
        }));

        // 7. Cache the response for future use
        try {
            const documentIds = [...new Set(relevantChunks.map(c => c.documentId).filter(Boolean))];
            const questionEmbedding = await cacheService.getEmbeddingFromCache(question) || await generateEmbedding(question);
            await cacheService.cacheResponse(
                question,
                questionEmbedding,
                response,
                sources,
                documentIds,
                catalogId
            );
        } catch (cacheError: any) {
            console.warn(`[ChatService] Failed to cache response (non-fatal): ${cacheError.message}`);
        }

        return {
            response,
            sources,
            tokenUsage,
        };

    } catch (error: any) {
        console.error('[ChatService] Error:', error);
        throw new Error(`Failed to generate response: ${error.message}`);
    }
}

/**
 * Streaming version of answerQuestion - yields text chunks as they arrive
 */
export async function* answerQuestionStream(
    question: string,
    catalogId?: string,
    chatHistory: ChatMessage[] = [],
    mode: 'direct' | 'casual' | 'educational' | 'professional' = 'educational',
    isTableMode: boolean = false,
    userProfile?: UserProfile
): AsyncGenerator<{ type: 'chunk' | 'done' | 'error'; content?: string; sources?: any[]; tokenUsage?: ChatResponse['tokenUsage'] }> {
    try {
        console.log(`[ChatService Stream] Processing question: ${question.substring(0, 50)}...`);

        // ═══════════════════════════════════════════════════════════════
        // SESSION CONTEXT: Process user context for memory-aware responses
        // ═══════════════════════════════════════════════════════════════
        let contextInstruction = '';
        if (userProfile?.userId) {
            try {
                const responseFormat = isTableMode ? 'table' : 'normal';
                const { contextInstruction: ctxInst } = await sessionMemory.processMessageContext(
                    userProfile.userId,
                    question,
                    responseFormat
                );
                contextInstruction = ctxInst;
                console.log(`[ChatService Stream] Session context loaded for user ${userProfile.userId}`);
            } catch (ctxError: any) {
                console.warn(`[ChatService Stream] Session context error (non-fatal): ${ctxError.message}`);
            }
        }

        // ═══════════════════════════════════════════════════════════════
        // STEP 1: Analyze query (same as non-streaming)
        // ═══════════════════════════════════════════════════════════════
        const queryAnalysis = analyzeQuery(question);

        // Handle greetings without RAG
        if (queryAnalysis.type === 'greeting') {
            const greetingResponse = generateGreetingResponse(question, mode);
            yield { type: 'chunk', content: greetingResponse };
            yield { type: 'done', sources: [] };
            return;
        }

        // ═══════════════════════════════════════════════════════════════
        // STEP 2: Retrieve relevant chunks (same as non-streaming)
        // ═══════════════════════════════════════════════════════════════
        let relevantChunks;
        let searchMetadata = '';

        if (queryAnalysis.needsMultiQuery) {
            const multiResult = await multiQuerySearch(question, queryAnalysis, catalogId);
            relevantChunks = multiResult.chunks;
            searchMetadata = `\n📊 INFORMAÇÃO DO SISTEMA: Consultados ${multiResult.uniqueDocuments.length} documentos, ${multiResult.chunks.length} trechos.\n`;

            if (queryAnalysis.isCountQuery) {
                const stats = await getDocumentStats(catalogId);
                searchMetadata += `📈 ESTATÍSTICAS: ${stats.totalDocuments} docs, ${stats.totalChunks} chunks.\n`;
            }
        } else {
            const questionEmbedding = await generateEmbedding(question);
            relevantChunks = await searchSimilarChunks(
                questionEmbedding,
                queryAnalysis.contextSize,
                catalogId ? { catalogId } : undefined
            );
        }

        if (relevantChunks.length === 0) {
            yield { type: 'chunk', content: 'Não encontrei informações suficientes nos documentos para responder sua pergunta.' };
            yield { type: 'done', sources: [] };
            return;
        }

        // Apply reranking if needed
        if (relevantChunks.length > 10 &&
            (queryAnalysis.type === 'recommendation' || queryAnalysis.type === 'exploratory' || queryAnalysis.type === 'comparative')) {
            try {
                const rerankedChunks = await rerankChunks(question, relevantChunks, Math.min(relevantChunks.length, 50));
                relevantChunks = rerankedChunks.map(rc => ({
                    id: rc.id,
                    content: rc.content,
                    similarity: rc.combinedScore,
                    metadata: rc.metadata,
                    documentId: rc.documentId,
                    chunkIndex: rc.chunkIndex
                }));
            } catch (rerankError: any) {
                console.warn(`[ChatService Stream] Reranking failed: ${rerankError.message}`);
            }
        }

        // ═══════════════════════════════════════════════════════════════
        // STEP 3: Build context and prompts (same as non-streaming)
        // ═══════════════════════════════════════════════════════════════
        let context: string;
        if (queryAnalysis.type === 'aggregation' || queryAnalysis.type === 'exploratory') {
            const groupedChunks = groupChunksByDocument(relevantChunks);
            context = formatGroupedContext(groupedChunks);
        } else {
            context = relevantChunks
                .map((chunk, index) => {
                    const metadata = chunk.metadata || {};
                    return `[ID: ${index + 1} | Fonte: ${metadata.fileName || 'Documento'}]\n${chunk.content}`;
                })
                .join('\n\n---\n\n');
        }

        const aggregationPrompt = generateAggregationPrompt(question, queryAnalysis);

        // Build User Profile Context
        let userProfileContext = '';
        if (userProfile) {
            userProfileContext = `\nPERFIL: ${userProfile.name || 'Usuário'}, ${userProfile.jobTitle || ''}, ${userProfile.department || ''}\n`;
        }

        // Simplified system prompt for streaming (same structure but no need to repeat full prompts)
        let systemPrompt = '';
        const baseContext = `REGRAS: Use APENAS os documentos abaixo. NÃO invente informações.\n${userProfileContext}${searchMetadata}${aggregationPrompt}${contextInstruction}\n\nDOCUMENTOS:\n${context}`;

        // ═══════════════════════════════════════════════════════════════
        // IMAGE LINKING (STREAM): Prepare image appendix
        // ═══════════════════════════════════════════════════════════════
        const imageChunks = relevantChunks.filter(c => c.metadata?.isImage === true);
        let imageAppendix = '';

        if (imageChunks.length > 0) {
            console.log(`[ChatService Stream] 🖼️ Found ${imageChunks.length} image chunks relevant to query`);

            // Deduplicate images by normalized filename
            const uniqueImages = new Set<string>();
            const images: Array<{ fileName: string, storedName: string }> = [];

            for (const chunk of imageChunks) {
                const fileName = chunk.metadata.fileName;
                // Normalize filename for deduplication (case-insensitive, decode URL encoding)
                const normalizedFileName = decodeURIComponent(fileName || '').toLowerCase().trim();

                if (fileName && !uniqueImages.has(normalizedFileName)) {
                    uniqueImages.add(normalizedFileName);

                    let storedName = chunk.metadata.storedFileName;

                    // Fallback: If storedFileName is missing (old documents), fetch from DB
                    if (!storedName && chunk.documentId) {
                        try {
                            const doc = await prisma.document.findUnique({
                                where: { id: chunk.documentId },
                                select: { filePath: true }
                            });
                            if (doc?.filePath) {
                                storedName = path.basename(doc.filePath);
                            }
                        } catch (err) {
                            console.warn(`[ChatService Stream] Failed to resolve file path for doc ${chunk.documentId}`);
                        }
                    }

                    images.push({
                        fileName,
                        storedName: storedName || fileName // Fallback to original name if all else fails
                    });
                }
            }

            if (images.length > 0) {
                imageAppendix = '\n\n---\n\n### Imagens Relacionadas:\n\n';
                images.forEach(img => {
                    const encodedName = encodeURIComponent(img.storedName);
                    const imageUrl = `http://localhost:3001/uploads/${encodedName}`;
                    imageAppendix += `![${img.fileName}](${imageUrl})\n\n`;
                });
                console.log(`[ChatService Stream] Added ${images.length} unique images to response`);
            }
        }



        const tableInstruction = isTableMode ? '\n\nUSE TABELAS MARKDOWN quando apropriado.' : '';

        // Mode-specific prompts (simplified)
        switch (mode) {
            case 'direct':
                systemPrompt = `Especialista técnico Tecfag. Respostas objetivas e diretas.\n\n${baseContext}${tableInstruction}`;
                break;
            case 'casual':
                systemPrompt = `Colega experiente Tecfag. Tom informal e prestativo.\n\n${baseContext}${tableInstruction}`;
                break;
            case 'professional':
                systemPrompt = `Consultor de vendas Tecfag. Abordagem consultiva SPICED quando relevante.\n\n${baseContext}${tableInstruction}`;
                break;
            default:
                systemPrompt = `Especialista técnico Tecfag. Tom educativo, explicando conceitos.\n\n${baseContext}${tableInstruction}`;
                break;
        }

        const userPrompt = `PERGUNTA: "${question}"\n\nResponda baseado nos documentos acima.`;

        // Build messages for Gemini
        const geminiMessages = [
            { role: 'user', parts: [{ text: systemPrompt }] },
            { role: 'model', parts: [{ text: `Entendido. Modo ${mode} ativado.` }] },
            ...chatHistory.slice(-6).map(msg => ({
                role: msg.role === 'user' ? 'user' : 'model',
                parts: [{ text: msg.content }]
            })),
            { role: 'user', parts: [{ text: userPrompt }] }
        ];

        // ═══════════════════════════════════════════════════════════════
        // STEP 4: Stream response from Gemini
        // ═══════════════════════════════════════════════════════════════
        let tokenUsage: ChatResponse['tokenUsage'] = undefined;
        let fullResponse = '';

        try {
            const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
            console.log(`[ChatService Stream] Starting Gemini streaming...`);

            const streamResult = await model.generateContentStream({
                contents: geminiMessages as any,
                generationConfig: {
                    temperature: 0.3,
                    maxOutputTokens: 12000
                }
            });

            for await (const chunk of streamResult.stream) {
                const chunkText = chunk.text();
                if (chunkText) {
                    fullResponse += chunkText;
                    yield { type: 'chunk', content: chunkText };
                }
            }

            // Append images at the end of stream
            if (imageAppendix) {
                yield { type: 'chunk', content: imageAppendix };
            }

            // Get final token usage
            const finalResponse = await streamResult.response;
            const usageMetadata = finalResponse.usageMetadata;
            if (usageMetadata) {
                tokenUsage = {
                    inputTokens: usageMetadata.promptTokenCount || 0,
                    outputTokens: usageMetadata.candidatesTokenCount || 0,
                    totalTokens: usageMetadata.totalTokenCount || 0,
                    model: GEMINI_MODEL,
                };
            }

        } catch (geminiError: any) {
            // Fallback to Groq streaming
            console.warn(`[ChatService Stream] Gemini error: ${geminiError.message}. Trying Groq fallback...`);

            try {
                const groqMessages: any[] = [
                    { role: 'system', content: systemPrompt },
                    ...chatHistory.slice(-4).map(msg => ({
                        role: msg.role === 'assistant' ? 'assistant' : 'user',
                        content: msg.content
                    })),
                    { role: 'user', content: userPrompt }
                ];

                const stream = await groq.chat.completions.create({
                    messages: groqMessages,
                    model: GROQ_MODEL,
                    temperature: 0.3,
                    max_tokens: 4096,
                    stream: true,
                });

                for await (const chunk of stream) {
                    const chunkText = chunk.choices[0]?.delta?.content || '';
                    if (chunkText) {
                        fullResponse += chunkText;
                        yield { type: 'chunk', content: chunkText };
                    }
                }

                // Add fallback indicator
                yield { type: 'chunk', content: '\n\n*(Backup: Groq Llama 3.3)*' };

            } catch (groqError: any) {
                console.error('[ChatService Stream] Both providers failed:', groqError);
                yield { type: 'error', content: `Erro: ${groqError.message}` };
                return;
            }
        }

        // Extract sources
        const sources = relevantChunks.map((chunk) => ({
            fileName: chunk.metadata?.fileName || 'Documento desconhecido',
            chunkIndex: chunk.chunkIndex,
            similarity: chunk.similarity
        }));

        console.log(`[ChatService Stream] ✅ Completed (${fullResponse.length} chars)`);
        yield { type: 'done', sources, tokenUsage };

    } catch (error: any) {
        console.error('[ChatService Stream] Error:', error);
        yield { type: 'error', content: error.message };
    }
}

/**
 * Generate suggested questions based on available documents
 */
export async function generateSuggestedQuestions(
    catalogId?: string,
    count: number = 3
): Promise<string[]> {
    try {
        // Reduced sample size for speed
        const sampleChunks = await searchSimilarChunks(
            Array(768).fill(0.1),
            8,
            catalogId ? { catalogId } : undefined
        );

        if (sampleChunks.length === 0) {
            return [
                'Quais documentos estão disponíveis?',
                'O que este catálogo cobre?',
                'Como posso começar?'
            ];
        }

        const sampleText = sampleChunks
            .slice(0, 5)
            .map(c => `[doc] ${c.content.substring(0, 300)}`)
            .join('\n');

        const prompt = `Gere ${count} perguntas curtas e técnicas (max 10 palavras) que um engenheiro faria sobre estes textos:
${sampleText}
Apenas as perguntas, uma por linha.`;

        let questionsText = "";

        // Use Gemini 2.5 Flash for suggestions (faster, simpler query)
        try {
            const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
            const result = await model.generateContent(prompt);
            questionsText = result.response.text();
        } catch (geminiError: any) {
            // Fallback to Groq
            console.warn('[ChatService] Gemini failed for suggestions, using Groq fallback');
            const completion = await groq.chat.completions.create({
                messages: [{ role: 'user', content: prompt }],
                model: GROQ_MODEL,
                temperature: 0.5,
            });
            questionsText = completion.choices[0]?.message?.content || "";
        }

        const questions = questionsText
            .split('\n')
            .map(q => q.trim())
            .filter(q => q.length > 5 && q.includes('?'))
            .slice(0, count);

        return questions.length > 0 ? questions : [
            'Quais os principais riscos?',
            'Como realizar a manutenção?',
            'Quais as especificações técnicas?'
        ];

    } catch (error) {
        console.error('[ChatService] Suggestion Error:', error);
        return [
            'Quais são os pontos principais?',
            'Existem riscos operacionais?',
            'O que diz sobre manutenção?'
        ];
    }
}
