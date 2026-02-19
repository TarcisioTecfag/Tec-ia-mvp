
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('☢️ NUCLEAR OPTION: Wiping ENTIRE Query Cache...');

    try {
        const result = await prisma.queryCache.deleteMany({});
        console.log(`✅ Deleted ${result.count} entries from QueryCache.`);
    } catch (e) {
        console.error('❌ Failed to clear cache:', e);
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
