import { Router, Response } from 'express';
import { prisma } from '../config/database.js';
import { authenticate, AuthRequest, adminOnly } from '../middleware/auth.js';

export const monitoringRouter = Router();

// All routes require authentication and admin privileges
monitoringRouter.use(authenticate);
monitoringRouter.use(adminOnly);

// GET /api/monitoring/users - Get all users with online/offline status
monitoringRouter.get('/users', async (req: AuthRequest, res: Response) => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                lastActive: true,
                createdAt: true,
            },
            orderBy: {
                name: 'asc',
            },
        });

        // Calculate online status (user is online if last active within 60 seconds)
        const now = new Date();
        const ONLINE_THRESHOLD_MS = 60 * 1000; // 60 seconds

        const usersWithStatus = users.map(user => {
            const lastActiveTime = new Date(user.lastActive).getTime();
            const timeDiff = now.getTime() - lastActiveTime;
            const isOnline = timeDiff < ONLINE_THRESHOLD_MS;

            return {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                isOnline,
                lastActive: user.lastActive,
                createdAt: user.createdAt,
            };
        });

        res.json({ users: usersWithStatus });
    } catch (error) {
        console.error('Error fetching users status:', error);
        res.status(500).json({ error: 'Erro ao buscar status dos usuários' });
    }
});

// GET /api/monitoring/archived-chats - Get all archived chats organized by user
monitoringRouter.get('/archived-chats', async (req: AuthRequest, res: Response) => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                archivedChats: {
                    select: {
                        id: true,
                        title: true,
                        messagesCount: true,
                        createdAt: true,
                        archivedAt: true,
                        folderId: true,
                        isPinned: true,
                    },
                    orderBy: {
                        archivedAt: 'desc',
                    },
                },
            },
            orderBy: {
                name: 'asc',
            },
        });

        const groups = users.map(user => ({
            userId: user.id,
            userName: user.name,
            userEmail: user.email,
            archives: user.archivedChats,
        }));

        res.json({ groups });
    } catch (error) {
        console.error('Error fetching archived chats by user:', error);
        res.status(500).json({ error: 'Erro ao buscar chats arquivados por usuário' });
    }
});

