import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog"; // Assuming these are exported from dialog component or separate
import { Plus, X } from "lucide-react";

interface ManageTagsDialogProps {
    globalTags: string[];
    setGlobalTags: (tags: string[]) => void;
}

export const ManageTagsDialog = ({ globalTags, setGlobalTags }: ManageTagsDialogProps) => {
    const [newTagInput, setNewTagInput] = useState("");

    const addGlobalTag = () => {
        if (newTagInput && !globalTags.includes(newTagInput)) {
            setGlobalTags([...globalTags, newTagInput]);
            setNewTagInput("");
        }
    };

    const removeGlobalTag = (tag: string) => {
        setGlobalTags(globalTags.filter(t => t !== tag));
    };

    return (
        <>
            <DialogHeader>
                <DialogTitle>Gerenciar Tags do Sistema</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
                <div className="flex gap-2">
                    <Input
                        placeholder="Nova tag..."
                        value={newTagInput}
                        onChange={e => setNewTagInput(e.target.value)}
                    />
                    <Button onClick={addGlobalTag} size="icon">
                        <Plus className="w-4 h-4" />
                    </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                    {globalTags.map(tag => (
                        <Badge key={tag} variant="secondary" className="gap-1 pr-1">
                            {tag}
                            <div
                                className="cursor-pointer hover:text-red-500"
                                onClick={() => removeGlobalTag(tag)}
                            >
                                <X className="w-3 h-3" />
                            </div>
                        </Badge>
                    ))}
                </div>
            </div>
        </>
    );
};
