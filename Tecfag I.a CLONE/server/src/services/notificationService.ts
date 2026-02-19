import { PrismaClient, Notification, NotificationSettings } from '@prisma/client';

const prisma = new PrismaClient();

export type NotificationType = 'system' | 'user' | 'document' | 'chat';
export type NotificationCategory = 'error' | 'warning' | 'info' | 'success';

interface CreateNotificationParams {
    userId: string;
    type: NotificationType;
    category: NotificationCategory;
    title: string;
    message: string;
    metadata?: Record<string, any>;
}

/**
 * Serviço de Notificações - Gerencia criação e envio de notificações
 */
export const notificationService = {
    /**
     * Cria uma notificação para um usuário específico
     */
    async createNotification(params: CreateNotificationParams): Promise<Notification | null> {
        const { userId, type, category, title, message, metadata } = params;

        try {
            // Verificar preferências do usuário
            const shouldNotify = await this.shouldNotify(userId, type);
            if (!shouldNotify) {
                return null;
            }

            // Verificar horário de silêncio
            const inQuietHours = await this.isInQuietHours(userId);
            if (inQuietHours && category !== 'error') {
                // Permitir apenas erros críticos durante horário de silêncio
                return null;
            }

            const notification = await prisma.notification.create({
                data: {
                    userId,
                    type,
                    category,
                    title,
                    message,
                    metadata: metadata ? JSON.stringify(metadata) : null
                }
            });

            return notification;
        } catch (error) {
            console.error('[NotificationService] Erro ao criar notificação:', error);
            return null;
        }
    },

    /**
     * Cria alerta de sistema para todos os admins
     */
    async createSystemAlert(
        title: string,
        message: string,
        category: NotificationCategory = 'info',
        metadata?: Record<string, any>
    ): Promise<void> {
        try {
            const admins = await prisma.user.findMany({
                where: { role: 'ADMIN' },
                select: { id: true }
            });

            await Promise.all(
                admins.map(admin =>
                    this.createNotification({
                        userId: admin.id,
                        type: 'system',
                        category,
                        title,
                        message,
                        metadata
                    })
                )
            );
        } catch (error) {
            console.error('[NotificationService] Erro ao criar alerta de sistema:', error);
        }
    },

    /**
     * Broadcast para todos os admins (qualquer tipo)
     */
    async broadcastToAdmins(
        type: NotificationType,
        title: string,
        message: string,
        category: NotificationCategory = 'info',
        metadata?: Record<string, any>
    ): Promise<void> {
        try {
            const admins = await prisma.user.findMany({
                where: { role: 'ADMIN' },
                select: { id: true }
            });

            await Promise.all(
                admins.map(admin =>
                    this.createNotification({
                        userId: admin.id,
                        type,
                        category,
                        title,
                        message,
                        metadata
                    })
                )
            );
        } catch (error) {
            console.error('[NotificationService] Erro ao broadcast para admins:', error);
        }
    },

    /**
     * Verifica se o usuário deve receber notificação desse tipo
     */
    async shouldNotify(userId: string, type: NotificationType): Promise<boolean> {
        try {
            const settings = await this.getOrCreateSettings(userId);

            switch (type) {
                case 'system':
                    return settings.systemAlerts;
                case 'user':
                    return settings.userAlerts;
                case 'document':
                    return settings.documentAlerts;
                case 'chat':
                    return settings.chatAlerts;
                default:
                    return true;
            }
        } catch (error) {
            // Em caso de erro, permitir notificação
            return true;
        }
    },

    /**
     * Verifica se o usuário está em horário de silêncio
     */
    async isInQuietHours(userId: string): Promise<boolean> {
        try {
            const settings = await this.getOrCreateSettings(userId);

            if (!settings.quietHoursEnabled || !settings.quietHoursStart || !settings.quietHoursEnd) {
                return false;
            }

            const now = new Date();
            const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

            const start = settings.quietHoursStart;
            const end = settings.quietHoursEnd;

            // Caso simples: start < end (ex: 22:00 - 08:00 do dia seguinte ou 10:00 - 12:00)
            if (start <= end) {
                return currentTime >= start && currentTime <= end;
            } else {
                // Caso atravessa meia-noite (ex: 22:00 - 08:00)
                return currentTime >= start || currentTime <= end;
            }
        } catch (error) {
            return false;
        }
    },

    /**
     * Obtém ou cria configurações de notificação para um usuário
     */
    async getOrCreateSettings(userId: string): Promise<NotificationSettings> {
        let settings = await prisma.notificationSettings.findUnique({
            where: { userId }
        });

        if (!settings) {
            settings = await prisma.notificationSettings.create({
                data: { userId }
            });
        }

        return settings;
    },

    /**
     * Atualiza configurações de notificação
     */
    async updateSettings(
        userId: string,
        data: Partial<{
            systemAlerts: boolean;
            userAlerts: boolean;
            documentAlerts: boolean;
            chatAlerts: boolean;
            inAppEnabled: boolean;
            emailEnabled: boolean;
            frequency: string;
            quietHoursEnabled: boolean;
            quietHoursStart: string | null;
            quietHoursEnd: string | null;
        }>
    ): Promise<NotificationSettings> {
        // Garantir que as configurações existam
        await this.getOrCreateSettings(userId);

        return prisma.notificationSettings.update({
            where: { userId },
            data
        });
    },

    /**
     * Obtém notificações de um usuário com paginação
     */
    async getNotifications(
        userId: string,
        limit = 50,
        offset = 0,
        unreadOnly = false
    ): Promise<{ notifications: Notification[]; total: number }> {
        const where = {
            userId,
            ...(unreadOnly ? { isRead: false } : {})
        };

        const [notifications, total] = await Promise.all([
            prisma.notification.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                take: limit,
                skip: offset
            }),
            prisma.notification.count({ where })
        ]);

        return { notifications, total };
    },

    /**
     * Conta notificações não lidas
     */
    async getUnreadCount(userId: string): Promise<number> {
        return prisma.notification.count({
            where: {
                userId,
                isRead: false
            }
        });
    },

    /**
     * Marca notificação como lida
     */
    async markAsRead(id: string, userId: string): Promise<Notification | null> {
        try {
            return await prisma.notification.update({
                where: { id, userId },
                data: {
                    isRead: true,
                    readAt: new Date()
                }
            });
        } catch (error) {
            return null;
        }
    },

    /**
     * Marca todas as notificações como lidas
     */
    async markAllAsRead(userId: string): Promise<number> {
        const result = await prisma.notification.updateMany({
            where: {
                userId,
                isRead: false
            },
            data: {
                isRead: true,
                readAt: new Date()
            }
        });

        return result.count;
    },

    /**
     * Deleta uma notificação
     */
    async deleteNotification(id: string, userId: string): Promise<boolean> {
        try {
            await prisma.notification.delete({
                where: { id, userId }
            });
            return true;
        } catch (error) {
            return false;
        }
    },

    /**
     * Limpa todas as notificações de um usuário
     */
    async clearAll(userId: string): Promise<number> {
        const result = await prisma.notification.deleteMany({
            where: { userId }
        });

        return result.count;
    }
};

export default notificationService;
