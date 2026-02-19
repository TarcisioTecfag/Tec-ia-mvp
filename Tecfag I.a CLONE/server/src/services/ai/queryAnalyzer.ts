/**
 * Query Analyzer - Detecta tipo de pergunta e determina estratégia RAG
 * 
 * Este módulo analisa a pergunta do usuário para determinar:
 * 1. Tipo de pergunta (agregação, factual, comparativa, etc.)
 * 2. Estratégia de recuperação ideal
 * 3. Quantidade de contexto necessária
 */

export type QueryType =
    | 'aggregation'    // "Quantas máquinas?", "Liste todas as..."
    | 'factual'        // "Qual a capacidade da TC20?"
    | 'comparative'    // "Compare A com B"
    | 'exploratory'    // "O que temos sobre envasadoras?"
    | 'procedural'     // "Como operar a máquina X?"
    | 'greeting'       // "Bom dia", "Olá"
    | 'recommendation' // "Qual máquina para embalar sachê?"
    | 'general';       // Pergunta geral

export interface QueryAnalysis {
    type: QueryType;
    contextSize: number;           // Quantidade de chunks a recuperar
    needsMultiQuery: boolean;      // Se precisa de múltiplas queries
    suggestedQueries: string[];    // Queries adicionais para multi-query RAG
    categories: string[];          // Categorias detectadas (envasadoras, seladoras, etc.)
    keywords: string[];            // Palavras-chave extraídas
    isCountQuery: boolean;         // Se é uma query de contagem
    requiresFullScan: boolean;     // Se precisa varrer toda a base
}

// Padrões para detectar tipos de perguntas
const AGGREGATION_PATTERNS = [
    /quant[oa]s?\s/i,
    /list[ea]r?\s+(tod[oa]s|todas\s+as|todos\s+os)/i,
    /tod[oa]s\s+(as|os)\s/i,
    /total\s+de/i,
    /quais\s+(são|sao)\s+(as|os|todas|todos)/i,
    /mostre\s+(tod[oa]s|tudo)/i,
    /o\s+que\s+temos/i,
    /catálogo\s+completo/i,
    /inventário/i,
];

const COMPARATIVE_PATTERNS = [
    /compar[ae]/i,
    /diferença\s+entre/i,
    /versus|vs\.?/i,
    /melhor\s+(entre|que)/i,
    /qual\s+(é|a)\s+(diferença|melhor)/i,
];

const EXPLORATORY_PATTERNS = [
    /o\s+que\s+(é|são|temos|existe)/i,
    /explique/i,
    /me\s+fale\s+sobre/i,
    /como\s+funciona/i,
    /descreva/i,
];

const PROCEDURAL_PATTERNS = [
    /como\s+(operar|usar|configurar|instalar|montar)/i,
    /passo\s+a\s+passo/i,
    /procedimento/i,
    /instruções/i,
    /manual\s+de/i,
];

const GREETING_PATTERNS = [
    /^(oi|olá|ola|bom\s+dia|boa\s+tarde|boa\s+noite|hey|hi|hello)/i,
    /^(como\s+vai|tudo\s+bem)/i,
];

// Padrões para detectar perguntas de RECOMENDAÇÃO de máquinas/produtos
const RECOMMENDATION_PATTERNS = [
    /qual\s+(máquina|maquina|equipamento|produto)\s+(devo|posso|para|usar|ideal)/i,
    /recomendar?\s+(uma?|qual|alguma)/i,
    /indicar?\s+(uma?|para|qual)/i,
    /melhor\s+(opção|escolha|máquina|maquina)\s+para/i,
    /o\s+que\s+(usar|utilizar)\s+para/i,
    /(embalar|envasar|selar|rotular|datar|empacotar)\s+.*(sachê|sache|garrafa|pote|embalagem)/i,
    /máquina\s+para\s+(embalar|envasar|selar|rotular)/i,
    /equipamento\s+para\s+(embalar|envasar|selar|rotular)/i,
    /solução\s+para\s+(embalar|envasar|embalagem)/i,
];

// Categorias de máquinas/produtos conhecidos
const CATEGORY_KEYWORDS: Record<string, string[]> = {
    'envasadoras': ['envasadora', 'envase', 'dosadora', 'dosagem', 'peristáltica', 'pistão'],
    'seladoras': ['seladora', 'selagem', 'vácuo', 'indução', 'impulso', 'pedal', 'contínua'],
    'rotuladoras': ['rotuladora', 'rotulagem', 'etiquetadora', 'rótulo'],
    'datadoras': ['datadora', 'datação', 'inkjet', 'hot stamp', 'jato de tinta'],
    'prensas': ['prensa', 'comprimidos', 'rotativa'],
    'flowpack': ['flowpack', 'flow pack', 'embaladora'],
    'rosqueadoras': ['rosqueadora', 'rosqueamento', 'tampa'],
    'arqueadoras': ['arqueadora', 'arqueamento', 'cintagem'],
    'esteiras': ['esteira', 'transportador', 'conveyor'],
    'encapsuladoras': ['encapsuladora', 'cápsula'],
    'montadoras': ['montadora', 'caixa'],
};

