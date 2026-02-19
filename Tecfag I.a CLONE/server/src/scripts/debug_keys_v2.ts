
import Redis from 'ioredis';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const REDIS_CONFIG = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || undefined,
};

async function main() {
    const logFile = path.join(process.cwd(), 'debug_output.txt');
    const log = (msg: string) => {
        console.log(msg);
        fs.appendFileSync(logFile, msg + '\n');
    };

    fs.writeFileSync(logFile, 'Starting debug...\n');
    log(`Connecting to Redis at ${REDIS_CONFIG.host}:${REDIS_CONFIG.port}`);

    const client = new Redis(REDIS_CONFIG);

    client.on('error', (err) => {
        log(`Redis Client Error: ${err.message}`);
        process.exit(1);
    });

    try {
        await client.ping();
        log('Connected!');

        log('\n--- ALL KEYS (limit 100) ---');
        const keys = await client.keys('*');
        log(`Total keys found: ${keys.length}`);
        keys.slice(0, 100).forEach(k => log(k));

        log('\n--- KEYS matching *query* ---');
        const queryKeys = await client.keys('*query*');
        queryKeys.forEach(k => log(k));

    } catch (err) {
        log(`Error: ${err}`);
    } finally {
        client.disconnect();
        log('Done.');
        process.exit(0);
    }
}

main();
