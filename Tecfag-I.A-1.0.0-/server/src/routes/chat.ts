import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { aiService } from '../services/aiService.js';
import * as sessionMemory from '../services/ai/sessionMemory.js';

export const chatRouter = Router();

// Validation schema
const messageSchema = z.object({
    content: z.string().min(1, 'Mensagem não pode estar vazia'),
});

// POST send message and get AI response
chatRouter.post('/', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const { content } = messageSchema.parse(req.body);
        const userId = req.user!.id;

        // Save user message
        const userMessage = await prisma.chatMessage.create({
            data: {
                userId,
                role: 'user',
                content,
            },
        });

        // Generate AI response
        const aiResponse = await aiService.generateResponse(content, userId);

        // Save AI response
        const assistantMessage = await prisma.chatMessage.create({
            data: {
                userId,
                role: 'assistant',
                content: aiResponse,
            },
        });

        res.json({
            userMessage: {
                id: userMessage.id,
                role: userMessage.role,
                content: userMessage.content,
                createdAt: userMessage.createdAt,
            },
            assistantMessage: {
                id: assistantMessage.id,
                role: assistantMessage.role,
                content: assistantMessage.content,
                createdAt: assistantMessage.createdAt,
            },
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: error.errors[0].message });
            return;
        }
        console.error('Chat error:', error);
        res.status(500).json({ error: 'Erro ao processar mensagem' });
    }
});

// GET chat history
chatRouter.get('/history', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;
        const limit = parseInt(req.query.limit as string) || 50;
        const offset = parseInt(req.query.offset as string) || 0;

        const messages = await prisma.chatMessage.findMany({
            where: { userId },
            orderBy: { createdAt: 'asc' },
            skip: offset,
            take: limit,
            select: {
                id: true,
                role: true,
                content: true,
                createdAt: true,
            },
        });

        const total = await prisma.chatMessage.count({
            where: { userId },
        });

        res.json({
            messages,
            total,
            limit,
            offset,
        });
    } catch (error) {
        console.error('Get chat history error:', error);
        res.status(500).json({ error: 'Erro ao buscar histórico' });
    }
});

// DELETE clear chat history
chatRouter.delete('/history', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;

        await prisma.chatMessage.deleteMany({
            where: { userId },
        });

        // Also clear session context
        try {
            await sessionMemory.clearSession(userId);
        } catch (e) { /* ignore */ }

        res.json({ message: 'Histórico limpo com sucesso' });
    } catch (error) {
        console.error('Clear chat history error:', error);
        res.status(500).json({ error: 'Erro ao limpar histórico' });
    }
});

// POST clear session context only (without clearing chat messages)
chatRouter.post('/clear-context', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;

        await sessionMemory.clearSession(userId);

        res.json({ message: 'Contexto de sessão limpo com sucesso' });
    } catch (error) {
        console.error('Clear session context error:', error);
        res.status(500).json({ error: 'Erro ao limpar contexto de sessão' });
    }
});

// GET current session context (for debugging)
chatRouter.get('/session-context', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;

        const context = await sessionMemory.getOrCreateSessionContext(userId);

        res.json({
            messageCount: context.messageCount,
            mentionedEntities: context.mentionedEntities,
            detectedPreferences: context.detectedPreferences,
            hasContextSummary: !!context.contextSummary,
            providedInfoCount: context.providedInfo.length,
        });
    } catch (error) {
        console.error('Get session context error:', error);
        res.status(500).json({ error: 'Erro ao buscar contexto de sessão' });
    }
});