/**
 * Analisa a pergunta e retorna informações sobre a estratégia ideal
 */
export function analyzeQuery(question: string): QueryAnalysis {
    const lowerQuestion = question.toLowerCase().trim();

    // Detectar saudação primeiro (mais alta prioridade)
    if (GREETING_PATTERNS.some(p => p.test(lowerQuestion))) {
        return {
            type: 'greeting',
            contextSize: 0,
            needsMultiQuery: false,
            suggestedQueries: [],
            categories: [],
            keywords: [],
            isCountQuery: false,
            requiresFullScan: false,
        };
    }

    // Detectar categorias mencionadas
    const categories = detectCategories(lowerQuestion);
    const keywords = extractKeywords(lowerQuestion);

    // Detectar tipo de pergunta
    const type = detectQueryType(lowerQuestion);
    const isCountQuery = /quant[oa]s?|total|número|contagem/i.test(lowerQuestion);

    // Detectar códigos de produto para forçar Hybrid Search
    // Regex matches patterns like "VSF 30S", "VSF-30S", "TC20", "TC-20"
    const productCodeRegex = /\b([a-zA-Z]{2,})[\s-]?(\d+[a-zA-Z0-9]*)\b/;
    const hasProductCode = productCodeRegex.test(question); // Use original case-sensitive question for better matching, though regex handles it

    // Determinar se precisa de multi-query
    // SEMPRE usar multi-query se tiver código de produto para garantir Hybrid Search (keyword match)
    const needsMultiQuery = type === 'aggregation' || type === 'exploratory' || hasProductCode;

    // Determinar tamanho de contexto baseado no tipo
    const contextSize = determineContextSize(type, isCountQuery, categories.length);

    // Gerar queries adicionais para multi-query RAG
    const suggestedQueries = generateSubQueries(question, type, categories);

    // Determinar se precisa de full scan - SEMPRE para queries de contagem
    const requiresFullScan = isCountQuery;

    return {
        type,
        contextSize,
        needsMultiQuery,
        suggestedQueries,
        categories,
        keywords,
        isCountQuery,
        requiresFullScan,
    };
}

function detectQueryType(question: string): QueryType {
    // Verificar recomendação ANTES de exploratory (tem sobreposição)
    if (RECOMMENDATION_PATTERNS.some(p => p.test(question))) {
        return 'recommendation';
    }
    if (AGGREGATION_PATTERNS.some(p => p.test(question))) {
        return 'aggregation';
    }
    if (COMPARATIVE_PATTERNS.some(p => p.test(question))) {
        return 'comparative';
    }
    if (PROCEDURAL_PATTERNS.some(p => p.test(question))) {
        return 'procedural';
    }
    if (EXPLORATORY_PATTERNS.some(p => p.test(question))) {
        return 'exploratory';
    }
    return 'factual';
}

function detectCategories(question: string): string[] {
    const detected: string[] = [];

    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
        if (keywords.some(kw => question.includes(kw))) {
            detected.push(category);
        }
    }

    return detected;
}

function extractKeywords(question: string): string[] {
    // Remove stopwords e extrai termos significativos
    const stopwords = new Set([
        'o', 'a', 'os', 'as', 'um', 'uma', 'uns', 'umas',
        'de', 'da', 'do', 'das', 'dos', 'em', 'na', 'no',
        'para', 'por', 'com', 'que', 'qual', 'quais',
        'é', 'são', 'tem', 'temos', 'existe', 'existem',
        'me', 'mim', 'você', 'vocês', 'nós', 'eles',
        'e', 'ou', 'mas', 'se', 'como', 'quando', 'onde'
    ]);

    return question
        .split(/\s+/)
        .map(w => w.replace(/[^\wáàâãéèêíìîóòôõúùûç]/gi, '').toLowerCase())
        .filter(w => w.length > 2 && !stopwords.has(w));
}

