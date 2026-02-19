
import Redis from 'ioredis';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Fix for __dirname in ESM if needed, though usually ts-node handles it. 
// If project is commonjs, __dirname works. If ESM, need hack.
// Assuming common setup.

dotenv.config({ path: path.join(process.cwd(), '.env') });

const REDIS_CONFIG = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || undefined,
};

async function main() {
    console.log('Connecting to Redis at', REDIS_CONFIG.host, REDIS_CONFIG.port);
    const client = new Redis(REDIS_CONFIG);

    client.on('error', (err) => {
        console.error('Redis Client Error', err.message);
        process.exit(1);
    });

    try {
        await client.ping();
        console.log('Connected!');

        console.log('\n--- ALL KEYS (limit 100) ---');
        const keys = await client.keys('*');
        console.log(`Total keys found: ${keys.length}`);
        keys.slice(0, 100).forEach(k => console.log(k));

        console.log('\n--- KEYS with "query" ---');
        const queryKeys = await client.keys('*query*');
        queryKeys.forEach(k => console.log(k));

    } catch (err) {
        console.error('Error:', err);
    } finally {
        client.disconnect();
    }
}

main();
