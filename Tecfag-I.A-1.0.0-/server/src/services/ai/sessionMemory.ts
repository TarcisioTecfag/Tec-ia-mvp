import { prisma } from '../../config/database';
import crypto from 'crypto';

export interface SessionContext {
    id: string;
    userId: string;
    contextSummary: string | null;
    mentionedEntities: MentionedEntities;
    providedInfo: string[];
    detectedPreferences: DetectedPreferences;
    messageCount: number;
}

export interface MentionedEntities {
    machines: string[];
    topics: string[];
    categories: string[];
}

export interface DetectedPreferences {
    prefersTables: boolean;
    prefersLists: boolean;
    technicalLevel: 'basic' | 'intermediate' | 'advanced';
}

const DEFAULT_ENTITIES: MentionedEntities = {
    machines: [],
    topics: [],
    categories: []
};

const DEFAULT_PREFERENCES: DetectedPreferences = {
    prefersTables: false,
    prefersLists: false,
    technicalLevel: 'intermediate'
};

/**
 * Gera um hash curto de um conteúdo para identificação
 */
function generateInfoHash(content: string): string {
    return crypto.createHash('md5').update(content).digest('hex').substring(0, 12);
}

/**
 * Busca ou cria o contexto de sessão para um usuário
 */
export async function getOrCreateSessionContext(userId: string): Promise<SessionContext> {
    let context = await prisma.chatSessionContext.findUnique({
        where: { userId }
    });

    if (!context) {
        context = await prisma.chatSessionContext.create({
            data: {
                userId,
                messageCount: 0
            }
        });
    }

    return {
        id: context.id,
        userId: context.userId,
        contextSummary: context.contextSummary,
        mentionedEntities: context.mentionedEntities
            ? JSON.parse(context.mentionedEntities)
            : DEFAULT_ENTITIES,
        providedInfo: context.providedInfo
            ? JSON.parse(context.providedInfo)
            : [],
        detectedPreferences: context.detectedPreferences
            ? JSON.parse(context.detectedPreferences)
            : DEFAULT_PREFERENCES,
        messageCount: context.messageCount
    };
}

/**
 * Atualiza o resumo do contexto da conversa
 * Este resumo é usado para dar contexto à IA sobre a conversa atual
 */
export async function updateContextSummary(
    userId: string,
    summary: string
): Promise<void> {
    await prisma.chatSessionContext.upsert({
        where: { userId },
        update: {
            contextSummary: summary,
            lastUpdated: new Date()
        },
        create: {
            userId,
            contextSummary: summary
        }
    });
}

/**
 * Extrai e salva entidades mencionadas na mensagem do usuário
 */