// POST archive current chat
chatRouter.post('/archive', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;
        const { title } = req.body;

        // Get all current messages
        const messages = await prisma.chatMessage.findMany({
            where: { userId },
            orderBy: { createdAt: 'asc' },
            select: {
                id: true,
                role: true,
                content: true,
                createdAt: true,
            },
        });

        if (messages.length === 0) {
            res.status(400).json({ error: 'Não há mensagens para arquivar' });
            return;
        }

        // Generate title from first user message if not provided
        const chatTitle = title || messages.find(m => m.role === 'user')?.content.slice(0, 50) || 'Chat sem título';

        // Create archived chat
        const archivedChat = await prisma.archivedChat.create({
            data: {
                userId,
                title: chatTitle,
                messagesCount: messages.length,
                messages: JSON.stringify(messages),
                createdAt: messages[0].createdAt,
            },
        });

        // Clear current chat history
        await prisma.chatMessage.deleteMany({
            where: { userId },
        });

        // Clear session context (reset conversation memory)
        try {
            await sessionMemory.clearSession(userId);
            console.log(`[Archive Chat] Session context cleared for user ${userId}`);
        } catch (ctxError: any) {
            console.warn(`[Archive Chat] Failed to clear session context: ${ctxError.message}`);
        }

        res.json({
            id: archivedChat.id,
            title: archivedChat.title,
            messagesCount: archivedChat.messagesCount,
            createdAt: archivedChat.createdAt,
            archivedAt: archivedChat.archivedAt,
        });
    } catch (error) {
        console.error('Archive chat error:', error);
        res.status(500).json({ error: 'Erro ao arquivar chat' });
    }
});

// GET all archived chats
chatRouter.get('/archives', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;

        const archives = await prisma.archivedChat.findMany({
            where: { userId },
            orderBy: { archivedAt: 'desc' },
            select: {
                id: true,
                title: true,
                messagesCount: true,
                createdAt: true,
                archivedAt: true,
                folderId: true,
                isPinned: true,
            },
        });

        res.json({ archives });
    } catch (error) {
        console.error('Get archives error:', error);
        res.status(500).json({ error: 'Erro ao buscar chats arquivados' });
    }
});

// GET specific archived chat with messages
chatRouter.get('/archives/:id', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;
        const { id } = req.params;

        const whereClause: any = { id };

        // If not admin, restrict to own chats
        if (req.user!.role !== 'ADMIN') {
            whereClause.userId = userId;
        }

        // Debug logging
        console.log(`[GET Archive] Requesting chat ${id} by user ${userId} (${req.user?.role})`);
        console.log(`[GET Archive] Where clause:`, JSON.stringify(whereClause));

        const archive = await prisma.archivedChat.findFirst({
            where: whereClause,
        });

        if (!archive) {
            console.log(`[GET Archive] Chat not found!`);
            res.status(404).json({ error: 'Chat arquivado não encontrado' });
            return;
        }

        res.json({
            id: archive.id,
            title: archive.title,
            messagesCount: archive.messagesCount,
            messages: JSON.parse(archive.messages),
            createdAt: archive.createdAt,
            archivedAt: archive.archivedAt,
        });
    } catch (error) {
        console.error('Get archive error:', error);
        res.status(500).json({ error: 'Erro ao buscar chat arquivado' });
    }
});

// DELETE archived chat
chatRouter.delete('/archives/:id', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;
        const { id } = req.params;

        const archive = await prisma.archivedChat.findFirst({
            where: {
                id,
                userId,
            },
        });

        if (!archive) {
            res.status(404).json({ error: 'Chat arquivado não encontrado' });
            return;
        }

        await prisma.archivedChat.delete({
            where: { id },
        });

        res.json({ message: 'Chat arquivado deletado com sucesso' });
    } catch (error) {
        console.error('Delete archive error:', error);
        res.status(500).json({ error: 'Erro ao deletar chat arquivado' });
    }
});

// POST restore archived chat to active conversation
chatRouter.post('/archives/:id/restore', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;
        const { id } = req.params;

        const archive = await prisma.archivedChat.findFirst({
            where: {
                id,
                userId,
            },
        });

        if (!archive) {
            res.status(404).json({ error: 'Chat arquivado não encontrado' });
            return;
        }

        const messages = JSON.parse(archive.messages);

        // Clear current chat
        await prisma.chatMessage.deleteMany({
            where: { userId },
        });

        // Restore messages
        await prisma.chatMessage.createMany({
            data: messages.map((msg: any) => ({
                userId,
                role: msg.role,
                content: msg.content,
            })),
        });

        // Delete the archive
        await prisma.archivedChat.delete({
            where: { id },
        });

        res.json({ message: 'Chat restaurado com sucesso' });
    } catch (error) {
        console.error('Restore archive error:', error);
        res.status(500).json({ error: 'Erro ao restaurar chat' });
    }
});

// ========== FOLDER MANAGEMENT ==========

