import { useState } from "react";
import {
    ArrowLeft,
    FileDown,
    FileText,
    FileSpreadsheet,
    Download,
    Calendar,
    MessageSquare,
    BarChart3,
    Users,
    Database,
    Loader2,
    CheckCircle,
    AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ExportsPanelProps {
    onBack: () => void;
}

type ExportFormat = "pdf" | "docx" | "md" | "csv" | "json";
type DateRange = "7d" | "30d" | "90d" | "all";

interface ExportOption {
    id: string;
    title: string;
    description: string;
    icon: React.ReactNode;
    formats: ExportFormat[];
}

const exportOptions: ExportOption[] = [
    {
        id: "chats",
        title: "Conversas do Chat I.A",
        description: "Exporte todas as conversas e respostas da IA",
        icon: <MessageSquare className="w-5 h-5" />,
        formats: ["pdf", "docx", "md"]
    },
    {
        id: "usage",
        title: "Relatório de Uso",
        description: "Tokens consumidos, queries realizadas e estatísticas",
        icon: <BarChart3 className="w-5 h-5" />,
        formats: ["pdf", "csv"]
    },
    {
        id: "feedback",
        title: "Relatório de Feedback",
        description: "Avaliações positivas e negativas das respostas",
        icon: <FileText className="w-5 h-5" />,
        formats: ["pdf", "csv"]
    },
    {
        id: "users",
        title: "Lista de Usuários",
        description: "Exporte dados dos usuários do sistema",
        icon: <Users className="w-5 h-5" />,
        formats: ["csv", "json"]
    },
    {
        id: "documents",
        title: "Documentos Indexados",
        description: "Lista de todos os documentos na base de conhecimento",
        icon: <Database className="w-5 h-5" />,
        formats: ["csv", "json"]
    }
];

const formatLabels: Record<ExportFormat, string> = {
    pdf: "PDF",
    docx: "Word",
    md: "Markdown",
    csv: "CSV",
    json: "JSON"
};

const formatIcons: Record<ExportFormat, React.ReactNode> = {
    pdf: <FileText className="w-4 h-4 text-red-400" />,
    docx: <FileText className="w-4 h-4 text-blue-400" />,
    md: <FileText className="w-4 h-4 text-gray-400" />,
    csv: <FileSpreadsheet className="w-4 h-4 text-green-400" />,
    json: <FileSpreadsheet className="w-4 h-4 text-yellow-400" />
};

const dateRangeLabels: Record<DateRange, string> = {
    "7d": "Últimos 7 dias",
    "30d": "Últimos 30 dias",
    "90d": "Últimos 90 dias",
    "all": "Todos os dados"
};

const ExportsPanel = ({ onBack }: ExportsPanelProps) => {
    const [selectedRange, setSelectedRange] = useState<DateRange>("30d");
    const [exportingId, setExportingId] = useState<string | null>(null);
    const [exportStatus, setExportStatus] = useState<Record<string, "success" | "error" | null>>({});

    const handleExport = async (optionId: string, format: ExportFormat) => {
        const exportKey = `${optionId}-${format}`;
        setExportingId(exportKey);
        setExportStatus(prev => ({ ...prev, [exportKey]: null }));

        try {
            // Build query params
            const params = new URLSearchParams({
                format,
                range: selectedRange
            });

            // Get auth token from localStorage
            const token = localStorage.getItem('auth_token');

            // Call export API with auth header
            const response = await fetch(`/api/exports/${optionId}?${params}`, {
                method: "GET",
                headers: {
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                }
            });

            if (!response.ok) {
                throw new Error("Falha ao exportar");
            }

            // Get filename from headers or generate
            const contentDisposition = response.headers.get("Content-Disposition");
            let filename = `tecfag_${optionId}_${new Date().toISOString().split('T')[0]}.${format}`;
            if (contentDisposition) {
                // Match filename="..." or filename=...
                const match = contentDisposition.match(/filename[^;=\n]*=\s*(?:"([^"]+)"|([^;\n]+))/);
                if (match) {
                    filename = match[1] || match[2] || filename;
                    // Remove any trailing whitespace or quotes
                    filename = filename.trim().replace(/^["']|["']$/g, '');
                }
            }

            // Download file
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            setExportStatus(prev => ({ ...prev, [exportKey]: "success" }));
        } catch (error) {
            console.error("Export error:", error);
            setExportStatus(prev => ({ ...prev, [exportKey]: "error" }));
        } finally {
            setExportingId(null);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onBack}
                    className="text-muted-foreground hover:text-foreground"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <FileDown className="w-6 h-6 text-primary" />
                        Exportação e Relatórios
                    </h2>
                    <p className="text-muted-foreground text-sm">
                        Exporte conversas, gere relatórios e baixe dados do sistema
                    </p>
                </div>
            </div>

            {/* Date Range Selector */}
            <div className="bg-card/50 rounded-xl border border-border/50 p-4">
                <div className="flex items-center gap-2 mb-3">
                    <Calendar className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">Período de dados</span>
                </div>
                <div className="flex flex-wrap gap-2">
                    {(Object.entries(dateRangeLabels) as [DateRange, string][]).map(([range, label]) => (
                        <button
                            key={range}
                            onClick={() => setSelectedRange(range)}
                            className={cn(
                                "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                                selectedRange === range
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted/50 text-muted-foreground hover:bg-muted"
                            )}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Export Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {exportOptions.map((option) => (
                    <div
                        key={option.id}
                        className="bg-card/50 rounded-xl border border-border/50 p-5 space-y-4"
                    >
                        {/* Option Header */}
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                {option.icon}
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-foreground">{option.title}</h3>
                                <p className="text-sm text-muted-foreground">{option.description}</p>
                            </div>
                        </div>

                        {/* Format Buttons */}
                        <div className="flex flex-wrap gap-2">
                            {option.formats.map((format) => {
                                const exportKey = `${option.id}-${format}`;
                                const isExporting = exportingId === exportKey;
                                const status = exportStatus[exportKey];

                                return (
                                    <Button
                                        key={format}
                                        variant="outline"
                                        size="sm"
                                        disabled={isExporting}
                                        onClick={() => handleExport(option.id, format)}
                                        className={cn(
                                            "gap-2 transition-all",
                                            status === "success" && "border-green-500/50 text-green-500",
                                            status === "error" && "border-red-500/50 text-red-500"
                                        )}
                                    >
                                        {isExporting ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : status === "success" ? (
                                            <CheckCircle className="w-4 h-4" />
                                        ) : status === "error" ? (
                                            <AlertCircle className="w-4 h-4" />
                                        ) : (
                                            formatIcons[format]
                                        )}
                                        {formatLabels[format]}
                                        {!isExporting && !status && <Download className="w-3 h-3" />}
                                    </Button>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer Info */}
            <div className="text-center text-sm text-muted-foreground">
                <p>Os arquivos exportados serão baixados automaticamente para o seu computador.</p>
            </div>
        </div>
    );
};

export default ExportsPanel;