export async function extractAndSaveEntities(
    userId: string,
    message: string
): Promise<MentionedEntities> {
    const context = await getOrCreateSessionContext(userId);
    const entities = context.mentionedEntities;

    // Padrões para detectar máquinas
    const machinePatterns = [
        /(?:seladora|empacotadora|dosadora|encartuchadeira|esteira|rosqueadeira|tampadora|enfardadeira|encaixotadora)/gi,
        /(?:modelo|máquina)\s+([A-Z0-9\-]+)/gi
    ];

    // Padrões para detectar tópicos
    const topicPatterns = [
        /(?:manutenção|preventiva|corretiva|peça|reparo|problema|erro|falha)/gi,
        /(?:preço|custo|valor|orçamento|cotação)/gi,
        /(?:especificação|capacidade|dimensão|peso|voltagem)/gi
    ];

    // Padrões para detectar categorias
    const categoryPatterns = [
        /(?:seladoras?|empacotadoras?|dosadoras?|encartuchadeiras?|esteiras?)/gi
    ];

    // Extrair máquinas
    machinePatterns.forEach(pattern => {
        const matches = message.match(pattern);
        if (matches) {
            matches.forEach(match => {
                const normalized = match.trim().toLowerCase();
                if (!entities.machines.includes(normalized)) {
                    entities.machines.push(normalized);
                }
            });
        }
    });

    // Extrair tópicos
    topicPatterns.forEach(pattern => {
        const matches = message.match(pattern);
        if (matches) {
            matches.forEach(match => {
                const normalized = match.trim().toLowerCase();
                if (!entities.topics.includes(normalized)) {
                    entities.topics.push(normalized);
                }
            });
        }
    });

    // Extrair categorias
    categoryPatterns.forEach(pattern => {
        const matches = message.match(pattern);
        if (matches) {
            matches.forEach(match => {
                const normalized = match.trim().toLowerCase().replace(/s$/, ''); // Remove plural
                if (!entities.categories.includes(normalized)) {
                    entities.categories.push(normalized);
                }
            });
        }
    });

    // Limitar tamanho das listas (manter últimas 20 de cada)
    entities.machines = entities.machines.slice(-20);
    entities.topics = entities.topics.slice(-20);
    entities.categories = entities.categories.slice(-10);

    // Salvar no banco
    await prisma.chatSessionContext.upsert({
        where: { userId },
        update: {
            mentionedEntities: JSON.stringify(entities),
            lastUpdated: new Date()
        },
        create: {
            userId,
            mentionedEntities: JSON.stringify(entities)
        }
    });

    return entities;
}

/**
 * Registra informação já fornecida ao usuário
 * Usa hash do conteúdo para identificação
 */
export async function recordProvidedInfo(
    userId: string,
    infoContent: string
): Promise<void> {
    const context = await getOrCreateSessionContext(userId);
    const hash = generateInfoHash(infoContent);

    if (!context.providedInfo.includes(hash)) {
        const updatedInfo = [...context.providedInfo, hash].slice(-100); // Manter últimos 100

        await prisma.chatSessionContext.update({
            where: { userId },
            data: {
                providedInfo: JSON.stringify(updatedInfo),
                lastUpdated: new Date()
            }
        });
    }
}

/**
 * Verifica se uma informação já foi fornecida ao usuário
 */
export async function isInfoAlreadyProvided(
    userId: string,
    infoContent: string
): Promise<boolean> {
    const context = await getOrCreateSessionContext(userId);
    const hash = generateInfoHash(infoContent);
    return context.providedInfo.includes(hash);
}

/**
 * Detecta preferências do usuário baseado nas mensagens
 */
export async function detectAndSavePreferences(
    userId: string,
    message: string,
    responseFormat?: 'table' | 'list' | 'normal'
): Promise<DetectedPreferences> {
    const context = await getOrCreateSessionContext(userId);
    const prefs = context.detectedPreferences;

    // Detectar preferência por tabelas
    if (responseFormat === 'table' || /tabela|comparar|comparativo/i.test(message)) {
        prefs.prefersTables = true;
    }

    // Detectar preferência por listas
    if (responseFormat === 'list' || /list(a|e)|enumere|quai?s são/i.test(message)) {
        prefs.prefersLists = true;
    }

    // Detectar nível técnico
    if (/especificação técnica|datasheet|tensão|amperagem|rpm|torque/i.test(message)) {
        prefs.technicalLevel = 'advanced';
    } else if (/como funciona|o que é|para que serve|básico/i.test(message)) {
        prefs.technicalLevel = 'basic';
    }

    // Salvar no banco
    await prisma.chatSessionContext.upsert({
        where: { userId },
        update: {
            detectedPreferences: JSON.stringify(prefs),
            lastUpdated: new Date()
        },
        create: {
            userId,
            detectedPreferences: JSON.stringify(prefs)
        }
    });

    return prefs;
}

/**
 * Incrementa o contador de mensagens da sessão
 */
export async function incrementMessageCount(userId: string): Promise<number> {
    const result = await prisma.chatSessionContext.upsert({
        where: { userId },
        update: {
            messageCount: { increment: 1 },
            lastUpdated: new Date()
        },
        create: {
            userId,
            messageCount: 1
        }
    });
    return result.messageCount;
}

