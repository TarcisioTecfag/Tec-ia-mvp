
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const documents = await prisma.document.findMany({
        where: {
            fileName: {
                contains: 'BANNER'
            }
        },
        select: {
            id: true,
            fileName: true,
            filePath: true
        }
    });

    console.log('Found documents:', documents);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