// POST create folder
chatRouter.post('/folders', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const { name } = req.body;
        const userId = req.user!.id;

        if (!name || name.trim().length === 0) {
            res.status(400).json({ error: 'Nome da pasta não pode estar vazio' });
            return;
        }

        // Get current max order
        const maxOrderFolder = await prisma.chatFolder.findFirst({
            where: { userId },
            orderBy: { order: 'desc' },
        });

        const folder = await prisma.chatFolder.create({
            data: {
                userId,
                name: name.trim(),
                order: (maxOrderFolder?.order || 0) + 1,
            },
        });

        res.json({
            id: folder.id,
            name: folder.name,
            isDefault: folder.isDefault,
            order: folder.order,
            createdAt: folder.createdAt,
        });
    } catch (error) {
        console.error('Create folder error:', error);
        res.status(500).json({ error: 'Erro ao criar pasta' });
    }
});

// GET all folders with chat counts
chatRouter.get('/folders', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;

        const folders = await prisma.chatFolder.findMany({
            where: { userId },
            orderBy: [{ isDefault: 'desc' }, { order: 'asc' }],
            include: {
                _count: {
                    select: { archivedChats: true },
                },
            },
        });

        res.json({
            folders: folders.map(f => ({
                id: f.id,
                name: f.name,
                isDefault: f.isDefault,
                order: f.order,
                chatCount: f._count.archivedChats,
                createdAt: f.createdAt,
            })),
        });
    } catch (error) {
        console.error('Get folders error:', error);
        res.status(500).json({ error: 'Erro ao buscar pastas' });
    }
});

// PUT rename folder
chatRouter.put('/folders/:id', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { name } = req.body;
        const userId = req.user!.id;

        if (!name || name.trim().length === 0) {
            res.status(400).json({ error: 'Nome da pasta não pode estar vazio' });
            return;
        }

        const folder = await prisma.chatFolder.findFirst({
            where: { id, userId },
        });

        if (!folder) {
            res.status(404).json({ error: 'Pasta não encontrada' });
            return;
        }

        if (folder.isDefault) {
            res.status(400).json({ error: 'Não é possível renomear a pasta padrão' });
            return;
        }

        const updated = await prisma.chatFolder.update({
            where: { id },
            data: { name: name.trim() },
        });

        res.json({
            id: updated.id,
            name: updated.name,
            isDefault: updated.isDefault,
            order: updated.order,
        });
    } catch (error) {
        console.error('Rename folder error:', error);
        res.status(500).json({ error: 'Erro ao renomear pasta' });
    }
});

// DELETE folder
chatRouter.delete('/folders/:id', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user!.id;

        const folder = await prisma.chatFolder.findFirst({
            where: { id, userId },
        });

        if (!folder) {
            res.status(404).json({ error: 'Pasta não encontrada' });
            return;
        }

        if (folder.isDefault) {
            res.status(400).json({ error: 'Não é possível deletar a pasta padrão' });
            return;
        }

        // Move all chats in this folder to root (null folder)
        await prisma.archivedChat.updateMany({
            where: { folderId: id },
            data: { folderId: null },
        });

        await prisma.chatFolder.delete({
            where: { id },
        });

        res.json({ message: 'Pasta deletada com sucesso' });
    } catch (error) {
        console.error('Delete folder error:', error);
        res.status(500).json({ error: 'Erro ao deletar pasta' });
    }
});

// ========== CHAT OPERATIONS ==========

// PUT rename chat
chatRouter.put('/archives/:id/rename', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { title } = req.body;
        const userId = req.user!.id;

        if (!title || title.trim().length === 0) {
            res.status(400).json({ error: 'Título não pode estar vazio' });
            return;
        }

        const chat = await prisma.archivedChat.findFirst({
            where: { id, userId },
        });

        if (!chat) {
            res.status(404).json({ error: 'Chat não encontrado' });
            return;
        }

        const updated = await prisma.archivedChat.update({
            where: { id },
            data: { title: title.trim() },
        });

        res.json({
            id: updated.id,
            title: updated.title,
            messagesCount: updated.messagesCount,
            folderId: updated.folderId,
            isPinned: updated.isPinned,
        });
    } catch (error) {
        console.error('Rename chat error:', error);
        res.status(500).json({ error: 'Erro ao renomear chat' });
    }
});

