/**
 * Export Routes - API de exportação de dados
 */

import { Router, Response } from 'express';
import { AuthRequest, authenticate, adminOnly } from '../middleware/auth';
import * as exportService from '../services/exportService';

const router = Router();

// All export routes require authentication
router.use(authenticate);

// =============================================
// CHATS EXPORT
// =============================================

router.get('/chats', async (req: AuthRequest, res: Response) => {
    try {
        const format = (req.query.format as string) || 'pdf';
        const range = (req.query.range as string) || '30d';

        const options = { format: format as any, range: range as any };
        const chats = await exportService.getChatsForExport(options);

        if (chats.length === 0) {
            return res.status(404).json({ error: 'Nenhuma conversa encontrada para exportar' });
        }

        let data: Buffer | string;
        let contentType: string;
        let extension: string;

        switch (format) {
            case 'pdf':
                data = await exportService.generateChatsPDF(chats);
                contentType = 'application/pdf';
                extension = 'pdf';
                break;
            case 'docx':
                data = await exportService.generateChatsDocx(chats);
                contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
                extension = 'docx';
                break;
            case 'md':
                data = exportService.generateChatsMarkdown(chats);
                contentType = 'text/markdown';
                extension = 'md';
                break;
            default:
                return res.status(400).json({ error: 'Formato não suportado' });
        }

        const filename = `conversas_tecfag_${new Date().toISOString().split('T')[0]}.${extension}`;
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(data);

    } catch (error: any) {
        console.error('[Exports] Error exporting chats:', error);
        res.status(500).json({ error: 'Erro ao exportar conversas' });
    }
});

// =============================================
// USAGE REPORT
// =============================================

router.get('/usage', async (req: AuthRequest, res: Response) => {
    try {
        const format = (req.query.format as string) || 'pdf';
        const range = (req.query.range as string) || '30d';

        const options = { format: format as any, range: range as any };

        let data: Buffer | string;
        let contentType: string;
        let extension: string;

        switch (format) {
            case 'pdf':
                data = await exportService.generateUsageReportPDF(options);
                contentType = 'application/pdf';
                extension = 'pdf';
                break;
            case 'csv':
                data = await exportService.generateUsageReportCSV(options);
                contentType = 'text/csv; charset=utf-8';
                extension = 'csv';
                break;
            default:
                return res.status(400).json({ error: 'Formato não suportado' });
        }

        const filename = `relatorio_uso_${new Date().toISOString().split('T')[0]}.${extension}`;
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(data);

    } catch (error: any) {
        console.error('[Exports] Error exporting usage report:', error);
        res.status(500).json({ error: 'Erro ao gerar relatório de uso' });
    }
});

// =============================================
// FEEDBACK REPORT
// =============================================

router.get('/feedback', async (req: AuthRequest, res: Response) => {
    try {
        const format = (req.query.format as string) || 'pdf';
        const range = (req.query.range as string) || '30d';

        const options = { format: format as any, range: range as any };

        let data: Buffer | string;
        let contentType: string;
        let extension: string;

        switch (format) {
            case 'pdf':
                data = await exportService.generateFeedbackPDF(options);
                contentType = 'application/pdf';
                extension = 'pdf';
                break;
            case 'csv':
                data = await exportService.generateFeedbackCSV(options);
                contentType = 'text/csv; charset=utf-8';
                extension = 'csv';
                break;
            default:
                return res.status(400).json({ error: 'Formato não suportado' });
        }

        const filename = `relatorio_feedback_${new Date().toISOString().split('T')[0]}.${extension}`;
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(data);

    } catch (error: any) {
        console.error('[Exports] Error exporting feedback report:', error);
        res.status(500).json({ error: 'Erro ao gerar relatório de feedback' });
    }
});

// =============================================
// DATA EXPORTS (Admin only)
// =============================================

router.get('/users', adminOnly, async (req: AuthRequest, res: Response) => {
    try {
        const format = (req.query.format as string) || 'csv';

        const data = await exportService.exportUsersData(format as 'csv' | 'json');
        const contentType = format === 'json' ? 'application/json' : 'text/csv';
        const extension = format === 'json' ? 'json' : 'csv';

        const filename = `usuarios_${new Date().toISOString().split('T')[0]}.${extension}`;
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(data);

    } catch (error: any) {
        console.error('[Exports] Error exporting users:', error);
        res.status(500).json({ error: 'Erro ao exportar usuários' });
    }
});

router.get('/documents', adminOnly, async (req: AuthRequest, res: Response) => {
    try {
        const format = (req.query.format as string) || 'csv';

        const data = await exportService.exportDocumentsData(format as 'csv' | 'json');
        const contentType = format === 'json' ? 'application/json' : 'text/csv';
        const extension = format === 'json' ? 'json' : 'csv';

        const filename = `documentos_${new Date().toISOString().split('T')[0]}.${extension}`;
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(data);

    } catch (error: any) {
        console.error('[Exports] Error exporting documents:', error);
        res.status(500).json({ error: 'Erro ao exportar documentos' });
    }
});

export default router;
