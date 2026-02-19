
// Mock CATEGORIES matches src/types/catalog.ts
const CATEGORIES = [
    { id: "seladoras-caixa", name: "Seladoras de Caixa" },
    { id: "seladoras", name: "Seladoras" },
    { id: "dispensadores-fita", name: "Dispensadores de Fita" },
];

// Mock Machines
const machines = [
    { id: "1", category: "Seladoras" },
    { id: "2", category: "Seladoras" },
    { id: "3", category: "Seladoras de Caixa" }, // Should match seladoras-caixa ONLY
    { id: "4", category: "Seladoras" },
    { id: "5", category: "Dispensadores de Fita" },
];

function calculateCounts(machines) {
    const counts = {};
    machines.forEach(m => {
        // Strict matching logic from CategoryGrid.tsx
        const cat = CATEGORIES.find(c =>
            c.name === m.category ||
            c.id === m.category ||
            c.name.toLowerCase() === m.category.toLowerCase()
        );

        if (cat) {
            console.log(`Machine ${m.category} matched to ${cat.name} (${cat.id})`);
            counts[cat.id] = (counts[cat.id] || 0) + 1;
        } else {
            // Fallback: try to normalize
            const normalizedCat = m.category.toLowerCase()
                .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
                .replace(/\s+/g, "-");

            if (CATEGORIES.some(c => c.id === normalizedCat)) {
                console.log(`Machine ${m.category} matched by ID to ${normalizedCat}`);
                counts[normalizedCat] = (counts[normalizedCat] || 0) + 1;
            } else {
                console.log(`Machine ${m.category} NOT MATCHED`);
            }
        }
    });
    return counts;
}

const result = calculateCounts(machines);
console.log("\nCounts:", result);

// Expected:
// seladoras: 3
// seladoras-caixa: 1
// dispensadores-fita: 1