// PUT move chat to folder
chatRouter.put('/archives/:id/move', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { folderId } = req.body;
        const userId = req.user!.id;

        const chat = await prisma.archivedChat.findFirst({
            where: { id, userId },
        });

        if (!chat) {
            res.status(404).json({ error: 'Chat não encontrado' });
            return;
        }

        // Verify folder exists and belongs to user
        if (folderId) {
            const folder = await prisma.chatFolder.findFirst({
                where: { id: folderId, userId },
            });

            if (!folder) {
                res.status(404).json({ error: 'Pasta não encontrada' });
                return;
            }
        }

        const updated = await prisma.archivedChat.update({
            where: { id },
            data: { folderId: folderId || null },
        });

        res.json({
            id: updated.id,
            folderId: updated.folderId,
            isPinned: updated.isPinned,
        });
    } catch (error) {
        console.error('Move chat error:', error);
        res.status(500).json({ error: 'Erro ao mover chat' });
    }
});

// PUT toggle pin
chatRouter.put('/archives/:id/pin', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { isPinned } = req.body;
        const userId = req.user!.id;

        const chat = await prisma.archivedChat.findFirst({
            where: { id, userId },
        });

        if (!chat) {
            res.status(404).json({ error: 'Chat não encontrado' });
            return;
        }

        // If pinning, move to default "Fixados" folder
        let targetFolderId = chat.folderId;
        if (isPinned) {
            const defaultFolder = await prisma.chatFolder.findFirst({
                where: { userId, isDefault: true },
            });

            if (defaultFolder) {
                targetFolderId = defaultFolder.id;
            }
        }

        const updated = await prisma.archivedChat.update({
            where: { id },
            data: {
                isPinned,
                folderId: targetFolderId,
            },
        });

        res.json({
            id: updated.id,
            isPinned: updated.isPinned,
            folderId: updated.folderId,
        });
    } catch (error) {
        console.error('Pin chat error:', error);
        res.status(500).json({ error: 'Erro ao fixar chat' });
    }
});

// ========== RAG AI ENDPOINTS ==========

import { answerQuestion, answerQuestionStream, generateSuggestedQuestions } from '../services/ai/chatService';

// POST send message with RAG (document-based responses)
chatRouter.post('/rag', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const { content, catalogId, mode, isTableMode, isAttachmentMode } = req.body;
        const userId = req.user!.id;

        if (!content || content.trim().length === 0) {
            res.status(400).json({ error: 'Mensagem não pode estar vazia' });
            return;
        }

        // Get recent chat history for context
        const recentMessages = await prisma.chatMessage.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 6,
            select: {
                role: true,
                content: true,
            },
        });

        const chatHistory = recentMessages.reverse().map(msg => ({
            role: msg.role as 'user' | 'assistant',
            content: msg.content
        }));

        // Fetch full user profile for context
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                name: true,
                jobTitle: true,
                department: true,
                technicalLevel: true,
                communicationStyle: true,
            }
        });

        // Generate RAG response
        const { response, sources, tokenUsage } = await answerQuestion(
            content,
            catalogId,
            chatHistory,
            mode,
            isTableMode,
            user ? {
                userId,  // Enable session context tracking
                name: user.name,
                jobTitle: user.jobTitle || undefined,
                department: user.department || undefined,
                technicalLevel: user.technicalLevel || undefined,
                communicationStyle: user.communicationStyle || undefined,
            } : { userId },
            isAttachmentMode // Pass attachment mode flag
        );

        // Save token usage to database
        if (tokenUsage) {
            await prisma.tokenUsage.create({
                data: {
                    userId,
                    inputTokens: tokenUsage.inputTokens,
                    outputTokens: tokenUsage.outputTokens,
                    totalTokens: tokenUsage.totalTokens,
                    model: tokenUsage.model,
                    requestType: 'chat',
                },
            });
            console.log(`[Chat] Token usage saved for user ${userId}: ${tokenUsage.totalTokens} tokens`);
        }

        // Save user message
        const userMessage = await prisma.chatMessage.create({
            data: {
                userId,
                role: 'user',
                content,
            },
        });

        // Save AI response
        const assistantMessage = await prisma.chatMessage.create({
            data: {
                userId,
                role: 'assistant',
                content: response,
            },
        });

        res.json({
            userMessage: {
                id: userMessage.id,
                role: userMessage.role,
                content: userMessage.content,
                createdAt: userMessage.createdAt,
            },
            assistantMessage: {
                id: assistantMessage.id,
                role: assistantMessage.role,
                content: assistantMessage.content,
                createdAt: assistantMessage.createdAt,
            },
            sources,
        });
    } catch (error: any) {
        console.error('RAG chat error:', error);
        res.status(500).json({ error: error.message || 'Erro ao processar mensagem' });
    }
});

