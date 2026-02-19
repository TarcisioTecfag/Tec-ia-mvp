/**
 * Export Service - Geração de arquivos para exportação
 * 
 * Suporta: PDF, DOCX, Markdown, CSV, JSON
 */

import PDFDocument from 'pdfkit';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import { Parser } from 'json2csv';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// =============================================
// Types
// =============================================

export interface ExportOptions {
    range: '7d' | '30d' | '90d' | 'all';
    format: 'pdf' | 'docx' | 'md' | 'csv' | 'json';
}

interface ChatExportData {
    id: string;
    title: string;
    userName: string;
    userEmail: string;
    createdAt: Date;
    messages: {
        id: string;
        role: string;
        content: string;
        createdAt: Date;
    }[];
}

// =============================================
// Date Range Helper
// =============================================

function getDateFromRange(range: string): Date {
    const now = new Date();
    switch (range) {
        case '7d':
            return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        case '30d':
            return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        case '90d':
            return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        default:
            return new Date(0); // All time
    }
}

// =============================================
// CHATS EXPORT
// =============================================

export async function getChatsForExport(options: ExportOptions): Promise<ChatExportData[]> {
    const fromDate = getDateFromRange(options.range);

    const archivedChats = await prisma.archivedChat.findMany({
        where: {
            createdAt: { gte: fromDate }
        },
        include: {
            user: {
                select: {
                    name: true,
                    email: true
                }
            }
        },
        orderBy: { createdAt: 'desc' }
    });

    return archivedChats.map(chat => {
        // Parse messages from JSON string
        let parsedMessages: { id?: string; role: string; content: string; createdAt?: string }[] = [];
        try {
            parsedMessages = JSON.parse(chat.messages || '[]');
        } catch (e) {
            console.error(`[Export] Failed to parse messages for chat ${chat.id}`);
            parsedMessages = [];
        }

        return {
            id: chat.id,
            title: chat.title,
            userName: chat.user?.name || 'Desconhecido',
            userEmail: chat.user?.email || '',
            createdAt: chat.createdAt,
            messages: parsedMessages.map((m, index) => ({
                id: m.id || `msg-${index}`,
                role: m.role,
                content: m.content,
                createdAt: m.createdAt ? new Date(m.createdAt) : new Date()
            }))
        };
    });
}

export async function generateChatsPDF(chats: ChatExportData[]): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        const doc = new PDFDocument({ margin: 50 });

        doc.on('data', (chunk: Buffer) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Title
        doc.fontSize(24).font('Helvetica-Bold').text('Conversas do Chat I.A', { align: 'center' });
        doc.moveDown();
        doc.fontSize(10).font('Helvetica').text(`Exportado em: ${new Date().toLocaleString('pt-BR')}`, { align: 'center' });
        doc.fontSize(10).text(`Total de conversas: ${chats.length}`, { align: 'center' });
        doc.moveDown(2);

        // Chats
        for (const chat of chats) {
            // Chat header
            doc.fontSize(14).font('Helvetica-Bold').fillColor('#000000').text(chat.title || 'Conversa sem título');
            doc.fontSize(9).font('Helvetica').fillColor('#666666')
                .text(`Usuário: ${chat.userName} (${chat.userEmail})`);
            doc.fontSize(9).font('Helvetica').fillColor('#666666')
                .text(`Data: ${new Date(chat.createdAt).toLocaleString('pt-BR')}`);
            doc.moveDown(0.5);

            // Messages
            for (const msg of chat.messages) {
                const label = msg.role === 'user' ? '👤 Usuário' : '🤖 IA';
                doc.fontSize(10).font('Helvetica-Bold').fillColor('#333333').text(label);
                doc.fontSize(10).font('Helvetica').fillColor('#000000')
                    .text(msg.content.substring(0, 2000), { indent: 10 }); // Limit content
                doc.moveDown(0.5);
            }

            doc.moveDown();
            doc.strokeColor('#cccccc').lineWidth(0.5)
                .moveTo(50, doc.y).lineTo(545, doc.y).stroke();
            doc.moveDown();

            // Check for page break
            if (doc.y > 700) {
                doc.addPage();
            }
        }

        doc.end();
    });
}

