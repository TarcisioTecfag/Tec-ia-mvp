import { useState, useId, useCallback } from "react";
import {
    FileText,
    Play,
    Image as ImageIcon,
    X,
    Download,
    ChevronLeft,
    ChevronRight,
    ExternalLink,
    Maximize2
} from "lucide-react";
import { Dialog, DialogContent, DialogClose, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

// Types for different media
interface ImageMedia {
    type: "image";
    src: string;
    alt?: string;
}

interface PDFMedia {
    type: "pdf";
    fileName: string;
    url: string;
}

interface YouTubeMedia {
    type: "youtube";
    videoId: string;
    url: string;
}

type MediaItem = ImageMedia | PDFMedia | YouTubeMedia;

interface ChatMediaGalleryProps {
    images?: { src: string; alt?: string }[];
    pdfs?: { fileName: string; url: string }[];
    youtubeVideos?: { videoId: string; url: string }[];
    className?: string;
}

/**
 * Galeria unificada de mídia estilo Netflix
 * Combina imagens, PDFs e vídeos do YouTube em cards uniformes com carrossel horizontal
 */
export function ChatMediaGallery({ images = [], pdfs = [], youtubeVideos = [], className }: ChatMediaGalleryProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [numPages, setNumPages] = useState<number | null>(null);
    const [pdfError, setPdfError] = useState<string | null>(null);
    const [imageError, setImageError] = useState<Set<number>>(new Set());
    const descriptionId = useId();

    // Combine all media into a single array
    const allMedia: MediaItem[] = [
        ...images.map((img): ImageMedia => ({ type: "image", src: img.src, alt: img.alt })),
        ...pdfs.map((pdf): PDFMedia => ({ type: "pdf", fileName: pdf.fileName, url: pdf.url })),
        ...youtubeVideos.map((video): YouTubeMedia => ({ type: "youtube", videoId: video.videoId, url: video.url }))
    ];

    if (allMedia.length === 0) return null;

    const getFullUrl = (url: string) => {
        if (url.startsWith("http")) return url;
        if (url.startsWith("/uploads")) return url;
        if (!url.includes("/")) return `/uploads/${url}`;
        return url;
    };

    const getYouTubeThumbnail = (videoId: string) => {
        // Clean videoId - remove any query params that might have leaked
        const cleanId = videoId.split('&')[0].split('?')[0].trim();
        // Use mqdefault for 16:9 aspect ratio (best fit)
        return `https://img.youtube.com/vi/${cleanId}/mqdefault.jpg`;
    };

    const openMedia = (index: number) => {
        setCurrentIndex(index);
        setCurrentPage(1);
        setNumPages(null);
        setPdfError(null);
        setIsOpen(true);
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
            console.error("Error downloading:", error);
            window.open(getFullUrl(url), "_blank");
        }
    };

    const goNext = useCallback(() => {
        setCurrentIndex((prev) => (prev + 1) % allMedia.length);
        setCurrentPage(1);
        setNumPages(null);
    }, [allMedia.length]);

    const goPrev = useCallback(() => {
        setCurrentIndex((prev) => (prev - 1 + allMedia.length) % allMedia.length);
        setCurrentPage(1);
        setNumPages(null);
    }, [allMedia.length]);

    const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
        setNumPages(numPages);
        setPdfError(null);
    };

    const onDocumentLoadError = (error: Error) => {
        console.error("PDF load error:", error);
        setPdfError("Não foi possível carregar o PDF.");
    };

    const currentMedia = allMedia[currentIndex];

    // Render card based on media type
    const renderCard = (media: MediaItem, index: number) => {
        const isHovered = false; // Will be controlled by CSS hover

        switch (media.type) {
            case "image":
                return (
                    <button
                        key={`img-${index}`}
                        onClick={() => openMedia(index)}
                        className="group relative flex-shrink-0 w-[120px] h-[120px] sm:w-[140px] sm:h-[140px] rounded-xl overflow-hidden border border-white/10 hover:border-blue-400/60 transition-all duration-300 hover:shadow-[0_0_20px_rgba(59,130,246,0.3)]"
                    >
                        {!imageError.has(index) ? (
                            <img
                                src={getFullUrl(media.src)}
                                alt={media.alt || "Imagem"}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                loading="lazy"
                                onError={() => setImageError((prev) => new Set(prev).add(index))}
                            />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-blue-900/30 to-blue-800/20 flex items-center justify-center">
                                <ImageIcon className="w-10 h-10 text-blue-400/50" />
                            </div>
                        )}
                        <span className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <Maximize2 className="w-7 h-7 text-white drop-shadow-lg" />
                        </span>
                        <span className="absolute bottom-1.5 left-1.5 bg-blue-500/90 text-white text-[9px] px-2 py-0.5 rounded-md font-semibold shadow-md">
                            IMG
                        </span>
                    </button>
                );

            case "pdf":
                return (
                    <button
                        key={`pdf-${index}`}
                        onClick={() => openMedia(index)}
                        className="group relative flex-shrink-0 w-[120px] h-[120px] sm:w-[140px] sm:h-[140px] rounded-xl overflow-hidden border border-white/10 hover:border-red-400/60 transition-all duration-300 hover:shadow-[0_0_20px_rgba(239,68,68,0.3)] bg-gradient-to-br from-red-900/40 to-red-800/20"
                    >
                        <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-2">
                            <FileText className="w-10 h-10 text-red-400 transition-transform duration-300 group-hover:scale-110" />
                            <span className="text-[11px] text-white/90 text-center truncate w-full px-1 font-medium">
                                {media.fileName.length > 14 ? `${media.fileName.slice(0, 12)}...` : media.fileName}
                            </span>
                        </div>
                        <span className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <span className="text-sm text-white font-semibold drop-shadow-lg">Visualizar</span>
                        </span>
                        <span className="absolute bottom-1.5 left-1.5 bg-red-500/90 text-white text-[9px] px-2 py-0.5 rounded-md font-semibold shadow-md">
                            PDF
                        </span>
                    </button>
                );

            case "youtube":
                const cleanVideoId = media.videoId.split('&')[0].split('?')[0].trim();
                return (
                    <button
                        key={`yt-${index}`}
                        onClick={() => openMedia(index)}
                        className="group relative flex-shrink-0 w-[213px] h-[120px] sm:w-[249px] sm:h-[140px] rounded-xl overflow-hidden border border-white/10 hover:border-red-500/60 transition-all duration-300 hover:shadow-[0_0_25px_rgba(220,38,38,0.4)]"
                    >
                        <img
                            src={getYouTubeThumbnail(cleanVideoId)}
                            alt="YouTube video"
                            className="absolute inset-0 w-full h-full object-cover object-center scale-[1.35]"
                            loading="lazy"
                            onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                if (!target.src.includes('default.jpg')) {
                                    target.src = `https://img.youtube.com/vi/${cleanVideoId}/default.jpg`;
                                }
                            }}
                        />
                        <span className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent group-hover:from-black/60 transition-all duration-300 flex items-center justify-center">
                            <span className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:shadow-[0_0_15px_rgba(220,38,38,0.6)] transition-all duration-300">
                                <Play className="w-6 h-6 text-white fill-white ml-0.5" />
                            </span>
                        </span>
                        <span className="absolute bottom-1.5 right-1.5 bg-red-600 text-white text-[9px] px-2 py-0.5 rounded-md font-semibold shadow-md flex items-center gap-1">
                            <Play className="w-3 h-3 fill-white" />
                            YouTube
                        </span>
                    </button>
                );
        }
    };

    // Render modal content based on current media type
    const renderModalContent = () => {
        switch (currentMedia.type) {
            case "image":
                return (
                    <motion.div
                        key={`modal-img-${currentIndex}`}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="flex items-center justify-center max-h-[70vh]"
                    >
                        <img
                            src={getFullUrl(currentMedia.src)}
                            alt={currentMedia.alt || "Imagem"}
                            className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-2xl"
                        />
                    </motion.div>
                );

            case "pdf":
                return (
                    <motion.div
                        key={`modal-pdf-${currentIndex}`}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="flex flex-col items-center justify-center"
                    >
                        {pdfError ? (
                            <div className="text-white/70 text-center p-8">
                                <FileText className="w-16 h-16 text-red-400/50 mx-auto mb-4" />
                                <p>{pdfError}</p>
                                <Button
                                    variant="secondary"
                                    className="mt-4"
                                    onClick={(e) => handleDownload(e, currentMedia.url, currentMedia.fileName)}
                                >
                                    <Download className="w-4 h-4 mr-2" />
                                    Baixar PDF
                                </Button>
                            </div>
                        ) : (
                            <Document
                                file={getFullUrl(currentMedia.url)}
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
                                    width={Math.min(window.innerWidth * 0.7, 800)}
                                />
                            </Document>
                        )}

                        {/* PDF Page Navigation */}
                        {numPages && numPages > 1 && (
                            <div className="flex items-center gap-4 mt-4">
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                    disabled={currentPage <= 1}
                                    className="bg-zinc-700 text-white hover:bg-zinc-600"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </Button>
                                <span className="text-sm text-white/80">
                                    {currentPage} / {numPages}
                                </span>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => setCurrentPage((p) => Math.min(numPages, p + 1))}
                                    disabled={currentPage >= numPages}
                                    className="bg-zinc-700 text-white hover:bg-zinc-600"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </Button>
                            </div>
                        )}
                    </motion.div>
                );

            case "youtube":
                const cleanVideoId = currentMedia.videoId.split('&')[0].split('?')[0];
                return (
                    <motion.div
                        key={`modal-yt-${currentIndex}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="w-full max-w-4xl aspect-video"
                    >
                        <iframe
                            src={`https://www.youtube.com/embed/${cleanVideoId}?autoplay=1&rel=0`}
                            title="YouTube video player"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            className="w-full h-full rounded-lg shadow-2xl"
                        />
                    </motion.div>
                );
        }
    };

    // Get action buttons for current media type
    const getActionButtons = () => {
        switch (currentMedia.type) {
            case "image":
                return (
                    <Button
                        variant="secondary"
                        size="sm"
                        className="rounded-md bg-zinc-700 text-white hover:bg-zinc-600 border border-white/10"
                        onClick={(e) => {
                            const img = currentMedia as ImageMedia;
                            const fileName = img.alt || `image-${currentIndex}.jpg`;
                            handleDownload(e, img.src, fileName);
                        }}
                    >
                        <Download className="w-4 h-4 mr-1" />
                        Download
                    </Button>
                );
            case "pdf":
                return (
                    <>
                        <Button
                            variant="secondary"
                            size="sm"
                            className="rounded-md bg-zinc-700 text-white hover:bg-zinc-600 border border-white/10"
                            onClick={(e) => handleDownload(e, currentMedia.url, currentMedia.fileName)}
                        >
                            <Download className="w-4 h-4 mr-1" />
                            Download
                        </Button>
                        <Button
                            variant="secondary"
                            size="sm"
                            className="rounded-md bg-zinc-700 text-white hover:bg-zinc-600 border border-white/10"
                            onClick={() => window.open(getFullUrl(currentMedia.url), "_blank")}
                        >
                            <ExternalLink className="w-4 h-4" />
                        </Button>
                    </>
                );
            case "youtube":
                return (
                    <Button
                        variant="secondary"
                        size="sm"
                        className="rounded-md bg-zinc-700 text-white hover:bg-zinc-600 border border-white/10"
                        onClick={() => window.open(currentMedia.url, "_blank")}
                    >
                        <ExternalLink className="w-4 h-4 mr-1" />
                        YouTube
                    </Button>
                );
        }
    };

    // Get title for current media type
    const getMediaTitle = () => {
        switch (currentMedia.type) {
            case "image":
                return (currentMedia as ImageMedia).alt || `Imagem ${currentIndex + 1}`;
            case "pdf":
                return (currentMedia as PDFMedia).fileName;
            case "youtube":
                return "Vídeo do YouTube";
        }
    };

    // Get badge color for current media type
    const getBadgeColor = () => {
        switch (currentMedia.type) {
            case "image":
                return "bg-blue-500";
            case "pdf":
                return "bg-red-500";
            case "youtube":
                return "bg-red-600";
        }
    };

    return (
        <>
            {/* Unified Media Gallery - Netflix Style */}
            <div
                className={cn(
                    "mt-1 mb-3 p-2 rounded-xl bg-black/20 border border-white/5",
                    className
                )}
            >
                {/* Gallery Header */}
                <div className="flex items-center gap-2 mb-2.5 px-1">
                    <span className="text-[11px] uppercase tracking-wider text-white/50 font-semibold">
                        📎 Anexos
                    </span>
                    <span className="text-[10px] text-white/30 bg-white/5 px-1.5 py-0.5 rounded-full">
                        {allMedia.length}
                    </span>
                </div>

                {/* Horizontal Scroll Gallery */}
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                    {allMedia.map((media, index) => renderCard(media, index))}
                </div>
            </div>

            {/* Fullscreen Modal */}
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent
                    className="max-w-[95vw] max-h-[95vh] w-[90vw] h-[90vh] p-0 border border-white/10 bg-zinc-900/95 shadow-2xl overflow-hidden flex flex-col focus:outline-none ring-0 outline-none"
                    aria-describedby={descriptionId}
                >
                    <DialogTitle className="sr-only">Visualizador de Mídia</DialogTitle>
                    <DialogDescription id={descriptionId} className="sr-only">
                        {getMediaTitle()}
                    </DialogDescription>

                    {/* Header Bar */}
                    <div className="flex items-center justify-between px-4 py-3 bg-zinc-800/80 border-b border-white/10">
                        <div className="flex items-center gap-2">
                            <span className={cn("text-white text-xs px-2 py-0.5 rounded font-medium", getBadgeColor())}>
                                {currentMedia.type.toUpperCase()}
                            </span>
                            <span className="text-sm text-white/90 font-medium truncate max-w-[300px]">
                                {getMediaTitle()}
                            </span>
                            {allMedia.length > 1 && (
                                <span className="text-xs text-white/50">
                                    ({currentIndex + 1}/{allMedia.length})
                                </span>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            {getActionButtons()}
                            <DialogClose asChild>
                                <Button
                                    variant="secondary"
                                    size="icon"
                                    className="rounded-md bg-zinc-700 text-white hover:bg-zinc-600 border border-white/10"
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            </DialogClose>
                        </div>
                    </div>

                    {/* Content Area with Navigation */}
                    <div className="flex-1 overflow-auto flex items-center justify-center bg-zinc-800/50 p-4 relative">
                        {allMedia.length > 1 && (
                            <>
                                <Button
                                    variant="secondary"
                                    size="icon"
                                    className="absolute left-4 top-1/2 -translate-y-1/2 z-50 rounded-full bg-black/50 text-white hover:bg-black/70 border border-white/10 backdrop-blur-md"
                                    onClick={goPrev}
                                >
                                    <ChevronLeft className="w-6 h-6" />
                                </Button>
                                <Button
                                    variant="secondary"
                                    size="icon"
                                    className="absolute right-4 top-1/2 -translate-y-1/2 z-50 rounded-full bg-black/50 text-white hover:bg-black/70 border border-white/10 backdrop-blur-md"
                                    onClick={goNext}
                                >
                                    <ChevronRight className="w-6 h-6" />
                                </Button>
                            </>
                        )}

                        <AnimatePresence mode="wait">
                            {renderModalContent()}
                        </AnimatePresence>
                    </div>

                    {/* Bottom Thumbnails (if multiple items) */}
                    {allMedia.length > 1 && (
                        <div className="flex items-center justify-center gap-2 px-4 py-3 bg-zinc-800/80 border-t border-white/10 overflow-x-auto">
                            {allMedia.map((media, idx) => (
                                <button
                                    key={`thumb-${idx}`}
                                    onClick={() => {
                                        setCurrentIndex(idx);
                                        setCurrentPage(1);
                                        setNumPages(null);
                                    }}
                                    className={cn(
                                        "w-12 h-12 rounded-md overflow-hidden border-2 transition-all flex-shrink-0 flex items-center justify-center",
                                        idx === currentIndex
                                            ? "border-blue-500 scale-110"
                                            : "border-transparent opacity-60 hover:opacity-100",
                                        media.type === "pdf" && "bg-red-900/30",
                                        media.type === "youtube" && "bg-black"
                                    )}
                                >
                                    {media.type === "image" && (
                                        <img
                                            src={getFullUrl(media.src)}
                                            alt=""
                                            className="w-full h-full object-cover"
                                        />
                                    )}
                                    {media.type === "pdf" && (
                                        <FileText className="w-5 h-5 text-red-400" />
                                    )}
                                    {media.type === "youtube" && (
                                        <img
                                            src={getYouTubeThumbnail(media.videoId)}
                                            alt=""
                                            className="w-full h-full object-cover"
                                        />
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
