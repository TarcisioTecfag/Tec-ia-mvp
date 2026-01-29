import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import notificationService from '../services/notificationService.js';

const router = Router();

// Aplicar autenticação a todas as rotas
router.use(authenticate);

/**
 * GET /api/notifications
 * Lista notificações do usuário autenticado
 */
router.get('/', async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Não autorizado' });
        }

        const limit = parseInt(req.query.limit as string) || 50;
        const offset = parseInt(req.query.offset as string) || 0;
        const unreadOnly = req.query.unreadOnly === 'true';

        const result = await notificationService.getNotifications(userId, limit, offset, unreadOnly);

        res.json({
            notifications: result.notifications,
            total: result.total,
            limit,
            offset
        });
    } catch (error) {
        console.error('[Notifications] Erro ao listar:', error);
        res.status(500).json({ error: 'Erro ao listar notificações' });
    }
});

/**
 * GET /api/notifications/unread-count
 * Retorna contagem de notificações não lidas
 */
router.get('/unread-count', async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Não autorizado' });
        }

        const count = await notificationService.getUnreadCount(userId);

        res.json({ count });
    } catch (error) {
        console.error('[Notifications] Erro ao contar não lidas:', error);
        res.status(500).json({ error: 'Erro ao contar notificações' });
    }
});

/**
 * GET /api/notifications/settings
 * Retorna configurações de notificação do usuário
 */
router.get('/settings', async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Não autorizado' });
        }

        const settings = await notificationService.getOrCreateSettings(userId);

        res.json({ settings });
    } catch (error) {
        console.error('[Notifications] Erro ao obter configurações:', error);
        res.status(500).json({ error: 'Erro ao obter configurações' });
    }
});

/**
 * PUT /api/notifications/settings
 * Atualiza configurações de notificação
 */
router.put('/settings', async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Não autorizado' });
        }

        const {
            systemAlerts,
            userAlerts,
            documentAlerts,
            chatAlerts,
            inAppEnabled,
            emailEnabled,
            frequency,
            quietHoursEnabled,
            quietHoursStart,
            quietHoursEnd
        } = req.body;

        const settings = await notificationService.updateSettings(userId, {
            ...(systemAlerts !== undefined && { systemAlerts }),
            ...(userAlerts !== undefined && { userAlerts }),
            ...(documentAlerts !== undefined && { documentAlerts }),
            ...(chatAlerts !== undefined && { chatAlerts }),
            ...(inAppEnabled !== undefined && { inAppEnabled }),
            ...(emailEnabled !== undefined && { emailEnabled }),
            ...(frequency !== undefined && { frequency }),
            ...(quietHoursEnabled !== undefined && { quietHoursEnabled }),
            ...(quietHoursStart !== undefined && { quietHoursStart }),
            ...(quietHoursEnd !== undefined && { quietHoursEnd })
        });

        res.json({ settings });
    } catch (error) {
        console.error('[Notifications] Erro ao atualizar configurações:', error);
        res.status(500).json({ error: 'Erro ao atualizar configurações' });
    }
});

/**
 * PUT /api/notifications/:id/read
 * Marca uma notificação como lida
 */
router.put('/:id/read', async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Não autorizado' });
        }

        const { id } = req.params;
        const notification = await notificationService.markAsRead(id, userId);

        if (!notification) {
            return res.status(404).json({ error: 'Notificação não encontrada' });
        }

        res.json({ notification });
    } catch (error) {
        console.error('[Notifications] Erro ao marcar como lida:', error);
        res.status(500).json({ error: 'Erro ao marcar como lida' });
    }
});

/**
 * PUT /api/notifications/read-all
 * Marca todas as notificações como lidas
 */
router.put('/read-all', async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Não autorizado' });
        }

        const count = await notificationService.markAllAsRead(userId);

        res.json({ message: `${count} notificações marcadas como lidas`, count });
    } catch (error) {
        console.error('[Notifications] Erro ao marcar todas como lidas:', error);
        res.status(500).json({ error: 'Erro ao marcar notificações como lidas' });
    }
});

/**
 * DELETE /api/notifications/:id
 * Deleta uma notificação
 */
router.delete('/:id', async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Não autorizado' });
        }

        const { id } = req.params;
        const deleted = await notificationService.deleteNotification(id, userId);

        if (!deleted) {
            return res.status(404).json({ error: 'Notificação não encontrada' });
        }

        res.json({ message: 'Notificação deletada com sucesso' });
    } catch (error) {
        console.error('[Notifications] Erro ao deletar:', error);
        res.status(500).json({ error: 'Erro ao deletar notificação' });
    }
});

/**
 * DELETE /api/notifications/clear
 * Limpa todas as notificações do usuário
 */
router.delete('/clear', async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Não autorizado' });
        }

        const count = await notificationService.clearAll(userId);

        res.json({ message: `${count} notificações removidas`, count });
    } catch (error) {
        console.error('[Notifications] Erro ao limpar notificações:', error);
        res.status(500).json({ error: 'Erro ao limpar notificações' });
    }
});

/**
 * POST /api/notifications/test
 * Cria uma notificação de teste (apenas para desenvolvimento)
 */
router.post('/test', async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Não autorizado' });
        }

        const { type = 'system', category = 'info', title, message } = req.body;

        const notification = await notificationService.createNotification({
            userId,
            type,
            category,
            title: title || 'Notificação de Teste',
            message: message || 'Esta é uma notificação de teste do sistema.'
        });

        res.json({ notification });
    } catch (error) {
        console.error('[Notifications] Erro ao criar teste:', error);
        res.status(500).json({ error: 'Erro ao criar notificação de teste' });
    }
});

export default router;
