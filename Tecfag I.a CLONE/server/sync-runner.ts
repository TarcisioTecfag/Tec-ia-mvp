import fs from 'fs';
import path from 'path';
import FormData from 'form-data';
import axios from 'axios';

const serverUrl = 'https://tec-ia-mvp-production.up.railway.app';
const adminToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhYzAxNTk2OS02MjI1LTRlOTgtYThmMy1kZDc3N2QzMGZmNTQiLCJpYXQiOjE3NzE1MzMzNzMsImV4cCI6MTc3MjEzODE3M30.lZlJW7w3Hywi91bX7JfXkMe92MIOT4opYPzF8L_ZWkk';

const UPLOADS_DIR = path.resolve(__dirname, 'uploads');

async function syncFiles() {
    console.log(`\n======================================================`);
    console.log(`🚀 Iniciando SINCRONIZAÇÃO DE ARQUIVOS PARA O RAILWAY`);
    console.log(`Servidor: ${serverUrl}`);
    console.log(`======================================================\n`);

    if (!fs.existsSync(UPLOADS_DIR)) {
        console.error('❌ Pasta uploads não encontrada localmente.');
        return;
    }

    const files = fs.readdirSync(UPLOADS_DIR);
    const documents = files.filter(f => f !== '.gitkeep');
    console.log(`📂 Encontrados ${documents.length} arquivos físicos na pasta local.\n`);

    let successCount = 0;
    let errorCount = 0;

    for (const filename of documents) {
        const filePath = path.join(UPLOADS_DIR, filename);
        const stats = fs.statSync(filePath);

        if (!stats.isFile()) continue;

        try {
            const formData = new FormData();
            formData.append('file', fs.createReadStream(filePath));
            formData.append('targetFilename', filename);

            process.stdout.write(`⏳ Enviando ${filename}... `);

            await axios.post(`${serverUrl}/api/documents/restore-file`, formData, {
                headers: {
                    ...formData.getHeaders(),
                    'Authorization': `Bearer ${adminToken}`
                },
                maxBodyLength: Infinity,
                maxContentLength: Infinity,
                timeout: 30000 // 30s timeout para cada arquivo
            });

            successCount++;
            console.log(`✅ SUCESSO`);
        } catch (error: any) {
            errorCount++;
            const serverMsg = error.response?.data?.error || error.message;
            console.log(`❌ ERRO: ${serverMsg}`);
        }
    }

    console.log(`\n======================================================`);
    console.log(`🎉 SINCRONIZAÇÃO CONCLUÍDA!`);
    console.log(`✅ Sucessos: ${successCount} arquivos enviados.`);
    if (errorCount > 0) {
        console.log(`❌ Erros: ${errorCount} arquivos falharam.`);
    }
    console.log(`======================================================\n`);
    process.exit(0);
}

syncFiles().catch(err => {
    console.error("Erro fatal:", err);
    process.exit(1);
});
