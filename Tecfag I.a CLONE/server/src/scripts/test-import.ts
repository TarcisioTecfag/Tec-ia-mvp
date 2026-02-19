
// Test script to check if modules load correctly
console.log('Starting import test...');

async function testImports() {
    try {
        console.log('Importing mindmapGenerator...');
        const generator = await import('../services/ai/mindmapGenerator.js'); // Use .js akin to mindmaps.ts
        console.log('mindmapGenerator loaded:', Object.keys(generator));

        console.log('Importing mindmaps route...');
        const router = await import('../routes/mindmaps.js');
        console.log('mindmaps route loaded:', Object.keys(router));

    } catch (error) {
        console.error('Import failed:', error);
        process.exit(1);
    }
}

testImports();
