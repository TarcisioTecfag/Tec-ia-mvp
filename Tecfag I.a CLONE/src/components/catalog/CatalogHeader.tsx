import { Button } from "@/components/ui/button";
import { Plus, Tag as TagIcon } from "lucide-react";
import { Dialog, DialogTrigger, DialogContent } from "@/components/ui/dialog";
import { ManageTagsDialog } from "./ManageTagsDialog";

interface CatalogHeaderProps {
    isAdmin: boolean;
    totalMachines: number;
    filteredCount: number;
    onAddMachine: () => void;
    isTagsDialogOpen: boolean;
    setIsTagsDialogOpen: (open: boolean) => void;
    globalTags: string[];
    setGlobalTags: (tags: string[]) => void;
}

export const CatalogHeader = ({
    isAdmin,
    totalMachines,
    filteredCount,
    onAddMachine,
    isTagsDialogOpen,
    setIsTagsDialogOpen,
    globalTags,
    setGlobalTags,
}: CatalogHeaderProps) => {
    return (
        <div className="flex items-center justify-between">
            <div>
                <h2 className="text-2xl font-bold">Catálogo de Máquinas</h2>
                <p className="text-sm text-muted-foreground">
                    {filteredCount} de {totalMachines} equipamentos
                </p>
            </div>

            {/* Admin Actions */}
            {isAdmin && (
                <div className="flex gap-2">
                    <Button
                        onClick={onAddMachine}
                        variant="outline"
                        className="gap-2 border-primary/20 hover:bg-primary/10 text-primary hover:text-primary hover:border-primary/50 transition-all"
                    >
                        <Plus className="w-4 h-4" />
                        Adicionar Máquina
                    </Button>

                    <Dialog open={isTagsDialogOpen} onOpenChange={setIsTagsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="gap-2">
                                <TagIcon className="w-4 h-4" />
                                Gerenciar Tags
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <ManageTagsDialog
                                globalTags={globalTags}
                                setGlobalTags={setGlobalTags}
                            />
                        </DialogContent>
                    </Dialog>
                </div>
            )}
        </div>
    );
};
