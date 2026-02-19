/**
 * Backup Routes - API de gerenciamento de backups
 */

import { Router, Response } from 'express';
import { AuthRequest, authenticate, adminOnly } from '../middleware/auth.js';
import * as backupService from '../services/backupService.js';

const router = Router();

// All backup routes require authentication and admin access
router.use(authenticate);
router.use(adminOnly);

// =============================================
// LIST BACKUPS
// =============================================

router.get('/list', async (req: AuthRequest, res: Response) => {
    try {
        const backups = backupService.listBackups();
        res.json({ backups });
    } catch (error: any) {
        console.error('[Backup API] Error listing backups:', error);
        res.status(500).json({ error: 'Erro ao listar backups' });
    }
});

// =============================================
// CREATE BACKUP
// =============================================

router.post('/create', async (req: AuthRequest, res: Response) => {
    try {
        const { reason } = req.body;
        const backup = backupService.createBackup(reason || 'manual');

        if (!backup) {
            return res.status(500).json({ error: 'Falha ao criar backup' });
        }

        res.json({
            message: 'Backup criado com sucesso',
            backup
        });
    } catch (error: any) {
        console.error('[Backup API] Error creating backup:', error);
        res.status(500).json({ error: 'Erro ao criar backup' });
    }
});

// =============================================
// RESTORE BACKUP
// =============================================

router.post('/restore/:name', async (req: AuthRequest, res: Response) => {
    try {
        const { name } = req.params;

        if (!name) {
            return res.status(400).json({ error: 'Nome do backup é obrigatório' });
        }

        const success = backupService.restoreBackup(name);

        if (!success) {
            return res.status(404).json({ error: 'Backup não encontrado' });
        }

        res.json({
            message: 'Backup restaurado com sucesso. Reinicie o servidor para aplicar as alterações.',
            requiresRestart: true
        });
    } catch (error: any) {
        console.error('[Backup API] Error restoring backup:', error);
        res.status(500).json({ error: 'Erro ao restaurar backup' });
    }
});

// =============================================
// DOWNLOAD BACKUP
// =============================================

router.get('/download/:name', async (req: AuthRequest, res: Response) => {
    try {
        const { name } = req.params;

        if (!name) {
            return res.status(400).json({ error: 'Nome do backup é obrigatório' });
        }

        const backupPath = backupService.getBackupPath(name);

        if (!backupPath) {
            return res.status(404).json({ error: 'Backup não encontrado' });
        }

        res.download(backupPath, name, (err) => {
            if (err) {
                console.error('[Backup API] Error downloading backup:', err);
                if (!res.headersSent) {
                    res.status(500).json({ error: 'Erro ao baixar backup' });
                }
            }
        });
    } catch (error: any) {
        console.error('[Backup API] Error downloading backup:', error);
        res.status(500).json({ error: 'Erro ao baixar backup' });
    }
});

// =============================================
// DELETE BACKUP
// =============================================

router.delete('/:name', async (req: AuthRequest, res: Response) => {
    try {
        const { name } = req.params;

        if (!name) {
            return res.status(400).json({ error: 'Nome do backup é obrigatório' });
        }

        const success = backupService.deleteBackup(name);

        if (!success) {
            return res.status(404).json({ error: 'Backup não encontrado' });
        }

        res.json({ message: 'Backup deletado com sucesso' });
    } catch (error: any) {
        console.error('[Backup API] Error deleting backup:', error);
        res.status(500).json({ error: 'Erro ao deletar backup' });
    }
});

// =============================================
// GET STATUS (Statistics)
// =============================================

router.get('/status', async (req: AuthRequest, res: Response) => {
    try {
        const stats = backupService.getBackupStats();
        const integrity = backupService.checkDatabaseIntegrity();
        const settings = backupService.getSettings();

        res.json({
            ...stats,
            isIntegrity: integrity.isOk,
            integrityDetails: integrity.details,
            settings
        });
    } catch (error: any) {
        console.error('[Backup API] Error getting status:', error);
        res.status(500).json({ error: 'Erro ao obter status' });
    }
});

// =============================================
// CHECK INTEGRITY
// =============================================

router.get('/integrity', async (req: AuthRequest, res: Response) => {
    try {
        const result = backupService.checkDatabaseIntegrity();
        res.json(result);
    } catch (error: any) {
        console.error('[Backup API] Error checking integrity:', error);
        res.status(500).json({ error: 'Erro ao verificar integridade' });
    }
});

// =============================================
// GET SETTINGS
// =============================================

router.get('/settings', async (req: AuthRequest, res: Response) => {
    try {
        const settings = backupService.getSettings();
        res.json(settings);
    } catch (error: any) {
        console.error('[Backup API] Error getting settings:', error);
        res.status(500).json({ error: 'Erro ao obter configurações' });
    }
});

// =============================================
// UPDATE SETTINGS
// =============================================

router.put('/settings', async (req: AuthRequest, res: Response) => {
    try {
        const { maxBackups, intervalHours } = req.body;

        const settings = backupService.updateSettings({
            maxBackups,
            intervalHours
        });

        // Se o intervalo foi alterado, reiniciar o agendamento
        if (intervalHours !== undefined) {
            backupService.startScheduledBackup(intervalHours);
        }

        res.json({
            message: 'Configurações atualizadas com sucesso',
            settings
        });
    } catch (error: any) {
        console.error('[Backup API] Error updating settings:', error);
        res.status(500).json({ error: 'Erro ao atualizar configurações' });
    }
});

export default router;