export async function generateChatsDocx(chats: ChatExportData[]): Promise<Buffer> {
    const children: Paragraph[] = [];

    // Title
    children.push(
        new Paragraph({
            text: 'Conversas do Chat I.A',
            heading: HeadingLevel.TITLE,
            spacing: { after: 200 }
        }),
        new Paragraph({
            children: [
                new TextRun({ text: `Exportado em: ${new Date().toLocaleString('pt-BR')} | Total: ${chats.length} conversas`, size: 20, color: '666666' })
            ],
            spacing: { after: 400 }
        })
    );

    // Chats
    for (const chat of chats) {
        children.push(
            new Paragraph({
                text: chat.title || 'Conversa sem título',
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 300 }
            }),
            new Paragraph({
                children: [
                    new TextRun({ text: `Usuário: ${chat.userName} | Data: ${new Date(chat.createdAt).toLocaleString('pt-BR')}`, size: 18, color: '666666' })
                ],
                spacing: { after: 200 }
            })
        );

        for (const msg of chat.messages) {
            const label = msg.role === 'user' ? '👤 Usuário:' : '🤖 IA:';
            children.push(
                new Paragraph({
                    children: [
                        new TextRun({ text: label, bold: true }),
                        new TextRun({ text: ' ' + msg.content.substring(0, 2000) })
                    ],
                    spacing: { after: 100 }
                })
            );
        }
    }

    const doc = new Document({
        sections: [{
            properties: {},
            children
        }]
    });

    return await Packer.toBuffer(doc);
}

export function generateChatsMarkdown(chats: ChatExportData[]): string {
    let md = `# Conversas do Chat I.A\n\n`;
    md += `> Exportado em: ${new Date().toLocaleString('pt-BR')}\n`;
    md += `> Total de conversas: ${chats.length}\n\n`;
    md += `---\n\n`;

    for (const chat of chats) {
        md += `## ${chat.title || 'Conversa sem título'}\n`;
        md += `**Usuário:** ${chat.userName} (${chat.userEmail})\n`;
        md += `**Data:** ${new Date(chat.createdAt).toLocaleString('pt-BR')}\n\n`;

        for (const msg of chat.messages) {
            const label = msg.role === 'user' ? '**👤 Usuário:**' : '**🤖 IA:**';
            md += `${label}\n\n${msg.content}\n\n`;
        }

        md += `---\n\n`;
    }

    return md;
}

// =============================================
// USAGE REPORT EXPORT
// =============================================

export async function getUsageData(options: ExportOptions) {
    const fromDate = getDateFromRange(options.range);

    // Get token usage with user info
    const tokenUsage = await prisma.tokenUsage.findMany({
        where: { createdAt: { gte: fromDate } },
        include: {
            user: {
                select: { name: true, email: true }
            }
        },
        orderBy: { createdAt: 'desc' }
    });

    // Aggregate by day
    const dailyUsage = tokenUsage.reduce((acc, usage) => {
        const day = new Date(usage.createdAt).toISOString().split('T')[0];
        if (!acc[day]) {
            acc[day] = { date: day, inputTokens: 0, outputTokens: 0, totalTokens: 0, queries: 0 };
        }
        acc[day].inputTokens += usage.inputTokens;
        acc[day].outputTokens += usage.outputTokens;
        acc[day].totalTokens += usage.totalTokens;
        acc[day].queries += 1;
        return acc;
    }, {} as Record<string, any>);

    // Per-user breakdown
    const userBreakdown = tokenUsage.reduce((acc, usage) => {
        const userName = usage.user?.name || 'Desconhecido';
        if (!acc[userName]) {
            acc[userName] = { userName, userEmail: usage.user?.email || '', inputTokens: 0, outputTokens: 0, totalTokens: 0, queries: 0 };
        }
        acc[userName].inputTokens += usage.inputTokens;
        acc[userName].outputTokens += usage.outputTokens;
        acc[userName].totalTokens += usage.totalTokens;
        acc[userName].queries += 1;
        return acc;
    }, {} as Record<string, any>);

    return {
        summary: {
            totalQueries: tokenUsage.length,
            totalInputTokens: tokenUsage.reduce((sum, u) => sum + u.inputTokens, 0),
            totalOutputTokens: tokenUsage.reduce((sum, u) => sum + u.outputTokens, 0),
            totalTokens: tokenUsage.reduce((sum, u) => sum + u.totalTokens, 0)
        },
        daily: Object.values(dailyUsage),
        byUser: Object.values(userBreakdown)
    };
}

