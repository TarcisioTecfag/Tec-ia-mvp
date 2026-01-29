import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';
import notificationService from '../services/notificationService.js';

const prisma = new PrismaClient();

const router = Router();

// POST /api/feedback - Criar feedback
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const {
            messageContent,
            queryContent,
            rating,
            category,
            comment,
            model,
            catalogId,
            messageId
        } = req.body;

        // Validar rating
        if (!['positive', 'negative'].includes(rating)) {
            return res.status(400).json({
                error: 'Rating deve ser "positive" ou "negative"'
            });
        }

        // Validar categoria se fornecida
        const validCategories = ['incorrect', 'incomplete', 'confusing', 'too_long', 'other'];
        if (category && !validCategories.includes(category)) {
            return res.status(400).json({
                error: `Categoria inválida. Use uma de: ${validCategories.join(', ')}`
            });
        }

        const feedback = await prisma.messageFeedback.create({
            data: {
                messageId,
                messageContent,
                queryContent,
                rating,
                category,
                comment,
                model,
                catalogId,
                userId: req.user!.id
            }
        });

        // Criar notificação para admins se feedback for negativo
        if (rating === 'negative') {
            const categoryLabels: Record<string, string> = {
                incorrect: 'Resposta incorreta',
                incomplete: 'Resposta incompleta',
                confusing: 'Resposta confusa',
                too_long: 'Resposta muito longa',
                other: 'Outro problema'
            };

            await notificationService.broadcastToAdmins(
                'chat',
                '⚠️ Feedback Negativo Recebido',
                `Usuário ${req.user?.name || 'Anônimo'} reportou: ${categoryLabels[category] || 'Problema não especificado'}`,
                'warning',
                { feedbackId: feedback.id, userId: req.user?.id, category }
            );
        }

        res.json({ success: true, feedback });
    } catch (error) {
        console.error('Erro ao criar feedback:', error);
        res.status(500).json({ error: 'Erro ao salvar feedback' });
    }
});

// GET /api/feedback/stats - Estatísticas de feedback (admin)
router.get('/stats', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        // Verificar se usuário é admin
        if (req.user!.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Acesso negado' });
        }

        // Contar feedbacks por rating
        const totalPositive = await prisma.messageFeedback.count({
            where: { rating: 'positive' }
        });

        const totalNegative = await prisma.messageFeedback.count({
            where: { rating: 'negative' }
        });

        const total = totalPositive + totalNegative;

        // Breakdown por categoria (apenas negativos)
        const categoryBreakdown = await prisma.messageFeedback.groupBy({
            by: ['category'],
            where: {
                rating: 'negative',
                category: { not: null }
            },
            _count: true
        });

        // Calcular taxa de satisfação
        const satisfactionRate = total > 0
            ? ((totalPositive / total) * 100).toFixed(1)
            : '0';

        res.json({
            total,
            totalPositive,
            totalNegative,
            satisfactionRate: `${satisfactionRate}%`,
            categoryBreakdown: categoryBreakdown.map(item => ({
                category: item.category,
                count: item._count
            }))
        });
    } catch (error) {
        console.error('Erro ao buscar estatísticas:', error);
        res.status(500).json({ error: 'Erro ao buscar estatísticas' });
    }
});

// GET /api/feedback/recent - Feedbacks recentes (admin)
router.get('/recent', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        // Verificar se usuário é admin
        if (req.user!.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Acesso negado' });
        }

        const limit = parseInt(req.query.limit as string) || 20;
        const rating = req.query.rating as string;

        const where: any = {};
        if (rating === 'positive' || rating === 'negative') {
            where.rating = rating;
        }

        const feedbacks = await prisma.messageFeedback.findMany({
            where,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: limit
        });

        res.json({ feedbacks });
    } catch (error) {
        console.error('Erro ao buscar feedbacks recentes:', error);
        res.status(500).json({ error: 'Erro ao buscar feedbacks' });
    }
});

export default router;
