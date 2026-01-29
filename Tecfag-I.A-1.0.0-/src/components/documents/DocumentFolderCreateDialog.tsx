import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FolderTree } from "lucide-react";

interface DocumentFolderCreateDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCreate: (name: string) => void;
    parentFolderName?: string;
}

export const DocumentFolderCreateDialog = ({
    open,
    onOpenChange,
    onCreate,
    parentFolderName,
}: DocumentFolderCreateDialogProps) => {
    const [name, setName] = useState("");

    // Reset name when dialog opens/closes
    useEffect(() => {
        if (!open) {
            setName("");
        }
    }, [open]);

    const handleCreate = () => {
        if (name.trim()) {
            onCreate(name.trim());
            setName("");
            onOpenChange(false);
        }
    };

    const isSubfolder = !!parentFolderName;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-[#1a1a1a] border-white/10">
                <DialogHeader>
                    <DialogTitle className="text-white">
                        {isSubfolder ? "Nova Subpasta" : "Nova Pasta"}
                    </DialogTitle>
                    <DialogDescription className="text-white/60">
                        {isSubfolder
                            ? `Criar subpasta dentro de "${parentFolderName}"`
                            : "Crie uma nova pasta para organizar seus documentos."
                        }
                    </DialogDescription>
                </DialogHeader>

                {/* Parent folder indicator */}
                {isSubfolder && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10">
                        <FolderTree className="w-4 h-4 text-primary" />
                        <span className="text-sm text-white/70">
                            Pasta pai: <span className="text-white font-medium">{parentFolderName}</span>
                        </span>
                    </div>
                )}

                <div className="grid gap-4 py-2">
                    <div className="grid gap-2">
                        <Label htmlFor="name" className="text-white">
                            Nome da {isSubfolder ? "Subpasta" : "Pasta"}
                        </Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                            placeholder={isSubfolder ? "Ex: Subfolder..." : "Ex: Catálogos, Manuais..."}
                            className="bg-[#252525] border-white/10 text-white"
                            autoFocus
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => {
                            setName("");
                            onOpenChange(false);
                        }}
                        className="bg-white/5 text-white hover:bg-white/10 border-white/10"
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleCreate}
                        className="bg-primary hover:bg-primary/90"
                        disabled={!name.trim()}
                    >
                        {isSubfolder ? "Criar Subpasta" : "Criar Pasta"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