// GET /api/monitoring/statistics - Get question statistics
monitoringRouter.get('/statistics', async (req: AuthRequest, res: Response) => {
    try {
        // Get all user messages
        const userMessages = await prisma.chatMessage.findMany({
            where: {
                role: 'user',
            },
            select: {
                content: true,
                userId: true,
                user: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });

        // Total questions count
        const totalQuestions = userMessages.length;

        // Count questions by content (find most asked)
        const questionCounts = new Map<string, number>();
        userMessages.forEach(msg => {
            const count = questionCounts.get(msg.content) || 0;
            questionCounts.set(msg.content, count + 1);
        });

        // Get top 10 most asked questions
        const mostAskedQuestions = Array.from(questionCounts.entries())
            .map(([question, count]) => ({ question, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        // Count questions by user
        const userQuestionCounts = new Map<string, { userId: string; userName: string; count: number }>();
        userMessages.forEach(msg => {
            const existing = userQuestionCounts.get(msg.userId);
            if (existing) {
                existing.count++;
            } else {
                userQuestionCounts.set(msg.userId, {
                    userId: msg.userId,
                    userName: msg.user.name,
                    count: 1,
                });
            }
        });

        const questionsByUser = Array.from(userQuestionCounts.values())
            .sort((a, b) => b.count - a.count);

        res.json({
            totalQuestions,
            mostAskedQuestions,
            questionsByUser,
        });
    } catch (error) {
        console.error('Error fetching statistics:', error);
        res.status(500).json({ error: 'Erro ao buscar estatísticas' });
    }
});

// GET /api/monitoring/token-usage - Get token usage aggregated by user
monitoringRouter.get('/token-usage', async (req: AuthRequest, res: Response) => {
    try {
        // Get cost settings first
        let costSettings = await prisma.tokenCostSettings.findFirst();

        // Create default if none exists
        if (!costSettings) {
            costSettings = await prisma.tokenCostSettings.create({
                data: {
                    inputCostPer1M: 0,
                    outputCostPer1M: 0,
                    currency: 'BRL',
                },
            });
        }

        // Get all users with their token usage aggregated
        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
            },
        });

        // Get aggregated token usage per user
        const usageByUser = await Promise.all(
            users.map(async (user) => {
                const aggregation = await prisma.tokenUsage.aggregate({
                    where: { userId: user.id },
                    _sum: {
                        inputTokens: true,
                        outputTokens: true,
                        totalTokens: true,
                    },
                });

                const totalInputTokens = aggregation._sum.inputTokens || 0;
                const totalOutputTokens = aggregation._sum.outputTokens || 0;
                const totalTokens = aggregation._sum.totalTokens || 0;

                // Calculate cost
                const inputCost = (totalInputTokens / 1_000_000) * costSettings!.inputCostPer1M;
                const outputCost = (totalOutputTokens / 1_000_000) * costSettings!.outputCostPer1M;
                const totalCost = inputCost + outputCost;

                return {
                    userId: user.id,
                    userName: user.name,
                    userEmail: user.email,
                    totalInputTokens,
                    totalOutputTokens,
                    totalTokens,
                    totalCost,
                };
            })
        );

        // Filter out users with no usage and sort by cost descending
        const filteredUsage = usageByUser
            .filter(u => u.totalTokens > 0)
            .sort((a, b) => b.totalCost - a.totalCost);

        // Calculate totals
        const totalInputTokens = filteredUsage.reduce((sum, u) => sum + u.totalInputTokens, 0);
        const totalOutputTokens = filteredUsage.reduce((sum, u) => sum + u.totalOutputTokens, 0);
        const totalTokens = filteredUsage.reduce((sum, u) => sum + u.totalTokens, 0);
        const totalCost = filteredUsage.reduce((sum, u) => sum + u.totalCost, 0);

        res.json({
            usageByUser: filteredUsage,
            totalInputTokens,
            totalOutputTokens,
            totalTokens,
            totalCost,
            currency: costSettings.currency,
        });
    } catch (error) {
        console.error('Error fetching token usage:', error);
        res.status(500).json({ error: 'Erro ao buscar uso de tokens' });
    }
});

// GET /api/monitoring/token-cost-settings - Get cost settings
monitoringRouter.get('/token-cost-settings', async (req: AuthRequest, res: Response) => {
    try {
        let settings = await prisma.tokenCostSettings.findFirst();

        // Create default if none exists
        if (!settings) {
            settings = await prisma.tokenCostSettings.create({
                data: {
                    inputCostPer1M: 0,
                    outputCostPer1M: 0,
                    currency: 'BRL',
                },
            });
        }

        res.json(settings);
    } catch (error) {
        console.error('Error fetching token cost settings:', error);
        res.status(500).json({ error: 'Erro ao buscar configurações de custo' });
    }
});

// POST /api/monitoring/token-cost-settings - Update cost settings
monitoringRouter.post('/token-cost-settings', async (req: AuthRequest, res: Response) => {
    try {
        const { inputCostPer1M, outputCostPer1M, currency } = req.body;

        // Get existing settings or create new
        let settings = await prisma.tokenCostSettings.findFirst();

        if (settings) {
            settings = await prisma.tokenCostSettings.update({
                where: { id: settings.id },
                data: {
                    inputCostPer1M: inputCostPer1M ?? settings.inputCostPer1M,
                    outputCostPer1M: outputCostPer1M ?? settings.outputCostPer1M,
                    currency: currency ?? settings.currency,
                },
            });
        } else {
            settings = await prisma.tokenCostSettings.create({
                data: {
                    inputCostPer1M: inputCostPer1M ?? 0,
                    outputCostPer1M: outputCostPer1M ?? 0,
                    currency: currency ?? 'BRL',
                },
            });
        }

        res.json(settings);
    } catch (error) {
        console.error('Error updating token cost settings:', error);
        res.status(500).json({ error: 'Erro ao atualizar configurações de custo' });
    }
});
