import { useState, useId } from "react";
import { Maximize2, X, Download, ExternalLink } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger, DialogClose, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface ChatImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    src?: string;
    alt?: string;
    className?: string;
}

export function ChatImage({ src, alt, className, ...props }: ChatImageProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const descriptionId = useId();

    if (!src) return null;

    // Ensure we have the full URL if it's a relative path starting with /uploads or just a filename
    const getFullSrc = (imageSrc: string) => {
        if (imageSrc.startsWith('http')) return imageSrc;
        if (imageSrc.startsWith('/uploads')) {
            // Check if we are in dev mode and need to prepend base URL or if proxy handles it
            // With vite proxy, /uploads should work directly
            return imageSrc;
        }
        // If it looks like a filename, assume it's in uploads
        if (!imageSrc.includes('/')) {
            return `/uploads/${imageSrc}`;
        }
        return imageSrc;
    };

    const finalSrc = getFullSrc(src);

    // Function to handle download
    const handleDownload = async (e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            const response = await fetch(finalSrc);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            // Extract filename from URL or use default
            const filename = finalSrc.split("/").pop() || "downloaded-image";
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Error downloading image:", error);
            // Fallback: open in new tab
            window.open(finalSrc, "_blank");
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <span
                    className={cn(
                        "relative group cursor-zoom-in inline-block overflow-hidden rounded-lg border border-white/10 shadow-lg bg-black/30 transition-all duration-300 hover:border-white/30 hover:shadow-xl flex-shrink-0",
                        "w-[120px] h-[120px]",
                        className
                    )}
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                >
                    <img
                        src={finalSrc}
                        alt={alt || "Imagem do chat"}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        loading="lazy"
                        {...props}
                    />

                    {/* Overlay on hover */}
                    <span className={cn(
                        "absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 transition-opacity duration-300",
                        isHovered ? "opacity-100" : ""
                    )}>
                        <span className="bg-black/70 p-2 rounded-full border border-white/20 backdrop-blur-sm">
                            <Maximize2 className="w-4 h-4 text-white" />
                        </span>
                    </span>
                </span>
            </DialogTrigger>

            <DialogContent className="max-w-[95vw] max-h-[95vh] w-auto h-auto p-0 border-none bg-transparent shadow-none overflow-hidden flex items-center justify-center focus:outline-none ring-0 outline-none" aria-describedby={descriptionId}>
                <DialogTitle className="sr-only">Visualização da Imagem</DialogTitle>
                <DialogDescription id={descriptionId} className="sr-only">
                    Visualização expandida da imagem {alt || "do chat"}
                </DialogDescription>
                <div className="relative w-full h-full flex items-center justify-center group/modal">
                    {/* Background backdrop blur handled by DialogOverlay in UI component usually, 
              but we can add an extra layer if needed. Assuming Dialog defaults used. */}

                    <motion.img
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        src={finalSrc}
                        alt={alt}
                        className="max-w-[90vw] max-h-[85vh] object-contain rounded-md shadow-2xl"
                    />

                    {/* Controls Bar */}
                    <div className="absolute top-4 right-4 flex items-center gap-2 z-50">
                        <Button
                            variant="secondary"
                            size="icon"
                            className="rounded-full bg-black/50 text-white hover:bg-black/70 border border-white/10 backdrop-blur-md"
                            onClick={handleDownload}
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

                    {/* Caption / Alt text if available */}
                    {alt && (
                        <div className="absolute bottom-4 left-0 right-0 flex justify-center pointer-events-none">
                            <div className="bg-black/60 px-4 py-2 rounded-full backdrop-blur-md border border-white/10 max-w-[80%] text-center">
                                <p className="text-sm text-white/90 truncate">{alt}</p>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
