import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '.env') });

const apiKey = process.env.GEMINI_API_KEY;

async function listModels() {
    console.log('Fetching models...');
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

    try {
        const response = await fetch(url);
        const data: any = await response.json();

        if (!response.ok) {
            console.error('Failed:', data);
            return;
        }

        console.log('\n--- AVAILABLE MODELS ---');
        const models = data.models || [];
        models.forEach((m: any) => {
            console.log(`\nName: ${m.name}`);
            console.log(`Methods: ${m.supportedGenerationMethods?.join(', ')}`);
        });
        console.log('\n------------------------\n');

        // Look for 1.5 Pro
        const pro = models.find((m: any) => m.name.includes('gemini-1.5-pro'));
        if (pro) {
            console.log(`✅ FOUND PRO MODEL: ${pro.name}`);
        } else {
            console.log('❌ NO "gemini-1.5-pro" FOUND.');
        }

    } catch (e: any) {
        console.error('Error:', e.message);
    }
}

listModels();
