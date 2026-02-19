import { useState, useMemo } from "react";
import { Folder, Search, FolderOpen } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Category, CATEGORIES, Machine } from "@/types/catalog";

// Image imports
import imgSeladoras from "@/assets/catalog/category-seladoras.jpg";
import imgEnvasadoras from "@/assets/catalog/category-envasadoras.jpg";
import imgFechadoras from "@/assets/catalog/category-fechadoras.jpg";
import imgRosqueadoras from "@/assets/catalog/category-rosqueadoras.jpg";
import imgEsteiras from "@/assets/catalog/category-esteiras.jpg";
import imgAbastecedorAutomatico from "@/assets/catalog/category-abastecedor-automatico.jpg";
import imgAlimentadoresParafuso from "@/assets/catalog/category-alimentadores-parafuso.jpg";
import imgAplicadorStretch from "@/assets/catalog/category-aplicador-stretch.jpg";
import imgArqueadoras from "@/assets/catalog/category-arqueadoras.jpg";
import imgDatadoras from "@/assets/catalog/category-datadoras.jpg";
import imgDispensadoresFita from "@/assets/catalog/category-dispensadores-fita.jpg";
import imgDosadoras from "@/assets/catalog/category-dosadoras.jpg";
import imgEmpacotadoras from "@/assets/catalog/category-empacotadoras.jpg";
import imgEncapsuladoras from "@/assets/catalog/category-encapsuladoras.jpg";
import imgEncartuchadeira from "@/assets/catalog/category-encartuchadeira.jpg";
import imgSeladorasCaixa from "@/assets/catalog/category-seladoras-caixa.jpg";
import imgMixersRotativos from "@/assets/catalog/category-mixers-rotativos.jpg";
import imgMoinhosTrituradores from "@/assets/catalog/category-moinhos-trituradores.jpg";
import imgMontadoras from "@/assets/catalog/category-montadoras.jpg";
import imgPrensasRotativas from "@/assets/catalog/category-prensas-rotativas.jpg";
import imgRotuladoras from "@/assets/catalog/category-rotuladoras.jpg";
import imgTanquesEncolhimento from "@/assets/catalog/category-tanques-encolhimento.jpg";
import imgTermoformadoras from "@/assets/catalog/category-termoformadoras.jpg";
import imgTuneisEncolhimento from "@/assets/catalog/category-tuneis-encolhimento.jpg";

const imageMap: Record<string, string> = {
    seladoras: imgSeladoras,
    envasadoras: imgEnvasadoras,
    fechadoras: imgFechadoras,
    rosqueadoras: imgRosqueadoras,
    esteiras: imgEsteiras,
    "abastecedor-automatico": imgAbastecedorAutomatico,
    "alimentadores-parafuso": imgAlimentadoresParafuso,
    "aplicador-stretch": imgAplicadorStretch,
    arqueadoras: imgArqueadoras,
    datadoras: imgDatadoras,
    "dispensadores-fita": imgDispensadoresFita,
    dosadoras: imgDosadoras,
    empacotadoras: imgEmpacotadoras,
    encapsuladoras: imgEncapsuladoras,
    encartuchadeira: imgEncartuchadeira,
    "seladoras-caixa": imgSeladorasCaixa,
    "mixers-rotativos": imgMixersRotativos,
    "moinhos-trituradores": imgMoinhosTrituradores,
    montadoras: imgMontadoras,
    "prensas-rotativas": imgPrensasRotativas,
    rotuladoras: imgRotuladoras,
    "tanques-encolhimento": imgTanquesEncolhimento,
    termoformadoras: imgTermoformadoras,
    "tuneis-encolhimento": imgTuneisEncolhimento,
};

interface CategoryGridProps {
    machines: Machine[];
    onSelectCategory: (categoryId: string) => void;
}

export const CategoryGrid = ({ machines, onSelectCategory }: CategoryGridProps) => {
    const [search, setSearch] = useState("");

    // Count machines per category
    const machineCountByCategory = useMemo(() => {
        const counts: Record<string, number> = {};
        machines.forEach(m => {
            // Strict matching: Match machine category exact name or id
            const cat = CATEGORIES.find(c =>
                c.name === m.category ||
                c.id === m.category ||
                // Case-insensitive fallback for minor discrepancies, but full string match
                c.name.toLowerCase() === m.category.toLowerCase()
            );

            if (cat) {
                counts[cat.id] = (counts[cat.id] || 0) + 1;
            } else {
                // Fallback: try to normalize if no direct match found (legacy behavior support)
                const normalizedCat = m.category.toLowerCase()
                    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
                    .replace(/\s+/g, "-");
                // Only count if it maps to a known category ID to avoid pollution
                if (CATEGORIES.some(c => c.id === normalizedCat)) {
                    counts[normalizedCat] = (counts[normalizedCat] || 0) + 1;
                }
            }
        });
        return counts;
    }, [machines]);

    // Filter categories by search
    const filteredCategories = useMemo(() => {
        if (!search.trim()) return CATEGORIES;
        const q = search.toLowerCase();
        return CATEGORIES.filter(c =>
            c.name.toLowerCase().includes(q) ||
            c.description.toLowerCase().includes(q)
        );
    }, [search]);

    const totalMachines = machines.length;

    return (
        <div className="h-full overflow-y-auto scrollbar-thin p-4">
            <div className="w-full mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-start justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <FolderOpen className="h-7 w-7 text-primary" />
                            <h2 className="font-display text-2xl font-bold text-foreground">
                                Catálogo de Máquinas
                            </h2>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            {totalMachines} equipamentos em {CATEGORIES.length} categorias
                        </p>
                    </div>
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Buscar categorias..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10 bg-card border-border"
                    />
                </div>

                {/* Category Grid */}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredCategories.map((category, i) => {
                        const count = machineCountByCategory[category.id] || 0;
                        return (
                            <button
                                key={category.id}
                                onClick={() => onSelectCategory(category.name)}
                                className="category-card-glow group flex flex-col overflow-hidden rounded-lg border border-border bg-card text-left opacity-0 animate-fade-in-up"
                                style={{ animationDelay: `${i * 80}ms` }}
                            >
                                <div className="relative h-48 overflow-hidden">
                                    <img
                                        src={imageMap[category.image]}
                                        alt={category.name}
                                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
                                    <div className="absolute bottom-3 left-3 flex items-center gap-2">
                                        <Folder className="h-5 w-5 text-primary" />
                                        <span className="text-sm font-medium text-muted-foreground">
                                            {count} {count === 1 ? "máquina" : "máquinas"}
                                        </span>
                                    </div>
                                </div>
                                <div className="p-4">
                                    <h3 className="font-display text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                                        {category.name}
                                    </h3>
                                    <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                                        {category.description}
                                    </p>
                                </div>
                            </button>
                        );
                    })}
                </div>

                {filteredCategories.length === 0 && (
                    <div className="rounded-lg border border-border bg-card p-12 text-center">
                        <Search className="mx-auto h-10 w-10 text-muted-foreground/50 mb-3" />
                        <p className="text-muted-foreground">Nenhuma categoria encontrada.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CategoryGrid;
