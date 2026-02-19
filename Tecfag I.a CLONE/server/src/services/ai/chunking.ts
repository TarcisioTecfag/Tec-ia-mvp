import { GoogleGenerativeAI } from '@google/generative-ai';

export interface ChunkOptions {
    chunkSize?: number;
    overlap?: number;
    strategy?: 'semantic' | 'fixed' | 'product-aware';
}

// Patterns que indicam início de uma nova máquina/produto
const PRODUCT_START_PATTERNS = [
    /^#+\s*[A-Z]{2,}\d*[A-Z]*/m,          // Headers como "## AFPP1328" ou "# Diamond 180 A"
    /^[A-Z]{2,}\d+[A-Z]?\s*[-–:]/m,        // Código como "AFPP1328 -" ou "SW180A:"
    /^Modelo:\s*/m,                        // "Modelo: Diamond 180 A"
    /^(Empacotadora|Envasadora|Seladora|Dosadora|Datadora|Rotuladora|Arqueadora|Flowpack)/im,
    /^(AFPP|Diamond|Pratic|TC\d|FRP|PCS|SW\d)/im,  // Prefixos de modelo conhecidos
];

// Patterns que indicam seções de especificação (devem ficar junto com a máquina)
const SPEC_PATTERNS = [
    /^(Capacidade|Dosagem|Produtividade|Voltagem|Potência|Dimensões|Peso|Material|Selagem):/im,
    /^(Aplicação|Características|Diferenciais|Vantagens):/im,
];

/**
 * Split text into chunks with intelligent strategy selection
 */
export function chunkText(
    text: string,
    options: ChunkOptions = {}
): string[] {
    const {
        chunkSize = 3000,  // INCREASED: 4x maior para preservar contexto
        overlap = 500,     // INCREASED: Mais overlap para conexões
        strategy = 'product-aware'  // NEW DEFAULT: Product-aware chunking
    } = options;

    if (strategy === 'product-aware') {
        return productAwareChunking(text, chunkSize, overlap);
    } else if (strategy === 'semantic') {
        return semanticChunking(text, chunkSize, overlap);
    } else {
        return fixedChunking(text, chunkSize, overlap);
    }
}

/**
 * Product-aware chunking - keeps machine/product descriptions together
 * This is the KEY improvement for matching NotebookLM quality
 */
function productAwareChunking(
    text: string,
    chunkSize: number,
    overlap: number
): string[] {
    // First, try to split by product boundaries
    const productBlocks = splitByProducts(text);

    console.log(`[Chunking] Product-aware: Found ${productBlocks.length} product blocks`);

    const chunks: string[] = [];

    for (const block of productBlocks) {
        if (block.length <= chunkSize) {
            // Product fits in one chunk - perfect!
            chunks.push(block);
        } else {
            // Product too long, use semantic chunking within it
            // But with larger chunk size to keep specs together
            const subChunks = semanticChunking(block, chunkSize, overlap);
            chunks.push(...subChunks);
        }
    }

    // If no products detected, fall back to semantic chunking
    if (chunks.length === 0) {
        return semanticChunking(text, chunkSize, overlap);
    }

    return chunks.filter(c => c.trim().length > 50); // Filter tiny chunks
}

/**
 * Split text by product/machine boundaries
 */
function splitByProducts(text: string): string[] {
    const lines = text.split('\n');
    const blocks: string[] = [];
    let currentBlock = '';

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Check if this line starts a new product
        const isProductStart = PRODUCT_START_PATTERNS.some(p => p.test(line.trim()));

        if (isProductStart && currentBlock.trim().length > 100) {
            // Save current block and start new one
            blocks.push(currentBlock.trim());
            currentBlock = line + '\n';
        } else {
            currentBlock += line + '\n';
        }
    }

    // Don't forget the last block
    if (currentBlock.trim().length > 50) {
        blocks.push(currentBlock.trim());
    }

    // If we only got 1 block, the document might not have clear product boundaries
    // Try alternative splitting by double newlines (sections)
    if (blocks.length <= 1 && text.length > 5000) {
        const sections = text.split(/\n\n\n+/);
        if (sections.length > 1) {
            return sections.filter(s => s.trim().length > 100);
        }
    }

    return blocks;
}

/**
 * Semantic chunking - respects paragraph boundaries
 */
function semanticChunking(
    text: string,
    chunkSize: number,
    overlap: number
): string[] {
    // Split by paragraphs (double newline or single newline)
    const paragraphs = text.split(/\n\n+|\n/).filter(p => p.trim().length > 0);

    const chunks: string[] = [];
    let currentChunk = '';

    for (const paragraph of paragraphs) {
        const testChunk = currentChunk
            ? currentChunk + '\n\n' + paragraph
            : paragraph;

        if (testChunk.length <= chunkSize) {
            currentChunk = testChunk;
        } else {
            // Current chunk is full, save it
            if (currentChunk) {
                chunks.push(currentChunk);
            }

            // Start new chunk with overlap from previous
            if (overlap > 0 && currentChunk) {
                const overlapText = currentChunk.slice(-overlap);
                currentChunk = overlapText + '\n\n' + paragraph;
            } else {
                currentChunk = paragraph;
            }

            // If single paragraph is too long, split it
            if (currentChunk.length > chunkSize) {
                const splitChunks = fixedChunking(currentChunk, chunkSize, overlap);
                chunks.push(...splitChunks.slice(0, -1));
                currentChunk = splitChunks[splitChunks.length - 1];
            }
        }
    }

    // Add the last chunk
    if (currentChunk) {
        chunks.push(currentChunk);
    }

    return chunks.filter(c => c.trim().length > 0);
}

/**
 * Fixed chunking - simple sliding window
 */
function fixedChunking(
    text: string,
    chunkSize: number,
    overlap: number
): string[] {
    const chunks: string[] = [];
    let start = 0;

    while (start < text.length) {
        const end = start + chunkSize;
        chunks.push(text.slice(start, end));
        start = end - overlap;

        // Prevent infinite loop
        if (overlap >= chunkSize) {
            break;
        }
    }

    return chunks.filter(c => c.trim().length > 0);
}

/**
 * Estimate token count (rough approximation: 1 token ≈ 4 characters)
 */
export function estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
}

/**
 * Detect if text contains product/machine information
 */
export function containsProductInfo(text: string): boolean {
    return PRODUCT_START_PATTERNS.some(p => p.test(text)) ||
        SPEC_PATTERNS.some(p => p.test(text));
}
