
import * as cacheService from '../services/ai/cacheService';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Clearing AI Cache...');
    try {
        const stats = await cacheService.clearAllCache();
        console.log('Cache cleared successfully!');
        console.log(`Removed ${stats.queries} cached queries and ${stats.embeddings} cached embeddings.`);
    } catch (error) {
        console.error('Error clearing cache:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
