import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database.js';

export interface AuthRequest extends Request {
    user?: {
        id: string;
        email: string;
        name: string;
        role: string;
        jobTitle?: string | null;
        department?: string | null;
        technicalLevel?: string | null;
        communicationStyle?: string | null;
        // Permissions Overrides
        canViewChat?: boolean | null;
        canViewMindMap?: boolean | null;
        canViewCatalog?: boolean | null;
        canViewUsers?: boolean | null;
        canViewMonitoring?: boolean | null;
        canViewDocuments?: boolean | null;
        canViewSettings?: boolean | null;
        canViewNotifications?: boolean | null;
        accessGroup?: {
            id: string;
            name: string;
            canViewChat: boolean;
            canViewMindMap: boolean;
            canViewCatalog: boolean;
            canViewUsers: boolean;
            canViewMonitoring: boolean;
            canViewDocuments: boolean;
            canViewSettings: boolean;
            canViewNotifications: boolean;
        } | null;
    };
}

export const authenticate = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({ error: 'Token não fornecido' });
            return;
        }

        const token = authHeader.split(' ')[1];
        const secret = process.env.JWT_SECRET || 'fallback-secret';

        const decoded = jwt.verify(token, secret) as { userId: string };

        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                jobTitle: true,
                department: true,
                technicalLevel: true,
                communicationStyle: true,
                // Permissions Overrides
                canViewChat: true,
                canViewMindMap: true,
                canViewCatalog: true,
                canViewUsers: true,
                canViewMonitoring: true,
                canViewDocuments: true,
                canViewSettings: true,
                canViewNotifications: true,
                accessGroup: {
                    select: {
                        id: true,
                        name: true,
                        canViewChat: true,
                        canViewMindMap: true,
                        canViewCatalog: true,
                        canViewUsers: true,
                        canViewMonitoring: true,
                        canViewDocuments: true,
                        canViewSettings: true,
                        canViewNotifications: true,
                    }
                }
            },
        });

        if (!user) {
            res.status(401).json({ error: 'Usuário não encontrado' });
            return;
        }

        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Token inválido' });
    }
};

export const adminOnly = (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): void => {
    if (!req.user || req.user.role !== 'ADMIN') {
        res.status(403).json({ error: 'Acesso restrito a administradores' });
        return;
    }
    next();
};
