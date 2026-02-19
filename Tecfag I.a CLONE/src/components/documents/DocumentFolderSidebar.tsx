import { useState, useMemo } from "react";
import { documentsApi, type DocumentFolder } from "@/lib/api";
import { Folder, FolderPlus, MoreVertical, Trash2, Edit2, ChevronRight, ChevronDown, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DocumentFolderCreateDialog } from "./DocumentFolderCreateDialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface DocumentFolderSidebarProps {
    selectedFolderId: string | null;
    onSelectFolder: (folderId: string | null) => void;
    onFolderChange: () => void;
    folders: DocumentFolder[];
}

// Build tree structure from flat list
const buildFolderTree = (folders: DocumentFolder[]): DocumentFolder[] => {
    const rootFolders = folders.filter(f => f.parentId === null);
    return rootFolders;
};

// Get children of a folder
const getChildren = (folders: DocumentFolder[], parentId: string): DocumentFolder[] => {
    return folders.filter(f => f.parentId === parentId);
};

// Recursive component for rendering folder items
const FolderItem = ({
    folder,
    folders,
    selectedFolderId,
    onSelectFolder,
    expandedFolders,
    toggleExpand,
    openRenameDialog,
    handleDeleteFolder,
    onCreateSubfolder,
    depth = 0,
}: {
    folder: DocumentFolder;
    folders: DocumentFolder[];
    selectedFolderId: string | null;
    onSelectFolder: (id: string | null) => void;
    expandedFolders: Set<string>;
    toggleExpand: (id: string) => void;
    openRenameDialog: (folder: DocumentFolder) => void;
    handleDeleteFolder: (id: string) => void;
    onCreateSubfolder: (parentId: string) => void;
    depth?: number;
}) => {
    const children = getChildren(folders, folder.id);
    const hasChildren = children.length > 0;
    const isExpanded = expandedFolders.has(folder.id);
    const isSelected = selectedFolderId === folder.id;

    return (
        <div>
            <div
                className={cn(
                    "group relative flex items-center gap-1 px-2 py-1.5 rounded-lg text-sm transition-colors mb-0.5",
                    isSelected
                        ? "bg-primary/20 text-primary"
                        : "text-white/70 hover:bg-white/5 hover:text-white"
                )}
                style={{ paddingLeft: `${8 + depth * 16}px` }}
            >
                {/* Expand/Collapse Button */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        toggleExpand(folder.id);
                    }}
                    className={cn(
                        "w-5 h-5 flex items-center justify-center rounded hover:bg-white/10 transition-colors",
                        !hasChildren && "invisible"
                    )}
                >
                    {isExpanded ? (
                        <ChevronDown className="w-3.5 h-3.5" />
                    ) : (
                        <ChevronRight className="w-3.5 h-3.5" />
                    )}
                </button>

                {/* Folder Button */}
                <button
                    onClick={() => onSelectFolder(folder.id)}
                    className="flex items-center gap-2 flex-1 min-w-0"
                >
                    {isExpanded ? (
                        <FolderOpen className="w-4 h-4 flex-shrink-0 text-yellow-400/80" />
                    ) : (
                        <Folder className="w-4 h-4 flex-shrink-0" />
                    )}
                    <span className="flex-1 text-left truncate">{folder.name}</span>
                    <span className="text-xs text-white/40 flex-shrink-0">
                        {/* Recursive ID count */}
                        {(() => {
                            const getRecursiveCount = (fId: string): number => {
                                const directCount = folders.find(f => f.id === fId)?.documentCount || 0;
                                const childFolders = folders.filter(f => f.parentId === fId);
                                const childCounts = childFolders.reduce((sum, child) => sum + getRecursiveCount(child.id), 0);
                                return directCount + childCounts;
                            };
                            return getRecursiveCount(folder.id);
                        })()}
                    </span>
                </button>

                {/* Folder Actions */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <MoreVertical className="w-3 h-3" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        align="end"
                        className="bg-[#1a1a1a] border-white/10"
                    >
                        <DropdownMenuItem
                            onClick={() => onCreateSubfolder(folder.id)}
                            className="text-white hover:bg-white/10 cursor-pointer"
                        >
                            <FolderPlus className="w-4 h-4 mr-2" />
                            Nova Subpasta
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-white/10" />
                        <DropdownMenuItem
                            onClick={() => openRenameDialog(folder)}
                            className="text-white hover:bg-white/10 cursor-pointer"
                        >
                            <Edit2 className="w-4 h-4 mr-2" />
                            Renomear
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => handleDeleteFolder(folder.id)}
                            className="text-red-400 hover:bg-red-500/10 cursor-pointer"
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Deletar
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Children */}
            {hasChildren && isExpanded && (
                <div className="ml-0">
                    {children.map((child) => (
                        <FolderItem
                            key={child.id}
                            folder={child}
                            folders={folders}
                            selectedFolderId={selectedFolderId}
                            onSelectFolder={onSelectFolder}
                            expandedFolders={expandedFolders}
                            toggleExpand={toggleExpand}
                            openRenameDialog={openRenameDialog}
                            handleDeleteFolder={handleDeleteFolder}
                            onCreateSubfolder={onCreateSubfolder}
                            depth={depth + 1}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export const DocumentFolderSidebar = ({
    selectedFolderId,
    onSelectFolder,
    onFolderChange,
    folders,
}: DocumentFolderSidebarProps) => {
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [createParentId, setCreateParentId] = useState<string | undefined>(undefined);
    const [renameDialogOpen, setRenameDialogOpen] = useState(false);
    const [renamingFolder, setRenamingFolder] = useState<DocumentFolder | null>(null);
    const [newFolderName, setNewFolderName] = useState("");
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

    const rootFolders = useMemo(() => buildFolderTree(folders), [folders]);

    const toggleExpand = (folderId: string) => {
        setExpandedFolders((prev) => {
            const next = new Set(prev);
            if (next.has(folderId)) {
                next.delete(folderId);
            } else {
                next.add(folderId);
            }
            return next;
        });
    };

    const handleCreateFolder = async (name: string, parentId?: string) => {
        try {
            await documentsApi.createFolder(name, parentId);
            onFolderChange();
            // Auto-expand parent when creating subfolder
            if (parentId) {
                setExpandedFolders((prev) => new Set([...prev, parentId]));
            }
        } catch (error) {
            console.error("Error creating folder:", error);
        }
    };

    const handleRenameFolder = async () => {
        if (!renamingFolder || !newFolderName.trim()) return;
        try {
            await documentsApi.renameFolder(renamingFolder.id, newFolderName.trim());
            onFolderChange();
            setRenameDialogOpen(false);
            setRenamingFolder(null);
            setNewFolderName("");
        } catch (error) {
            console.error("Error renaming folder:", error);
        }
    };

    const handleDeleteFolder = async (folderId: string) => {
        const folder = folders.find(f => f.id === folderId);
        const hasSubfolders = folders.some(f => f.parentId === folderId);

        const message = hasSubfolders
            ? "Esta pasta contém subpastas. Todas serão movidas para a raiz. Continuar?"
            : "Tem certeza? Os documentos serão movidos para 'Todos'.";

        if (!confirm(message)) return;

        try {
            await documentsApi.deleteFolder(folderId);
            if (selectedFolderId === folderId) {
                onSelectFolder(null);
            }
            onFolderChange();
        } catch (error) {
            console.error("Error deleting folder:", error);
        }
    };

    const openRenameDialog = (folder: DocumentFolder) => {
        setRenamingFolder(folder);
        setNewFolderName(folder.name);
        setRenameDialogOpen(true);
    };

    const openCreateSubfolderDialog = (parentId: string) => {
        setCreateParentId(parentId);
        setCreateDialogOpen(true);
    };

    const openCreateRootFolderDialog = () => {
        setCreateParentId(undefined);
        setCreateDialogOpen(true);
    };

    // Get parent folder name for dialog
    const getParentFolderName = (parentId: string | undefined): string | undefined => {
        if (!parentId) return undefined;
        const parent = folders.find(f => f.id === parentId);
        return parent?.name;
    };

    return (
        <>
            <div className="w-56 bg-[#0d0d0d] border-r border-white/10 flex flex-col">
                {/* Header */}
                <div className="p-3 border-b border-white/5">
                    <h3 className="text-sm font-semibold text-white mb-2">Pastas</h3>
                </div>

                {/* Folder List */}
                <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
                    {/* All Documents */}
                    <button
                        onClick={() => onSelectFolder(null)}
                        className={cn(
                            "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors mb-1",
                            selectedFolderId === null
                                ? "bg-primary/20 text-primary"
                                : "text-white/70 hover:bg-white/5 hover:text-white"
                        )}
                    >
                        <Folder className="w-4 h-4" />
                        <span className="flex-1 text-left">Todos</span>
                    </button>

                    {/* Root Folders (hierarchical) */}
                    {rootFolders.map((folder) => (
                        <FolderItem
                            key={folder.id}
                            folder={folder}
                            folders={folders}
                            selectedFolderId={selectedFolderId}
                            onSelectFolder={onSelectFolder}
                            expandedFolders={expandedFolders}
                            toggleExpand={toggleExpand}
                            openRenameDialog={openRenameDialog}
                            handleDeleteFolder={handleDeleteFolder}
                            onCreateSubfolder={openCreateSubfolderDialog}
                        />
                    ))}
                </div>

                {/* Create Folder Button */}
                <div className="p-2 border-t border-white/5">
                    <Button
                        onClick={openCreateRootFolderDialog}
                        variant="ghost"
                        className="w-full justify-start gap-2 text-white/70 hover:bg-white/5 hover:text-white"
                        size="sm"
                    >
                        <FolderPlus className="w-4 h-4" />
                        Nova Pasta
                    </Button>
                </div>
            </div>

            {/* Dialogs */}
            <DocumentFolderCreateDialog
                open={createDialogOpen}
                onOpenChange={(open) => {
                    setCreateDialogOpen(open);
                    if (!open) setCreateParentId(undefined);
                }}
                onCreate={(name) => handleCreateFolder(name, createParentId)}
                parentFolderName={getParentFolderName(createParentId)}
            />

            {/* Rename Dialog */}
            <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
                <DialogContent className="bg-[#1a1a1a] border-white/10">
                    <DialogHeader>
                        <DialogTitle className="text-white">Renomear Pasta</DialogTitle>
                    </DialogHeader>
                    <Input
                        value={newFolderName}
                        onChange={(e) => setNewFolderName(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleRenameFolder()}
                        className="bg-[#252525] border-white/10 text-white"
                        autoFocus
                    />
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setRenameDialogOpen(false)}
                            className="bg-white/5 text-white hover:bg-white/10 border-white/10"
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleRenameFolder}
                            className="bg-primary hover:bg-primary/90"
                            disabled={!newFolderName.trim()}
                        >
                            Renomear
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};
