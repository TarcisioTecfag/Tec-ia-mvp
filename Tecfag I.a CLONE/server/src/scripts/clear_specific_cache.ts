
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const searchTerm = 'importação';
    console.log(`🧹 Cleaning cache for queries containing: "${searchTerm}"`);

    const deleted = await prisma.queryCache.deleteMany({
        where: {
            queryText: {
                contains: searchTerm
            }
        }
    });

    console.log(`✅ Deleted ${deleted.count} cache entries.`);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
