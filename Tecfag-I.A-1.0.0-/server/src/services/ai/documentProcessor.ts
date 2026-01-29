import { PrismaClient } from '@prisma/client';
import { extractText } from './textExtractor';
import { chunkText, estimateTokens } from './chunking';
import { generateEmbeddingsBatch } from './embeddings';
import { storeChunks } from './vectorDB';
import notificationService from '../notificationService';
import * as cacheService from './cacheService';
import * as path from 'path';

const prisma = new PrismaClient();

/**
 * Process a document: extract text, chunk it, generate embeddings, and store
 */
export async function processDocument(documentId: string): Promise<void> {
    try {
        console.log(`[DocumentProcessor] Starting processing for document: ${documentId}`);

        // 1. Get document from database
        const document = await prisma.document.findUnique({
            where: { id: documentId }
        });

        if (!document) {
            throw new Error(`Document not found: ${documentId}`);
        }

        // Update progress
        await updateProgress(documentId, 10);

        // 2. Extract text from file (OR handle images)
        console.log(`[DocumentProcessor] Processing file: ${document.fileName} (${document.fileType})`);

        let textWithContext = '';
        let metadata: any = {};

        const isImage = document.fileType.startsWith('image/');
        // Extract stored filename from path
        const storedFileName = path.basename(document.filePath);

        if (isImage) {
            console.log(`[DocumentProcessor] 🖼️ Image detected. Skipping text extraction.`);
            // Para imagens, criamos um "texto" sintético que descreve a imagem baseado no nome do arquivo
            // Isso permite que a busca semântica encontre a imagem quando o usuário perguntar sobre o equipamento
            textWithContext = `[IMAGEM] Arquivo: ${document.fileName}\n\nEsta é uma imagem referente ao equipamento ou documento: ${document.fileName}.`;
            metadata = {
                isImage: true,
                fileName: document.fileName,
                storedFileName: storedFileName
            };
        } else {
            console.log(`[DocumentProcessor] Extracting text from: ${document.fileName}`);
            const result = await extractText(document.filePath, document.fileType);

            if (!result.text || result.text.trim().length === 0) {
                throw new Error('No text extracted from document');
            }

            // PREPEND FILENAME to text to ensure the AI knows which document this is
            textWithContext = `Arquivo: ${document.fileName}\n\n${result.text}`;
            metadata = {
                ...result.metadata,
                storedFileName: storedFileName
            };
        }

        await updateProgress(documentId, 30);

        // 3. Chunk the text
        console.log(`[DocumentProcessor] Chunking text (${textWithContext.length} characters)`);
        // Use 'semantic' strategy for the Compilado file as it is a JSON dump and product-aware splitting fails
        const strategy = storedFileName.includes('Compilado') ? 'semantic' : 'product-aware';

        const chunks = chunkText(textWithContext, {
            chunkSize: 3000,
            overlap: 500,
            strategy: strategy
        });

        console.log(`[DocumentProcessor] Created ${chunks.length} chunks`);
        await updateProgress(documentId, 50);

        // 4. Generate embeddings for all chunks
        console.log(`[DocumentProcessor] Generating embeddings for ${chunks.length} chunks`);
        const embeddings = await generateEmbeddingsBatch(chunks);

        await updateProgress(documentId, 80);

        // 5. Store chunks with embeddings
        console.log(`[DocumentProcessor] Storing chunks in vector database`);
        await storeChunks(
            documentId,
            chunks.map((content, index) => ({
                content,
                embedding: embeddings[index],
                chunkIndex: index,
                metadata: {
                    fileName: document.fileName,
                    fileType: document.fileType,
                    catalogId: document.catalogId,
                    storedFileName: storedFileName, // Ensure this is saved
                    ...metadata
                }
            }))
        );

        await updateProgress(documentId, 95);

        // 6. Update document status
        const totalTokens = chunks.reduce((sum, chunk) => sum + estimateTokens(chunk), 0);

        await prisma.document.update({
            where: { id: documentId },
            data: {
                indexed: true,
                indexedAt: new Date(),
                chunkCount: chunks.length,
                totalTokens,
                processingProgress: 100,
                processingError: null
            }
        });

        console.log(`[DocumentProcessor] ✅ Successfully processed document: ${documentId}`);
        console.log(`  - Chunks: ${chunks.length}`);
        console.log(`  - Total tokens: ${totalTokens}`);

        // Notificar admins sobre documento processado com sucesso
        await notificationService.broadcastToAdmins(
            'document',
            '📄 Documento Indexado',
            `"${document.fileName}" foi processado com sucesso (${chunks.length} chunks, ${totalTokens} tokens)`,
            'success',
            { documentId, fileName: document.fileName, chunks: chunks.length, tokens: totalTokens }
        );

        // INVALIDAR CACHE: Limpar cache de respostas para garantir que novas perguntas encontrem este documento
        // Isso resolve o problema onde a IA "lembra" que não sabia a resposta
        await cacheService.clearAllCache();
        console.log(`[DocumentProcessor] 🧹 Cache cleared after indexing document: ${document.fileName}`);

    } catch (error: any) {
        console.error(`[DocumentProcessor] ❌ Error processing document ${documentId}:`, error);

        // Get document info for notification
        const document = await prisma.document.findUnique({
            where: { id: documentId }
        });

        // Update document with error
        await prisma.document.update({
            where: { id: documentId },
            data: {
                indexed: false,
                processingError: error.message,
                processingProgress: 0
            }
        });

        // Notificar admins sobre erro no processamento
        await notificationService.broadcastToAdmins(
            'document',
            '❌ Erro ao Processar Documento',
            `Falha ao indexar "${document?.fileName || 'Documento'}": ${error.message}`,
            'error',
            { documentId, error: error.message }
        );

        throw error;
    }
}

/**
 * Update processing progress
 */
async function updateProgress(documentId: string, progress: number): Promise<void> {
    await prisma.document.update({
        where: { id: documentId },
        data: { processingProgress: progress }
    });
}

/**
 * Reindex a document (delete old chunks and reprocess)
 */
export async function reindexDocument(documentId: string): Promise<void> {
    console.log(`[DocumentProcessor] Reindexing document: ${documentId}`);

    // Delete existing chunks
    await prisma.documentChunk.deleteMany({
        where: { documentId }
    });

    // Reset document status
    await prisma.document.update({
        where: { id: documentId },
        data: {
            indexed: false,
            processingProgress: 0,
            processingError: null,
            chunkCount: null,
            totalTokens: null
        }
    });

    // Process again
    await processDocument(documentId);
}

/**
 * Delete document and all its chunks
 */
export async function deleteDocument(documentId: string): Promise<void> {
    console.log(`[DocumentProcessor] Deleting document: ${documentId}`);

    // Delete chunks (cascade will handle this, but being explicit)
    await prisma.documentChunk.deleteMany({
        where: { documentId }
    });

    // Delete document
    await prisma.document.delete({
        where: { id: documentId }
    });

    console.log(`[DocumentProcessor] ✅ Document deleted: ${documentId}`);
}