/**
 * Limpa o contexto da sessão (ao arquivar chat)
 */
export async function clearSession(userId: string): Promise<void> {
    await prisma.chatSessionContext.deleteMany({
        where: { userId }
    });
}

/**
 * Gera instrução de contexto para o system prompt
 */
export function generateContextInstruction(context: SessionContext): string {
    const parts: string[] = [];

    // Resumo do contexto
    if (context.contextSummary) {
        parts.push(`## Resumo da Conversa Atual\n${context.contextSummary}`);
    }

    // Entidades mencionadas
    const { machines, topics, categories } = context.mentionedEntities;
    if (machines.length > 0 || topics.length > 0 || categories.length > 0) {
        parts.push(`## Contexto da Conversa`);
        if (machines.length > 0) {
            parts.push(`- Máquinas mencionadas: ${machines.join(', ')}`);
        }
        if (categories.length > 0) {
            parts.push(`- Categorias de interesse: ${categories.join(', ')}`);
        }
        if (topics.length > 0) {
            parts.push(`- Tópicos discutidos: ${topics.join(', ')}`);
        }
    }

    // Instruções para evitar repetição
    if (context.messageCount > 2) {
        parts.push(`
## Instruções Importantes
- Esta é a mensagem #${context.messageCount} da conversa
- NÃO repita informações já fornecidas anteriormente
- Referencie informações anteriores com "Como mencionei antes..." quando relevante
- Construa sobre o contexto existente da conversa
- Se o usuário perguntar algo já respondido, faça referência à resposta anterior`);
    }

    // Preferências detectadas
    const prefs = context.detectedPreferences;
    if (prefs.prefersTables || prefs.prefersLists || prefs.technicalLevel !== 'intermediate') {
        parts.push(`## Preferências do Usuário`);
        if (prefs.prefersTables) parts.push(`- Prefere respostas em formato de tabela`);
        if (prefs.prefersLists) parts.push(`- Prefere respostas em formato de lista`);
        if (prefs.technicalLevel === 'advanced') {
            parts.push(`- Nível técnico avançado - use termos técnicos`);
        } else if (prefs.technicalLevel === 'basic') {
            parts.push(`- Nível técnico básico - explique de forma simples`);
        }
    }

    return parts.join('\n\n');
}

/**
 * Processa uma nova mensagem e atualiza o contexto
 */
export async function processMessageContext(
    userId: string,
    userMessage: string,
    responseFormat?: 'table' | 'list' | 'normal'
): Promise<{ context: SessionContext; contextInstruction: string }> {
    // Extrair entidades da mensagem
    await extractAndSaveEntities(userId, userMessage);

    // Detectar preferências
    await detectAndSavePreferences(userId, userMessage, responseFormat);

    // Incrementar contador de mensagens
    await incrementMessageCount(userId);

    // Buscar contexto atualizado
    const context = await getOrCreateSessionContext(userId);

    // Gerar instrução de contexto
    const contextInstruction = generateContextInstruction(context);

    return { context, contextInstruction };
}

/**
 * Atualiza o contexto após receber resposta da IA
 */
export async function updateContextAfterResponse(
    userId: string,
    aiResponse: string,
    keyPoints: string[]
): Promise<void> {
    // Registrar pontos-chave como informação já fornecida
    for (const point of keyPoints) {
        await recordProvidedInfo(userId, point);
    }

    // Atualizar resumo do contexto (simplificado)
    // Em produção, poderia usar LLM para gerar resumo
    const context = await getOrCreateSessionContext(userId);
    const currentSummary = context.contextSummary || '';

    // Manter apenas resumo condensado
    const newSummary = keyPoints.length > 0
        ? `Informações fornecidas: ${keyPoints.slice(0, 5).join('; ')}`
        : currentSummary;

    if (newSummary !== currentSummary) {
        await updateContextSummary(userId, newSummary);
    }
}