export async function generateUsageReportCSV(options: ExportOptions): Promise<string> {
    const data = await getUsageData(options);

    // Include daily and user breakdown
    let csv = '=== RESUMO DIÁRIO ===\n';
    const dailyParser = new Parser({ fields: ['date', 'queries', 'inputTokens', 'outputTokens', 'totalTokens'] });
    csv += dailyParser.parse(data.daily);

    csv += '\n\n=== POR USUÁRIO ===\n';
    const userParser = new Parser({ fields: ['userName', 'userEmail', 'queries', 'inputTokens', 'outputTokens', 'totalTokens'] });
    csv += userParser.parse(data.byUser);

    return csv;
}

export async function generateUsageReportPDF(options: ExportOptions): Promise<Buffer> {
    return new Promise(async (resolve, reject) => {
        const data = await getUsageData(options);
        const chunks: Buffer[] = [];
        const doc = new PDFDocument({ margin: 50 });

        doc.on('data', (chunk: Buffer) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Title
        doc.fontSize(24).font('Helvetica-Bold').text('Relatório de Uso', { align: 'center' });
        doc.moveDown();
        doc.fontSize(10).font('Helvetica').text(`Período: ${options.range === 'all' ? 'Todo o histórico' : `Últimos ${options.range.replace('d', ' dias')}`}`, { align: 'center' });
        doc.moveDown(2);

        // Summary
        doc.fontSize(16).font('Helvetica-Bold').text('Resumo Geral');
        doc.moveDown(0.5);
        doc.fontSize(12).font('Helvetica');
        doc.text(`Total de Queries: ${data.summary.totalQueries.toLocaleString()}`);
        doc.text(`Tokens de Entrada: ${data.summary.totalInputTokens.toLocaleString()}`);
        doc.text(`Tokens de Saída: ${data.summary.totalOutputTokens.toLocaleString()}`);
        doc.text(`Total de Tokens: ${data.summary.totalTokens.toLocaleString()}`);
        doc.moveDown(2);

        // Per user
        doc.fontSize(16).font('Helvetica-Bold').text('Por Usuário');
        doc.moveDown(0.5);
        doc.fontSize(10).font('Helvetica');
        for (const user of data.byUser as any[]) {
            doc.text(`${user.userName} (${user.userEmail}): ${user.queries} queries, ${user.totalTokens.toLocaleString()} tokens`);
        }

        doc.end();
    });
}

// =============================================
// FEEDBACK REPORT EXPORT
// =============================================

export async function getFeedbackData(options: ExportOptions) {
    const fromDate = getDateFromRange(options.range);

    const feedback = await prisma.messageFeedback.findMany({
        where: { createdAt: { gte: fromDate } },
        include: {
            user: {
                select: { name: true, email: true }
            }
        },
        orderBy: { createdAt: 'desc' }
    });

    const positive = feedback.filter(f => f.rating === 'positive').length;
    const negative = feedback.filter(f => f.rating === 'negative').length;

    return {
        summary: {
            total: feedback.length,
            positive,
            negative,
            positiveRate: feedback.length > 0 ? (positive / feedback.length * 100).toFixed(1) : '0'
        },
        items: feedback.map(f => ({
            date: new Date(f.createdAt).toLocaleString('pt-BR'),
            userName: f.user?.name || 'Desconhecido',
            userEmail: f.user?.email || '',
            rating: f.rating === 'positive' ? 'Positivo' : 'Negativo',
            category: f.category || '',
            query: f.queryContent || '',
            response: f.messageContent || '',
            comment: f.comment || ''
        }))
    };
}

export async function generateFeedbackCSV(options: ExportOptions): Promise<string> {
    const data = await getFeedbackData(options);
    const parser = new Parser({
        fields: ['date', 'userName', 'userEmail', 'rating', 'category', 'query', 'response', 'comment']
    });
    return parser.parse(data.items);
}

export async function generateFeedbackPDF(options: ExportOptions): Promise<Buffer> {
    return new Promise(async (resolve, reject) => {
        const data = await getFeedbackData(options);
        const chunks: Buffer[] = [];
        const doc = new PDFDocument({ margin: 50 });

        doc.on('data', (chunk: Buffer) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        doc.fontSize(24).font('Helvetica-Bold').text('Relatório de Feedback', { align: 'center' });
        doc.moveDown();
        doc.fontSize(10).font('Helvetica').text(`Período: ${options.range === 'all' ? 'Todo o histórico' : `Últimos ${options.range.replace('d', ' dias')}`}`, { align: 'center' });
        doc.moveDown(2);

        doc.fontSize(16).font('Helvetica-Bold').text('Resumo');
        doc.moveDown(0.5);
        doc.fontSize(12).font('Helvetica');
        doc.text(`Total de Avaliações: ${data.summary.total}`);
        doc.text(`Positivas: ${data.summary.positive} (${data.summary.positiveRate}%)`);
        doc.text(`Negativas: ${data.summary.negative}`);
        doc.moveDown(2);

        // List feedback items
        doc.fontSize(16).font('Helvetica-Bold').text('Detalhes');
        doc.moveDown(0.5);
        doc.fontSize(9).font('Helvetica');

        for (const item of data.items.slice(0, 20)) { // Limit to 20
            doc.text(`${item.date} | ${item.userName} | ${item.rating}`);
            doc.text(`Pergunta: ${item.query.substring(0, 100)}...`, { indent: 10 });
            if (item.comment) {
                doc.text(`Comentário: ${item.comment}`, { indent: 10 });
            }
            doc.moveDown(0.5);
        }

        doc.end();
    });
}

// =============================================
// DATA EXPORT (Users, Documents)
// =============================================

export async function exportUsersData(format: 'csv' | 'json'): Promise<string> {
    const users = await prisma.user.findMany({
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
            lastActive: true,
            jobTitle: true,
            department: true,
            accessGroup: {
                select: { name: true }
            }
        },
        orderBy: { createdAt: 'desc' }
    });

    const formattedUsers = users.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        jobTitle: u.jobTitle || '',
        department: u.department || '',
        accessGroup: u.accessGroup?.name || 'Sem grupo',
        createdAt: new Date(u.createdAt).toLocaleString('pt-BR'),
        lastActive: u.lastActive ? new Date(u.lastActive).toLocaleString('pt-BR') : 'Nunca'
    }));

    if (format === 'json') {
        return JSON.stringify(formattedUsers, null, 2);
    }

    const parser = new Parser({
        fields: ['id', 'name', 'email', 'role', 'jobTitle', 'department', 'accessGroup', 'createdAt', 'lastActive']
    });
    return parser.parse(formattedUsers);
}

