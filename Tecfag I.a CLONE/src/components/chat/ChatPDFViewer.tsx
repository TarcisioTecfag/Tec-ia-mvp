import { useState, useId, useCallback } from "react";
import { FileText, X, Download, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { Dialog, DialogContent, DialogClose, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Document, Page, pdfjs } from "react-pdf";

// Import PDF.js styles - use try/catch for different react-pdf versions
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFData {
    fileName: string;
    url: string;
}

interface ChatPDFViewerProps {
    pdfs: PDFData[];
    className?: string;
}

/**
 * Componente para visualizar PDFs como mídia no chat
 * Exibe ícones compactos que, ao clicar, abrem modal em tela cheia com navegação de páginas
 */
export function ChatPDFViewer({ pdfs, className }: ChatPDFViewerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [currentPdfIndex, setCurrentPdfIndex] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [numPages, setNumPages] = useState<number | null>(null);
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const [pdfError, setPdfError] = useState<string | null>(null);
    const descriptionId = useId();

    if (!pdfs || pdfs.length === 0) return null;

    const getFullUrl = (pdfUrl: string) => {
        if (pdfUrl.startsWith("http")) return pdfUrl;
        if (pdfUrl.startsWith("/uploads")) return pdfUrl;
        if (!pdfUrl.includes("/")) return `/uploads/${pdfUrl}`;
        return pdfUrl;
    };

    const handleDownload = async (e: React.MouseEvent, url: string, fileName: string) => {
        e.stopPropagation();
        try {
            const response = await fetch(getFullUrl(url));
            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = downloadUrl;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(downloadUrl);
        } catch (error) {
            console.error("Error downloading PDF:", error);
            window.open(getFullUrl(url), "_blank");
        }
    };

    const openPdf = (index: number) => {
        setCurrentPdfIndex(index);
        setCurrentPage(1);
        setNumPages(null);
        setPdfError(null);
        setIsOpen(true);
    };

    const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
        setNumPages(numPages);
        setPdfError(null);
    };

    const onDocumentLoadError = (error: Error) => {
        console.error("PDF load error:", error);
        setPdfError("Não foi possível carregar o PDF. Tente fazer o download.");
    };

    const goNextPage = useCallback(
        (e?: React.MouseEvent) => {
            e?.stopPropagation();
            if (numPages && currentPage < numPages) {
                setCurrentPage((prev) => prev + 1);
            }
        },
        [currentPage, numPages]
    );

    const goPrevPage = useCallback(
        (e?: React.MouseEvent) => {
            e?.stopPropagation();
            if (currentPage > 1) {
                setCurrentPage((prev) => prev - 1);
            }
        },
        [currentPage]
    );

    const goNextPdf = useCallback(
        (e?: React.MouseEvent) => {
            e?.stopPropagation();
            setCurrentPdfIndex((prev) => (prev + 1) % pdfs.length);
            setCurrentPage(1);
            setNumPages(null);
        },
        [pdfs.length]
    );

    const goPrevPdf = useCallback(
        (e?: React.MouseEvent) => {
            e?.stopPropagation();
            setCurrentPdfIndex((prev) => (prev - 1 + pdfs.length) % pdfs.length);
            setCurrentPage(1);
            setNumPages(null);
        },
        [pdfs.length]
    );

    const currentPdf = pdfs[currentPdfIndex];

    return (
        <>
            {/* PDF Icons Container */}
            <div
                className={cn(
                    "flex flex-wrap gap-2 my-3 p-2 rounded-xl bg-black/20 border border-white/5",
                    className
                )}
            >
                {pdfs.map((pdf, index) => (
                    <button
                        key={`${pdf.url}-${index}`}
                        onClick={() => openPdf(index)}
                        className={cn(
                            "relative group cursor-pointer overflow-hidden rounded-lg border border-white/10 shadow-lg bg-gradient-to-br from-red-900/30 to-red-800/20 transition-all duration-300 hover:border-red-400/50 hover:shadow-xl flex-shrink-0",
                            "w-[100px] h-[100px] sm:w-[120px] sm:h-[120px] flex flex-col items-center justify-center gap-2"
                        )}
                        onMouseEnter={() => setHoveredIndex(index)}
                        onMouseLeave={() => setHoveredIndex(null)}
                    >
                        <FileText className="w-8 h-8 text-red-400" />
                        <span className="text-xs text-white/80 text-center px-1 truncate w-full">
                            {pdf.fileName.length > 15 ? `${pdf.fileName.slice(0, 12)}...` : pdf.fileName}
                        </span>

                        {/* Overlay on hover */}
                        <span
                            className={cn(
                                "absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 transition-opacity duration-300",
                                hoveredIndex === index ? "opacity-100" : ""
                            )}
                        >
                            <span className="text-xs text-white/90">Visualizar</span>
                        </span>

                        {/* PDF counter badge */}
                        {pdfs.length > 1 && index === 0 && (
                            <span className="absolute top-1 right-1 bg-red-500/80 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                                {pdfs.length}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Fullscreen PDF Viewer Dialog */}
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent
                    className="max-w-[95vw] max-h-[95vh] w-[90vw] h-[90vh] p-0 border border-white/10 bg-zinc-900/95 shadow-2xl overflow-hidden flex flex-col focus:outline-none ring-0 outline-none"
                    aria-describedby={descriptionId}
                >
                    <DialogTitle className="sr-only">Visualizador de PDF</DialogTitle>
                    <DialogDescription id={descriptionId} className="sr-only">
                        Visualização do PDF {currentPdf.fileName}, página {currentPage} de {numPages || "?"}
                    </DialogDescription>

                    {/* Header Bar */}
                    <div className="flex items-center justify-between px-4 py-3 bg-zinc-800/80 border-b border-white/10">
                        <div className="flex items-center gap-2">
                            <FileText className="w-5 h-5 text-red-400" />
                            <span className="text-sm text-white/90 font-medium truncate max-w-[300px]">
                                {currentPdf.fileName}
                            </span>
                            {pdfs.length > 1 && (
                                <span className="text-xs text-white/50">
                                    ({currentPdfIndex + 1}/{pdfs.length})
                                </span>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                variant="secondary"
                                size="sm"
                                className="rounded-md bg-zinc-700 text-white hover:bg-zinc-600 border border-white/10"
                                onClick={(e) => handleDownload(e, currentPdf.url, currentPdf.fileName)}
                                title="Baixar PDF"
                            >
                                <Download className="w-4 h-4 mr-1" />
                                Download
                            </Button>

                            <Button
                                variant="secondary"
                                size="sm"
                                className="rounded-md bg-zinc-700 text-white hover:bg-zinc-600 border border-white/10"
                                onClick={() => window.open(getFullUrl(currentPdf.url), "_blank")}
                                title="Abrir em nova aba"
                            >
                                <ExternalLink className="w-4 h-4" />
                            </Button>

                            <DialogClose asChild>
                                <Button
                                    variant="secondary"
                                    size="icon"
                                    className="rounded-md bg-zinc-700 text-white hover:bg-zinc-600 border border-white/10"
                                    title="Fechar"
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            </DialogClose>
                        </div>
                    </div>

                    {/* PDF Viewer */}
                    <div className="flex-1 overflow-auto flex items-center justify-center bg-zinc-800/50 p-4 relative">
                        {pdfs.length > 1 && (
                            <>
                                <Button
                                    variant="secondary"
                                    size="icon"
                                    className="absolute left-2 top-1/2 -translate-y-1/2 z-50 rounded-full bg-black/50 text-white hover:bg-black/70 border border-white/10 backdrop-blur-md"
                                    onClick={goPrevPdf}
                                    title="PDF anterior"
                                >
                                    <ChevronLeft className="w-6 h-6" />
                                </Button>
                                <Button
                                    variant="secondary"
                                    size="icon"
                                    className="absolute right-2 top-1/2 -translate-y-1/2 z-50 rounded-full bg-black/50 text-white hover:bg-black/70 border border-white/10 backdrop-blur-md"
                                    onClick={goNextPdf}
                                    title="Próximo PDF"
                                >
                                    <ChevronRight className="w-6 h-6" />
                                </Button>
                            </>
                        )}

                        <AnimatePresence mode="wait">
                            <motion.div
                                key={`${currentPdfIndex}-${currentPage}`}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                                className="flex items-center justify-center"
                            >
                                {pdfError ? (
                                    <div className="text-white/70 text-center p-8">
                                        <FileText className="w-16 h-16 text-red-400/50 mx-auto mb-4" />
                                        <p>{pdfError}</p>
                                        <Button
                                            variant="secondary"
                                            className="mt-4"
                                            onClick={(e) => handleDownload(e, currentPdf.url, currentPdf.fileName)}
                                        >
                                            <Download className="w-4 h-4 mr-2" />
                                            Baixar PDF
                                        </Button>
                                    </div>
                                ) : (
                                    <Document
                                        file={getFullUrl(currentPdf.url)}
                                        onLoadSuccess={onDocumentLoadSuccess}
                                        onLoadError={onDocumentLoadError}
                                        loading={
                                            <div className="text-white/50 text-center p-8">
                                                <div className="animate-pulse">Carregando PDF...</div>
                                            </div>
                                        }
                                        className="max-h-full"
                                    >
                                        <Page
                                            pageNumber={currentPage}
                                            renderTextLayer={true}
                                            renderAnnotationLayer={true}
                                            className="shadow-2xl rounded-md overflow-hidden"
                                            width={Math.min(window.innerWidth * 0.8, 900)}
                                        />
                                    </Document>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Page Navigation Footer */}
                    {numPages && numPages > 1 && (
                        <div className="flex items-center justify-center gap-4 px-4 py-3 bg-zinc-800/80 border-t border-white/10">
                            <Button
                                variant="secondary"
                                size="sm"
                                className="rounded-md bg-zinc-700 text-white hover:bg-zinc-600 border border-white/10 disabled:opacity-50"
                                onClick={goPrevPage}
                                disabled={currentPage <= 1}
                            >
                                <ChevronLeft className="w-4 h-4" />
                                Anterior
                            </Button>

                            <span className="text-sm text-white/80">
                                Página {currentPage} de {numPages}
                            </span>

                            <Button
                                variant="secondary"
                                size="sm"
                                className="rounded-md bg-zinc-700 text-white hover:bg-zinc-600 border border-white/10 disabled:opacity-50"
                                onClick={goNextPage}
                                disabled={currentPage >= numPages}
                            >
                                Próxima
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
