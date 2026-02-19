import { Wrench, Plus, Trash2, Image as ImageIcon, Upload, X, Box, Youtube } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Machine, STOCK_OPTIONS } from "@/types/catalog";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface MachineDetailsProps {
    machine: Machine;
    isEditing: boolean;
    editData: Partial<Machine>;
    setEditData: React.Dispatch<React.SetStateAction<Partial<Machine>>>;
    onImageUpload: (e: React.ChangeEvent<HTMLInputElement>, index: number) => void;
}

export const MachineDetails = ({
    machine,
    isEditing,
    editData,
    setEditData,
    onImageUpload,
}: MachineDetailsProps) => {
    const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
    const [isVideoPlaying, setIsVideoPlaying] = useState(false);

    // Helper for specs
    const updateSpec = (index: number, field: 'label' | 'value', value: string) => {
        const newSpecs = [...(editData.specifications || [])];
        newSpecs[index] = { ...newSpecs[index], [field]: value };
        setEditData(prev => ({ ...prev, specifications: newSpecs }));
    };

    const removeSpec = (index: number) => {
        const newSpecs = [...(editData.specifications || [])];
        newSpecs.splice(index, 1);
        setEditData(prev => ({ ...prev, specifications: newSpecs }));
    };

    const addSpec = () => {
        setEditData(prev => ({ ...prev, specifications: [...(prev.specifications || []), { label: "", value: "" }] }));
    };

    // Helper for images
    const clearImage = (index: number) => {
        const newImages = [...(editData.images || [])];
        newImages[index] = "";
        setEditData(prev => ({ ...prev, images: newImages }));
    };

    // Helper for video
    const getVideoId = (url: string) => {
        try {
            if (!url) return null;
            let videoId = null;
            if (url.includes('youtube.com/watch?v=')) {
                videoId = url.split('v=')[1];
            } else if (url.includes('youtu.be/')) {
                videoId = url.split('youtu.be/')[1];
            }
            if (videoId) {
                const ampersandPosition = videoId.indexOf('&');
                if (ampersandPosition !== -1) {
                    videoId = videoId.substring(0, ampersandPosition);
                }
                return videoId;
            }
            return null;
        } catch (e) {
            return null;
        }
    };

    const getEmbedUrl = (url: string) => {
        const videoId = getVideoId(url);
        return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1&modestbranding=1&rel=0&iv_load_policy=3&controls=1` : null;
    };

    return (
        <div className="overflow-hidden">
            <div className="px-4 pb-4 text-left">
                <div className="grid md:grid-cols-2 gap-6 pt-4">

                    {/* LEFT: SPECS */}
                    <div>
                        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                            <Wrench className="w-4 h-4 text-primary" />
                            Especificações Técnicas
                        </h4>
                        <div className="space-y-2">
                            {isEditing ? (
                                <div className="flex flex-col gap-2">
                                    {editData.specifications?.map((spec, i) => (
                                        <div key={i} className="flex gap-2">
                                            <Input
                                                value={spec.label}
                                                onChange={(e) => updateSpec(i, 'label', e.target.value)}
                                                className="h-7 text-xs flex-1"
                                                placeholder="Nome"
                                            />
                                            <Input
                                                value={spec.value}
                                                onChange={(e) => updateSpec(i, 'value', e.target.value)}
                                                className="h-7 text-xs flex-1"
                                                placeholder="Valor"
                                            />
                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => removeSpec(i)}>
                                                <Trash2 className="w-3 h-3" />
                                            </Button>
                                        </div>
                                    ))}
                                    <Button variant="outline" size="sm" className="h-7 text-xs border-dashed" onClick={addSpec}>
                                        <Plus className="w-3 h-3 mr-1" /> Add Spec
                                    </Button>
                                </div>
                            ) : (
                                <ul className="space-y-2">
                                    {machine.specifications.map((spec, i) => (
                                        <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                                            <span className="font-semibold text-foreground/80">{spec.label}:</span> {spec.value}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>

                    {/* RIGHT: IMAGES, STOCK, VIDEO */}
                    <div className="space-y-6">

                        {/* IMAGES */}
                        <div>
                            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                <ImageIcon className="w-4 h-4 text-primary" />
                                Galeria
                            </h4>
                            <div className="grid grid-cols-3 gap-2 mb-4">
                                {(() => {
                                    const currentImages = isEditing ? (editData.images || []) : (machine.images || []);
                                    let displayImages = [...currentImages];

                                    if (isEditing) {
                                        while (displayImages.length < 3) {
                                            displayImages.push("");
                                        }
                                        displayImages = displayImages.slice(0, 3);
                                    } else if (displayImages.length === 0) {
                                        displayImages = [];
                                    }

                                    return displayImages.map((img, i) => (
                                        <div key={i}
                                            className={cn(
                                                "aspect-square bg-secondary/30 rounded-md overflow-hidden relative group border border-border/50",
                                                img && !isEditing && "cursor-zoom-in"
                                            )}
                                            onClick={() => img && !isEditing && setFullscreenImage(img)}
                                        >
                                            {img ? (
                                                <img src={img} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
                                                    <ImageIcon className="w-6 h-6" />
                                                </div>
                                            )}

                                            {/* Upload Overlay */}
                                            {isEditing && (
                                                <div
                                                    className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-2 cursor-pointer"
                                                    onClick={() => document.getElementById(`file-upload-${machine.id}-${i}`)?.click()}
                                                >
                                                    <Upload className="w-6 h-6 text-white mb-1" />
                                                    <span className="text-[10px] text-white">Upload</span>
                                                    <input
                                                        id={`file-upload-${machine.id}-${i}`}
                                                        type="file"
                                                        accept="image/*"
                                                        className="hidden"
                                                        onChange={(e) => onImageUpload(e, i)}
                                                    />
                                                </div>
                                            )}

                                            {/* Clear Button */}
                                            {isEditing && img && (
                                                <Button
                                                    variant="destructive" size="icon" className="absolute top-1 right-1 h-5 w-5 opacity-0 group-hover:opacity-100"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        clearImage(i);
                                                    }}
                                                >
                                                    <X className="w-3 h-3" />
                                                </Button>
                                            )}
                                        </div>
                                    ))
                                })()}
                            </div>
                        </div>

                        {/* STOCK & VIDEO */}
                        <div className="grid grid-cols-2 gap-4">
                            {/* Stock */}
                            <div>
                                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                    <Box className="w-4 h-4 text-primary" />
                                    Estoque
                                </h4>
                                <div className="space-y-3 p-3 glass-card rounded-md bg-secondary/10">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-xs text-muted-foreground">Disponibilidade:</span>
                                        {isEditing ? (
                                            <Select
                                                value={editData.stockStatus || machine.stockStatus}
                                                onValueChange={(val: any) => setEditData(prev => ({ ...prev, stockStatus: val }))}
                                            >
                                                <SelectTrigger className="h-8">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="in_stock">Em Estoque</SelectItem>
                                                    <SelectItem value="out_of_stock">Em Falta</SelectItem>
                                                    <SelectItem value="future_stock">Estoque Futuro</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        ) : (
                                            <span className={cn(
                                                "px-2 py-0.5 rounded-full border text-xs inline-block text-center",
                                                STOCK_OPTIONS[machine.stockStatus || "in_stock"].color
                                            )}>
                                                {STOCK_OPTIONS[machine.stockStatus || "in_stock"].label}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Video */}
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <Youtube className="w-4 h-4 text-red-500" />
                                    <span className="text-sm font-medium">Vídeo</span>
                                </div>
                                {isEditing && (
                                    <Input
                                        value={editData.youtubeUrl || ""}
                                        onChange={(e) => setEditData(prev => ({ ...prev, youtubeUrl: e.target.value }))}
                                        placeholder="Link YouTube..."
                                        className="text-xs mb-2"
                                    />
                                )}
                                <div className="flex-1 min-h-[150px] bg-black/40 rounded-md overflow-hidden border border-border/50 relative">
                                    {((isEditing && editData.youtubeUrl) || (!isEditing && machine.youtubeUrl)) ? (
                                        (() => {
                                            const url = isEditing ? (editData.youtubeUrl || "") : machine.youtubeUrl;
                                            const videoId = getVideoId(url);

                                            if (!videoId) return <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-xs p-2">Invalid Link</div>;

                                            if (isVideoPlaying && !isEditing) {
                                                return (
                                                    <iframe
                                                        className="absolute inset-0 w-full h-full"
                                                        src={getEmbedUrl(url) || ""}
                                                        title="YouTube"
                                                        frameBorder="0"
                                                        allowFullScreen
                                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                    ></iframe>
                                                );
                                            }

                                            return (
                                                <div className="absolute inset-0 group cursor-pointer" onClick={() => !isEditing && setIsVideoPlaying(true)}>
                                                    <img
                                                        src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
                                                        alt="Video Thumbnail"
                                                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                                                    />
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                                                            <svg className="w-3 h-3 text-white fill-current ml-0.5" viewBox="0 0 24 24">
                                                                <path d="M8 5v14l11-7z" />
                                                            </svg>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })()
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/30">
                                            <Youtube className="w-8 h-8 opacity-50" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Fullscreen Image Dialog */}
            <Dialog open={!!fullscreenImage} onOpenChange={() => setFullscreenImage(null)}>
                <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden bg-black/90 border-none">
                    <div className="relative w-full h-full flex items-center justify-center p-4">
                        {fullscreenImage && (
                            <img src={fullscreenImage} alt="Fullscreen" className="max-w-full max-h-[85vh] object-contain" />
                        )}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-2 right-2 text-white hover:bg-white/20 rounded-full"
                            onClick={() => setFullscreenImage(null)}
                        >
                            <X className="w-6 h-6" />
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};
