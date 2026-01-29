
import { reindexDocument } from '../services/ai/documentProcessor';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function reindexCompilado() {
    try {
        const docId = 'faad6ce6-d6d4-4304-8282-e109af7f89bc';
        console.log(`Reindexing Compilado File: ${docId}`);
        await reindexDocument(docId);
        console.log('Reindexed successfully.');
    } catch (error) {
        console.error('Error reindexing:', error);
    } finally {
        await prisma.$disconnect();
    }
}

reindexCompilado();
