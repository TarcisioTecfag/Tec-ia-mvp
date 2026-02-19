export interface Specification {
    label: string;
    value: string;
}

export interface Machine {
    id: string;
    name: string;
    category: string;
    capacity?: string;
    model: string;
    price: string;
    next?: string; // New customizable field
    // New Stock Status
    stockStatus: "in_stock" | "out_of_stock" | "future_stock";
    // Replaces maintenanceStatus
    tags: string[]; // List of Tag IDs or Names
    specifications: Specification[];
    images: string[];
    youtubeUrl: string;

    // Legacy fields for migration (optional)
    maintenanceStatus?: string;
    lastMaintenance?: string;
}

export interface CatalogTabProps {
    isAdmin: boolean;
}

export const STOCK_OPTIONS = {
    in_stock: { label: "Em Estoque", color: "text-green-400 bg-green-500/20 border-green-500/30" },
    out_of_stock: { label: "Em Falta", color: "text-red-400 bg-red-500/20 border-red-500/30" },
    future_stock: { label: "Estoque Futuro", color: "text-blue-400 bg-blue-500/20 border-blue-500/30" },
};

export const INITIAL_TAGS = ["Novo", "Promoção", "Destaque", "Automático", "Manual"];

export interface Category {
    id: string;
    name: string;
    description: string;
    image: string;
}

export const CATEGORIES: Category[] = [
    // Specific categories first to avoid partial matching issues
    { id: "seladoras-caixa", name: "Seladoras de Caixa", description: "Seladoras específicas para caixas de papelão", image: "seladoras-caixa" },
    { id: "seladoras", name: "Seladoras", description: "Seladoras de caixas, bandejas e embalagens", image: "seladoras" },
    { id: "dispensadores-fita", name: "Dispensadores de Fita", description: "Dispensadores de fita adesiva para embalagens", image: "dispensadores-fita" },
    { id: "esteiras", name: "Esteira Transportadora", description: "Esteiras transportadoras e sistemas de transporte", image: "esteiras" },
    { id: "abastecedor-automatico", name: "Abastecedor Automático", description: "Abastecedores automáticos para linhas de produção", image: "abastecedor-automatico" },
    { id: "alimentadores-parafuso", name: "Alimentadores de Parafuso", description: "Alimentadores de parafuso para dosagem e transporte", image: "alimentadores-parafuso" },
    { id: "aplicador-stretch", name: "Aplicador de Stretch", description: "Aplicadores de filme stretch para paletização", image: "aplicador-stretch" },
    { id: "arqueadoras", name: "Arqueadoras", description: "Arqueadoras automáticas e semi-automáticas", image: "arqueadoras" },
    { id: "datadoras", name: "Datadoras", description: "Datadoras e codificadoras de embalagens", image: "datadoras" },
    { id: "dosadoras", name: "Dosadoras", description: "Dosadoras de líquidos, pós e granulados", image: "dosadoras" },
    { id: "empacotadoras", name: "Empacotadoras", description: "Empacotadoras automáticas e semi-automáticas", image: "empacotadoras" },
    { id: "encapsuladoras", name: "Encapsuladoras", description: "Encapsuladoras para cápsulas e comprimidos", image: "encapsuladoras" },
    { id: "encartuchadeira", name: "Encartuchadeira Rotativa", description: "Encartuchadeiras rotativas para embalagens", image: "encartuchadeira" },
    { id: "envasadoras", name: "Envasadoras", description: "Envasadoras de líquidos, pastosos e granulados", image: "envasadoras" },
    { id: "fechadoras", name: "Fechadoras", description: "Fechadoras de tampas, lacres e cápsulas", image: "fechadoras" },
    { id: "mixers-rotativos", name: "Mixers Rotativos", description: "Mixers rotativos para mistura industrial", image: "mixers-rotativos" },
    { id: "moinhos-trituradores", name: "Moinhos Trituradores", description: "Moinhos e trituradores industriais", image: "moinhos-trituradores" },
    { id: "montadoras", name: "Montadoras", description: "Montadoras de caixas e embalagens", image: "montadoras" },
    { id: "prensas-rotativas", name: "Prensas Rotativas", description: "Prensas rotativas para compactação e moldagem", image: "prensas-rotativas" },
    { id: "rosqueadoras", name: "Rosqueadoras", description: "Rosqueadoras automáticas e semi-automáticas", image: "rosqueadoras" },
    { id: "rotuladoras", name: "Rotuladoras", description: "Rotuladoras automáticas para garrafas e frascos", image: "rotuladoras" },
    { id: "tanques-encolhimento", name: "Tanques de Encolhimento", description: "Tanques de encolhimento térmico para embalagens", image: "tanques-encolhimento" },
    { id: "termoformadoras", name: "Termoformadoras", description: "Termoformadoras para embalagens plásticas", image: "termoformadoras" },
    { id: "tuneis-encolhimento", name: "Túneis de Encolhimento", description: "Túneis de encolhimento térmico para embalagens", image: "tuneis-encolhimento" },
];
