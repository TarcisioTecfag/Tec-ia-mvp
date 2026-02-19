import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Folder, FolderOpen, ChevronRight, ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { DocumentFolder } from "@/lib/api";

interface MoveDocumentDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onMove: (targetFolderId: string | null) => Promise<void>;
    folders: DocumentFolder[];
    currentFolderId?: string | null;
}

interface FolderNode extends DocumentFolder {
    children: FolderNode[];
    level: number;
}

export const MoveDocumentDialog = ({
    open,
    onOpenChange,
    onMove,
    folders,
    currentFolderId,
}: MoveDocumentDialogProps) => {
    const [selectedId, setSelectedId] = useState<string | null | undefined>(undefined);
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
    const [isMoving, setIsMoving] = useState(false);

    // Reset state when dialog opens
    useEffect(() => {
        if (open) {
            setSelectedId(undefined); // Start with nothing selected
            setIsMoving(false);
        }
    }, [open]);

    // Build folder tree
    const folderTree = useMemo(() => {
        const buildTree = (parentId: string | null, level: number): FolderNode[] => {
            return folders
                .filter(f => f.parentId === parentId)
                .map(f => ({
                    ...f,
                    level,
                    children: buildTree(f.id, level + 1)
                }))
                .sort((a, b) => a.order - b.order);
        };
        return buildTree(null, 0);
    }, [folders]);

    const toggleExpand = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setExpandedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const handleMove = async () => {
        if (selectedId === undefined) return;
        setIsMoving(true);
        try {
            await onMove(selectedId);
            onOpenChange(false);
        } catch (error) {
            console.error("Error moving document:", error);
        } finally {
            setIsMoving(false);
        }
    };

    const renderFolderNode = (folder: FolderNode) => {
        const isExpanded = expandedIds.has(folder.id);
        const isSelected = selectedId === folder.id;
        const hasChildren = folder.children.length > 0;
        const isCurrent = folder.id === currentFolderId;

        return (
            <div key={folder.id}>
                <div
                    onClick={() => !isCurrent && setSelectedId(folder.id)}
                    className={cn(
                        "flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors select-none mb-1",
                        isSelected ? "bg-primary/20 text-primary border border-primary/30" : "hover:bg-white/5 text-gray-300 border border-transparent",
                        isCurrent && "opacity-50 cursor-not-allowed bg-white/5"
                    )}
                    style={{ marginLeft: `${folder.level * 1.5}rem` }}
                >
                    <button
                        onClick={(e) => hasChildren && toggleExpand(folder.id, e)}
                        className={cn(
                            "p-0.5 rounded-sm hover:bg-white/10 transition-colors",
                            !hasChildren && "invisible"
                        )}
                    >
                        {isExpanded ? (
                            <ChevronDown className="w-3 h-3 text-muted-foreground" />
                        ) : (
                            <ChevronRight className="w-3 h-3 text-muted-foreground" />
                        )}
                    </button>

                    {isExpanded ? (
                        <FolderOpen className={cn("w-4 h-4", isSelected ? "text-primary" : "text-yellow-500")} />
                    ) : (
                        <Folder className={cn("w-4 h-4", isSelected ? "text-primary" : "text-yellow-500")} />
                    )}

                    <span className="text-sm truncate flex-1">{folder.name}</span>

                    {isSelected && <Check className="w-4 h-4 text-primary" />}
                </div>

                {isExpanded && folder.children.map(renderFolderNode)}
            </div>
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-[#1a1a1a] border-white/10 sm:max-w-lg max-h-[70vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="text-white">Mover Documento</DialogTitle>
                    <DialogDescription className="text-white/60">
                        Selecione a pasta de destino para o documento.
                    </DialogDescription>
                </DialogHeader>

                <div className="border border-white/10 rounded-md bg-[#252525] overflow-hidden">
                    <ScrollArea className="h-[240px]">
                        <div className="p-2">
                            <div
                                onClick={() => currentFolderId !== null && setSelectedId(null)}
                                className={cn(
                                    "flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors select-none mb-1",
                                    selectedId === null ? "bg-primary/20 text-primary border border-primary/30" : "hover:bg-white/5 text-gray-300 border border-transparent",
                                    currentFolderId === null && "opacity-50 cursor-not-allowed bg-white/5"
                                )}
                            >
                                <div className="w-4 flex justify-center">
                                    <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
                                </div>
                                <Folder className={cn("w-4 h-4", selectedId === null ? "text-primary" : "text-blue-400")} />
                                <span className="text-sm flex-1">Raiz (Sem pasta)</span>
                                {selectedId === null && <Check className="w-4 h-4 text-primary" />}
                            </div>

                            {/* Folder Tree */}
                            {folderTree.map(renderFolderNode)}
                        </div>
                    </ScrollArea>
                </div>

                <DialogFooter>
                    <Button
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                        className="text-white hover:bg-white/10"
                        disabled={isMoving}
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleMove}
                        className="bg-primary hover:bg-primary/90"
                        disabled={selectedId === undefined || isMoving}
                    >
                        {isMoving ? "Movendo..." : "Mover Aqui"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