function determineContextSize(type: QueryType, isCountQuery: boolean, categoryCount: number): number {
    // Base context sizes por tipo
    // REDUCED to avoid overwhelming LLM (too much context = truncated responses)
    // Each chunk ≈ 1000 tokens, so 20 chunks ≈ 20K tokens input
    const baseSizes: Record<QueryType, number> = {
        'greeting': 0,
        'factual': 15,          // Reduzido: menos é mais focado
        'comparative': 25,       // Reduzido: comparações focadas
        'procedural': 20,        // Reduzido: procedimentos específicos
        'exploratory': 30,       // Reduzido: exploratórias mais focadas
        'recommendation': 40,    // Reduzido: opções mais relevantes
        'aggregation': 50,       // Reduzido significativamente (era 300!)
        'general': 20,           // Margem de segurança
    };

    let size = baseSizes[type];

    // Aumentar se for query de contagem
    if (isCountQuery) {
        size = Math.max(size, 40);
    }

    // Se especificou categorias, pode reduzir um pouco (busca mais focada)
    if (categoryCount > 0 && type === 'aggregation') {
        size = Math.min(size, 35);
    }

    return size;
}

function generateSubQueries(question: string, type: QueryType, categories: string[]): string[] {
    if (type !== 'aggregation' && type !== 'exploratory' && type !== 'recommendation') {
        return [];
    }

    const queries: string[] = [];

    // Para recomendações, gerar queries específicas por tipo de máquina
    if (type === 'recommendation') {
        // Extrair aplicação da pergunta (ex: "sachê", "líquido", "pó")
        const applicationKeywords = ['sachê', 'sache', 'garrafa', 'pote', 'líquido', 'liquido', 'pó', 'po', 'grão', 'grao', 'pastoso'];
        const lowerQ = question.toLowerCase();
        const detectedApp = applicationKeywords.find(kw => lowerQ.includes(kw)) || 'embalagem';

        queries.push(
            `máquinas para ${detectedApp}`,
            `empacotadora sachê automática`,
            `envasadora automática pouch`,
            `seladora para sachê`,
            `dosadora automática`,
            `linha de empacotamento`,
            `catálogo de empacotadoras`,
            `especificações técnicas envasadora`
        );
        return queries;
    }

    // Se tem categorias específicas, gerar queries por categoria
    if (categories.length > 0) {
        for (const cat of categories) {
            queries.push(`lista de ${cat}`);
            queries.push(`modelos de ${cat} disponíveis`);
            queries.push(`catálogo ${cat}`);
        }
    } else {
        // Query genérica de agregação - buscar em todas as categorias principais
        queries.push(
            'lista de todas as máquinas',
            'catálogo de produtos',
            'modelos de envasadoras',
            'modelos de seladoras',
            'modelos de rotuladoras',
            'modelos de datadoras',
            'lista de equipamentos',
            'especificações técnicas'
        );
    }

    return queries;
}

/**
 * Gera um prompt de sumarização para perguntas de agregação
 */
export function generateAggregationPrompt(question: string, analysis: QueryAnalysis): string {
    if (analysis.isCountQuery) {
        return `
INSTRUÇÃO ESPECIAL PARA CONTAGEM:
A pergunta "${question}" requer uma CONTAGEM PRECISA.

Para responder corretamente:
1. Analise TODOS os chunks de contexto fornecidos
2. Identifique cada item único (máquina, modelo, produto)
3. Agrupe por categoria quando aplicável
4. Apresente os totais de forma estruturada
5. NÃO estime - conte apenas o que está explicitamente nos documentos
6. Se houver duplicatas, conte apenas uma vez

PARA LISTAS LONGAS (>50 ITENS):
- Cite o Nome/Modelo e uma BREVE descrição (1 linha).
- Exemplo: "1. Envasadora X - Ideal para pós"
- Mantenha a resposta densa e direta.
- Use colunas se possível.

FORMATO DE RESPOSTA PARA CONTAGENS:
- Apresente o TOTAL GERAL primeiro
- Em seguida, detalhe por categoria/segmento
- Use listas ou tabelas para clareza
`;
    }

    if (analysis.type === 'aggregation') {
        return `
INSTRUÇÃO ESPECIAL PARA LISTAGEM COMPLETA:
A pergunta "${question}" requer uma LISTAGEM ABRANGENTE.

Para responder corretamente:
1. Analise TODOS os chunks de contexto
2. Compile uma lista completa dos itens relevantes
3. Organize por categorias quando há muitos itens
4. Inclua informações-chave de cada item
5. Não omita itens - a completude é essencial

PARA LISTAS MUITO GRANDES (MODO NOTEBOOK DATA):
- O usuário EXIGE a lista completa (300+ itens).
- NÃO RESUMA. NÃO PAGINE.
- Trate isso como uma tarefa de PROCESSAMENTO DE DADOS, não uma conversa.
- Se houver descrições, mantenha-as curtas (1 linha).
- Se a lista for gigante, apenas liste.
`;
    }

    return '';
}
