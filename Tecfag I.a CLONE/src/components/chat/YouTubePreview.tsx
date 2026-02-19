import { useState, useId } from "react";
import { Play, X, ExternalLink } from "lucide-react";
import { Dialog, DialogContent, DialogClose, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface YouTubeVideoData {
    videoId: string;
    url: string;
}

interface YouTubePreviewProps {
    videos: YouTubeVideoData[];
    className?: string;
}

/**
 * Componente para exibir preview de vídeos do YouTube
 * Exibe thumbnails com botão de play que abre modal com player inline
 */
export function YouTubePreview({ videos, className }: YouTubePreviewProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const descriptionId = useId();

    if (!videos || videos.length === 0) return null;

    const getThumbnailUrl = (videoId: string) => {
        return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
    };

    const openVideo = (index: number) => {
        setCurrentVideoIndex(index);
        setIsOpen(true);
    };

    const currentVideo = videos[currentVideoIndex];

    return (
        <>
            {/* YouTube Thumbnails Container */}
            <div
                className={cn(
                    "flex flex-wrap gap-2 my-3 p-2 rounded-xl bg-black/20 border border-white/5",
                    className
                )}
            >
                {videos.map((video, index) => (
                    <button
                        key={`${video.videoId}-${index}`}
                        onClick={() => openVideo(index)}
                        className={cn(
                            "relative group cursor-pointer overflow-hidden rounded-lg border border-white/10 shadow-lg transition-all duration-300 hover:border-red-500/50 hover:shadow-xl flex-shrink-0",
                            "w-[160px] h-[90px] sm:w-[200px] sm:h-[112px]"
                        )}
                        onMouseEnter={() => setHoveredIndex(index)}
                        onMouseLeave={() => setHoveredIndex(null)}
                    >
                        <img
                            src={getThumbnailUrl(video.videoId)}
                            alt={`Vídeo do YouTube: ${video.videoId}`}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            loading="lazy"
                        />

                        {/* Play button overlay */}
                        <span
                            className={cn(
                                "absolute inset-0 flex items-center justify-center transition-all duration-300",
                                hoveredIndex === index ? "bg-black/40" : "bg-black/20"
                            )}
                        >
                            <span
                                className={cn(
                                    "w-12 h-12 rounded-full bg-red-600 flex items-center justify-center shadow-lg transition-transform duration-300",
                                    hoveredIndex === index ? "scale-110" : "scale-100"
                                )}
                            >
                                <Play className="w-6 h-6 text-white fill-white ml-0.5" />
                            </span>
                        </span>

                        {/* YouTube badge */}
                        <span className="absolute bottom-1 right-1 bg-red-600 text-white text-[10px] px-1.5 py-0.5 rounded font-medium">
                            YouTube
                        </span>

                        {/* Video counter badge */}
                        {videos.length > 1 && index === 0 && (
                            <span className="absolute top-1 right-1 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded-full border border-white/20">
                                {videos.length}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Fullscreen Video Player Dialog */}
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent
                    className="max-w-[95vw] max-h-[95vh] w-[90vw] p-0 border border-white/10 bg-zinc-900/95 shadow-2xl overflow-hidden flex flex-col focus:outline-none ring-0 outline-none"
                    aria-describedby={descriptionId}
                >
                    <DialogTitle className="sr-only">Player do YouTube</DialogTitle>
                    <DialogDescription id={descriptionId} className="sr-only">
                        Reproduzindo vídeo do YouTube
                    </DialogDescription>

                    {/* Header Bar */}
                    <div className="flex items-center justify-between px-4 py-3 bg-zinc-800/80 border-b border-white/10">
                        <div className="flex items-center gap-2">
                            <span className="bg-red-600 text-white text-xs px-2 py-0.5 rounded font-medium">
                                YouTube
                            </span>
                            <span className="text-sm text-white/70">
                                {videos.length > 1 && `Vídeo ${currentVideoIndex + 1} de ${videos.length}`}
                            </span>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                variant="secondary"
                                size="sm"
                                className="rounded-md bg-zinc-700 text-white hover:bg-zinc-600 border border-white/10"
                                onClick={() => window.open(currentVideo.url, "_blank")}
                                title="Abrir no YouTube"
                            >
                                <ExternalLink className="w-4 h-4 mr-1" />
                                Abrir no YouTube
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

                    {/* YouTube Player */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex-1 flex items-center justify-center bg-black p-4"
                    >
                        <div className="w-full max-w-4xl aspect-video">
                            <iframe
                                src={`https://www.youtube.com/embed/${currentVideo.videoId}?autoplay=1&rel=0`}
                                title="YouTube video player"
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                className="w-full h-full rounded-lg shadow-2xl"
                            />
                        </div>
                    </motion.div>

                    {/* Video Navigation (if multiple) */}
                    {videos.length > 1 && (
                        <div className="flex items-center justify-center gap-2 px-4 py-3 bg-zinc-800/80 border-t border-white/10 overflow-x-auto">
                            {videos.map((video, idx) => (
                                <button
                                    key={`thumb-${video.videoId}`}
                                    onClick={() => setCurrentVideoIndex(idx)}
                                    className={cn(
                                        "w-20 h-12 rounded-md overflow-hidden border-2 transition-all flex-shrink-0",
                                        idx === currentVideoIndex
                                            ? "border-red-500 scale-105"
                                            : "border-transparent opacity-60 hover:opacity-100"
                                    )}
                                >
                                    <img
                                        src={getThumbnailUrl(video.videoId)}
                                        alt=""
                                        className="w-full h-full object-cover"
                                    />
                                </button>
                            ))}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