// POST send message with RAG streaming (Server-Sent Events)
// POST send message with RAG streaming (Server-Sent Events)
chatRouter.post('/rag/stream', authenticate, async (req: AuthRequest, res: Response) => {
    const { content, catalogId, mode, isTableMode, isAttachmentMode } = req.body;
    const userId = req.user!.id;

    if (!content || content.trim().length === 0) {
        res.status(400).json({ error: 'Mensagem não pode estar vazia' });
        return;
    }

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering
    res.flushHeaders();

    try {
        // Get recent chat history for context
        const recentMessages = await prisma.chatMessage.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 6,
            select: { role: true, content: true },
        });

        const chatHistory = recentMessages.reverse().map(msg => ({
            role: msg.role as 'user' | 'assistant',
            content: msg.content
        }));

        // Fetch user profile
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                name: true,
                jobTitle: true,
                department: true,
                technicalLevel: true,
                communicationStyle: true,
            }
        });

        // Save user message immediately
        const userMessage = await prisma.chatMessage.create({
            data: { userId, role: 'user', content },
        });

        // Send user message confirmation
        res.write(`data: ${JSON.stringify({ type: 'user_message', id: userMessage.id })}\n\n`);

        let fullResponse = '';
        let sources: any[] = [];
        let tokenUsage: any = undefined;

        // Stream response
        const stream = answerQuestionStream(
            content,
            catalogId,
            chatHistory,
            mode,
            isTableMode,
            user ? {
                userId,  // Enable session context tracking
                name: user.name,
                jobTitle: user.jobTitle || undefined,
                department: user.department || undefined,
                technicalLevel: user.technicalLevel || undefined,
                communicationStyle: user.communicationStyle || undefined,
            } : { userId },  // Even without user profile, include userId for session tracking
            isAttachmentMode // Pass attachment mode flag
        );

        for await (const event of stream) {
            if (event.type === 'chunk') {
                fullResponse += event.content || '';
                res.write(`data: ${JSON.stringify({ type: 'chunk', content: event.content })}\n\n`);
                // Force flush to ensure chunk is sent immediately
                if (typeof (res as any).flush === 'function') {
                    (res as any).flush();
                }
            } else if (event.type === 'done') {
                sources = event.sources || [];
                tokenUsage = event.tokenUsage;
            } else if (event.type === 'error') {
                res.write(`data: ${JSON.stringify({ type: 'error', content: event.content })}\n\n`);
                res.end();
                return;
            }
        }

        // Save assistant message
        const assistantMessage = await prisma.chatMessage.create({
            data: { userId, role: 'assistant', content: fullResponse },
        });

        // Save token usage
        if (tokenUsage) {
            await prisma.tokenUsage.create({
                data: {
                    userId,
                    inputTokens: tokenUsage.inputTokens,
                    outputTokens: tokenUsage.outputTokens,
                    totalTokens: tokenUsage.totalTokens,
                    model: tokenUsage.model,
                    requestType: 'chat_stream',
                },
            });
        }

        // Send completion event
        res.write(`data: ${JSON.stringify({
            type: 'done',
            assistantMessageId: assistantMessage.id,
            sources
        })}\n\n`);

        res.end();

    } catch (error: any) {
        console.error('RAG stream error:', error);
        res.write(`data: ${JSON.stringify({ type: 'error', content: error.message })}\n\n`);
        res.end();
    }
});

// GET suggested questions based on available documents
chatRouter.get('/suggestions', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const { catalogId } = req.query;

        const suggestions = await generateSuggestedQuestions(
            catalogId as string | undefined,
            5
        );

        res.json({ suggestions });
    } catch (error: any) {
        console.error('Get suggestions error:', error);
        res.status(500).json({ error: error.message || 'Erro ao gerar sugestões' });
    }
});