export async function exportDocumentsData(format: 'csv' | 'json'): Promise<string> {
    const documents = await prisma.document.findMany({
        select: {
            id: true,
            fileName: true,
            fileType: true,
            fileSize: true,
            indexed: true,
            chunkCount: true,
            totalTokens: true,
            uploadedAt: true,
            indexedAt: true
        },
        orderBy: { uploadedAt: 'desc' }
    });

    const formattedDocs = documents.map(d => ({
        id: d.id,
        fileName: d.fileName,
        fileType: d.fileType,
        fileSize: `${(d.fileSize / 1024).toFixed(1)} KB`,
        indexed: d.indexed ? 'Sim' : 'Não',
        chunkCount: d.chunkCount || 0,
        totalTokens: d.totalTokens || 0,
        uploadedAt: new Date(d.uploadedAt).toLocaleString('pt-BR'),
        indexedAt: d.indexedAt ? new Date(d.indexedAt).toLocaleString('pt-BR') : 'Não indexado'
    }));

    if (format === 'json') {
        return JSON.stringify(formattedDocs, null, 2);
    }

    const parser = new Parser({
        fields: ['id', 'fileName', 'fileType', 'fileSize', 'indexed', 'chunkCount', 'totalTokens', 'uploadedAt', 'indexedAt']
    });
    return parser.parse(formattedDocs);
}
