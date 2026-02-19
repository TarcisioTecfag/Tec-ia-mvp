import { answerQuestion } from './src/services/ai/chatService';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyFix() {
    console.log('🧪 VERIFYING FIX FOR MACHINE COUNT...');
    console.log('Please wait, this might take a moment due to large context...\n');

    try {
        const question = "Quantas máquinas temos ao todo na lista 'Compilado'?";
        const response = await answerQuestion(question, undefined, [], 'educational');

        console.log('\n✅ RESPONSE RECEIVED:');
        console.log('--------------------------------------------------');
        console.log(response.response.substring(0, 500) + '... [truncated for log check] ...');
        console.log('--------------------------------------------------');

        console.log(`\n📊 STATS:`);
        console.log(`- Response Length: ${response.response.length} characters`);
        console.log(`- Sources Used: ${response.sources.length}`);

        if (response.tokenUsage) {
            console.log(`- Tokens: ${response.tokenUsage.totalTokens} (In: ${response.tokenUsage.inputTokens}, Out: ${response.tokenUsage.outputTokens})`);
        }

        // Check for truncation
        const lastChars = response.response.slice(-50);
        console.log(`\n🔚 END OF RESPONSE: "${lastChars}"`);

        if (response.sources.length > 100) {
            console.log('\n✅ SUCCESS: Retrieved > 100 chunks (likely seeing all machines).');
        } else {
            console.log(`\n⚠️ WARNING: Only retrieved ${response.sources.length} chunks. Might still be limited if DB has more.`);
        }

    } catch (error) {
        console.error('❌ ERROR:', error);
    } finally {
        await prisma.$disconnect();
    }
}

verifyFix();
