
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function findDocument() {
    try {
        console.log('--- Buscando documentos com "VSF" no nome ---');
        const docsByName = await prisma.document.findMany({
            where: {
                OR: [
                    { fileName: { contains: 'VSF' } },
                    { filePath: { contains: 'VSF' } }
                ]
            }
        });

        if (docsByName.length === 0) {
            console.log('Nenhum documento encontrado com "VSF" no nome de arquivo ou caminho.');
        } else {
            console.log(`Encontrados ${docsByName.length} documentos:`);
            docsByName.forEach(doc => {
                console.log(`- ID: ${doc.id}`);
                console.log(`  Arquivo: ${doc.fileName}`);
                console.log(`  Caminho: ${doc.filePath}`);
                console.log(`  Tipo: ${doc.fileType}`);
                console.log('---');
            });
        }

        console.log('\n--- Buscando chunks com "VSF" no conteúdo ---');
        // Nota: Isso depende do modelo de DocumentChunk. Vou assumir que existe e tem 'content'.
        // O schema do Prisma não está visível aqui, mas é padrão ter DocumentChunk ou similar.
        // Se falhar, ajusto o script.

        const chunks = await prisma.documentChunk.findMany({
            where: {
                content: { contains: 'VSF' }
            },
            take: 10,
            include: {
                document: true
            }
        });

        if (chunks.length === 0) {
            console.log('Nenhum chunk de texto encontrado contendo "VSF".');
        } else {
            console.log(`Encontrados ${chunks.length} chunks (mostrando primeiros 10):`);
            chunks.forEach(chunk => {
                console.log(`- Doc: ${chunk.document.fileName}`);
                console.log(`  Trecho: ${chunk.content.substring(0, 100)}...`);
                console.log('---');
            });
        }

    } catch (error) {
        console.error('Erro ao buscar:', error);
    } finally {
        await prisma.$disconnect();
    }
}

findDocument();
