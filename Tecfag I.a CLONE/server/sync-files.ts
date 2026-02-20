import fs from 'fs';
import path from 'path';
import FormData from 'form-data';
import axios from 'axios';

// Get args
const serverUrl = process.argv[2] || 'https://tec-ia-mvp-production.up.railway.app';
const adminToken = process.argv[3];

if (!adminToken) {
    console.error('❌ Uso incorreto.');
    console.log('Execute: npx tsx sync-files.ts <URL_DO_SERVIDOR> <SEU_TOKEN_DE_ADMIN>');
    console.log('Exemplo: npx tsx sync-files.ts https://meu-app.up.railway.app eyJhbGciOiJIUzI1Ni...');
    console.log('\nPara pegar seu token de admin:');
    console.log('1. Entre no sistema live (produção)');
    console.log('2. Aperte F12 para abrir o DevTools');
    console.log('3. Vá na aba Application > Local Storage');
    console.log('4. Copie o valor da chave "auth_token"');
    process.exit(1);
}

const UPLOADS_DIR = path.resolve(__dirname, 'uploads');

async function syncFiles() {
    console.log(`🚀 Iniciando sincronização de arquivos para ${serverUrl}`);

    if (!fs.existsSync(UPLOADS_DIR)) {
        console.error('❌ Pasta uploads não encontrada localmente. Execute este script dentro da pasta server onde os arquivos estão.');
        return;
    }

    const files = fs.readdirSync(UPLOADS_DIR);
    const documents = files.filter(f => f !== '.gitkeep');
    console.log(`Encontrados ${documents.length} arquivos locais.`);

    let successCount = 0;
    let errorCount = 0;

    for (const filename of files) {
        if (filename === '.gitkeep') continue;

        const filePath = path.join(UPLOADS_DIR, filename);
        const stats = fs.statSync(filePath);

        if (!stats.isFile()) continue;

        try {
            const formData = new FormData();
            formData.append('file', fs.createReadStream(filePath));
            formData.append('targetFilename', filename);

            process.stdout.write(`Enviando ${filename}... `);
            await axios.post(`${serverUrl}/api/documents/restore-file`, formData, {
                headers: {
                    ...formData.getHeaders(),
                    'Authorization': `Bearer ${adminToken}`
                },
                maxBodyLength: Infinity,
                maxContentLength: Infinity
            });
            successCount++;
            console.log(`✅ OK`);
        } catch (error: any) {
            errorCount++;
            const serverMsg = error.response?.data?.error || error.message;
            console.log(`❌ ERRO: ${serverMsg}`);
        }
    }

    console.log(`\n🎉 Sincronização concluída!`);
    console.log(`✅ Sucessos: ${successCount}`);
    if (errorCount > 0) {
        console.log(`❌ Erros: ${errorCount}`);
    }
}

syncFiles();
