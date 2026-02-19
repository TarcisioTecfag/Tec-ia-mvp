import { useState, useId, useCallback } from "react";
import { Maximize2, X, Download, ChevronLeft, ChevronRight } from "lucide-react";
import { Dialog, DialogContent, DialogClose, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface ImageData {
    src: string;
    alt?: string;
}

interface ChatImageGalleryProps {
    images: ImageData[];
    className?: string;
}

/**
 * Componente de galeria de imagens horizontal
 * Exibe thumbnails quadrados lado a lado e abre em tela cheia com navegação
 */
export function ChatImageGallery({ images, className }: ChatImageGalleryProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const descriptionId = useId();

    if (!images || images.length === 0) return null;

    const getFullSrc = (imageSrc: string) => {
        if (imageSrc.startsWith('http')) return imageSrc;
        if (imageSrc.startsWith('/uploads')) return imageSrc;
        if (!imageSrc.includes('/')) return `/uploads/${imageSrc}`;
        return imageSrc;
    };

    const handleDownload = async (e: React.MouseEvent, src: string) => {
        e.stopPropagation();
        try {
            const response = await fetch(getFullSrc(src));
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = src.split("/").pop() || "downloaded-image";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Error downloading image:", error);
            window.open(getFullSrc(src), "_blank");
        }
    };

    const openImage = (index: number) => {
        setCurrentIndex(index);
        setIsOpen(true);
    };

    const goNext = useCallback((e?: React.MouseEvent) => {
        e?.stopPropagation();
        setCurrentIndex((prev) => (prev + 1) % images.length);
    }, [images.length]);

    const goPrev = useCallback((e?: React.MouseEvent) => {
        e?.stopPropagation();
        setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    }, [images.length]);

    const currentImage = images[currentIndex];

    return (
        <>
            {/* Horizontal Gallery Container */}
            <div
                className={cn(
                    "flex flex-wrap gap-2 my-3 p-2 rounded-xl bg-black/20 border border-white/5",
                    className
                )}
            >
                {images.map((image, index) => (
                    <button
                        key={`${image.src}-${index}`}
                        onClick={() => openImage(index)}
                        className={cn(
                            "relative group cursor-zoom-in overflow-hidden rounded-lg border border-white/10 shadow-lg bg-black/30 transition-all duration-300 hover:border-white/30 hover:shadow-xl flex-shrink-0",
                            "w-[100px] h-[100px] sm:w-[120px] sm:h-[120px]"
                        )}
                        onMouseEnter={() => setHoveredIndex(index)}
                        onMouseLeave={() => setHoveredIndex(null)}
                    >
                        <img
                            src={getFullSrc(image.src)}
                            alt={image.alt || `Imagem ${index + 1}`}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            loading="lazy"
                        />

                        {/* Overlay on hover */}
                        <span
                            className={cn(
                                "absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 transition-opacity duration-300",
                                hoveredIndex === index ? "opacity-100" : ""
                            )}
                        >
                            <span className="bg-black/70 p-2 rounded-full border border-white/20 backdrop-blur-sm">
                                <Maximize2 className="w-4 h-4 text-white" />
                            </span>
                        </span>

                        {/* Image counter badge */}
                        {images.length > 1 && index === 0 && (
                            <span className="absolute top-1 right-1 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded-full border border-white/20">
                                {images.length}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Fullscreen Dialog */}
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent
                    className="max-w-[95vw] max-h-[95vh] w-auto h-auto p-0 border-none bg-transparent shadow-none overflow-hidden flex items-center justify-center focus:outline-none ring-0 outline-none"
                    aria-describedby={descriptionId}
                >
                    <DialogTitle className="sr-only">Visualização da Galeria</DialogTitle>
                    <DialogDescription id={descriptionId} className="sr-only">
                        Visualização expandida da imagem {currentIndex + 1} de {images.length}
                    </DialogDescription>

                    <div className="relative w-full h-full flex items-center justify-center">
                        {/* Navigation Arrows */}
                        {images.length > 1 && (
                            <>
                                <Button
                                    variant="secondary"
                                    size="icon"
                                    className="absolute left-4 z-50 rounded-full bg-black/50 text-white hover:bg-black/70 border border-white/10 backdrop-blur-md"
                                    onClick={goPrev}
                                    title="Anterior"
                                >
                                    <ChevronLeft className="w-6 h-6" />
                                </Button>
                                <Button
                                    variant="secondary"
                                    size="icon"
                                    className="absolute right-4 z-50 rounded-full bg-black/50 text-white hover:bg-black/70 border border-white/10 backdrop-blur-md"
                                    onClick={goNext}
                                    title="Próxima"
                                >
                                    <ChevronRight className="w-6 h-6" />
                                </Button>
                            </>
                        )}

                        {/* Main Image */}
                        <AnimatePresence mode="wait">
                            <motion.img
                                key={currentIndex}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                                src={getFullSrc(currentImage.src)}
                                alt={currentImage.alt || `Imagem ${currentIndex + 1}`}
                                className="max-w-[85vw] max-h-[80vh] object-contain rounded-md shadow-2xl"
                            />
                        </AnimatePresence>

                        {/* Controls Bar */}
                        <div className="absolute top-4 right-4 flex items-center gap-2 z-50">
                            <Button
                                variant="secondary"
                                size="icon"
                                className="rounded-full bg-black/50 text-white hover:bg-black/70 border border-white/10 backdrop-blur-md"
                                onClick={(e) => handleDownload(e, currentImage.src)}
                                title="Baixar imagem"
                            >
                                <Download className="w-5 h-5" />
                            </Button>

                            <DialogClose asChild>
                                <Button
                                    variant="secondary"
                                    size="icon"
                                    className="rounded-full bg-black/50 text-white hover:bg-black/70 border border-white/10 backdrop-blur-md"
                                    title="Fechar"
                                >
                                    <X className="w-5 h-5" />
                                </Button>
                            </DialogClose>
                        </div>

                        {/* Image Counter */}
                        {images.length > 1 && (
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 px-4 py-2 rounded-full backdrop-blur-md border border-white/10">
                                <p className="text-sm text-white/90">
                                    {currentIndex + 1} / {images.length}
                                </p>
                            </div>
                        )}

                        {/* Thumbnail Strip */}
                        {images.length > 1 && (
                            <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex gap-2 bg-black/40 p-2 rounded-lg backdrop-blur-md border border-white/10 max-w-[80vw] overflow-x-auto">
                                {images.map((img, idx) => (
                                    <button
                                        key={`thumb-${idx}`}
                                        onClick={() => setCurrentIndex(idx)}
                                        className={cn(
                                            "w-12 h-12 rounded-md overflow-hidden border-2 transition-all flex-shrink-0",
                                            idx === currentIndex
                                                ? "border-white/80 scale-110"
                                                : "border-transparent opacity-60 hover:opacity-100"
                                        )}
                                    >
                                        <img
                                            src={getFullSrc(img.src)}
                                            alt=""
                                            className="w-full h-full object-cover"
                                        />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
