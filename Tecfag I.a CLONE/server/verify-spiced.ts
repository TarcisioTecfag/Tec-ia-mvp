
import { answerQuestion } from './src/services/ai/chatService';
import { prisma } from './src/config/database';
import * as dotenv from 'dotenv';
dotenv.config();

async function testSpicedRetrieval() {
    try {
        console.log("Testing SPICED retrieval...");
        const question = "O que é a técnica SPICED?";

        // Mock user profile
        const userProfile = { userId: 'test-user' };

        const result = await answerQuestion(
            question,
            undefined, // catalogId
            [], // history
            'educational',
            false, // table mode
            userProfile
        );

        console.log("\nResponse received:");
        console.log(result.response.substring(0, 200) + "...");

        console.log("\nSources:");
        result.sources.forEach(s => console.log(`- ${s.fileName} (Sim: ${s.similarity.toFixed(2)})`));

        if (result.response.includes("SPICED") || result.sources.some(s => s.fileName.includes("SPICED") || s.similarity > 0.8)) {
            console.log("\n✅ SUCCESS: SPICED technique found.");
        } else {
            console.log("\n❌ FAILURE: SPICED technique NOT found.");
        }

    } catch (error) {
        console.error("Test failed:", error);
    } finally {
        await prisma.$disconnect();
    }
}

testSpicedRetrieval();
